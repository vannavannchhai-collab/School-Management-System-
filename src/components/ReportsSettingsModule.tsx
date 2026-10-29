import React, { useRef, useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Upload,
  RotateCcw,
  Settings,
  Save,
  Shield,
  QrCode,
  Trophy,
  Wallet,
  CheckSquare,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dataEngine } from '../services/dataEngine';
import {
  displayClassName,
  displayStudentName,
  exportCsvUTF8,
  PERIOD_OPTIONS,
} from '../utils/academic';

export const ReportsSettingsModule: React.FC<{ mode: 'reports' | 'settings' }> = ({ mode }) => {
  const {
    snapshot,
    tx,
    lang,
    setPrintRequest,
    applyServerResult,
    notify,
  } = useApp();

  const [reportClassId, setReportClassId] = useState(snapshot.classes[0]?.id || '');
  const [reportPeriod, setReportPeriod] = useState('2026-10');
  const [reportStudentId, setReportStudentId] = useState(snapshot.students[0]?.id || '');

  React.useEffect(() => {
    if (!reportClassId && snapshot.classes.length > 0) {
      setReportClassId(snapshot.classes[0].id);
    }
  }, [snapshot.classes, reportClassId]);

  React.useEffect(() => {
    if (!reportStudentId && snapshot.students.length > 0) {
      setReportStudentId(snapshot.students[0].id);
    }
  }, [snapshot.students, reportStudentId]);

  const [settingsForm, setSettingsForm] = useState({ ...snapshot.settings });
  React.useEffect(() => {
    setSettingsForm({ ...snapshot.settings });
  }, [snapshot.settings]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const exportAllCsv = (kind: 'students' | 'teachers' | 'grades' | 'attendance' | 'finance' | 'library') => {
    const today = new Date().toISOString().slice(0, 10);
    if (kind === 'students') {
      exportCsvUTF8(
        `students_${today}.csv`,
        ['Code', 'MoEYS ID', 'Name (KH)', 'Name (EN)', 'Gender', 'DOB', 'Class', 'Guardian', 'Phone', 'Scholarship %'],
        snapshot.students.map((s) => [
          s.studentCode,
          s.moeysId,
          s.nameKh,
          s.nameEn,
          s.gender,
          s.dob,
          snapshot.classes.find((c) => c.id === s.classId)?.nameEn || '',
          s.guardianName,
          s.guardianPhone || s.phone,
          s.scholarshipPct,
        ])
      );
    } else if (kind === 'teachers') {
      exportCsvUTF8(
        `teachers_${today}.csv`,
        ['Employee Code', 'Name (KH)', 'Name (EN)', 'Role', 'Department', 'Phone', 'Base Salary ($)'],
        snapshot.teachers.map((t) => [
          t.teacherCode,
          t.nameKh,
          t.nameEn,
          t.roleTitleEn,
          t.department,
          t.phone,
          t.baseSalary,
        ])
      );
    } else if (kind === 'grades') {
      exportCsvUTF8(
        `grades_${today}.csv`,
        ['Student', 'Class', 'Subject', 'Period', 'Score', 'Max'],
        snapshot.grades.map((g) => {
          const st = snapshot.students.find((s) => s.id === g.studentId);
          return [
            st?.nameKh || g.studentId,
            g.classId,
            g.subjectName || g.subjectId,
            g.periodCode,
            g.score,
            g.maxScore,
          ];
        })
      );
    } else if (kind === 'attendance') {
      exportCsvUTF8(
        `attendance_${today}.csv`,
        ['Date', 'Student', 'Class', 'Status', 'Check-in', 'Remarks'],
        snapshot.attendance.map((a) => {
          const st = snapshot.students.find((s) => s.id === a.studentId);
          return [a.date, st?.nameKh || a.studentId, a.classId, a.status, a.checkInTime, a.remarks];
        })
      );
    } else if (kind === 'finance') {
      exportCsvUTF8(
        `invoices_${today}.csv`,
        ['Invoice No', 'Student', 'Title', 'Subtotal', 'Discount', 'Net Total', 'Paid', 'Status'],
        snapshot.invoices.map((i) => {
          const st = snapshot.students.find((s) => s.id === i.studentId);
          return [
            i.invoiceNo,
            st?.nameKh || i.studentId,
            i.title,
            i.subtotal,
            i.discountAmount,
            i.totalAmount,
            i.paidAmount,
            i.status,
          ];
        })
      );
    } else if (kind === 'library') {
      exportCsvUTF8(
        `library_books_${today}.csv`,
        ['Code', 'Title (KH)', 'Title (EN)', 'Author', 'Category', 'Shelf', 'Available', 'Total'],
        snapshot.libraryBooks.map((b) => [
          b.bookCode,
          b.titleKh,
          b.titleEn,
          b.author,
          b.category,
          b.shelf,
          b.availableCopies,
          b.totalCopies,
        ])
      );
    }
    notify(tx('បានទាញយកឯកសារ CSV (គាំទ្រអក្សរខ្មែរក្នុង Excel)!', 'UTF-8 Excel CSV downloaded!'));
  };

  const handleDownloadJsonBackup = () => {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `school_erp_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 300);
    notify(tx('បាននាំចេញឯកសារបម្រុងទុក JSON រួចរាល់!', 'Full JSON backup exported!'));
  };

  const handleImportJsonBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || ''));
        if (!Array.isArray(parsed.students) || !Array.isArray(parsed.classes)) {
          notify(tx('ទម្រង់ឯកសារ JSON មិនត្រឹមត្រូវទេ!', 'Invalid backup JSON file!'));
          return;
        }
        await applyServerResult(
          dataEngine.importBackup(parsed),
          tx('នាំចូលទិន្នន័យបម្រុងទុកទាំងអស់ជោគជ័យ!', 'Database backup restored!')
        );
      } catch {
        notify(tx('បរាជ័យក្នុងការអានឯកសារ JSON', 'Failed to parse JSON file'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (mode === 'reports') {
    const rosterOfSelected = snapshot.students.filter((s) => s.classId === reportClassId);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            {tx('មជ្ឈមណ្ឌលរបាយការណ៍ផ្លូវការ បោះពុម្ព PDF និងនាំចេញ Excel', 'Official A4 Print Studio & Data Exports')}
          </h1>
          <p className="text-sm text-slate-500">
            {tx(
              'ទម្រង់របាយការណ៍ផ្លូវការតាមស្តង់ដារសាលារៀននៅកម្ពុជា (ព្រះរាជាណាចក្រកម្ពុជា · ជាតិ សាសនា ព្រះមហាក្សត្រ)',
              'Official Cambodian MoEYS & private school A4 templates ready for print or Save-as-PDF'
            )}
          </p>
        </div>

        {/* Selector Filter for Printables */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              {tx('ជ្រើសរើសថ្នាក់រៀន (Target Class)', 'Select Class')}
            </label>
            <select
              value={reportClassId}
              onChange={(e) => {
                const cid = e.target.value;
                setReportClassId(cid);
                const firstStu = snapshot.students.find((s) => s.classId === cid);
                if (firstStu) setReportStudentId(firstStu.id);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold"
            >
              {snapshot.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {displayClassName(c, lang)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              {tx('ជ្រើសរើសខែ / ឆមាស (Period)', 'Select Period')}
            </label>
            <select
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold"
            >
              {PERIOD_OPTIONS.map((p) => (
                <option key={p.code} value={p.code}>
                  {tx(p.labelKh, p.labelEn)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              {tx('ជ្រើសរើសសិស្សម្នាក់ៗ (Individual Student)', 'Select Student')}
            </label>
            <select
              value={reportStudentId}
              onChange={(e) => setReportStudentId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold"
            >
              {(rosterOfSelected.length ? rosterOfSelected : snapshot.students).map((s) => (
                <option key={s.id} value={s.id}>
                  {displayStudentName(s, lang)} ({s.studentCode})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 6 Official Printable A4 Studio Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[
            {
              titleKh: 'តារាងពិន្ទុ និងចំណាត់ថ្នាក់រួមប្រចាំថ្នាក់',
              titleEn: 'Class Master Score & Rank Sheet',
              descKh: 'បង្ហាញពិន្ទុគ្រប់មុខវិជ្ជា ពិន្ទុសរុប មធ្យមភាគ ចំណាត់ថ្នាក់ និងនិទ្ទេស A–F សម្រាប់បិទផ្សាយ',
              descEn: 'Full subject matrix, totals, averages, ranks, and MoEYS A–F grades with signature block',
              icon: <FileSpreadsheet className="w-6 h-6 text-blue-600" />,
              action: () =>
                setPrintRequest({
                  type: 'class_master_sheet',
                  classId: reportClassId,
                  periodCode: reportPeriod,
                }),
            },
            {
              titleKh: 'សៀវភៅតាមដានការសិក្សាសិស្សម្នាក់ៗ',
              titleEn: 'Official Student Report Card',
              descKh: 'ព្រឹត្តិបត្រពិន្ទុផ្លូវការសម្រាប់សិស្សម្នាក់ៗ រួមមានវត្តមាន និទ្ទេស និងមតិគ្រូបន្ទុកថ្នាក់',
              descEn: 'Individual transcript with attendance summary, subject remarks & parent signature',
              icon: <Printer className="w-6 h-6 text-indigo-600" />,
              action: () =>
                setPrintRequest({
                  type: 'student_report_card',
                  studentId: reportStudentId,
                  periodCode: reportPeriod,
                }),
            },
            {
              titleKh: 'តារាងកិត្តិយសសិស្សពូកែប្រចាំថ្នាក់ (Top 5)',
              titleEn: 'Class Top 5 Honor Roll Poster',
              descKh: 'ផ្ទាំងកិត្តិយស A4 សម្រាប់សិស្សជាប់ចំណាត់ថ្នាក់លេខ ១ ដល់ លេខ ៥ ក្នុងថ្នាក់',
              descEn: 'Ceremonial A4 Honor Roll showcase recognizing top 5 scholars of the class',
              icon: <Trophy className="w-6 h-6 text-amber-500" />,
              action: () =>
                setPrintRequest({
                  type: 'honor_roll',
                  classId: reportClassId,
                  periodCode: reportPeriod,
                }),
            },
            {
              titleKh: 'ប័ណ្ណសម្គាល់ខ្លួនសិស្សទាំងអស់ក្នុងថ្នាក់ (QR IDs)',
              titleEn: 'Batch Printable Student QR ID Cards',
              descKh: 'បោះពុម្ពកាតសិស្សមានកូដ QR សម្រាប់សិស្សទាំងអស់ក្នុងថ្នាក់ជ្រើសរើសលើក្រដាស A4',
              descEn: 'Batch printable PVC/A4 student identification cards with verification QR codes',
              icon: <QrCode className="w-6 h-6 text-purple-600" />,
              action: () =>
                setPrintRequest({
                  type: 'student_id_cards',
                  studentIds: rosterOfSelected.map((s) => s.id),
                }),
            },
            {
              titleKh: 'របាយការណ៍ហិរញ្ញវត្ថុ ចំណូល-ចំណាយសាលា',
              titleEn: 'School Financial & Arrears Statement',
              descKh: 'របាយការណ៍សង្ខេបចំណូលថ្លៃសិក្សា បំណុលមិនទាន់បង់ ចំណាយប្រតិបត្តិការ និងប្រាក់ខែ',
              descEn: 'Executive accounting report of tuition revenue, unpaid balances, payroll & expenses',
              icon: <Wallet className="w-6 h-6 text-emerald-600" />,
              action: () => setPrintRequest({ type: 'finance_statement' }),
            },
            {
              titleKh: 'របាយការណ៍វត្តមានសិស្សប្រចាំថ្នាក់',
              titleEn: 'Class Attendance Summary Sheet',
              descKh: 'បូកសរុបចំនួនថ្ងៃវត្តមាន អវត្តមាន មកយឺត ច្បាប់ និងអត្រាវត្តមានសិស្សក្នុងថ្នាក់',
              descEn: 'Complete attendance tally and percentage rate per student in selected class',
              icon: <CheckSquare className="w-6 h-6 text-cyan-600" />,
              action: () =>
                setPrintRequest({ type: 'attendance_sheet', classId: reportClassId }),
            },
          ].map((card, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  {card.icon}
                </div>
                <h3 className="text-base font-extrabold">{tx(card.titleKh, card.titleEn)}</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {tx(card.descKh, card.descEn)}
                </p>
              </div>
              <button
                type="button"
                onClick={card.action}
                className="mt-5 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition"
              >
                <Printer className="w-4 h-4" />
                {tx('បើកមើល និងបោះពុម្ព PDF', 'Preview & Print A4 PDF')}
              </button>
            </div>
          ))}
        </div>

        {/* Excel / CSV Exports */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800">
          <h3 className="text-base font-extrabold mb-1">
            {tx('ទាញយកទិន្នន័យជា Excel / CSV (គាំទ្រអក្សរខ្មែរ UTF-8)', 'Export Spreadsheets (Excel UTF-8 CSV)')}
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            {tx(
              'ឯកសារទាំងអស់មានភ្ជាប់កូដ UTF-8 BOM ដើម្បីបើកក្នុង Microsoft Excel បង្ហាញអក្សរខ្មែរបានច្បាស់ ១០០%',
              'Encoded with UTF-8 BOM so Khmer script opens cleanly in Microsoft Excel & Google Sheets'
            )}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {(
              [
                ['students', 'បញ្ជីសិស្ស', 'Students CSV'],
                ['teachers', 'គ្រូ & បុគ្គលិក', 'Staff CSV'],
                ['grades', 'តារាងពិន្ទុ', 'Grades CSV'],
                ['attendance', 'វត្តមានសិស្ស', 'Attendance CSV'],
                ['finance', 'វិក្កយបត្រហិរញ្ញវត្ថុ', 'Finance CSV'],
                ['library', 'សៀវភៅបណ្ណាល័យ', 'Library CSV'],
              ] as const
            ).map(([k, kh, en]) => (
              <button
                key={k}
                type="button"
                onClick={() => exportAllCsv(k)}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200 dark:border-slate-700 text-xs font-bold flex flex-col items-center gap-2 transition"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>{tx(kh, en)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---------------- SETTINGS & BACKUP VIEW ----------------
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          {tx('ការកំណត់ព័ត៌មានសាលា ការបម្រុងទុកទិន្នន័យ និងកំណត់ហេតុប្រព័ន្ធ', 'System Configuration, Backup & Audit Trail')}
        </h1>
        <p className="text-sm text-slate-500">
          {tx(
            'កែសម្រួលឈ្មោះសាលា អត្រាប្តូរប្រាក់ ឆ្នាំសិក្សា បម្រុងទុកទិន្នន័យ JSON និងពិនិត្យសកម្មភាពអ្នកប្រើប្រាស់',
            'Customize school identity, exchange rate, full JSON database backup/restore, and security audit logs'
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* School Profile Settings Form */}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await applyServerResult(
              dataEngine.updateSettings(settingsForm),
              tx('រក្សាទុកការកំណត់សាលាជោគជ័យ!', 'School settings updated!')
            );
          }}
          className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4"
        >
          <h2 className="text-base font-extrabold">
            {tx('ព័ត៌មានអត្តសញ្ញាណសាលារៀន (បង្ហាញលើក្បាលរបាយការណ៍ផ្លូវការ)', 'School Identity & Official Report Header')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                {tx('ឈ្មោះសាលា (អក្សរខ្មែរ)', 'School Name (Khmer)')}
              </label>
              <input
                value={settingsForm.schoolNameKh}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, schoolNameKh: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                {tx('ឈ្មោះសាលា (English)', 'School Name (English)')}
              </label>
              <input
                value={settingsForm.schoolNameEn}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, schoolNameEn: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                {tx('មន្ទីរអប់រំ / ស្ថាប័នចំណុះ', 'Ministry / Provincial Dept (Khmer)')}
              </label>
              <input
                value={settingsForm.ministryHeaderKh}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, ministryHeaderKh: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                {tx('ឈ្មោះនាយកសាលា (សម្រាប់ហត្ថលេខា)', 'Principal Name (Khmer)')}
              </label>
              <input
                value={settingsForm.principalNameKh}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, principalNameKh: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                {tx('ឆ្នាំសិក្សាបច្ចុប្បន្ន', 'Current Academic Year')}
              </label>
              <input
                value={settingsForm.academicYear}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, academicYear: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                {tx('អត្រាប្តូរប្រាក់ ១ ដុល្លារ (៛)', 'Exchange Rate ($1 -> KHR)')}
              </label>
              <input
                type="number"
                value={settingsForm.exchangeRate}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, exchangeRate: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                {tx('លេខទូរស័ព្ទសាលា', 'School Phone')}
              </label>
              <input
                value={settingsForm.phone}
                onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                {tx('បាវចនាសាលា', 'School Motto')}
              </label>
              <input
                value={settingsForm.mottoKh}
                onChange={(e) => setSettingsForm({ ...settingsForm, mottoKh: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              {tx('អាសយដ្ឋានសាលា', 'Campus Address')}
            </label>
            <input
              value={settingsForm.addressKh}
              onChange={(e) => setSettingsForm({ ...settingsForm, addressKh: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow"
          >
            <Save className="w-4 h-4" />
            {tx('រក្សាទុកការកំណត់សាលា', 'Save Configuration')}
          </button>
        </form>

        {/* Backup, Restore & Reset */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <h2 className="text-base font-extrabold">
              {tx('ការបម្រុងទុក និងស្តារទិន្នន័យប្រព័ន្ធ (Database Backup)', 'Database Backup & Recovery')}
            </h2>
            <p className="text-xs text-slate-500">
              {tx(
                'ទាញយកទិន្នន័យទាំងអស់ក្នុង SQLite និង Local Cache ជាឯកសារ JSON ដើម្បីរក្សាទុក ឬផ្ទេរទៅកុំព្យូទ័រផ្សេង។',
                'Export or restore the entire relational school database snapshot as a portable JSON file.'
              )}
            </p>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleDownloadJsonBackup}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                {tx('នាំចេញទិន្នន័យបម្រុងទុកទាំងមូល (.JSON)', 'Export Full Backup (.JSON)')}
              </button>

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {tx('នាំចូលទិន្នន័យពីឯកសារបម្រុងទុក (.JSON)', 'Restore Backup from .JSON')}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportJsonBackup}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      tx(
                        'តើអ្នកពិតជាចង់សម្អាតទិន្នន័យប្រតិបត្តិការសិស្ស/ថ្នាក់/វិក្កយបត្រទាំងអស់មែនទេ? (គណនីពិត និងការកំណត់សាលានឹងត្រូវរក្សាទុក)',
                        'Clear all operational school records? (Your real user accounts and school settings will be preserved)'
                      )
                    )
                  ) {
                    applyServerResult(
                      dataEngine.clearOperationalRecords(),
                      tx('បានសម្អាតទិន្នន័យប្រតិបត្តិការរួចរាល់ (គណនីពិតនៅដដែល)!', 'Operational records cleared (real accounts preserved)!')
                    );
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                {tx('សម្អាតទិន្នន័យប្រតិបត្តិការសាលា (រក្សាគណនីពិត)', 'Clear Operational Records (Keep Real Accounts)')}
              </button>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800">
            <h3 className="text-sm font-extrabold flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-blue-600" />
              {tx('កំណត់ហេតុសកម្មភាពប្រព័ន្ធ (Audit Logs)', 'Recent Security & Activity Logs')}
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {snapshot.auditLogs.slice(0, 12).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs"
                >
                  <div className="flex justify-between font-bold">
                    <span>{log.action}</span>
                    <span className="text-[10px] text-slate-400">{log.createdAt}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {log.userName} ({log.module}) — {log.details}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
