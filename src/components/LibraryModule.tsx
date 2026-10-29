import React, { useState } from 'react';
import { Library, Plus, RotateCcw, Search, Trash2, BookOpen, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dataEngine } from '../services/dataEngine';
import { displayStudentName } from '../utils/academic';

export const LibraryModule: React.FC = () => {
  const { snapshot, tx, lang, user, applyServerResult } = useApp();
  const [tab, setTab] = useState<'catalog' | 'loans'>('catalog');
  const [search, setSearch] = useState('');

  const [bookModal, setBookModal] = useState(false);
  const [bookForm, setBookForm] = useState({
    bookCode: 'LIB-NEW-01',
    isbn: '',
    titleKh: '',
    titleEn: '',
    author: '',
    category: 'Science',
    shelf: 'A-02',
    totalCopies: 10,
    publishYear: 2026,
  });

  const [loanModal, setLoanModal] = useState(false);
  const [loanForm, setLoanForm] = useState({
    bookId: snapshot.libraryBooks[0]?.id || '',
    studentId: snapshot.students[0]?.id || '',
    dueDate: '2026-11-12',
  });

  const canManage = user?.role === 'admin' || user?.role === 'teacher';

  const filteredBooks = snapshot.libraryBooks.filter((b) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return `${b.titleKh} ${b.titleEn} ${b.author} ${b.bookCode} ${b.category}`
      .toLowerCase()
      .includes(q);
  });

  const visibleLoans =
    user?.role === 'student'
      ? snapshot.libraryLoans.filter((l) => l.borrowerId === user.linkedId)
      : snapshot.libraryLoans;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <Library className="w-6 h-6 text-cyan-600" />
            {tx('ប្រព័ន្ធគ្រប់គ្រងបណ្ណាល័យ និងការខ្ចីសៀវភៅ', 'Digital Library & Book Circulation')}
          </h1>
          <p className="text-sm text-slate-500">
            {tx(
              `សៀវភៅសរុប ${snapshot.libraryBooks.reduce((s, b) => s + b.totalCopies, 0)} ក្បាល · គ្រប់គ្រងការខ្ចី និងសងសៀវភៅ`,
              `${snapshot.libraryBooks.length} catalog titles · Track available copies, borrowing & overdue returns`
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex">
            <button
              type="button"
              onClick={() => setTab('catalog')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold ${
                tab === 'catalog' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {tx('បញ្ជីសៀវភៅ', 'Book Catalog')}
            </button>
            <button
              type="button"
              onClick={() => setTab('loans')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold ${
                tab === 'loans' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {tx(`ការខ្ចី-សង (${visibleLoans.length})`, `Loans (${visibleLoans.length})`)}
            </button>
          </div>

          {canManage && (
            <>
              <button
                type="button"
                onClick={() => setLoanModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                <BookOpen className="w-4 h-4" />
                {tx('ឱ្យខ្ចីសៀវភៅ', 'Issue Book')}
              </button>
              <button
                type="button"
                onClick={() => setBookModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
              >
                <Plus className="w-4 h-4" />
                {tx('សៀវភៅថ្មី', 'Add Book')}
              </button>
            </>
          )}
        </div>
      </div>

      {tab === 'catalog' ? (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tx('ស្វែងរកចំណងជើងសៀវភៅ អ្នកនិពន្ធ ឬលេខកូដ...', 'Search book title, author, code...')}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {filteredBooks.map((bk) => (
              <div
                key={bk.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 text-[11px] font-bold">
                      {bk.category} · Shelf {bk.shelf}
                    </span>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => applyServerResult(dataEngine.deleteBook(bk.id))}
                        className="text-rose-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <h3 className="font-extrabold text-sm leading-snug">{bk.titleKh}</h3>
                  <div className="text-xs text-slate-400 mt-0.5">{bk.titleEn}</div>
                  <div className="text-xs text-slate-500 mt-2">✍️ {bk.author}</div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400">{bk.bookCode}</span>
                  <span
                    className={`font-extrabold ${
                      bk.availableCopies > 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {bk.availableCopies}/{bk.totalCopies} {tx('ទំនេរ', 'Avail')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase text-slate-500">
                  <th className="py-3.5 px-4">{tx('សៀវភៅ', 'Book Title')}</th>
                  <th className="py-3.5 px-4">{tx('អ្នកខ្ចី', 'Borrower')}</th>
                  <th className="py-3.5 px-4">{tx('ថ្ងៃខ្ចី → ថ្ងៃកំណត់សង', 'Issue → Due Date')}</th>
                  <th className="py-3.5 px-4 text-center">{tx('ស្ថានភាព', 'Status')}</th>
                  {canManage && <th className="py-3.5 px-4 text-right">{tx('សកម្មភាព', 'Action')}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visibleLoans.map((ln) => {
                  const bk = snapshot.libraryBooks.find((b) => b.id === ln.bookId);
                  return (
                    <tr key={ln.id}>
                      <td className="py-3.5 px-4 font-bold">
                        {bk ? tx(bk.titleKh, bk.titleEn || bk.titleKh) : ln.bookId}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold">{ln.borrowerName}</td>
                      <td className="py-3.5 px-4 text-xs">
                        {ln.issueDate} → <b>{ln.dueDate}</b>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                            ln.status === 'returned'
                              ? 'bg-emerald-100 text-emerald-700'
                              : ln.status === 'overdue'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {ln.status}
                        </span>
                      </td>
                      {canManage && (
                        <td className="py-3.5 px-4 text-right">
                          {ln.status !== 'returned' && (
                            <button
                              type="button"
                              onClick={() =>
                                applyServerResult(
                                  dataEngine.returnLoan(ln.id),
                                  tx('បានទទួលសៀវភៅសងវិញជោគជ័យ!', 'Book returned to shelf!')
                                )
                              }
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              {tx('សងសៀវភៅ', 'Return')}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Book Modal */}
      {bookModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold">{tx('បន្ថែមសៀវភៅចូលបណ្ណាល័យ', 'Add Book to Catalog')}</h2>
              <button type="button" onClick={() => setBookModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const ok = await applyServerResult(
                  dataEngine.createBook(bookForm),
                  tx('បានបន្ថែមសៀវភៅថ្មី!', 'Book added!')
                );
                if (ok) setBookModal(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {tx('ចំណងជើង (ខ្មែរ) *', 'Title (Khmer) *')}
                </label>
                <input
                  required
                  value={bookForm.titleKh}
                  onChange={(e) => setBookForm({ ...bookForm, titleKh: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Author</label>
                <input
                  value={bookForm.author}
                  onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Shelf</label>
                  <input
                    value={bookForm.shelf}
                    onChange={(e) => setBookForm({ ...bookForm, shelf: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Total Copies</label>
                  <input
                    type="number"
                    min={1}
                    value={bookForm.totalCopies}
                    onChange={(e) =>
                      setBookForm({ ...bookForm, totalCopies: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBookModal(false)}
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

      {/* Issue Loan Modal */}
      {loanModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h2 className="text-lg font-extrabold mb-4">
              {tx('កត់ត្រាការឱ្យខ្ចីសៀវភៅ', 'Issue Library Book')}
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const st = snapshot.students.find((s) => s.id === loanForm.studentId);
                const ok = await applyServerResult(
                  dataEngine.createLoan({
                    bookId: loanForm.bookId,
                    borrowerType: 'student',
                    borrowerId: loanForm.studentId,
                    borrowerName: st ? `${st.nameKh} (${st.studentCode})` : loanForm.studentId,
                    issueDate: new Date().toISOString().slice(0, 10),
                    dueDate: loanForm.dueDate,
                  }),
                  tx('ឱ្យខ្ចីសៀវភៅជោគជ័យ!', 'Book issued!')
                );
                if (ok) setLoanModal(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Book</label>
                <select
                  value={loanForm.bookId}
                  onChange={(e) => setLoanForm({ ...loanForm, bookId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                >
                  {snapshot.libraryBooks
                    .filter((b) => b.availableCopies > 0)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.titleKh} ({b.availableCopies} avail)
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Student</label>
                <select
                  value={loanForm.studentId}
                  onChange={(e) => setLoanForm({ ...loanForm, studentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                >
                  {snapshot.students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {displayStudentName(s, lang)} ({s.studentCode})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Due Date</label>
                <input
                  type="date"
                  value={loanForm.dueDate}
                  onChange={(e) => setLoanForm({ ...loanForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLoanModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  {tx('បោះបង់', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                >
                  {tx('ឱ្យខ្ចីឥឡូវនេះ', 'Confirm Loan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
