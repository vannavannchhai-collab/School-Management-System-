import React, { useRef } from 'react';
import { Printer, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  computeClassRanking,
  displayClassName,
  displayStudentName,
  formatKHR,
  formatUSD,
  generateVisualQrSvg,
  getMoeysGrade,
  getMoeysGradeMention,
  getPeriodLabel,
} from '../utils/academic';

export const PrintModal: React.FC = () => {
  const { printRequest, setPrintRequest, snapshot, lang, tx } = useApp();
  const paperRef = useRef<HTMLDivElement | null>(null);

  if (!printRequest) return null;

  const triggerBrowserPrint = () => {
    let printRoot = document.getElementById('erp-print-container');
    if (!printRoot) {
      printRoot = document.createElement('div');
      printRoot.id = 'erp-print-container';
      document.body.appendChild(printRoot);
    }
    if (paperRef.current) {
      printRoot.innerHTML = paperRef.current.innerHTML;
    }
    window.print();
  };

  const s = snapshot.settings;
  const todayStr = new Date().toLocaleDateString('km-KH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const RoyalHeader = ({ docTitleKh, docSubEn }: { docTitleKh: string; docSubEn: string }) => (
    <div className="mb-5 text-black">
      <div className="flex justify-between items-start gap-4">
        <div className="text-xs leading-relaxed">
          <div className="font-bold">{s.ministryHeaderKh}</div>
          <div className="font-extrabold text-blue-900">{s.schoolNameKh}</div>
          <div className="text-[11px] text-slate-600">{s.schoolNameEn}</div>
          <div className="text-[10px] text-slate-500">ទូរស័ព្ទ៖ {s.phone}</div>
        </div>
        <div className="text-center">
          <div className="font-moul text-sm">ព្រះរាជាណាចក្រកម្ពុជា</div>
          <div className="font-moul text-xs mt-0.5">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
          <div className="text-xs tracking-widest text-slate-400 mt-0.5">✦ ✦ ✦</div>
        </div>
      </div>
      <div className="text-center mt-4 pb-3 border-b-2 border-slate-900">
        <h1 className="font-moul text-lg text-slate-900">{docTitleKh}</h1>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mt-0.5">
          {docSubEn} · ឆ្នាំសិក្សា {s.academicYear}
        </div>
      </div>
    </div>
  );

  const SignatureFooter = ({ rightLabel = 'គ្រូបន្ទុកថ្នាក់ / Homeroom Teacher', rightName = '' }) => (
    <div className="mt-8 grid grid-cols-2 gap-8 text-center text-xs text-black pt-4">
      <div>
        <div className="mb-1">បានឃើញ និងឯកភាព</div>
        <div className="font-moul text-xs">នាយកសាលា</div>
        <div className="h-14" />
        <div className="font-bold">{s.principalNameKh}</div>
      </div>
      <div>
        <div className="mb-1">ធ្វើនៅសៀមរាប, ថ្ងៃទី {todayStr}</div>
        <div className="font-bold">{rightLabel}</div>
        <div className="h-14" />
        <div className="font-bold">{rightName}</div>
      </div>
    </div>
  );

  const renderPaperBody = () => {
    // 1. STUDENT REPORT CARD
    if (printRequest.type === 'student_report_card') {
      const stu = snapshot.students.find((x) => x.id === printRequest.studentId);
      if (!stu) return null;
      const cls = snapshot.classes.find((c) => c.id === stu.classId);
      const homeroom = snapshot.teachers.find((t) => t.id === cls?.homeroomTeacherId);
      const peers = snapshot.students.filter((x) => x.classId === stu.classId);
      const subs = snapshot.subjects.filter((sub) =>
        snapshot.grades.some((g) => g.studentId === stu.id && g.subjectId === sub.id)
      );
      const ranked = computeClassRanking(peers, snapshot.grades, subs, printRequest.periodCode);
      const meRow = ranked.find((r) => r.student.id === stu.id);
      const stuAtt = snapshot.attendance.filter((a) => a.studentId === stu.id);
      const attP = stuAtt.filter((a) => a.status === 'present').length;
      const attA = stuAtt.filter((a) => a.status === 'absent').length;
      const attL = stuAtt.filter((a) => a.status === 'late').length;

      return (
        <div>
          <RoyalHeader
            docTitleKh="សៀវភៅតាមដានការសិក្សា និងព្រឹត្តិបត្រពិន្ទុ"
            docSubEn={`OFFICIAL STUDENT REPORT CARD (${getPeriodLabel(printRequest.periodCode, 'en')})`}
          />

          <div className="grid grid-cols-2 gap-3 text-xs border border-slate-300 rounded-lg p-3 mb-4 bg-slate-50">
            <div>
              <div>
                គោត្តនាម និងនាម៖ <b className="text-sm">{stu.nameKh}</b> ({stu.nameEn})
              </div>
              <div>អត្តលេខសិស្ស៖ <b>{stu.studentCode}</b> · MoEYS: {stu.moeysId}</div>
              <div>ថ្ងៃខែឆ្នាំកំណើត៖ {stu.dob} · ភេទ៖ {stu.gender === 'F' ? 'ស្រី' : 'ប្រុស'}</div>
            </div>
            <div>
              <div>ថ្នាក់រៀន៖ <b>{cls?.nameKh} ({cls?.nameEn})</b></div>
              <div>អាណាព្យាបាល៖ {stu.guardianName} ({stu.guardianPhone})</div>
              <div>វត្តមាន៖ វត្តមាន <b>{attP}</b> · អវត្តមាន <b>{attA}</b> · យឺត <b>{attL}</b></div>
            </div>
          </div>

          <table className="w-full border-collapse text-xs mb-4">
            <thead>
              <tr className="bg-slate-200">
                <th className="border border-slate-400 p-2 text-center w-10">ល.រ</th>
                <th className="border border-slate-400 p-2 text-left">មុខវិជ្ជា (Subject)</th>
                <th className="border border-slate-400 p-2 text-center">ពិន្ទុទទួលបាន</th>
                <th className="border border-slate-400 p-2 text-center">ពិន្ទុអតិបរមា</th>
                <th className="border border-slate-400 p-2 text-center">និទ្ទេស</th>
                <th className="border border-slate-400 p-2 text-left">និទ្ទេសន័យ / មតិ</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((sub, i) => {
                const sc = meRow?.scoresBySubject[sub.id] ?? null;
                const g = getMoeysGrade(sc);
                return (
                  <tr key={sub.id}>
                    <td className="border border-slate-400 p-1.5 text-center">{i + 1}</td>
                    <td className="border border-slate-400 p-1.5 font-bold">
                      {sub.nameKh} <span className="font-normal text-slate-600">({sub.nameEn})</span>
                    </td>
                    <td className="border border-slate-400 p-1.5 text-center font-extrabold">
                      {sc ?? '—'}
                    </td>
                    <td className="border border-slate-400 p-1.5 text-center">{sub.maxScore}</td>
                    <td className="border border-slate-400 p-1.5 text-center font-bold">{g}</td>
                    <td className="border border-slate-400 p-1.5">
                      {getMoeysGradeMention(g, 'km')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="grid grid-cols-4 gap-3 text-center border-2 border-slate-800 rounded-lg p-3 text-xs">
            <div>
              ពិន្ទុសរុប (Total)<br />
              <b className="text-base">{meRow?.totalScore ?? '—'}</b>
            </div>
            <div>
              មធ្យមភាគ (Average)<br />
              <b className="text-base text-blue-800">
                {meRow?.averagePct ? `${meRow.averagePct.toFixed(2)}%` : '—'}
              </b>
            </div>
            <div>
              ចំណាត់ថ្នាក់ (Rank)<br />
              <b className="text-base">
                {meRow?.rank ? `#${meRow.rank} / ${peers.length}` : '—'}
              </b>
            </div>
            <div>
              និទ្ទេសរួម (Grade)<br />
              <b className="text-base">{meRow?.grade} ({meRow?.passed ? 'ជាប់' : 'ធ្លាក់'})</b>
            </div>
          </div>

          <SignatureFooter rightName={homeroom?.nameKh || ''} />
        </div>
      );
    }

    // 2. CLASS MASTER SCORE SHEET
    if (printRequest.type === 'class_master_sheet') {
      const cls = snapshot.classes.find((c) => c.id === printRequest.classId);
      const homeroom = snapshot.teachers.find((t) => t.id === cls?.homeroomTeacherId);
      const roster = snapshot.students.filter((st) => st.classId === printRequest.classId);
      const subs = snapshot.subjects.filter((sub) =>
        snapshot.grades.some(
          (g) => roster.some((r) => r.id === g.studentId) && g.subjectId === sub.id
        )
      );
      const ranked = computeClassRanking(roster, snapshot.grades, subs, printRequest.periodCode);

      return (
        <div>
          <RoyalHeader
            docTitleKh={`តារាងពិន្ទុ និងចំណាត់ថ្នាក់រួម — ${cls?.nameKh || ''}`}
            docSubEn={`CLASS MASTER SCORE SHEET · ${getPeriodLabel(printRequest.periodCode, 'en')}`}
          />
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="bg-slate-200">
                <th className="border border-slate-400 p-1 text-center">#</th>
                <th className="border border-slate-400 p-1 text-left">គោត្តនាម និងនាម</th>
                <th className="border border-slate-400 p-1 text-center">ភេទ</th>
                {subs.map((sub) => (
                  <th key={sub.id} className="border border-slate-400 p-1 text-center">
                    {sub.code}
                  </th>
                ))}
                <th className="border border-slate-400 p-1 text-center">សរុប</th>
                <th className="border border-slate-400 p-1 text-center">មធ្យមភាគ</th>
                <th className="border border-slate-400 p-1 text-center">ចំណាត់ថ្នាក់</th>
                <th className="border border-slate-400 p-1 text-center">និទ្ទេស</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r, idx) => (
                <tr key={r.student.id}>
                  <td className="border border-slate-400 p-1 text-center">{idx + 1}</td>
                  <td className="border border-slate-400 p-1 font-bold">{r.student.nameKh}</td>
                  <td className="border border-slate-400 p-1 text-center">
                    {r.student.gender === 'F' ? 'ស' : 'ប'}
                  </td>
                  {subs.map((sub) => (
                    <td key={sub.id} className="border border-slate-400 p-1 text-center">
                      {r.scoresBySubject[sub.id] ?? '—'}
                    </td>
                  ))}
                  <td className="border border-slate-400 p-1 text-center font-bold">{r.totalScore}</td>
                  <td className="border border-slate-400 p-1 text-center font-bold">
                    {r.averagePct ? `${r.averagePct.toFixed(1)}%` : '—'}
                  </td>
                  <td className="border border-slate-400 p-1 text-center font-extrabold">
                    {r.rank ? `#${r.rank}` : '—'}
                  </td>
                  <td className="border border-slate-400 p-1 text-center font-bold">{r.grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <SignatureFooter rightName={homeroom?.nameKh || ''} />
        </div>
      );
    }

    // 3. HONOR ROLL
    if (printRequest.type === 'honor_roll') {
      const cls = snapshot.classes.find((c) => c.id === printRequest.classId);
      const homeroom = snapshot.teachers.find((t) => t.id === cls?.homeroomTeacherId);
      const roster = snapshot.students.filter((st) => st.classId === printRequest.classId);
      const ranked = computeClassRanking(
        roster,
        snapshot.grades,
        snapshot.subjects,
        printRequest.periodCode
      ).slice(0, 5);

      return (
        <div className="border-4 border-double border-amber-700 p-6 rounded-xl">
          <RoyalHeader
            docTitleKh={`តារាងកិត្តិយសសិស្សពូកែ — ${cls?.nameKh || ''}`}
            docSubEn="HONOR ROLL OF ACADEMIC EXCELLENCE"
          />
          <div className="space-y-3 my-6">
            {ranked.map((item, idx) => (
              <div
                key={item.student.id}
                className="border-2 border-amber-500 rounded-xl p-4 flex items-center justify-between bg-amber-50/40"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500 text-white font-extrabold text-lg flex items-center justify-center">
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="text-base font-extrabold">{item.student.nameKh}</div>
                    <div className="text-xs text-slate-600">
                      {item.student.nameEn} · ID: {item.student.studentCode}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-extrabold text-blue-900">
                    មធ្យមភាគ {item.averagePct?.toFixed(2)}%
                  </div>
                  <div className="text-xs font-bold text-emerald-700">
                    និទ្ទេស {item.grade} ({getMoeysGradeMention(item.grade, 'km')})
                  </div>
                </div>
              </div>
            ))}
          </div>
          <SignatureFooter rightName={homeroom?.nameKh || ''} />
        </div>
      );
    }

    // 4. STUDENT QR ID CARDS
    if (printRequest.type === 'student_id_cards') {
      const cards = snapshot.students.filter((st) =>
        printRequest.studentIds.includes(st.id)
      );
      return (
        <div>
          <h2 className="text-center font-moul text-base mb-4">
            ប័ណ្ណសម្គាល់ខ្លួនសិស្សឌីជីថល (Student QR Identification Cards)
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {cards.map((st) => {
              const cls = snapshot.classes.find((c) => c.id === st.classId);
              return (
                <div
                  key={st.id}
                  className="border-2 border-slate-800 rounded-2xl overflow-hidden bg-white text-black"
                >
                  <div className="bg-blue-900 text-white px-3 py-2 text-center">
                    <div className="text-xs font-extrabold">{s.schoolNameKh}</div>
                    <div className="text-[10px]">{s.schoolNameEn}</div>
                  </div>
                  <div className="p-3.5 flex items-center gap-3">
                    <img
                      src={generateVisualQrSvg(`${st.studentCode}|${st.nameEn}`, 80)}
                      alt="QR"
                      className="w-20 h-20 border border-slate-300 rounded-lg p-1 flex-shrink-0"
                    />
                    <div className="text-xs space-y-0.5">
                      <div className="text-sm font-extrabold">{st.nameKh}</div>
                      <div className="font-semibold text-slate-600">{st.nameEn}</div>
                      <div>ថ្នាក់៖ <b>{cls?.nameKh}</b></div>
                      <div className="font-mono font-bold text-blue-900">{st.studentCode}</div>
                      <div className="text-[10px] text-slate-500">AY {s.academicYear} · Tel: {s.phone}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // 5. OFFICIAL INVOICE RECEIPT
    if (printRequest.type === 'invoice_receipt') {
      const inv = snapshot.invoices.find((i) => i.id === printRequest.invoiceId);
      if (!inv) return null;
      const stu = snapshot.students.find((x) => x.id === inv.studentId);
      const cls = snapshot.classes.find((c) => c.id === inv.classId);
      return (
        <div>
          <RoyalHeader
            docTitleKh="បង្កាន់ដៃទទួលប្រាក់ថ្លៃសិក្សាផ្លូវការ"
            docSubEn={`OFFICIAL TUITION INVOICE & RECEIPT · ${inv.invoiceNo}`}
          />
          <div className="grid grid-cols-2 gap-4 text-xs border border-slate-300 rounded-lg p-3 mb-4">
            <div>
              <div>ឈ្មោះសិស្ស៖ <b>{stu?.nameKh} ({stu?.nameEn})</b></div>
              <div>អត្តលេខ៖ <b>{stu?.studentCode}</b></div>
              <div>ថ្នាក់រៀន៖ {cls?.nameKh}</div>
            </div>
            <div className="text-right">
              <div>លេខវិក្កយបត្រ៖ <b>{inv.invoiceNo}</b></div>
              <div>កាលបរិច្ឆេទចេញ៖ {inv.createdAt}</div>
              <div>ស្ថានភាព៖ <b className="uppercase">{inv.status}</b></div>
            </div>
          </div>

          <table className="w-full border-collapse text-xs mb-4">
            <thead>
              <tr className="bg-slate-200">
                <th className="border border-slate-400 p-2 text-left">បរិយាយ (Description)</th>
                <th className="border border-slate-400 p-2 text-right">តម្លៃដើម</th>
                <th className="border border-slate-400 p-2 text-right">អាហារូបករណ៍</th>
                <th className="border border-slate-400 p-2 text-right">សរុបត្រូវបង់</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-400 p-2 font-bold">{inv.title}</td>
                <td className="border border-slate-400 p-2 text-right">{formatUSD(inv.subtotal)}</td>
                <td className="border border-slate-400 p-2 text-right">
                  -{formatUSD(inv.discountAmount)}
                </td>
                <td className="border border-slate-400 p-2 text-right font-extrabold">
                  {formatUSD(inv.totalAmount)}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-between items-center border-2 border-slate-800 rounded-lg p-3 text-xs">
            <div>
              មធ្យោបាយបង់ប្រាក់៖ <b>{inv.paymentMethod || 'Pending'}</b>
            </div>
            <div className="text-right">
              <div>
                បានបង់រួច៖ <b className="text-sm">{formatUSD(inv.paidAmount)}</b> (
                {formatKHR(inv.paidAmount, s.exchangeRate)})
              </div>
              <div>
                នៅខ្វះ៖ <b>{formatUSD(Math.max(0, inv.totalAmount - inv.paidAmount))}</b>
              </div>
            </div>
          </div>

          <SignatureFooter rightLabel="បេឡាករ / គណនេយ្យករ (Cashier)" rightName="កញ្ញា លី សុគន្ធា" />
        </div>
      );
    }

    // 6. STAFF PAYSLIP
    if (printRequest.type === 'payslip') {
      const pr = snapshot.payrolls.find((p) => p.id === printRequest.payrollId);
      if (!pr) return null;
      const tch = snapshot.teachers.find((t) => t.id === pr.teacherId);
      return (
        <div>
          <RoyalHeader
            docTitleKh="ប័ណ្ណបើកប្រាក់បៀវត្សរ៍បុគ្គលិក"
            docSubEn={`OFFICIAL STAFF SALARY SLIP · ${pr.payrollNo}`}
          />
          <div className="grid grid-cols-2 gap-4 text-xs border border-slate-300 rounded-lg p-3 mb-4">
            <div>
              <div>ឈ្មោះបុគ្គលិក៖ <b>{tch?.nameKh} ({tch?.nameEn})</b></div>
              <div>អត្តលេខបុគ្គលិក៖ {tch?.teacherCode}</div>
              <div>តួនាទី៖ {tch?.roleTitleKh}</div>
            </div>
            <div className="text-right">
              <div>ប្រចាំខែ៖ <b>{pr.monthKey}</b></div>
              <div>ស្ថានភាព៖ <b className="uppercase">{pr.status}</b></div>
              <div>ថ្ងៃបើកប្រាក់៖ {pr.paidAt || '—'}</div>
            </div>
          </div>

          <table className="w-full border-collapse text-xs mb-4">
            <tbody>
              <tr>
                <td className="border border-slate-400 p-2">ប្រាក់បៀវត្សរ៍គោល (Base Salary)</td>
                <td className="border border-slate-400 p-2 text-right font-bold">{formatUSD(pr.baseSalary)}</td>
              </tr>
              <tr>
                <td className="border border-slate-400 p-2">ប្រាក់ឧបត្ថម្ភតួនាទី (Allowance)</td>
                <td className="border border-slate-400 p-2 text-right">+{formatUSD(pr.allowance)}</td>
              </tr>
              <tr>
                <td className="border border-slate-400 p-2">ប្រាក់រង្វាន់លើកទឹកចិត្ត (Bonus)</td>
                <td className="border border-slate-400 p-2 text-right">+{formatUSD(pr.bonus)}</td>
              </tr>
              <tr>
                <td className="border border-slate-400 p-2">ប្រាក់កាត់ផ្សេងៗ (Deductions)</td>
                <td className="border border-slate-400 p-2 text-right">-{formatUSD(pr.deduction)}</td>
              </tr>
              <tr className="bg-slate-100 font-extrabold text-sm">
                <td className="border border-slate-400 p-2">ប្រាក់បៀវត្សរ៍សុទ្ធត្រូវទទួល (Net Salary)</td>
                <td className="border border-slate-400 p-2 text-right">
                  {formatUSD(pr.netSalary)} ({formatKHR(pr.netSalary, s.exchangeRate)})
                </td>
              </tr>
            </tbody>
          </table>

          <SignatureFooter rightLabel="ហត្ថលេខាអ្នកទទួលប្រាក់" rightName={tch?.nameKh || ''} />
        </div>
      );
    }

    // 7. FINANCIAL STATEMENT
    if (printRequest.type === 'finance_statement') {
      const billed = snapshot.invoices.reduce((a, i) => a + i.totalAmount, 0);
      const collected = snapshot.invoices.reduce((a, i) => a + i.paidAmount, 0);
      const exp = snapshot.expenses.reduce((a, e) => a + e.amount, 0);
      const payroll = snapshot.payrolls
        .filter((p) => p.status === 'paid')
        .reduce((a, p) => a + p.netSalary, 0);

      return (
        <div>
          <RoyalHeader
            docTitleKh="របាយការណ៍បូកសរុបហិរញ្ញវត្ថុសាលា"
            docSubEn="EXECUTIVE FINANCIAL REVENUE & EXPENDITURE STATEMENT"
          />
          <div className="grid grid-cols-4 gap-3 text-center border border-slate-400 rounded-lg p-3 mb-5 text-xs">
            <div>ចំណូលថ្លៃសិក្សាប្រមូលបាន<br /><b className="text-sm">{formatUSD(collected)}</b></div>
            <div>បំណុលថ្លៃសិក្សានៅជំពាក់<br /><b className="text-sm">{formatUSD(billed - collected)}</b></div>
            <div>ចំណាយប្រតិបត្តិការសាលា<br /><b className="text-sm">{formatUSD(exp)}</b></div>
            <div>ប្រាក់បៀវត្សរ៍បានបើក<br /><b className="text-sm">{formatUSD(payroll)}</b></div>
          </div>

          <h3 className="font-bold text-xs mb-2">បញ្ជីសិស្សនៅជំពាក់ថ្លៃសិក្សា (Unpaid / Partial Invoices)</h3>
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-200">
                <th className="border border-slate-400 p-1.5 text-left">លេខវិក្កយបត្រ</th>
                <th className="border border-slate-400 p-1.5 text-left">សិស្ស</th>
                <th className="border border-slate-400 p-1.5 text-right">ត្រូវបង់</th>
                <th className="border border-slate-400 p-1.5 text-right">បានបង់</th>
                <th className="border border-slate-400 p-1.5 text-right">នៅខ្វះ</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.invoices
                .filter((i) => i.totalAmount > i.paidAmount)
                .map((inv) => {
                  const st = snapshot.students.find((x) => x.id === inv.studentId);
                  return (
                    <tr key={inv.id}>
                      <td className="border border-slate-400 p-1.5 font-mono">{inv.invoiceNo}</td>
                      <td className="border border-slate-400 p-1.5 font-bold">{st?.nameKh}</td>
                      <td className="border border-slate-400 p-1.5 text-right">{formatUSD(inv.totalAmount)}</td>
                      <td className="border border-slate-400 p-1.5 text-right">{formatUSD(inv.paidAmount)}</td>
                      <td className="border border-slate-400 p-1.5 text-right font-bold">
                        {formatUSD(inv.totalAmount - inv.paidAmount)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          <SignatureFooter rightLabel="ប្រធានគណនេយ្យ" rightName="កញ្ញា លី សុគន្ធា" />
        </div>
      );
    }

    // 8. ATTENDANCE SHEET
    if (printRequest.type === 'attendance_sheet') {
      const cls = snapshot.classes.find((c) => c.id === printRequest.classId);
      const homeroom = snapshot.teachers.find((t) => t.id === cls?.homeroomTeacherId);
      const roster = snapshot.students.filter((st) => st.classId === printRequest.classId);

      return (
        <div>
          <RoyalHeader
            docTitleKh={`របាយការណ៍បូកសរុបវត្តមានសិស្ស — ${cls?.nameKh || ''}`}
            docSubEn="CLASS ATTENDANCE SUMMARY REPORT"
          />
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-200">
                <th className="border border-slate-400 p-1.5 text-center">#</th>
                <th className="border border-slate-400 p-1.5 text-left">គោត្តនាម និងនាម</th>
                <th className="border border-slate-400 p-1.5 text-center">វត្តមាន (P)</th>
                <th className="border border-slate-400 p-1.5 text-center">អវត្តមាន (A)</th>
                <th className="border border-slate-400 p-1.5 text-center">មកយឺត (L)</th>
                <th className="border border-slate-400 p-1.5 text-center">ច្បាប់ (E)</th>
                <th className="border border-slate-400 p-1.5 text-center">អត្រាវត្តមាន</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((st, idx) => {
                const recs = snapshot.attendance.filter((a) => a.studentId === st.id);
                const p = recs.filter((a) => a.status === 'present').length;
                const ab = recs.filter((a) => a.status === 'absent').length;
                const l = recs.filter((a) => a.status === 'late').length;
                const ex = recs.filter((a) => a.status === 'excused').length;
                const rate = recs.length ? Math.round(((p + l) / recs.length) * 100) : 100;
                return (
                  <tr key={st.id}>
                    <td className="border border-slate-400 p-1.5 text-center">{idx + 1}</td>
                    <td className="border border-slate-400 p-1.5 font-bold">
                      {displayStudentName(st, lang)}
                    </td>
                    <td className="border border-slate-400 p-1.5 text-center">{p}</td>
                    <td className="border border-slate-400 p-1.5 text-center font-bold">{ab}</td>
                    <td className="border border-slate-400 p-1.5 text-center">{l}</td>
                    <td className="border border-slate-400 p-1.5 text-center">{ex}</td>
                    <td className="border border-slate-400 p-1.5 text-center font-extrabold">{rate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <SignatureFooter rightName={homeroom?.nameKh || ''} />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex flex-col">
      <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="text-sm font-bold">
          📄 {tx('បន្ទប់ពិនិត្យឯកសារមុនបោះពុម្ព (Official A4 Print / PDF Studio)', 'Official A4 Print / Save-as-PDF Preview')}
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={triggerBrowserPrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow"
          >
            <Printer className="w-4 h-4" />
            {tx('បោះពុម្ព / រក្សាទុក PDF', 'Print / Save PDF')}
          </button>
          <button
            type="button"
            onClick={() => setPrintRequest(null)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div
          ref={paperRef}
          className="bg-white text-black max-w-[210mm] mx-auto p-8 sm:p-10 rounded-lg shadow-2xl min-h-[260mm]"
        >
          {renderPaperBody()}
        </div>
      </div>
    </div>
  );
};
