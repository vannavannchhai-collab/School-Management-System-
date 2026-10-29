import React, { useState } from 'react';
import { ClipboardList, Plus, Trash2, Star, ShieldAlert, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dataEngine } from '../services/dataEngine';
import { displayClassName, displayStudentName } from '../utils/academic';

export const AssignmentsBehaviorModule: React.FC = () => {
  const { snapshot, tx, lang, user, applyServerResult } = useApp();
  const [tab, setTab] = useState<'assignments' | 'behavior'>('assignments');

  const [asnModal, setAsnModal] = useState(false);
  const [asnForm, setAsnForm] = useState({
    classId: snapshot.classes[0]?.id || '',
    subjectId: snapshot.subjects[0]?.id || '',
    teacherId: snapshot.teachers[0]?.id || '',
    title: '',
    description: '',
    dueDate: new Date().toISOString().slice(0, 10),
    maxPoints: 20,
  });

  const [bhvModal, setBhvModal] = useState(false);
  const [bhvForm, setBhvForm] = useState({
    studentId: snapshot.students[0]?.id || '',
    type: 'merit' as 'merit' | 'award' | 'warning',
    points: 10,
    title: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
  });

  const canEdit = user?.role === 'admin' || user?.role === 'teacher';

  const linkedStudent =
    user?.role === 'student'
      ? snapshot.students.find((s) => s.id === user.linkedId)
      : null;

  const visibleAssignments =
    user?.role === 'student' && linkedStudent
      ? snapshot.assignments.filter((a) => a.classId === linkedStudent.classId)
      : snapshot.assignments;

  const visibleBehavior =
    user?.role === 'student' && linkedStudent
      ? snapshot.behaviorRecords.filter((b) => b.studentId === linkedStudent.id)
      : snapshot.behaviorRecords;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-indigo-600" />
            {tx('កិច្ចការផ្ទះ វិញ្ញាសា និងការតាមដានវិន័យសិស្ស', 'Homework Assignments & Student Conduct')}
          </h1>
          <p className="text-sm text-slate-500">
            {tx(
              'ដាក់កិច្ចការស្រាវជ្រាវតាមថ្នាក់ និងកត់ត្រាពិន្ទុសីលធម៌ បណ្ណសរសើរ ឬការណែនាំវិន័យ',
              'Manage class assignments, due dates, positive merit awards, and discipline records'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex">
            <button
              type="button"
              onClick={() => setTab('assignments')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold ${
                tab === 'assignments' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {tx(`កិច្ចការផ្ទះ (${visibleAssignments.length})`, `Homework (${visibleAssignments.length})`)}
            </button>
            <button
              type="button"
              onClick={() => setTab('behavior')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold ${
                tab === 'behavior' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {tx(`វិន័យ & បណ្ណសរសើរ (${visibleBehavior.length})`, `Conduct (${visibleBehavior.length})`)}
            </button>
          </div>

          {canEdit && tab === 'assignments' && (
            <button
              type="button"
              onClick={() => {
                setAsnForm((f) => ({
                  ...f,
                  classId: f.classId || snapshot.classes[0]?.id || '',
                  subjectId: f.subjectId || snapshot.subjects[0]?.id || '',
                  teacherId: f.teacherId || snapshot.teachers[0]?.id || '',
                }));
                setAsnModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              {tx('ដាក់កិច្ចការផ្ទះ', 'Post Homework')}
            </button>
          )}

          {canEdit && tab === 'behavior' && (
            <button
              type="button"
              onClick={() => {
                setBhvForm((f) => ({
                  ...f,
                  studentId: f.studentId || snapshot.students[0]?.id || '',
                }));
                setBhvModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              {tx('កត់ត្រាវិន័យ/សរសើរ', 'Log Conduct')}
            </button>
          )}
        </div>
      </div>

      {tab === 'assignments' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleAssignments.map((asn) => {
            const cls = snapshot.classes.find((c) => c.id === asn.classId);
            const sub = snapshot.subjects.find((s) => s.id === asn.subjectId);
            const tch = snapshot.teachers.find((t) => t.id === asn.teacherId);
            return (
              <div
                key={asn.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 text-xs font-bold">
                        {displayClassName(cls, lang)}
                      </span>
                      {sub && (
                        <span
                          className="px-2.5 py-0.5 rounded-full text-white text-xs font-bold"
                          style={{ backgroundColor: sub.color }}
                        >
                          {tx(sub.nameKh, sub.nameEn)}
                        </span>
                      )}
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => applyServerResult(dataEngine.deleteAssignment(asn.id))}
                        className="text-rose-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <h3 className="font-extrabold text-base mb-1">{asn.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {asn.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    {tch ? tx(tch.nameKh, tch.nameEn) : ''} · {asn.maxPoints} pts
                  </span>
                  <span className="font-bold text-amber-600">
                    {tx('ផុតកំណត់៖ ', 'Due: ')}
                    {asn.dueDate}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleBehavior.map((bhv) => {
            const st = snapshot.students.find((s) => s.id === bhv.studentId);
            const cls = snapshot.classes.find((c) => c.id === st?.classId);
            return (
              <div
                key={bhv.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      bhv.points >= 0
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {bhv.points >= 0 ? (
                      <Star className="w-5 h-5" />
                    ) : (
                      <ShieldAlert className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="font-extrabold text-sm">
                      {displayStudentName(st, lang)}{' '}
                      <span className="text-xs font-semibold text-blue-600">
                        ({displayClassName(cls, lang)})
                      </span>
                    </div>
                    <div className="text-sm font-bold mt-0.5">{bhv.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{bhv.description}</div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {bhv.date} · {bhv.recordedBy}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                      bhv.points >= 0
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {bhv.points >= 0 ? `+${bhv.points}` : bhv.points} pts
                  </span>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => applyServerResult(dataEngine.deleteBehavior(bhv.id))}
                      className="text-rose-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post Assignment Modal */}
      {asnModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold">
                {tx('ដាក់កិច្ចការផ្ទះថ្មី', 'Post Homework Assignment')}
              </h2>
              <button type="button" onClick={() => setAsnModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const ok = await applyServerResult(
                  dataEngine.createAssignment(asnForm),
                  tx('បានដាក់កិច្ចការផ្ទះជូនសិស្ស!', 'Homework posted!')
                );
                if (ok) setAsnModal(false);
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Class</label>
                  <select
                    value={asnForm.classId}
                    onChange={(e) => setAsnForm({ ...asnForm, classId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  >
                    {snapshot.classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {displayClassName(c, lang)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Subject</label>
                  <select
                    value={asnForm.subjectId}
                    onChange={(e) => setAsnForm({ ...asnForm, subjectId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  >
                    {snapshot.subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {tx(s.nameKh, s.nameEn)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {tx('ប្រធានបទកិច្ចការផ្ទះ *', 'Title *')}
                </label>
                <input
                  required
                  value={asnForm.title}
                  onChange={(e) => setAsnForm({ ...asnForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {tx('សេចក្តីណែនាំលម្អិត', 'Instructions')}
                </label>
                <textarea
                  rows={3}
                  value={asnForm.description}
                  onChange={(e) => setAsnForm({ ...asnForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={asnForm.dueDate}
                    onChange={(e) => setAsnForm({ ...asnForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Max Points</label>
                  <input
                    type="number"
                    value={asnForm.maxPoints}
                    onChange={(e) =>
                      setAsnForm({ ...asnForm, maxPoints: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAsnModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  {tx('បោះបង់', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                >
                  {tx('ប្រកាសកិច្ចការ', 'Publish')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Behavior Modal */}
      {bhvModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h2 className="text-lg font-extrabold mb-4">
              {tx('កត់ត្រាបណ្ណសរសើរ ឬការណែនាំវិន័យ', 'Log Student Merit or Warning')}
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const pts =
                  bhvForm.type === 'warning'
                    ? -Math.abs(bhvForm.points)
                    : Math.abs(bhvForm.points);
                const ok = await applyServerResult(
                  dataEngine.createBehavior({ ...bhvForm, points: pts }),
                  tx('រក្សាទុកកំណត់ត្រាវិន័យរួចរាល់!', 'Behavior record saved!')
                );
                if (ok) setBhvModal(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Student</label>
                <select
                  value={bhvForm.studentId}
                  onChange={(e) => setBhvForm({ ...bhvForm, studentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                >
                  {snapshot.students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {displayStudentName(s, lang)} ({s.studentCode})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Type</label>
                  <select
                    value={bhvForm.type}
                    onChange={(e) =>
                      setBhvForm({
                        ...bhvForm,
                        type: e.target.value as 'merit' | 'award' | 'warning',
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  >
                    <option value="merit">បណ្ណសរសើរ (+Merit)</option>
                    <option value="award">ជ័យលាភីឆ្នើម (+Award)</option>
                    <option value="warning">ណែនាំវិន័យ (-Warning)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Points</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={Math.abs(bhvForm.points)}
                    onChange={(e) => setBhvForm({ ...bhvForm, points: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Title *</label>
                <input
                  required
                  value={bhvForm.title}
                  onChange={(e) => setBhvForm({ ...bhvForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Details</label>
                <textarea
                  rows={2}
                  value={bhvForm.description}
                  onChange={(e) => setBhvForm({ ...bhvForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBhvModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  {tx('បោះបង់', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
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
