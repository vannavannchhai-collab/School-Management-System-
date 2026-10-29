import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  DatabaseSnapshot,
  Lang,
  ModuleId,
  PrintDocRequest,
  UserAccount,
  UserRole,
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
  loginWithCredentials: (params: { username?: string; password?: string; demoRole?: UserRole }) => Promise<void>;
  switchDemoRole: (role: UserRole) => Promise<void>;
  logout: () => void;
  refreshData: () => Promise<void>;
  applyServerResult: (promise: Promise<{ snapshot: DatabaseSnapshot; mode: ConnectionMode }>, successMsg?: string) => Promise<boolean>;
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

  const tx = useCallback(
    (km: string, en: string) => (lang === 'km' ? km : en),
    [lang]
  );

  const notify = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 2800);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const refreshData = useCallback(async () => {
    const res = await dataEngine.bootstrap();
    setSnapshot(res.snapshot);
    setConnectionMode(res.mode);
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
    async (params: { username?: string; password?: string; demoRole?: UserRole }) => {
      const res = await dataEngine.login(params);
      setUser(res.user);
      setConnectionMode(res.mode);
      setActiveModuleState('dashboard');
      setSelectedStudentId(null);
      await refreshData();
    },
    [refreshData]
  );

  const switchDemoRole = useCallback(
    async (role: UserRole) => {
      await loginWithCredentials({ demoRole: role });
      notify(
        lang === 'km'
          ? `បានប្តូរតួនាទីទៅជា ${role.toUpperCase()} រួចរាល់`
          : `Switched portal role to ${role.toUpperCase()}`
      );
    },
    [loginWithCredentials, notify, lang]
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
        switchDemoRole,
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
