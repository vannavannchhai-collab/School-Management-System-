import React, { useState } from 'react';
import {
  Search,
  Plus,
  Download,
  QrCode,
  ArrowUpRight,
  ArrowLeft,
  Edit3,
  Trash2,
  Camera,
  Phone,
  MapPin,
  ShieldAlert,
  Award,
  FileSpreadsheet,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dataEngine } from '../services/dataEngine';
import { Student } from '../types';
import {
  avatarColorFor,
  computeClassRanking,
  displayClassName,
  displayStudentName,
  exportCsvUTF8,
  formatUSD,
  generateVisualQrSvg,
  getGradeBadgeClass,
  getMoeysGrade,
  getPeriodLabel,
  initialsFor,
} from '../utils/academic';

const emptyStudentForm = (defaultClassId = ''): Partial<Student> => ({
  nameKh: '',
  nameEn: '',
  gender: 'M',
  dob: '2010-05-15',
  pob: 'ខេត្តសៀមរាប',
  classId: defaultClassId,
  moeysId: '',
  guardianName: '',
  guardianRelation: 'ឪពុក (Father)',
  guardianPhone: '',
  guardianOccupation: '',
  phone: '',
  email: '',
  address: 'ក្រុងសៀមរាប ខេត្តសៀមរាប',
  scholarshipPct: 0,
  transportOpt: 'Self Drop-off',
  status: 'active',
  medicalNotes: '',
  notes: '',
  photo: null,
});

