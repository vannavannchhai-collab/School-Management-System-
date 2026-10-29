import React, { useState } from 'react';
import { CalendarDays, Plus, Trash2, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dataEngine } from '../services/dataEngine';
import { displayClassName } from '../utils/academic';

const DAYS = [
  { d: 1, kh: 'ថ្ងៃចន្ទ', en: 'Monday' },
  { d: 2, kh: 'ថ្ងៃអង្គារ', en: 'Tuesday' },
  { d: 3, kh: 'ថ្ងៃពុធ', en: 'Wednesday' },
  { d: 4, kh: 'ថ្ងៃព្រហស្បតិ៍', en: 'Thursday' },
  { d: 5, kh: 'ថ្ងៃសុក្រ', en: 'Friday' },
  { d: 6, kh: 'ថ្ងៃសៅរ៍', en: 'Saturday' },
];

const PERIODS = [
  { p: 1, time: '07:00 - 08:00', shift: 'morning' },
  { p: 2, time: '08:00 - 09:00', shift: 'morning' },
  { p: 3, time: '09:15 - 10:15', shift: 'morning' },
  { p: 4, time: '10:15 - 11:15', shift: 'morning' },
  { p: 5, time: '13:30 - 14:30', shift: 'afternoon' },
  { p: 6, time: '14:30 - 15:30', shift: 'afternoon' },
];

