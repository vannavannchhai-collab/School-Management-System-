import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import {
  db,
  ensureSeeded,
  getFullDatabaseSnapshot,
  mapUserRow,
  populateWithData,
  runInTransaction,
  addAuditLog,
} from './db.js';
import { buildInitialSeedData } from './seedData.js';
import {
  authOptionalMiddleware,
  hashPassword,
  requireAdmin,
  requireAuth,
  signToken,
  verifyPassword,
} from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');

ensureSeeded();

const app = express();
app.use(express.json({ limit: '15mb' }));
app.use(authOptionalMiddleware);

const uid = (prefix = 'ID') =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
const nowDateTime = () => new Date().toISOString().slice(0, 16).replace('T', ' ');
const todayStr = () => new Date().toISOString().slice(0, 10);
const actorName = (req) => (req.user ? req.user.nameKh || req.user.username : 'ប្រព័ន្ធ / System');
const actorRole = (req) => (req.user ? req.user.role : 'admin');

const ROLE_TITLES = {
  admin: { kh: 'នាយកសាលា / អ្នកគ្រប់គ្រងប្រព័ន្ធ', en: 'Principal / System Administrator', color: '#2563eb' },
  teacher: { kh: 'គ្រូបង្រៀន', en: 'Faculty Teacher', color: '#059669' },
  accountant: { kh: 'គណនេយ្យករ និងហិរញ្ញវត្ថុ', en: 'Accountant & Finance Officer', color: '#d97706' },
  student: { kh: 'សិស្ស និងអាណាព្យាបាល', en: 'Student & Parent', color: '#7c3aed' },
};

// Health check
app.get('/api/health', (_req, res) => {
  const userCount = db.prepare('SELECT COUNT(*) AS cnt FROM users').get().cnt;
  res.json({
    status: 'ok',
    engine: 'node:sqlite (WAL)',
    mode: 'fullstack_hybrid',
    initializedUsers: userCount,
    timestamp: new Date().toISOString(),
  });
});

// ---------------- REAL AUTHENTICATION & USER ACCOUNTS ----------------
app.get('/api/auth/me', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!row || row.status === 'suspended') {
    return res.status(401).json({ error: 'សម័យប្រើប្រាស់ផុតកំណត់ ឬគណនីត្រូវបានផ្អាក / Session invalid or account suspended' });
  }
  res.json({ user: mapUserRow(row) });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const identifier = String(username || '').trim();
  const normalizedPhone = identifier.replace(/\s+/g, '');

  if (!identifier || !password) {
    return res.status(400).json({ error: 'សូមបញ្ចូលឈ្មោះគណនី និងពាក្យសម្ងាត់ / Please enter username and password' });
  }

  const row = db
    .prepare(
      `SELECT * FROM users
       WHERE LOWER(username) = LOWER(?)
          OR (email != '' AND LOWER(email) = LOWER(?))
          OR (phone != '' AND REPLACE(phone, ' ', '') = ?)
       LIMIT 1`
    )
    .get(identifier, identifier, normalizedPhone);

  if (!row || !verifyPassword(String(password), row.password_hash)) {
    return res.status(401).json({ error: 'ឈ្មោះគណនី ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ / Invalid username or password' });
  }

  if (row.status === 'suspended') {
    return res.status(403).json({ error: 'គណនីនេះត្រូវបានផ្អាកជាបណ្តោះអាសន្ន សូមទាក់ទងរដ្ឋបាលសាលា / Account is suspended' });
  }

  const loginTime = nowDateTime();
  db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(loginTime, row.id);
  row.last_login_at = loginTime;

  const user = mapUserRow(row);
  const token = signToken({
    id: user.id,
    username: user.username,
    role: user.role,
    nameKh: user.nameKh,
    linkedId: user.linkedId,
  });

  addAuditLog(user.nameKh || user.username, user.role, 'ចូលប្រើប្រាស់ប្រព័ន្ធ (Login)', 'Auth', `Signed in as @${user.username} (${user.role})`);
  res.json({ token, user, snapshot: getFullDatabaseSnapshot() });
});

function createOrLinkProfileForAccount(b, effectiveRole) {
  let linkedId = String(b.linkedId || '').trim();
  const nameKh = String(b.nameKh || b.nameEn || '').trim();
  const nameEn = String(b.nameEn || b.nameKh || '').trim();
  const phone = String(b.phone || '').trim();
  const email = String(b.email || '').trim();

  if (effectiveRole === 'student') {
    if (linkedId) {
      const existingStu = db
        .prepare('SELECT id FROM students WHERE id = ? OR LOWER(student_code) = LOWER(?)')
        .get(linkedId, linkedId);
      if (existingStu) return existingStu.id;
    }
    if (b.autoCreateProfile !== false) {
      const newStuId = uid('STU');
      const count = db.prepare('SELECT COUNT(*) AS cnt FROM students').get().cnt + 1;
      const studentCode = String(b.studentCode || '').trim() || `STU-2026-${String(count).padStart(3, '0')}`;
      db.prepare('INSERT INTO students VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
        newStuId,
        studentCode,
        b.moeysId || '',
        nameKh,
        nameEn,
        b.gender || 'M',
        b.dob || '',
        b.pob || '',
        b.classId || '',
        todayStr(),
        b.guardianName || '',
        b.guardianRelation || '',
        b.guardianPhone || phone,
        '',
        phone,
        email,
        b.address || '',
        0,
        'Self Drop-off',
        'active',
        '',
        '',
        null
      );
      return newStuId;
    }
  } else if (effectiveRole === 'teacher' || effectiveRole === 'accountant' || effectiveRole === 'admin') {
    if (linkedId) {
      const existingTch = db
        .prepare('SELECT id FROM teachers WHERE id = ? OR LOWER(teacher_code) = LOWER(?)')
        .get(linkedId, linkedId);
      if (existingTch) return existingTch.id;
    }
    if (b.autoCreateProfile !== false) {
      const newTchId = uid('TCH');
      const count = db.prepare('SELECT COUNT(*) AS cnt FROM teachers').get().cnt + 1;
      const teacherCode = String(b.teacherCode || '').trim() || `EMP-2026-${String(count).padStart(3, '0')}`;
      const defaults = ROLE_TITLES[effectiveRole] || ROLE_TITLES.teacher;
      db.prepare('INSERT INTO teachers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
        newTchId,
        teacherCode,
        nameKh,
        nameEn,
        b.gender || 'M',
        b.dob || '',
        phone,
        email,
        b.address || '',
        b.titleKh || defaults.kh,
        b.titleEn || defaults.en,
        effectiveRole === 'admin' ? 'Administration' : effectiveRole === 'accountant' ? 'Finance & Accounting' : 'Academic',
        b.qualification || '',
        b.specialization || '',
        todayStr(),
        Number(b.baseSalary || 0),
        'active'
      );
      return newTchId;
    }
  }
  return linkedId;
}