export const StudentsModule: React.FC = () => {
  const {
    snapshot,
    tx,
    lang,
    user,
    selectedStudentId,
    openStudentProfile,
    closeStudentProfile,
    setPrintRequest,
    applyServerResult,
  } = useApp();

  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [onlyScholarship, setOnlyScholarship] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Student>>(emptyStudentForm());

  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promoteFrom, setPromoteFrom] = useState(snapshot.classes[0]?.id || '');
  const [promoteTo, setPromoteTo] = useState(snapshot.classes[1]?.id || '');

  const [profileTab, setProfileTab] = useState<
    'overview' | 'grades' | 'attendance' | 'finance' | 'behavior' | 'idcard'
  >('overview');

  const canEdit = user?.role === 'admin' || user?.role === 'teacher';

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const max = 240;
        let w = img.width;
        let h = img.height;
        if (w > h && w > max) {
          h = Math.round((h * max) / w);
          w = max;
        } else if (h >= w && h > max) {
          w = Math.round((w * max) / h);
          h = max;
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setFormData((prev) => ({ ...prev, photo: dataUrl }));
      };
      img.src = String(ev.target?.result || '');
    };
    reader.readAsDataURL(file);
  };

  const openCreateModal = () => {
    setFormData(emptyStudentForm(snapshot.classes[0]?.id || ''));
    setModalOpen(true);
  };

  const openEditModal = (st: Student) => {
    setFormData({ ...st });
    setModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameKh?.trim() && !formData.nameEn?.trim()) return;
    const ok = await applyServerResult(
      dataEngine.saveStudent(formData),
      tx('រក្សាទុកព័ត៌មានសិស្សជោគជ័យ!', 'Student saved successfully!')
    );
    if (ok) setModalOpen(false);
  };

  const handleDeleteStudent = async (st: Student) => {
    const confirmed = window.confirm(
      tx(
        `តើអ្នកពិតជាចង់លុបឈ្មោះសិស្ស "${st.nameKh}" មែនទេ?`,
        `Delete student "${st.nameEn || st.nameKh}" and all linked academic records?`
      )
    );
    if (!confirmed) return;
    const ok = await applyServerResult(
      dataEngine.deleteStudent(st.id),
      tx('បានលុបទិន្នន័យសិស្សរួចរាល់', 'Student removed')
    );
    if (ok && selectedStudentId === st.id) closeStudentProfile();
  };

  const handlePromoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoteFrom || !promoteTo || promoteFrom === promoteTo) return;
    const ok = await applyServerResult(
      dataEngine.promoteClass(promoteFrom, promoteTo),
      tx('ដំឡើងថ្នាក់សិស្សទាំងអស់បានជោគជ័យ!', 'Batch class promotion completed!')
    );
    if (ok) setPromoteOpen(false);
  };

  // ---------------- 360° STUDENT PROFILE VIEW ----------------
  if (selectedStudentId) {
    const st = snapshot.students.find((s) => s.id === selectedStudentId);
    if (!st) {
      closeStudentProfile();
      return null;
    }
    const cls = snapshot.classes.find((c) => c.id === st.classId);
    const peers = snapshot.students.filter((x) => x.classId === st.classId);
    const octRanked = computeClassRanking(peers, snapshot.grades, snapshot.subjects, '2026-10');
    const myRank = octRanked.find((r) => r.student.id === st.id);
    const stuGrades = snapshot.grades.filter((g) => g.studentId === st.id);
    const stuAtt = snapshot.attendance
      .filter((a) => a.studentId === st.id)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    const attPresent = stuAtt.filter((a) => a.status === 'present' || a.status === 'late').length;
    const attRate = stuAtt.length ? Math.round((attPresent / stuAtt.length) * 100) : 100;
    const stuInvoices = snapshot.invoices.filter((i) => i.studentId === st.id);
    const stuBehavior = snapshot.behaviorRecords.filter((b) => b.studentId === st.id);
    const conductScore = 100 + stuBehavior.reduce((s, b) => s + b.points, 0);

    return (
      <div className="space-y-6">
        {/* Back & Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={closeStudentProfile}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            {tx('ត្រឡប់ទៅបញ្ជីសិស្ស', 'Back to Student Directory')}
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setPrintRequest({
                  type: 'student_report_card',
                  studentId: st.id,
                  periodCode: '2026-10',
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {tx('បោះពុម្ពសៀវភៅតាមដាន', 'Print Report Card')}
            </button>
            <button
              type="button"
              onClick={() => setPrintRequest({ type: 'student_id_cards', studentIds: [st.id] })}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
            >
              <QrCode className="w-4 h-4" />
              {tx('បោះពុម្ពប័ណ្ណសិស្ស QR', 'Print QR ID Card')}
            </button>
            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={() => openEditModal(st)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <Edit3 className="w-4 h-4" />
                  {tx('កែប្រែ', 'Edit')}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteStudent(st)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {st.photo ? (
              <img
                src={st.photo}
                alt={st.nameEn}
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-blue-500/30"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold flex-shrink-0"
                style={{ backgroundColor: avatarColorFor(st.id) }}
              >
                {initialsFor(st.nameEn || st.nameKh)}
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold">
                  {st.studentCode}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                  MoEYS: {st.moeysId || '—'}
                </span>
                {st.scholarshipPct > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                    🎓 {tx(`អាហារូបករណ៍ ${st.scholarshipPct}%`, `${st.scholarshipPct}% Scholarship`)}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-extrabold">{st.nameKh}</h1>
              <div className="text-sm text-slate-500 font-medium">
                {st.nameEn} · {displayClassName(cls, lang)} ·{' '}
                {st.gender === 'F' ? tx('ភេទស្រី', 'Female') : tx('ភេទប្រុស', 'Male')}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 w-full md:w-auto">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-center">
              <div className="text-lg font-extrabold text-blue-600">
                {myRank?.averagePct ? `${myRank.averagePct.toFixed(1)}%` : '—'}
              </div>
              <div className="text-[11px] text-slate-500">{tx('មធ្យមភាគ', 'Average')}</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-center">
              <div className="text-lg font-extrabold text-purple-600">
                {myRank?.rank ? `#${myRank.rank}` : '—'}
              </div>
              <div className="text-[11px] text-slate-500">{tx('ចំណាត់ថ្នាក់', 'Rank')}</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-center">
              <div className="text-lg font-extrabold text-emerald-600">{attRate}%</div>
              <div className="text-[11px] text-slate-500">{tx('វត្តមាន', 'Attendance')}</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-center">
              <div className="text-lg font-extrabold text-amber-600">{conductScore}</div>
              <div className="text-[11px] text-slate-500">{tx('ពិន្ទុសីលធម៌', 'Conduct')}</div>
            </div>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(
            [
              ['overview', 'ព័ត៌មានទូទៅ & អាណាព្យាបាល', 'Overview & Guardian'],
              ['grades', 'ពិន្ទុ និងប្រតិបត្តិពិន្ទុ', 'Academic Transcript'],
              ['attendance', 'ប្រវត្តិវត្តមាន', 'Attendance Log'],
              ['finance', 'ថ្លៃសិក្សា & វិក្កយបត្រ', 'Tuition & Invoices'],
              ['behavior', 'វិន័យ & បណ្ណសរសើរ', 'Merits & Discipline'],
              ['idcard', 'ប័ណ្ណសម្គាល់ខ្លួន QR', 'Digital QR ID Card'],
            ] as const
          ).map(([tabKey, kh, en]) => (
            <button
              key={tabKey}
              type="button"
              onClick={() => setProfileTab(tabKey)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                profileTab === tabKey
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              {tx(kh, en)}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        {profileTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <h3 className="text-base font-bold mb-2">
                {tx('ព័ត៌មានផ្ទាល់ខ្លួនសិស្ស', 'Personal & Enrollment Details')}
              </h3>
              {[
                [tx('អត្តលេខសាលា', 'Student ID'), st.studentCode],
                [tx('អត្តលេខក្រសួង (MoEYS)', 'MoEYS Code'), st.moeysId || '—'],
                [tx('ថ្ងៃខែឆ្នាំកំណើត', 'Date of Birth'), st.dob || '—'],
                [tx('ទីកន្លែងកំណើត', 'Place of Birth'), st.pob || '—'],
                [tx('កាលបរិច្ឆេទចូលរៀន', 'Enrollment Date'), st.enrollmentDate || '—'],
                [tx('មធ្យោបាយធ្វើដំណើរ', 'Transport'), st.transportOpt || '—'],
                [tx('អាសយដ្ឋានបច្ចុប្បន្ន', 'Current Address'), st.address || '—'],
              ].map(([k, v], i) => (
                <div
                  key={i}
                  className="flex justify-between py-2 border-b last:border-b-0 border-slate-100 dark:border-slate-800 text-sm"
                >
                  <span className="text-slate-500">{k}</span>
                  <span className="font-semibold text-right">{v}</span>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <h3 className="text-base font-bold mb-2">
                  {tx('ព័ត៌មានមាតាបិតា / អាណាព្យាបាល', 'Parent / Guardian Contact')}
                </h3>
                {[
                  [tx('ឈ្មោះអាណាព្យាបាល', 'Guardian Name'), st.guardianName || '—'],
                  [tx('ត្រូវជា', 'Relationship'), st.guardianRelation || '—'],
                  [tx('លេខទូរស័ព្ទទំនាក់ទំនង', 'Phone Number'), st.guardianPhone || st.phone || '—'],
                  [tx('មុខរបរ', 'Occupation'), st.guardianOccupation || '—'],
                  [tx('អ៊ីមែលសិស្ស', 'Email'), st.email || '—'],
                ].map(([k, v], i) => (
                  <div
                    key={i}
                    className="flex justify-between py-2 border-b last:border-b-0 border-slate-100 dark:border-slate-800 text-sm"
                  >
                    <span className="text-slate-500">{k}</span>
                    <span className="font-semibold text-right">{v}</span>
                  </div>
                ))}
              </div>

              {(st.medicalNotes || st.notes) && (
                <div className="bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl p-5 border border-amber-200 dark:border-amber-800/60">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-sm mb-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    {tx('កំណត់សម្គាល់សុខភាព និងព័ត៌មានពិសេស', 'Health & Special Notes')}
                  </div>
                  {st.medicalNotes && <p className="text-xs text-slate-700 dark:text-slate-300 mb-1">{st.medicalNotes}</p>}
                  {st.notes && <p className="text-xs text-slate-600 dark:text-slate-400">{st.notes}</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {profileTab === 'grades' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">
                {tx('ប្រតិបត្តិពិន្ទុតាមមុខវិជ្ជា និងឆមាស', 'Subject Scores Across Assessment Periods')}
              </h3>
              <button
                type="button"
                onClick={() =>
                  setPrintRequest({
                    type: 'student_report_card',
                    studentId: st.id,
                    periodCode: '2026-10',
                  })
                }
                className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold"
              >
                {tx('បោះពុម្ព PDF', 'Print Official Transcript')}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-400 uppercase">
                    <th className="py-2.5 pr-4">{tx('មុខវិជ្ជា', 'Subject')}</th>
                    <th className="py-2.5 px-3 text-center">2026-09</th>
                    <th className="py-2.5 px-3 text-center">2026-10</th>
                    <th className="py-2.5 px-3 text-center">{tx('ឆមាសទី១ (T1)', 'Sem 1')}</th>
                    <th className="py-2.5 pl-3 text-center">{tx('និទ្ទេស', 'MoEYS Grade')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {snapshot.subjects.map((sub) => {
                    const g09 = stuGrades.find((x) => x.subjectId === sub.id && x.periodCode === '2026-09');
                    const g10 = stuGrades.find((x) => x.subjectId === sub.id && x.periodCode === '2026-10');
                    const gt1 = stuGrades.find((x) => x.subjectId === sub.id && x.periodCode === 't1');
                    if (!g09 && !g10 && !gt1) return null;
                    const latest = g10?.score ?? gt1?.score ?? g09?.score ?? null;
                    const letter = getMoeysGrade(latest);
                    return (
                      <tr key={sub.id}>
                        <td className="py-3 pr-4 font-bold">{tx(sub.nameKh, sub.nameEn)}</td>
                        <td className="py-3 px-3 text-center">{g09 ? g09.score : '—'}</td>
                        <td className="py-3 px-3 text-center font-bold text-blue-600">{g10 ? g10.score : '—'}</td>
                        <td className="py-3 px-3 text-center">{gt1 ? gt1.score : '—'}</td>
                        <td className="py-3 pl-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getGradeBadgeClass(letter)}`}>
                            {letter}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {profileTab === 'attendance' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800">
            <h3 className="text-base font-bold mb-4">
              {tx(`ប្រវត្តិវត្តមានសិស្ស (${stuAtt.length} ថ្ងៃកត់ត្រា)`, `Attendance Records (${stuAtt.length} days)`)}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stuAtt.map((a) => (
                <div
                  key={a.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-bold">{a.date}</div>
                    <div className="text-xs text-slate-500">
                      {a.checkInTime ? `Check-in: ${a.checkInTime}` : a.remarks || '—'}
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      a.status === 'present'
                        ? 'bg-emerald-100 text-emerald-700'
                        : a.status === 'late'
                        ? 'bg-amber-100 text-amber-700'
                        : a.status === 'excused'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {a.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {profileTab === 'finance' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800">
            <h3 className="text-base font-bold mb-4">
              {tx('ប្រវត្តិវិក្កយបត្រ និងការបង់ថ្លៃសិក្សា', 'Student Invoices & Receipts')}
            </h3>
            <div className="space-y-3">
              {stuInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    <div className="text-xs font-mono text-slate-400">{inv.invoiceNo}</div>
                    <div className="text-sm font-bold">{inv.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {tx('សរុបត្រូវបង់៖ ', 'Net Total: ')}
                      <b>{formatUSD(inv.totalAmount)}</b> · {tx('បានបង់៖ ', 'Paid: ')}
                      <b className="text-emerald-600">{formatUSD(inv.paidAmount)}</b>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                        inv.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-700'
                          : inv.status === 'partial'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {inv.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPrintRequest({ type: 'invoice_receipt', invoiceId: inv.id })}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold"
                    >
                      {tx('បង្កាន់ដៃ', 'Receipt')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {profileTab === 'behavior' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800">
            <h3 className="text-base font-bold mb-4">
              {tx('កំណត់ត្រាសីលធម៌ វិន័យ និងបណ្ណសរសើរ', 'Conduct, Awards & Discipline Log')}
            </h3>
            {stuBehavior.length === 0 ? (
              <div className="text-sm text-slate-400 py-6 text-center">
                {tx('សិស្សមានវិន័យល្អប្រសើរ (១០០ ពិន្ទុពេញ)', 'Exemplary conduct record (100/100 points)')}
              </div>
            ) : (
              <div className="space-y-3">
                {stuBehavior.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-sm font-bold">{b.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{b.description}</div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {b.date} · {b.recordedBy}
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                        b.points >= 0
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {b.points >= 0 ? `+${b.points}` : b.points} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {profileTab === 'idcard' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base font-bold">
                  {tx('ប័ណ្ណសម្គាល់ខ្លួនសិស្សឌីជីថល (ផ្នែកខាងមុខ & ខាងក្រោយ)', 'Official Student QR ID Card (Front & Back)')}
                </h3>
                <p className="text-xs text-slate-500">
                  {tx('រួចរាល់សម្រាប់ការបោះពុម្ពលើកាត PVC ឬក្រដាសរឹង A4', 'Ready for PVC card printer or A4 laminated sheet')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPrintRequest({ type: 'student_id_cards', studentIds: [st.id] })}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow"
              >
                <QrCode className="w-4 h-4" />
                {tx('បោះពុម្ពប័ណ្ណសិស្ស', 'Print Card')}
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-8">
              {/* Front ID Card */}
              <div className="w-80 rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-white text-slate-900">
                <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 text-center">
                  <div className="text-[10px] uppercase tracking-widest text-blue-200 font-bold">
                    STUDENT IDENTIFICATION CARD
                  </div>
                  <div className="text-sm font-extrabold mt-0.5">{snapshot.settings.schoolNameKh}</div>
                  <div className="text-[11px] text-blue-100">{snapshot.settings.schoolNameEn}</div>
                </div>
                <div className="p-5 flex flex-col items-center text-center">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold shadow-md -mt-10 ring-4 ring-white mb-3"
                    style={{ backgroundColor: avatarColorFor(st.id) }}
                  >
                    {initialsFor(st.nameEn || st.nameKh)}
                  </div>
                  <div className="text-lg font-extrabold">{st.nameKh}</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    {st.nameEn}
                  </div>
                  <span className="mt-2 px-3 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-extrabold">
                    {displayClassName(cls, lang)}
                  </span>

                  <div className="w-full mt-4 pt-3 border-t border-slate-100 text-xs space-y-1.5 text-left">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Student ID:</span>
                      <span className="font-mono font-bold">{st.studentCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">MoEYS ID:</span>
                      <span className="font-mono font-semibold">{st.moeysId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">DOB:</span>
                      <span className="font-semibold">{st.dob}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Valid Year:</span>
                      <span className="font-bold text-emerald-700">{snapshot.settings.academicYear}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Back ID Card */}
              <div className="w-80 rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-white text-slate-900 flex flex-col justify-between p-5">
                <div className="text-center">
                  <div className="text-xs font-extrabold uppercase text-slate-400 mb-3">
                    QR GATE & LIBRARY VERIFICATION
                  </div>
                  <img
                    src={generateVisualQrSvg(`${st.studentCode}|${st.nameEn}|${st.moeysId}`, 132)}
                    alt="QR Code"
                    className="w-32 h-32 mx-auto border border-slate-200 rounded-xl p-1.5"
                  />
                  <div className="text-xs font-mono font-bold text-slate-700 mt-2">{st.studentCode}</div>
                </div>

                <div className="text-[11px] text-slate-600 space-y-1.5 bg-slate-50 p-3 rounded-xl my-3">
                  <div>
                    <b>អាណាព្យាបាល / Emergency:</b> {st.guardianName || '—'}
                  </div>
                  <div>
                    <b>ទូរស័ព្ទ / Tel:</b> {st.guardianPhone || st.phone || snapshot.settings.phone}
                  </div>
                  <div>
                    <b>សាលា / Campus:</b> {snapshot.settings.phone}
                  </div>
                </div>

                <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 pt-2">
                  ប្រសិនបើរើសបាន សូមមេត្តាប្រគល់ជូនការិយាល័យរដ្ឋបាលសាលាវិញ។
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------------- DIRECTORY LIST VIEW ----------------
  const filteredStudents = snapshot.students.filter((s) => {
    if (classFilter !== 'all' && s.classId !== classFilter) return false;
    if (genderFilter !== 'all' && s.gender !== genderFilter) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (onlyScholarship && (s.scholarshipPct || 0) <= 0) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const hay = `${s.nameKh} ${s.nameEn} ${s.studentCode} ${s.moeysId} ${s.guardianName} ${s.guardianPhone} ${s.phone}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const handleExportStudentsCsv = () => {
    exportCsvUTF8(
      `students_${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'Student Code',
        'MoEYS ID',
        'Khmer Name',
        'English Name',
        'Gender',
        'DOB',
        'Class',
        'Guardian',
        'Phone',
        'Scholarship %',
        'Status',
      ],
      filteredStudents.map((s) => {
        const cls = snapshot.classes.find((c) => c.id === s.classId);
        return [
          s.studentCode,
          s.moeysId,
          s.nameKh,
          s.nameEn,
          s.gender,
          s.dob,
          cls ? cls.nameEn : '',
          s.guardianName,
          s.guardianPhone || s.phone,
          s.scholarshipPct,
          s.status,
        ];
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">
            {tx('ប្រព័ន្ធគ្រប់គ្រងព័ត៌មានសិស្ស (SIS)', 'Student Information System')}
          </h1>
          <p className="text-sm text-slate-500">
            {tx(
              `បញ្ជីសិស្សសរុប ${filteredStudents.length} នាក់ · គាំទ្រប្រវត្តិរូប ៣៦០° និងប័ណ្ណសម្គាល់ខ្លួន QR`,
              `Showing ${filteredStudents.length} students · 360° profiles, admissions & batch QR ID cards`
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              {tx('ចុះឈ្មោះសិស្សថ្មី', 'Enroll Student')}
            </button>
          )}
          {user?.role === 'admin' && (
            <button
              type="button"
              onClick={() => setPromoteOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold"
            >
              <Users className="w-4 h-4" />
              {tx('ដំឡើងថ្នាក់', 'Promote Class')}
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              setPrintRequest({
                type: 'student_id_cards',
                studentIds: filteredStudents.slice(0, 12).map((s) => s.id),
              })
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-slate-50"
          >
            <QrCode className="w-4 h-4 text-indigo-600" />
            {tx('បោះពុម្ពប័ណ្ណ QR', 'Print QR IDs')}
          </button>
          <button
            type="button"
            onClick={handleExportStudentsCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-slate-50"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            CSV
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tx(
              'ស្វែងរកតាមឈ្មោះខ្មែរ/អង់គ្លេស អត្តលេខ អាណាព្យាបាល ទូរស័ព្ទ...',
              'Search by name, code, MoEYS ID, guardian, phone...'
            )}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm outline-none"
          />
        </div>

        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold outline-none"
        >
          <option value="all">{tx('គ្រប់ថ្នាក់ទាំងអស់', 'All Classes')}</option>
          {snapshot.classes.map((c) => (
            <option key={c.id} value={c.id}>
              {displayClassName(c, lang)}
            </option>
          ))}
        </select>

        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold outline-none"
        >
          <option value="all">{tx('គ្រប់ភេទ', 'All Genders')}</option>
          <option value="M">{tx('ប្រុស (Male)', 'Male')}</option>
          <option value="F">{tx('ស្រី (Female)', 'Female')}</option>
        </select>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold outline-none"
          >
            <option value="all">{tx('គ្រប់ស្ថានភាព', 'All Status')}</option>
            <option value="active">{tx('កំពុងសិក្សា', 'Active')}</option>
            <option value="graduated">{tx('បញ្ចប់ការសិក្សា', 'Graduated')}</option>
            <option value="transferred">{tx('ផ្ទេរចេញ', 'Transferred')}</option>
          </select>
          <button
            type="button"
            onClick={() => setOnlyScholarship((v) => !v)}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              onlyScholarship
                ? 'bg-amber-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
            title="Scholarship Filter"
          >
            🎓
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase text-slate-500">
                <th className="py-3.5 px-4">{tx('សិស្ស / អត្តលេខ', 'Student / ID')}</th>
                <th className="py-3.5 px-4">{tx('ថ្នាក់រៀន', 'Class')}</th>
                <th className="py-3.5 px-4">{tx('ភេទ / ថ្ងៃកំណើត', 'Gender & DOB')}</th>
                <th className="py-3.5 px-4">{tx('អាណាព្យាបាល & ទូរស័ព្ទ', 'Guardian & Phone')}</th>
                <th className="py-3.5 px-4 text-center">{tx('អាហារូបករណ៍', 'Scholarship')}</th>
                <th className="py-3.5 px-4 text-right">{tx('សកម្មភាព', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {filteredStudents.map((st) => {
                const cls = snapshot.classes.find((c) => c.id === st.classId);
                return (
                  <tr
                    key={st.id}
                    className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition"
                  >
                    <td
                      onClick={() => openStudentProfile(st.id)}
                      className="py-3.5 px-4 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        {st.photo ? (
                          <img
                            src={st.photo}
                            alt={st.nameEn}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0"
                            style={{ backgroundColor: avatarColorFor(st.id) }}
                          >
                            {initialsFor(st.nameEn || st.nameKh)}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white hover:text-blue-600">
                            {st.nameKh}{' '}
                            <span className="font-normal text-slate-500 text-xs">
                              ({st.nameEn})
                            </span>
                          </div>
                          <div className="text-xs font-mono text-slate-400">
                            {st.studentCode} · MoEYS: {st.moeysId || '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold">
                        {displayClassName(cls, lang)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-semibold">
                        {st.gender === 'F' ? tx('ស្រី (Female)', 'Female') : tx('ប្រុស (Male)', 'Male')}
                      </div>
                      <div className="text-slate-400">{st.dob || '—'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-semibold">{st.guardianName || '—'}</div>
                      <div className="text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {st.guardianPhone || st.phone || '—'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {st.scholarshipPct > 0 ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                          {st.scholarshipPct}%
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openStudentProfile(st.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100 inline-flex items-center gap-1"
                        >
                          <span>360°</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => openEditModal(st)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-extrabold">
                {formData.id
                  ? tx('កែប្រែព័ត៌មានសិស្ស', 'Edit Student Record')
                  : tx('ចុះឈ្មោះសិស្សថ្មីចូលរៀន', 'New Student Admission')}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4">
              {/* Photo Picker */}
              <div className="flex items-center gap-4">
                <label className="relative w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer overflow-hidden border border-slate-200 dark:border-slate-700">
                  {formData.photo ? (
                    <img src={formData.photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-slate-400" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                <div className="text-xs text-slate-500">
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {tx('រូបថតកាតសិស្ស (៤x៦)', 'Student Portrait Photo')}
                  </div>
                  <div>{tx('ចុចដើម្បីជ្រើសរើសរូបភាពពីឧបករណ៍', 'Click avatar to upload photo')}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('គោត្តនាម និងនាម (អក្សរខ្មែរ) *', 'Full Name (Khmer) *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nameKh || ''}
                    onChange={(e) => setFormData({ ...formData, nameKh: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm outline-none"
                    placeholder="សុខ ដារា"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ឈ្មោះអក្សរឡាតាំង (English Name) *', 'Full Name (Latin) *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nameEn || ''}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm outline-none"
                    placeholder="Sok Dara"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ភេទ (Gender)', 'Gender')}
                  </label>
                  <select
                    value={formData.gender || 'M'}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value as 'M' | 'F' | 'O' })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm outline-none"
                  >
                    <option value="M">{tx('ប្រុស (Male)', 'Male')}</option>
                    <option value="F">{tx('ស្រី (Female)', 'Female')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ថ្ងៃខែឆ្នាំកំណើត (DOB)', 'Date of Birth')}
                  </label>
                  <input
                    type="date"
                    value={formData.dob || ''}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ថ្នាក់រៀន (Assign Class)', 'Class')}
                  </label>
                  <select
                    value={formData.classId || ''}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm outline-none"
                  >
                    <option value="">{tx('-- ជ្រើសរើសថ្នាក់ --', '-- Select Class --')}</option>
                    {snapshot.classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {displayClassName(c, lang)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('អាហារូបករណ៍បញ្ចុះតម្លៃ (%)', 'Scholarship Discount (%)')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.scholarshipPct ?? 0}
                    onChange={(e) =>
                      setFormData({ ...formData, scholarshipPct: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ឈ្មោះអាណាព្យាបាល', 'Guardian Name')}
                  </label>
                  <input
                    type="text"
                    value={formData.guardianName || ''}
                    onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm outline-none"
                    placeholder="លោក សុខ ចាន់ថន"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ទូរស័ព្ទអាណាព្យាបាល', 'Guardian Phone')}
                  </label>
                  <input
                    type="text"
                    value={formData.guardianPhone || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        guardianPhone: e.target.value,
                        phone: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm outline-none"
                    placeholder="012 345 678"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {tx('អាសយដ្ឋានបច្ចុប្បន្ន', 'Current Address')}
                </label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {tx('កំណត់សម្គាល់សុខភាព / ផ្សេងៗ', 'Medical / General Notes')}
                </label>
                <textarea
                  rows={2}
                  value={formData.medicalNotes || ''}
                  onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  {tx('បោះបង់', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow"
                >
                  {tx('រក្សាទុកទិន្នន័យសិស្ស', 'Save Student')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Class Promotion Modal */}
      {promoteOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h2 className="text-lg font-extrabold mb-1">
              {tx('ដំឡើងថ្នាក់សិស្សទាំងមូល (Batch Promotion)', 'Batch Class Promotion')}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              {tx(
                'ផ្ទេរសិស្សកំពុងសិក្សាទាំងអស់ពីថ្នាក់ចាស់ទៅថ្នាក់ថ្មីក្នុងពេលតែមួយ',
                'Move all active students from source class into target class'
              )}
            </p>
            <form onSubmit={handlePromoteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {tx('ពីថ្នាក់ (From Class)', 'From Class')}
                </label>
                <select
                  value={promoteFrom}
                  onChange={(e) => setPromoteFrom(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                >
                  {snapshot.classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {displayClassName(c, lang)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {tx('ទៅកាន់ថ្នាក់ថ្មី (To Class)', 'To Target Class')}
                </label>
                <select
                  value={promoteTo}
                  onChange={(e) => setPromoteTo(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                >
                  {snapshot.classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {displayClassName(c, lang)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPromoteOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  {tx('បោះបង់', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold"
                >
                  {tx('ដំឡើងថ្នាក់ឥឡូវនេះ', 'Promote Students')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