export const TimetableModule: React.FC = () => {
  const { snapshot, tx, lang, user, applyServerResult } = useApp();

  const linkedStudent =
    user?.role === 'student'
      ? snapshot.students.find((s) => s.id === user.linkedId)
      : null;

  const [viewMode, setViewMode] = useState<'class' | 'teacher'>('class');
  const [selectedClassId, setSelectedClassId] = useState(
    linkedStudent?.classId || 'CLS-12A'
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState(
    user?.role === 'teacher' ? user.linkedId : 'TCH-002'
  );

  const [slotModal, setSlotModal] = useState<{
    dayOfWeek: number;
    periodIndex: number;
    timeRange: string;
    subjectId: string;
    teacherId: string;
    room: string;
    existingId?: string;
  } | null>(null);

  const canEdit = user?.role === 'admin' || user?.role === 'teacher';

  const openSlotEditor = (day: number, period: number, timeRange: string) => {
    if (!canEdit || viewMode !== 'class') return;
    const existing = snapshot.timetable.find(
      (t) =>
        t.classId === selectedClassId &&
        t.dayOfWeek === day &&
        t.periodIndex === period
    );
    const cls = snapshot.classes.find((c) => c.id === selectedClassId);
    setSlotModal({
      dayOfWeek: day,
      periodIndex: period,
      timeRange,
      subjectId: existing?.subjectId || snapshot.subjects[0]?.id || '',
      teacherId: existing?.teacherId || snapshot.teachers[1]?.id || '',
      room: existing?.room || cls?.room || 'H-402',
      existingId: existing?.id,
    });
  };

  // Detect live teacher double-booking conflict!
  const teacherConflict = slotModal
    ? snapshot.timetable.find(
        (t) =>
          t.classId !== selectedClassId &&
          t.dayOfWeek === slotModal.dayOfWeek &&
          t.periodIndex === slotModal.periodIndex &&
          t.teacherId === slotModal.teacherId
      )
    : null;

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotModal) return;
    const ok = await applyServerResult(
      dataEngine.saveTimetableSlot({
        classId: selectedClassId,
        subjectId: slotModal.subjectId,
        teacherId: slotModal.teacherId,
        dayOfWeek: slotModal.dayOfWeek,
        periodIndex: slotModal.periodIndex,
        timeRange: slotModal.timeRange,
        room: slotModal.room,
      }),
      tx('រក្សាទុកម៉ោងសិក្សាជោគជ័យ!', 'Timetable slot updated!')
    );
    if (ok) setSlotModal(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-blue-600" />
            {tx('កាលវិភាគសិក្សាប្រចាំសប្តាហ៍ (ចន្ទ – សៅរ៍)', 'Weekly Academic Timetable')}
          </h1>
          <p className="text-sm text-slate-500">
            {tx(
              'ពិនិត្យម៉ោងបង្រៀនតាមថ្នាក់ ឬតាមគ្រូបង្រៀន ជាមួយប្រព័ន្ធការពារជាន់ម៉ោងស្វ័យប្រវត្តិ',
              'Interactive schedule by class or teacher with automatic double-booking conflict detection'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {user?.role !== 'student' && (
            <div className="bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex">
              <button
                type="button"
                onClick={() => setViewMode('class')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  viewMode === 'class' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {tx('តាមថ្នាក់រៀន', 'By Class')}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('teacher')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  viewMode === 'teacher' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {tx('តាមគ្រូបង្រៀន', 'By Teacher')}
              </button>
            </div>
          )}

          {viewMode === 'class' && user?.role !== 'student' && (
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-bold"
            >
              {snapshot.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {displayClassName(c, lang)}
                </option>
              ))}
            </select>
          )}

          {viewMode === 'teacher' && (
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-bold"
            >
              {snapshot.teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {tx(t.nameKh, t.nameEn)}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Weekly Timetable Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[880px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-xs">
                <th className="py-3.5 px-3 text-left font-bold text-slate-500 w-32">
                  {tx('ម៉ោងសិក្សា', 'Time Slot')}
                </th>
                {DAYS.map((d) => (
                  <th key={d.d} className="py-3.5 px-3 text-center font-extrabold text-slate-700 dark:text-slate-200">
                    {tx(d.kh, d.en)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {PERIODS.map((per, idx) => (
                <React.Fragment key={per.p}>
                  {idx === 4 && (
                    <tr className="bg-amber-50/70 dark:bg-amber-950/20">
                      <td
                        colSpan={7}
                        className="py-2 text-center text-xs font-bold text-amber-700 dark:text-amber-300 tracking-wide"
                      >
                        🍱 {tx('សម្រាកអាហារថ្ងៃត្រង់ (11:15 – 13:30 Lunch Break)', '11:15 – 13:30 Midday Lunch Break')}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="p-3 bg-slate-50/50 dark:bg-slate-800/30 border-r border-slate-100 dark:border-slate-800">
                      <div className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
                        {tx(`ម៉ោងទី ${per.p}`, `Period ${per.p}`)}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">{per.time}</div>
                    </td>

                    {DAYS.map((day) => {
                      const slot =
                        viewMode === 'class'
                          ? snapshot.timetable.find(
                              (t) =>
                                t.classId === selectedClassId &&
                                t.dayOfWeek === day.d &&
                                t.periodIndex === per.p
                            )
                          : snapshot.timetable.find(
                              (t) =>
                                t.teacherId === selectedTeacherId &&
                                t.dayOfWeek === day.d &&
                                t.periodIndex === per.p
                            );

                      const sub = snapshot.subjects.find((s) => s.id === slot?.subjectId);
                      const tch = snapshot.teachers.find((t) => t.id === slot?.teacherId);
                      const cls = snapshot.classes.find((c) => c.id === slot?.classId);

                      return (
                        <td
                          key={day.d}
                          onClick={() => openSlotEditor(day.d, per.p, per.time)}
                          className={`p-2 border-r last:border-r-0 border-slate-100 dark:border-slate-800 align-top h-24 ${
                            canEdit && viewMode === 'class'
                              ? 'cursor-pointer hover:bg-blue-50/40 dark:hover:bg-slate-800/40'
                              : ''
                          }`}
                        >
                          {slot && sub ? (
                            <div
                              className="h-full rounded-xl p-2.5 text-white shadow-xs flex flex-col justify-between"
                              style={{ backgroundColor: sub.color || '#2563eb' }}
                            >
                              <div className="text-xs font-extrabold leading-snug">
                                {tx(sub.nameKh, sub.nameEn)}
                              </div>
                              <div className="mt-1.5 text-[11px] text-white/90">
                                <div className="truncate font-medium">
                                  {viewMode === 'class'
                                    ? tch
                                      ? tx(tch.nameKh, tch.nameEn)
                                      : '—'
                                    : displayClassName(cls, lang)}
                                </div>
                                <div className="text-[10px] text-white/75">Room: {slot.room}</div>
                              </div>
                            </div>
                          ) : canEdit && viewMode === 'class' ? (
                            <div className="h-full rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 hover:text-blue-500 hover:border-blue-300 transition">
                              <Plus className="w-4 h-4" />
                            </div>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slot Editor Modal */}
      {slotModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold">
                {tx('កំណត់ម៉ោងបង្រៀនក្នុងកាលវិភាគ', 'Configure Timetable Slot')}
              </h2>
              <button type="button" onClick={() => setSlotModal(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {teacherConflict && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <b>{tx('ប្រយ័ត្នជាន់ម៉ោងបង្រៀន!', 'Schedule Conflict Warning!')}</b>{' '}
                  {tx(
                    `គ្រូនេះមានម៉ោងបង្រៀននៅថ្នាក់ផ្សេងរួចហើយក្នុងម៉ោងដូចគ្នា (${teacherConflict.classId})។`,
                    `Selected teacher is already assigned to ${teacherConflict.classId} at this exact day & period.`
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveSlot} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {tx('មុខវិជ្ជា', 'Subject')}
                </label>
                <select
                  value={slotModal.subjectId}
                  onChange={(e) => setSlotModal({ ...slotModal, subjectId: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold"
                >
                  {snapshot.subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {tx(s.nameKh, s.nameEn)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {tx('គ្រូបង្រៀន', 'Teacher')}
                </label>
                <select
                  value={slotModal.teacherId}
                  onChange={(e) => setSlotModal({ ...slotModal, teacherId: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold"
                >
                  {snapshot.teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {tx(t.nameKh, t.nameEn)} ({t.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {tx('បន្ទប់រៀន', 'Room')}
                </label>
                <input
                  value={slotModal.room}
                  onChange={(e) => setSlotModal({ ...slotModal, room: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                />
              </div>

              <div className="flex items-center justify-between pt-3">
                {slotModal.existingId ? (
                  <button
                    type="button"
                    onClick={async () => {
                      await applyServerResult(
                        dataEngine.deleteTimetableSlot(slotModal.existingId!),
                        tx('បានលុបម៉ោងសិក្សា', 'Slot cleared')
                      );
                      setSlotModal(null);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {tx('លុបចេញ', 'Remove')}
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSlotModal(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                  >
                    {tx('បោះបង់', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                  >
                    {tx('រក្សាទុក', 'Save Slot')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
