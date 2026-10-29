import React, { useEffect, useState } from 'react';
import {
  CheckSquare,
  QrCode,
  AlertCircle,
  Save,
  Printer,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dataEngine } from '../services/dataEngine';
import { AttendanceStatus } from '../types';
import {
  avatarColorFor,
  displayClassName,
  displayStudentName,
  initialsFor,
} from '../utils/academic';

export const AttendanceModule: React.FC = () => {
  const { snapshot, tx, lang, user, applyServerResult, setPrintRequest, openStudentProfile } =
    useApp();

  const linkedStudent =
    user?.role === 'student'
      ? snapshot.students.find((s) => s.id === user.linkedId)
      : null;

  const [tab, setTab] = useState<'rollcall' | 'qrscan' | 'alerts'>('rollcall');
  const [selectedClassId, setSelectedClassId] = useState(
    linkedStudent?.classId || snapshot.classes[0]?.id || ''
  );
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );

  useEffect(() => {
    if (!selectedClassId && snapshot.classes.length > 0) {
      setSelectedClassId(linkedStudent?.classId || snapshot.classes[0].id);
    }
  }, [snapshot.classes, selectedClassId, linkedStudent]);

  const [draftStatus, setDraftStatus] = useState<Record<string, AttendanceStatus>>({});
  const [draftRemarks, setDraftRemarks] = useState<Record<string, string>>({});
  const [qrInput, setQrInput] = useState('');
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  const roster = snapshot.students.filter(
    (s) =>
      s.classId === selectedClassId &&
      s.status === 'active' &&
      (user?.role !== 'student' || s.id === user.linkedId)
  );

  useEffect(() => {
    const nextStat: Record<string, AttendanceStatus> = {};
    const nextRem: Record<string, string> = {};
    snapshot.students
      .filter((s) => s.classId === selectedClassId && s.status === 'active')
      .forEach((s) => {
        const rec = snapshot.attendance.find(
          (a) => a.studentId === s.id && a.date === selectedDate
        );
        if (rec) {
          nextStat[s.id] = rec.status;
          nextRem[s.id] = rec.remarks || '';
        } else {
          nextStat[s.id] = 'present';
          nextRem[s.id] = '';
        }
      });
    setDraftStatus(nextStat);
    setDraftRemarks(nextRem);
  }, [selectedClassId, selectedDate, snapshot.attendance, snapshot.students]);

  const canEdit = user?.role === 'admin' || user?.role === 'teacher';

  const markAll = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceStatus> = {};
    roster.forEach((s) => {
      updated[s.id] = status;
    });
    setDraftStatus((prev) => ({ ...prev, ...updated }));
  };

  const handleSaveSheet = async () => {
    const payload = roster.map((s) => ({
      studentId: s.id,
      classId: selectedClassId,
      date: selectedDate,
      status: draftStatus[s.id] || 'present',
      checkInTime: draftStatus[s.id] === 'present' ? '07:00' : draftStatus[s.id] === 'late' ? '07:20' : '',
      remarks: draftRemarks[s.id] || '',
    }));
    await applyServerResult(
      dataEngine.saveAttendanceBatch(payload),
      tx('រក្សាទុកបញ្ជីវត្តមានប្រចាំថ្ងៃជោគជ័យ!', 'Daily attendance saved!')
    );
  };

  const handleQrCheckIn = async (codeOrId: string) => {
    const q = codeOrId.trim().toLowerCase();
    if (!q) return;
    const found = snapshot.students.find(
      (s) =>
        s.studentCode.toLowerCase() === q ||
        s.id.toLowerCase() === q ||
        s.moeysId.toLowerCase() === q
    );
    if (!found) {
      setLastScanned(tx('រកមិនឃើញអត្តលេខសិស្សនេះទេ!', 'Student code not found!'));
      return;
    }
    const timeStr = new Date().toTimeString().slice(0, 5);
    await applyServerResult(
      dataEngine.saveAttendanceBatch([
        {
          studentId: found.id,
          classId: found.classId,
          date: selectedDate,
          status: 'present',
          checkInTime: timeStr,
          remarks: 'QR Gate Scan',
        },
      ]),
      tx(`ស្កេនចូលរៀនជោគជ័យ៖ ${found.nameKh}`, `Checked in: ${found.nameEn}`)
    );
    setLastScanned(`${found.nameKh} (${found.studentCode}) — ✓ Present @ ${timeStr}`);
    setQrInput('');
  };

  // Watchlist: students < 85% attendance
  const watchlist = snapshot.students
    .filter((s) => s.status === 'active')
    .map((s) => {
      const recs = snapshot.attendance.filter((a) => a.studentId === s.id);
      const ok = recs.filter((a) => a.status === 'present' || a.status === 'late').length;
      const absent = recs.filter((a) => a.status === 'absent').length;
      const rate = recs.length ? Math.round((ok / recs.length) * 100) : 100;
      return { student: s, rate, absent, total: recs.length };
    })
    .filter((x) => x.rate < 88)
    .sort((a, b) => a.rate - b.rate);

  const counts = { present: 0, absent: 0, late: 0, excused: 0 };
  roster.forEach((s) => {
    const st = draftStatus[s.id] || 'present';
    counts[st] += 1;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-emerald-600" />
            {tx('គ្រប់គ្រងវត្តមានសិស្ស និងស្កេនកាត QR', 'Smart Attendance & QR Gate Check-in')}
          </h1>
          <p className="text-sm text-slate-500">
            {tx(
              'កត់ត្រាវត្តមានប្រចាំថ្ងៃ ស្កេនប័ណ្ណសិស្សរហ័ស និងតាមដានសិស្សអវត្តមានច្រើន',
              'Daily class roll call, barcode/QR gate simulator, and chronic absenteeism watchlist'
            )}
          </p>
        </div>

        {user?.role !== 'student' && (
          <div className="bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex">
            <button
              type="button"
              onClick={() => setTab('rollcall')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold ${
                tab === 'rollcall' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {tx('វត្តមានប្រចាំថ្នាក់', 'Class Roll Call')}
            </button>
            <button
              type="button"
              onClick={() => setTab('qrscan')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold ${
                tab === 'qrscan' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {tx('ស្កេនកាត QR', 'QR Scanner')}
            </button>
            <button
              type="button"
              onClick={() => setTab('alerts')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold ${
                tab === 'alerts' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {tx(`តាមដានអវត្តមាន (${watchlist.length})`, `Watchlist (${watchlist.length})`)}
            </button>
          </div>
        )}
      </div>

      {/* ROLL CALL TAB */}
      {tab === 'rollcall' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {user?.role !== 'student' && (
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold"
                >
                  {snapshot.classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {displayClassName(c, lang)}
                    </option>
                  ))}
                </select>
              )}

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold"
              />

              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700">
                  ✓ {tx('វត្តមាន', 'Present')}: {counts.present}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700">
                  ✕ {tx('អវត្តមាន', 'Absent')}: {counts.absent}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700">
                  ⏰ {tx('យឺត', 'Late')}: {counts.late}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700">
                  📝 {tx('ច្បាប់', 'Excused')}: {counts.excused}
                </span>
              </div>
            </div>

            {canEdit && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => markAll('present')}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <Check className="w-3.5 h-3.5" />
                  {tx('វត្តមានទាំងអស់', 'All Present')}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPrintRequest({ type: 'attendance_sheet', classId: selectedClassId })
                  }
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  {tx('បោះពុម្ព', 'Print')}
                </button>
                <button
                  type="button"
                  onClick={handleSaveSheet}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow"
                >
                  <Save className="w-3.5 h-3.5" />
                  {tx('រក្សាទុកវត្តមាន', 'Save Attendance')}
                </button>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase text-slate-500">
                    <th className="py-3.5 px-4 w-12">#</th>
                    <th className="py-3.5 px-4">{tx('សិស្ស', 'Student')}</th>
                    <th className="py-3.5 px-4 text-center">{tx('ជ្រើសរើសវត្តមាន', 'Status')}</th>
                    <th className="py-3.5 px-4">{tx('កំណត់សម្គាល់ / មូលហេតុ', 'Remarks')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {roster.map((st, idx) => {
                    const cur = draftStatus[st.id] || 'present';
                    return (
                      <tr key={st.id}>
                        <td className="py-3 px-4 text-xs font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                              style={{ backgroundColor: avatarColorFor(st.id) }}
                            >
                              {initialsFor(st.nameEn || st.nameKh)}
                            </div>
                            <div>
                              <div className="font-bold">{displayStudentName(st, lang)}</div>
                              <div className="text-[11px] font-mono text-slate-400">{st.studentCode}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {(
                              [
                                ['present', 'P', 'វត្តមាន', 'bg-emerald-600 text-white'],
                                ['absent', 'A', 'អវត្តមាន', 'bg-rose-600 text-white'],
                                ['late', 'L', 'មកយឺត', 'bg-amber-500 text-white'],
                                ['excused', 'E', 'ច្បាប់', 'bg-purple-600 text-white'],
                              ] as const
                            ).map(([code, short, khLbl, activeCls]) => {
                              const isOn = cur === code;
                              return (
                                <button
                                  key={code}
                                  type="button"
                                  disabled={!canEdit}
                                  onClick={() =>
                                    setDraftStatus((prev) => ({ ...prev, [st.id]: code }))
                                  }
                                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
                                    isOn
                                      ? `${activeCls} shadow-xs`
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                                  }`}
                                >
                                  {lang === 'km' ? khLbl : short}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            disabled={!canEdit}
                            value={draftRemarks[st.id] || ''}
                            onChange={(e) =>
                              setDraftRemarks((prev) => ({ ...prev, [st.id]: e.target.value }))
                            }
                            placeholder={tx('កំណត់ហេតុ...', 'Optional note...')}
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs outline-none"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* QR SCANNER SIMULATOR TAB */}
      {tab === 'qrscan' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold">
                  {tx('ម៉ាស៊ីនស្កេនកាតសិស្សចូលខ្លោងទ្វារសាលា', 'Gate QR / Barcode Check-in Terminal')}
                </h2>
                <p className="text-xs text-slate-500">
                  {tx(
                    'វាយបញ្ចូល ឬប្រើម៉ាស៊ីនស្កេនអត្តលេខសិស្ស (ឧ. STU-2026-001) រួចចុច Enter',
                    'Scan barcode/QR or type Student Code (e.g. STU-2026-001) and press Enter'
                  )}
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleQrCheckIn(qrInput);
              }}
              className="flex gap-2 mb-4"
            >
              <input
                type="text"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="STU-2026-001"
                className="flex-1 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-sm font-bold outline-none border-2 border-transparent focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold"
              >
                {tx('ស្កេនចូលរៀន', 'Check In')}
              </button>
            </form>

            {lastScanned && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm font-bold">
                {lastScanned}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <h3 className="text-sm font-extrabold mb-3">
              {tx('ជ្រើសរើសប័ណ្ណសិស្សដើម្បីកត់វត្តមានរហ័ស', 'Quick Select Enrolled Student')}
            </h3>
            {snapshot.students.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">
                {tx('មិនទាន់មានសិស្សក្នុងបញ្ជីនៅឡើយទេ', 'No students enrolled yet')}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {snapshot.students.slice(0, 8).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleQrCheckIn(s.studentCode)}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 text-left flex items-center justify-between transition"
                  >
                    <div>
                      <div className="text-xs font-bold">{displayStudentName(s, lang)}</div>
                      <div className="text-[11px] font-mono text-slate-400">{s.studentCode}</div>
                    </div>
                    <QrCode className="w-4 h-4 text-blue-600" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* WATCHLIST ALERTS TAB */}
      {tab === 'alerts' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-rose-600 font-extrabold text-base mb-4">
            <AlertCircle className="w-5 h-5" />
            {tx(
              'បញ្ជីតាមដានសិស្សដែលមានវត្តមានទាបជាង ៨៨% (ត្រូវជូនដំណឹងអាណាព្យាបាល)',
              'Students Below 88% Attendance Threshold (Parent Follow-up Needed)'
            )}
          </div>

          {watchlist.length === 0 ? (
            <div className="text-sm text-slate-400 py-8 text-center">
              {tx('សិស្សទាំងអស់មានអត្រាវត្តមានល្អប្រសើរ!', 'All students have healthy attendance!')}
            </div>
          ) : (
            <div className="space-y-3">
              {watchlist.map((w) => {
                const cls = snapshot.classes.find((c) => c.id === w.student.classId);
                return (
                  <div
                    key={w.student.id}
                    onClick={() => openStudentProfile(w.student.id)}
                    className="cursor-pointer p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div>
                      <div className="font-bold text-sm">
                        {displayStudentName(w.student, lang)} ({w.student.studentCode})
                      </div>
                      <div className="text-xs text-slate-500">
                        {displayClassName(cls, lang)} · {tx('អាណាព្យាបាល៖ ', 'Guardian: ')}
                        {w.student.guardianName} ({w.student.guardianPhone})
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-rose-600">
                        {tx(`អវត្តមាន ${w.absent} ដង`, `${w.absent} Absences`)}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-extrabold">
                        {w.rate}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
