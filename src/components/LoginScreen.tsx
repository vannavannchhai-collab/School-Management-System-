import React, { useEffect, useState } from 'react';
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
  Eye,
  EyeOff,
  Mail,
  Phone,
  Building2,
  UserPlus,
  LogIn,
  KeyRound,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { displayClassName } from '../utils/academic';

const REMEMBER_USER_KEY = 'school_erp_remembered_username';

export const LoginScreen: React.FC = () => {
  const {
    tx,
    lang,
    setLang,
    dark,
    toggleDark,
    connectionMode,
    snapshot,
    loginWithCredentials,
    registerAccount,
  } = useApp();

  const isFirstSetup = snapshot.users.length === 0;
  const [authTab, setAuthTab] = useState<'login' | 'register'>(
    isFirstSetup ? 'register' : 'login'
  );

  useEffect(() => {
    if (isFirstSetup) {
      setAuthTab('register');
    }
  }, [isFirstSetup]);

  // Sign-In state (zero demo credentials!)
  const [loginUsername, setLoginUsername] = useState(() => {
    try {
      return localStorage.getItem(REMEMBER_USER_KEY) || '';
    } catch {
      return '';
    }
  });
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return Boolean(localStorage.getItem(REMEMBER_USER_KEY));
    } catch {
      return false;
    }
  });
  const [showPass, setShowPass] = useState(false);

  // Registration / First-Time Setup state
  const [regRole, setRegRole] = useState<UserRole>('student');
  const [schoolNameKh, setSchoolNameKh] = useState(snapshot.settings.schoolNameKh || '');
  const [schoolNameEn, setSchoolNameEn] = useState(snapshot.settings.schoolNameEn || '');
  const [nameKh, setNameKh] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [classId, setClassId] = useState('');
  const [linkedCode, setLinkedCode] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const passwordScore = (() => {
    const p = regPassword;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s += 1;
    if (p.length >= 9) s += 1;
    if (/[A-Z]/.test(p) || /[0-9]/.test(p)) s += 1;
    if (/[^A-Za-z0-9]/.test(p)) s += 1;
    return Math.min(4, Math.max(1, s));
  })();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const cleanId = loginUsername.trim();
      await loginWithCredentials({ username: cleanId, password: loginPassword });
      try {
        if (rememberMe) localStorage.setItem(REMEMBER_USER_KEY, cleanId);
        else localStorage.removeItem(REMEMBER_USER_KEY);
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (regPassword.length < 6) {
      setError(
        tx(
          'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួអក្សរ!',
          'Password must be at least 6 characters long!'
        )
      );
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError(
        tx(
          'ពាក្យសម្ងាត់ និងការបញ្ជាក់ពាក្យសម្ងាត់មិនដូចគ្នាទេ!',
          'Passwords do not match!'
        )
      );
      return;
    }

    setSubmitting(true);
    try {
      const effectiveRole: UserRole = isFirstSetup ? 'admin' : regRole;
      await registerAccount({
        username: regUsername.trim(),
        password: regPassword,
        role: effectiveRole,
        nameKh: nameKh.trim() || nameEn.trim(),
        nameEn: nameEn.trim() || nameKh.trim(),
        phone: phone.trim(),
        email: email.trim(),
        gender,
        classId: effectiveRole === 'student' ? classId : undefined,
        linkedId: linkedCode.trim() || undefined,
        specialization: specialization.trim() || undefined,
        titleKh:
          effectiveRole !== 'student' && specialization.trim()
            ? specialization.trim()
            : undefined,
        schoolNameKh: isFirstSetup ? schoolNameKh.trim() : undefined,
        schoolNameEn: isFirstSetup ? schoolNameEn.trim() : undefined,
        autoCreateProfile: true,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const roleOptions: Array<{
    role: UserRole;
    kh: string;
    en: string;
    descKh: string;
    descEn: string;
    icon: React.ReactNode;
  }> = [
    {
      role: 'student',
      kh: 'សិស្ស / អាណាព្យាបាល',
      en: 'Student / Parent',
      descKh: 'មើលពិន្ទុ វត្តមាន ប័ណ្ណ QR & វិក្កយបត្រ',
      descEn: 'Grades, attendance, QR ID & fees',
      icon: <GraduationCap className="w-4 h-4" />,
    },
    {
      role: 'teacher',
      kh: 'គ្រូបង្រៀន',
      en: 'Teacher',
      descKh: 'ស្រង់វត្តមាន បញ្ចូលពិន្ទុ & កិច្ចការផ្ទះ',
      descEn: 'Roll call, MoEYS scores & homework',
      icon: <Users className="w-4 h-4" />,
    },
    {
      role: 'accountant',
      kh: 'គណនេយ្យករ',
      en: 'Accountant',
      descKh: 'វិក្កយបត្រ ថ្លៃសិក្សា ចំណាយ & ប្រាក់ខែ',
      descEn: 'Tuition billing, receipts & payroll',
      icon: <Wallet className="w-4 h-4" />,
    },
    {
      role: 'admin',
      kh: 'អ្នកគ្រប់គ្រង (Admin)',
      en: 'Administrator',
      descKh: 'គ្រប់គ្រងប្រព័ន្ធ និងគណនីទាំងមូល',
      descEn: 'Full school & user administration',
      icon: <ShieldCheck className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950">
      {/* Left Hero Branding Panel */}
      <div className="lg:w-6/12 xl:w-7/12 relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-8 lg:p-14 flex flex-col justify-between">
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
                {tx('ប្រព័ន្ធគ្រប់គ្រងសាលារៀនឌីជីថលផ្លូវការ', 'Enterprise School Management ERP')}
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
                  <span>SQLite Live DB</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Offline PWA</span>
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
              'ប្រព័ន្ធគ្រប់គ្រងសាលារៀនពិតប្រាកដ សុវត្ថិភាពខ្ពស់ និងទិន្នន័យរក្សាទុកអចិន្ត្រៃយ៍',
              'Production-Ready Digital Campus with Real Role-Based Accounts'
            )}
          </h1>
          <p className="text-blue-100/85 text-base lg:text-lg max-w-2xl leading-relaxed mb-8">
            {tx(
              'គ្រប់គ្រងគណនីពិតរបស់នាយកសាលា គ្រូបង្រៀន គណនេយ្យករ និងសិស្ស-អាណាព្យាបាល ជាមួយការអ៊ិនគ្រីបពាក្យសម្ងាត់ សៀវភៅតាមដានការសិក្សា MoEYS A–F វត្តមានស្កេន QR និងវិក្កយបត្រហិរញ្ញវត្ថុ។',
              'Encrypted real user authentication for Principals, Faculty, Accountants, and Students with persistent SQLite storage, MoEYS transcripts, QR check-in, and tuition billing.'
            )}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {[
              { val: `${snapshot.users.length}`, lbl: tx('គណនីបានចុះឈ្មោះ', 'Registered Accounts') },
              { val: `${snapshot.students.length}`, lbl: tx('សិស្សកំពុងសិក្សា', 'Enrolled Students') },
              { val: `${snapshot.classes.length}`, lbl: tx('ថ្នាក់រៀន K–12', 'Active Classes') },
              { val: `${snapshot.teachers.length}`, lbl: tx('គ្រូ និងបុគ្គលិក', 'Faculty & Staff') },
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
              {tx('ការអ៊ិនគ្រីបពាក្យសម្ងាត់ Scrypt + JWT', 'Scrypt Password Hashing + JWT Auth')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {tx(`ឆ្នាំសិក្សា ${snapshot.settings.academicYear}`, `Academic Year ${snapshot.settings.academicYear}`)}
            </span>
          </div>
          {snapshot.settings.addressKh && (
            <div>{tx(snapshot.settings.addressKh, snapshot.settings.addressEn || snapshot.settings.addressKh)}</div>
          )}
        </div>
      </div>

      {/* Right Real Authentication & Registration Panel */}
      <div className="lg:w-6/12 xl:w-5/12 flex flex-col justify-between p-6 sm:p-10 bg-white dark:bg-slate-900 overflow-y-auto">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <KeyRound className="w-3.5 h-3.5" />
            <span>{tx('ប្រព័ន្ធគណនីពិត (Production Mode)', 'Real Account Security')}</span>
          </div>
          <div className="flex items-center gap-2">
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
        </div>

        <div className="max-w-md w-full mx-auto my-6">
          {/* First-Time System Setup Callout */}
          {isFirstSetup ? (
            <div className="mb-6 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-extrabold text-sm mb-1">
                <ShieldCheck className="w-5 h-5" />
                <span>
                  {tx(
                    'សូមស្វាគមន៍! បង្កើតគណនីម្ចាស់សាលាដំបូង (Super Admin)',
                    'First-Time Setup: Create Owner / Principal Account'
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {tx(
                  'ប្រព័ន្ធមិនទាន់មានគណនីនៅឡើយទេ។ គណនីដំបូងដែលអ្នកបង្កើតនៅទីនេះ នឹងក្លាយជាគណនីម្ចាស់សាលា (Super Admin) ពេញសិទ្ធិដោយស្វ័យប្រវត្តិ។',
                  'No accounts exist yet. The first account registered below automatically receives full Super Admin privileges.'
                )}
              </p>
            </div>
          ) : (
            /* Sign In / Register Switcher Tabs */
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-6">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setAuthTab('login');
                }}
                className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
                  authTab === 'login'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>{tx('ចូលប្រើគណនី', 'Sign In')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setAuthTab('register');
                }}
                className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
                  authTab === 'register'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>{tx('ចុះឈ្មោះគណនីថ្មី', 'Create Account')}</span>
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-semibold">
              {error}
            </div>
          )}

          {/* ==================== SIGN IN FORM ==================== */}
          {authTab === 'login' && !isFirstSetup ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">
                  {tx('ចូលប្រើប្រាស់ប្រព័ន្ធសាលា', 'Sign In to Your Account')}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {tx(
                    'បញ្ចូលឈ្មោះគណនី អ៊ីមែល ឬលេខទូរស័ព្ទ និងពាក្យសម្ងាត់ពិតរបស់អ្នក',
                    'Sign in using your registered username, email, or phone number'
                  )}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  {tx('ឈ្មោះគណនី / អ៊ីមែល / លេខទូរស័ព្ទ', 'Username / Email / Phone')}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    autoComplete="username"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-sm transition"
                    placeholder={tx('បញ្ចូលឈ្មោះគណនី ឬលេខទូរស័ព្ទ...', 'Enter username, email or phone...')}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  {tx('ពាក្យសម្ងាត់ (Password)', 'Password')}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-sm transition"
                    placeholder={tx('បញ្ចូលពាក្យសម្ងាត់...', 'Enter your password...')}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="inline-flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300 font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{tx('ចងចាំឈ្មោះគណនីរបស់ខ្ញុំ', 'Remember my username')}</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition disabled:opacity-60"
              >
                <span>
                  {submitting
                    ? tx('កំពុងផ្ទៀងផ្ទាត់គណនី...', 'Verifying credentials...')
                    : tx('ចូលប្រើប្រាស់ប្រព័ន្ធ', 'Sign In')}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-3 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                {tx('មិនទាន់មានគណនីប្រើប្រាស់មែនទេ? ', "Don't have an account yet? ")}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setAuthTab('register');
                  }}
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                >
                  {tx('បង្កើតគណនីពិតថ្មីនៅទីនេះ →', 'Register a real account →')}
                </button>
              </div>
            </form>
          ) : (
            /* ==================== REGISTER / FIRST-TIME OWNER SETUP FORM ==================== */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mb-1">
                  {isFirstSetup
                    ? tx('រៀបចំសាលា និងគណនីនាយកសាលា', 'School & Principal Account Setup')
                    : tx('ចុះឈ្មោះបង្កើតគណនីពិតថ្មី', 'Create a Real Account')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isFirstSetup
                    ? tx(
                        'បំពេញឈ្មោះសាលា និងព័ត៌មានផ្ទាល់ខ្លួនរបស់អ្នកដើម្បីចាប់ផ្តើមប្រើប្រាស់ប្រព័ន្ធ',
                        'Configure your school name and create your permanent Super Admin account'
                      )
                    : tx(
                        'ជ្រើសរើសតួនាទី និងបំពេញព័ត៌មានពិតប្រាកដដើម្បីបង្កើតគណនីប្រើប្រាស់ផ្ទាល់ខ្លួន',
                        'Select your role and fill in your real details to register'
                      )}
                </p>
              </div>

              {/* School Identity fields during First-Time Setup */}
              {isFirstSetup && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
                  <div className="text-xs font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>{tx('ព័ត៌មានឈ្មោះសាលារៀនរបស់អ្នក', 'Your School Identity')}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        {tx('ឈ្មោះសាលា (អក្សរខ្មែរ) *', 'School Name (Khmer) *')}
                      </label>
                      <input
                        type="text"
                        value={schoolNameKh}
                        onChange={(e) => setSchoolNameKh(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm outline-none focus:border-blue-500"
                        placeholder="សាលាចំណេះទូទៅ..."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        {tx('ឈ្មោះសាលា (English)', 'School Name (English)')}
                      </label>
                      <input
                        type="text"
                        value={schoolNameEn}
                        onChange={(e) => setSchoolNameEn(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm outline-none focus:border-blue-500"
                        placeholder="General & International School"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Role Selector (when not first-time owner setup) */}
              {!isFirstSetup && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    {tx('ជ្រើសរើសប្រភេទគណនី (Account Role) *', 'Select Account Role *')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {roleOptions.map((opt) => {
                      const active = regRole === opt.role;
                      return (
                        <button
                          key={opt.role}
                          type="button"
                          onClick={() => setRegRole(opt.role)}
                          className={`text-left p-2.5 rounded-xl border transition ${
                            active
                              ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 ring-1 ring-blue-600'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                            <span className={active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}>
                              {opt.icon}
                            </span>
                            <span className="truncate">{tx(opt.kh, opt.en)}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {tx(opt.descKh, opt.descEn)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Full Name KH & EN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {tx('គោត្តនាម និងនាម (ខ្មែរ) *', 'Full Name (Khmer) *')}
                  </label>
                  <input
                    type="text"
                    value={nameKh}
                    onChange={(e) => setNameKh(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-sm"
                    placeholder={tx('ឧ. សុខ សម្បត្តិ', 'Khmer Name')}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {tx('ឈ្មោះអក្សរឡាតាំង (English)', 'Full Name (Latin/EN)')}
                  </label>
                  <input
                    type="text"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-sm"
                    placeholder="e.g. Sok Sambath"
                  />
                </div>
              </div>

              {/* Username & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {tx('ឈ្មោះគណនីសម្រាប់ចូលប្រើ (Username) *', 'Login Username *')}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value.replace(/\s+/g, ''))}
                      autoComplete="username"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-sm font-mono"
                      placeholder="soksambath"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {tx('ភេទ (Gender)', 'Gender')}
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'M' | 'F')}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm outline-none"
                  >
                    <option value="M">{tx('ប្រុស (Male)', 'Male')}</option>
                    <option value="F">{tx('ស្រី (Female)', 'Female')}</option>
                  </select>
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {tx('លេខទូរស័ព្ទ (Phone)', 'Phone Number')}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-sm"
                      placeholder="012 345 678"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {tx('អ៊ីមែល (Email)', 'Email Address')}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-sm"
                      placeholder="name@school.edu.kh"
                    />
                  </div>
                </div>
              </div>

              {/* Role-Specific Context Fields */}
              {!isFirstSetup && regRole === 'student' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                      {tx('ថ្នាក់រៀន (Class)', 'Select Class')}
                    </label>
                    <select
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm outline-none"
                    >
                      <option value="">{tx('-- ជ្រើសរើសពេលក្រោយ --', '-- Assign Later --')}</option>
                      {snapshot.classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {displayClassName(c, lang)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                      {tx('អត្តលេខសិស្ស (បើមានស្រាប់)', 'Existing Student ID (Optional)')}
                    </label>
                    <input
                      type="text"
                      value={linkedCode}
                      onChange={(e) => setLinkedCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-mono outline-none"
                      placeholder={tx('ស្វ័យប្រវត្តិបើទុកទទេ', 'Auto-generated if blank')}
                    />
                  </div>
                </div>
              )}

              {!isFirstSetup && (regRole === 'teacher' || regRole === 'accountant') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                      {tx('មុខតំណែង / ឯកទេសបង្រៀន', 'Title / Specialization')}
                    </label>
                    <input
                      type="text"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm outline-none"
                      placeholder={
                        regRole === 'teacher'
                          ? tx('ឧ. គ្រូគណិតវិទ្យា', 'e.g. Math Teacher')
                          : tx('ឧ. គណនេយ្យករ', 'e.g. Accountant')
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                      {tx('អត្តលេខបុគ្គលិក (បើមានស្រាប់)', 'Existing Staff Code (Optional)')}
                    </label>
                    <input
                      type="text"
                      value={linkedCode}
                      onChange={(e) => setLinkedCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-mono outline-none"
                      placeholder={tx('ស្វ័យប្រវត្តិបើទុកទទេ', 'Auto-generated if blank')}
                    />
                  </div>
                </div>
              )}

              {/* Password + Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {tx('ពាក្យសម្ងាត់ (យ៉ាងតិច ៦ តួ) *', 'Password (min 6 chars) *')}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showRegPass ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      autoComplete="new-password"
                      className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-sm"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPass((s) => !s)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {tx('បញ្ជាក់ពាក្យសម្ងាត់ម្តងទៀត *', 'Confirm Password *')}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showRegPass ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none text-sm"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>

              {regPassword.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex gap-1">
                    {[1, 2, 3, 4].map((lvl) => (
                      <div
                        key={lvl}
                        className={`h-1.5 flex-1 rounded-full transition ${
                          passwordScore >= lvl
                            ? passwordScore <= 1
                              ? 'bg-rose-500'
                              : passwordScore === 2
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                            : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">
                    {passwordScore <= 1
                      ? tx('ខ្សោយ', 'Weak')
                      : passwordScore === 2
                      ? tx('មធ្យម', 'Fair')
                      : tx('រឹងមាំ', 'Strong')}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition disabled:opacity-60"
              >
                <span>
                  {submitting
                    ? tx('កំពុងបង្កើតគណនីពិត...', 'Creating real account...')
                    : isFirstSetup
                    ? tx('បង្កើតគណនីម្ចាស់សាលា និងចូលប្រព័ន្ធ', 'Complete Setup & Enter Dashboard')
                    : tx('ចុះឈ្មោះ និងចូលប្រើប្រាស់ឥឡូវនេះ', 'Register & Sign In')}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        <div className="text-center text-xs text-slate-400">
          © 2026 {tx(snapshot.settings.schoolNameKh, snapshot.settings.schoolNameEn)} · Production Edition
        </div>
      </div>
    </div>
  );
};
