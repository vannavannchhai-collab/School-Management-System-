import React, { useEffect, useState } from 'react';
import {
  Award,
  Save,
  Printer,
  Trophy,
  Plus,
  Trash2,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dataEngine } from '../services/dataEngine';
import {
  avatarColorFor,
  computeClassRanking,
  displayClassName,
  displayStudentName,
  getGradeBadgeClass,
  getMoeysGrade,
  getMoeysGradeMention,
  initialsFor,
  PERIOD_OPTIONS,
} from '../utils/academic';

export const GradesExamsModule: React.FC = () => {
  const {
    snapshot,
    tx,
    lang,
    user,
    applyServerResult,
    setPrintRequest,
    openStudentProfile,
  } = useApp();

  const linkedStudent =
    user?.role === 'student'
      ? snapshot.students.find((s) => s.id === user.linkedId)
      : null;

  const [subTab, setSubTab] = useState<'ranking' | 'entry' | 'honor' | 'exams'>(
    user?.role === 'student' ? 'ranking' : 'ranking'
  );
  const [selectedClassId, setSelectedClassId] = useState(
    linkedStudent?.classId || snapshot.classes[0]?.id || ''
  );
  const [selectedPeriod, setSelectedPeriod] = useState('2026-10');
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    snapshot.subjects[0]?.id || ''
  );

  useEffect(() => {
    if (!selectedClassId && snapshot.classes.length > 0) {
      setSelectedClassId(linkedStudent?.classId || snapshot.classes[0].id);
    }
  }, [snapshot.classes, selectedClassId, linkedStudent]);

  useEffect(() => {
    if (!selectedSubjectId && snapshot.subjects.length > 0) {
      setSelectedSubjectId(snapshot.subjects[0].id);
    }
  }, [snapshot.subjects, selectedSubjectId]);

  const [scoreDraft, setScoreDraft] = useState<Record<string, string>>({});
  const [remarkDraft, setRemarkDraft] = useState<Record<string, string>>({});

  const [examModal, setExamModal] = useState(false);
  const [examForm, setExamForm] = useState({
    titleKh: '',
    titleEn: '',
    periodCode: '2026-11',
    examType: 'monthly',
    classId: 'all',
    startDate: '2026-11-25',
    endDate: '2026-11-27',
  });

  const canEdit = user?.role === 'admin' || user?.role === 'teacher';

  const classRoster = snapshot.students.filter(
    (s) => s.classId === selectedClassId && s.status === 'active'
  );

  const activeSubject = snapshot.subjects.find((s) => s.id === selectedSubjectId);

  useEffect(() => {
    const nextScores: Record<string, string> = {};
    const nextRem: Record<string, string> = {};
    classRoster.forEach((st) => {
      const existing = snapshot.grades.find(
        (g) =>
          g.studentId === st.id &&
          g.subjectId === selectedSubjectId &&
          g.periodCode === selectedPeriod
      );
      nextScores[st.id] = existing ? String(existing.score) : '';
      nextRem[st.id] = existing?.remarks || '';
    });
    setScoreDraft(nextScores);
    setRemarkDraft(nextRem);
  }, [selectedClassId, selectedSubjectId, selectedPeriod, snapshot.grades, snapshot.students]);

  // Subjects that actually have scores for this class, or default top subjects
  const activeSubjectsForTable = snapshot.subjects.filter((sub) =>
    snapshot.grades.some(
      (g) =>
        classRoster.some((s) => s.id === g.studentId) &&
        g.subjectId === sub.id &&
        (selectedPeriod === 'all' || g.periodCode === selectedPeriod)
    )
  );
  const displaySubjects =
    activeSubjectsForTable.length > 0 ? activeSubjectsForTable : snapshot.subjects.slice(0, 6);

  const rankedList = computeClassRanking(
    classRoster,
    snapshot.grades,
    displaySubjects,
    selectedPeriod
  );

  const handleSaveScores = async () => {
    const entries = classRoster
      .filter((st) => scoreDraft[st.id] !== undefined && scoreDraft[st.id].trim() !== '')
      .map((st) => {
        const max = activeSubject?.maxScore || 100;
        const val = Math.max(0, Math.min(max, Number(scoreDraft[st.id])));
        return {
          studentId: st.id,
          classId: selectedClassId,
          subjectId: selectedSubjectId,
          subjectName: activeSubject?.nameKh || selectedSubjectId,
          periodCode: selectedPeriod,
          score: val,
          maxScore: max,
          remarks: remarkDraft[st.id] || '',
        };
      });

    await applyServerResult(
      dataEngine.saveGradesBatch(entries),
      tx('រក្សាទុកតារាងពិន្ទុជោគជ័យ!', 'Subject scores saved successfully!')
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <Award className="w-6 h-6 text-blue-600" />
            {tx('ប្រព័ន្ធពិន្ទុ ចំណាត់ថ្នាក់ និងការប្រឡង (MoEYS A–F)', 'MoEYS Gradebook, Rankings & Exams')}
          </h1>
          <p className="text-sm text-slate-500">
            {tx(
              'គណនាពិន្ទុសរុប មធ្យមភាគ ចំណាត់ថ្នាក់ និទ្ទេស A–F និងតារាងកិត្តិយសដោយស្វ័យប្រវត្តិ',
              'Automated totals, averages, tie-aware class ranks, MoEYS A–F mentions, and Honor Roll'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex overflow-x-auto">
            <button
              type="button"
              onClick={() => setSubTab('ranking')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                subTab === 'ranking' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {tx('តារាងចំណាត់ថ្នាក់រួម', 'Master Ranking')}
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={() => setSubTab('entry')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                  subTab === 'entry' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {tx('បញ្ចូលពិន្ទុតាមមុខវិជ្ជា', 'Batch Score Entry')}
              </button>
            )}
            <button
              type="button"
              onClick={() => setSubTab('honor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                subTab === 'honor' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {tx('តារាងកិត្តិយស Top 5', 'Honor Roll')}
            </button>
            <button
              type="button"
              onClick={() => setSubTab('exams')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                subTab === 'exams' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {tx('កាលវិភាគប្រឡង', 'Exam Sessions')}
            </button>
          </div>
        </div>
      </div>

      {/* Shared Class & Period Selector */}
      {subTab !== 'exams' && (
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

            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold"
            >
              {PERIOD_OPTIONS.filter((p) => subTab !== 'entry' || p.code !== 'all').map((p) => (
                <option key={p.code} value={p.code}>
                  {tx(p.labelKh, p.labelEn)}
                </option>
              ))}
            </select>

            {subTab === 'entry' && (
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-sm font-extrabold"
              >
                {snapshot.subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {tx(sub.nameKh, sub.nameEn)} (Max {sub.maxScore})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {subTab === 'ranking' && (
              <button
                type="button"
                onClick={() =>
                  setPrintRequest({
                    type: 'class_master_sheet',
                    classId: selectedClassId,
                    periodCode: selectedPeriod,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow"
              >
                <Printer className="w-4 h-4" />
                {tx('បោះពុម្ពតារាងពិន្ទុរួម', 'Print Master Sheet')}
              </button>
            )}
            {subTab === 'honor' && (
              <button
                type="button"
                onClick={() =>
                  setPrintRequest({
                    type: 'honor_roll',
                    classId: selectedClassId,
                    periodCode: selectedPeriod,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold shadow"
              >
                <Printer className="w-4 h-4" />
                {tx('បោះពុម្ពតារាងកិត្តិយស A4', 'Print Honor Roll')}
              </button>
            )}
            {subTab === 'entry' && canEdit && (
              <button
                type="button"
                onClick={handleSaveScores}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow"
              >
                <Save className="w-4 h-4" />
                {tx('រក្សាទុកពិន្ទុទាំងអស់', 'Save All Scores')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* MASTER RANKING MATRIX */}
      {subTab === 'ranking' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase text-slate-500">
                  <th className="py-3.5 px-3 text-center">{tx('ចំណាត់ថ្នាក់', 'Rank')}</th>
                  <th className="py-3.5 px-3">{tx('គោត្តនាម និងនាម', 'Student')}</th>
                  {displaySubjects.map((sub) => (
                    <th key={sub.id} className="py-3.5 px-2 text-center whitespace-nowrap">
                      {sub.code}
                    </th>
                  ))}
                  <th className="py-3.5 px-3 text-right">{tx('ពិន្ទុសរុប', 'Total')}</th>
                  <th className="py-3.5 px-3 text-right">{tx('មធ្យមភាគ', 'Avg')}</th>
                  <th className="py-3.5 px-3 text-center">{tx('និទ្ទេស', 'Grade')}</th>
                  <th className="py-3.5 px-3 text-center">{tx('លទ្ធផល', 'Result')}</th>
                  <th className="py-3.5 px-3 text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rankedList.map((row) => (
                  <tr
                    key={row.student.id}
                    className={`hover:bg-blue-50/40 dark:hover:bg-slate-800/40 ${
                      user?.role === 'student' && row.student.id === user.linkedId
                        ? 'bg-blue-50/70 dark:bg-blue-950/30'
                        : ''
                    }`}
                  >
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex w-7 h-7 rounded-full items-center justify-center text-xs font-extrabold ${
                          row.rank === 1
                            ? 'bg-amber-100 text-amber-700'
                            : row.rank === 2
                            ? 'bg-slate-200 text-slate-700'
                            : row.rank === 3
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {row.rank ? `#${row.rank}` : '—'}
                      </span>
                    </td>
                    <td
                      onClick={() =>
                        user?.role !== 'student' && openStudentProfile(row.student.id)
                      }
                      className="py-3 px-3 font-bold cursor-pointer hover:text-blue-600 whitespace-nowrap"
                    >
                      {displayStudentName(row.student, lang)}
                    </td>
                    {displaySubjects.map((sub) => {
                      const sc = row.scoresBySubject[sub.id];
                      return (
                        <td
                          key={sub.id}
                          className={`py-3 px-2 text-center font-medium ${
                            sc !== null && sc < 50 ? 'text-rose-500 font-bold' : ''
                          }`}
                        >
                          {sc !== null && sc !== undefined ? sc : '—'}
                        </td>
                      );
                    })}
                    <td className="py-3 px-3 text-right font-bold">{row.totalScore || '—'}</td>
                    <td className="py-3 px-3 text-right font-extrabold text-blue-600 dark:text-blue-400">
                      {row.averagePct !== null ? `${row.averagePct.toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${getGradeBadgeClass(row.grade)}`}>
                        {row.grade}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {row.passed === null ? (
                        '—'
                      ) : row.passed ? (
                        <span className="text-xs font-bold text-emerald-600">
                          {tx('ជាប់', 'Pass')}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-rose-600">
                          {tx('ធ្លាក់', 'Fail')}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setPrintRequest({
                            type: 'student_report_card',
                            studentId: row.student.id,
                            periodCode: selectedPeriod,
                          })
                        }
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800"
                        title="Print Student Report Card"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BATCH SCORE ENTRY */}
      {subTab === 'entry' && canEdit && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase text-slate-500">
                  <th className="py-3.5 px-4 w-12">#</th>
                  <th className="py-3.5 px-4">{tx('សិស្ស', 'Student')}</th>
                  <th className="py-3.5 px-4 w-40 text-center">
                    {tx(`ពិន្ទុ (/ ${activeSubject?.maxScore || 100})`, `Score (/ ${activeSubject?.maxScore || 100})`)}
                  </th>
                  <th className="py-3.5 px-4 text-center">{tx('និទ្ទេស', 'Live Grade')}</th>
                  <th className="py-3.5 px-4">{tx('មតិយោបល់គ្រូបង្រៀន', 'Teacher Remarks')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {classRoster.map((st, idx) => {
                  const rawVal = scoreDraft[st.id] ?? '';
                  const num = rawVal === '' ? null : Number(rawVal);
                  const pct =
                    num !== null && (activeSubject?.maxScore || 100) > 0
                      ? (num / (activeSubject?.maxScore || 100)) * 100
                      : null;
                  const g = getMoeysGrade(pct);
                  return (
                    <tr key={st.id}>
                      <td className="py-3 px-4 text-xs text-slate-400 font-bold">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold">{displayStudentName(st, lang)}</td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min={0}
                          max={activeSubject?.maxScore || 100}
                          step="0.5"
                          value={rawVal}
                          onChange={(e) =>
                            setScoreDraft((prev) => ({ ...prev, [st.id]: e.target.value }))
                          }
                          className="w-28 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-center font-extrabold outline-none border-2 border-transparent focus:border-blue-500"
                          placeholder="0 - 100"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getGradeBadgeClass(g)}`}>
                          {g} · {getMoeysGradeMention(g, lang)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={remarkDraft[st.id] || ''}
                          onChange={(e) =>
                            setRemarkDraft((prev) => ({ ...prev, [st.id]: e.target.value }))
                          }
                          placeholder={tx('មតិយោបល់...', 'Comment...')}
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
      )}

      {/* TOP 5 HONOR ROLL PODIUM */}
      {subTab === 'honor' && (
        <div className="bg-gradient-to-br from-amber-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 rounded-3xl p-6 sm:p-10 border border-amber-200/70 dark:border-slate-800 shadow-xs">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold mb-3">
              <Trophy className="w-4 h-4" />
              <span>តារាងកិត្តិយស · CLASS HONOR ROLL</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-moul text-slate-900 dark:text-white">
              តារាងកិត្តិយសសិស្សពូកែប្រចាំថ្នាក់
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {displayClassName(
                snapshot.classes.find((c) => c.id === selectedClassId),
                lang
              )}{' '}
              · {tx('ឆ្នាំសិក្សា ', 'AY ')}
              {snapshot.settings.academicYear}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {rankedList.slice(0, 5).map((item, i) => (
              <div
                key={item.student.id}
                className={`rounded-3xl p-5 text-center border bg-white dark:bg-slate-900 shadow-md flex flex-col items-center ${
                  i === 0
                    ? 'border-amber-400 ring-2 ring-amber-300/50 lg:-translate-y-2'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div
                  className={`px-3 py-1 rounded-full text-xs font-extrabold mb-3 ${
                    i === 0
                      ? 'bg-amber-400 text-slate-950'
                      : i === 1
                      ? 'bg-slate-200 text-slate-800'
                      : i === 2
                      ? 'bg-orange-200 text-orange-900'
                      : 'bg-blue-50 text-blue-700'
                  }`}
                >
                  {tx(`ចំណាត់ថ្នាក់លេខ ${i + 1}`, `Rank #${i + 1}`)}
                </div>

                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-extrabold mb-3 shadow"
                  style={{ backgroundColor: avatarColorFor(item.student.id) }}
                >
                  {initialsFor(item.student.nameEn || item.student.nameKh)}
                </div>

                <div className="font-extrabold text-base">{item.student.nameKh}</div>
                <div className="text-xs text-slate-400 mb-3">{item.student.nameEn}</div>

                <div className="mt-auto w-full pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-extrabold text-blue-600">
                    {item.averagePct ? `${item.averagePct.toFixed(1)}%` : '—'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full font-extrabold ${getGradeBadgeClass(item.grade)}`}>
                    និទ្ទេស {item.grade}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EXAMS TAB */}
      {subTab === 'exams' && (
        <div className="space-y-4">
          {canEdit && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setExamModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
              >
                <Plus className="w-4 h-4" />
                {tx('បង្កើតសម័យប្រឡងថ្មី', 'Schedule Exam')}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {snapshot.exams.map((ex) => (
              <div
                key={ex.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold uppercase">
                      {ex.examType}
                    </span>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => applyServerResult(dataEngine.deleteExam(ex.id))}
                        className="text-rose-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <h3 className="font-extrabold text-base">{tx(ex.titleKh, ex.titleEn || ex.titleKh)}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {tx('កាលបរិច្ឆេទ៖ ', 'Dates: ')}
                    <b>
                      {ex.startDate} → {ex.endDate}
                    </b>
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Period: {ex.periodCode}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold ${
                      ex.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {ex.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Exam Modal */}
      {examModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold">
                {tx('បង្កើតកម្មវិធីប្រឡងថ្មី', 'Create Exam Session')}
              </h2>
              <button type="button" onClick={() => setExamModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const ok = await applyServerResult(
                  dataEngine.createExam(examForm),
                  tx('បង្កើតកាលវិភាគប្រឡងរួចរាល់!', 'Exam scheduled!')
                );
                if (ok) setExamModal(false);
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {tx('ចំណងជើងការប្រឡង (ខ្មែរ) *', 'Exam Title (Khmer) *')}
                </label>
                <input
                  required
                  value={examForm.titleKh}
                  onChange={(e) => setExamForm({ ...examForm, titleKh: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  placeholder="ប្រឡងប្រចាំខែវិច្ឆិកា ២០២៦"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={examForm.startDate}
                    onChange={(e) => setExamForm({ ...examForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={examForm.endDate}
                    onChange={(e) => setExamForm({ ...examForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setExamModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  {tx('បោះបង់', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                >
                  {tx('រក្សាទុក', 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
