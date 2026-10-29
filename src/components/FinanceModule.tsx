import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  Printer,
  Trash2,
  QrCode,
  Sparkles,
  Search,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dataEngine } from '../services/dataEngine';
import { InvoiceItem } from '../types';
import {
  displayClassName,
  displayStudentName,
  formatKHR,
  formatUSD,
  generateVisualQrSvg,
} from '../utils/academic';

export const FinanceModule: React.FC = () => {
  const { snapshot, tx, lang, user, applyServerResult, setPrintRequest } = useApp();

  const [tab, setTab] = useState<'invoices' | 'payments' | 'expenses'>('invoices');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [batchModal, setBatchModal] = useState(false);
  const [batchForm, setBatchForm] = useState({
    classId: snapshot.classes[0]?.id || '',
    periodLabel: new Date().toISOString().slice(0, 7),
    dueDate: new Date().toISOString().slice(0, 10),
    title: 'ថ្លៃសិក្សាប្រចាំខែ (Monthly Tuition)',
  });

  const [singleInvModal, setSingleInvModal] = useState(false);
  const [invForm, setInvForm] = useState({
    studentId: snapshot.students[0]?.id || '',
    title: 'ថ្លៃឯកសណ្ឋាន និងសៀវភៅសិក្សា (Uniform & Books)',
    category: 'books',
    periodLabel: '2026-11',
    subtotal: 65,
    discountAmount: 0,
    dueDate: '2026-11-15',
    notes: '',
  });

  const [payModalInv, setPayModalInv] = useState<InvoiceItem | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState('ABA KHQR');
  const [payRef, setPayRef] = useState('');

  const [expModal, setExpModal] = useState(false);
  const [expForm, setExpForm] = useState({
    title: '',
    category: 'supplies',
    amount: 120,
    expenseDate: '2026-10-29',
    paidTo: '',
    method: 'ABA KHQR',
    notes: '',
  });

  const canManage = user?.role === 'admin' || user?.role === 'accountant';
  const rate = snapshot.settings.exchangeRate || 4100;

  const baseInvoices =
    user?.role === 'student'
      ? snapshot.invoices.filter((i) => i.studentId === user.linkedId)
      : snapshot.invoices;

  const filteredInvoices = baseInvoices.filter((inv) => {
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const st = snapshot.students.find((s) => s.id === inv.studentId);
      const hay = `${inv.invoiceNo} ${inv.title} ${st?.nameKh || ''} ${st?.nameEn || ''} ${st?.studentCode || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const totalBilled = baseInvoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalPaid = baseInvoices.reduce((s, i) => s + i.paidAmount, 0);
  const totalDue = Math.max(0, totalBilled - totalPaid);
  const totalExpenses = snapshot.expenses.reduce((s, e) => s + e.amount, 0);

  const openPaymentDialog = (inv: InvoiceItem) => {
    const remaining = Math.max(0, inv.totalAmount - inv.paidAmount);
    setPayModalInv(inv);
    setPayAmount(remaining);
    setPayMethod('ABA KHQR');
    setPayRef(`KHQR-${Date.now().toString().slice(-6)}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <Wallet className="w-6 h-6 text-amber-600" />
            {tx('គ្រប់គ្រងហិរញ្ញវត្ថុ ថ្លៃសិក្សា និងបង្កាន់ដៃ KHQR', 'Tuition, KHQR Billing & School Accounting')}
          </h1>
          <p className="text-sm text-slate-500">
            {tx(
              `អត្រាប្តូរប្រាក់៖ $1 = ${rate.toLocaleString()} ៛ · គាំទ្រអាហារូបករណ៍ ការបង់រំលស់ និងបង្កាន់ដៃផ្លូវការ`,
              `Exchange rate: $1 = ${rate.toLocaleString()} KHR · Scholarships, partial installments & official receipts`
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {user?.role !== 'student' && (
            <div className="bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex">
              <button
                type="button"
                onClick={() => setTab('invoices')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  tab === 'invoices' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {tx('វិក្កយបត្រសិស្ស', 'Invoices')}
              </button>
              <button
                type="button"
                onClick={() => setTab('payments')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  tab === 'payments' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {tx('ប្រវត្តិបង់ប្រាក់', 'Payments')}
              </button>
              <button
                type="button"
                onClick={() => setTab('expenses')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  tab === 'expenses' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {tx('ចំណាយសាលា', 'Expenses')}
              </button>
            </div>
          )}

          {canManage && tab === 'invoices' && (
            <>
              <button
                type="button"
                onClick={() => {
                  setBatchForm((f) => ({
                    ...f,
                    classId: f.classId || snapshot.classes[0]?.id || '',
                  }));
                  setBatchModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {tx('ចេញវិក្កយបត្រតាមថ្នាក់', 'Batch Class Billing')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setInvForm((f) => ({
                    ...f,
                    studentId: f.studentId || snapshot.students[0]?.id || '',
                  }));
                  setSingleInvModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow"
              >
                <Plus className="w-4 h-4" />
                {tx('វិក្កយបត្រថ្មី', 'New Invoice')}
              </button>
            </>
          )}

          {canManage && tab === 'expenses' && (
            <button
              type="button"
              onClick={() => setExpModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow"
            >
              <Plus className="w-4 h-4" />
              {tx('កត់ត្រាចំណាយ', 'Record Expense')}
            </button>
          )}
        </div>
      </div>

      {/* Financial KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-500">
            {tx('ទឹកប្រាក់វិក្កយបត្រសរុប', 'Total Billed')}
          </div>
          <div className="text-2xl font-extrabold mt-1">{formatUSD(totalBilled)}</div>
          <div className="text-xs text-slate-400 mt-0.5">{formatKHR(totalBilled, rate)}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-500">
            {tx('ទឹកប្រាក់បានទទួលរួច', 'Collected Revenue')}
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{formatUSD(totalPaid)}</div>
          <div className="text-xs text-slate-400 mt-0.5">{formatKHR(totalPaid, rate)}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-500">
            {tx('បំណុលថ្លៃសិក្សានៅជំពាក់', 'Pending / Arrears')}
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{formatUSD(totalDue)}</div>
          <div className="text-xs text-slate-400 mt-0.5">{formatKHR(totalDue, rate)}</div>
        </div>

        {user?.role !== 'student' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800">
            <div className="text-xs font-semibold text-slate-500">
              {tx('ចំណាយប្រតិបត្តិការសាលា', 'Operational Expenses')}
            </div>
            <div className="text-2xl font-extrabold text-rose-600 mt-1">
              {formatUSD(totalExpenses)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              <button
                type="button"
                onClick={() => setPrintRequest({ type: 'finance_statement' })}
                className="text-blue-600 font-bold hover:underline"
              >
                {tx('បោះពុម្ពរបាយការណ៍ហិរញ្ញវត្ថុ →', 'Print Statement →')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* INVOICES TAB */}
      {tab === 'invoices' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={tx('ស្វែងរកលេខវិក្កយបត្រ ឬឈ្មោះសិស្ស...', 'Search invoice no or student...')}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm outline-none"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {(['all', 'paid', 'partial', 'unpaid', 'overdue'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase ${
                    statusFilter === st
                      ? 'bg-slate-900 dark:bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase text-slate-500">
                    <th className="py-3.5 px-4">{tx('លេខវិក្កយបត្រ', 'Invoice No')}</th>
                    <th className="py-3.5 px-4">{tx('សិស្ស / ថ្នាក់', 'Student')}</th>
                    <th className="py-3.5 px-4">{tx('បរិយាយ', 'Description')}</th>
                    <th className="py-3.5 px-4 text-right">{tx('សរុបត្រូវបង់', 'Net Total')}</th>
                    <th className="py-3.5 px-4 text-right">{tx('បានបង់', 'Paid')}</th>
                    <th className="py-3.5 px-4 text-center">{tx('ស្ថានភាព', 'Status')}</th>
                    <th className="py-3.5 px-4 text-right">{tx('សកម្មភាព', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredInvoices.map((inv) => {
                    const st = snapshot.students.find((s) => s.id === inv.studentId);
                    const cls = snapshot.classes.find((c) => c.id === inv.classId);
                    const bal = Math.max(0, inv.totalAmount - inv.paidAmount);
                    return (
                      <tr key={inv.id}>
                        <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                          {inv.invoiceNo}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold">{displayStudentName(st, lang)}</div>
                          <div className="text-xs text-slate-400">
                            {displayClassName(cls, lang)}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-semibold">{inv.title}</div>
                          {inv.discountAmount > 0 && (
                            <span className="text-amber-600 font-bold">
                              🎓 Discount -{formatUSD(inv.discountAmount)}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold">
                          {formatUSD(inv.totalAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                          {formatUSD(inv.paidAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                              inv.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-700'
                                : inv.status === 'partial'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {canManage && bal > 0 && (
                              <button
                                type="button"
                                onClick={() => openPaymentDialog(inv)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                                {tx('ទទួលប្រាក់', 'Collect')}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setPrintRequest({ type: 'invoice_receipt', invoiceId: inv.id })
                              }
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800"
                              title="Print Official Receipt"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            {canManage && (
                              <button
                                type="button"
                                onClick={() => applyServerResult(dataEngine.deleteInvoice(inv.id))}
                                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50"
                              >
                                <Trash2 className="w-4 h-4" />
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
        </div>
      )}

      {/* PAYMENTS HISTORY TAB */}
      {tab === 'payments' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase text-slate-500">
                  <th className="py-3.5 px-4">{tx('លេខបង្កាន់ដៃ', 'Receipt No')}</th>
                  <th className="py-3.5 px-4">{tx('សិស្ស', 'Student')}</th>
                  <th className="py-3.5 px-4">{tx('មធ្យោបាយបង់', 'Method & Ref')}</th>
                  <th className="py-3.5 px-4">{tx('កាលបរិច្ឆេទ', 'Date')}</th>
                  <th className="py-3.5 px-4 text-right">{tx('ទឹកប្រាក់', 'Amount')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {snapshot.payments.map((p) => {
                  const st = snapshot.students.find((s) => s.id === p.studentId);
                  return (
                    <tr key={p.id}>
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-blue-600">
                        {p.receiptNo}
                      </td>
                      <td className="py-3.5 px-4 font-bold">{displayStudentName(st, lang)}</td>
                      <td className="py-3.5 px-4 text-xs">
                        <b>{p.method}</b> · <span className="font-mono text-slate-400">{p.referenceNo}</span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">{p.paidAt}</td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600">
                        {formatUSD(p.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EXPENSES TAB */}
      {tab === 'expenses' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase text-slate-500">
                  <th className="py-3.5 px-4">{tx('លេខចំណាយ', 'Exp No')}</th>
                  <th className="py-3.5 px-4">{tx('បរិយាយចំណាយ', 'Title')}</th>
                  <th className="py-3.5 px-4">{tx('អ្នកទទួល / វិធីបង់', 'Vendor & Method')}</th>
                  <th className="py-3.5 px-4">{tx('កាលបរិច្ឆេទ', 'Date')}</th>
                  <th className="py-3.5 px-4 text-right">{tx('ទឹកប្រាក់', 'Amount')}</th>
                  {canManage && <th className="py-3.5 px-4 text-right"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {snapshot.expenses.map((ex) => (
                  <tr key={ex.id}>
                    <td className="py-3.5 px-4 font-mono text-xs">{ex.expenseNo}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold">{ex.title}</div>
                      <div className="text-xs text-slate-400">{ex.notes}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {ex.paidTo} · <b>{ex.method}</b>
                    </td>
                    <td className="py-3.5 px-4 text-xs">{ex.expenseDate}</td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-rose-600">
                      {formatUSD(ex.amount)}
                    </td>
                    {canManage && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => applyServerResult(dataEngine.deleteExpense(ex.id))}
                          className="text-rose-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KHQR & Cash Payment Modal */}
      {payModalInv && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold">
                {tx('ទទួលប្រាក់បង់ថ្លៃសិក្សា (Payment & KHQR)', 'Collect Tuition Payment')}
              </h2>
              <button type="button" onClick={() => setPayModalInv(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {payMethod === 'ABA KHQR' && (
              <div className="mb-4 rounded-2xl overflow-hidden border border-rose-200 bg-white text-slate-900 shadow-xs">
                <div className="bg-rose-600 text-white text-center py-2 text-xs font-extrabold tracking-widest">
                  KHQR · BAKONG / ABA PAY
                </div>
                <div className="p-4 flex items-center gap-4">
                  <img
                    src={generateVisualQrSvg(`KHQR|${payModalInv.invoiceNo}|${payAmount}`, 96)}
                    alt="KHQR"
                    className="w-24 h-24 border border-slate-200 rounded-xl p-1"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-500">
                      {snapshot.settings.schoolNameEn}
                    </div>
                    <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                      {formatUSD(payAmount)}
                    </div>
                    <div className="text-xs font-bold text-rose-600">
                      ≈ {formatKHR(payAmount, rate)}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-1">
                      Ref: {payModalInv.invoiceNo}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const ok = await applyServerResult(
                  dataEngine.recordPayment({
                    invoiceId: payModalInv.id,
                    amount: payAmount,
                    method: payMethod,
                    referenceNo: payRef,
                  }),
                  tx('ទទួលប្រាក់ និងចេញបង្កាន់ដៃជោគជ័យ!', 'Payment recorded & receipt issued!')
                );
                if (ok) setPayModalInv(null);
              }}
              className="space-y-3.5"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ទឹកប្រាក់ទទួល ($)', 'Amount ($)')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0.5}
                    max={payModalInv.totalAmount - payModalInv.paidAmount}
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-extrabold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('មធ្យោបាយបង់ប្រាក់', 'Method')}
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold"
                  >
                    <option value="ABA KHQR">ABA KHQR</option>
                    <option value="ACLEDA">ACLEDA ToanChet</option>
                    <option value="Cash">សាច់ប្រាក់សុទ្ធ (Cash)</option>
                    <option value="Wing">Wing Bank</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {tx('លេខយោងប្រតិបត្តិការ (Reference)', 'Transaction Reference')}
                </label>
                <input
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalInv(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  {tx('បោះបង់', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow"
                >
                  {tx('បញ្ជាក់ការបង់ប្រាក់', 'Confirm Payment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Class Billing Modal */}
      {batchModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h2 className="text-lg font-extrabold mb-1">
              {tx('បង្កើតវិក្កយបត្រថ្លៃសិក្សាតាមថ្នាក់ស្វ័យប្រវត្តិ', 'Batch Generate Class Invoices')}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              {tx(
                'ប្រព័ន្ធនឹងគណនាថ្លៃសិក្សាប្រចាំថ្នាក់ និងកាត់បញ្ចុះតម្លៃអាហារូបករណ៍សិស្សម្នាក់ៗដោយស្វ័យប្រវត្តិ!',
                'Automatically applies class monthly tuition and each student’s scholarship percentage!'
              )}
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const ok = await applyServerResult(
                  dataEngine.generateClassInvoices(batchForm),
                  tx('បង្កើតវិក្កយបត្រជូនសិស្សក្នុងថ្នាក់រួចរាល់!', 'Class tuition invoices generated!')
                );
                if (ok) setBatchModal(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Class</label>
                <select
                  value={batchForm.classId}
                  onChange={(e) => setBatchForm({ ...batchForm, classId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                >
                  {snapshot.classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {displayClassName(c, lang)} ({formatUSD(c.monthlyTuition)}/mo)
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Billing Month</label>
                  <input
                    type="month"
                    value={batchForm.periodLabel}
                    onChange={(e) => setBatchForm({ ...batchForm, periodLabel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={batchForm.dueDate}
                    onChange={(e) => setBatchForm({ ...batchForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Title</label>
                <input
                  value={batchForm.title}
                  onChange={(e) => setBatchForm({ ...batchForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBatchModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  {tx('បោះបង់', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                >
                  {tx('បង្កើតវិក្កយបត្រ', 'Generate')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Invoice Modal */}
      {singleInvModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h2 className="text-lg font-extrabold mb-4">
              {tx('បង្កើតវិក្កយបត្រសិស្សថ្មី', 'Create Student Invoice')}
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const st = snapshot.students.find((s) => s.id === invForm.studentId);
                const ok = await applyServerResult(
                  dataEngine.createInvoice({ ...invForm, classId: st?.classId || '' }),
                  tx('បង្កើតវិក្កយបត្រថ្មីរួចរាល់!', 'Invoice created!')
                );
                if (ok) setSingleInvModal(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Student</label>
                <select
                  value={invForm.studentId}
                  onChange={(e) => setInvForm({ ...invForm, studentId: e.target.value })}
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
                <label className="block text-xs font-bold text-slate-500 mb-1">Description *</label>
                <input
                  required
                  value={invForm.title}
                  onChange={(e) => setInvForm({ ...invForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Subtotal ($)</label>
                  <input
                    type="number"
                    value={invForm.subtotal}
                    onChange={(e) =>
                      setInvForm({ ...invForm, subtotal: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Discount ($)</label>
                  <input
                    type="number"
                    value={invForm.discountAmount}
                    onChange={(e) =>
                      setInvForm({ ...invForm, discountAmount: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSingleInvModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  {tx('បោះបង់', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                >
                  {tx('បង្កើត', 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {expModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h2 className="text-lg font-extrabold mb-4">
              {tx('កត់ត្រាចំណាយប្រតិបត្តិការសាលា', 'Record School Expense')}
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const ok = await applyServerResult(
                  dataEngine.createExpense(expForm),
                  tx('បានកត់ត្រាចំណាយសាលា!', 'Expense recorded!')
                );
                if (ok) setExpModal(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Title *</label>
                <input
                  required
                  value={expForm.title}
                  onChange={(e) => setExpForm({ ...expForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    required
                    value={expForm.amount}
                    onChange={(e) => setExpForm({ ...expForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Date</label>
                  <input
                    type="date"
                    value={expForm.expenseDate}
                    onChange={(e) => setExpForm({ ...expForm, expenseDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Paid To</label>
                <input
                  value={expForm.paidTo}
                  onChange={(e) => setExpForm({ ...expForm, paidTo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExpModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  {tx('បោះបង់', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
                >
                  {tx('រក្សាទុកចំណាយ', 'Save Expense')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
