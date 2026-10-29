import { buildInitialSeedData } from '../../server/seedData.js';
import {
  AnnouncementItem,
  AssignmentItem,
  AttendanceRecord,
  BehaviorRecord,
  ClassRoom,
  DatabaseSnapshot,
  ExamItem,
  ExpenseItem,
  GradeRecord,
  InvoiceItem,
  LibraryBook,
  LibraryLoan,
  PayrollItem,
  RegisterAccountPayload,
  SchoolSettings,
  Student,
  Subject,
  Teacher,
  TeacherLeave,
  TimetableSlot,
  UserAccount,
  UserRole,
} from '../types';

const STORAGE_KEY = 'school_erp_production_v3';
const TOKEN_KEY = 'school_erp_auth_token_v3';
const USER_KEY = 'school_erp_auth_user_v3';
const OFFLINE_VAULT_KEY = 'school_erp_offline_vault_v3';

export type ConnectionMode = 'online' | 'offline';

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, val: string): void {
  try {
    localStorage.setItem(key, val);
  } catch {
    // ignore storage quota errors
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// Clean up any legacy v2 demo localStorage keys once
try {
  safeRemove('school_erp_hybrid_cache_v2');
  safeRemove('school_erp_auth_token');
  safeRemove('school_erp_auth_user');
} catch {
  // ignore
}

export function getStoredToken(): string | null {
  return safeGet(TOKEN_KEY);
}

export function getStoredUser(): UserAccount | null {
  const raw = safeGet(USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as UserAccount;
    if (
      parsed &&
      ['usr-admin', 'usr-teacher', 'usr-accountant', 'usr-student'].includes(parsed.id)
    ) {
      clearAuthSession();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveAuthSession(token: string, user: UserAccount): void {
  safeSet(TOKEN_KEY, token);
  safeSet(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession(): void {
  safeRemove(TOKEN_KEY);
  safeRemove(USER_KEY);
}

// Offline salted SHA-256 vault for static PWA deployments
type OfflineVault = Record<string, string>; // userId -> salt:sha256hex

function loadOfflineVault(): OfflineVault {
  const raw = safeGet(OFFLINE_VAULT_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as OfflineVault;
  } catch {
    return {};
  }
}

function saveOfflineVault(vault: OfflineVault): void {
  safeSet(OFFLINE_VAULT_KEY, JSON.stringify(vault));
}

async function sha256Hex(input: string): Promise<string> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const data = new TextEncoder().encode(input);
      const buf = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // fall through to deterministic JS fallback
  }
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

async function hashOfflinePassword(plain: string): Promise<string> {
  const salt = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  const digest = await sha256Hex(`${salt}:${plain}`);
  return `${salt}:${digest}`;
}

async function verifyOfflinePassword(plain: string, stored: string | undefined): Promise<boolean> {
  if (!stored || !stored.includes(':')) return false;
  const [salt, expected] = stored.split(':');
  const actual = await sha256Hex(`${salt}:${plain}`);
  return actual === expected;
}

export function loadLocalSnapshot(): DatabaseSnapshot {
  const raw = safeGet(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.students) && Array.isArray(parsed.subjects)) {
        return parsed as DatabaseSnapshot;
      }
    } catch {
      // fall through
    }
  }
  const initial = buildInitialSeedData() as DatabaseSnapshot;
  safeSet(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

export function persistLocalSnapshot(snap: DatabaseSnapshot): void {
  safeSet(STORAGE_KEY, JSON.stringify(snap));
}

interface EngineRequestError extends Error {
  isApiBusinessError?: boolean;
  isBackendUnavailable?: boolean;
  status?: number;
}

function createApiBusinessError(message: string, status: number): EngineRequestError {
  const err = new Error(message) as EngineRequestError;
  err.isApiBusinessError = true;
  err.status = status;
  return err;
}

function createBackendUnavailableError(reason: string, status?: number): EngineRequestError {
  const err = new Error(reason) as EngineRequestError;
  err.isBackendUnavailable = true;
  err.status = status;
  return err;
}

function isApiBusinessError(err: unknown): err is EngineRequestError {
  return Boolean(err && typeof err === 'object' && (err as EngineRequestError).isApiBusinessError);
}

let backendStatus: 'unknown' | 'online' | 'offline' = 'unknown';

async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
  forceProbe = false
): Promise<T> {
  if (backendStatus === 'offline' && !forceProbe) {
    throw createBackendUnavailableError('Static/Offline PWA mode active');
  }

  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    let resp: Response;
    try {
      resp = await fetch(url, { ...options, headers, signal: controller.signal });
    } catch (netErr) {
      backendStatus = 'offline';
      throw createBackendUnavailableError(
        netErr instanceof Error ? netErr.message : 'Network unreachable'
      );
    }

    const isErpApi = resp.headers.get('x-school-erp-api') === '1';
    const contentType = (resp.headers.get('content-type') || '').toLowerCase();
    const isJson = contentType.includes('application/json');

    if (!resp.ok) {
      let errBody: { error?: string; apiRouteNotFound?: boolean } | null = null;
      if (isJson) {
        try {
          errBody = await resp.json();
        } catch {
          errBody = null;
        }
      }

      // Static hosts (GitHub Pages, Vercel/Netlify static, vite preview without API)
      // return HTML/empty 404 or 405, or proxy 500/502/503/504 when no backend server is running.
      // Never surface "HTTP 404" to the user — fall back seamlessly to Offline PWA storage!
      if (
        errBody?.apiRouteNotFound ||
        !isJson ||
        !errBody?.error ||
        (!isErpApi && (resp.status === 404 || resp.status === 405 || resp.status >= 500))
      ) {
        backendStatus = 'offline';
        throw createBackendUnavailableError(`Backend unavailable (HTTP ${resp.status})`, resp.status);
      }

      backendStatus = 'online';
      throw createApiBusinessError(errBody.error, resp.status);
    }

    if (!isJson) {
      // Static SPA host returned index.html with 200 OK
      backendStatus = 'offline';
      throw createBackendUnavailableError('Static HTML fallback detected');
    }

    let parsed: T;
    try {
      parsed = (await resp.json()) as T;
    } catch {
      backendStatus = 'offline';
      throw createBackendUnavailableError('Invalid JSON response');
    }

    backendStatus = 'online';
    return parsed;
  } finally {
    clearTimeout(timer);
  }
}

const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();

const ROLE_DEFAULTS: Record<UserRole, { kh: string; en: string; color: string }> = {
  admin: { kh: 'នាយកសាលា / អ្នកគ្រប់គ្រងប្រព័ន្ធ', en: 'Principal / System Administrator', color: '#2563eb' },
  teacher: { kh: 'គ្រូបង្រៀន', en: 'Faculty Teacher', color: '#059669' },
  accountant: { kh: 'គណនេយ្យករ និងហិរញ្ញវត្ថុ', en: 'Accountant & Finance Officer', color: '#d97706' },
  student: { kh: 'សិស្ស និងអាណាព្យាបាល', en: 'Student & Parent', color: '#7c3aed' },
};

function createOfflineLinkedProfile(draft: DatabaseSnapshot, b: Partial<RegisterAccountPayload>, role: UserRole): string {
  const linked = String(b.linkedId || '').trim();
  const nameKh = String(b.nameKh || b.nameEn || '').trim();
  const nameEn = String(b.nameEn || b.nameKh || '').trim();
  const phone = String(b.phone || '').trim();
  const email = String(b.email || '').trim();
  const today = new Date().toISOString().slice(0, 10);

  if (role === 'student') {
    if (linked) {
      const found = draft.students.find(
        (s) => s.id === linked || s.studentCode.toLowerCase() === linked.toLowerCase()
      );
      if (found) return found.id;
    }
    if (b.autoCreateProfile !== false) {
      const newId = uid('STU');
      const nextNum = String(draft.students.length + 1).padStart(3, '0');
      draft.students.push({
        id: newId,
        studentCode: b.studentCode || `STU-2026-${nextNum}`,
        moeysId: '',
        nameKh,
        nameEn,
        gender: b.gender || 'M',
        dob: b.dob || '',
        pob: '',
        classId: b.classId || '',
        enrollmentDate: today,
        guardianName: b.guardianName || '',
        guardianRelation: '',
        guardianPhone: b.guardianPhone || phone,
        guardianOccupation: '',
        phone,
        email,
        address: '',
        scholarshipPct: 0,
        transportOpt: 'Self Drop-off',
        status: 'active',
        medicalNotes: '',
        notes: '',
        photo: null,
      });
      return newId;
    }
  } else {
    if (linked) {
      const found = draft.teachers.find(
        (t) => t.id === linked || t.teacherCode.toLowerCase() === linked.toLowerCase()
      );
      if (found) return found.id;
    }
    if (b.autoCreateProfile !== false) {
      const newId = uid('TCH');
      const nextNum = String(draft.teachers.length + 1).padStart(3, '0');
      const def = ROLE_DEFAULTS[role];
      draft.teachers.push({
        id: newId,
        teacherCode: b.teacherCode || `EMP-2026-${nextNum}`,
        nameKh,
        nameEn,
        gender: b.gender || 'M',
        dob: b.dob || '',
        phone,
        email,
        address: '',
        roleTitleKh: b.titleKh || def.kh,
        roleTitleEn: b.titleEn || def.en,
        department: role === 'admin' ? 'Administration' : role === 'accountant' ? 'Finance & Accounting' : 'Academic',
        qualification: '',
        specialization: b.specialization || '',
        hireDate: today,
        baseSalary: 0,
        status: 'active',
      });
      return newId;
    }
  }
  return linked;
}

export const dataEngine = {
  async bootstrap(): Promise<{
    snapshot: DatabaseSnapshot;
    mode: ConnectionMode;
    validatedUser: UserAccount | null;
  }> {
    try {
      const snapshot = await apiRequest<DatabaseSnapshot>('./api/bootstrap', {}, true);
      if (!snapshot || !Array.isArray(snapshot.subjects)) {
        throw createBackendUnavailableError('Invalid bootstrap payload');
      }
      persistLocalSnapshot(snapshot);
      let validatedUser: UserAccount | null = getStoredUser();
      if (getStoredToken()) {
        try {
          const meRes = await apiRequest<{ user: UserAccount }>('./api/auth/me', {}, true);
          validatedUser = meRes.user;
          saveAuthSession(getStoredToken()!, meRes.user);
        } catch (meErr) {
          if (isApiBusinessError(meErr)) {
            clearAuthSession();
            validatedUser = null;
          }
        }
      } else {
        validatedUser = null;
      }
      return { snapshot, mode: 'online', validatedUser };
    } catch {
      backendStatus = 'offline';
      const snapshot = loadLocalSnapshot();
      const stored = getStoredUser();
      const existsOffline = stored
        ? snapshot.users.some((u) => u.id === stored.id && u.status !== 'suspended')
        : false;
      if (!existsOffline && stored) {
        clearAuthSession();
      }
      return { snapshot, mode: 'offline', validatedUser: existsOffline ? stored : null };
    }
  },

  async login(params: { username: string; password: string }): Promise<{
    user: UserAccount;
    token: string;
    snapshot: DatabaseSnapshot;
    mode: ConnectionMode;
  }> {
    try {
      const res = await apiRequest<{ token: string; user: UserAccount; snapshot: DatabaseSnapshot }>(
        './api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify(params),
        }
      );
      saveAuthSession(res.token, res.user);
      persistLocalSnapshot(res.snapshot);
      return { ...res, mode: 'online' };
    } catch (err: unknown) {
      if (isApiBusinessError(err)) {
        throw new Error(err.message || 'ឈ្មោះគណនី ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ / Invalid credentials');
      }
      // Offline / Static Hosting PWA login against locally registered real accounts
      const snap = structuredClone(loadLocalSnapshot());
      const vault = loadOfflineVault();
      const ident = params.username.trim().toLowerCase();
      const phoneClean = params.username.replace(/\s+/g, '');
      const match = snap.users.find(
        (u) =>
          u.username.toLowerCase() === ident ||
          (u.email && u.email.toLowerCase() === ident) ||
          (u.phone && u.phone.replace(/\s+/g, '') === phoneClean)
      );
      if (!match) {
        throw new Error('ឈ្មោះគណនី ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ / Invalid username or password');
      }
      if (match.status === 'suspended') {
        throw new Error('គណនីនេះត្រូវបានផ្អាកជាបណ្តោះអាសន្ន / Account is suspended');
      }
      const ok = await verifyOfflinePassword(params.password, vault[match.id]);
      if (!ok) {
        throw new Error('ឈ្មោះគណនី ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ / Invalid username or password');
      }
      match.lastLoginAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
      persistLocalSnapshot(snap);
      const token = `offline-jwt-${match.id}-${Date.now()}`;
      saveAuthSession(token, match);
      return { user: match, token, snapshot: snap, mode: 'offline' };
    }
  },

  async register(payload: RegisterAccountPayload): Promise<{
    user: UserAccount;
    token: string;
    snapshot: DatabaseSnapshot;
    mode: ConnectionMode;
  }> {
    try {
      const res = await apiRequest<{
        ok: boolean;
        token: string;
        user: UserAccount;
        snapshot: DatabaseSnapshot;
      }>('./api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      saveAuthSession(res.token, res.user);
      persistLocalSnapshot(res.snapshot);
      return { user: res.user, token: res.token, snapshot: res.snapshot, mode: 'online' };
    } catch (err: unknown) {
      if (isApiBusinessError(err)) {
        throw new Error(err.message || 'ការចុះឈ្មោះបរាជ័យ / Registration failed');
      }
      // Offline / Static Hosting PWA account registration
      const snap = structuredClone(loadLocalSnapshot());
      const cleanUsername = payload.username.trim();
      if (cleanUsername.length < 3 || !/^[a-zA-Z0-9._-]+$/.test(cleanUsername)) {
        throw new Error('ឈ្មោះគណនីត្រូវមានយ៉ាងតិច ៣ តួអក្សរ (a-z, 0-9, ., _, -)');
      }
      if (payload.password.length < 6) {
        throw new Error('ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួអក្សរ / Password must be >= 6 characters');
      }
      if (snap.users.some((u) => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
        throw new Error('ឈ្មោះគណនីនេះមានអ្នកប្រើរួចហើយ / Username already exists');
      }
      const cleanEmail = (payload.email || '').trim();
      if (
        cleanEmail &&
        snap.users.some((u) => u.email && u.email.toLowerCase() === cleanEmail.toLowerCase())
      ) {
        throw new Error('អ៊ីមែលនេះត្រូវបានចុះឈ្មោះរួចហើយ / Email is already registered');
      }

      const isFirst = snap.users.length === 0;
      const role: UserRole = isFirst ? 'admin' : payload.role || 'student';
      const def = ROLE_DEFAULTS[role];
      const nameKh = (payload.nameKh || payload.nameEn || '').trim();
      if (!nameKh) {
        throw new Error('សូមបញ្ចូលឈ្មោះពិតរបស់អ្នក / Please enter your full name');
      }
      const nameEn = (payload.nameEn || payload.nameKh || '').trim();

      if (isFirst) {
        if (payload.schoolNameKh) snap.settings.schoolNameKh = payload.schoolNameKh.trim();
        if (payload.schoolNameEn) snap.settings.schoolNameEn = payload.schoolNameEn.trim();
        snap.settings.principalNameKh = nameKh;
        snap.settings.principalNameEn = nameEn;
        if (payload.phone) snap.settings.phone = payload.phone.trim();
        if (cleanEmail) snap.settings.email = cleanEmail;
        if (payload.addressKh) snap.settings.addressKh = payload.addressKh.trim();
      }

      const linkedId = createOfflineLinkedProfile(snap, payload, role);
      const userId = uid('USR');
      const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
      const newUser: UserAccount = {
        id: userId,
        username: cleanUsername,
        role,
        nameKh,
        nameEn,
        titleKh: payload.titleKh || def.kh,
        titleEn: payload.titleEn || def.en,
        email: cleanEmail,
        phone: payload.phone || '',
        linkedId,
        avatarColor: payload.avatarColor || def.color,
        status: 'active',
        createdAt: new Date().toISOString().slice(0, 10),
        lastLoginAt: now,
      };
      snap.users.unshift(newUser);
      snap.auditLogs.unshift({
        id: uid('LOG'),
        userName: nameKh,
        role,
        action: isFirst
          ? 'ដំឡើងគណនីម្ចាស់ប្រព័ន្ធដំបូង (Owner Setup)'
          : 'ចុះឈ្មោះគណនីថ្មី (Register)',
        module: 'Auth',
        details: `Registered real account @${cleanUsername} (${role})`,
        createdAt: now,
      });

      const vault = loadOfflineVault();
      vault[userId] = await hashOfflinePassword(payload.password);
      saveOfflineVault(vault);
      persistLocalSnapshot(snap);

      const token = `offline-jwt-${userId}-${Date.now()}`;
      saveAuthSession(token, newUser);
      return { user: newUser, token, snapshot: snap, mode: 'offline' };
    }
  },

  async updateMyProfile(data: Partial<UserAccount>): Promise<{
    user: UserAccount;
    snapshot: DatabaseSnapshot;
    mode: ConnectionMode;
  }> {
    try {
      const res = await apiRequest<{
        ok: boolean;
        token: string;
        user: UserAccount;
        snapshot: DatabaseSnapshot;
      }>('./api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      saveAuthSession(res.token, res.user);
      persistLocalSnapshot(res.snapshot);
      return { user: res.user, snapshot: res.snapshot, mode: 'online' };
    } catch (err: unknown) {
      if (isApiBusinessError(err)) throw new Error(err.message || 'Update failed');
      const snap = structuredClone(loadLocalSnapshot());
      const cur = getStoredUser();
      if (!cur) throw new Error('សូមចូលប្រើប្រាស់គណនីជាមុនសិន / Not authenticated');
      const target = snap.users.find((u) => u.id === cur.id);
      if (!target) throw new Error('រកមិនឃើញគណនី / User not found');
      if (data.username) {
        const nextU = data.username.trim();
        if (nextU.length < 3 || !/^[a-zA-Z0-9._-]+$/.test(nextU)) {
          throw new Error('ឈ្មោះគណនីមិនត្រឹមត្រូវ / Invalid username');
        }
        if (snap.users.some((u) => u.id !== cur.id && u.username.toLowerCase() === nextU.toLowerCase())) {
          throw new Error('ឈ្មោះគណនីនេះមានអ្នកប្រើរួចហើយ / Username already taken');
        }
      }
      Object.assign(target, data);
      if (target.linkedId) {
        if (target.role === 'student') {
          const st = snap.students.find((s) => s.id === target.linkedId);
          if (st) {
            st.nameKh = target.nameKh;
            st.nameEn = target.nameEn;
            st.phone = target.phone;
            st.email = target.email;
          }
        } else {
          const tch = snap.teachers.find((t) => t.id === target.linkedId);
          if (tch) {
            tch.nameKh = target.nameKh;
            tch.nameEn = target.nameEn;
            tch.phone = target.phone;
            tch.email = target.email;
          }
        }
      }
      persistLocalSnapshot(snap);
      saveAuthSession(getStoredToken() || 'offline', target);
      return { user: target, snapshot: snap, mode: 'offline' };
    }
  },

  async changeMyPassword(params: { currentPassword: string; newPassword: string }): Promise<{
    snapshot: DatabaseSnapshot;
    mode: ConnectionMode;
  }> {
    try {
      const res = await apiRequest<{ ok: boolean; snapshot: DatabaseSnapshot }>('./api/auth/password', {
        method: 'PUT',
        body: JSON.stringify(params),
      });
      persistLocalSnapshot(res.snapshot);
      return { snapshot: res.snapshot, mode: 'online' };
    } catch (err: unknown) {
      if (isApiBusinessError(err)) throw new Error(err.message || 'Password change failed');
      const cur = getStoredUser();
      if (!cur) throw new Error('សូមចូលប្រើប្រាស់គណនីជាមុនសិន / Not authenticated');
      const vault = loadOfflineVault();
      const valid = await verifyOfflinePassword(params.currentPassword, vault[cur.id]);
      if (!valid) throw new Error('ពាក្យសម្ងាត់បច្ចុប្បន្នមិនត្រឹមត្រូវទេ / Current password is incorrect');
      if (params.newPassword.length < 6) {
        throw new Error('ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច ៦ តួអក្សរ / New password must be >= 6 characters');
      }
      vault[cur.id] = await hashOfflinePassword(params.newPassword);
      saveOfflineVault(vault);
      return { snapshot: loadLocalSnapshot(), mode: 'offline' };
    }
  },

  async createUserByAdmin(payload: RegisterAccountPayload & { status?: 'active' | 'suspended' }) {
    try {
      const res = await apiRequest<{ ok: boolean; snapshot: DatabaseSnapshot }>('./api/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      persistLocalSnapshot(res.snapshot);
      return { snapshot: res.snapshot, mode: 'online' as ConnectionMode };
    } catch (err: unknown) {
      if (isApiBusinessError(err)) throw new Error(err.message || 'Failed to create user');
      const snap = structuredClone(loadLocalSnapshot());
      const cleanUsername = payload.username.trim();
      if (cleanUsername.length < 3 || !/^[a-zA-Z0-9._-]+$/.test(cleanUsername)) {
        throw new Error('ឈ្មោះគណនីត្រូវមានយ៉ាងតិច ៣ តួអក្សរ (a-z, 0-9, ., _, -)');
      }
      if (payload.password.length < 6) {
        throw new Error('ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួអក្សរ / Password must be >= 6 characters');
      }
      if (snap.users.some((u) => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
        throw new Error('ឈ្មោះគណនីនេះមានរួចហើយ / Username already exists');
      }
      const def = ROLE_DEFAULTS[payload.role || 'student'];
      const linkedId = createOfflineLinkedProfile(snap, payload, payload.role || 'student');
      const id = uid('USR');
      snap.users.unshift({
        id,
        username: cleanUsername,
        role: payload.role || 'student',
        nameKh: payload.nameKh,
        nameEn: payload.nameEn || payload.nameKh,
        titleKh: payload.titleKh || def.kh,
        titleEn: payload.titleEn || def.en,
        email: payload.email || '',
        phone: payload.phone || '',
        linkedId,
        avatarColor: payload.avatarColor || def.color,
        status: payload.status || 'active',
        createdAt: new Date().toISOString().slice(0, 10),
        lastLoginAt: '',
      });
      const vault = loadOfflineVault();
      vault[id] = await hashOfflinePassword(payload.password);
      saveOfflineVault(vault);
      persistLocalSnapshot(snap);
      return { snapshot: snap, mode: 'offline' as ConnectionMode };
    }
  },

  async updateUserByAdmin(
    id: string,
    payload: Partial<UserAccount> & { newPassword?: string }
  ) {
    try {
      const res = await apiRequest<{ ok: boolean; snapshot: DatabaseSnapshot }>(`./api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      persistLocalSnapshot(res.snapshot);
      return { snapshot: res.snapshot, mode: 'online' as ConnectionMode };
    } catch (err: unknown) {
      if (isApiBusinessError(err)) throw new Error(err.message || 'Failed to update user');
      const snap = structuredClone(loadLocalSnapshot());
      const target = snap.users.find((u) => u.id === id);
      if (target) {
        if (
          target.role === 'admin' &&
          ((payload.role && payload.role !== 'admin') || payload.status === 'suspended')
        ) {
          const otherAdmins = snap.users.filter(
            (u) => u.id !== id && u.role === 'admin' && u.status !== 'suspended'
          );
          if (otherAdmins.length === 0) {
            throw new Error(
              'មិនអាចផ្អាក ឬប្តូរតួនាទី Admin ចុងក្រោយរបស់ប្រព័ន្ធបានទេ / Cannot suspend or demote the last active Admin'
            );
          }
        }
        const { newPassword, ...rest } = payload;
        Object.assign(target, rest);
        if (newPassword && newPassword.trim().length > 0) {
          if (newPassword.length < 6) {
            throw new Error('ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច ៦ តួអក្សរ / New password must be >= 6 characters');
          }
          const vault = loadOfflineVault();
          vault[id] = await hashOfflinePassword(newPassword);
          saveOfflineVault(vault);
        }
      }
      persistLocalSnapshot(snap);
      return { snapshot: snap, mode: 'offline' as ConnectionMode };
    }
  },

  deleteUserByAdmin(id: string) {
    return this.mutate(`/users/${id}`, 'DELETE', undefined, (draft) => {
      const cur = getStoredUser();
      if (cur && cur.id === id) {
        throw new Error('មិនអាចលុបគណនីដែលកំពុងចូលប្រើប្រាស់ផ្ទាល់ខ្លួនបានទេ');
      }
      draft.users = draft.users.filter((u) => u.id !== id);
    });
  },

  async mutate(
    endpoint: string,
    method: 'POST' | 'PUT' | 'DELETE',
    body: unknown,
    offlineMutator: (draft: DatabaseSnapshot) => void
  ): Promise<{ snapshot: DatabaseSnapshot; mode: ConnectionMode }> {
    try {
      const res = await apiRequest<{ ok: boolean; snapshot: DatabaseSnapshot }>(`./api${endpoint}`, {
        method,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      persistLocalSnapshot(res.snapshot);
      return { snapshot: res.snapshot, mode: 'online' };
    } catch (err: unknown) {
      if (isApiBusinessError(err)) {
        throw new Error(err.message || 'Request error');
      }
      const snap = structuredClone(loadLocalSnapshot());
      offlineMutator(snap);
      persistLocalSnapshot(snap);
      return { snapshot: snap, mode: 'offline' };
    }
  },

  // Convenience domain operations
  saveStudent(student: Partial<Student> & { id?: string }) {
    const isEdit = Boolean(student.id);
    return this.mutate(
      isEdit ? `/students/${student.id}` : '/students',
      isEdit ? 'PUT' : 'POST',
      student,
      (draft) => {
        if (isEdit) {
          const idx = draft.students.findIndex((s) => s.id === student.id);
          if (idx >= 0) draft.students[idx] = { ...draft.students[idx], ...student } as Student;
        } else {
          const nextNum = String(draft.students.length + 1).padStart(3, '0');
          draft.students.push({
            id: uid('STU'),
            studentCode: student.studentCode || `STU-2026-${nextNum}`,
            moeysId: student.moeysId || `SR-26-${100800 + draft.students.length + 1}`,
            nameKh: student.nameKh || '',
            nameEn: student.nameEn || '',
            gender: student.gender || 'M',
            dob: student.dob || '',
            pob: student.pob || '',
            classId: student.classId || '',
            enrollmentDate: student.enrollmentDate || new Date().toISOString().slice(0, 10),
            guardianName: student.guardianName || '',
            guardianRelation: student.guardianRelation || '',
            guardianPhone: student.guardianPhone || '',
            guardianOccupation: student.guardianOccupation || '',
            phone: student.phone || '',
            email: student.email || '',
            address: student.address || '',
            scholarshipPct: Number(student.scholarshipPct || 0),
            transportOpt: student.transportOpt || 'Self Drop-off',
            status: student.status || 'active',
            medicalNotes: student.medicalNotes || '',
            notes: student.notes || '',
            photo: student.photo || null,
          });
        }
      }
    );
  },

  deleteStudent(id: string) {
    return this.mutate(`/students/${id}`, 'DELETE', undefined, (draft) => {
      draft.students = draft.students.filter((s) => s.id !== id);
      draft.attendance = draft.attendance.filter((a) => a.studentId !== id);
      draft.grades = draft.grades.filter((g) => g.studentId !== id);
      draft.behaviorRecords = draft.behaviorRecords.filter((b) => b.studentId !== id);
    });
  },

  promoteClass(fromClassId: string, toClassId: string) {
    return this.mutate('/students/promote', 'POST', { fromClassId, toClassId }, (draft) => {
      draft.students.forEach((s) => {
        if (s.classId === fromClassId && s.status === 'active') s.classId = toClassId;
      });
    });
  },

  saveClass(cls: Partial<ClassRoom> & { id?: string }) {
    const isEdit = Boolean(cls.id);
    return this.mutate(
      isEdit ? `/classes/${cls.id}` : '/classes',
      isEdit ? 'PUT' : 'POST',
      cls,
      (draft) => {
        if (isEdit) {
          const idx = draft.classes.findIndex((c) => c.id === cls.id);
          if (idx >= 0) draft.classes[idx] = { ...draft.classes[idx], ...cls } as ClassRoom;
        } else {
          draft.classes.push({
            id: uid('CLS'),
            code: cls.code || 'CLS',
            nameKh: cls.nameKh || '',
            nameEn: cls.nameEn || '',
            gradeLevel: Number(cls.gradeLevel ?? 1),
            category: cls.category || 'primary',
            track: cls.track || 'General',
            homeroomTeacherId: cls.homeroomTeacherId || '',
            room: cls.room || '',
            shift: cls.shift || 'Full-Day',
            schedule: cls.schedule || '07:00–16:30',
            capacity: Number(cls.capacity || 35),
            monthlyTuition: Number(cls.monthlyTuition || 120),
            academicYear: cls.academicYear || '2026-2027',
          });
        }
      }
    );
  },

  deleteClass(id: string) {
    return this.mutate(`/classes/${id}`, 'DELETE', undefined, (draft) => {
      draft.classes = draft.classes.filter((c) => c.id !== id);
      draft.students.forEach((s) => {
        if (s.classId === id) s.classId = '';
      });
      draft.timetable = draft.timetable.filter((t) => t.classId !== id);
    });
  },

  saveSubject(sub: Partial<Subject> & { id?: string }) {
    const isEdit = Boolean(sub.id);
    return this.mutate(
      isEdit ? `/subjects/${sub.id}` : '/subjects',
      isEdit ? 'PUT' : 'POST',
      sub,
      (draft) => {
        if (isEdit) {
          const idx = draft.subjects.findIndex((s) => s.id === sub.id);
          if (idx >= 0) draft.subjects[idx] = { ...draft.subjects[idx], ...sub } as Subject;
        } else {
          draft.subjects.push({
            id: uid('SUB'),
            code: sub.code || 'SUBJ',
            nameKh: sub.nameKh || '',
            nameEn: sub.nameEn || '',
            category: sub.category || 'general',
            maxScore: Number(sub.maxScore || 100),
            coefficient: Number(sub.coefficient || 1),
            color: sub.color || '#2563eb',
          });
        }
      }
    );
  },

  deleteSubject(id: string) {
    return this.mutate(`/subjects/${id}`, 'DELETE', undefined, (draft) => {
      draft.subjects = draft.subjects.filter((s) => s.id !== id);
    });
  },

  saveTeacher(teacher: Partial<Teacher> & { id?: string }) {
    const isEdit = Boolean(teacher.id);
    return this.mutate(
      isEdit ? `/teachers/${teacher.id}` : '/teachers',
      isEdit ? 'PUT' : 'POST',
      teacher,
      (draft) => {
        if (isEdit) {
          const idx = draft.teachers.findIndex((t) => t.id === teacher.id);
          if (idx >= 0) draft.teachers[idx] = { ...draft.teachers[idx], ...teacher } as Teacher;
        } else {
          const num = String(draft.teachers.length + 1).padStart(3, '0');
          draft.teachers.push({
            id: uid('TCH'),
            teacherCode: teacher.teacherCode || `EMP-2026-${num}`,
            nameKh: teacher.nameKh || '',
            nameEn: teacher.nameEn || '',
            gender: teacher.gender || 'M',
            dob: teacher.dob || '',
            phone: teacher.phone || '',
            email: teacher.email || '',
            address: teacher.address || '',
            roleTitleKh: teacher.roleTitleKh || '',
            roleTitleEn: teacher.roleTitleEn || '',
            department: teacher.department || 'Academic',
            qualification: teacher.qualification || '',
            specialization: teacher.specialization || '',
            hireDate: teacher.hireDate || new Date().toISOString().slice(0, 10),
            baseSalary: Number(teacher.baseSalary || 500),
            status: teacher.status || 'active',
          });
        }
      }
    );
  },

  deleteTeacher(id: string) {
    return this.mutate(`/teachers/${id}`, 'DELETE', undefined, (draft) => {
      draft.teachers = draft.teachers.filter((t) => t.id !== id);
    });
  },

  createLeave(leave: Partial<TeacherLeave>) {
    return this.mutate('/leaves', 'POST', leave, (draft) => {
      draft.teacherLeaves.unshift({
        id: uid('LV'),
        teacherId: leave.teacherId || '',
        leaveType: leave.leaveType || 'ច្បាប់ធុរៈផ្ទាល់ខ្លួន',
        startDate: leave.startDate || '',
        endDate: leave.endDate || leave.startDate || '',
        days: Number(leave.days || 1),
        reason: leave.reason || '',
        status: 'pending',
        approvedBy: '',
        createdAt: new Date().toISOString().slice(0, 10),
      });
    });
  },

  updateLeaveStatus(id: string, status: 'approved' | 'rejected') {
    return this.mutate(`/leaves/${id}/status`, 'PUT', { status }, (draft) => {
      const item = draft.teacherLeaves.find((l) => l.id === id);
      if (item) {
        item.status = status;
        item.approvedBy = 'Admin';
      }
    });
  },

  generatePayrolls(monthKey: string) {
    return this.mutate('/payrolls/generate', 'POST', { monthKey }, (draft) => {
      draft.teachers
        .filter((t) => t.status === 'active')
        .forEach((t, idx) => {
          const exists = draft.payrolls.some((p) => p.teacherId === t.id && p.monthKey === monthKey);
          if (!exists) {
            draft.payrolls.push({
              id: `PAYR-${monthKey.replace('-', '')}-${t.id}`,
              payrollNo: `SLIP-${monthKey.replace('-', '')}-${String(idx + 1).padStart(3, '0')}`,
              teacherId: t.id,
              monthKey,
              baseSalary: t.baseSalary,
              allowance: 40,
              bonus: 0,
              deduction: 0,
              netSalary: t.baseSalary + 40,
              status: 'pending',
              paidAt: '',
              paymentMethod: '',
              notes: '',
            });
          }
        });
    });
  },

  updatePayroll(id: string, data: Partial<PayrollItem>) {
    return this.mutate(`/payrolls/${id}`, 'PUT', data, (draft) => {
      const p = draft.payrolls.find((x) => x.id === id);
      if (p) {
        Object.assign(p, data);
        p.netSalary = Math.max(
          0,
          Number(p.baseSalary) + Number(p.allowance) + Number(p.bonus) - Number(p.deduction)
        );
        if (p.status === 'paid' && !p.paidAt) p.paidAt = new Date().toISOString().slice(0, 10);
      }
    });
  },

  payAllPayrolls(monthKey: string, method = 'ABA Payroll') {
    return this.mutate('/payrolls/pay-all', 'POST', { monthKey, method }, (draft) => {
      const today = new Date().toISOString().slice(0, 10);
      draft.payrolls.forEach((p) => {
        if (p.monthKey === monthKey && p.status !== 'paid') {
          p.status = 'paid';
          p.paidAt = today;
          p.paymentMethod = method;
        }
      });
    });
  },

  saveAttendanceBatch(records: Omit<AttendanceRecord, 'id' | 'recordedBy'>[]) {
    return this.mutate('/attendance/batch', 'POST', { records }, (draft) => {
      records.forEach((r) => {
        const idx = draft.attendance.findIndex((a) => a.studentId === r.studentId && a.date === r.date);
        const entry: AttendanceRecord = {
          id: `ATT-${r.date}-${r.studentId}`,
          ...r,
          recordedBy: getStoredUser()?.nameKh || 'Teacher',
        };
        if (idx >= 0) draft.attendance[idx] = entry;
        else draft.attendance.push(entry);
      });
    });
  },

  saveGradesBatch(entries: Omit<GradeRecord, 'id' | 'updatedAt'>[]) {
    return this.mutate('/grades/batch', 'POST', { entries }, (draft) => {
      const now = new Date().toISOString();
      entries.forEach((g) => {
        const idx = draft.grades.findIndex(
          (x) =>
            x.studentId === g.studentId &&
            x.subjectId === g.subjectId &&
            x.periodCode === g.periodCode
        );
        const item: GradeRecord = {
          id: `GRD-${g.periodCode}-${g.studentId}-${g.subjectId}`,
          ...g,
          updatedAt: now,
        };
        if (idx >= 0) draft.grades[idx] = item;
        else draft.grades.push(item);
      });
    });
  },

  saveTimetableSlot(slot: Omit<TimetableSlot, 'id'>) {
    return this.mutate('/timetable', 'POST', slot, (draft) => {
      draft.timetable = draft.timetable.filter(
        (t) =>
          !(
            t.classId === slot.classId &&
            t.dayOfWeek === slot.dayOfWeek &&
            t.periodIndex === slot.periodIndex
          )
      );
      draft.timetable.push({
        id: `TT-${slot.classId}-${slot.dayOfWeek}-${slot.periodIndex}`,
        ...slot,
      });
    });
  },

  deleteTimetableSlot(id: string) {
    return this.mutate(`/timetable/${id}`, 'DELETE', undefined, (draft) => {
      draft.timetable = draft.timetable.filter((t) => t.id !== id);
    });
  },

  createExam(exam: Partial<ExamItem>) {
    return this.mutate('/exams', 'POST', exam, (draft) => {
      draft.exams.push({
        id: uid('EXM'),
        titleKh: exam.titleKh || '',
        titleEn: exam.titleEn || '',
        periodCode: exam.periodCode || 't1',
        examType: exam.examType || 'monthly',
        classId: exam.classId || 'all',
        startDate: exam.startDate || '',
        endDate: exam.endDate || '',
        status: exam.status || 'scheduled',
      });
    });
  },

  deleteExam(id: string) {
    return this.mutate(`/exams/${id}`, 'DELETE', undefined, (draft) => {
      draft.exams = draft.exams.filter((e) => e.id !== id);
    });
  },

  createAssignment(asn: Partial<AssignmentItem>) {
    return this.mutate('/assignments', 'POST', asn, (draft) => {
      draft.assignments.unshift({
        id: uid('ASN'),
        classId: asn.classId || '',
        subjectId: asn.subjectId || '',
        teacherId: asn.teacherId || '',
        title: asn.title || '',
        description: asn.description || '',
        dueDate: asn.dueDate || '',
        maxPoints: Number(asn.maxPoints || 20),
        status: 'open',
        createdAt: new Date().toISOString().slice(0, 10),
      });
    });
  },

  deleteAssignment(id: string) {
    return this.mutate(`/assignments/${id}`, 'DELETE', undefined, (draft) => {
      draft.assignments = draft.assignments.filter((a) => a.id !== id);
    });
  },

  createBehavior(bhv: Partial<BehaviorRecord>) {
    return this.mutate('/behavior', 'POST', bhv, (draft) => {
      draft.behaviorRecords.unshift({
        id: uid('BHV'),
        studentId: bhv.studentId || '',
        date: bhv.date || new Date().toISOString().slice(0, 10),
        type: bhv.type || 'merit',
        points: Number(bhv.points || 5),
        title: bhv.title || '',
        description: bhv.description || '',
        recordedBy: getStoredUser()?.nameKh || 'Teacher',
      });
    });
  },

  deleteBehavior(id: string) {
    return this.mutate(`/behavior/${id}`, 'DELETE', undefined, (draft) => {
      draft.behaviorRecords = draft.behaviorRecords.filter((b) => b.id !== id);
    });
  },

  createInvoice(inv: Partial<InvoiceItem>) {
    return this.mutate('/invoices', 'POST', inv, (draft) => {
      const subtotal = Number(inv.subtotal || 0);
      const discount = Number(inv.discountAmount || 0);
      const total = Math.max(0, subtotal - discount);
      draft.invoices.unshift({
        id: uid('INV'),
        invoiceNo: `INV-2026-${String(draft.invoices.length + 1).padStart(4, '0')}`,
        studentId: inv.studentId || '',
        classId: inv.classId || '',
        title: inv.title || 'Tuition Fee',
        category: inv.category || 'tuition',
        periodLabel: inv.periodLabel || '2026-11',
        subtotal,
        discountAmount: discount,
        totalAmount: total,
        paidAmount: 0,
        dueDate: inv.dueDate || '',
        status: total === 0 ? 'paid' : 'unpaid',
        paymentMethod: '',
        lastPaidAt: '',
        notes: inv.notes || '',
        createdAt: new Date().toISOString().slice(0, 10),
      });
    });
  },

  generateClassInvoices(payload: {
    classId: string;
    periodLabel: string;
    dueDate: string;
    title: string;
  }) {
    return this.mutate('/invoices/generate-class', 'POST', payload, (draft) => {
      const cls = draft.classes.find((c) => c.id === payload.classId);
      if (!cls) return;
      draft.students
        .filter((s) => s.classId === payload.classId && s.status === 'active')
        .forEach((s) => {
          const invId = `INV-${s.id}-${payload.periodLabel.replace('-', '')}`;
          if (draft.invoices.some((x) => x.id === invId)) return;
          const subtotal = cls.monthlyTuition;
          const disc = Math.round((subtotal * (s.scholarshipPct || 0)) / 100);
          const total = Math.max(0, subtotal - disc);
          draft.invoices.unshift({
            id: invId,
            invoiceNo: `INV-2026-${String(draft.invoices.length + 1).padStart(4, '0')}`,
            studentId: s.id,
            classId: payload.classId,
            title: payload.title || `ថ្លៃសិក្សាប្រចាំខែ ${payload.periodLabel}`,
            category: 'tuition',
            periodLabel: payload.periodLabel,
            subtotal,
            discountAmount: disc,
            totalAmount: total,
            paidAmount: 0,
            dueDate: payload.dueDate,
            status: total === 0 ? 'paid' : 'unpaid',
            paymentMethod: total === 0 ? 'Scholarship 100%' : '',
            lastPaidAt: '',
            notes: s.scholarshipPct > 0 ? `អាហារូបករណ៍ ${s.scholarshipPct}%` : '',
            createdAt: new Date().toISOString().slice(0, 10),
          });
        });
    });
  },

  recordPayment(payload: {
    invoiceId: string;
    amount: number;
    method: string;
    referenceNo?: string;
    notes?: string;
  }) {
    return this.mutate('/payments', 'POST', payload, (draft) => {
      const inv = draft.invoices.find((i) => i.id === payload.invoiceId);
      if (!inv) return;
      const today = new Date().toISOString().slice(0, 10);
      draft.payments.unshift({
        id: uid('PAY'),
        receiptNo: `RCP-2026-${String(draft.payments.length + 1).padStart(4, '0')}`,
        invoiceId: inv.id,
        studentId: inv.studentId,
        amount: payload.amount,
        method: payload.method,
        referenceNo: payload.referenceNo || `TXN-${Date.now().toString().slice(-6)}`,
        receivedBy: getStoredUser()?.nameKh || 'Accountant',
        paidAt: today,
        notes: payload.notes || '',
      });
      inv.paidAmount = Math.min(inv.totalAmount, inv.paidAmount + payload.amount);
      inv.status = inv.paidAmount >= inv.totalAmount ? 'paid' : 'partial';
      inv.paymentMethod = payload.method;
      inv.lastPaidAt = today;
    });
  },

  deleteInvoice(id: string) {
    return this.mutate(`/invoices/${id}`, 'DELETE', undefined, (draft) => {
      draft.invoices = draft.invoices.filter((i) => i.id !== id);
      draft.payments = draft.payments.filter((p) => p.invoiceId !== id);
    });
  },

  createExpense(exp: Partial<ExpenseItem>) {
    return this.mutate('/expenses', 'POST', exp, (draft) => {
      draft.expenses.unshift({
        id: uid('EXP'),
        expenseNo: `EXP-2026-${String(draft.expenses.length + 1).padStart(3, '0')}`,
        title: exp.title || '',
        category: exp.category || 'supplies',
        amount: Number(exp.amount || 0),
        expenseDate: exp.expenseDate || new Date().toISOString().slice(0, 10),
        paidTo: exp.paidTo || '',
        method: exp.method || 'Cash',
        notes: exp.notes || '',
      });
    });
  },

  deleteExpense(id: string) {
    return this.mutate(`/expenses/${id}`, 'DELETE', undefined, (draft) => {
      draft.expenses = draft.expenses.filter((e) => e.id !== id);
    });
  },

  createBook(book: Partial<LibraryBook>) {
    return this.mutate('/library/books', 'POST', book, (draft) => {
      const total = Number(book.totalCopies || 5);
      draft.libraryBooks.push({
        id: uid('BK'),
        bookCode: book.bookCode || `LIB-${Date.now().toString().slice(-4)}`,
        isbn: book.isbn || '',
        titleKh: book.titleKh || '',
        titleEn: book.titleEn || '',
        author: book.author || '',
        category: book.category || 'General',
        shelf: book.shelf || 'A-01',
        totalCopies: total,
        availableCopies: total,
        publishYear: Number(book.publishYear || 2025),
      });
    });
  },

  deleteBook(id: string) {
    return this.mutate(`/library/books/${id}`, 'DELETE', undefined, (draft) => {
      draft.libraryBooks = draft.libraryBooks.filter((b) => b.id !== id);
    });
  },

  createLoan(loan: Partial<LibraryLoan>) {
    return this.mutate('/library/loans', 'POST', loan, (draft) => {
      const bk = draft.libraryBooks.find((b) => b.id === loan.bookId);
      if (bk && bk.availableCopies > 0) {
        bk.availableCopies -= 1;
        draft.libraryLoans.unshift({
          id: uid('LN'),
          bookId: bk.id,
          borrowerType: loan.borrowerType || 'student',
          borrowerId: loan.borrowerId || '',
          borrowerName: loan.borrowerName || '',
          issueDate: loan.issueDate || new Date().toISOString().slice(0, 10),
          dueDate: loan.dueDate || '',
          returnDate: '',
          fineAmount: 0,
          status: 'borrowed',
        });
      }
    });
  },

  returnLoan(id: string) {
    return this.mutate(`/library/loans/${id}/return`, 'POST', {}, (draft) => {
      const ln = draft.libraryLoans.find((l) => l.id === id);
      if (ln && ln.status !== 'returned') {
        ln.status = 'returned';
        ln.returnDate = new Date().toISOString().slice(0, 10);
        const bk = draft.libraryBooks.find((b) => b.id === ln.bookId);
        if (bk) bk.availableCopies = Math.min(bk.totalCopies, bk.availableCopies + 1);
      }
    });
  },

  createAnnouncement(ann: Partial<AnnouncementItem>) {
    return this.mutate('/announcements', 'POST', ann, (draft) => {
      draft.announcements.unshift({
        id: uid('ANN'),
        titleKh: ann.titleKh || '',
        titleEn: ann.titleEn || '',
        contentKh: ann.contentKh || '',
        contentEn: ann.contentEn || '',
        audience: ann.audience || 'all',
        priority: ann.priority || 'normal',
        eventDate: ann.eventDate || '',
        authorName: getStoredUser()?.nameKh || 'រដ្ឋបាលសាលា',
        pinned: Boolean(ann.pinned),
        createdAt: new Date().toISOString().slice(0, 10),
      });
    });
  },

  togglePinAnnouncement(id: string, pinned: boolean) {
    return this.mutate(`/announcements/${id}`, 'PUT', { pinned }, (draft) => {
      const a = draft.announcements.find((x) => x.id === id);
      if (a) a.pinned = pinned;
    });
  },

  deleteAnnouncement(id: string) {
    return this.mutate(`/announcements/${id}`, 'DELETE', undefined, (draft) => {
      draft.announcements = draft.announcements.filter((a) => a.id !== id);
    });
  },

  updateSettings(settings: Partial<SchoolSettings>) {
    return this.mutate('/settings', 'PUT', settings, (draft) => {
      draft.settings = { ...draft.settings, ...settings };
    });
  },

  importBackup(payload: DatabaseSnapshot) {
    return this.mutate('/backup/import', 'POST', payload, (draft) => {
      const existingUsers = draft.users;
      Object.assign(draft, payload);
      if (!Array.isArray(payload.users) || payload.users.length === 0) {
        draft.users = existingUsers;
      }
    });
  },

  clearOperationalRecords() {
    return this.mutate('/system/clear-records', 'POST', {}, (draft) => {
      const preservedUsers = draft.users.map((u) => ({ ...u, linkedId: '' }));
      const preservedSettings = draft.settings;
      Object.assign(draft, buildInitialSeedData());
      draft.users = preservedUsers;
      draft.settings = preservedSettings;
    });
  },
};
