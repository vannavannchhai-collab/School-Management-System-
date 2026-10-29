import React, { useState } from 'react';
import {
  ShieldCheck,
  GraduationCap,
  Wallet,
  Users,
  Lock,
  User,
  Globe,
  Moon,
  Sun,
  Database,
  WifiOff,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

export const LoginScreen: React.FC = () => {
  const { tx, lang, setLang, dark, toggleDark, connectionMode, snapshot, loginWithCredentials } = useApp();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await loginWithCredentials({ username, password });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const quickLogin = async (role: UserRole) => {
    setError(null);
    setSubmitting(true);
    try {
      await loginWithCredentials({ demoRole: role });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const demoAccounts: Array<{
    role: UserRole;
    titleKh: string;
    titleEn: string;
    subKh: string;
    subEn: string;
    creds: string;
    icon: React.ReactNode;
    gradient: string;
  }> = [
    {
      role: 'admin',
      titleKh: 'នាយកសាលា / Super Admin',
      titleEn: 'Principal / Super Admin',
      subKh: 'គ្រប់គ្រងប្រព័ន្ធទាំងមូល ១៣ មុខងារ',
      subEn: 'Full access to all 13 ERP modules',
      creds: 'admin / admin123',
      icon: <ShieldCheck className="w-5 h-5" />,
      gradient: 'from-blue-600 to-indigo-600',
    },
    {
      role: 'teacher',
      titleKh: 'គ្រូបង្រៀន (Teacher Portal)',
      titleEn: 'Homeroom & Subject Teacher',
      subKh: 'វត្តមាន ពិន្ទុ កាលវិភាគ កិច្ចការផ្ទះ',
      subEn: 'Attendance, grades, timetable & homework',
      creds: 'teacher / teacher123',
      icon: <Users className="w-5 h-5" />,
      gradient: 'from-emerald-600 to-teal-600',
    },
    {
      role: 'accountant',
      titleKh: 'គណនេយ្យករ (Finance & Payroll)',
      titleEn: 'Chief Accountant',
      subKh: 'ថ្លៃសិក្សា វិក្កយបត្រ ចំណាយ និងប្រាក់ខែ',
      subEn: 'Tuition, KHQR receipts, expenses & payroll',
      creds: 'accountant / acc123',
      icon: <Wallet className="w-5 h-5" />,
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      role: 'student',
      titleKh: 'សិស្ស និងអាណាព្យាបាល',
      titleEn: 'Student & Parent Portal',
      subKh: 'សុខ ដារា (12A) — ពិន្ទុ វត្តមាន ប័ណ្ណ QR',
      subEn: 'Sok Dara (12A) — Grades, fees & QR ID',
      creds: 'student / student123',
      icon: <GraduationCap className="w-5 h-5" />,
      gradient: 'from-purple-600 to-fuchsia-600',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950">
      {/* Left Hero Branding Panel */}
      <div className="lg:w-7/12 relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-8 lg:p-14 flex flex-col justify-between">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src="./icons/icon-192.png"
              alt="School Crest"
              className="w-12 h-12 rounded-2xl shadow-lg ring-2 ring-white/20"
            />
            <div>
              <div className="text-xs uppercase tracking-widest text-blue-300 font-semibold">
                {tx('ប្រព័ន្ធគ្រប់គ្រងសាលារៀនឌីជីថល', 'Enterprise School Management ERP')}
              </div>
              <div className="text-lg font-bold leading-snug">
                {tx(snapshot.settings.schoolNameKh, snapshot.settings.schoolNameEn)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                connectionMode === 'online'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-400/30'
              }`}
            >
              {connectionMode === 'online' ? (
                <>
                  <Database className="w-3.5 h-3.5" />
                  {tx('SQLite Server Online', 'SQLite Server Online')}
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  {tx('Offline PWA Mode', 'Offline PWA Mode')}
                </>
              )}
            </span>
          </div>
        </div>

        <div className="relative z-10 my-10 lg:my-0">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-blue-200 text-xs font-medium mb-5 border border-white/15">
            <span>🇰🇭</span>
            <span>
              {tx(
                'ស្តង់ដារក្រសួងអប់រំ យុវជន និងកីឡា (MoEYS K–12) & សាលាឯកជនអន្តរជាតិ',
                'Cambodian MoEYS K–12 Curriculum & Private International School ERP'
              )}
            </span>
          </div>

          <h1 className="text-3xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-4">
            {tx(
              'គ្រប់គ្រងសាលារៀនទាំងមូល ក្នុងប្រព័ន្ធតែមួយ ប្រកបដោយប្រសិទ្ធភាពខ្ពស់',
              'Unified Digital Campus for Modern K–12 Education'
            )}
          </h1>
          <p className="text-blue-100/85 text-base lg:text-lg max-w-2xl leading-relaxed mb-8">
            {tx(
              'រួមបញ្ចូលការគ្រប់គ្រងសិស្ស គ្រូបង្រៀន ប្រាក់បៀវត្សរ៍ កាលវិភាគ វត្តមានស្កេន QR ពិន្ទុប្រចាំខែ/ឆមាស និទ្ទេស A–F វិក្កយបត្រ KHQR បណ្ណាល័យ និងរបាយការណ៍ផ្លូវការ PDF/Excel។',
              'Complete student lifecycle, MoEYS A–F transcripts, QR attendance, conflict-free timetables, tuition invoicing, staff payroll, library circulation, and official A4 print studio.'
            )}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {[
              { val: `${snapshot.students.length}+`, lbl: tx('សិស្សកំពុងសិក្សា', 'Active Students') },
              { val: `${snapshot.classes.length}`, lbl: tx('កម្រិតថ្នាក់ K–12', 'K–12 Classes') },
              { val: `${snapshot.teachers.length}`, lbl: tx('គ្រូ និងបុគ្គលិក', 'Faculty & Staff') },
              { val: '13', lbl: tx('មុខងារធំៗរួមបញ្ចូលគ្នា', 'Integrated Modules') },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 p-4"
              >
                <div className="text-2xl font-extrabold text-white">{item.val}</div>
                <div className="text-xs text-blue-200 mt-0.5">{item.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 text-xs text-blue-200/80 border-t border-white/10 pt-5">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {tx('Full-Stack SQLite + Offline PWA', 'Full-Stack SQLite + Offline PWA')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {tx('ឆ្នាំសិក្សា ២០២៦-២០២៧', 'Academic Year 2026–2027')}
            </span>
          </div>
          <div>{tx(snapshot.settings.addressKh, snapshot.settings.addressEn)}</div>
        </div>
      </div>

      {/* Right Login & Instant Role Switcher Panel */}
      <div className="lg:w-5/12 flex flex-col justify-between p-6 sm:p-10 lg:p-12 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setLang(lang === 'km' ? 'en' : 'km')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            {lang === 'km' ? 'English' : 'ភាសាខ្មែរ'}
          </button>
          <button
            type="button"
            onClick={toggleDark}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title="Toggle Theme"
          >
            {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <div className="max-w-md w-full mx-auto my-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {tx('ចូលប្រើប្រាស់ប្រព័ន្ធ', 'Sign In to Portal')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {tx(
              'បញ្ចូលគណនីរបស់អ្នក ឬជ្រើសរើសគណនីសាកល្បងរហ័សខាងក្រោម',
              'Enter your credentials or click a 1-tap demo role portal below'
            )}
          </p>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 mb-7">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                {tx('ឈ្មោះគណនី (Username)', 'Username')}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-sm transition"
                  placeholder="admin"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                {tx('ពាក្យសម្ងាត់ (Password)', 'Password')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-sm transition"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition disabled:opacity-60"
            >
              <span>{submitting ? tx('កំពុងចូល...', 'Signing in...') : tx('ចូលប្រព័ន្ធឥឡូវនេះ', 'Sign In to Dashboard')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-semibold">
                {tx('ចូលសាកល្បងរហ័សតាមតួនាទី (1-Click Demo Portals)', '1-Click Role Portals')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {demoAccounts.map((acc) => (
              <button
                key={acc.role}
                type="button"
                disabled={submitting}
                onClick={() => quickLogin(acc.role)}
                className="text-left p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md bg-slate-50/70 dark:bg-slate-800/50 transition group"
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div
                    className={`w-8 h-8 rounded-xl bg-gradient-to-br ${acc.gradient} text-white flex items-center justify-center shadow-sm`}
                  >
                    {acc.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {tx(acc.titleKh, acc.titleEn)}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">{acc.creds}</div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                  {tx(acc.subKh, acc.subEn)}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="text-center text-xs text-slate-400">
          © 2026 {tx(snapshot.settings.schoolNameKh, snapshot.settings.schoolNameEn)} · v2.0 Enterprise Edition
        </div>
      </div>
    </div>
  );
};
