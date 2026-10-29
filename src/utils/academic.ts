import { ClassRoom, GradeRecord, Lang, Student, Subject } from '../types';

export function getMoeysGrade(pct: number | null): 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | '—' {
  if (pct === null || Number.isNaN(pct)) return '—';
  if (pct >= 90) return 'A';
  if (pct >= 80) return 'B';
  if (pct >= 70) return 'C';
  if (pct >= 60) return 'D';
  if (pct >= 50) return 'E';
  return 'F';
}

export function getMoeysGradeMention(grade: string, lang: Lang): string {
  const map: Record<string, [string, string]> = {
    A: ['ល្អប្រសើរ', 'Excellent'],
    B: ['ល្អណាស់', 'Very Good'],
    C: ['ល្អបង្គួរ', 'Good'],
    D: ['មធ្យម', 'Satisfactory'],
    E: ['គ្រប់គ្រាន់', 'Pass'],
    F: ['ខ្សោយ (ធ្លាក់)', 'Fail'],
    '—': ['មិនទាន់មាន', 'N/A'],
  };
  const pair = map[grade] || map['—'];
  return lang === 'km' ? pair[0] : pair[1];
}

export function getGradeBadgeClass(grade: string): string {
  switch (grade) {
    case 'A':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
    case 'B':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
    case 'C':
      return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800';
    case 'D':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
    case 'E':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800';
    case 'F':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800';
    default:
      return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  }
}

export interface RankedStudentResult {
  student: Student;
  scoresBySubject: Record<string, number | null>;
  totalScore: number;
  subjectCount: number;
  averagePct: number | null;
  grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | '—';
  passed: boolean | null;
  rank: number | null;
}

export function computeClassRanking(
  students: Student[],
  grades: GradeRecord[],
  subjects: Subject[],
  periodCode: string
): RankedStudentResult[] {
  const rows: RankedStudentResult[] = students.map((student) => {
    const stuGrades = grades.filter(
      (g) => g.studentId === student.id && (periodCode === 'all' || g.periodCode === periodCode)
    );
    const scoresBySubject: Record<string, number | null> = {};
    let totalScore = 0;
    let pctSum = 0;
    let count = 0;

    for (const sub of subjects) {
      const matches = stuGrades.filter((g) => g.subjectId === sub.id);
      if (matches.length > 0) {
        const avgRaw = matches.reduce((s, x) => s + x.score, 0) / matches.length;
        const maxRaw = matches[0].maxScore || sub.maxScore || 100;
        const pct = maxRaw > 0 ? (avgRaw / maxRaw) * 100 : 0;
        scoresBySubject[sub.id] = Math.round(avgRaw * 10) / 10;
        totalScore += avgRaw;
        pctSum += pct;
        count += 1;
      } else {
        scoresBySubject[sub.id] = null;
      }
    }

    const averagePct = count > 0 ? Math.round((pctSum / count) * 100) / 100 : null;
    const grade = getMoeysGrade(averagePct);
    return {
      student,
      scoresBySubject,
      totalScore: Math.round(totalScore * 10) / 10,
      subjectCount: count,
      averagePct,
      grade,
      passed: averagePct === null ? null : averagePct >= 50,
      rank: null,
    };
  });

  const sorted = [...rows].sort((a, b) => {
    const avA = a.averagePct ?? -1;
    const avB = b.averagePct ?? -1;
    return avB - avA;
  });

  let prevAvg: number | null = null;
  let currentRank = 0;
  sorted.forEach((item, index) => {
    if (item.averagePct === null) return;
    if (prevAvg === null || item.averagePct < prevAvg) {
      currentRank = index + 1;
      prevAvg = item.averagePct;
    }
    item.rank = currentRank;
  });

  return sorted;
}

export const PERIOD_OPTIONS = [
  { code: '2026-10', labelKh: 'ប្រចាំខែតុលា ២០២៦', labelEn: 'October 2026' },
  { code: '2026-09', labelKh: 'ប្រចាំខែកញ្ញា ២០២៦', labelEn: 'September 2026' },
  { code: '2026-11', labelKh: 'ប្រចាំខែវិច្ឆិកា ២០២៦', labelEn: 'November 2026' },
  { code: '2026-12', labelKh: 'ប្រចាំខែធ្នូ ២០២៦', labelEn: 'December 2026' },
  { code: 't1', labelKh: 'ឆមាសទី១ (Semester 1)', labelEn: 'Semester 1' },
  { code: 't2', labelKh: 'ឆមាសទី២ (Semester 2)', labelEn: 'Semester 2' },
  { code: 'all', labelKh: 'មធ្យមភាគសរុបរួម (Overall)', labelEn: 'Overall Cumulative' },
];

export function getPeriodLabel(code: string, lang: Lang): string {
  const found = PERIOD_OPTIONS.find((p) => p.code === code);
  if (found) return lang === 'km' ? found.labelKh : found.labelEn;
  return code;
}

export function formatUSD(amount: number): string {
  return `$${Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatKHR(usdAmount: number, rate = 4100): string {
  const khr = Math.round(Number(usdAmount || 0) * rate);
  return `${khr.toLocaleString('en-US')} ៛`;
}

export function displayStudentName(s: Student | undefined, lang: Lang): string {
  if (!s) return '—';
  return lang === 'km' ? s.nameKh || s.nameEn : s.nameEn || s.nameKh;
}

export function displayClassName(c: ClassRoom | undefined, lang: Lang): string {
  if (!c) return lang === 'km' ? 'មិនទាន់មានថ្នាក់' : 'Unassigned';
  return lang === 'km' ? c.nameKh || c.nameEn : c.nameEn || c.nameKh;
}

const AVATAR_PALETTE = [
  '#2563eb', '#059669', '#7c3aed', '#db2777', '#d97706', '#0891b2', '#4f46e5', '#dc2626',
];

export function avatarColorFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

export function initialsFor(name: string): string {
  const parts = (name || '?').trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  return (parts[0]?.slice(0, 2) || '?').toUpperCase();
}

// Deterministic crisp SVG QR matrix generator for Student ID Cards & KHQR Receipts
export function generateVisualQrSvg(payload: string, size = 120): string {
  const n = 21;
  const cells: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        cells[r0 + r][c0 + c] = isBorder || isCenter;
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, n - 7);
  drawFinder(n - 7, 0);

  let hash = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const inFinder =
        (r < 8 && c < 8) || (r < 8 && c >= n - 8) || (r >= n - 8 && c < 8);
      if (inFinder) continue;
      if (r === 6 || c === 6) {
        cells[r][c] = (r + c) % 2 === 0;
        continue;
      }
      hash = Math.imul(hash ^ (r * 37 + c * 101), 1664525) + 1013904223;
      cells[r][c] = ((hash >>> 12) & 1) === 1;
    }
  }

  const rects: string[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (cells[r][c]) {
        rects.push(`<rect x="${c + 1}" y="${r + 1}" width="1" height="1" fill="#0f172a"/>`);
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n + 2} ${n + 2}" width="${size}" height="${size}" shape-rendering="crispEdges"><rect width="${n + 2}" height="${n + 2}" fill="#ffffff"/>${rects.join('')}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function exportCsvUTF8(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const escCell = (val: unknown) => {
    const s = String(val ?? '');
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.map(escCell).join(','), ...rows.map((r) => r.map(escCell).join(','))];
  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 300);
}
