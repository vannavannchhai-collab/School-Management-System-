import React, { useState } from 'react';
import { Megaphone, Pin, Plus, Trash2, Calendar, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dataEngine } from '../services/dataEngine';

export const AnnouncementsModule: React.FC = () => {
  const { snapshot, tx, user, applyServerResult } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    titleKh: '',
    titleEn: '',
    contentKh: '',
    contentEn: '',
    audience: 'all' as 'all' | 'teachers' | 'students' | 'parents',
    priority: 'important' as 'normal' | 'important' | 'urgent',
    eventDate: '2026-11-15',
    pinned: true,
  });

  const canPost = user?.role === 'admin' || user?.role === 'teacher';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-blue-600" />
            {tx('សេចក្តីជូនដំណឹង និងប្រតិទិនព្រឹត្តិការណ៍សាលា', 'School Announcements & Academic Calendar')}
          </h1>
          <p className="text-sm text-slate-500">
            {tx(
              'ផ្សព្វផ្សាយដំណឹងផ្លូវការ បុណ្យជាតិ កិច្ចប្រជុំមាតាបិតា និងកម្មវិធីសិក្សា',
              'Official circulars, public holidays, parent-teacher conferences, and school events'
            )}
          </p>
        </div>

        {canPost && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-bold shadow"
          >
            <Plus className="w-4 h-4" />
            {tx('ផ្សព្វផ្សាយដំណឹងថ្មី', 'New Announcement')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          {snapshot.announcements.map((ann) => (
            <div
              key={ann.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border shadow-xs ${
                ann.pinned
                  ? 'border-blue-300 dark:border-blue-800'
                  : 'border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {ann.pinned && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                      <Pin className="w-3 h-3" /> Pinned
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      ann.priority === 'urgent'
                        ? 'bg-rose-100 text-rose-700'
                        : ann.priority === 'important'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {ann.priority}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase">
                    Audience: {ann.audience}
                  </span>
                </div>

                {canPost && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        applyServerResult(dataEngine.togglePinAnnouncement(ann.id, !ann.pinned))
                      }
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Toggle Pin"
                    >
                      <Pin className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyServerResult(dataEngine.deleteAnnouncement(ann.id))}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="text-lg font-extrabold">{tx(ann.titleKh, ann.titleEn || ann.titleKh)}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {tx(ann.contentKh, ann.contentEn || ann.contentKh)}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400">
                <span>✍️ {ann.authorName}</span>
                <span>
                  📅 {tx('កាលបរិច្ឆេទព្រឹត្តិការណ៍៖ ', 'Event Date: ')}
                  <b className="text-slate-700 dark:text-slate-200">
                    {ann.eventDate || ann.createdAt}
                  </b>
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Cambodian Academic Year Key Dates */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 h-fit">
          <h3 className="text-base font-extrabold flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-purple-600" />
            {tx('ប្រតិទិនឆ្នាំសិក្សា ២០២៦-២០២៧', 'Academic Year Key Dates')}
          </h3>
          <div className="space-y-3 text-xs">
            {[
              ['2026-11-07', 'ជំនួបមាតាបិតា និងគ្រូបន្ទុកថ្នាក់', 'Parent-Teacher Day'],
              ['2026-11-09', 'ទិវាបុណ្យឯករាជ្យជាតិ ៩ វិច្ឆិកា', 'National Independence Day'],
              ['2026-11-23', 'ប្រឡងសាកល្បងបាក់ឌុបលើកទី១', 'Grade 12 Mock BacII #1'],
              ['2026-11-24', 'ព្រះរាជពិធីបុណ្យអុំទូក (ឈប់សម្រាក)', 'Royal Water Festival Holiday'],
              ['2026-12-14', 'ប្រឡងឆមាសទី១ ទូទាំងសាលា', 'Semester 1 Official Exams'],
              ['2027-04-14', 'បុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិខ្មែរ', 'Khmer Traditional New Year'],
              ['2027-07-19', 'ប្រឡងបញ្ចប់ឆ្នាំសិក្សា (ឆមាសទី២)', 'Final Year-End Exams'],
            ].map(([dt, kh, en], idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center gap-3"
              >
                <div className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white font-mono font-bold text-[11px]">
                  {dt.slice(5)}
                </div>
                <div>
                  <div className="font-bold">{tx(kh, en)}</div>
                  <div className="text-[11px] text-slate-400">{dt}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold">
                {tx('បង្កើតសេចក្តីជូនដំណឹងថ្មី', 'Publish School Announcement')}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const ok = await applyServerResult(
                  dataEngine.createAnnouncement(form),
                  tx('ផ្សព្វផ្សាយដំណឹងជោគជ័យ!', 'Announcement published!')
                );
                if (ok) setModalOpen(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {tx('ចំណងជើង (ខ្មែរ) *', 'Title (Khmer) *')}
                </label>
                <input
                  required
                  value={form.titleKh}
                  onChange={(e) => setForm({ ...form, titleKh: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {tx('ខ្លឹមសារសេចក្តីជូនដំណឹង *', 'Content *')}
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.contentKh}
                  onChange={(e) => setForm({ ...form, contentKh: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Audience</label>
                  <select
                    value={form.audience}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        audience: e.target.value as 'all' | 'teachers' | 'students' | 'parents',
                      })
                    }
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="all">All</option>
                    <option value="parents">Parents</option>
                    <option value="students">Students</option>
                    <option value="teachers">Teachers</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        priority: e.target.value as 'normal' | 'important' | 'urgent',
                      })
                    }
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="normal">Normal</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Event Date</label>
                  <input
                    type="date"
                    value={form.eventDate}
                    onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  {tx('បោះបង់', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                >
                  {tx('ផ្សព្វផ្សាយ', 'Publish')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
