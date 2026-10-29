import React, { useState } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  Printer,
  Wallet,
  Phone,
  Mail,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dataEngine } from '../services/dataEngine';
import { PayrollItem, Teacher } from '../types';
import {
  avatarColorFor,
  formatKHR,
  formatUSD,
  initialsFor,
} from '../utils/academic';

export const TeachersHRModule: React.FC = () => {
  const { snapshot, tx, user, applyServerResult, setPrintRequest } = useApp();
  const [tab, setTab] = useState<'directory' | 'leaves' | 'payroll'>(
    user?.role === 'accountant' ? 'payroll' : 'directory'
  );
  const [monthKey, setMonthKey] = useState('2026-10');

  const [teacherModal, setTeacherModal] = useState(false);
  const [teacherForm, setTeacherForm] = useState<Partial<Teacher>>({});

  const [leaveModal, setLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    teacherId: snapshot.teachers[1]?.id || '',
    leaveType: 'ច្បាប់ឈឺ (Sick Leave)',
    startDate: '2026-11-03',
    endDate: '2026-11-04',
    days: 2,
    reason: '',
  });

  const [payrollEdit, setPayrollEdit] = useState<PayrollItem | null>(null);

  const isAdmin = user?.role === 'admin';
  const canPayroll = user?.role === 'admin' || user?.role === 'accountant';

  const openAddTeacher = () => {
    setTeacherForm({
      nameKh: '',
      nameEn: '',
      gender: 'M',
      dob: '1992-05-10',
      phone: '',
      email: '',
      address: 'ក្រុងសៀមរាប',
      roleTitleKh: 'គ្រូបង្រៀន',
      roleTitleEn: 'Subject Teacher',
      department: 'Natural Sciences',
      qualification: 'បរិញ្ញាបត្រអប់រំ',
      specialization: 'គណិតវិទ្យា',
      hireDate: '2026-09-01',
      baseSalary: 580,
      status: 'active',
    });
    setTeacherModal(true);
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await applyServerResult(
      dataEngine.saveTeacher(teacherForm),
      tx('រក្សាទុកព័ត៌មានបុគ្គលិកជោគជ័យ!', 'Staff profile saved!')
    );
    if (ok) setTeacherModal(false);
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await applyServerResult(
      dataEngine.createLeave(leaveForm),
      tx('បានដាក់សំណើសុំច្បាប់ឈប់សម្រាក!', 'Leave request submitted!')
    );
    if (ok) setLeaveModal(false);
  };

  const monthPayrolls = snapshot.payrolls.filter((p) => p.monthKey === monthKey);
  const totalNetPayroll = monthPayrolls.reduce((s, p) => s + p.netSalary, 0);
  const paidPayrollAmt = monthPayrolls
    .filter((p) => p.status === 'paid')
    .reduce((s, p) => s + p.netSalary, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">
            {tx('គ្រប់គ្រងគ្រូបង្រៀន ធនធានមនុស្ស និងប្រាក់បៀវត្សរ៍', 'Faculty HR, Leaves & Payroll')}
          </h1>
          <p className="text-sm text-slate-500">
            {tx(
              `បុគ្គលិកសរុប ${snapshot.teachers.length} នាក់ · ច្បាប់ឈប់សម្រាក និងបញ្ជីបើកប្រាក់ខែប្រចាំខែ`,
              `${snapshot.teachers.length} active faculty & staff · Leave approvals & monthly payroll slips`
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex">
            <button
              type="button"
              onClick={() => setTab('directory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                tab === 'directory' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {tx('បញ្ជីបុគ្គលិក', 'Staff Directory')}
            </button>
            <button
              type="button"
              onClick={() => setTab('leaves')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                tab === 'leaves' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {tx(
                `ច្បាប់ឈប់សម្រាក (${snapshot.teacherLeaves.filter((l) => l.status === 'pending').length})`,
                `Leaves (${snapshot.teacherLeaves.filter((l) => l.status === 'pending').length})`
              )}
            </button>
            {canPayroll && (
              <button
                type="button"
                onClick={() => setTab('payroll')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  tab === 'payroll' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {tx('ប្រាក់បៀវត្សរ៍', 'Payroll')}
              </button>
            )}
          </div>

          {tab === 'directory' && isAdmin && (
            <button
              type="button"
              onClick={openAddTeacher}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              {tx('បន្ថែមគ្រូ/បុគ្គលិក', 'Add Staff')}
            </button>
          )}

          {tab === 'leaves' && (
            <button
              type="button"
              onClick={() => setLeaveModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              {tx('ដាក់សំណើសុំច្បាប់', 'Request Leave')}
            </button>
          )}
        </div>
      </div>

      {/* DIRECTORY TAB */}
      {tab === 'directory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {snapshot.teachers.map((t) => (
            <div
              key={t.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0"
                      style={{ backgroundColor: avatarColorFor(t.id) }}
                    >
                      {initialsFor(t.nameEn || t.nameKh)}
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-white">
                        {tx(t.nameKh, t.nameEn)}
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                        {tx(t.roleTitleKh, t.roleTitleEn)}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">{t.teacherCode}</div>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setTeacherForm({ ...t });
                          setTeacherModal(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(tx(`លុបបុគ្គលិក ${t.nameKh}?`, `Remove ${t.nameEn}?`))) {
                            applyServerResult(dataEngine.deleteTeacher(t.id));
                          }
                        }}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400">{tx('ដេប៉ាតឺម៉ង់៖ ', 'Dept: ')}</span>
                    <b>{t.department}</b>
                  </div>
                  <div>
                    <span className="text-slate-400">{tx('កម្រិតវប្បធម៌៖ ', 'Degree: ')}</span>
                    <span>{t.qualification}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{t.phone}</span>
                  </div>
                  {t.email && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{t.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {canPayroll && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">{tx('ប្រាក់ខែគោល៖', 'Base Salary:')}</span>
                  <span className="font-extrabold text-emerald-600">{formatUSD(t.baseSalary)}/mo</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* LEAVES TAB */}
      {tab === 'leaves' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase text-slate-500">
                  <th className="py-3.5 px-4">{tx('គ្រូ / បុគ្គលិក', 'Staff Member')}</th>
                  <th className="py-3.5 px-4">{tx('ប្រភេទច្បាប់', 'Leave Type')}</th>
                  <th className="py-3.5 px-4">{tx('កាលបរិច្ឆេទ', 'Dates & Days')}</th>
                  <th className="py-3.5 px-4">{tx('មូលហេតុ', 'Reason')}</th>
                  <th className="py-3.5 px-4 text-center">{tx('ស្ថានភាព', 'Status')}</th>
                  {isAdmin && <th className="py-3.5 px-4 text-right">{tx('ការសម្រេច', 'Decision')}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {snapshot.teacherLeaves.map((lv) => {
                  const tch = snapshot.teachers.find((t) => t.id === lv.teacherId);
                  return (
                    <tr key={lv.id}>
                      <td className="py-3.5 px-4 font-bold">
                        {tch ? tx(tch.nameKh, tch.nameEn) : lv.teacherId}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold">{lv.leaveType}</td>
                      <td className="py-3.5 px-4 text-xs">
                        <div>
                          {lv.startDate} → {lv.endDate}
                        </div>
                        <div className="text-slate-400">{lv.days} day(s)</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                        {lv.reason}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                            lv.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : lv.status === 'rejected'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {lv.status}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          {lv.status === 'pending' ? (
                            <div className="inline-flex gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  applyServerResult(
                                    dataEngine.updateLeaveStatus(lv.id, 'approved'),
                                    tx('បានអនុម័តច្បាប់ឈប់សម្រាក', 'Leave approved')
                                  )
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {tx('អនុម័ត', 'Approve')}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  applyServerResult(
                                    dataEngine.updateLeaveStatus(lv.id, 'rejected'),
                                    tx('បានបដិសេធសំណើ', 'Leave rejected')
                                  )
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-100 text-rose-700 text-xs font-bold"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                {tx('បដិសេធ', 'Reject')}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">{lv.approvedBy}</span>
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

      {/* PAYROLL TAB */}
      {tab === 'payroll' && canPayroll && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs font-bold text-slate-500">
                {tx('ខែបើកប្រាក់បៀវត្សរ៍៖', 'Payroll Month:')}
              </label>
              <input
                type="month"
                value={monthKey}
                onChange={(e) => setMonthKey(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold"
              />
              <button
                type="button"
                onClick={() =>
                  applyServerResult(
                    dataEngine.generatePayrolls(monthKey),
                    tx('បង្កើតតារាងប្រាក់ខែរួចរាល់!', 'Monthly payroll sheet generated!')
                  )
                }
                className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
              >
                {tx('បង្កើតតារាងប្រាក់ខែស្វ័យប្រវត្តិ', 'Generate Sheet')}
              </button>
              {monthPayrolls.some((p) => p.status !== 'paid') && (
                <button
                  type="button"
                  onClick={() =>
                    applyServerResult(
                      dataEngine.payAllPayrolls(monthKey, 'ABA Payroll'),
                      tx('បានបើកប្រាក់ខែជូនបុគ្គលិកទាំងអស់!', 'All pending salaries marked paid!')
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  {tx('បើកប្រាក់ខែទាំងអស់ (ABA Payroll)', 'Pay All Pending')}
                </button>
              )}
            </div>

            <div className="flex items-center gap-5 text-xs">
              <div>
                <span className="text-slate-400">{tx('សរុបប្រាក់ខែសុទ្ធ៖ ', 'Total Net: ')}</span>
                <b className="text-sm">{formatUSD(totalNetPayroll)}</b>{' '}
                <span className="text-slate-400">
                  ({formatKHR(totalNetPayroll, snapshot.settings.exchangeRate)})
                </span>
              </div>
              <div>
                <span className="text-slate-400">{tx('បានបើករួច៖ ', 'Disbursed: ')}</span>
                <b className="text-sm text-emerald-600">{formatUSD(paidPayrollAmt)}</b>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase text-slate-500">
                    <th className="py-3.5 px-4">{tx('លេខសន្លឹក', 'Slip No')}</th>
                    <th className="py-3.5 px-4">{tx('បុគ្គលិក', 'Employee')}</th>
                    <th className="py-3.5 px-4 text-right">{tx('ប្រាក់ខែគោល', 'Base')}</th>
                    <th className="py-3.5 px-4 text-right">{tx('ឧបត្ថម្ភ/រង្វាន់', '+Allow/Bonus')}</th>
                    <th className="py-3.5 px-4 text-right">{tx('ប្រាក់កាត់', '-Deduct')}</th>
                    <th className="py-3.5 px-4 text-right">{tx('ប្រាក់ខែសុទ្ធ', 'Net Pay')}</th>
                    <th className="py-3.5 px-4 text-center">{tx('ស្ថានភាព', 'Status')}</th>
                    <th className="py-3.5 px-4 text-right">{tx('សកម្មភាព', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {monthPayrolls.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        {tx(
                          'មិនទាន់មានតារាងប្រាក់ខែសម្រាប់ខែនេះទេ — សូមចុច "បង្កើតតារាងប្រាក់ខែស្វ័យប្រវត្តិ"',
                          'No payroll generated for this month yet — click "Generate Sheet" above.'
                        )}
                      </td>
                    </tr>
                  ) : (
                    monthPayrolls.map((pr) => {
                      const tch = snapshot.teachers.find((t) => t.id === pr.teacherId);
                      return (
                        <tr key={pr.id}>
                          <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                            {pr.payrollNo}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold">
                              {tch ? tx(tch.nameKh, tch.nameEn) : pr.teacherId}
                            </div>
                            <div className="text-xs text-slate-400">
                              {tch ? tx(tch.roleTitleKh, tch.roleTitleEn) : ''}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">{formatUSD(pr.baseSalary)}</td>
                          <td className="py-3.5 px-4 text-right text-emerald-600">
                            +{formatUSD(pr.allowance + pr.bonus)}
                          </td>
                          <td className="py-3.5 px-4 text-right text-rose-500">
                            -{formatUSD(pr.deduction)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-extrabold text-blue-600">
                            {formatUSD(pr.netSalary)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                                pr.status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {pr.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex gap-1.5">
                              {pr.status !== 'paid' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    applyServerResult(
                                      dataEngine.updatePayroll(pr.id, {
                                        ...pr,
                                        status: 'paid',
                                        paymentMethod: 'ABA Payroll',
                                      }),
                                      tx('បានបើកប្រាក់ខែរួចរាល់!', 'Salary paid!')
                                    )
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                                >
                                  {tx('បើកប្រាក់', 'Pay')}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setPayrollEdit({ ...pr })}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setPrintRequest({ type: 'payslip', payrollId: pr.id })
                                }
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50"
                                title="Print Payslip"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Modal */}
      {teacherModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold">
                {teacherForm.id ? tx('កែប្រែព័ត៌មានបុគ្គលិក', 'Edit Staff') : tx('បន្ថែមគ្រូ/បុគ្គលិកថ្មី', 'New Staff Member')}
              </h2>
              <button type="button" onClick={() => setTeacherModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveTeacher} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ឈ្មោះ (ខ្មែរ) *', 'Name (Khmer) *')}
                  </label>
                  <input
                    required
                    value={teacherForm.nameKh || ''}
                    onChange={(e) => setTeacherForm({ ...teacherForm, nameKh: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ឈ្មោះ (English) *', 'Name (English) *')}
                  </label>
                  <input
                    required
                    value={teacherForm.nameEn || ''}
                    onChange={(e) => setTeacherForm({ ...teacherForm, nameEn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('តួនាទី (ខ្មែរ)', 'Role Title (Khmer)')}
                  </label>
                  <input
                    value={teacherForm.roleTitleKh || ''}
                    onChange={(e) => setTeacherForm({ ...teacherForm, roleTitleKh: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ប្រាក់ខែគោល ($)', 'Base Salary ($)')}
                  </label>
                  <input
                    type="number"
                    value={teacherForm.baseSalary ?? 550}
                    onChange={(e) =>
                      setTeacherForm({ ...teacherForm, baseSalary: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ទូរស័ព្ទ', 'Phone')}
                  </label>
                  <input
                    value={teacherForm.phone || ''}
                    onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('កម្រិតសញ្ញាបត្រ', 'Qualification')}
                  </label>
                  <input
                    value={teacherForm.qualification || ''}
                    onChange={(e) =>
                      setTeacherForm({ ...teacherForm, qualification: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setTeacherModal(false)}
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

      {/* Leave Modal */}
      {leaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h2 className="text-lg font-extrabold mb-4">
              {tx('ដាក់ពាក្យសុំច្បាប់ឈប់សម្រាក', 'Submit Leave Request')}
            </h2>
            <form onSubmit={handleSubmitLeave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {tx('ឈ្មោះគ្រូ / បុគ្គលិក', 'Staff Member')}
                </label>
                <select
                  value={leaveForm.teacherId}
                  onChange={(e) => setLeaveForm({ ...leaveForm, teacherId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                >
                  {snapshot.teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {tx(t.nameKh, t.nameEn)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {tx('ប្រភេទច្បាប់', 'Leave Type')}
                </label>
                <select
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                >
                  <option value="ច្បាប់ឈឺ (Sick Leave)">ច្បាប់ឈឺ (Sick Leave)</option>
                  <option value="ធុរៈផ្ទាល់ខ្លួន (Personal Leave)">ធុរៈផ្ទាល់ខ្លួន (Personal Leave)</option>
                  <option value="វគ្គបំប៉នវិជ្ជាជីវៈ (Training)">វគ្គបំប៉នវិជ្ជាជីវៈ (Training)</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Start</label>
                  <input
                    type="date"
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">End</label>
                  <input
                    type="date"
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Days</label>
                  <input
                    type="number"
                    min={1}
                    value={leaveForm.days}
                    onChange={(e) => setLeaveForm({ ...leaveForm, days: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {tx('មូលហេតុលម្អិត', 'Reason')}
                </label>
                <textarea
                  required
                  rows={2}
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLeaveModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  {tx('បោះបង់', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                >
                  {tx('ដាក់ស្នើសុំច្បាប់', 'Submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payroll Adjustment Modal */}
      {payrollEdit && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h2 className="text-lg font-extrabold mb-4">
              {tx('កែសម្រួលប្រាក់បៀវត្សរ៍ប្រចាំខែ', 'Adjust Monthly Salary Slip')}
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const ok = await applyServerResult(
                  dataEngine.updatePayroll(payrollEdit.id, payrollEdit),
                  tx('រក្សាទុកប្រាក់ខែរួចរាល់!', 'Payroll updated!')
                );
                if (ok) setPayrollEdit(null);
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ប្រាក់ខែគោល ($)', 'Base Salary ($)')}
                  </label>
                  <input
                    type="number"
                    value={payrollEdit.baseSalary}
                    onChange={(e) =>
                      setPayrollEdit({ ...payrollEdit, baseSalary: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ប្រាក់ឧបត្ថម្ភ ($)', 'Allowance ($)')}
                  </label>
                  <input
                    type="number"
                    value={payrollEdit.allowance}
                    onChange={(e) =>
                      setPayrollEdit({ ...payrollEdit, allowance: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ប្រាក់រង្វាន់ ($)', 'Bonus ($)')}
                  </label>
                  <input
                    type="number"
                    value={payrollEdit.bonus}
                    onChange={(e) =>
                      setPayrollEdit({ ...payrollEdit, bonus: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ប្រាក់កាត់ ($)', 'Deduction ($)')}
                  </label>
                  <input
                    type="number"
                    value={payrollEdit.deduction}
                    onChange={(e) =>
                      setPayrollEdit({ ...payrollEdit, deduction: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setPayrollEdit(null)}
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