app.post('/api/auth/register', (req, res) => {
  const b = req.body || {};
  const cleanUsername = String(b.username || '').trim();
  const password = String(b.password || '');
  const nameKh = String(b.nameKh || b.nameEn || '').trim();
  const nameEn = String(b.nameEn || b.nameKh || '').trim();
  const email = String(b.email || '').trim();
  const phone = String(b.phone || '').trim();

  if (!cleanUsername || cleanUsername.length < 3) {
    return res.status(400).json({ error: 'ឈ្មោះគណនីត្រូវមានយ៉ាងតិច ៣ តួអក្សរ / Username must be at least 3 characters' });
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(cleanUsername)) {
    return res.status(400).json({ error: 'ឈ្មោះគណនីអាចប្រើបានតែអក្សរឡាតាំង លេខ និងសញ្ញា . _ - ប៉ុណ្ណោះ / Username may only contain letters, numbers, ., _, -' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួអក្សរ / Password must be at least 6 characters' });
  }
  if (!nameKh) {
    return res.status(400).json({ error: 'សូមបញ្ចូលឈ្មោះពិតរបស់អ្នក / Please enter your full name' });
  }

  const existingUsername = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').get(cleanUsername);
  if (existingUsername) {
    return res.status(409).json({ error: 'ឈ្មោះគណនីនេះមានអ្នកប្រើរួចហើយ សូមជ្រើសរើសឈ្មោះផ្សេង / Username is already taken' });
  }
  if (email) {
    const existingEmail = db.prepare("SELECT id FROM users WHERE email != '' AND LOWER(email) = LOWER(?)").get(email);
    if (existingEmail) {
      return res.status(409).json({ error: 'អ៊ីមែលនេះត្រូវបានចុះឈ្មោះរួចហើយ / Email is already registered' });
    }
  }

  const existingUsersCount = db.prepare('SELECT COUNT(*) AS cnt FROM users').get().cnt;
  const isFirstOwner = existingUsersCount === 0;
  const allowedRoles = ['admin', 'teacher', 'accountant', 'student'];
  const effectiveRole = isFirstOwner
    ? 'admin'
    : allowedRoles.includes(b.role)
    ? b.role
    : 'student';

  const defaults = ROLE_TITLES[effectiveRole] || ROLE_TITLES.student;
  const userId = uid('USR');
  const now = nowDateTime();

  let createdUser = null;
  runInTransaction(() => {
    // If First-Time Setup, update school identity settings right away
    if (isFirstOwner) {
      const insSet = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
      if (b.schoolNameKh) insSet.run('schoolNameKh', JSON.stringify(String(b.schoolNameKh).trim()));
      if (b.schoolNameEn) insSet.run('schoolNameEn', JSON.stringify(String(b.schoolNameEn).trim()));
      insSet.run('principalNameKh', JSON.stringify(nameKh));
      insSet.run('principalNameEn', JSON.stringify(nameEn));
      if (phone) insSet.run('phone', JSON.stringify(phone));
      if (email) insSet.run('email', JSON.stringify(email));
      if (b.addressKh) insSet.run('addressKh', JSON.stringify(String(b.addressKh).trim()));
    }

    const linkedId = createOrLinkProfileForAccount(b, effectiveRole);
    const avatarColor = b.avatarColor || defaults.color;
    const titleKh = String(b.titleKh || defaults.kh).trim();
    const titleEn = String(b.titleEn || defaults.en).trim();

    db.prepare(
      `INSERT INTO users (id, username, password_hash, role, name_kh, name_en, title_kh, title_en, email, phone, linked_id, avatar_color, status, created_at, last_login_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`
    ).run(
      userId,
      cleanUsername,
      hashPassword(password),
      effectiveRole,
      nameKh,
      nameEn,
      titleKh,
      titleEn,
      email,
      phone,
      linkedId,
      avatarColor,
      todayStr(),
      now
    );

    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    createdUser = mapUserRow(row);
  });

  const token = signToken({
    id: createdUser.id,
    username: createdUser.username,
    role: createdUser.role,
    nameKh: createdUser.nameKh,
    linkedId: createdUser.linkedId,
  });

  addAuditLog(
    createdUser.nameKh,
    createdUser.role,
    isFirstOwner ? 'ដំឡើងគណនីម្ចាស់ប្រព័ន្ធដំបូង (Owner Setup)' : 'ចុះឈ្មោះគណនីថ្មី (Register)',
    'Auth',
    `Registered real account @${createdUser.username} (${createdUser.role})`
  );

  res.json({ ok: true, token, user: createdUser, snapshot: getFullDatabaseSnapshot() });
});

app.put('/api/auth/profile', requireAuth, (req, res) => {
  const b = req.body || {};
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!row) return res.status(404).json({ error: 'រកមិនឃើញគណនី / User not found' });

  const nextUsername = String(b.username || row.username).trim();
  if (nextUsername.length < 3 || !/^[a-zA-Z0-9._-]+$/.test(nextUsername)) {
    return res.status(400).json({ error: 'ឈ្មោះគណនីមិនត្រឹមត្រូវ / Invalid username format' });
  }
  const conflict = db
    .prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND id != ?')
    .get(nextUsername, row.id);
  if (conflict) {
    return res.status(409).json({ error: 'ឈ្មោះគណនីនេះមានអ្នកប្រើរួចហើយ / Username already taken' });
  }

  const nameKh = String(b.nameKh ?? row.name_kh).trim() || row.name_kh;
  const nameEn = String(b.nameEn ?? row.name_en).trim() || nameKh;
  const titleKh = String(b.titleKh ?? row.title_kh).trim();
  const titleEn = String(b.titleEn ?? row.title_en).trim();
  const email = String(b.email ?? row.email).trim();
  const phone = String(b.phone ?? row.phone).trim();
  const avatarColor = String(b.avatarColor ?? row.avatar_color).trim() || '#2563eb';

  runInTransaction(() => {
    db.prepare(
      `UPDATE users SET username = ?, name_kh = ?, name_en = ?, title_kh = ?, title_en = ?, email = ?, phone = ?, avatar_color = ?
       WHERE id = ?`
    ).run(nextUsername, nameKh, nameEn, titleKh, titleEn, email, phone, avatarColor, row.id);

    if (row.linked_id) {
      if (row.role === 'student') {
        db.prepare('UPDATE students SET name_kh = ?, name_en = ?, phone = ?, email = ? WHERE id = ?').run(
          nameKh,
          nameEn,
          phone,
          email,
          row.linked_id
        );
      } else {
        db.prepare('UPDATE teachers SET name_kh = ?, name_en = ?, phone = ?, email = ? WHERE id = ?').run(
          nameKh,
          nameEn,
          phone,
          email,
          row.linked_id
        );
      }
    }
  });

  const updated = mapUserRow(db.prepare('SELECT * FROM users WHERE id = ?').get(row.id));
  const token = signToken({
    id: updated.id,
    username: updated.username,
    role: updated.role,
    nameKh: updated.nameKh,
    linkedId: updated.linkedId,
  });
  addAuditLog(updated.nameKh, updated.role, 'កែប្រែព័ត៌មានគណនីផ្ទាល់ខ្លួន', 'Auth', `Updated profile @${updated.username}`);
  res.json({ ok: true, token, user: updated, snapshot: getFullDatabaseSnapshot() });
});

app.put('/api/auth/password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!row) return res.status(404).json({ error: 'រកមិនឃើញគណនី / User not found' });

  if (!verifyPassword(String(currentPassword || ''), row.password_hash)) {
    return res.status(400).json({ error: 'ពាក្យសម្ងាត់បច្ចុប្បន្នមិនត្រឹមត្រូវទេ / Current password is incorrect' });
  }
  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ error: 'ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច ៦ តួអក្សរ / New password must be at least 6 characters' });
  }

  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(String(newPassword)), row.id);
  addAuditLog(row.name_kh, row.role, 'ប្តូរពាក្យសម្ងាត់ផ្ទាល់ខ្លួន', 'Auth', `Changed password for @${row.username}`);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

