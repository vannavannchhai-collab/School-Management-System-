import React from 'react';
import {
  Users,
  UserCheck,
  Award,
  Wallet,
  Library,
  TrendingUp,
  Plus,
  CheckSquare,
  FileSpreadsheet,
  QrCode,
  CalendarDays,
  Megaphone,
  ArrowUpRight,
  GraduationCap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  avatarColorFor,
  computeClassRanking,
  displayClassName,
  displayStudentName,
  formatKHR,
  formatUSD,
  generateVisualQrSvg,
  getGradeBadgeClass,
  getMoeysGrade,
  initialsFor,
} from '../utils/academic';

export const DashboardModule: React.FC = () => {
  const {
    snapshot,
    user,
    tx,
    lang,
    setActiveModule,
    openStudentProfile,
    setPrintRequest,
  } = useApp();

  // ---------------- STUDENT & PARENT PORTAL VIEW ----------------
  if (user?.role === 'student') {
    const me =
      snapshot.students.find((s) => s.id === user.linkedId) || snapshot.students[0];
    const myClass = snapshot.classes.find((c) => c.id === me?.classId);
    const homeroom = snapshot.teachers.find((t) => t.id === myClass?.homeroomTeacherId);
    const peers = snapshot.students.filter((s) => s.classId === me?.classId);
    const classRanked = computeClassRanking(
      peers,
      snapshot.grades,
      snapshot.subjects,
      '2026-10'
    );
    const myRankRow = classRanked.find((r) => r.student.id === me?.id);
    const myAtt = snapshot.attendance.filter((a) => a.studentId === me?.id);
    const attOk = myAtt.filter((a) => a.status === 'present' || a.status === 'late').length;
    const attRate = myAtt.length > 0 ? Math.round((attOk / myAtt.length) * 100) : 100;
    const myInvoices = snapshot.invoices.filter((i) => i.studentId === me?.id);
    const dueTotal = myInvoices.reduce((s, i) => s + Math.max(0, i.totalAmount - i.paidAmount), 0);
    const myHomework = snapshot.assignments.filter((a) => a.classId === me?.classId);

    if (!me) return null;

    return (
      <div className="space-y-6">
        {/* Student Hero Card */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white p-6 sm:p-8 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-extrabold border border-white/30">
              {initialsFor(me.nameEn || me.nameKh)}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-xs font-semibold mb-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{me.studentCode} · MoEYS: {me.moeysId}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold">
                {tx(`សួស្តី, ${me.nameKh}!`, `Welcome back, ${me.nameEn}!`)}
              </h1>
              <p className="text-blue-100 text-sm mt-0.5">
                {displayClassName(myClass, lang)} ·{' '}
                {tx('គ្រូបន្ទុកថ្នាក់៖ ', 'Homeroom: ')}
                {homeroom ? tx(homeroom.nameKh, homeroom.nameEn) : '—'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() =>
                setPrintRequest({ type: 'student_id_cards', studentIds: [me.id] })
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-700 font-bold text-xs sm:text-sm shadow hover:bg-blue-50 transition"
            >
              <QrCode className="w-4 h-4" />
              {tx('ប័ណ្ណសម្គាល់ខ្លួន QR', 'My QR ID Card')}
            </button>
            <button
              type="button"
              onClick={() =>
                setPrintRequest({
                  type: 'student_report_card',
                  studentId: me.id,
                  periodCode: '2026-10',
                })
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white font-bold text-xs sm:text-sm transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {tx('សៀវភៅតាមដានការសិក្សា', 'Official Report Card')}
            </button>
          </div>
        </div>

        {/* 4 Student KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 mb-1">
              {tx('មធ្យមភាគប្រចាំខែតុលា', 'October Average')}
            </div>
            <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
              {myRankRow?.averagePct ? `${myRankRow.averagePct.toFixed(1)}%` : '—'}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {tx('និទ្ទេស MoEYS៖ ', 'MoEYS Grade: ')}
              <span className="font-bold text-emerald-600">{myRankRow?.grade || '—'}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 mb-1">
              {tx('ចំណាត់ថ្នាក់ក្នុងថ្នាក់', 'Class Standing')}
            </div>
            <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">
              {myRankRow?.rank ? `#${myRankRow.rank}` : '—'}{' '}
              <span className="text-sm font-semibold text-slate-400">/ {peers.length}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {tx(`អាហារូបករណ៍៖ ${me.scholarshipPct}%`, `Scholarship: ${me.scholarshipPct}%`)}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 mb-1">
              {tx('អត្រាវត្តមានសរុប', 'Attendance Rate')}
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {attRate}%
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {attOk}/{myAtt.length} {tx('ថ្ងៃសិក្សា', 'school days')}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 mb-1">
              {tx('ថ្លៃសិក្សានៅជំពាក់', 'Outstanding Tuition')}
            </div>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              {formatUSD(dueTotal)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {dueTotal === 0
                ? tx('បានបង់រួចរាល់ ✓', 'All settled ✓')
                : formatKHR(dueTotal, snapshot.settings.exchangeRate)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subject Performance */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold">
                {tx('លទ្ធផលពិន្ទុតាមមុខវិជ្ជា (ខែតុលា ២០២៦)', 'Subject Performance (Oct 2026)')}
              </h2>
              <button
                type="button"
                onClick={() => setActiveModule('grades')}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                {tx('មើលទាំងអស់ →', 'Full Transcript →')}
              </button>
            </div>
            <div className="space-y-3">
              {snapshot.subjects.map((sub) => {
                const sc = myRankRow?.scoresBySubject[sub.id];
                if (sc === null || sc === undefined) return null;
                const g = getMoeysGrade(sc);
                return (
                  <div key={sub.id} className="flex items-center gap-3">
                    <div className="w-36 text-xs sm:text-sm font-semibold truncate">
                      {tx(sub.nameKh, sub.nameEn)}
                    </div>
                    <div className="flex-1 h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, sc)}%`, backgroundColor: sub.color }}
                      />
                    </div>
                    <div className="w-14 text-right text-xs font-bold">{sc}/100</div>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${getGradeBadgeClass(g)}`}>
                      {g}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* QR Verification & Homework */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
              <img
                src={generateVisualQrSvg(`${me.studentCode}|${me.nameEn}|${me.moeysId}`, 88)}
                alt="QR"
                className="w-20 h-20 rounded-xl border border-slate-200 p-1 bg-white"
              />
              <div>
                <div className="text-xs font-bold text-blue-600 uppercase">Digital Gate Pass</div>
                <div className="text-sm font-extrabold mt-0.5">{me.studentCode}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {tx('បង្ហាញកូដ QR នេះពេលចូលសាលា ឬខ្ចីសៀវភៅបណ្ណាល័យ', 'Scan at school gate or library counter')}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800">
              <h3 className="text-sm font-bold mb-3">
                {tx('កិច្ចការផ្ទះត្រូវប្រគល់', 'Upcoming Homework')}
              </h3>
              <div className="space-y-2.5">
                {myHomework.length === 0 ? (
                  <div className="text-xs text-slate-400">
                    {tx('មិនមានកិច្ចការផ្ទះថ្មីទេ', 'No pending assignments')}
                  </div>
                ) : (
                  myHomework.map((hw) => (
                    <div
                      key={hw.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                    >
                      <div className="text-xs font-bold">{hw.title}</div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {tx('ផុតកំណត់៖ ', 'Due: ')}
                        <span className="font-semibold text-amber-600">{hw.dueDate}</span> ·{' '}
                        {hw.maxPoints} pts
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- EXECUTIVE / STAFF DASHBOARD ----------------
  const activeStudents = snapshot.students.filter((s) => s.status === 'active');
  const femaleCount = activeStudents.filter((s) => s.gender === 'F').length;
  const maleCount = activeStudents.filter((s) => s.gender === 'M').length;

  // Latest recorded school date
  const allDates = Array.from(new Set(snapshot.attendance.map((a) => a.date))).sort();
  const latestDate = allDates[allDates.length - 1] || '2026-10-29';
  const todayAtt = snapshot.attendance.filter((a) => a.date === latestDate);
  const todayPresent = todayAtt.filter((a) => a.status === 'present' || a.status === 'late').length;
  const todayAttRate =
    todayAtt.length > 0 ? Math.round((todayPresent / todayAtt.length) * 100) : 0;

  // Finance totals
  const totalInvoiced = snapshot.invoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalCollected = snapshot.invoices.reduce((s, i) => s + i.paidAmount, 0);
  const totalPending = Math.max(0, totalInvoiced - totalCollected);
  const totalExpenses = snapshot.expenses.reduce((s, e) => s + e.amount, 0);
  const paidPayrolls = snapshot.payrolls
    .filter((p) => p.status === 'paid')
    .reduce((s, p) => s + p.netSalary, 0);

  // School-wide academic stats (October 2026)
  const schoolRanked = computeClassRanking(
    activeStudents,
    snapshot.grades,
    snapshot.subjects,
    '2026-10'
  );
  const gradedRows = schoolRanked.filter((r) => r.averagePct !== null);
  const schoolAvg =
    gradedRows.length > 0
      ? gradedRows.reduce((s, r) => s + (r.averagePct || 0), 0) / gradedRows.length
      : 0;
  const passCount = gradedRows.filter((r) => (r.averagePct || 0) >= 50).length;
  const passRate = gradedRows.length > 0 ? Math.round((passCount / gradedRows.length) * 100) : 0;

  const gradeCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
  gradedRows.forEach((r) => {
    if (gradeCounts[r.grade] !== undefined) gradeCounts[r.grade] += 1;
  });

  // 12-day attendance trend
  const recentDates = allDates.slice(-12);
  const trendBars = recentDates.map((d) => {
    const recs = snapshot.attendance.filter((a) => a.date === d);
    const ok = recs.filter((a) => a.status === 'present' || a.status === 'late').length;
    const pct = recs.length ? Math.round((ok / recs.length) * 100) : 0;
    return { date: d.slice(5), pct, ok, total: recs.length };
  });

  // Enrollment by Education Level
  const levelGroups = [
    { key: 'kindergarten', kh: 'មត្តេយ្យសិក្សា (K)', en: 'Kindergarten', color: 'bg-pink-500' },
    { key: 'primary', kh: 'បឋមសិក្សា (G1–G6)', en: 'Primary (G1–G6)', color: 'bg-blue-500' },
    { key: 'lower_secondary', kh: 'អនុវិទ្យាល័យ (G7–G9)', en: 'Lower Secondary', color: 'bg-indigo-500' },
    { key: 'upper_secondary', kh: 'វិទ្យាល័យ (G10–G12)', en: 'Upper Secondary', color: 'bg-emerald-500' },
  ].map((lvl) => {
    const clsIds = snapshot.classes.filter((c) => c.category === lvl.key).map((c) => c.id);
    const count = activeStudents.filter((s) => clsIds.includes(s.classId)).length;
    return { ...lvl, count };
  });

  const activeLoans = snapshot.libraryLoans.filter((l) => l.status !== 'returned').length;
  const overdueLoans = snapshot.libraryLoans.filter((l) => l.status === 'overdue').length;

  return (
    <div className="space-y-6">
      {/* Executive Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-7 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold mb-2">
            <span>🏛️</span>
            <span>{tx(snapshot.settings.ministryHeaderKh, snapshot.settings.ministryHeaderEn)}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {tx(
              `សូមស្វាគមន៍, ${user?.nameKh || ''}`,
              `Welcome back, ${user?.nameEn || ''}`
            )}
          </h1>
          <p className="text-blue-200/85 text-sm mt-1">
            {tx(
              `${snapshot.settings.schoolNameKh} · ទិដ្ឋភាពរួមប្រចាំឆ្នាំសិក្សា ${snapshot.settings.academicYear}`,
              `${snapshot.settings.schoolNameEn} · Executive Overview AY ${snapshot.settings.academicYear}`
            )}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => setActiveModule('students')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition"
          >
            <Plus className="w-4 h-4" />
            {tx('ចុះឈ្មោះសិស្ស', 'Enroll Student')}
          </button>
          <button
            type="button"
            onClick={() => setActiveModule('attendance')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition"
          >
            <CheckSquare className="w-4 h-4" />
            {tx('កត់ត្រាវត្តមាន', 'Take Attendance')}
          </button>
          <button
            type="button"
            onClick={() => setActiveModule('grades')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold transition"
          >
            <Award className="w-4 h-4" />
            {tx('បញ្ចូលពិន្ទុ', 'Enter Grades')}
          </button>
          <button
            type="button"
            onClick={() => setActiveModule('reports')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {tx('បោះពុម្ពរបាយការណ៍', 'Print Studio')}
          </button>
        </div>
      </div>

      {/* 6 Enterprise KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
        <div
          onClick={() => setActiveModule('students')}
          className="cursor-pointer bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 transition shadow-xs"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
              {snapshot.classes.length} {tx('ថ្នាក់', 'Classes')}
            </span>
          </div>
          <div className="text-2xl font-extrabold">{activeStudents.length}</div>
          <div className="text-xs font-semibold text-slate-500 mt-0.5">
            {tx('សិស្សកំពុងសិក្សាសរុប', 'Active Students')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">
            {tx(`ស្រី ${femaleCount} នាក់ · ប្រុស ${maleCount} នាក់`, `Female ${femaleCount} · Male ${maleCount}`)}
          </div>
        </div>

        <div
          onClick={() => setActiveModule('teachers')}
          className="cursor-pointer bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 transition shadow-xs"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
              HR & Staff
            </span>
          </div>
          <div className="text-2xl font-extrabold">{snapshot.teachers.length}</div>
          <div className="text-xs font-semibold text-slate-500 mt-0.5">
            {tx('គ្រូបង្រៀន និងបុគ្គលិក', 'Teachers & Staff')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">
            {tx(
              `សំណើសុំច្បាប់រង់ចាំ៖ ${snapshot.teacherLeaves.filter((l) => l.status === 'pending').length}`,
              `Pending leaves: ${snapshot.teacherLeaves.filter((l) => l.status === 'pending').length}`
            )}
          </div>
        </div>

        <div
          onClick={() => setActiveModule('attendance')}
          className="cursor-pointer bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 transition shadow-xs"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
              {latestDate}
            </span>
          </div>
          <div className="text-2xl font-extrabold">{todayAttRate}%</div>
          <div className="text-xs font-semibold text-slate-500 mt-0.5">
            {tx('អត្រាវត្តមានប្រចាំថ្ងៃ', 'Daily Attendance')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">
            {todayPresent}/{todayAtt.length} {tx('វត្តមានក្នុងថ្នាក់', 'present today')}
          </div>
        </div>

        <div
          onClick={() => setActiveModule('grades')}
          className="cursor-pointer bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 hover:border-purple-400 transition shadow-xs"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full">
              {tx(`ជាប់ ${passRate}%`, `${passRate}% Pass`)}
            </span>
          </div>
          <div className="text-2xl font-extrabold">{schoolAvg.toFixed(1)}%</div>
          <div className="text-xs font-semibold text-slate-500 mt-0.5">
            {tx('មធ្យមភាគសិក្សារួម', 'School Mean Score')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">
            {tx(`និទ្ទេស A ចំនួន ${gradeCounts.A} នាក់`, `${gradeCounts.A} Grade-A Honors`)}
          </div>
        </div>

        <div
          onClick={() => setActiveModule('finance')}
          className="cursor-pointer bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 hover:border-amber-400 transition shadow-xs"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
              {tx('ហិរញ្ញវត្ថុ', 'Tuition')}
            </span>
          </div>
          <div className="text-2xl font-extrabold">{formatUSD(totalCollected)}</div>
          <div className="text-xs font-semibold text-slate-500 mt-0.5">
            {tx('ចំណូលថ្លៃសិក្សាប្រមូលបាន', 'Tuition Collected')}
          </div>
          <div className="text-[11px] text-rose-500 font-medium mt-1.5">
            {tx(`នៅជំពាក់៖ ${formatUSD(totalPending)}`, `Receivable: ${formatUSD(totalPending)}`)}
          </div>
        </div>

        <div
          onClick={() => setActiveModule('library')}
          className="cursor-pointer bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 hover:border-cyan-400 transition shadow-xs"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Library className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-cyan-600 bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded-full">
              {snapshot.libraryBooks.reduce((s, b) => s + b.totalCopies, 0)} {tx('ក្បាល', 'Vols')}
            </span>
          </div>
          <div className="text-2xl font-extrabold">{activeLoans}</div>
          <div className="text-xs font-semibold text-slate-500 mt-0.5">
            {tx('សៀវភៅកំពុងខ្ចី', 'Active Book Loans')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">
            {tx(`ហួសកំណត់សង៖ ${overdueLoans} ក្បាល`, `Overdue loans: ${overdueLoans}`)}
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 12-Day Attendance Chart */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold">
                {tx('និន្នាការវត្តមានសិស្ស ១២ ថ្ងៃចុងក្រោយ', '12-Day Attendance Trend')}
              </h2>
              <p className="text-xs text-slate-500">
                {tx('គិតជាភាគរយសិស្សវត្តមានប្រចាំថ្ងៃ', 'Daily school-wide attendance percentage')}
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg">
              Avg {Math.round(trendBars.reduce((s, b) => s + b.pct, 0) / (trendBars.length || 1))}%
            </span>
          </div>

          <div className="h-44 flex items-end gap-2 pt-4">
            {trendBars.map((b) => (
              <div key={b.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <div className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition">
                  {b.pct}%
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg h-32 flex items-end overflow-hidden">
                  <div
                    className={`w-full rounded-t-lg transition-all ${
                      b.pct >= 90
                        ? 'bg-emerald-500'
                        : b.pct >= 80
                        ? 'bg-blue-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ height: `${Math.max(10, b.pct)}%` }}
                  />
                </div>
                <div className="text-[10px] font-semibold text-slate-400 truncate">{b.date}</div>
              </div>
            ))}
          </div>
        </div>

        {/* MoEYS Grade Distribution */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold">
                {tx('ការបែងចែកនិទ្ទេស MoEYS (A–F)', 'MoEYS Grade Distribution')}
              </h2>
              <p className="text-xs text-slate-500">
                {tx('លទ្ធផលប្រចាំខែតុលា ២០២៦', 'October 2026 Assessment')}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {(
              [
                ['A', '90–100%', 'bg-emerald-500'],
                ['B', '80–89%', 'bg-blue-500'],
                ['C', '70–79%', 'bg-cyan-500'],
                ['D', '60–69%', 'bg-amber-500'],
                ['E', '50–59%', 'bg-orange-500'],
                ['F', '< 50%', 'bg-rose-500'],
              ] as const
            ).map(([g, range, barColor]) => {
              const cnt = gradeCounts[g] || 0;
              const pct = gradedRows.length ? Math.round((cnt / gradedRows.length) * 100) : 0;
              return (
                <div key={g} className="flex items-center gap-3">
                  <span className={`w-7 text-center py-0.5 rounded-md text-xs font-extrabold ${getGradeBadgeClass(g)}`}>
                    {g}
                  </span>
                  <span className="w-14 text-[11px] text-slate-400 font-medium">{range}</span>
                  <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-16 text-right text-xs font-bold text-slate-700 dark:text-slate-300">
                    {cnt} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Enrollment by Level & Financial Cashflow */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold mb-1">
              {tx('សិស្សតាមភូមិសិក្សា K–12', 'Enrollment by Level')}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              {tx('មត្តេយ្យ បឋម អនុ និងវិទ្យាល័យ', 'Distribution across K–12')}
            </p>
            <div className="space-y-3">
              {levelGroups.map((lg) => {
                const pct = activeStudents.length
                  ? Math.round((lg.count / activeStudents.length) * 100)
                  : 0;
                return (
                  <div key={lg.key}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>{tx(lg.kh, lg.en)}</span>
                      <span className="font-bold">
                        {lg.count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className={`h-full rounded-full ${lg.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">{tx('ចំណូលថ្លៃសិក្សា៖', 'Tuition Inflow:')}</span>
              <span className="font-bold text-emerald-600">{formatUSD(totalCollected)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{tx('ចំណាយប្រតិបត្តិការ៖', 'School Expenses:')}</span>
              <span className="font-bold text-rose-500">-{formatUSD(totalExpenses)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{tx('ប្រាក់បៀវត្សរ៍បានបើក៖', 'Paid Salaries:')}</span>
              <span className="font-bold text-amber-600">-{formatUSD(paidPayrolls)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Top Honor Roll Students + Announcements & Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top 6 Honor Roll Leaderboard */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold">
                {tx('តារាងកិត្តិយសសិស្សឆ្នើមប្រចាំសាលា (Top Honor Roll)', 'School-Wide Top Honor Students')}
              </h2>
              <p className="text-xs text-slate-500">
                {tx('ចុចលើឈ្មោះសិស្សដើម្បីមើលប្រវត្តិរូបលម្អិត ៣៦០ ដឺក្រេ', 'Click any student to open 360° academic profile')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveModule('grades')}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
            >
              <span>{tx('តារាងពិន្ទុទាំងអស់', 'Gradebook')}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase text-slate-400">
                  <th className="py-2.5 pr-3">{tx('ចំណាត់ថ្នាក់', 'Rank')}</th>
                  <th className="py-2.5 px-3">{tx('សិស្ស', 'Student')}</th>
                  <th className="py-2.5 px-3">{tx('ថ្នាក់', 'Class')}</th>
                  <th className="py-2.5 px-3 text-right">{tx('មធ្យមភាគ', 'Average')}</th>
                  <th className="py-2.5 pl-3 text-center">{tx('និទ្ទេស', 'Grade')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                {gradedRows.slice(0, 6).map((row, idx) => {
                  const cls = snapshot.classes.find((c) => c.id === row.student.classId);
                  return (
                    <tr
                      key={row.student.id}
                      onClick={() => openStudentProfile(row.student.id)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition"
                    >
                      <td className="py-3 pr-3">
                        <span
                          className={`inline-flex w-7 h-7 rounded-full items-center justify-center text-xs font-extrabold ${
                            idx === 0
                              ? 'bg-amber-100 text-amber-700'
                              : idx === 1
                              ? 'bg-slate-200 text-slate-700'
                              : idx === 2
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: avatarColorFor(row.student.id) }}
                          >
                            {initialsFor(row.student.nameEn || row.student.nameKh)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {displayStudentName(row.student, lang)}
                            </div>
                            <div className="text-[11px] text-slate-400">{row.student.studentCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {displayClassName(cls, lang)}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-blue-600 dark:text-blue-400">
                        {row.averagePct?.toFixed(1)}%
                      </td>
                      <td className="py-3 pl-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${getGradeBadgeClass(row.grade)}`}>
                          {row.grade}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Announcements & Exam Schedule */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-blue-600" />
                {tx('សេចក្តីជូនដំណឹងសំខាន់ៗ', 'Pinned Notices')}
              </h2>
              <button
                type="button"
                onClick={() => setActiveModule('announcements')}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                {tx('ទាំងអស់ →', 'View all →')}
              </button>
            </div>
            <div className="space-y-2.5">
              {snapshot.announcements.slice(0, 3).map((ann) => (
                <div
                  key={ann.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        ann.priority === 'urgent'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : ann.priority === 'important'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      {ann.priority}
                    </span>
                    <span className="text-[11px] text-slate-400">{ann.eventDate || ann.createdAt}</span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold line-clamp-1">
                    {tx(ann.titleKh, ann.titleEn || ann.titleKh)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                    {tx(ann.contentKh, ann.contentEn || ann.contentKh)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
              <CalendarDays className="w-4 h-4 text-purple-600" />
              {tx('កាលវិភាគប្រឡងជិតមកដល់', 'Upcoming Examinations')}
            </h3>
            <div className="space-y-2">
              {snapshot.exams.map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">
                      {tx(ex.titleKh, ex.titleEn || ex.titleKh)}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {ex.startDate} → {ex.endDate}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      ex.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {ex.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
