import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  DatabaseSnapshot,
  Lang,
  ModuleId,
  PrintDocRequest,
  RegisterAccountPayload,
  UserAccount,
} from '../types';
import {
  clearAuthSession,
  ConnectionMode,
  dataEngine,
  getStoredUser,
  loadLocalSnapshot,
} from '../services/dataEngine';

interface AppContextValue {
  snapshot: DatabaseSnapshot;
  loading: boolean;
  user: UserAccount | null;
  lang: Lang;
  dark: boolean;
  connectionMode: ConnectionMode;
  activeModule: ModuleId;
  selectedStudentId: string | null;
  printRequest: PrintDocRequest | null;
  toastMessage: string | null;
  tx: (km: string, en: string) => string;
  setLang: (l: Lang) => void;
  toggleDark: () => void;
  setActiveModule: (m: ModuleId) => void;
  openStudentProfile: (studentId: string) => void;
  closeStudentProfile: () => void;
  setPrintRequest: (req: PrintDocRequest | null) => void;
  notify: (msg: string) => void;
  loginWithCredentials: (params: { username: string; password: string }) => Promise<void>;
  registerAccount: (payload: RegisterAccountPayload) => Promise<void>;
  updateMyProfile: (data: Partial<UserAccount>) => Promise<boolean>;
  changeMyPassword: (params: { currentPassword: string; newPassword: string }) => Promise<boolean>;
  logout: () => void;
  refreshData: () => Promise<void>;
  applyServerResult: (
    promise: Promise<{ snapshot: DatabaseSnapshot; mode: ConnectionMode }>,
    successMsg?: string
  ) => Promise<boolean>;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [snapshot, setSnapshot] = useState<DatabaseSnapshot>(() => loadLocalSnapshot());
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<UserAccount | null>(() => getStoredUser());
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      return (localStorage.getItem('school_erp_lang') as Lang) || 'km';
    } catch {
      return 'km';
    }
  });
  const [dark, setDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem('school_erp_dark') === '1';
    } catch {
      return false;
    }
  });
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('online');
  const [activeModule, setActiveModuleState] = useState<ModuleId>('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [printRequest, setPrintRequest] = useState<PrintDocRequest | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark');
    else root.classList.remove('dark');
    try {
      localStorage.setItem('school_erp_dark', dark ? '1' : '0');
    } catch {
      // ignore
    }
  }, [dark]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem('school_erp_lang', l);
    } catch {
      // ignore
    }
  }, []);

  const toggleDark = useCallback(() => setDark((d) => !d), []);

  const tx = useCallback((km: string, en: string) => (lang === 'km' ? km : en), [lang]);

  const notify = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const refreshData = useCallback(async () => {
    const res = await dataEngine.bootstrap();
    setSnapshot(res.snapshot);
    setConnectionMode(res.mode);
    setUser(res.validatedUser);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const setActiveModule = useCallback((m: ModuleId) => {
    setSelectedStudentId(null);
    setActiveModuleState(m);
  }, []);

  const openStudentProfile = useCallback((studentId: string) => {
    setSelectedStudentId(studentId);
    setActiveModuleState('students');
  }, []);

  const closeStudentProfile = useCallback(() => {
    setSelectedStudentId(null);
  }, []);

  const loginWithCredentials = useCallback(
    async (params: { username: string; password: string }) => {
      const res = await dataEngine.login(params);
      setUser(res.user);
      setSnapshot(res.snapshot);
      setConnectionMode(res.mode);
      setActiveModuleState('dashboard');
      setSelectedStudentId(null);
      notify(
        lang === 'km'
          ? `សូមស្វាគមន៍ការត្រឡប់មកវិញ ${res.user.nameKh}!`
          : `Welcome back, ${res.user.nameEn || res.user.username}!`
      );
    },
    [notify, lang]
  );

  const registerAccount = useCallback(
    async (payload: RegisterAccountPayload) => {
      const res = await dataEngine.register(payload);
      setUser(res.user);
      setSnapshot(res.snapshot);
      setConnectionMode(res.mode);
      setActiveModuleState('dashboard');
      setSelectedStudentId(null);
      notify(
        lang === 'km'
          ? `បង្កើតគណនីពិត @${res.user.username} ដោយជោគជ័យ!`
          : `Account @${res.user.username} created successfully!`
      );
    },
    [notify, lang]
  );

  const updateMyProfile = useCallback(
    async (data: Partial<UserAccount>): Promise<boolean> => {
      try {
        const res = await dataEngine.updateMyProfile(data);
        setUser(res.user);
        setSnapshot(res.snapshot);
        setConnectionMode(res.mode);
        notify(
          lang === 'km'
            ? 'រក្សាទុកព័ត៌មានគណនីផ្ទាល់ខ្លួនជោគជ័យ!'
            : 'Profile updated successfully!'
        );
        return true;
      } catch (err: unknown) {
        notify(err instanceof Error ? err.message : 'Update failed');
        return false;
      }
    },
    [notify, lang]
  );

  const changeMyPassword = useCallback(
    async (params: { currentPassword: string; newPassword: string }): Promise<boolean> => {
      try {
        const res = await dataEngine.changeMyPassword(params);
        setSnapshot(res.snapshot);
        setConnectionMode(res.mode);
        notify(
          lang === 'km'
            ? 'ប្តូរពាក្យសម្ងាត់ថ្មីជោគជ័យ!'
            : 'Password changed successfully!'
        );
        return true;
      } catch (err: unknown) {
        notify(err instanceof Error ? err.message : 'Password change failed');
        return false;
      }
    },
    [notify, lang]
  );

  const logout = useCallback(() => {
    clearAuthSession();
    setUser(null);
    setSelectedStudentId(null);
  }, []);

  const applyServerResult = useCallback(
    async (
      promise: Promise<{ snapshot: DatabaseSnapshot; mode: ConnectionMode }>,
      successMsg?: string
    ): Promise<boolean> => {
      try {
        const res = await promise;
        setSnapshot(res.snapshot);
        setConnectionMode(res.mode);
        // Keep current user synced if updated in snapshot
        setUser((prev) => {
          if (!prev) return null;
          return res.snapshot.users.find((u) => u.id === prev.id) || prev;
        });
        if (successMsg) notify(successMsg);
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'ប្រតិបត្តិការបរាជ័យ / Operation failed';
        notify(msg);
        return false;
      }
    },
    [notify]
  );

  return (
    <AppContext.Provider
      value={{
        snapshot,
        loading,
        user,
        lang,
        dark,
        connectionMode,
        activeModule,
        selectedStudentId,
        printRequest,
        toastMessage,
        tx,
        setLang,
        toggleDark,
        setActiveModule,
        openStudentProfile,
        closeStudentProfile,
        setPrintRequest,
        notify,
        loginWithCredentials,
        registerAccount,
        updateMyProfile,
        changeMyPassword,
        logout,
        refreshData,
        applyServerResult,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
