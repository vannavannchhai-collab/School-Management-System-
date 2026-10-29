import React, { useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Search,
  Edit3,
  Trash2,
  KeyRound,
  Lock,
  Unlock,
  Users,
  GraduationCap,
  Wallet,
  Eye,
  EyeOff,
  Sparkles,
  X,
  CheckCircle2,
  Ban,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dataEngine } from '../services/dataEngine';
import { UserAccount, UserRole } from '../types';
import { displayClassName, initialsFor } from '../utils/academic';

const AVATAR_PALETTE = [
  '#2563eb',
  '#059669',
  '#7c3aed',
  '#d97706',
  '#db2777',
  '#0891b2',
  '#dc2626',
  '#4f46e5',
];

export const UsersModule: React.FC = () => {
  const { snapshot, user: currentUser, tx, lang, applyServerResult, openStudentProfile } = useApp();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [showPw, setShowPw] = useState(false);

  const [form, setForm] = useState({
    role: 'teacher' as UserRole,
    username: '',
    password: '',
    nameKh: '',
    nameEn: '',
    titleKh: '',
    titleEn: '',
    email: '',
    phone: '',
    linkedId: '',
    classId: '',
    avatarColor: '#2563eb',
    status: 'active' as 'active' | 'suspended',
    autoCreateProfile: true,
  });

  const openCreateModal = (presetRole: UserRole = 'teacher') => {
    setEditingUser(null);
    setShowPw(false);
    setForm({
      role: presetRole,
      username: '',
      password: '',
      nameKh: '',
      nameEn: '',
      titleKh: '',
      titleEn: '',
      email: '',
      phone: '',
      linkedId: '',
      classId: snapshot.classes[0]?.id || '',
      avatarColor:
        presetRole === 'admin'
          ? '#2563eb'
          : presetRole === 'teacher'
          ? '#059669'
          : presetRole === 'accountant'
          ? '#d97706'
          : '#7c3aed',
      status: 'active',
      autoCreateProfile: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (u: UserAccount) => {
    setEditingUser(u);
    setShowPw(false);
    setForm({
      role: u.role,
      username: u.username,
      password: '',
      nameKh: u.nameKh,
      nameEn: u.nameEn,
      titleKh: u.titleKh || '',
      titleEn: u.titleEn || '',
      email: u.email || '',
      phone: u.phone || '',
      linkedId: u.linkedId || '',
      classId: '',
      avatarColor: u.avatarColor || '#2563eb',
      status: u.status === 'suspended' ? 'suspended' : 'active',
      autoCreateProfile: false,
    });
    setModalOpen(true);
  };

  const handleLinkExistingPerson = (personId: string) => {
    if (!personId) {
      setForm((f) => ({ ...f, linkedId: '', autoCreateProfile: true }));
      return;
    }
    if (form.role === 'student') {
      const st = snapshot.students.find((s) => s.id === personId);
      if (st) {
        const suggestedUser = st.studentCode.toLowerCase().replace(/[^a-z0-9._-]/g, '');
        setForm((f) => ({
          ...f,
          linkedId: st.id,
          nameKh: st.nameKh || f.nameKh,
          nameEn: st.nameEn || f.nameEn,
          phone: st.phone || st.guardianPhone || f.phone,
          email: st.email || f.email,
          username: f.username || suggestedUser,
          autoCreateProfile: false,
        }));
      }
    } else {
      const tch = snapshot.teachers.find((t) => t.id === personId);
      if (tch) {
        const suggestedUser = tch.teacherCode.toLowerCase().replace(/[^a-z0-9._-]/g, '');
        setForm((f) => ({
          ...f,
          linkedId: tch.id,
          nameKh: tch.nameKh || f.nameKh,
          nameEn: tch.nameEn || f.nameEn,
          titleKh: tch.roleTitleKh || f.titleKh,
          titleEn: tch.roleTitleEn || f.titleEn,
          phone: tch.phone || f.phone,
          email: tch.email || f.email,
          username: f.username || suggestedUser,
          autoCreateProfile: false,
        }));
      }
    }
  };

  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#';
    let out = '';
    for (let i = 0; i < 10; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    setForm((f) => ({ ...f, password: out }));
    setShowPw(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      const ok = await applyServerResult(
        dataEngine.updateUserByAdmin(editingUser.id, {
          username: form.username.trim(),
          role: form.role,
          nameKh: form.nameKh.trim(),
          nameEn: form.nameEn.trim() || form.nameKh.trim(),
          titleKh: form.titleKh.trim(),
          titleEn: form.titleEn.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          linkedId: form.linkedId,
          avatarColor: form.avatarColor,
          status: form.status,
          newPassword: form.password.trim() || undefined,
        }),
        tx('ធ្វើបច្ចុប្បន្នភាពគណនីជោគជ័យ!', 'User account updated!')
      );
      if (ok) setModalOpen(false);
    } else {
      const ok = await applyServerResult(
        dataEngine.createUserByAdmin({
          username: form.username.trim(),
          password: form.password,
          role: form.role,
          nameKh: form.nameKh.trim(),
          nameEn: form.nameEn.trim() || form.nameKh.trim(),
          titleKh: form.titleKh.trim(),
          titleEn: form.titleEn.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          linkedId: form.linkedId || undefined,
          classId: form.role === 'student' ? form.classId : undefined,
          avatarColor: form.avatarColor,
          status: form.status,
          autoCreateProfile: form.autoCreateProfile,
        }),
        tx('បង្កើតគណនីអ្នកប្រើប្រាស់ពិតជោគជ័យ!', 'Real user account created!')
      );
      if (ok) setModalOpen(false);
    }
  };

  const filteredUsers = snapshot.users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    const st = u.status || 'active';
    if (statusFilter !== 'all' && st !== statusFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const hay = `${u.username} ${u.nameKh} ${u.nameEn} ${u.email} ${u.phone} ${u.linkedId}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const adminCount = snapshot.users.filter((u) => u.role === 'admin').length;
  const staffCount = snapshot.users.filter((u) => u.role === 'teacher' || u.role === 'accountant').length;
  const studentCount = snapshot.users.filter((u) => u.role === 'student').length;

  const roleBadge = (r: UserRole) => {
    if (r === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/60">
          <ShieldCheck className="w-3 h-3" />
          {tx('Admin', 'Admin')}
        </span>
      );
    }
    if (r === 'teacher') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60">
          <Users className="w-3 h-3" />
          {tx('គ្រូបង្រៀន', 'Teacher')}
        </span>
      );
    }
    if (r === 'accountant') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60">
          <Wallet className="w-3 h-3" />
          {tx('គណនេយ្យករ', 'Accountant')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/70 dark:border-purple-800/60">
        <GraduationCap className="w-3 h-3" />
        {tx('សិស្ស / អាណាព្យាបាល', 'Student / Parent')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-blue-600" />
            {tx('គ្រប់គ្រងគណនីអ្នកប្រើប្រាស់ពិត (Real User Accounts)', 'Real User Account Administration')}
          </h1>
          <p className="text-sm text-slate-500">
            {tx(
              'បង្កើតគណនីចូលប្រើប្រាស់សម្រាប់នាយកសាលា គ្រូបង្រៀន គណនេយ្យករ និងសិស្ស ព្រមទាំងកំណត់ពាក្យសម្ងាត់ ឬផ្អាកគណនី',
              'Create, link, reset passwords, or suspend real accounts for Admins, Teachers, Accountants, and Students'
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => openCreateModal('teacher')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>{tx('បង្កើតគណនីពិតថ្មី', 'Create Real Account')}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800">
          <div className="text-xs font-bold text-slate-500">{tx('គណនីពិតសរុប', 'Total Accounts')}</div>
          <div className="text-3xl font-extrabold mt-1 text-slate-900 dark:text-white">
            {snapshot.users.length}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            {snapshot.users.filter((u) => u.status !== 'suspended').length} {tx('សកម្ម', 'active')}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800">
          <div className="text-xs font-bold text-slate-500">{tx('អ្នកគ្រប់គ្រង (Admins)', 'Administrators')}</div>
          <div className="text-3xl font-extrabold mt-1 text-blue-600">{adminCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">{tx('សិទ្ធិគ្រប់គ្រងពេញលេញ', 'Full ERP control')}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800">
          <div className="text-xs font-bold text-slate-500">{tx('គ្រូ & គណនេយ្យករ', 'Faculty & Finance')}</div>
          <div className="text-3xl font-extrabold mt-1 text-emerald-600">{staffCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">{tx('គណនីបុគ្គលិកសាលា', 'Staff portals')}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800">
          <div className="text-xs font-bold text-slate-500">{tx('សិស្ស & អាណាព្យាបាល', 'Students & Parents')}</div>
          <div className="text-3xl font-extrabold mt-1 text-purple-600">{studentCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">{tx('តាមដានការសិក្សាផ្ទាល់ខ្លួន', 'Student portals')}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tx(
              'ស្វែងរកតាមឈ្មោះគណនី (@username), ឈ្មោះខ្មែរ/អង់គ្លេស, ទូរស័ព្ទ...',
              'Search by @username, name, phone, email...'
            )}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm outline-none"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as 'all' | UserRole)}
          className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs sm:text-sm font-bold"
        >
          <option value="all">{tx('គ្រប់តួនាទីទាំងអស់', 'All Roles')}</option>
          <option value="admin">{tx('អ្នកគ្រប់គ្រង (Admin)', 'Administrator')}</option>
          <option value="teacher">{tx('គ្រូបង្រៀន (Teacher)', 'Teacher')}</option>
          <option value="accountant">{tx('គណនេយ្យករ (Accountant)', 'Accountant')}</option>
          <option value="student">{tx('សិស្ស / អាណាព្យាបាល', 'Student / Parent')}</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'suspended')}
          className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs sm:text-sm font-bold"
        >
          <option value="all">{tx('គ្រប់ស្ថានភាព', 'All Status')}</option>
          <option value="active">{tx('កំពុងដំណើរការ (Active)', 'Active')}</option>
          <option value="suspended">{tx('បានផ្អាក (Suspended)', 'Suspended')}</option>
        </select>
      </div>

      {/* Accounts Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-xs font-bold text-slate-500 uppercase">
              <tr>
                <th className="text-left px-4 py-3">{tx('អ្នកប្រើប្រាស់', 'User')}</th>
                <th className="text-left px-4 py-3">{tx('ឈ្មោះគណនី', 'Username')}</th>
                <th className="text-left px-4 py-3">{tx('តួនាទី', 'Role')}</th>
                <th className="text-left px-4 py-3">{tx('ប្រវត្តិរូបភ្ជាប់', 'Linked Profile')}</th>
                <th className="text-left px-4 py-3">{tx('ទំនាក់ទំនង', 'Contact')}</th>
                <th className="text-left px-4 py-3">{tx('ស្ថានភាព & ចូលចុងក្រោយ', 'Status / Last Login')}</th>
                <th className="text-right px-4 py-3">{tx('សកម្មភាព', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    {tx('មិនមានគណនីត្រូវនឹងការស្វែងរកឡើយ', 'No matching user accounts found')}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const linkedStu =
                    u.role === 'student'
                      ? snapshot.students.find((s) => s.id === u.linkedId)
                      : null;
                  const linkedTch =
                    u.role !== 'student'
                      ? snapshot.teachers.find((t) => t.id === u.linkedId)
                      : null;
                  const isSuspended = u.status === 'suspended';
                  const isSelf = currentUser?.id === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full text-white font-bold text-xs flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: u.avatarColor || '#2563eb' }}
                          >
                            {initialsFor(u.nameEn || u.nameKh || u.username)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{tx(u.nameKh, u.nameEn || u.nameKh)}</span>
                              {isSelf && (
                                <span className="px-1.5 py-0.5 text-[10px] rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold">
                                  {tx('អ្នក', 'You')}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">
                              {tx(u.titleKh || '—', u.titleEn || u.titleKh || '—')}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                        @{u.username}
                      </td>

                      <td className="px-4 py-3.5">{roleBadge(u.role)}</td>

                      <td className="px-4 py-3.5 text-xs">
                        {linkedStu ? (
                          <button
                            type="button"
                            onClick={() => openStudentProfile(linkedStu.id)}
                            className="text-purple-600 dark:text-purple-400 font-bold hover:underline"
                          >
                            {linkedStu.studentCode}
                          </button>
                        ) : linkedTch ? (
                          <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            {linkedTch.teacherCode}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                        <div>{u.phone || '—'}</div>
                        {u.email && <div className="text-[11px] text-slate-400">{u.email}</div>}
                      </td>

                      <td className="px-4 py-3.5 text-xs">
                        {isSuspended ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                            <Ban className="w-3 h-3" />
                            {tx('ផ្អាក', 'Suspended')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            {tx('សកម្ម', 'Active')}
                          </span>
                        )}
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {u.lastLoginAt || tx('មិនទាន់ចូលប្រើ', 'Never logged in')}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                            title={tx('កែប្រែ / កំណត់ពាក្យសម្ងាត់ថ្មី', 'Edit / Reset Password')}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() =>
                                applyServerResult(
                                  dataEngine.updateUserByAdmin(u.id, {
                                    status: isSuspended ? 'active' : 'suspended',
                                  }),
                                  isSuspended
                                    ? tx('បើកដំណើរការគណនីឡើងវិញជោគជ័យ!', 'Account reactivated!')
                                    : tx('បានផ្អាកគណនីជាបណ្តោះអាសន្ន!', 'Account suspended!')
                                )
                              }
                              className={`p-2 rounded-lg ${
                                isSuspended
                                  ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                  : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                              }`}
                              title={isSuspended ? tx('បើកដំណើរការវិញ', 'Activate') : tx('ផ្អាកគណនី', 'Suspend')}
                            >
                              {isSuspended ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            </button>
                          )}

                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    tx(
                                      `តើអ្នកពិតជាចង់លុបគណនី @${u.username} មែនទេ?`,
                                      `Delete user account @${u.username}?`
                                    )
                                  )
                                ) {
                                  applyServerResult(
                                    dataEngine.deleteUserByAdmin(u.id),
                                    tx('បានលុបគណនីរួចរាល់!', 'Account deleted!')
                                  );
                                }
                              }}
                              className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              title={tx('លុបគណនី', 'Delete Account')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Create / Edit Real Account Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-extrabold flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-blue-600" />
                {editingUser
                  ? tx(`កែប្រែគណនី @${editingUser.username}`, `Edit Account @${editingUser.username}`)
                  : tx('បង្កើតគណនីអ្នកប្រើប្រាស់ពិតថ្មី', 'Create New Real Account')}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Role & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('តួនាទីគណនី (Role) *', 'Account Role *')}
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => {
                      const nextR = e.target.value as UserRole;
                      setForm((f) => ({ ...f, role: nextR, linkedId: '' }));
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold"
                  >
                    <option value="admin">{tx('អ្នកគ្រប់គ្រង (Super Admin)', 'Super Admin')}</option>
                    <option value="teacher">{tx('គ្រូបង្រៀន (Teacher)', 'Teacher')}</option>
                    <option value="accountant">{tx('គណនេយ្យករ (Accountant)', 'Accountant')}</option>
                    <option value="student">{tx('សិស្ស / អាណាព្យាបាល (Student)', 'Student / Parent')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ស្ថានភាពគណនី (Status)', 'Account Status')}
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, status: e.target.value as 'active' | 'suspended' }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold"
                  >
                    <option value="active">{tx('សកម្ម (Active)', 'Active')}</option>
                    <option value="suspended">{tx('ផ្អាកបណ្តោះអាសន្ន (Suspended)', 'Suspended')}</option>
                  </select>
                </div>
              </div>

              {/* Link Existing Student or Teacher */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {form.role === 'student'
                    ? tx('ភ្ជាប់ជាមួយឈ្មោះសិស្សដែលមានក្នុងបញ្ជី (ឬបង្កើតថ្មីស្វ័យប្រវត្តិ)', 'Link to Enrolled Student (or auto-create)')
                    : tx('ភ្ជាប់ជាមួយគ្រូ/បុគ្គលិកក្នុងបញ្ជី (ឬបង្កើតថ្មីស្វ័យប្រវត្តិ)', 'Link to Staff Record (or auto-create)')}
                </label>
                <select
                  value={form.linkedId}
                  onChange={(e) => handleLinkExistingPerson(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                >
                  <option value="">
                    {editingUser
                      ? tx('-- មិនភ្ជាប់ --', '-- Unlinked --')
                      : tx('+ បង្កើតប្រវត្តិរូបសិស្ស/បុគ្គលិកថ្មីដោយស្វ័យប្រវត្តិ', '+ Auto-create matching Student/Staff record')}
                  </option>
                  {form.role === 'student'
                    ? snapshot.students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.studentCode} — {s.nameKh} ({s.nameEn})
                        </option>
                      ))
                    : snapshot.teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.teacherCode} — {t.nameKh} ({t.nameEn})
                        </option>
                      ))}
                </select>
              </div>

              {!editingUser && form.role === 'student' && !form.linkedId && snapshot.classes.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ជ្រើសរើសថ្នាក់រៀនសម្រាប់សិស្សថ្មី', 'Assign Class for New Student')}
                  </label>
                  <select
                    value={form.classId}
                    onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  >
                    <option value="">{tx('-- មិនទាន់កំណត់ថ្នាក់ --', '-- Unassigned --')}</option>
                    {snapshot.classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {displayClassName(c, lang)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Name KH & EN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ឈ្មោះពិត (អក្សរខ្មែរ) *', 'Full Name (Khmer) *')}
                  </label>
                  <input
                    value={form.nameKh}
                    onChange={(e) => setForm((f) => ({ ...f, nameKh: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ឈ្មោះអក្សរឡាតាំង (English)', 'Full Name (English)')}
                  </label>
                  <input
                    value={form.nameEn}
                    onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>

              {/* Username & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ឈ្មោះគណនីចូលប្រើ (Username) *', 'Login Username *')}
                  </label>
                  <input
                    value={form.username}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, username: e.target.value.replace(/\s+/g, '') }))
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-mono font-bold"
                    placeholder="username"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-500">
                      {editingUser
                        ? tx('កំណត់ពាក្យសម្ងាត់ថ្មី (ទុកទទេបើមិនប្តូរ)', 'Reset Password (blank to keep)')
                        : tx('ពាក្យសម្ងាត់ដំបូង (យ៉ាងតិច ៦ តួ) *', 'Initial Password *')}
                    </label>
                    <button
                      type="button"
                      onClick={generateStrongPassword}
                      className="text-[11px] font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      {tx('បង្កើតស្វ័យប្រវត្តិ', 'Generate')}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      className="w-full pl-3.5 pr-9 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-mono"
                      placeholder={editingUser ? tx('មិនផ្លាស់ប្តូរ', 'Unchanged') : '••••••••'}
                      required={!editingUser}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Contact & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('លេខទូរស័ព្ទ (Phone)', 'Phone Number')}
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                    placeholder="012 345 678"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('អ៊ីមែល (Email)', 'Email')}
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                    placeholder="user@school.edu.kh"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('តួនាទីបង្ហាញ (ខ្មែរ)', 'Display Title (Khmer)')}
                  </label>
                  <input
                    value={form.titleKh}
                    onChange={(e) => setForm((f) => ({ ...f, titleKh: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                    placeholder={tx('ឧ. គ្រូបន្ទុកថ្នាក់ទី១២ក', 'Role title (KH)')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ពណ៌រូបតំណាងគណនី', 'Avatar Color')}
                  </label>
                  <div className="flex items-center gap-2 py-1.5">
                    {AVATAR_PALETTE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, avatarColor: c }))}
                        className={`w-6 h-6 rounded-full transition ${
                          form.avatarColor === c ? 'ring-2 ring-offset-2 ring-blue-600 scale-110' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  {tx('បោះបង់', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow"
                >
                  {editingUser ? tx('រក្សាទុកការកែប្រែ', 'Save Changes') : tx('បង្កើតគណនីឥឡូវនេះ', 'Create Account')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
