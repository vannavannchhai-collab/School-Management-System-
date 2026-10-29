import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { buildInitialSeedData } from './seedData.js';
import { hashPassword } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'school_erp.sqlite');
export const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = OFF;');

export function runInTransaction(fn) {
  db.exec('BEGIN IMMEDIATE;');
  try {
    const res = fn();
    db.exec('COMMIT;');
    return res;
  } catch (err) {
    try { db.exec('ROLLBACK;'); } catch {}
    throw err;
  }
}

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      name_kh TEXT NOT NULL,
      name_en TEXT NOT NULL,
      title_kh TEXT DEFAULT '',
      title_en TEXT DEFAULT '',
      email TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      linked_id TEXT DEFAULT '',
      avatar_color TEXT DEFAULT '#2563eb',
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT '',
      last_login_at TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      name_kh TEXT NOT NULL,
      name_en TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      max_score REAL DEFAULT 100,
      coefficient REAL DEFAULT 1,
      color TEXT DEFAULT '#2563eb'
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      teacher_code TEXT NOT NULL,
      name_kh TEXT NOT NULL,
      name_en TEXT NOT NULL,
      gender TEXT DEFAULT 'M',
      dob TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      address TEXT DEFAULT '',
      role_title_kh TEXT DEFAULT '',
      role_title_en TEXT DEFAULT '',
      department TEXT DEFAULT '',
      qualification TEXT DEFAULT '',
      specialization TEXT DEFAULT '',
      hire_date TEXT DEFAULT '',
      base_salary REAL DEFAULT 500,
      status TEXT DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      name_kh TEXT NOT NULL,
      name_en TEXT NOT NULL,
      grade_level INTEGER DEFAULT 1,
      category TEXT DEFAULT 'primary',
      track TEXT DEFAULT 'General',
      homeroom_teacher_id TEXT DEFAULT '',
      room TEXT DEFAULT '',
      shift TEXT DEFAULT 'Full-Day',
      schedule TEXT DEFAULT '',
      capacity INTEGER DEFAULT 35,
      monthly_tuition REAL DEFAULT 100,
      academic_year TEXT DEFAULT '2026-2027'
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      student_code TEXT NOT NULL,
      moeys_id TEXT DEFAULT '',
      name_kh TEXT NOT NULL,
      name_en TEXT NOT NULL,
      gender TEXT DEFAULT 'M',
      dob TEXT DEFAULT '',
      pob TEXT DEFAULT '',
      class_id TEXT DEFAULT '',
      enrollment_date TEXT DEFAULT '',
      guardian_name TEXT DEFAULT '',
      guardian_relation TEXT DEFAULT '',
      guardian_phone TEXT DEFAULT '',
      guardian_occupation TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      address TEXT DEFAULT '',
      scholarship_pct REAL DEFAULT 0,
      transport_opt TEXT DEFAULT '',
      status TEXT DEFAULT 'active',
      medical_notes TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      photo TEXT
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      class_id TEXT DEFAULT '',
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      check_in_time TEXT DEFAULT '',
      remarks TEXT DEFAULT '',
      recorded_by TEXT DEFAULT '',
      UNIQUE(student_id, date)
    );

    CREATE TABLE IF NOT EXISTS grades (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      class_id TEXT DEFAULT '',
      subject_id TEXT NOT NULL,
      subject_name TEXT DEFAULT '',
      period_code TEXT NOT NULL,
      score REAL NOT NULL,
      max_score REAL DEFAULT 100,
      remarks TEXT DEFAULT '',
      updated_at TEXT DEFAULT '',
      UNIQUE(student_id, subject_id, period_code)
    );

    CREATE TABLE IF NOT EXISTS timetable_slots (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      day_of_week INTEGER NOT NULL,
      period_index INTEGER NOT NULL,
      time_range TEXT DEFAULT '',
      room TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS exams (
      id TEXT PRIMARY KEY,
      title_kh TEXT NOT NULL,
      title_en TEXT DEFAULT '',
      period_code TEXT NOT NULL,
      exam_type TEXT DEFAULT 'monthly',
      class_id TEXT DEFAULT 'all',
      start_date TEXT DEFAULT '',
      end_date TEXT DEFAULT '',
      status TEXT DEFAULT 'scheduled'
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      teacher_id TEXT DEFAULT '',
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      due_date TEXT DEFAULT '',
      max_points REAL DEFAULT 20,
      status TEXT DEFAULT 'open',
      created_at TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS behavior_records (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      points INTEGER DEFAULT 0,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      recorded_by TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_no TEXT NOT NULL,
      student_id TEXT NOT NULL,
      class_id TEXT DEFAULT '',
      title TEXT NOT NULL,
      category TEXT DEFAULT 'tuition',
      period_label TEXT DEFAULT '',
      subtotal REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      due_date TEXT DEFAULT '',
      status TEXT DEFAULT 'unpaid',
      payment_method TEXT DEFAULT '',
      last_paid_at TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      receipt_no TEXT NOT NULL,
      invoice_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      amount REAL NOT NULL,
      method TEXT DEFAULT 'Cash',
      reference_no TEXT DEFAULT '',
      received_by TEXT DEFAULT '',
      paid_at TEXT DEFAULT '',
      notes TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      expense_no TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT DEFAULT 'other',
      amount REAL NOT NULL,
      expense_date TEXT NOT NULL,
      paid_to TEXT DEFAULT '',
      method TEXT DEFAULT 'Cash',
      notes TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS payrolls (
      id TEXT PRIMARY KEY,
      payroll_no TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      month_key TEXT NOT NULL,
      base_salary REAL DEFAULT 0,
      allowance REAL DEFAULT 0,
      bonus REAL DEFAULT 0,
      deduction REAL DEFAULT 0,
      net_salary REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      paid_at TEXT DEFAULT '',
      payment_method TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      UNIQUE(teacher_id, month_key)
    );

    CREATE TABLE IF NOT EXISTS teacher_leaves (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL,
      leave_type TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      days INTEGER DEFAULT 1,
      reason TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      approved_by TEXT DEFAULT '',
      created_at TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS library_books (
      id TEXT PRIMARY KEY,
      book_code TEXT NOT NULL,
      isbn TEXT DEFAULT '',
      title_kh TEXT NOT NULL,
      title_en TEXT DEFAULT '',
      author TEXT DEFAULT '',
      category TEXT DEFAULT '',
      shelf TEXT DEFAULT '',
      total_copies INTEGER DEFAULT 1,
      available_copies INTEGER DEFAULT 1,
      publish_year INTEGER DEFAULT 2024
    );

    CREATE TABLE IF NOT EXISTS library_loans (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL,
      borrower_type TEXT DEFAULT 'student',
      borrower_id TEXT NOT NULL,
      borrower_name TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      return_date TEXT DEFAULT '',
      fine_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'borrowed'
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title_kh TEXT NOT NULL,
      title_en TEXT DEFAULT '',
      content_kh TEXT NOT NULL,
      content_en TEXT DEFAULT '',
      audience TEXT DEFAULT 'all',
      priority TEXT DEFAULT 'normal',
      event_date TEXT DEFAULT '',
      author_name TEXT DEFAULT '',
      pinned INTEGER DEFAULT 0,
      created_at TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_name TEXT NOT NULL,
      role TEXT DEFAULT '',
      action TEXT NOT NULL,
      module TEXT DEFAULT '',
      details TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
    CREATE INDEX IF NOT EXISTS idx_grades_student_period ON grades(student_id, period_code);
    CREATE INDEX IF NOT EXISTS idx_invoices_student ON invoices(student_id);
  `);

  // Safe column migrations for older DB files
  const userCols = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
  if (!userCols.includes('status')) {
    db.exec("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active';");
  }
  if (!userCols.includes('created_at')) {
    db.exec("ALTER TABLE users ADD COLUMN created_at TEXT DEFAULT '';");
  }
  if (!userCols.includes('last_login_at')) {
    db.exec("ALTER TABLE users ADD COLUMN last_login_at TEXT DEFAULT '';");
  }
}

export function mapUserRow(r) {
  if (!r) return null;
  return {
    id: r.id,
    username: r.username,
    role: r.role,
    nameKh: r.name_kh,
    nameEn: r.name_en,
    titleKh: r.title_kh || '',
    titleEn: r.title_en || '',
    email: r.email || '',
    phone: r.phone || '',
    linkedId: r.linked_id || '',
    avatarColor: r.avatar_color || '#2563eb',
    status: r.status || 'active',
    createdAt: r.created_at || '',
    lastLoginAt: r.last_login_at || '',
  };
}

export function populateWithData(data, resetExistingUsers = false) {
  runInTransaction(() => {
    const tables = [
      'settings', 'subjects', 'teachers', 'classes', 'students',
      'attendance', 'grades', 'timetable_slots', 'exams', 'assignments',
      'behavior_records', 'invoices', 'payments', 'expenses', 'payrolls',
      'teacher_leaves', 'library_books', 'library_loans', 'announcements', 'audit_logs',
    ];
    for (const tb of tables) {
      db.exec(`DELETE FROM ${tb};`);
    }
    if (resetExistingUsers) {
      db.exec('DELETE FROM users;');
      const insUser = db.prepare(`
        INSERT INTO users (id, username, password_hash, role, name_kh, name_en, title_kh, title_en, email, phone, linked_id, avatar_color, status, created_at, last_login_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const u of data.users || []) {
        if (!u.passwordHash && !u.passwordPlain) continue;
        insUser.run(
          u.id,
          u.username,
          u.passwordHash || hashPassword(u.passwordPlain),
          u.role,
          u.nameKh,
          u.nameEn || u.nameKh,
          u.titleKh || '',
          u.titleEn || '',
          u.email || '',
          u.phone || '',
          u.linkedId || '',
          u.avatarColor || '#2563eb',
          u.status || 'active',
          u.createdAt || new Date().toISOString().slice(0, 10),
          u.lastLoginAt || ''
        );
      }
    }

    const mergedSettings = {
      ...buildInitialSeedData().settings,
      ...(data.settings || {}),
    };
    const insSet = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    for (const [k, v] of Object.entries(mergedSettings)) {
      insSet.run(k, JSON.stringify(v));
    }

    const insSub = db.prepare('INSERT INTO subjects VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    for (const s of data.subjects || []) {
      insSub.run(s.id, s.code, s.nameKh, s.nameEn, s.category || 'general', s.maxScore ?? 100, s.coefficient ?? 1, s.color || '#2563eb');
    }

    const insTch = db.prepare('INSERT INTO teachers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const t of data.teachers || []) {
      insTch.run(
        t.id, t.teacherCode, t.nameKh, t.nameEn, t.gender || 'M', t.dob || '', t.phone || '',
        t.email || '', t.address || '', t.roleTitleKh || '', t.roleTitleEn || '', t.department || '',
        t.qualification || '', t.specialization || '', t.hireDate || '', t.baseSalary ?? 500, t.status || 'active'
      );
    }

    const insCls = db.prepare('INSERT INTO classes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const c of data.classes || []) {
      insCls.run(
        c.id, c.code, c.nameKh, c.nameEn, c.gradeLevel ?? 1, c.category || 'primary', c.track || 'General',
        c.homeroomTeacherId || '', c.room || '', c.shift || 'Full-Day', c.schedule || '',
        c.capacity ?? 35, c.monthlyTuition ?? 100, c.academicYear || '2026-2027'
      );
    }

    const insStu = db.prepare('INSERT INTO students VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const s of data.students || []) {
      insStu.run(
        s.id, s.studentCode, s.moeysId || '', s.nameKh, s.nameEn, s.gender || 'M', s.dob || '', s.pob || '',
        s.classId || '', s.enrollmentDate || '', s.guardianName || '', s.guardianRelation || '',
        s.guardianPhone || '', s.guardianOccupation || '', s.phone || '', s.email || '', s.address || '',
        s.scholarshipPct ?? 0, s.transportOpt || '', s.status || 'active', s.medicalNotes || '', s.notes || '', s.photo || null
      );
    }

    const insAtt = db.prepare('INSERT OR REPLACE INTO attendance VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    for (const a of data.attendance || []) {
      insAtt.run(a.id, a.studentId, a.classId || '', a.date, a.status, a.checkInTime || '', a.remarks || '', a.recordedBy || '');
    }

    const insGrd = db.prepare('INSERT OR REPLACE INTO grades VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const g of data.grades || []) {
      insGrd.run(g.id, g.studentId, g.classId || '', g.subjectId, g.subjectName || '', g.periodCode, g.score, g.maxScore ?? 100, g.remarks || '', g.updatedAt || '');
    }

    const insTt = db.prepare('INSERT INTO timetable_slots VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    for (const tt of data.timetable || []) {
      insTt.run(tt.id, tt.classId, tt.subjectId, tt.teacherId, tt.dayOfWeek, tt.periodIndex, tt.timeRange || '', tt.room || '');
    }

    const insEx = db.prepare('INSERT INTO exams VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const ex of data.exams || []) {
      insEx.run(ex.id, ex.titleKh, ex.titleEn || '', ex.periodCode, ex.examType || 'monthly', ex.classId || 'all', ex.startDate || '', ex.endDate || '', ex.status || 'scheduled');
    }

    const insAsn = db.prepare('INSERT INTO assignments VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const a of data.assignments || []) {
      insAsn.run(a.id, a.classId, a.subjectId, a.teacherId || '', a.title, a.description || '', a.dueDate || '', a.maxPoints ?? 20, a.status || 'open', a.createdAt || '');
    }

    const insBhv = db.prepare('INSERT INTO behavior_records VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    for (const b of data.behaviorRecords || []) {
      insBhv.run(b.id, b.studentId, b.date, b.type, b.points ?? 0, b.title, b.description || '', b.recordedBy || '');
    }

    const insInv = db.prepare('INSERT INTO invoices VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const iv of data.invoices || []) {
      insInv.run(
        iv.id, iv.invoiceNo, iv.studentId, iv.classId || '', iv.title, iv.category || 'tuition', iv.periodLabel || '',
        iv.subtotal ?? 0, iv.discountAmount ?? 0, iv.totalAmount ?? 0, iv.paidAmount ?? 0,
        iv.dueDate || '', iv.status || 'unpaid', iv.paymentMethod || '', iv.lastPaidAt || '', iv.notes || '', iv.createdAt || ''
      );
    }

    const insPay = db.prepare('INSERT INTO payments VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const p of data.payments || []) {
      insPay.run(p.id, p.receiptNo, p.invoiceId, p.studentId, p.amount, p.method || 'Cash', p.referenceNo || '', p.receivedBy || '', p.paidAt || '', p.notes || '');
    }

    const insExp = db.prepare('INSERT INTO expenses VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const ex of data.expenses || []) {
      insExp.run(ex.id, ex.expenseNo, ex.title, ex.category || 'other', ex.amount, ex.expenseDate, ex.paidTo || '', ex.method || 'Cash', ex.notes || '');
    }

    const insPr = db.prepare('INSERT OR REPLACE INTO payrolls VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const pr of data.payrolls || []) {
      insPr.run(
        pr.id, pr.payrollNo, pr.teacherId, pr.monthKey, pr.baseSalary ?? 0, pr.allowance ?? 0,
        pr.bonus ?? 0, pr.deduction ?? 0, pr.netSalary ?? 0, pr.status || 'pending', pr.paidAt || '', pr.paymentMethod || '', pr.notes || ''
      );
    }

    const insLv = db.prepare('INSERT INTO teacher_leaves VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const lv of data.teacherLeaves || []) {
      insLv.run(lv.id, lv.teacherId, lv.leaveType, lv.startDate, lv.endDate, lv.days ?? 1, lv.reason || '', lv.status || 'pending', lv.approvedBy || '', lv.createdAt || '');
    }

    const insBk = db.prepare('INSERT INTO library_books VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const bk of data.libraryBooks || []) {
      insBk.run(bk.id, bk.bookCode, bk.isbn || '', bk.titleKh, bk.titleEn || '', bk.author || '', bk.category || '', bk.shelf || '', bk.totalCopies ?? 1, bk.availableCopies ?? 1, bk.publishYear ?? 2024);
    }

    const insLn = db.prepare('INSERT INTO library_loans VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const ln of data.libraryLoans || []) {
      insLn.run(ln.id, ln.bookId, ln.borrowerType || 'student', ln.borrowerId, ln.borrowerName, ln.issueDate, ln.dueDate, ln.returnDate || '', ln.fineAmount ?? 0, ln.status || 'borrowed');
    }

    const insAnn = db.prepare('INSERT INTO announcements VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const a of data.announcements || []) {
      insAnn.run(a.id, a.titleKh, a.titleEn || '', a.contentKh, a.contentEn || '', a.audience || 'all', a.priority || 'normal', a.eventDate || '', a.authorName || '', a.pinned ? 1 : 0, a.createdAt || '');
    }

    const insLog = db.prepare('INSERT INTO audit_logs VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const l of data.auditLogs || []) {
      insLog.run(l.id, l.userName, l.role || '', l.action, l.module || '', l.details || '', l.createdAt);
    }
  });
}

export function ensureSeeded() {
  initSchema();
  // Purge any legacy demo accounts if an older sqlite file had usr-admin/usr-teacher/etc.
  const demoCheck = db.prepare("SELECT COUNT(*) AS cnt FROM users WHERE id IN ('usr-admin', 'usr-teacher', 'usr-accountant', 'usr-student')").get();
  if (demoCheck && demoCheck.cnt > 0) {
    const clean = buildInitialSeedData();
    populateWithData(clean, true);
    return;
  }

  const countRow = db.prepare('SELECT COUNT(*) AS cnt FROM settings').get();
  if (!countRow || countRow.cnt === 0) {
    const initial = buildInitialSeedData();
    populateWithData(initial, false);
  }
}

export function addAuditLog(userName, role, action, module, details) {
  const id = `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  db.prepare('INSERT INTO audit_logs VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    id,
    userName || 'System',
    role || 'admin',
    action,
    module,
    details,
    now
  );
}

export function getFullDatabaseSnapshot() {
  const defaultSettings = buildInitialSeedData().settings;
  const settingsRows = db.prepare('SELECT key, value FROM settings').all();
  const settings = { ...defaultSettings };
  for (const r of settingsRows) {
    try { settings[r.key] = JSON.parse(r.value); } catch { settings[r.key] = r.value; }
  }

  const subjects = db.prepare('SELECT * FROM subjects').all().map((r) => ({
    id: r.id, code: r.code, nameKh: r.name_kh, nameEn: r.name_en,
    category: r.category, maxScore: r.max_score, coefficient: r.coefficient, color: r.color,
  }));

  const teachers = db.prepare('SELECT * FROM teachers').all().map((r) => ({
    id: r.id, teacherCode: r.teacher_code, nameKh: r.name_kh, nameEn: r.name_en,
    gender: r.gender, dob: r.dob, phone: r.phone, email: r.email, address: r.address,
    roleTitleKh: r.role_title_kh, roleTitleEn: r.role_title_en, department: r.department,
    qualification: r.qualification, specialization: r.specialization, hireDate: r.hire_date,
    baseSalary: r.base_salary, status: r.status,
  }));

  const classes = db.prepare('SELECT * FROM classes').all().map((r) => ({
    id: r.id, code: r.code, nameKh: r.name_kh, nameEn: r.name_en,
    gradeLevel: r.grade_level, category: r.category, track: r.track,
    homeroomTeacherId: r.homeroom_teacher_id, room: r.room, shift: r.shift,
    schedule: r.schedule, capacity: r.capacity, monthlyTuition: r.monthly_tuition, academicYear: r.academic_year,
  }));

  const students = db.prepare('SELECT * FROM students').all().map((r) => ({
    id: r.id, studentCode: r.student_code, moeysId: r.moeys_id,
    nameKh: r.name_kh, nameEn: r.name_en, gender: r.gender, dob: r.dob, pob: r.pob,
    classId: r.class_id, enrollmentDate: r.enrollment_date,
    guardianName: r.guardian_name, guardianRelation: r.guardian_relation,
    guardianPhone: r.guardian_phone, guardianOccupation: r.guardian_occupation,
    phone: r.phone, email: r.email, address: r.address,
    scholarshipPct: r.scholarship_pct, transportOpt: r.transport_opt,
    status: r.status, medicalNotes: r.medical_notes, notes: r.notes, photo: r.photo,
  }));

  const attendance = db.prepare('SELECT * FROM attendance').all().map((r) => ({
    id: r.id, studentId: r.student_id, classId: r.class_id, date: r.date,
    status: r.status, checkInTime: r.check_in_time, remarks: r.remarks, recordedBy: r.recorded_by,
  }));

  const grades = db.prepare('SELECT * FROM grades').all().map((r) => ({
    id: r.id, studentId: r.student_id, classId: r.class_id,
    subjectId: r.subject_id, subjectName: r.subject_name, periodCode: r.period_code,
    score: r.score, maxScore: r.max_score, remarks: r.remarks, updatedAt: r.updated_at,
  }));

  const timetable = db.prepare('SELECT * FROM timetable_slots').all().map((r) => ({
    id: r.id, classId: r.class_id, subjectId: r.subject_id, teacherId: r.teacher_id,
    dayOfWeek: r.day_of_week, periodIndex: r.period_index, timeRange: r.time_range, room: r.room,
  }));

  const exams = db.prepare('SELECT * FROM exams').all().map((r) => ({
    id: r.id, titleKh: r.title_kh, titleEn: r.title_en, periodCode: r.period_code,
    examType: r.exam_type, classId: r.class_id, startDate: r.start_date, endDate: r.end_date, status: r.status,
  }));

  const assignments = db.prepare('SELECT * FROM assignments ORDER BY due_date ASC').all().map((r) => ({
    id: r.id, classId: r.class_id, subjectId: r.subject_id, teacherId: r.teacher_id,
    title: r.title, description: r.description, dueDate: r.due_date,
    maxPoints: r.max_points, status: r.status, createdAt: r.created_at,
  }));

  const behaviorRecords = db.prepare('SELECT * FROM behavior_records ORDER BY date DESC').all().map((r) => ({
    id: r.id, studentId: r.student_id, date: r.date, type: r.type,
    points: r.points, title: r.title, description: r.description, recordedBy: r.recorded_by,
  }));

  const invoices = db.prepare('SELECT * FROM invoices ORDER BY created_at DESC, invoice_no ASC').all().map((r) => ({
    id: r.id, invoiceNo: r.invoice_no, studentId: r.student_id, classId: r.class_id,
    title: r.title, category: r.category, periodLabel: r.period_label,
    subtotal: r.subtotal, discountAmount: r.discount_amount, totalAmount: r.total_amount,
    paidAmount: r.paid_amount, dueDate: r.due_date, status: r.status,
    paymentMethod: r.payment_method, lastPaidAt: r.last_paid_at, notes: r.notes, createdAt: r.created_at,
  }));

  const payments = db.prepare('SELECT * FROM payments ORDER BY paid_at DESC').all().map((r) => ({
    id: r.id, receiptNo: r.receipt_no, invoiceId: r.invoice_id, studentId: r.student_id,
    amount: r.amount, method: r.method, referenceNo: r.reference_no,
    receivedBy: r.received_by, paidAt: r.paid_at, notes: r.notes,
  }));

  const expenses = db.prepare('SELECT * FROM expenses ORDER BY expense_date DESC').all().map((r) => ({
    id: r.id, expenseNo: r.expense_no, title: r.title, category: r.category,
    amount: r.amount, expenseDate: r.expense_date, paidTo: r.paid_to, method: r.method, notes: r.notes,
  }));

  const payrolls = db.prepare('SELECT * FROM payrolls ORDER BY month_key DESC, payroll_no ASC').all().map((r) => ({
    id: r.id, payrollNo: r.payroll_no, teacherId: r.teacher_id, monthKey: r.month_key,
    baseSalary: r.base_salary, allowance: r.allowance, bonus: r.bonus,
    deduction: r.deduction, netSalary: r.net_salary, status: r.status,
    paidAt: r.paid_at, paymentMethod: r.payment_method, notes: r.notes,
  }));

  const teacherLeaves = db.prepare('SELECT * FROM teacher_leaves ORDER BY created_at DESC').all().map((r) => ({
    id: r.id, teacherId: r.teacher_id, leaveType: r.leave_type,
    startDate: r.start_date, endDate: r.end_date, days: r.days,
    reason: r.reason, status: r.status, approvedBy: r.approved_by, createdAt: r.created_at,
  }));

  const libraryBooks = db.prepare('SELECT * FROM library_books').all().map((r) => ({
    id: r.id, bookCode: r.book_code, isbn: r.isbn, titleKh: r.title_kh, titleEn: r.title_en,
    author: r.author, category: r.category, shelf: r.shelf,
    totalCopies: r.total_copies, availableCopies: r.available_copies, publishYear: r.publish_year,
  }));

  const libraryLoans = db.prepare('SELECT * FROM library_loans ORDER BY issue_date DESC').all().map((r) => ({
    id: r.id, bookId: r.book_id, borrowerType: r.borrower_type, borrowerId: r.borrower_id,
    borrowerName: r.borrower_name, issueDate: r.issue_date, dueDate: r.due_date,
    returnDate: r.return_date, fineAmount: r.fine_amount, status: r.status,
  }));

  const announcements = db.prepare('SELECT * FROM announcements ORDER BY pinned DESC, created_at DESC').all().map((r) => ({
    id: r.id, titleKh: r.title_kh, titleEn: r.title_en, contentKh: r.content_kh, contentEn: r.content_en,
    audience: r.audience, priority: r.priority, eventDate: r.event_date,
    authorName: r.author_name, pinned: Boolean(r.pinned), createdAt: r.created_at,
  }));

  const auditLogs = db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100').all().map((r) => ({
    id: r.id, userName: r.user_name, role: r.role, action: r.action,
    module: r.module, details: r.details, createdAt: r.created_at,
  }));

  const users = db
    .prepare('SELECT id, username, role, name_kh, name_en, title_kh, title_en, email, phone, linked_id, avatar_color, status, created_at, last_login_at FROM users ORDER BY created_at DESC')
    .all()
    .map(mapUserRow);

  return {
    settings,
    users,
    subjects,
    teachers,
    classes,
    students,
    attendance,
    grades,
    timetable,
    exams,
    assignments,
    behaviorRecords,
    invoices,
    payments,
    expenses,
    payrolls,
    teacherLeaves,
    libraryBooks,
    libraryLoans,
    announcements,
    auditLogs,
  };
}