// Admin User Accounts CRUD
app.post('/api/users', requireAdmin, (req, res) => {
  const b = req.body || {};
  const cleanUsername = String(b.username || '').trim();
  const password = String(b.password || '');
  const role = ['admin', 'teacher', 'accountant', 'student'].includes(b.role) ? b.role : 'student';
  const nameKh = String(b.nameKh || b.nameEn || '').trim();
  const nameEn = String(b.nameEn || b.nameKh || '').trim();

  if (!cleanUsername || cleanUsername.length < 3 || !/^[a-zA-Z0-9._-]+$/.test(cleanUsername)) {
    return res.status(400).json({ error: 'ឈ្មោះគណនីត្រូវមានយ៉ាងតិច ៣ តួអក្សរ (a-z, 0-9, ., _, -) / Invalid username' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួអក្សរ / Password must be at least 6 characters' });
  }
  if (!nameKh) {
    return res.status(400).json({ error: 'សូមបញ្ចូលឈ្មោះអ្នកប្រើប្រាស់ / Full name is required' });
  }

  const dup = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').get(cleanUsername);
  if (dup) {
    return res.status(409).json({ error: 'ឈ្មោះគណនីនេះមានរួចហើយ / Username already exists' });
  }

  const defaults = ROLE_TITLES[role] || ROLE_TITLES.student;
  const id = uid('USR');

  runInTransaction(() => {
    const linkedId = createOrLinkProfileForAccount(b, role);
    db.prepare(
      `INSERT INTO users (id, username, password_hash, role, name_kh, name_en, title_kh, title_en, email, phone, linked_id, avatar_color, status, created_at, last_login_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '')`
    ).run(
      id,
      cleanUsername,
      hashPassword(password),
      role,
      nameKh,
      nameEn,
      String(b.titleKh || defaults.kh).trim(),
      String(b.titleEn || defaults.en).trim(),
      String(b.email || '').trim(),
      String(b.phone || '').trim(),
      linkedId,
      b.avatarColor || defaults.color,
      b.status === 'suspended' ? 'suspended' : 'active',
      todayStr()
    );
  });

  addAuditLog(actorName(req), actorRole(req), 'បង្កើតគណនីអ្នកប្រើប្រាស់ថ្មី', 'Users', `Created @${cleanUsername} (${role})`);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.put('/api/users/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const b = req.body || {};
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'រកមិនឃើញគណនី / User not found' });

  const nextUsername = String(b.username || existing.username).trim();
  if (nextUsername.length < 3 || !/^[a-zA-Z0-9._-]+$/.test(nextUsername)) {
    return res.status(400).json({ error: 'ឈ្មោះគណនីមិនត្រឹមត្រូវ / Invalid username' });
  }
  const dup = db
    .prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND id != ?')
    .get(nextUsername, id);
  if (dup) {
    return res.status(409).json({ error: 'ឈ្មោះគណនីនេះមានអ្នកប្រើរួចហើយ / Username already exists' });
  }

  const nextRole = ['admin', 'teacher', 'accountant', 'student'].includes(b.role) ? b.role : existing.role;
  const nextStatus = b.status === 'suspended' ? 'suspended' : 'active';

  // Prevent locking out the last active admin
  if (existing.role === 'admin' && (nextRole !== 'admin' || nextStatus !== 'active')) {
    const activeAdmins = db
      .prepare("SELECT COUNT(*) AS cnt FROM users WHERE role = 'admin' AND status = 'active' AND id != ?")
      .get(id).cnt;
    if (activeAdmins === 0) {
      return res.status(400).json({
        error: 'មិនអាចផ្អាក ឬប្តូរតួនាទី Admin ចុងក្រោយរបស់ប្រព័ន្ធបានទេ / Cannot suspend or demote the last active Admin',
      });
    }
  }

  const defaults = ROLE_TITLES[nextRole] || ROLE_TITLES.student;
  const nextHash =
    b.newPassword && String(b.newPassword).trim().length > 0
      ? String(b.newPassword).length >= 6
        ? hashPassword(String(b.newPassword))
        : null
      : existing.password_hash;

  if (!nextHash) {
    return res.status(400).json({ error: 'ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច ៦ តួអក្សរ / New password must be at least 6 characters' });
  }

  db.prepare(
    `UPDATE users SET
      username = ?, password_hash = ?, role = ?, name_kh = ?, name_en = ?,
      title_kh = ?, title_en = ?, email = ?, phone = ?, linked_id = ?, avatar_color = ?, status = ?
     WHERE id = ?`
  ).run(
    nextUsername,
    nextHash,
    nextRole,
    String(b.nameKh ?? existing.name_kh).trim() || existing.name_kh,
    String(b.nameEn ?? existing.name_en).trim() || existing.name_en,
    String(b.titleKh ?? existing.title_kh ?? defaults.kh).trim(),
    String(b.titleEn ?? existing.title_en ?? defaults.en).trim(),
    String(b.email ?? existing.email).trim(),
    String(b.phone ?? existing.phone).trim(),
    String(b.linkedId ?? existing.linked_id).trim(),
    b.avatarColor || existing.avatar_color || defaults.color,
    nextStatus,
    id
  );

  addAuditLog(actorName(req), actorRole(req), 'កែប្រែគណនីអ្នកប្រើប្រាស់', 'Users', `Updated @${nextUsername} (${nextRole}, ${nextStatus})`);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.delete('/api/users/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  if (req.user && req.user.id === id) {
    return res.status(400).json({ error: 'មិនអាចលុបគណនីដែលកំពុងចូលប្រើប្រាស់ផ្ទាល់ខ្លួនបានទេ / Cannot delete your own active account' });
  }
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'រកមិនឃើញគណនី / User not found' });

  if (existing.role === 'admin') {
    const otherAdmins = db
      .prepare("SELECT COUNT(*) AS cnt FROM users WHERE role = 'admin' AND status = 'active' AND id != ?")
      .get(id).cnt;
    if (otherAdmins === 0) {
      return res.status(400).json({ error: 'មិនអាចលុបគណនី Admin ចុងក្រោយបានទេ / Cannot delete the last active Admin' });
    }
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  addAuditLog(actorName(req), actorRole(req), 'លុបគណនីអ្នកប្រើប្រាស់', 'Users', `Deleted @${existing.username}`);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

// Full snapshot bootstrap
app.get('/api/bootstrap', (_req, res) => {
  res.json(getFullDatabaseSnapshot());
});

// ---------------- STUDENTS ----------------
app.post('/api/students', (req, res) => {
  const b = req.body || {};
  const id = b.id || uid('STU');
  const count = db.prepare('SELECT COUNT(*) AS cnt FROM students').get().cnt + 1;
  const studentCode = b.studentCode || `STU-2026-${String(count).padStart(3, '0')}`;
  db.prepare(`
    INSERT INTO students VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, studentCode, b.moeysId || `SR-26-${100800 + count}`, b.nameKh || '', b.nameEn || '',
    b.gender || 'M', b.dob || '', b.pob || '', b.classId || '', b.enrollmentDate || todayStr(),
    b.guardianName || '', b.guardianRelation || '', b.guardianPhone || '', b.guardianOccupation || '',
    b.phone || '', b.email || '', b.address || '', Number(b.scholarshipPct || 0),
    b.transportOpt || 'Self Drop-off', b.status || 'active', b.medicalNotes || '', b.notes || '', b.photo || null
  );
  addAuditLog(actorName(req), actorRole(req), 'ចុះឈ្មោះសិស្សថ្មី', 'Students', `${b.nameKh || b.nameEn} (${studentCode})`);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.put('/api/students/:id', (req, res) => {
  const { id } = req.params;
  const b = req.body || {};
  db.prepare(`
    UPDATE students SET
      student_code = ?, moeys_id = ?, name_kh = ?, name_en = ?, gender = ?, dob = ?, pob = ?,
      class_id = ?, enrollment_date = ?, guardian_name = ?, guardian_relation = ?, guardian_phone = ?,
      guardian_occupation = ?, phone = ?, email = ?, address = ?, scholarship_pct = ?,
      transport_opt = ?, status = ?, medical_notes = ?, notes = ?, photo = ?
    WHERE id = ?
  `).run(
    b.studentCode || id, b.moeysId || '', b.nameKh || '', b.nameEn || '', b.gender || 'M',
    b.dob || '', b.pob || '', b.classId || '', b.enrollmentDate || '',
    b.guardianName || '', b.guardianRelation || '', b.guardianPhone || '', b.guardianOccupation || '',
    b.phone || '', b.email || '', b.address || '', Number(b.scholarshipPct || 0),
    b.transportOpt || '', b.status || 'active', b.medicalNotes || '', b.notes || '', b.photo || null,
    id
  );
  addAuditLog(actorName(req), actorRole(req), 'កែប្រែព័ត៌មានសិស្ស', 'Students', `${b.nameKh || b.nameEn}`);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.delete('/api/students/:id', (req, res) => {
  const { id } = req.params;
  runInTransaction(() => {
    db.prepare('DELETE FROM attendance WHERE student_id = ?').run(id);
    db.prepare('DELETE FROM grades WHERE student_id = ?').run(id);
    db.prepare('DELETE FROM behavior_records WHERE student_id = ?').run(id);
    db.prepare("UPDATE users SET linked_id = '' WHERE linked_id = ?").run(id);
    db.prepare('DELETE FROM students WHERE id = ?').run(id);
  });
  addAuditLog(actorName(req), actorRole(req), 'លុបឈ្មោះសិស្ស', 'Students', `Deleted student ${id}`);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.post('/api/students/promote', (req, res) => {
  const { fromClassId, toClassId } = req.body || {};
  if (fromClassId && toClassId) {
    db.prepare('UPDATE students SET class_id = ? WHERE class_id = ? AND status = ?').run(toClassId, fromClassId, 'active');
    addAuditLog(actorName(req), actorRole(req), 'ដំឡើងថ្នាក់សិស្ស', 'Students', `Promoted from ${fromClassId} to ${toClassId}`);
  }
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

// ---------------- TEACHERS & HR ----------------
app.post('/api/teachers', (req, res) => {
  const b = req.body || {};
  const id = b.id || uid('TCH');
  const count = db.prepare('SELECT COUNT(*) AS cnt FROM teachers').get().cnt + 1;
  const teacherCode = b.teacherCode || `EMP-2026-${String(count).padStart(3, '0')}`;
  db.prepare(`INSERT INTO teachers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id, teacherCode, b.nameKh || '', b.nameEn || '', b.gender || 'M', b.dob || '',
    b.phone || '', b.email || '', b.address || '', b.roleTitleKh || '', b.roleTitleEn || '',
    b.department || 'Academic', b.qualification || '', b.specialization || '',
    b.hireDate || todayStr(), Number(b.baseSalary || 500), b.status || 'active'
  );
  addAuditLog(actorName(req), actorRole(req), 'បន្ថែមគ្រូ/បុគ្គលិកថ្មី', 'HR', `${b.nameKh || b.nameEn}`);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.put('/api/teachers/:id', (req, res) => {
  const { id } = req.params;
  const b = req.body || {};
  db.prepare(`
    UPDATE teachers SET
      teacher_code = ?, name_kh = ?, name_en = ?, gender = ?, dob = ?, phone = ?, email = ?,
      address = ?, role_title_kh = ?, role_title_en = ?, department = ?, qualification = ?,
      specialization = ?, hire_date = ?, base_salary = ?, status = ?
    WHERE id = ?
  `).run(
    b.teacherCode || id, b.nameKh || '', b.nameEn || '', b.gender || 'M', b.dob || '',
    b.phone || '', b.email || '', b.address || '', b.roleTitleKh || '', b.roleTitleEn || '',
    b.department || '', b.qualification || '', b.specialization || '', b.hireDate || '',
    Number(b.baseSalary || 500), b.status || 'active', id
  );
  addAuditLog(actorName(req), actorRole(req), 'កែប្រែព័ត៌មានបុគ្គលិក', 'HR', `${b.nameKh || b.nameEn}`);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.delete('/api/teachers/:id', (req, res) => {
  const { id } = req.params;
  db.prepare("UPDATE users SET linked_id = '' WHERE linked_id = ?").run(id);
  db.prepare('DELETE FROM teachers WHERE id = ?').run(id);
  addAuditLog(actorName(req), actorRole(req), 'លុបបុគ្គលិក', 'HR', `Deleted staff ${id}`);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

// Teacher Leaves
app.post('/api/leaves', (req, res) => {
  const b = req.body || {};
  const id = uid('LV');
  db.prepare('INSERT INTO teacher_leaves VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    id, b.teacherId, b.leaveType || 'ច្បាប់ធុរៈផ្ទាល់ខ្លួន', b.startDate, b.endDate || b.startDate,
    Number(b.days || 1), b.reason || '', 'pending', '', todayStr()
  );
  addAuditLog(actorName(req), actorRole(req), 'ដាក់សំណើសុំច្បាប់', 'HR', `Leave request ${id}`);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.put('/api/leaves/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  db.prepare('UPDATE teacher_leaves SET status = ?, approved_by = ? WHERE id = ?').run(
    status || 'approved', actorName(req), id
  );
  addAuditLog(actorName(req), actorRole(req), `កំណត់ស្ថានភាពច្បាប់ (${status})`, 'HR', `Leave ${id} -> ${status}`);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

// Payrolls
app.post('/api/payrolls/generate', (req, res) => {
  const { monthKey } = req.body || {};
  if (!monthKey) return res.status(400).json({ error: 'monthKey required' });
  runInTransaction(() => {
    const activeTeachers = db.prepare("SELECT * FROM teachers WHERE status = 'active'").all();
    const ins = db.prepare('INSERT OR IGNORE INTO payrolls VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    activeTeachers.forEach((t, idx) => {
      const allowance = 40;
      const net = Number(t.base_salary) + allowance;
      ins.run(
        `PAYR-${monthKey.replace('-', '')}-${t.id}`,
        `SLIP-${monthKey.replace('-', '')}-${String(idx + 1).padStart(3, '0')}`,
        t.id,
        monthKey,
        t.base_salary,
        allowance,
        0,
        0,
        net,
        'pending',
        '',
        '',
        ''
      );
    });
  });
  addAuditLog(actorName(req), actorRole(req), 'បង្កើតតារាងប្រាក់ខែ', 'Payroll', `Generated payroll sheet for ${monthKey}`);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.put('/api/payrolls/:id', (req, res) => {
  const { id } = req.params;
  const b = req.body || {};
  const base = Number(b.baseSalary || 0);
  const allowance = Number(b.allowance || 0);
  const bonus = Number(b.bonus || 0);
  const deduction = Number(b.deduction || 0);
  const net = Math.max(0, base + allowance + bonus - deduction);
  const status = b.status || 'pending';
  const paidAt = status === 'paid' ? (b.paidAt || todayStr()) : '';
  db.prepare(`
    UPDATE payrolls SET
      base_salary = ?, allowance = ?, bonus = ?, deduction = ?, net_salary = ?,
      status = ?, paid_at = ?, payment_method = ?, notes = ?
    WHERE id = ?
  `).run(base, allowance, bonus, deduction, net, status, paidAt, b.paymentMethod || 'ABA Payroll', b.notes || '', id);
  addAuditLog(actorName(req), actorRole(req), 'ធ្វើបច្ចុប្បន្នភាពប្រាក់ខែ', 'Payroll', `Updated payroll ${id} (${status})`);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.post('/api/payrolls/pay-all', (req, res) => {
  const { monthKey, method } = req.body || {};
  const today = todayStr();
  db.prepare(`UPDATE payrolls SET status = 'paid', paid_at = ?, payment_method = ? WHERE month_key = ? AND status != 'paid'`).run(
    today, method || 'ABA Payroll', monthKey
  );
  addAuditLog(actorName(req), actorRole(req), 'បើកប្រាក់ខែបុគ្គលិកទាំងអស់', 'Payroll', `Paid all pending salaries for ${monthKey}`);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

// ---------------- CLASSES & SUBJECTS ----------------
app.post('/api/classes', (req, res) => {
  const b = req.body || {};
  const id = b.id || uid('CLS');
  db.prepare('INSERT INTO classes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    id, b.code || id, b.nameKh || '', b.nameEn || '', Number(b.gradeLevel ?? 1),
    b.category || 'primary', b.track || 'General', b.homeroomTeacherId || '',
    b.room || '', b.shift || 'Full-Day', b.schedule || '07:00–16:30',
    Number(b.capacity || 35), Number(b.monthlyTuition || 120), b.academicYear || '2026-2027'
  );
  addAuditLog(actorName(req), actorRole(req), 'បង្កើតថ្នាក់រៀនថ្មី', 'Academic', `${b.nameKh || b.nameEn}`);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.put('/api/classes/:id', (req, res) => {
  const { id } = req.params;
  const b = req.body || {};
  db.prepare(`
    UPDATE classes SET
      code = ?, name_kh = ?, name_en = ?, grade_level = ?, category = ?, track = ?,
      homeroom_teacher_id = ?, room = ?, shift = ?, schedule = ?, capacity = ?, monthly_tuition = ?, academic_year = ?
    WHERE id = ?
  `).run(
    b.code || id, b.nameKh || '', b.nameEn || '', Number(b.gradeLevel ?? 1),
    b.category || 'primary', b.track || 'General', b.homeroomTeacherId || '',
    b.room || '', b.shift || 'Full-Day', b.schedule || '',
    Number(b.capacity || 35), Number(b.monthlyTuition || 120), b.academicYear || '2026-2027', id
  );
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.delete('/api/classes/:id', (req, res) => {
  const { id } = req.params;
  runInTransaction(() => {
    db.prepare("UPDATE students SET class_id = '' WHERE class_id = ?").run(id);
    db.prepare('DELETE FROM timetable_slots WHERE class_id = ?').run(id);
    db.prepare('DELETE FROM classes WHERE id = ?').run(id);
  });
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.post('/api/subjects', (req, res) => {
  const b = req.body || {};
  const id = b.id || uid('SUB');
  db.prepare('INSERT INTO subjects VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    id, b.code || 'SUBJ', b.nameKh || '', b.nameEn || '', b.category || 'general',
    Number(b.maxScore || 100), Number(b.coefficient || 1), b.color || '#2563eb'
  );
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.put('/api/subjects/:id', (req, res) => {
  const { id } = req.params;
  const b = req.body || {};
  db.prepare('UPDATE subjects SET code = ?, name_kh = ?, name_en = ?, category = ?, max_score = ?, coefficient = ?, color = ? WHERE id = ?').run(
    b.code || 'SUBJ', b.nameKh || '', b.nameEn || '', b.category || 'general',
    Number(b.maxScore || 100), Number(b.coefficient || 1), b.color || '#2563eb', id
  );
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.delete('/api/subjects/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM subjects WHERE id = ?').run(id);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

// ---------------- ATTENDANCE ----------------
app.post('/api/attendance/batch', (req, res) => {
  const { records } = req.body || {};
  if (Array.isArray(records)) {
    runInTransaction(() => {
      const stmt = db.prepare(`
        INSERT INTO attendance (id, student_id, class_id, date, status, check_in_time, remarks, recorded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(student_id, date) DO UPDATE SET
          class_id = excluded.class_id,
          status = excluded.status,
          check_in_time = excluded.check_in_time,
          remarks = excluded.remarks,
          recorded_by = excluded.recorded_by
      `);
      for (const r of records) {
        stmt.run(
          `ATT-${r.date}-${r.studentId}`,
          r.studentId,
          r.classId || '',
          r.date,
          r.status,
          r.checkInTime || '',
          r.remarks || '',
          actorName(req)
        );
      }
    });
    addAuditLog(actorName(req), actorRole(req), 'រក្សាទុកវត្តមានសិស្ស', 'Attendance', `Saved ${records.length} attendance records`);
  }
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

// ---------------- GRADES & EXAMS ----------------
app.post('/api/grades/batch', (req, res) => {
  const { entries } = req.body || {};
  if (Array.isArray(entries)) {
    const now = new Date().toISOString();
    runInTransaction(() => {
      const stmt = db.prepare(`
        INSERT INTO grades (id, student_id, class_id, subject_id, subject_name, period_code, score, max_score, remarks, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(student_id, subject_id, period_code) DO UPDATE SET
          class_id = excluded.class_id,
          subject_name = excluded.subject_name,
          score = excluded.score,
          max_score = excluded.max_score,
          remarks = excluded.remarks,
          updated_at = excluded.updated_at
      `);
      for (const g of entries) {
        stmt.run(
          `GRD-${g.periodCode}-${g.studentId}-${g.subjectId}`,
          g.studentId,
          g.classId || '',
          g.subjectId,
          g.subjectName || '',
          g.periodCode,
          Number(g.score),
          Number(g.maxScore || 100),
          g.remarks || '',
          now
        );
      }
    });
    addAuditLog(actorName(req), actorRole(req), 'រក្សាទុកពិន្ទុសិស្ស', 'Grades', `Saved ${entries.length} score records`);
  }
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.delete('/api/grades/:id', (req, res) => {
  db.prepare('DELETE FROM grades WHERE id = ?').run(req.params.id);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.post('/api/exams', (req, res) => {
  const b = req.body || {};
  db.prepare('INSERT INTO exams VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    uid('EXM'), b.titleKh || '', b.titleEn || '', b.periodCode || 't1',
    b.examType || 'monthly', b.classId || 'all', b.startDate || '', b.endDate || '', b.status || 'scheduled'
  );
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.delete('/api/exams/:id', (req, res) => {
  db.prepare('DELETE FROM exams WHERE id = ?').run(req.params.id);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

// ---------------- TIMETABLE ----------------
app.post('/api/timetable', (req, res) => {
  const b = req.body || {};
  const id = `TT-${b.classId}-${b.dayOfWeek}-${b.periodIndex}`;
  runInTransaction(() => {
    db.prepare('DELETE FROM timetable_slots WHERE class_id = ? AND day_of_week = ? AND period_index = ?').run(
      b.classId, Number(b.dayOfWeek), Number(b.periodIndex)
    );
    db.prepare('INSERT INTO timetable_slots VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      id, b.classId, b.subjectId, b.teacherId, Number(b.dayOfWeek), Number(b.periodIndex), b.timeRange || '', b.room || ''
    );
  });
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.delete('/api/timetable/:id', (req, res) => {
  db.prepare('DELETE FROM timetable_slots WHERE id = ?').run(req.params.id);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

// ---------------- ASSIGNMENTS & BEHAVIOR ----------------
app.post('/api/assignments', (req, res) => {
  const b = req.body || {};
  db.prepare('INSERT INTO assignments VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    uid('ASN'), b.classId, b.subjectId, b.teacherId || '', b.title,
    b.description || '', b.dueDate || '', Number(b.maxPoints || 20), b.status || 'open', todayStr()
  );
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.delete('/api/assignments/:id', (req, res) => {
  db.prepare('DELETE FROM assignments WHERE id = ?').run(req.params.id);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.post('/api/behavior', (req, res) => {
  const b = req.body || {};
  db.prepare('INSERT INTO behavior_records VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    uid('BHV'), b.studentId, b.date || todayStr(),
    b.type || 'merit', Number(b.points || 5), b.title, b.description || '', actorName(req)
  );
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.delete('/api/behavior/:id', (req, res) => {
  db.prepare('DELETE FROM behavior_records WHERE id = ?').run(req.params.id);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

// ---------------- FINANCE: INVOICES, PAYMENTS, EXPENSES ----------------
app.post('/api/invoices', (req, res) => {
  const b = req.body || {};
  const id = uid('INV');
  const cnt = db.prepare('SELECT COUNT(*) AS cnt FROM invoices').get().cnt + 1;
  const invoiceNo = `INV-2026-${String(cnt).padStart(4, '0')}`;
  const subtotal = Number(b.subtotal || 0);
  const discountAmount = Number(b.discountAmount || 0);
  const totalAmount = Math.max(0, subtotal - discountAmount);
  db.prepare('INSERT INTO invoices VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    id, invoiceNo, b.studentId, b.classId || '', b.title || 'ថ្លៃសិក្សា (Tuition Fee)',
    b.category || 'tuition', b.periodLabel || '2026-11',
    subtotal, discountAmount, totalAmount, 0,
    b.dueDate || '', totalAmount === 0 ? 'paid' : 'unpaid', '', '', b.notes || '', todayStr()
  );
  addAuditLog(actorName(req), actorRole(req), 'បង្កើតវិក្កយបត្រថ្មី', 'Finance', `${invoiceNo} ($${totalAmount})`);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.post('/api/invoices/generate-class', (req, res) => {
  const { classId, periodLabel, dueDate, title } = req.body || {};
  const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(classId);
  if (!cls) return res.status(400).json({ error: 'សូមបង្កើត និងជ្រើសរើសថ្នាក់រៀនជាមុនសិន / Class not found' });

  runInTransaction(() => {
    const roster = db.prepare("SELECT * FROM students WHERE class_id = ? AND status = 'active'").all(classId);
    let cnt = db.prepare('SELECT COUNT(*) AS cnt FROM invoices').get().cnt;
    const ins = db.prepare('INSERT OR IGNORE INTO invoices VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const s of roster) {
      const invId = `INV-${s.id}-${(periodLabel || '2026-11').replace('-', '')}`;
      const exists = db.prepare('SELECT id FROM invoices WHERE id = ?').get(invId);
      if (exists) continue;
      cnt += 1;
      const subtotal = Number(cls.monthly_tuition || 120);
      const disc = Math.round((subtotal * Number(s.scholarship_pct || 0)) / 100);
      const total = Math.max(0, subtotal - disc);
      ins.run(
        invId,
        `INV-2026-${String(cnt).padStart(4, '0')}`,
        s.id,
        classId,
        title || `ថ្លៃសិក្សាប្រចាំខែ ${periodLabel}`,
        'tuition',
        periodLabel || '2026-11',
        subtotal,
        disc,
        total,
        0,
        dueDate || '2026-11-10',
        total === 0 ? 'paid' : 'unpaid',
        total === 0 ? 'Scholarship 100%' : '',
        '',
        s.scholarship_pct > 0 ? `អាហារូបករណ៍ ${s.scholarship_pct}%` : '',
        todayStr()
      );
    }
  });
  addAuditLog(actorName(req), actorRole(req), 'បង្កើតវិក្កយបត្រតាមថ្នាក់', 'Finance', `Generated tuition invoices for ${cls.name_kh} (${periodLabel})`);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.post('/api/payments', (req, res) => {
  const b = req.body || {};
  const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(b.invoiceId);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });

  const payAmt = Math.max(0.01, Number(b.amount || 0));
  const today = todayStr();

  runInTransaction(() => {
    const cnt = db.prepare('SELECT COUNT(*) AS cnt FROM payments').get().cnt + 1;
    const receiptNo = `RCP-2026-${String(cnt).padStart(4, '0')}`;
    db.prepare('INSERT INTO payments VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      uid('PAY'), receiptNo, inv.id, inv.student_id, payAmt,
      b.method || 'ABA KHQR', b.referenceNo || `TXN-${Date.now().toString().slice(-6)}`,
      actorName(req), today, b.notes || ''
    );
    const newPaid = Math.min(inv.total_amount, Number(inv.paid_amount) + payAmt);
    const newStatus = newPaid >= inv.total_amount ? 'paid' : 'partial';
    db.prepare('UPDATE invoices SET paid_amount = ?, status = ?, payment_method = ?, last_paid_at = ? WHERE id = ?').run(
      newPaid, newStatus, b.method || 'ABA KHQR', today, inv.id
    );
  });

  addAuditLog(actorName(req), actorRole(req), 'ទទួលប្រាក់បង់ថ្លៃសិក្សា', 'Finance', `Received $${payAmt} for ${inv.invoice_no}`);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.delete('/api/invoices/:id', (req, res) => {
  runInTransaction(() => {
    db.prepare('DELETE FROM payments WHERE invoice_id = ?').run(req.params.id);
    db.prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id);
  });
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.post('/api/expenses', (req, res) => {
  const b = req.body || {};
  const cnt = db.prepare('SELECT COUNT(*) AS cnt FROM expenses').get().cnt + 1;
  db.prepare('INSERT INTO expenses VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    uid('EXP'), `EXP-2026-${String(cnt).padStart(3, '0')}`, b.title, b.category || 'supplies',
    Number(b.amount || 0), b.expenseDate || todayStr(),
    b.paidTo || '', b.method || 'Cash', b.notes || ''
  );
  addAuditLog(actorName(req), actorRole(req), 'កត់ត្រាចំណាយសាលា', 'Finance', `${b.title} ($${b.amount})`);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.delete('/api/expenses/:id', (req, res) => {
  db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

// ---------------- LIBRARY ----------------
app.post('/api/library/books', (req, res) => {
  const b = req.body || {};
  const total = Number(b.totalCopies || 5);
  db.prepare('INSERT INTO library_books VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    uid('BK'), b.bookCode || `LIB-${Date.now().toString().slice(-4)}`, b.isbn || '',
    b.titleKh, b.titleEn || '', b.author || '', b.category || 'General',
    b.shelf || 'A-01', total, Number(b.availableCopies ?? total), Number(b.publishYear || 2025)
  );
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.delete('/api/library/books/:id', (req, res) => {
  db.prepare('DELETE FROM library_books WHERE id = ?').run(req.params.id);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.post('/api/library/loans', (req, res) => {
  const b = req.body || {};
  const book = db.prepare('SELECT * FROM library_books WHERE id = ?').get(b.bookId);
  if (!book || book.available_copies <= 0) {
    return res.status(400).json({ error: 'សៀវភៅអស់ពីស្តុកបណ្ណាល័យ / No copies available' });
  }
  runInTransaction(() => {
    db.prepare('INSERT INTO library_loans VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      uid('LN'), b.bookId, b.borrowerType || 'student', b.borrowerId, b.borrowerName,
      b.issueDate || todayStr(), b.dueDate, '', 0, 'borrowed'
    );
    db.prepare('UPDATE library_books SET available_copies = MAX(0, available_copies - 1) WHERE id = ?').run(b.bookId);
  });
  addAuditLog(actorName(req), actorRole(req), 'ឱ្យខ្ចីសៀវភៅបណ្ណាល័យ', 'Library', `${b.borrowerName} borrowed ${book.title_kh}`);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.post('/api/library/loans/:id/return', (req, res) => {
  const loan = db.prepare('SELECT * FROM library_loans WHERE id = ?').get(req.params.id);
  if (!loan) return res.status(404).json({ error: 'Loan not found' });
  const today = todayStr();
  runInTransaction(() => {
    db.prepare("UPDATE library_loans SET status = 'returned', return_date = ? WHERE id = ?").run(today, loan.id);
    if (loan.status !== 'returned') {
      db.prepare('UPDATE library_books SET available_copies = MIN(total_copies, available_copies + 1) WHERE id = ?').run(loan.book_id);
    }
  });
  addAuditLog(actorName(req), actorRole(req), 'ទទួលសៀវភៅសងវិញ', 'Library', `${loan.borrower_name} returned book`);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

// ---------------- ANNOUNCEMENTS ----------------
app.post('/api/announcements', (req, res) => {
  const b = req.body || {};
  db.prepare('INSERT INTO announcements VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    uid('ANN'), b.titleKh, b.titleEn || '', b.contentKh, b.contentEn || '',
    b.audience || 'all', b.priority || 'normal', b.eventDate || '',
    actorName(req), b.pinned ? 1 : 0, todayStr()
  );
  addAuditLog(actorName(req), actorRole(req), 'ផ្សព្វផ្សាយសេចក្តីជូនដំណឹង', 'Announcements', b.titleKh);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.put('/api/announcements/:id', (req, res) => {
  const b = req.body || {};
  db.prepare('UPDATE announcements SET pinned = ? WHERE id = ?').run(b.pinned ? 1 : 0, req.params.id);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.delete('/api/announcements/:id', (req, res) => {
  db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

// ---------------- SETTINGS, BACKUP & CLEAN OPERATIONAL RESET ----------------
app.put('/api/settings', (req, res) => {
  const b = req.body || {};
  runInTransaction(() => {
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    for (const [k, v] of Object.entries(b)) {
      stmt.run(k, JSON.stringify(v));
    }
  });
  addAuditLog(actorName(req), actorRole(req), 'កែប្រែការកំណត់សាលា', 'Settings', 'Updated school configuration');
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.post('/api/backup/import', requireAdmin, (req, res) => {
  const payload = req.body || {};
  if (!Array.isArray(payload.students) || !Array.isArray(payload.classes)) {
    return res.status(400).json({ error: 'Invalid backup JSON format' });
  }
  populateWithData(payload, false);
  addAuditLog(actorName(req), actorRole(req), 'នាំចូលទិន្នន័យបម្រុងទុក', 'System', `Imported ${payload.students.length} students`);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.post('/api/system/clear-records', requireAdmin, (req, res) => {
  const currentSettings = getFullDatabaseSnapshot().settings;
  const cleanTemplate = buildInitialSeedData();
  cleanTemplate.settings = currentSettings;
  populateWithData(cleanTemplate, false);
  runInTransaction(() => {
    db.exec("UPDATE users SET linked_id = '';");
  });
  addAuditLog(actorName(req), actorRole(req), 'សម្អាតទិន្នន័យប្រតិបត្តិការសាលា', 'System', 'Cleared operational records while keeping real user accounts & school settings');
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

// Serve static production frontend when dist/ exists
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT || (isProd ? 3000 : 3001));
const HOST = process.env.HOST || (isProd ? '0.0.0.0' : '127.0.0.1');

app.listen(PORT, HOST, () => {
  console.log(`[Cambodia School ERP] Server listening on http://${HOST}:${PORT} (${isProd ? 'production unified' : 'dev api'})`);
});
