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
  SchoolSettings,
  Student,
  Subject,
  Teacher,
  TeacherLeave,
  TimetableSlot,
  UserAccount,
  UserRole,
} from '../types';

const STORAGE_KEY = 'school_erp_hybrid_cache_v2';
const TOKEN_KEY = 'school_erp_auth_token';
const USER_KEY = 'school_erp_auth_user';

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

export function getStoredToken(): string | null {
  return safeGet(TOKEN_KEY);
}

export function getStoredUser(): UserAccount | null {
  const raw = safeGet(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserAccount;
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

export function loadLocalSnapshot(): DatabaseSnapshot {
  const raw = safeGet(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.students) && Array.isArray(parsed.classes)) {
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

async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const resp = await fetch(url, { ...options, headers, signal: controller.signal });
    if (!resp.ok) {
      let errMsg = `HTTP ${resp.status}`;
      try {
        const errBody = await resp.json();
        if (errBody?.error) errMsg = errBody.error;
      } catch {
        // ignore
      }
      const error = new Error(errMsg) as Error & { isHttpError?: boolean; status?: number };
      error.isHttpError = true;
      error.status = resp.status;
      throw error;
    }
    return (await resp.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();

export const dataEngine = {
  async bootstrap(): Promise<{ snapshot: DatabaseSnapshot; mode: ConnectionMode }> {
    try {
      const snapshot = await apiRequest<DatabaseSnapshot>('./api/bootstrap');
      persistLocalSnapshot(snapshot);
      return { snapshot, mode: 'online' };
    } catch {
      const snapshot = loadLocalSnapshot();
      return { snapshot, mode: 'offline' };
    }
  },

  async login(params: { username?: string; password?: string; demoRole?: UserRole }): Promise<{
    user: UserAccount;
    token: string;
    mode: ConnectionMode;
  }> {
    try {
      const res = await apiRequest<{ token: string; user: UserAccount }>('./api/auth/login', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      saveAuthSession(res.token, res.user);
      return { ...res, mode: 'online' };
    } catch (err: unknown) {
      const typedErr = err as { isHttpError?: boolean; status?: number; message?: string };
      if (typedErr?.isHttpError && typedErr.status === 401) {
        throw new Error(typedErr.message || 'Invalid credentials');
      }
      // Offline PWA fallback login against seed credentials
      const seed = buildInitialSeedData();
      let match = null;
      if (params.demoRole) {
        match = seed.users.find((u) => u.role === params.demoRole) || null;
      } else if (params.username) {
        match =
          seed.users.find(
            (u) =>
              u.username.toLowerCase() === params.username!.trim().toLowerCase() &&
              u.passwordPlain === params.password
          ) || null;
      }
      if (!match) {
        throw new Error('ឈ្មោះអ្នកប្រើប្រាស់ ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ / Invalid credentials');
      }
      const { passwordPlain: _pw, ...cleanUser } = match;
      const token = `offline-token-${cleanUser.role}-${Date.now()}`;
      saveAuthSession(token, cleanUser);
      return { user: cleanUser, token, mode: 'offline' };
    }
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
      const typedErr = err as { isHttpError?: boolean; status?: number; message?: string };
      if (typedErr?.isHttpError && typedErr.status && typedErr.status >= 400 && typedErr.status < 500) {
        throw new Error(typedErr.message || 'Request error');
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
        p.netSalary = Math.max(0, Number(p.baseSalary) + Number(p.allowance) + Number(p.bonus) - Number(p.deduction));
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
          recordedBy: 'Teacher',
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
          (x) => x.studentId === g.studentId && x.subjectId === g.subjectId && x.periodCode === g.periodCode
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
        (t) => !(t.classId === slot.classId && t.dayOfWeek === slot.dayOfWeek && t.periodIndex === slot.periodIndex)
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
        recordedBy: 'Teacher',
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

  generateClassInvoices(payload: { classId: string; periodLabel: string; dueDate: string; title: string }) {
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

  recordPayment(payload: { invoiceId: string; amount: number; method: string; referenceNo?: string; notes?: string }) {
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
        receivedBy: 'Accountant',
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
        authorName: 'រដ្ឋបាលសាលា',
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
      Object.assign(draft, payload);
    });
  },

  resetToDemoSeed() {
    return this.mutate('/seed/reset', 'POST', {}, (draft) => {
      Object.assign(draft, buildInitialSeedData());
    });
  },
};
