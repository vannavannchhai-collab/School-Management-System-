export type Lang = 'km' | 'en';
export type UserRole = 'admin' | 'teacher' | 'accountant' | 'student';

export type ModuleId =
  | 'dashboard'
  | 'students'
  | 'academic'
  | 'teachers'
  | 'timetable'
  | 'attendance'
  | 'grades'
  | 'assignments'
  | 'finance'
  | 'library'
  | 'announcements'
  | 'reports'
  | 'users'
  | 'settings';

export interface SchoolSettings {
  schoolNameKh: string;
  schoolNameEn: string;
  ministryHeaderKh: string;
  ministryHeaderEn: string;
  mottoKh: string;
  mottoEn: string;
  principalNameKh: string;
  principalNameEn: string;
  academicYear: string;
  currentSemester: string;
  exchangeRate: number;
  phone: string;
  email: string;
  website: string;
  addressKh: string;
  addressEn: string;
}

export interface UserAccount {
  id: string;
  username: string;
  role: UserRole;
  nameKh: string;
  nameEn: string;
  titleKh: string;
  titleEn: string;
  email: string;
  phone: string;
  linkedId: string;
  avatarColor: string;
  status?: 'active' | 'suspended';
  createdAt?: string;
  lastLoginAt?: string;
}

export interface RegisterAccountPayload {
  username: string;
  password: string;
  role: UserRole;
  nameKh: string;
  nameEn?: string;
  titleKh?: string;
  titleEn?: string;
  email?: string;
  phone?: string;
  gender?: 'M' | 'F' | 'O';
  dob?: string;
  classId?: string;
  linkedId?: string;
  studentCode?: string;
  teacherCode?: string;
  guardianName?: string;
  guardianPhone?: string;
  specialization?: string;
  schoolNameKh?: string;
  schoolNameEn?: string;
  addressKh?: string;
  avatarColor?: string;
  autoCreateProfile?: boolean;
}

export interface Subject {
  id: string;
  code: string;
  nameKh: string;
  nameEn: string;
  category: string;
  maxScore: number;
  coefficient: number;
  color: string;
}

export interface Teacher {
  id: string;
  teacherCode: string;
  nameKh: string;
  nameEn: string;
  gender: 'M' | 'F' | 'O';
  dob: string;
  phone: string;
  email: string;
  address: string;
  roleTitleKh: string;
  roleTitleEn: string;
  department: string;
  qualification: string;
  specialization: string;
  hireDate: string;
  baseSalary: number;
  status: 'active' | 'on_leave' | 'resigned';
}

export interface ClassRoom {
  id: string;
  code: string;
  nameKh: string;
  nameEn: string;
  gradeLevel: number;
  category: 'kindergarten' | 'primary' | 'lower_secondary' | 'upper_secondary';
  track: string;
  homeroomTeacherId: string;
  room: string;
  shift: string;
  schedule: string;
  capacity: number;
  monthlyTuition: number;
  academicYear: string;
}

export interface Student {
  id: string;
  studentCode: string;
  moeysId: string;
  nameKh: string;
  nameEn: string;
  gender: 'M' | 'F' | 'O';
  dob: string;
  pob: string;
  classId: string;
  enrollmentDate: string;
  guardianName: string;
  guardianRelation: string;
  guardianPhone: string;
  guardianOccupation: string;
  phone: string;
  email: string;
  address: string;
  scholarshipPct: number;
  transportOpt: string;
  status: 'active' | 'graduated' | 'suspended' | 'transferred';
  medicalNotes: string;
  notes: string;
  photo: string | null;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
  checkInTime: string;
  remarks: string;
  recordedBy: string;
}

export interface GradeRecord {
  id: string;
  studentId: string;
  classId: string;
  subjectId: string;
  subjectName: string;
  periodCode: string;
  score: number;
  maxScore: number;
  remarks: string;
  updatedAt: string;
}

export interface TimetableSlot {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: number; // 1 = Monday .. 6 = Saturday
  periodIndex: number; // 1 .. 7
  timeRange: string;
  room: string;
}

