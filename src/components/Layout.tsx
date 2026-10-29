import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  UserCog,
  CalendarDays,
  CheckSquare,
  Award,
  ClipboardList,
  Wallet,
  Library,
  Megaphone,
  FileSpreadsheet,
  Settings,
  Menu,
  X,
  Globe,
  Moon,
  Sun,
  LogOut,
  Database,
  WifiOff,
  Search,
  ChevronDown,
  KeyRound,
  User,
  Lock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ModuleId, UserRole } from '../types';
import { displayStudentName, initialsFor } from '../utils/academic';

interface NavItem {
  id: ModuleId;
  labelKh: string;
  labelEn: string;
  icon: React.ReactNode;
  roles: UserRole[];
  group: 'core' | 'ops' | 'sys';
  badge?: number;
}

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    user,
    tx,
    lang,
    setLang,
    dark,
    toggleDark,
    connectionMode,
    activeModule,
    setActiveModule,
    snapshot,
    updateMyProfile,
    changeMyPassword,
    logout,
    openStudentProfile,
    notify,
  } = useApp();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  // My Account & Password Modal
  const [myAccountModal, setMyAccountModal] = useState<'profile' | 'password' | null>(null);
  const [profileForm, setProfileForm] = useState({
    nameKh: '',
    nameEn: '',
    username: '',
    titleKh: '',
    email: '',
    phone: '',
    avatarColor: '#2563eb',
  });
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  if (!user) return null;

  const openMyProfileModal = (initialTab: 'profile' | 'password') => {
    setAccountMenuOpen(false);
    setProfileForm({
      nameKh: user.nameKh || '',
      nameEn: user.nameEn || '',
      username: user.username || '',
      titleKh: user.titleKh || '',
      email: user.email || '',
      phone: user.phone || '',
      avatarColor: user.avatarColor || '#2563eb',
    });
    setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setMyAccountModal(initialTab);
  };

  const unpaidCount = snapshot.invoices.filter(
    (i) => i.status === 'unpaid' || i.status === 'overdue' || i.status === 'partial'
  ).length;
  const pendingLeaves = snapshot.teacherLeaves.filter((l) => l.status === 'pending').length;
  const overdueLoans = snapshot.libraryLoans.filter((l) => l.status === 'overdue').length;

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      labelKh: user.role === 'student' ? 'ទំព័រដើមសិស្ស' : 'ផ្ទាំងគ្រប់គ្រងរួម',
      labelEn: user.role === 'student' ? 'My Portal' : 'Executive Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      roles: ['admin', 'teacher', 'accountant', 'student'],
      group: 'core',
    },
    {
      id: 'students',
      labelKh: 'គ្រប់គ្រងសិស្ស និងប័ណ្ណ QR',
      labelEn: 'Students & QR IDs',
      icon: <Users className="w-4 h-4" />,
      roles: ['admin', 'teacher', 'accountant'],
      group: 'core',
      badge: snapshot.students.length > 0 ? snapshot.students.length : undefined,
    },
    {
      id: 'academic',
      labelKh: 'ថ្នាក់រៀន និងមុខវិជ្ជា',
      labelEn: 'Classes & Curriculum',
      icon: <BookOpen className="w-4 h-4" />,
      roles: ['admin', 'teacher'],
      group: 'core',
    },
    {
      id: 'timetable',
      labelKh: 'កាលវិភាគសិក្សា',
      labelEn: 'Timetable',
      icon: <CalendarDays className="w-4 h-4" />,
      roles: ['admin', 'teacher', 'student'],
      group: 'core',
    },
    {
      id: 'attendance',
      labelKh: 'វត្តមាន & ស្កេន QR',
      labelEn: 'Attendance & QR Scan',
      icon: <CheckSquare className="w-4 h-4" />,
      roles: ['admin', 'teacher', 'student'],
      group: 'core',
    },
    {
      id: 'grades',
      labelKh: 'ពិន្ទុ ប្រឡង & ចំណាត់ថ្នាក់',
      labelEn: 'MoEYS Grades & Exams',
      icon: <Award className="w-4 h-4" />,
      roles: ['admin', 'teacher', 'student'],
      group: 'core',
    },
    {
      id: 'assignments',
      labelKh: 'កិច្ចការផ្ទះ & វិន័យ',
      labelEn: 'Homework & Behavior',
      icon: <ClipboardList className="w-4 h-4" />,
      roles: ['admin', 'teacher', 'student'],
      group: 'core',
    },
    {
      id: 'teachers',
      labelKh: 'គ្រូ បុគ្គលិក & ប្រាក់ខែ',
      labelEn: 'HR, Leaves & Payroll',
      icon: <UserCog className="w-4 h-4" />,
      roles: ['admin', 'accountant', 'teacher'],
      group: 'ops',
      badge: pendingLeaves > 0 ? pendingLeaves : undefined,
    },
    {
      id: 'finance',
      labelKh: 'ហិរញ្ញវត្ថុ & វិក្កយបត្រ',
      labelEn: 'Tuition & Finance',
      icon: <Wallet className="w-4 h-4" />,
      roles: ['admin', 'accountant', 'student'],
      group: 'ops',
      badge: user.role !== 'student' && unpaidCount > 0 ? unpaidCount : undefined,
    },
    {
      id: 'library',
      labelKh: 'បណ្ណាល័យសាលា',
      labelEn: 'Library System',
      icon: <Library className="w-4 h-4" />,
      roles: ['admin', 'teacher', 'student'],
      group: 'ops',
      badge: overdueLoans > 0 ? overdueLoans : undefined,
    },
    {
      id: 'announcements',
      labelKh: 'សេចក្តីជូនដំណឹង & ព្រឹត្តិការណ៍',
      labelEn: 'Notices & Events',
      icon: <Megaphone className="w-4 h-4" />,
      roles: ['admin', 'teacher', 'accountant', 'student'],
      group: 'sys',
    },
    {
      id: 'reports',
      labelKh: 'របាយការណ៍ បោះពុម្ព PDF/Excel',
      labelEn: 'Print Studio & Reports',
      icon: <FileSpreadsheet className="w-4 h-4" />,
      roles: ['admin', 'teacher', 'accountant'],
      group: 'sys',
    },
    {
      id: 'users',
      labelKh: 'គ្រប់គ្រងគណនីអ្នកប្រើប្រាស់',
      labelEn: 'User Accounts',
      icon: <KeyRound className="w-4 h-4" />,
      roles: ['admin'],
      group: 'sys',
      badge: snapshot.users.length,
    },
    {
      id: 'settings',
      labelKh: 'ការកំណត់ & បម្រុងទុកទិន្នន័យ',
      labelEn: 'Settings & Backup',
      icon: <Settings className="w-4 h-4" />,
      roles: ['admin'],
      group: 'sys',
    },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(user.role));

  const searchMatches =
    quickSearch.trim().length >= 1 && user.role !== 'student'
      ? snapshot.students
          .filter((s) => {
            const q = quickSearch.toLowerCase();
            return (
              s.nameKh.toLowerCase().includes(q) ||
              s.nameEn.toLowerCase().includes(q) ||
              s.studentCode.toLowerCase().includes(q) ||
              s.phone.toLowerCase().includes(q)
            );
          })
          .slice(0, 6)
      : [];

  const renderNavSection = (group: 'core' | 'ops' | 'sys', titleKh: string, titleEn: string) => {
    const groupItems = visibleItems.filter((i) => i.group === group);
    if (!groupItems.length) return null;
    return (
      <div className="mb-5">
        <div className="px-3 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {tx(titleKh, titleEn)}
        </div>
        <div className="space-y-1">
          {groupItems.map((item) => {
            const active = activeModule === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveModule(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                  active
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={active ? 'text-white' : 'text-slate-400 dark:text-slate-400'}>
                    {item.icon}
                  </span>
                  <span className="truncate">{tx(item.labelKh, item.labelEn)}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 text-[11px] rounded-full font-bold ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-200/70 dark:border-slate-800 flex items-center gap-3">
        <img
          src="./icons/icon-192.png"
          alt="School Logo"
          className="w-10 h-10 rounded-xl shadow-sm flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
            {tx(snapshot.settings.schoolNameKh, snapshot.settings.schoolNameEn)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {tx(`ឆ្នាំសិក្សា ${snapshot.settings.academicYear}`, `AY ${snapshot.settings.academicYear}`)}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav Links */}
      <div className="flex-1 overflow-y-auto p-3">
        {renderNavSection('core', 'សិក្សាធិការ និងថ្នាក់រៀន', 'Academics & Classroom')}
        {renderNavSection('ops', 'រដ្ឋបាល ហិរញ្ញវត្ថុ និងសេវាកម្ម', 'HR, Finance & Campus')}
        {renderNavSection('sys', 'របាយការណ៍ គណនី និងប្រព័ន្ធ', 'Reports, Users & System')}
      </div>

      {/* Logged in Real User Card */}
      <div className="p-3 border-t border-slate-200/70 dark:border-slate-800">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex items-center gap-3">
          <button
            type="button"
            onClick={() => openMyProfileModal('profile')}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
            style={{ backgroundColor: user.avatarColor || '#2563eb' }}
            title={tx('កែប្រែគណនីផ្ទាល់ខ្លួន', 'Edit My Account')}
          >
            {initialsFor(user.nameEn || user.nameKh || user.username)}
          </button>
          <button
            type="button"
            onClick={() => openMyProfileModal('profile')}
            className="min-w-0 flex-1 text-left"
          >
            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {tx(user.nameKh, user.nameEn || user.nameKh)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
              @{user.username}
            </div>
          </button>
          <button
            type="button"
            onClick={logout}
            title={tx('ចាកចេញ', 'Sign Out')}
            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-68 xl:w-72 flex-shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10">{sidebarContent}</div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Global Quick Student Search */}
              {user.role !== 'student' ? (
                <div className="relative max-w-md w-full hidden sm:block">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={quickSearch}
                    onChange={(e) => setQuickSearch(e.target.value)}
                    placeholder={tx(
                      'ស្វែងរកសិស្សរហ័ស (ឈ្មោះ, អត្តលេខ, លេខទូរស័ព្ទ)...',
                      'Quick search student (Name, ID, Phone)...'
                    )}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs sm:text-sm outline-none border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition"
                  />
                  {searchMatches.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                      {searchMatches.map((st) => {
                        const cls = snapshot.classes.find((c) => c.id === st.classId);
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => {
                              setQuickSearch('');
                              openStudentProfile(st.id);
                            }}
                            className="w-full px-4 py-2.5 text-left hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center justify-between border-b last:border-b-0 border-slate-100 dark:border-slate-800"
                          >
                            <div>
                              <div className="text-sm font-bold">{displayStudentName(st, lang)}</div>
                              <div className="text-xs text-slate-500">
                                {st.studentCode} · {cls ? tx(cls.nameKh, cls.nameEn) : '—'}
                              </div>
                            </div>
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                              {tx('មើលប្រវត្តិរូប →', 'Profile →')}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                  {tx('ប្រព័ន្ធតាមដានការសិក្សាសម្រាប់សិស្ស និងអាណាព្យាបាល', 'Student & Parent Academic Portal')}
                </div>
              )}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Hybrid SQLite / Offline Status Badge */}
              <div
                className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border ${
                  connectionMode === 'online'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60'
                }`}
              >
                {connectionMode === 'online' ? (
                  <>
                    <Database className="w-3.5 h-3.5" />
                    <span>SQLite Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>Offline PWA</span>
                  </>
                )}
              </div>

              {/* Real Account Dropdown Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((o) => !o)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  <span
                    className="w-5 h-5 rounded-full text-[10px] text-white flex items-center justify-center font-bold"
                    style={{ backgroundColor: user.avatarColor || '#2563eb' }}
                  >
                    {initialsFor(user.nameEn || user.nameKh || user.username)}
                  </span>
                  <span className="hidden sm:inline max-w-[120px] truncate">
                    {tx(user.nameKh, user.nameEn || user.username)}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 uppercase text-[10px]">
                    {user.role}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {accountMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setAccountMenuOpen(false)} />
                    <div className="absolute right-0 mt-1.5 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-50">
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {tx(user.nameKh, user.nameEn || user.username)}
                        </div>
                        <div className="text-[11px] font-mono text-blue-600 dark:text-blue-400">
                          @{user.username}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openMyProfileModal('profile')}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                      >
                        <User className="w-4 h-4 text-blue-600" />
                        <span>{tx('ព័ត៌មានគណនីផ្ទាល់ខ្លួន', 'Edit My Profile')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openMyProfileModal('password')}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Lock className="w-4 h-4 text-emerald-600" />
                        <span>{tx('ប្តូរពាក្យសម្ងាត់ថ្មី', 'Change Password')}</span>
                      </button>

                      {user.role === 'admin' && (
                        <button
                          type="button"
                          onClick={() => {
                            setAccountMenuOpen(false);
                            setActiveModule('users');
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                        >
                          <KeyRound className="w-4 h-4 text-purple-600" />
                          <span>{tx('គ្រប់គ្រងគណនីអ្នកប្រើទាំងអស់', 'Manage All Accounts')}</span>
                        </button>
                      )}

                      <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                      <button
                        type="button"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{tx('ចាកចេញពីគណនី', 'Sign Out')}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Language Switcher */}
              <button
                type="button"
                onClick={() => setLang(lang === 'km' ? 'en' : 'km')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{lang === 'km' ? 'EN' : 'ខ្មែរ'}</span>
              </button>

              {/* Dark Mode Toggle */}
              <button
                type="button"
                onClick={toggleDark}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                title={tx('ប្តូរពណ៌ផ្ទៃ', 'Toggle Theme')}
              >
                {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Self-Service My Profile & Change Password Modal */}
      {myAccountModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold">
                {tx('គ្រប់គ្រងគណនីផ្ទាល់ខ្លួន', 'My Account Security')}
              </h3>
              <button
                type="button"
                onClick={() => setMyAccountModal(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 mb-4">
              <button
                type="button"
                onClick={() => setMyAccountModal('profile')}
                className={`py-2 rounded-lg text-xs font-bold ${
                  myAccountModal === 'profile'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                {tx('ព័ត៌មានគណនី', 'Profile Info')}
              </button>
              <button
                type="button"
                onClick={() => setMyAccountModal('password')}
                className={`py-2 rounded-lg text-xs font-bold ${
                  myAccountModal === 'password'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                {tx('ប្តូរពាក្យសម្ងាត់', 'Change Password')}
              </button>
            </div>

            {myAccountModal === 'profile' ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const ok = await updateMyProfile(profileForm);
                  if (ok) setMyAccountModal(null);
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ឈ្មោះ (ខ្មែរ) *', 'Full Name (Khmer) *')}
                  </label>
                  <input
                    value={profileForm.nameKh}
                    onChange={(e) => setProfileForm({ ...profileForm, nameKh: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ឈ្មោះ (English)', 'Full Name (English)')}
                  </label>
                  <input
                    value={profileForm.nameEn}
                    onChange={(e) => setProfileForm({ ...profileForm, nameEn: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ឈ្មោះគណនីចូលប្រើ (@username) *', 'Login Username *')}
                  </label>
                  <input
                    value={profileForm.username}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        username: e.target.value.replace(/\s+/g, ''),
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-mono font-bold"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      {tx('លេខទូរស័ព្ទ', 'Phone')}
                    </label>
                    <input
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      {tx('អ៊ីមែល', 'Email')}
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setMyAccountModal(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                  >
                    {tx('បោះបង់', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                  >
                    {tx('រក្សាទុក', 'Save Profile')}
                  </button>
                </div>
              </form>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (pwForm.newPassword.length < 6) {
                    notify(tx('ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច ៦ តួអក្សរ!', 'Password must be >= 6 chars!'));
                    return;
                  }
                  if (pwForm.newPassword !== pwForm.confirmPassword) {
                    notify(tx('ការបញ្ជាក់ពាក្យសម្ងាត់មិនដូចគ្នាទេ!', 'Passwords do not match!'));
                    return;
                  }
                  const ok = await changeMyPassword({
                    currentPassword: pwForm.currentPassword,
                    newPassword: pwForm.newPassword,
                  });
                  if (ok) setMyAccountModal(null);
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ពាក្យសម្ងាត់បច្ចុប្បន្ន *', 'Current Password *')}
                  </label>
                  <input
                    type="password"
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ពាក្យសម្ងាត់ថ្មី (យ៉ាងតិច ៦ តួ) *', 'New Password (min 6 chars) *')}
                  </label>
                  <input
                    type="password"
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('បញ្ជាក់ពាក្យសម្ងាត់ថ្មីម្តងទៀត *', 'Confirm New Password *')}
                  </label>
                  <input
                    type="password"
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setMyAccountModal(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                  >
                    {tx('បោះបង់', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                  >
                    {tx('ផ្លាស់ប្តូរពាក្យសម្ងាត់', 'Update Password')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
