import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginScreen } from './components/LoginScreen';
import { Layout } from './components/Layout';
import { DashboardModule } from './components/DashboardModule';
import { StudentsModule } from './components/StudentsModule';
import { AcademicModule } from './components/AcademicModule';
import { TeachersHRModule } from './components/TeachersHRModule';
import { TimetableModule } from './components/TimetableModule';
import { AttendanceModule } from './components/AttendanceModule';
import { GradesExamsModule } from './components/GradesExamsModule';
import { AssignmentsBehaviorModule } from './components/AssignmentsBehaviorModule';
import { FinanceModule } from './components/FinanceModule';
import { LibraryModule } from './components/LibraryModule';
import { AnnouncementsModule } from './components/AnnouncementsModule';
import { ReportsSettingsModule } from './components/ReportsSettingsModule';
import { PrintModal } from './components/PrintModal';

const AppInner: React.FC = () => {
  const { user, activeModule, toastMessage, loading } = useApp();

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-sm font-bold">កំពុងដំណើរការប្រព័ន្ធសាលារៀន... / Initializing School ERP...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {!user ? (
        <LoginScreen />
      ) : (
        <Layout>
          {activeModule === 'dashboard' && <DashboardModule />}
          {activeModule === 'students' && <StudentsModule />}
          {activeModule === 'academic' && <AcademicModule />}
          {activeModule === 'teachers' && <TeachersHRModule />}
          {activeModule === 'timetable' && <TimetableModule />}
          {activeModule === 'attendance' && <AttendanceModule />}
          {activeModule === 'grades' && <GradesExamsModule />}
          {activeModule === 'assignments' && <AssignmentsBehaviorModule />}
          {activeModule === 'finance' && <FinanceModule />}
          {activeModule === 'library' && <LibraryModule />}
          {activeModule === 'announcements' && <AnnouncementsModule />}
          {activeModule === 'reports' && <ReportsSettingsModule mode="reports" />}
          {activeModule === 'settings' && <ReportsSettingsModule mode="settings" />}
        </Layout>
      )}

      <PrintModal />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] bg-slate-900 dark:bg-blue-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-white flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
};

export const App: React.FC = () => (
  <AppProvider>
    <AppInner />
  </AppProvider>
);

export default App;