export interface ExamItem {
  id: string;
  titleKh: string;
  titleEn: string;
  periodCode: string;
  examType: string;
  classId: string;
  startDate: string;
  endDate: string;
  status: 'scheduled' | 'ongoing' | 'completed';
}

export interface AssignmentItem {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  title: string;
  description: string;
  dueDate: string;
  maxPoints: number;
  status: 'open' | 'closed';
  createdAt: string;
}

export interface BehaviorRecord {
  id: string;
  studentId: string;
  date: string;
  type: 'merit' | 'award' | 'warning';
  points: number;
  title: string;
  description: string;
  recordedBy: string;
}

export interface InvoiceItem {
  id: string;
  invoiceNo: string;
  studentId: string;
  classId: string;
  title: string;
  category: string;
  periodLabel: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  status: 'paid' | 'partial' | 'unpaid' | 'overdue';
  paymentMethod: string;
  lastPaidAt: string;
  notes: string;
  createdAt: string;
}

export interface PaymentItem {
  id: string;
  receiptNo: string;
  invoiceId: string;
  studentId: string;
  amount: number;
  method: string;
  referenceNo: string;
  receivedBy: string;
  paidAt: string;
  notes: string;
}

export interface ExpenseItem {
  id: string;
  expenseNo: string;
  title: string;
  category: string;
  amount: number;
  expenseDate: string;
  paidTo: string;
  method: string;
  notes: string;
}

export interface PayrollItem {
  id: string;
  payrollNo: string;
  teacherId: string;
  monthKey: string;
  baseSalary: number;
  allowance: number;
  bonus: number;
  deduction: number;
  netSalary: number;
  status: 'pending' | 'paid';
  paidAt: string;
  paymentMethod: string;
  notes: string;
}

export interface TeacherLeave {
  id: string;
  teacherId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy: string;
  createdAt: string;
}

export interface LibraryBook {
  id: string;
  bookCode: string;
  isbn: string;
  titleKh: string;
  titleEn: string;
  author: string;
  category: string;
  shelf: string;
  totalCopies: number;
  availableCopies: number;
  publishYear: number;
}

export interface LibraryLoan {
  id: string;
  bookId: string;
  borrowerType: 'student' | 'teacher';
  borrowerId: string;
  borrowerName: string;
  issueDate: string;
  dueDate: string;
  returnDate: string;
  fineAmount: number;
  status: 'borrowed' | 'returned' | 'overdue';
}

export interface AnnouncementItem {
  id: string;
  titleKh: string;
  titleEn: string;
  contentKh: string;
  contentEn: string;
  audience: 'all' | 'teachers' | 'students' | 'parents';
  priority: 'normal' | 'important' | 'urgent';
  eventDate: string;
  authorName: string;
  pinned: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  userName: string;
  role: string;
  action: string;
  module: string;
  details: string;
  createdAt: string;
}

export interface DatabaseSnapshot {
  settings: SchoolSettings;
  users: UserAccount[];
  subjects: Subject[];
  teachers: Teacher[];
  classes: ClassRoom[];
  students: Student[];
  attendance: AttendanceRecord[];
  grades: GradeRecord[];
  timetable: TimetableSlot[];
  exams: ExamItem[];
  assignments: AssignmentItem[];
  behaviorRecords: BehaviorRecord[];
  invoices: InvoiceItem[];
  payments: PaymentItem[];
  expenses: ExpenseItem[];
  payrolls: PayrollItem[];
  teacherLeaves: TeacherLeave[];
  libraryBooks: LibraryBook[];
  libraryLoans: LibraryLoan[];
  announcements: AnnouncementItem[];
  auditLogs: AuditLogItem[];
}

export type PrintDocRequest =
  | { type: 'student_report_card'; studentId: string; periodCode: string }
  | { type: 'class_master_sheet'; classId: string; periodCode: string }
  | { type: 'honor_roll'; classId: string; periodCode: string }
  | { type: 'student_id_cards'; studentIds: string[] }
  | { type: 'invoice_receipt'; invoiceId: string }
  | { type: 'payslip'; payrollId: string }
  | { type: 'finance_statement' }
  | { type: 'attendance_sheet'; classId: string }
  | { type: 'timetable_schedule'; mode: 'class' | 'teacher'; targetId: string };
