import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Edit3,
  Trash2,
  Users,
  MapPin,
  Clock,
  DollarSign,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dataEngine } from '../services/dataEngine';
import { ClassRoom, Subject } from '../types';
import { displayClassName, formatUSD } from '../utils/academic';

export const AcademicModule: React.FC = () => {
  const { snapshot, tx, lang, user, applyServerResult, setPrintRequest } = useApp();
  const [subTab, setSubTab] = useState<'classes' | 'subjects'>('classes');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  const [classModal, setClassModal] = useState(false);
  const [classForm, setClassForm] = useState<Partial<ClassRoom>>({});

  const [subjectModal, setSubjectModal] = useState(false);
  const [subjectForm, setSubjectForm] = useState<Partial<Subject>>({});

  const isAdmin = user?.role === 'admin';

  const openAddClass = () => {
    setClassForm({
      code: 'G10-A',
      nameKh: '',
      nameEn: '',
      gradeLevel: 10,
      category: 'upper_secondary',
      track: 'Science',
      homeroomTeacherId: snapshot.teachers[1]?.id || '',
      room: 'H-405',
      shift: 'Morning & Afternoon',
      schedule: '07:00–17:00',
      capacity: 35,
      monthlyTuition: 155,
      academicYear: snapshot.settings.academicYear,
    });
    setClassModal(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await applyServerResult(
      dataEngine.saveClass(classForm),
      tx('រក្សាទុកថ្នាក់រៀនជោគជ័យ!', 'Class saved successfully!')
    );
    if (ok) setClassModal(false);
  };

  const handleDeleteClass = async (cls: ClassRoom) => {
    if (!window.confirm(tx(`លុបថ្នាក់ "${cls.nameKh}" មែនទេ?`, `Delete class "${cls.nameEn}"?`))) return;
    await applyServerResult(dataEngine.deleteClass(cls.id), tx('បានលុបថ្នាក់រៀន', 'Class deleted'));
  };

  const openAddSubject = () => {
    setSubjectForm({
      code: 'SUBJ',
      nameKh: '',
      nameEn: '',
      category: 'science',
      maxScore: 100,
      coefficient: 1.5,
      color: '#2563eb',
    });
    setSubjectModal(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await applyServerResult(
      dataEngine.saveSubject(subjectForm),
      tx('រក្សាទុកមុខវិជ្ជាជោគជ័យ!', 'Subject saved!')
    );
    if (ok) setSubjectModal(false);
  };

  const handleDeleteSubject = async (sub: Subject) => {
    if (!window.confirm(tx(`លុបមុខវិជ្ជា "${sub.nameKh}"?`, `Delete subject "${sub.nameEn}"?`))) return;
    await applyServerResult(dataEngine.deleteSubject(sub.id), tx('បានលុបមុខវិជ្ជា', 'Subject deleted'));
  };

  const filteredClasses = snapshot.classes.filter(
    (c) => levelFilter === 'all' || c.category === levelFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">
            {tx('រចនាសម្ព័ន្ធសិក្សា ថ្នាក់រៀន និងកម្មវិធីសិក្សា', 'Academic Classes & Curriculum')}
          </h1>
          <p className="text-sm text-slate-500">
            {tx(
              'គ្រប់គ្រងភូមិសិក្សា K–12 បន្ទប់រៀន ថ្លៃសិក្សាប្រចាំខែ និងមុខវិជ្ជាតាមស្តង់ដារ MoEYS',
              'Manage K–12 grade levels, classrooms, tuition tiers, and MoEYS subject coefficients'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex">
            <button
              type="button"
              onClick={() => setSubTab('classes')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                subTab === 'classes' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {tx(`ថ្នាក់រៀន (${snapshot.classes.length})`, `Classes (${snapshot.classes.length})`)}
            </button>
            <button
              type="button"
              onClick={() => setSubTab('subjects')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                subTab === 'subjects' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {tx(`មុខវិជ្ជា (${snapshot.subjects.length})`, `Subjects (${snapshot.subjects.length})`)}
            </button>
          </div>

          {isAdmin && subTab === 'classes' && (
            <button
              type="button"
              onClick={openAddClass}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow"
            >
              <Plus className="w-4 h-4" />
              {tx('បន្ថែមថ្នាក់', 'New Class')}
            </button>
          )}

          {isAdmin && subTab === 'subjects' && (
            <button
              type="button"
              onClick={openAddSubject}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow"
            >
              <Plus className="w-4 h-4" />
              {tx('បន្ថែមមុខវិជ្ជា', 'New Subject')}
            </button>
          )}
        </div>
      </div>

      {subTab === 'classes' ? (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              ['all', 'គ្រប់កម្រិតសិក្សា', 'All Levels'],
              ['kindergarten', 'មត្តេយ្យសិក្សា', 'Kindergarten'],
              ['primary', 'បឋមសិក្សា (G1–G6)', 'Primary'],
              ['lower_secondary', 'អនុវិទ្យាល័យ (G7–G9)', 'Lower Secondary'],
              ['upper_secondary', 'វិទ្យាល័យ (G10–G12)', 'Upper Secondary'],
            ].map(([k, kh, en]) => (
              <button
                key={k}
                type="button"
                onClick={() => setLevelFilter(k)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${
                  levelFilter === k
                    ? 'bg-slate-900 dark:bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {tx(kh, en)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredClasses.map((cls) => {
              const roster = snapshot.students.filter(
                (s) => s.classId === cls.id && s.status === 'active'
              );
              const homeroom = snapshot.teachers.find((t) => t.id === cls.homeroomTeacherId);
              const utilPct = cls.capacity > 0 ? Math.min(100, Math.round((roster.length / cls.capacity) * 100)) : 0;

              return (
                <div
                  key={cls.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[11px] font-bold">
                          {cls.code} · {cls.track}
                        </span>
                        <h3 className="text-lg font-extrabold mt-1.5">{displayClassName(cls, lang)}</h3>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setClassForm({ ...cls });
                              setClassModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClass(cls)}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {tx('គ្រូបន្ទុកថ្នាក់៖ ', 'Homeroom: ')}
                          <b>{homeroom ? tx(homeroom.nameKh, homeroom.nameEn) : '—'}</b>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {tx('បន្ទប់៖ ', 'Room: ')}
                          <b>{cls.room}</b> · {cls.shift}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cls.schedule}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                        <span>
                          {tx('ថ្លៃសិក្សាប្រចាំខែ៖ ', 'Monthly Tuition: ')}
                          <b className="text-emerald-600">{formatUSD(cls.monthlyTuition)}</b>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>{tx('ចំនួនសិស្សក្នុងថ្នាក់', 'Enrolled / Capacity')}</span>
                      <span>
                        {roster.length} / {cls.capacity}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-4">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${utilPct}%` }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setPrintRequest({
                          type: 'class_master_sheet',
                          classId: cls.id,
                          periodCode: '2026-10',
                        })
                      }
                      className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-xs font-bold transition"
                    >
                      {tx('បោះពុម្ពតារាងពិន្ទុរួមប្រចាំថ្នាក់', 'Print Class Master Sheet')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase text-slate-500">
                  <th className="py-3.5 px-4">{tx('កូដ', 'Code')}</th>
                  <th className="py-3.5 px-4">{tx('មុខវិជ្ជា (ខ្មែរ / អង់គ្លេស)', 'Subject Name')}</th>
                  <th className="py-3.5 px-4">{tx('ផ្នែក', 'Category')}</th>
                  <th className="py-3.5 px-4 text-center">{tx('ពិន្ទុអតិបរមា', 'Max Score')}</th>
                  <th className="py-3.5 px-4 text-center">{tx('មេគុណ (Coeff)', 'Coefficient')}</th>
                  {isAdmin && <th className="py-3.5 px-4 text-right">{tx('សកម្មភាព', 'Actions')}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {snapshot.subjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4">
                      <span
                        className="px-2.5 py-1 rounded-lg text-white text-xs font-bold"
                        style={{ backgroundColor: sub.color }}
                      >
                        {sub.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold">{sub.nameKh}</div>
                      <div className="text-xs text-slate-400">{sub.nameEn}</div>
                    </td>
                    <td className="py-3.5 px-4 capitalize text-xs font-semibold">{sub.category}</td>
                    <td className="py-3.5 px-4 text-center font-bold">{sub.maxScore}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-blue-600">×{sub.coefficient}</td>
                    {isAdmin && (
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSubjectForm({ ...sub });
                              setSubjectModal(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubject(sub)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Class Modal */}
      {classModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold">
                {classForm.id ? tx('កែប្រែថ្នាក់រៀន', 'Edit Class') : tx('បង្កើតថ្នាក់រៀនថ្មី', 'Create Class')}
              </h2>
              <button type="button" onClick={() => setClassModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveClass} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ឈ្មោះថ្នាក់ (ខ្មែរ) *', 'Class Name (Khmer) *')}
                  </label>
                  <input
                    required
                    value={classForm.nameKh || ''}
                    onChange={(e) => setClassForm({ ...classForm, nameKh: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                    placeholder="ថ្នាក់ទី១០ក"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ឈ្មោះថ្នាក់ (English) *', 'Class Name (English) *')}
                  </label>
                  <input
                    required
                    value={classForm.nameEn || ''}
                    onChange={(e) => setClassForm({ ...classForm, nameEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                    placeholder="Grade 10A"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ភូមិសិក្សា', 'Level Category')}
                  </label>
                  <select
                    value={classForm.category || 'primary'}
                    onChange={(e) =>
                      setClassForm({
                        ...classForm,
                        category: e.target.value as ClassRoom['category'],
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  >
                    <option value="kindergarten">Kindergarten</option>
                    <option value="primary">Primary (G1–G6)</option>
                    <option value="lower_secondary">Lower Secondary (G7–G9)</option>
                    <option value="upper_secondary">Upper Secondary (G10–G12)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('គ្រូបន្ទុកថ្នាក់', 'Homeroom Teacher')}
                  </label>
                  <select
                    value={classForm.homeroomTeacherId || ''}
                    onChange={(e) =>
                      setClassForm({ ...classForm, homeroomTeacherId: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  >
                    <option value="">--</option>
                    {snapshot.teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {tx(t.nameKh, t.nameEn)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('បន្ទប់រៀន', 'Room')}
                  </label>
                  <input
                    value={classForm.room || ''}
                    onChange={(e) => setClassForm({ ...classForm, room: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ថ្លៃសិក្សាប្រចាំខែ ($)', 'Monthly Tuition ($)')}
                  </label>
                  <input
                    type="number"
                    value={classForm.monthlyTuition ?? 120}
                    onChange={(e) =>
                      setClassForm({ ...classForm, monthlyTuition: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setClassModal(false)}
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

      {/* Subject Modal */}
      {subjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold">
                {subjectForm.id ? tx('កែប្រែមុខវិជ្ជា', 'Edit Subject') : tx('បន្ថែមមុខវិជ្ជាថ្មី', 'Add Subject')}
              </h2>
              <button type="button" onClick={() => setSubjectModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveSubject} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {tx('ឈ្មោះមុខវិជ្ជា (ខ្មែរ) *', 'Subject Name (Khmer) *')}
                </label>
                <input
                  required
                  value={subjectForm.nameKh || ''}
                  onChange={(e) => setSubjectForm({ ...subjectForm, nameKh: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {tx('ឈ្មោះមុខវិជ្ជា (English) *', 'Subject Name (English) *')}
                </label>
                <input
                  required
                  value={subjectForm.nameEn || ''}
                  onChange={(e) => setSubjectForm({ ...subjectForm, nameEn: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Code</label>
                  <input
                    value={subjectForm.code || ''}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Max</label>
                  <input
                    type="number"
                    value={subjectForm.maxScore ?? 100}
                    onChange={(e) =>
                      setSubjectForm({ ...subjectForm, maxScore: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Coeff</label>
                  <input
                    type="number"
                    step="0.5"
                    value={subjectForm.coefficient ?? 1}
                    onChange={(e) =>
                      setSubjectForm({ ...subjectForm, coefficient: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSubjectModal(false)}
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
