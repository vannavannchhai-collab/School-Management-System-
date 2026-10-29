import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import {
  db,
  ensureSeeded,
  getFullDatabaseSnapshot,
  populateWithData,
  runInTransaction,
  addAuditLog,
} from './db.js';
import { buildInitialSeedData } from './seedData.js';
import { authOptionalMiddleware, signToken, verifyPassword } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');

ensureSeeded();

const app = express();
app.use(express.json({ limit: '15mb' }));
app.use(authOptionalMiddleware);

const uid = (prefix = 'ID') => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
const actorName = (req) => (req.user ? req.user.nameKh || req.user.username : 'ប្រព័ន្ធ / Admin');
const actorRole = (req) => (req.user ? req.user.role : 'admin');

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    engine: 'node:sqlite (WAL)',
    mode: 'fullstack_hybrid',
    timestamp: new Date().toISOString(),
  });
});

// Authentication
app.post('/api/auth/login', (req, res) => {
  const { username, password, demoRole } = req.body || {};

  let row = null;
  if (demoRole) {
    row = db.prepare('SELECT * FROM users WHERE role = ? LIMIT 1').get(demoRole);
  } else if (username) {
    row = db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)').get(String(username).trim());
    if (!row || !verifyPassword(String(password || ''), row.password_hash)) {
      return res.status(401).json({ error: 'ឈ្មោះអ្នកប្រើប្រាស់ ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ / Invalid credentials' });
    }
  }

  if (!row) {
    return res.status(401).json({ error: 'រកមិនឃើញគណនីអ្នកប្រើប្រាស់ / User not found' });
  }

  const user = {
    id: row.id,
    username: row.username,
    role: row.role,
    nameKh: row.name_kh,
    nameEn: row.name_en,
    titleKh: row.title_kh,
    titleEn: row.title_en,
    email: row.email,
    phone: row.phone,
    linkedId: row.linked_id,
    avatarColor: row.avatar_color,
  };

  const token = signToken({ id: user.id, username: user.username, role: user.role, nameKh: user.nameKh, linkedId: user.linkedId });
  addAuditLog(user.nameKh, user.role, 'ចូលប្រើប្រព័ន្ធ (Login)', 'Auth', `Logged in as ${user.username} (${user.role})`);
  res.json({ token, user });
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
    b.gender || 'M', b.dob || '', b.pob || '', b.classId || '', b.enrollmentDate || new Date().toISOString().slice(0, 10),
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
    b.hireDate || new Date().toISOString().slice(0, 10), Number(b.baseSalary || 500), b.status || 'active'
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
    Number(b.days || 1), b.reason || '', 'pending', '', new Date().toISOString().slice(0, 10)
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
  const paidAt = status === 'paid' ? (b.paidAt || new Date().toISOString().slice(0, 10)) : '';
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
  const today = new Date().toISOString().slice(0, 10);
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
    b.description || '', b.dueDate || '', Number(b.maxPoints || 20), b.status || 'open', new Date().toISOString().slice(0, 10)
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
    uid('BHV'), b.studentId, b.date || new Date().toISOString().slice(0, 10),
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
    b.dueDate || '', totalAmount === 0 ? 'paid' : 'unpaid', '', '', b.notes || '', new Date().toISOString().slice(0, 10)
  );
  addAuditLog(actorName(req), actorRole(req), 'បង្កើតវិក្កយបត្រថ្មី', 'Finance', `${invoiceNo} ($${totalAmount})`);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.post('/api/invoices/generate-class', (req, res) => {
  const { classId, periodLabel, dueDate, title } = req.body || {};
  const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(classId);
  if (!cls) return res.status(400).json({ error: 'Class not found' });

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
        new Date().toISOString().slice(0, 10)
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
  const today = new Date().toISOString().slice(0, 10);

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
    Number(b.amount || 0), b.expenseDate || new Date().toISOString().slice(0, 10),
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
      b.issueDate || new Date().toISOString().slice(0, 10), b.dueDate, '', 0, 'borrowed'
    );
    db.prepare('UPDATE library_books SET available_copies = MAX(0, available_copies - 1) WHERE id = ?').run(b.bookId);
  });
  addAuditLog(actorName(req), actorRole(req), 'ឱ្យខ្ចីសៀវភៅបណ្ណាល័យ', 'Library', `${b.borrowerName} borrowed ${book.title_kh}`);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.post('/api/library/loans/:id/return', (req, res) => {
  const loan = db.prepare('SELECT * FROM library_loans WHERE id = ?').get(req.params.id);
  if (!loan) return res.status(404).json({ error: 'Loan not found' });
  const today = new Date().toISOString().slice(0, 10);
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
    actorName(req), b.pinned ? 1 : 0, new Date().toISOString().slice(0, 10)
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

// ---------------- SETTINGS, BACKUP & RESET ----------------
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

app.post('/api/backup/import', (req, res) => {
  const payload = req.body || {};
  if (!Array.isArray(payload.students) || !Array.isArray(payload.classes)) {
    return res.status(400).json({ error: 'Invalid backup JSON format' });
  }
  populateWithData(payload, false);
  addAuditLog(actorName(req), actorRole(req), 'នាំចូលទិន្នន័យបម្រុងទុក', 'System', `Imported ${payload.students.length} students`);
  res.json({ ok: true, snapshot: getFullDatabaseSnapshot() });
});

app.post('/api/seed/reset', (req, res) => {
  const seed = buildInitialSeedData();
  populateWithData(seed, true);
  addAuditLog(actorName(req), actorRole(req), 'កំណត់ទិន្នន័យគំរូឡើងវិញ', 'System', 'Reset database to full sample dataset');
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
