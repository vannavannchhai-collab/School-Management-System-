import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Plus,
  Trash2,
  AlertTriangle,
  X,
  Clock,
  Settings2,
  Sparkles,
  Copy,
  Printer,
  BookOpen,
  UserPlus,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dataEngine } from '../services/dataEngine';
import { TimetableSlot } from '../types';
import { displayClassName } from '../utils/academic';

interface PeriodConfig {
  p: number;
  time: string;
  shift: 'morning' | 'afternoon' | 'evening';
}

interface TimetableSettingsConfig {
  dayCount: 5 | 6 | 7;
  showSunday?: boolean;
  periods: PeriodConfig[];
}

const TIMETABLE_CONFIG_KEY = 'school_erp_timetable_config_v1';

const ALL_DAYS = [
  { d: 1, kh: 'ថ្ងៃចន្ទ', en: 'Monday' },
  { d: 2, kh: 'ថ្ងៃអង្គារ', en: 'Tuesday' },
  { d: 3, kh: 'ថ្ងៃពុធ', en: 'Wednesday' },
  { d: 4, kh: 'ថ្ងៃព្រហស្បតិ៍', en: 'Thursday' },
  { d: 5, kh: 'ថ្ងៃសុក្រ', en: 'Friday' },
  { d: 6, kh: 'ថ្ងៃសៅរ៍', en: 'Saturday' },
  { d: 7, kh: 'ថ្ងៃអាទិត្យ', en: 'Sunday' },
];

const PRESET_MOEYS_6: PeriodConfig[] = [
  { p: 1, time: '07:00 - 08:00', shift: 'morning' },
  { p: 2, time: '08:00 - 09:00', shift: 'morning' },
  { p: 3, time: '09:15 - 10:15', shift: 'morning' },
  { p: 4, time: '10:15 - 11:15', shift: 'morning' },
  { p: 5, time: '13:30 - 14:30', shift: 'afternoon' },
  { p: 6, time: '14:30 - 15:30', shift: 'afternoon' },
];

const PRESET_PRIVATE_8: PeriodConfig[] = [
  { p: 1, time: '07:30 - 08:20', shift: 'morning' },
  { p: 2, time: '08:25 - 09:15', shift: 'morning' },
  { p: 3, time: '09:30 - 10:20', shift: 'morning' },
  { p: 4, time: '10:25 - 11:15', shift: 'morning' },
  { p: 5, time: '13:15 - 14:05', shift: 'afternoon' },
  { p: 6, time: '14:10 - 15:00', shift: 'afternoon' },
  { p: 7, time: '15:15 - 16:05', shift: 'afternoon' },
  { p: 8, time: '16:10 - 17:00', shift: 'afternoon' },
];

const PRESET_MORNING_5: PeriodConfig[] = [
  { p: 1, time: '07:00 - 07:50', shift: 'morning' },
  { p: 2, time: '07:55 - 08:45', shift: 'morning' },
  { p: 3, time: '09:00 - 09:50', shift: 'morning' },
  { p: 4, time: '09:55 - 10:45', shift: 'morning' },
  { p: 5, time: '10:50 - 11:40', shift: 'morning' },
];

function loadTimetableConfig(): TimetableSettingsConfig {
  try {
    const raw = localStorage.getItem(TIMETABLE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.periods) && parsed.periods.length > 0) {
        const dayCount: 5 | 6 | 7 =
          parsed.dayCount === 5 || parsed.dayCount === 6 || parsed.dayCount === 7
            ? parsed.dayCount
            : parsed.showSunday
            ? 7
            : 6;
        return {
          dayCount,
          showSunday: dayCount === 7,
          periods: parsed.periods,
        };
      }
    }
  } catch {
    // ignore
  }
  return {
    dayCount: 6,
    showSunday: false,
    periods: PRESET_MOEYS_6,
  };
}

function saveTimetableConfig(cfg: TimetableSettingsConfig): void {
  try {
    localStorage.setItem(
      TIMETABLE_CONFIG_KEY,
      JSON.stringify({ ...cfg, showSunday: cfg.dayCount === 7 })
    );
  } catch {
    // ignore
  }
}

export const TimetableModule: React.FC = () => {
  const {
    snapshot,
    tx,
    lang,
    user,
    applyServerResult,
    setActiveModule,
    setPrintRequest,
    notify,
  } = useApp();

  const linkedStudent =
    user?.role === 'student'
      ? snapshot.students.find((s) => s.id === user.linkedId)
      : null;

  const canEdit = user?.role === 'admin' || user?.role === 'teacher';

  const [ttConfig, setTtConfig] = useState<TimetableSettingsConfig>(() => loadTimetableConfig());
  const [periodModalOpen, setPeriodModalOpen] = useState(false);
  const [draftConfig, setDraftConfig] = useState<TimetableSettingsConfig>(() => loadTimetableConfig());

  const [viewMode, setViewMode] = useState<'class' | 'teacher'>('class');
  const [selectedClassId, setSelectedClassId] = useState(
    linkedStudent?.classId || snapshot.classes[0]?.id || ''
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState(
    user?.role === 'teacher' && user.linkedId
      ? user.linkedId
      : snapshot.teachers[0]?.id || ''
  );

  // Sync selectedClassId whenever classes list changes or gets first class added
  useEffect(() => {
    if (user?.role === 'student' && linkedStudent?.classId) {
      setSelectedClassId(linkedStudent.classId);
      return;
    }
    if (
      (!selectedClassId || !snapshot.classes.some((c) => c.id === selectedClassId)) &&
      snapshot.classes.length > 0
    ) {
      setSelectedClassId(snapshot.classes[0].id);
    }
  }, [snapshot.classes, selectedClassId, linkedStudent, user?.role]);

  useEffect(() => {
    if (
      (!selectedTeacherId || !snapshot.teachers.some((t) => t.id === selectedTeacherId)) &&
      snapshot.teachers.length > 0
    ) {
      setSelectedTeacherId(
        user?.role === 'teacher' &&
          user.linkedId &&
          snapshot.teachers.some((t) => t.id === user.linkedId)
          ? user.linkedId
          : snapshot.teachers[0].id
      );
    }
  }, [snapshot.teachers, selectedTeacherId, user]);

  // Merge configured periods with any extra periods that exist in saved timetable records
  const activePeriods = useMemo(() => {
    const map = new Map<number, PeriodConfig>();
    for (const per of ttConfig.periods) {
      map.set(per.p, { ...per });
    }
    for (const sl of snapshot.timetable) {
      if (!map.has(sl.periodIndex)) {
        map.set(sl.periodIndex, {
          p: sl.periodIndex,
          time: sl.timeRange || '',
          shift: sl.periodIndex <= 4 ? 'morning' : 'afternoon',
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.p - b.p);
  }, [ttConfig.periods, snapshot.timetable]);

  const activeDays = useMemo(() => {
    let maxDay: number = ttConfig.dayCount;
    for (const sl of snapshot.timetable) {
      if (sl.dayOfWeek > maxDay) maxDay = sl.dayOfWeek;
    }
    return ALL_DAYS.filter((d) => d.d <= maxDay);
  }, [ttConfig.dayCount, snapshot.timetable]);

  // Quick Create Class Modal (standalone or triggered from toolbar)
  const [quickClassModal, setQuickClassModal] = useState(false);
  const [quickClassForm, setQuickClassForm] = useState({
    nameKh: 'ថ្នាក់ទី ១០ "ក"',
    nameEn: 'Grade 10A',
    code: 'G10-A',
    gradeLevel: 10,
    room: 'R-101',
    shift: 'Morning & Afternoon',
    monthlyTuition: 120,
  });

  // Copy Schedule Modal
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copySourceClassId, setCopySourceClassId] = useState('');

  // Slot Editor Modal State
  const [slotModal, setSlotModal] = useState<{
    classId: string;
    dayOfWeek: number;
    periodIndex: number;
    timeRange: string;
    subjectId: string;
    teacherId: string;
    room: string;
    existingId?: string;
    // Inline quick-create toggles when school starts from 0 records
    createNewClass: boolean;
    newClassNameKh: string;
    newClassNameEn: string;
    newClassGrade: number;
    createNewSubject: boolean;
    newSubjectNameKh: string;
    newSubjectNameEn: string;
    newSubjectColor: string;
    createNewTeacher: boolean;
    newTeacherNameKh: string;
    newTeacherNameEn: string;
    newTeacherSpec: string;
  } | null>(null);

  const openSlotEditor = (day = 1, period = 1, defaultTimeRange?: string) => {
    if (!canEdit) return;

    const perCfg = activePeriods.find((x) => x.p === period) || activePeriods[0];
    const resolvedPeriod = perCfg?.p || period;
    const resolvedTime = defaultTimeRange ?? perCfg?.time ?? '07:00 - 08:00';

    const existing =
      viewMode === 'class' && selectedClassId
        ? snapshot.timetable.find(
            (t) =>
              t.classId === selectedClassId &&
              t.dayOfWeek === day &&
              t.periodIndex === resolvedPeriod
          )
        : viewMode === 'teacher' && selectedTeacherId
        ? snapshot.timetable.find(
            (t) =>
              t.teacherId === selectedTeacherId &&
              t.dayOfWeek === day &&
              t.periodIndex === resolvedPeriod
          )
        : undefined;

    const targetClassId =
      existing?.classId || selectedClassId || snapshot.classes[0]?.id || '';
    const cls = snapshot.classes.find((c) => c.id === targetClassId);

    const defaultTeacherId =
      existing !== undefined
        ? existing.teacherId
        : viewMode === 'teacher' && selectedTeacherId
        ? selectedTeacherId
        : cls?.homeroomTeacherId || snapshot.teachers[0]?.id || '';

    setSlotModal({
      classId: targetClassId,
      dayOfWeek: day,
      periodIndex: resolvedPeriod,
      timeRange: existing?.timeRange || resolvedTime,
      subjectId: existing?.subjectId || snapshot.subjects[0]?.id || '',
      teacherId: defaultTeacherId,
      room: existing?.room || cls?.room || 'R-101',
      existingId: existing?.id,
      createNewClass: snapshot.classes.length === 0,
      newClassNameKh: 'ថ្នាក់ទី ១០ "ក"',
      newClassNameEn: 'Grade 10A',
      newClassGrade: 10,
      createNewSubject: snapshot.subjects.length === 0,
      newSubjectNameKh: '',
      newSubjectNameEn: '',
      newSubjectColor: '#2563eb',
      createNewTeacher: false,
      newTeacherNameKh: '',
      newTeacherNameEn: '',
      newTeacherSpec: '',
    });
  };

  // Accurate teacher conflict check (ignores unassigned '')
  const teacherConflict = useMemo(() => {
    if (!slotModal || slotModal.createNewTeacher || !slotModal.teacherId) return null;
    const activeCid = slotModal.createNewClass ? '__new__' : slotModal.classId;
    return (
      snapshot.timetable.find(
        (t) =>
          t.id !== slotModal.existingId &&
          t.classId !== activeCid &&
          t.dayOfWeek === slotModal.dayOfWeek &&
          t.periodIndex === slotModal.periodIndex &&
          t.teacherId === slotModal.teacherId
      ) || null
    );
  }, [slotModal, snapshot.timetable]);

  // Room double-booking check (ignores empty room)
  const roomConflict = useMemo(() => {
    if (!slotModal || !slotModal.room.trim()) return null;
    const activeCid = slotModal.createNewClass ? '__new__' : slotModal.classId;
    const normRoom = slotModal.room.trim().toLowerCase();
    return (
      snapshot.timetable.find(
        (t) =>
          t.id !== slotModal.existingId &&
          t.classId !== activeCid &&
          t.dayOfWeek === slotModal.dayOfWeek &&
          t.periodIndex === slotModal.periodIndex &&
          (t.room || '').trim().toLowerCase() === normRoom
      ) || null
    );
  }, [slotModal, snapshot.timetable]);

  const handleQuickCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickClassForm.nameKh.trim() && !quickClassForm.nameEn.trim()) {
      notify(tx('សូមបញ្ចូលឈ្មោះថ្នាក់រៀន', 'Please enter class name'));
      return;
    }
    const g = Number(quickClassForm.gradeLevel || 1);
    const category =
      g <= 0
        ? 'kindergarten'
        : g <= 6
        ? 'primary'
        : g <= 9
        ? 'lower_secondary'
        : 'upper_secondary';

    try {
      const prevClassIds = new Set(snapshot.classes.map((c) => c.id));
      const res = await dataEngine.saveClass({
        code: quickClassForm.code || `G${g}-A`,
        nameKh: quickClassForm.nameKh.trim() || quickClassForm.nameEn.trim(),
        nameEn: quickClassForm.nameEn.trim() || quickClassForm.nameKh.trim(),
        gradeLevel: g,
        category,
        track: g >= 11 ? 'Science' : 'General',
        room: quickClassForm.room.trim() || 'R-101',
        shift: quickClassForm.shift,
        schedule: '07:00–16:30',
        capacity: 35,
        monthlyTuition: Number(quickClassForm.monthlyTuition || 120),
        academicYear: snapshot.settings.academicYear,
      });
      const newest =
        res.snapshot.classes.find((c) => !prevClassIds.has(c.id)) ||
        res.snapshot.classes[res.snapshot.classes.length - 1];
      await applyServerResult(
        Promise.resolve(res),
        tx('បានបង្កើតថ្នាក់រៀនថ្មីជោគជ័យ!', 'Class created successfully!')
      );
      if (newest) setSelectedClassId(newest.id);
      setQuickClassModal(false);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to create class');
    }
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotModal) return;

    try {
      let finalClassId = slotModal.classId;
      let finalSubjectId = slotModal.subjectId;
      let finalTeacherId = slotModal.teacherId;

      // 1. Auto-create Class inline if requested
      if (slotModal.createNewClass) {
        const nameKh = slotModal.newClassNameKh.trim() || slotModal.newClassNameEn.trim();
        if (!nameKh) {
          notify(tx('សូមបញ្ចូលឈ្មោះថ្នាក់រៀនថ្មី', 'Please enter a class name'));
          return;
        }
        const g = Number(slotModal.newClassGrade || 1);
        const category =
          g <= 0
            ? 'kindergarten'
            : g <= 6
            ? 'primary'
            : g <= 9
            ? 'lower_secondary'
            : 'upper_secondary';
        const prevClassIds = new Set(snapshot.classes.map((c) => c.id));
        const clsRes = await dataEngine.saveClass({
          code: `G${g}-${snapshot.classes.length + 1}`,
          nameKh,
          nameEn: slotModal.newClassNameEn.trim() || nameKh,
          gradeLevel: g,
          category,
          track: g >= 11 ? 'Science' : 'General',
          room: slotModal.room.trim() || 'R-101',
          shift: 'Morning & Afternoon',
          schedule: '07:00–16:30',
          capacity: 35,
          monthlyTuition: 120,
          academicYear: snapshot.settings.academicYear,
        });
        const createdCls =
          clsRes.snapshot.classes.find((c) => !prevClassIds.has(c.id)) ||
          clsRes.snapshot.classes[clsRes.snapshot.classes.length - 1];
        if (createdCls) {
          finalClassId = createdCls.id;
          setSelectedClassId(createdCls.id);
        }
      }

      // 2. Auto-create Subject inline if requested
      if (slotModal.createNewSubject) {
        const sKh = slotModal.newSubjectNameKh.trim() || slotModal.newSubjectNameEn.trim();
        if (!sKh) {
          notify(tx('សូមបញ្ចូលឈ្មោះមុខវិជ្ជាថ្មី', 'Please enter a subject name'));
          return;
        }
        const prevSubIds = new Set(snapshot.subjects.map((s) => s.id));
        const subRes = await dataEngine.saveSubject({
          code: `SUB-${snapshot.subjects.length + 1}`,
          nameKh: sKh,
          nameEn: slotModal.newSubjectNameEn.trim() || sKh,
          category: 'general',
          maxScore: 100,
          coefficient: 1,
          color: slotModal.newSubjectColor || '#2563eb',
        });
        const createdSub =
          subRes.snapshot.subjects.find((s) => !prevSubIds.has(s.id)) ||
          subRes.snapshot.subjects[subRes.snapshot.subjects.length - 1];
        if (createdSub) finalSubjectId = createdSub.id;
      }

      // 3. Auto-create Teacher inline if requested
      if (slotModal.createNewTeacher && (slotModal.newTeacherNameKh.trim() || slotModal.newTeacherNameEn.trim())) {
        const tKh = slotModal.newTeacherNameKh.trim() || slotModal.newTeacherNameEn.trim();
        const prevTchIds = new Set(snapshot.teachers.map((t) => t.id));
        const tchRes = await dataEngine.saveTeacher({
          nameKh: tKh,
          nameEn: slotModal.newTeacherNameEn.trim() || tKh,
          specialization: slotModal.newTeacherSpec.trim() || 'ទូទៅ / General',
          roleTitleKh: 'គ្រូបង្រៀន',
          roleTitleEn: 'Faculty Teacher',
          status: 'active',
        });
        const createdTch =
          tchRes.snapshot.teachers.find((t) => !prevTchIds.has(t.id)) ||
          tchRes.snapshot.teachers[0];
        if (createdTch) finalTeacherId = createdTch.id;
      }

      if (!finalClassId || !finalSubjectId) {
        notify(
          tx(
            'សូមជ្រើសរើសថ្នាក់រៀន និងមុខវិជ្ជាជាមុនសិន',
            'Please select both a Class and a Subject'
          )
        );
        return;
      }

      const ok = await applyServerResult(
        dataEngine.saveTimetableSlot({
          classId: finalClassId,
          subjectId: finalSubjectId,
          teacherId: finalTeacherId || '',
          dayOfWeek: Number(slotModal.dayOfWeek),
          periodIndex: Number(slotModal.periodIndex),
          timeRange: slotModal.timeRange.trim(),
          room: slotModal.room.trim(),
          previousId: slotModal.existingId,
        }),
        tx('រក្សាទុកកាលវិភាគសិក្សាជោគជ័យ!', 'Timetable slot saved successfully!')
      );
      if (ok) setSlotModal(null);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save timetable slot');
    }
  };

  // Auto-generate balanced MoEYS weekly schedule for selected class
  const handleAutoGenerateSchedule = async () => {
    if (!selectedClassId) {
      setQuickClassModal(true);
      return;
    }
    if (snapshot.subjects.length === 0) {
      notify(tx('សូមបន្ថែមមុខវិជ្ជាជាមុនសិន', 'Please add subjects first'));
      return;
    }
    const existingCount = snapshot.timetable.filter((t) => t.classId === selectedClassId).length;
    if (
      existingCount > 0 &&
      !window.confirm(
        tx(
          'ថ្នាក់នេះមានម៉ោងសិក្សាខ្លះរួចហើយ។ តើអ្នកចង់រៀបកាលវិភាគស្វ័យប្រវត្តិជំនួសមែនទេ?',
          'This class already has scheduled slots. Replace with an auto-generated timetable?'
        )
      )
    ) {
      return;
    }

    const cls = snapshot.classes.find((c) => c.id === selectedClassId);
    const otherSlots = snapshot.timetable.filter((t) => t.classId !== selectedClassId);

    // Build weighted pool of subjects based on MoEYS coefficients
    const weightedPool: string[] = [];
    snapshot.subjects.forEach((sub) => {
      const weight = Math.max(1, Math.round((sub.coefficient || 1) * 2));
      for (let i = 0; i < weight; i++) weightedPool.push(sub.id);
    });

    const newSlots: Omit<TimetableSlot, 'id'>[] = [];
    let cursor = 0;

    for (const day of activeDays) {
      for (const per of activePeriods) {
        // Leave Saturday afternoon open by default if 6+ days
        if (day.d >= 6 && per.shift !== 'morning') continue;

        const subjectId = weightedPool[(cursor + day.d - 1) % weightedPool.length];
        cursor++;
        const sub = snapshot.subjects.find((s) => s.id === subjectId);

        // Pick an available teacher (prefer matching specialization, avoid conflict)
        let chosenTeacherId = '';
        if (snapshot.teachers.length > 0) {
          const busyTeacherIds = new Set(
            otherSlots
              .filter((o) => o.dayOfWeek === day.d && o.periodIndex === per.p && o.teacherId)
              .map((o) => o.teacherId)
          );
          const available = snapshot.teachers.filter(
            (t) => t.status === 'active' && !busyTeacherIds.has(t.id)
          );
          const specMatch = available.find(
            (t) =>
              sub &&
              t.specialization &&
              (t.specialization.toLowerCase().includes(sub.nameEn.toLowerCase()) ||
                t.specialization.includes(sub.nameKh))
          );
          chosenTeacherId =
            specMatch?.id ||
            available[(day.d + per.p) % Math.max(1, available.length)]?.id ||
            '';
        }

        newSlots.push({
          classId: selectedClassId,
          subjectId,
          teacherId: chosenTeacherId,
          dayOfWeek: day.d,
          periodIndex: per.p,
          timeRange: per.time,
          room: cls?.room || 'R-101',
        });
      }
    }

    await applyServerResult(
      dataEngine.saveTimetableBatch({
        classId: selectedClassId,
        replaceClass: true,
        slots: newSlots,
      }),
      tx(
        `បានរៀបចំកាលវិភាគស្វ័យប្រវត្តិចំនួន ${newSlots.length} ម៉ោងសិក្សា!`,
        `Auto-generated ${newSlots.length} weekly timetable slots!`
      )
    );
  };

  const handleCopySchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !copySourceClassId || copySourceClassId === selectedClassId) return;
    const sourceSlots = snapshot.timetable.filter((t) => t.classId === copySourceClassId);
    if (sourceSlots.length === 0) {
      notify(tx('ថ្នាក់ដែលជ្រើសរើសមិនទាន់មានកាលវិភាគទេ', 'Selected source class has no slots'));
      return;
    }
    const targetCls = snapshot.classes.find((c) => c.id === selectedClassId);
    const copied: Omit<TimetableSlot, 'id'>[] = sourceSlots.map((s) => ({
      classId: selectedClassId,
      subjectId: s.subjectId,
      teacherId: s.teacherId,
      dayOfWeek: s.dayOfWeek,
      periodIndex: s.periodIndex,
      timeRange: s.timeRange,
      room: targetCls?.room || s.room,
    }));

    const ok = await applyServerResult(
      dataEngine.saveTimetableBatch({
        classId: selectedClassId,
        replaceClass: true,
        slots: copied,
      }),
      tx('បានចម្លងកាលវិភាគជោគជ័យ!', 'Copied timetable schedule successfully!')
    );
    if (ok) setCopyModalOpen(false);
  };

  const handleClearSchedule = async () => {
    if (!selectedClassId) return;
    const cls = snapshot.classes.find((c) => c.id === selectedClassId);
    if (
      !window.confirm(
        tx(
          `តើអ្នកពិតជាចង់សម្អាតកាលវិភាគទាំងអស់របស់ "${displayClassName(cls, lang)}" មែនទេ?`,
          `Clear all timetable slots for "${displayClassName(cls, lang)}"?`
        )
      )
    ) {
      return;
    }
    await applyServerResult(
      dataEngine.clearClassTimetable(selectedClassId),
      tx('បានសម្អាតកាលវិភាគថ្នាក់រៀន', 'Cleared class timetable')
    );
  };

  const handleSavePeriodSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = draftConfig.periods
      .map((p, idx) => ({
        p: idx + 1,
        time: p.time.trim() || '07:00 - 08:00',
        shift: p.shift,
      }))
      .filter((_, idx) => idx < 12);
    if (cleaned.length === 0) return;
    const nextCfg: TimetableSettingsConfig = {
      dayCount: draftConfig.dayCount,
      showSunday: draftConfig.dayCount === 7,
      periods: cleaned,
    };
    setTtConfig(nextCfg);
    saveTimetableConfig(nextCfg);
    setPeriodModalOpen(false);
    notify(tx('បានរក្សាទុកការកំណត់ម៉ោងសិក្សា!', 'Saved period & shift settings!'));
  };

  const currentSlotsCount =
    viewMode === 'class'
      ? snapshot.timetable.filter((t) => t.classId === selectedClassId).length
      : snapshot.timetable.filter((t) => t.teacherId === selectedTeacherId).length;

  const selectedClassObj = snapshot.classes.find((c) => c.id === selectedClassId);
  const firstAfternoonIdx = activePeriods.findIndex((p) => p.shift !== 'morning');

  return (
    <div className="space-y-5">
      {/* Header & Primary Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-blue-600" />
            {tx('កាលវិភាគសិក្សាប្រចាំសប្តាហ៍', 'Weekly Academic Timetable')}
          </h1>
          <p className="text-sm text-slate-500">
            {tx(
              'ចុចលើក្រឡាម៉ោងណាមួយ ឬប៊ូតុង "+ កំណត់ម៉ោងសិក្សា" ដើម្បីរៀបចំកាលវិភាគតាមថ្នាក់ និងគ្រូបង្រៀន',
              'Click any cell in the grid or "+ Configure Slot" to set up class and teacher schedules'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {user?.role !== 'student' && (
            <div className="bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex">
              <button
                type="button"
                onClick={() => setViewMode('class')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'class'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {tx('តាមថ្នាក់រៀន', 'By Class')}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('teacher')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'teacher'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {tx('តាមគ្រូបង្រៀន', 'By Teacher')}
              </button>
            </div>
          )}

          {viewMode === 'class' && user?.role !== 'student' && (
            <div className="flex items-center gap-1.5">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-bold min-w-[175px]"
              >
                {snapshot.classes.length === 0 ? (
                  <option value="">
                    {tx('— មិនទាន់មានថ្នាក់រៀន —', '— No classes yet —')}
                  </option>
                ) : (
                  snapshot.classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {displayClassName(c, lang)} {c.room ? `(${c.room})` : ''}
                    </option>
                  ))
                )}
              </select>

              {canEdit && (
                <button
                  type="button"
                  onClick={() => setQuickClassModal(true)}
                  title={tx('បង្កើតថ្នាក់រៀនថ្មីរហ័ស', 'Quick Create Class')}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {tx('ថ្នាក់ថ្មី', 'Class')}
                </button>
              )}
            </div>
          )}

          {viewMode === 'teacher' && (
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-bold min-w-[185px]"
            >
              {snapshot.teachers.length === 0 ? (
                <option value="">
                  {tx('— មិនទាន់មានគ្រូបង្រៀន —', '— No teachers yet —')}
                </option>
              ) : (
                snapshot.teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {tx(t.nameKh, t.nameEn)}
                  </option>
                ))
              )}
            </select>
          )}

          {canEdit && (
            <button
              type="button"
              onClick={() => openSlotEditor(1, activePeriods[0]?.p || 1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              {tx('កំណត់ម៉ោងសិក្សា', 'Configure Slot')}
            </button>
          )}
        </div>
      </div>

      {/* Onboarding Banner when 0 classes exist */}
      {snapshot.classes.length === 0 && canEdit && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-gradient-to-r from-blue-50 via-indigo-50/70 to-white dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm font-extrabold text-blue-900 dark:text-blue-200 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              {tx(
                'ចាប់ផ្តើមរៀបចំកាលវិភាគសិក្សាសម្រាប់សាលារបស់អ្នក!',
                'Start configuring your school timetable!'
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {tx(
                'មិនទាន់មានថ្នាក់រៀននៅឡើយទេ។ អ្នកអាចចុច "+ បង្កើតថ្នាក់រៀនរហ័ស" ឬចុចលើក្រឡា [+] ណាមួយខាងក្រោម ដើម្បីបង្កើតថ្នាក់ និងកំណត់ម៉ោងសិក្សាភ្លាមៗក្នុងជំហានតែមួយ!',
                'No classes exist yet. Click "+ Quick Create Class" or click any [+] cell below to create a class and schedule slot in one step!'
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setQuickClassModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow"
            >
              <Plus className="w-4 h-4" />
              {tx('បង្កើតថ្នាក់រៀនរហ័ស', 'Quick Create Class')}
            </button>
            <button
              type="button"
              onClick={() => setActiveModule('academic')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              {tx('ទៅកាន់ថ្នាក់រៀន & មុខវិជ្ជា', 'Manage Classes & Subjects')}
            </button>
          </div>
        </div>
      )}

      {/* Secondary Action Bar: Summary, Period Settings, Auto-Fill, Copy, Clear, Print */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold">
            <Clock className="w-3.5 h-3.5" />
            {tx(
              `បានកំណត់ ${currentSlotsCount} ម៉ោង/សប្តាហ៍`,
              `${currentSlotsCount} periods/week scheduled`
            )}
          </span>
          {viewMode === 'class' && selectedClassObj && (
            <span className="text-slate-500 font-medium">
              {tx('ថ្នាក់៖', 'Class:')}{' '}
              <b className="text-slate-800 dark:text-slate-200">
                {displayClassName(selectedClassObj, lang)}
              </b>{' '}
              · {tx('បន្ទប់៖', 'Room:')}{' '}
              <b className="text-slate-800 dark:text-slate-200">
                {selectedClassObj.room || '—'}
              </b>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <>
              <button
                type="button"
                onClick={() => {
                  setDraftConfig(structuredClone(ttConfig));
                  setPeriodModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                <Settings2 className="w-3.5 h-3.5" />
                {tx('កំណត់ម៉ោង / វេន', 'Period Times')}
              </button>

              {viewMode === 'class' && (
                <>
                  <button
                    type="button"
                    onClick={handleAutoGenerateSchedule}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {tx('រៀបស្វ័យប្រវត្តិ', 'Auto-Fill')}
                  </button>

                  {snapshot.classes.length > 1 && selectedClassId && (
                    <button
                      type="button"
                      onClick={() => {
                        const other = snapshot.classes.find((c) => c.id !== selectedClassId);
                        setCopySourceClassId(other?.id || '');
                        setCopyModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {tx('ចម្លងពីថ្នាក់ផ្សេង', 'Copy From')}
                    </button>
                  )}

                  {currentSlotsCount > 0 && selectedClassId && (
                    <button
                      type="button"
                      onClick={handleClearSchedule}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {tx('សម្អាត', 'Clear')}
                    </button>
                  )}
                </>
              )}
            </>
          )}

          {((viewMode === 'class' && selectedClassId) ||
            (viewMode === 'teacher' && selectedTeacherId)) && (
            <button
              type="button"
              onClick={() =>
                setPrintRequest({
                  type: 'timetable_schedule',
                  mode: viewMode,
                  targetId: viewMode === 'class' ? selectedClassId : selectedTeacherId,
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold"
            >
              <Printer className="w-3.5 h-3.5" />
              {tx('បោះពុម្ព A4', 'Print A4')}
            </button>
          )}
        </div>
      </div>

      {/* Weekly Timetable Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[880px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-xs">
                <th className="py-3.5 px-3 text-left font-bold text-slate-500 w-36">
                  {tx('ម៉ោងសិក្សា', 'Time Slot')}
                </th>
                {activeDays.map((d) => (
                  <th
                    key={d.d}
                    className="py-3.5 px-3 text-center font-extrabold text-slate-700 dark:text-slate-200"
                  >
                    {tx(d.kh, d.en)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {activePeriods.map((per, idx) => (
                <React.Fragment key={per.p}>
                  {firstAfternoonIdx > 0 && idx === firstAfternoonIdx && (
                    <tr className="bg-amber-50/70 dark:bg-amber-950/20">
                      <td
                        colSpan={activeDays.length + 1}
                        className="py-2 text-center text-xs font-bold text-amber-700 dark:text-amber-300 tracking-wide"
                      >
                        🍱{' '}
                        {tx(
                          'សម្រាកអាហារថ្ងៃត្រង់ (Midday Lunch Break)',
                          'Midday Lunch Break'
                        )}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="p-3 bg-slate-50/50 dark:bg-slate-800/30 border-r border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
                          {tx(`ម៉ោងទី ${per.p}`, `Period ${per.p}`)}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                          {per.shift === 'morning'
                            ? tx('ព្រឹក', 'AM')
                            : per.shift === 'afternoon'
                            ? tx('រសៀល', 'PM')
                            : tx('ល្ងាច', 'Eve')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        {per.time}
                      </div>
                    </td>

                    {activeDays.map((day) => {
                      const slot =
                        viewMode === 'class'
                          ? snapshot.timetable.find(
                              (t) =>
                                t.classId === selectedClassId &&
                                t.dayOfWeek === day.d &&
                                t.periodIndex === per.p
                            )
                          : snapshot.timetable.find(
                              (t) =>
                                Boolean(selectedTeacherId) &&
                                t.teacherId === selectedTeacherId &&
                                t.dayOfWeek === day.d &&
                                t.periodIndex === per.p
                            );

                      const sub = snapshot.subjects.find((s) => s.id === slot?.subjectId);
                      const tch = snapshot.teachers.find((t) => t.id === slot?.teacherId);
                      const cls = snapshot.classes.find((c) => c.id === slot?.classId);

                      return (
                        <td
                          key={day.d}
                          onClick={() => openSlotEditor(day.d, per.p, slot?.timeRange || per.time)}
                          className={`p-2 border-r last:border-r-0 border-slate-100 dark:border-slate-800 align-top h-24 ${
                            canEdit
                              ? 'cursor-pointer hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition'
                              : ''
                          }`}
                        >
                          {slot && sub ? (
                            <div
                              className="h-full rounded-xl p-2.5 text-white shadow-xs flex flex-col justify-between hover:brightness-105 transition"
                              style={{ backgroundColor: sub.color || '#2563eb' }}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className="text-xs font-extrabold leading-snug">
                                  {tx(sub.nameKh, sub.nameEn)}
                                </div>
                                {slot.timeRange && slot.timeRange !== per.time && (
                                  <span className="text-[9px] bg-black/20 px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">
                                    {slot.timeRange}
                                  </span>
                                )}
                              </div>
                              <div className="mt-1.5 text-[11px] text-white/90">
                                <div className="truncate font-medium">
                                  {viewMode === 'class'
                                    ? tch
                                      ? tx(tch.nameKh, tch.nameEn)
                                      : tx('មិនទាន់កំណត់គ្រូ', 'No teacher assigned')
                                    : displayClassName(cls, lang)}
                                </div>
                                {slot.room && (
                                  <div className="text-[10px] text-white/80">
                                    {tx('បន្ទប់៖', 'Room:')} {slot.room}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : canEdit ? (
                            <div className="h-full rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-0.5 text-slate-300 dark:text-slate-700 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition">
                              <Plus className="w-4 h-4" />
                              <span className="text-[10px] font-semibold">
                                {tx('កំណត់', 'Set')}
                              </span>
                            </div>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Create Class Modal */}
      {quickClassModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                {tx('បង្កើតថ្នាក់រៀនថ្មីរហ័ស', 'Quick Create Class')}
              </h2>
              <button type="button" onClick={() => setQuickClassModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleQuickCreateClass} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ឈ្មោះថ្នាក់ (ខ្មែរ) *', 'Class Name (Khmer) *')}
                  </label>
                  <input
                    required
                    value={quickClassForm.nameKh}
                    onChange={(e) =>
                      setQuickClassForm({ ...quickClassForm, nameKh: e.target.value })
                    }
                    placeholder='ឧ. ថ្នាក់ទី ១០ "ក"'
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ឈ្មោះថ្នាក់ (អង់គ្លេស)', 'Class Name (English)')}
                  </label>
                  <input
                    value={quickClassForm.nameEn}
                    onChange={(e) =>
                      setQuickClassForm({ ...quickClassForm, nameEn: e.target.value })
                    }
                    placeholder="e.g. Grade 10A"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('កម្រិតថ្នាក់ (0-12)', 'Grade (0-12)')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={12}
                    value={quickClassForm.gradeLevel}
                    onChange={(e) =>
                      setQuickClassForm({
                        ...quickClassForm,
                        gradeLevel: Number(e.target.value),
                        code: `G${e.target.value}-A`,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('កូដថ្នាក់', 'Class Code')}
                  </label>
                  <input
                    value={quickClassForm.code}
                    onChange={(e) =>
                      setQuickClassForm({ ...quickClassForm, code: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('បន្ទប់រៀន', 'Room')}
                  </label>
                  <input
                    value={quickClassForm.room}
                    onChange={(e) =>
                      setQuickClassForm({ ...quickClassForm, room: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setQuickClassModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  {tx('បោះបង់', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                >
                  {tx('បង្កើតថ្នាក់រៀន', 'Create Class')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Copy Timetable Modal */}
      {copyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold flex items-center gap-2">
                <Copy className="w-5 h-5 text-blue-600" />
                {tx('ចម្លងកាលវិភាគពីថ្នាក់ផ្សេង', 'Copy Timetable From Another Class')}
              </h2>
              <button type="button" onClick={() => setCopyModalOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCopySchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {tx('ជ្រើសរើសថ្នាក់ប្រភពដែលត្រូវចម្លងមក', 'Source Class')}
                </label>
                <select
                  value={copySourceClassId}
                  onChange={(e) => setCopySourceClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold"
                >
                  {snapshot.classes
                    .filter((c) => c.id !== selectedClassId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {displayClassName(c, lang)} (
                        {snapshot.timetable.filter((t) => t.classId === c.id).length}{' '}
                        {tx('ម៉ោង', 'slots')})
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCopyModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  {tx('បោះបង់', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                >
                  {tx('ចម្លងឥឡូវនេះ', 'Copy Schedule')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Period & Shift Settings Modal */}
      {periodModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-blue-600" />
                {tx('កំណត់រចនាសម្ព័ន្ធម៉ោងសិក្សាប្រចាំថ្ងៃ', 'Configure Daily Study Periods & Shifts')}
              </h2>
              <button type="button" onClick={() => setPeriodModalOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePeriodSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  {tx('គំរូម៉ោងសិក្សារហ័ស (Presets)', 'Quick School Presets')}
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setDraftConfig({ ...draftConfig, periods: structuredClone(PRESET_MOEYS_6) })
                    }
                    className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-bold"
                  >
                    {tx('MoEYS ៦ ម៉ោង (៤ព្រឹក + ២រសៀល)', 'MoEYS 6 Periods')}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDraftConfig({ ...draftConfig, periods: structuredClone(PRESET_PRIVATE_8) })
                    }
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold"
                  >
                    {tx('ឯកជនពេញម៉ោង ៨ ម៉ោង/ថ្ងៃ', 'Full-Day 8 Periods')}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDraftConfig({ ...draftConfig, periods: structuredClone(PRESET_MORNING_5) })
                    }
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold"
                  >
                    {tx('វេនព្រឹក ៥ ម៉ោង', 'Morning 5 Periods')}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  {tx('ចំនួនថ្ងៃសិក្សាក្នុងមួយសប្តាហ៍', 'Study Days per Week')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([5, 6, 7] as const).map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setDraftConfig({ ...draftConfig, dayCount: cnt })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border ${
                        draftConfig.dayCount === cnt
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {cnt === 5
                        ? tx('៥ ថ្ងៃ (ចន្ទ–សុក្រ)', '5 Days (Mon–Fri)')
                        : cnt === 6
                        ? tx('៦ ថ្ងៃ (ចន្ទ–សៅរ៍)', '6 Days (Mon–Sat)')
                        : tx('៧ ថ្ងៃ (ចន្ទ–អាទិត្យ)', '7 Days (Mon–Sun)')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500">
                    {tx('បញ្ជីម៉ោងសិក្សាប្រចាំថ្ងៃ', 'Daily Periods')}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const nextP = draftConfig.periods.length + 1;
                      setDraftConfig({
                        ...draftConfig,
                        periods: [
                          ...draftConfig.periods,
                          { p: nextP, time: '15:30 - 16:30', shift: 'afternoon' },
                        ],
                      });
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {tx('បន្ថែមម៉ោងសិក្សា', 'Add Period')}
                  </button>
                </div>

                {draftConfig.periods.map((per, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-500 w-16">
                      {tx(`ម៉ោងទី ${i + 1}`, `P${i + 1}`)}
                    </span>
                    <input
                      value={per.time}
                      onChange={(e) => {
                        const copy = [...draftConfig.periods];
                        copy[i] = { ...copy[i], time: e.target.value };
                        setDraftConfig({ ...draftConfig, periods: copy });
                      }}
                      placeholder="07:00 - 08:00"
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
                    />
                    <select
                      value={per.shift}
                      onChange={(e) => {
                        const copy = [...draftConfig.periods];
                        copy[i] = {
                          ...copy[i],
                          shift: e.target.value as 'morning' | 'afternoon' | 'evening',
                        };
                        setDraftConfig({ ...draftConfig, periods: copy });
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
                    >
                      <option value="morning">{tx('ព្រឹក', 'Morning')}</option>
                      <option value="afternoon">{tx('រសៀល', 'Afternoon')}</option>
                      <option value="evening">{tx('ល្ងាច', 'Evening')}</option>
                    </select>
                    {draftConfig.periods.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const copy = draftConfig.periods.filter((_, idx) => idx !== i);
                          setDraftConfig({ ...draftConfig, periods: copy });
                        }}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPeriodModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  {tx('បោះបង់', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                >
                  <Check className="w-3.5 h-3.5" />
                  {tx('រក្សាទុកការកំណត់', 'Save Settings')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Slot Configuration Modal */}
      {slotModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-600" />
                {tx('កំណត់ម៉ោងបង្រៀនក្នុងកាលវិភាគ', 'Configure Timetable Slot')}
              </h2>
              <button type="button" onClick={() => setSlotModal(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {teacherConflict && (
              <div className="mb-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <b>{tx('ប្រយ័ត្នជាន់ម៉ោងគ្រូបង្រៀន!', 'Teacher Conflict Warning!')}</b>{' '}
                  {tx(
                    `គ្រូនេះមានម៉ោងបង្រៀននៅថ្នាក់ "${displayClassName(
                      snapshot.classes.find((c) => c.id === teacherConflict.classId),
                      lang
                    )}" ក្នុងថ្ងៃ និងម៉ោងដូចគ្នា។`,
                    `Selected teacher is already scheduled in "${displayClassName(
                      snapshot.classes.find((c) => c.id === teacherConflict.classId),
                      lang
                    )}" at this exact day & period.`
                  )}
                </div>
              </div>
            )}

            {roomConflict && (
              <div className="mb-3 p-3 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <b>{tx('ប្រយ័ត្នជាន់បន្ទប់រៀន!', 'Room Conflict Warning!')}</b>{' '}
                  {tx(
                    `បន្ទប់ "${slotModal.room}" កំពុងប្រើដោយថ្នាក់ "${displayClassName(
                      snapshot.classes.find((c) => c.id === roomConflict.classId),
                      lang
                    )}" ក្នុងម៉ោងដូចគ្នា។`,
                    `Room "${slotModal.room}" is already assigned to "${displayClassName(
                      snapshot.classes.find((c) => c.id === roomConflict.classId),
                      lang
                    )}" at this time.`
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveSlot} className="space-y-3.5">
              {/* 1. Class Selection or Inline New Class */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-500">
                    {tx('ថ្នាក់រៀន *', 'Class *')}
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setSlotModal({
                        ...slotModal,
                        createNewClass: !slotModal.createNewClass,
                      })
                    }
                    className="text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    {slotModal.createNewClass
                      ? snapshot.classes.length > 0
                        ? tx('ជ្រើសរើសថ្នាក់ដែលមានស្រាប់', 'Select existing class')
                        : ''
                      : tx('+ បង្កើតថ្នាក់ថ្មី', '+ Create new class')}
                  </button>
                </div>

                {slotModal.createNewClass ? (
                  <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/70 space-y-2.5">
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        required
                        value={slotModal.newClassNameKh}
                        onChange={(e) =>
                          setSlotModal({ ...slotModal, newClassNameKh: e.target.value })
                        }
                        placeholder='ឧ. ថ្នាក់ទី ១០ "ក"'
                        className="col-span-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 text-xs font-semibold border border-slate-200 dark:border-slate-700"
                      />
                      <input
                        type="number"
                        min={0}
                        max={12}
                        value={slotModal.newClassGrade}
                        onChange={(e) =>
                          setSlotModal({
                            ...slotModal,
                            newClassGrade: Number(e.target.value),
                          })
                        }
                        placeholder="Grade"
                        className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 text-xs font-semibold border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                ) : (
                  <select
                    value={slotModal.classId}
                    onChange={(e) => {
                      const nextCls = snapshot.classes.find((c) => c.id === e.target.value);
                      const existingTarget = snapshot.timetable.find(
                        (t) =>
                          t.classId === e.target.value &&
                          t.dayOfWeek === slotModal.dayOfWeek &&
                          t.periodIndex === slotModal.periodIndex
                      );
                      setSlotModal({
                        ...slotModal,
                        classId: e.target.value,
                        room: existingTarget?.room || nextCls?.room || slotModal.room,
                        existingId: existingTarget?.id,
                      });
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold"
                  >
                    {snapshot.classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {displayClassName(c, lang)} {c.room ? `(${c.room})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* 2. Day of Week & Period Index */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ថ្ងៃសិក្សា', 'Day of Week')}
                  </label>
                  <select
                    value={slotModal.dayOfWeek}
                    onChange={(e) => {
                      const nextDay = Number(e.target.value);
                      const existingTarget = !slotModal.createNewClass
                        ? snapshot.timetable.find(
                            (t) =>
                              t.classId === slotModal.classId &&
                              t.dayOfWeek === nextDay &&
                              t.periodIndex === slotModal.periodIndex
                          )
                        : undefined;
                      setSlotModal({
                        ...slotModal,
                        dayOfWeek: nextDay,
                        existingId: slotModal.existingId ?? existingTarget?.id,
                      });
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold"
                  >
                    {ALL_DAYS.map((d) => (
                      <option key={d.d} value={d.d}>
                        {tx(d.kh, d.en)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ម៉ោងទី (Period)', 'Period')}
                  </label>
                  <select
                    value={slotModal.periodIndex}
                    onChange={(e) => {
                      const nextPer = Number(e.target.value);
                      const cfg = activePeriods.find((x) => x.p === nextPer);
                      setSlotModal({
                        ...slotModal,
                        periodIndex: nextPer,
                        timeRange: cfg?.time || slotModal.timeRange,
                      });
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold"
                  >
                    {activePeriods.map((p) => (
                      <option key={p.p} value={p.p}>
                        {tx(`ម៉ោងទី ${p.p} (${p.time})`, `Period ${p.p} (${p.time})`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Custom Time Range & Room */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('ម៉ោងចាប់ផ្តើម - បញ្ចប់', 'Time Range')}
                  </label>
                  <input
                    value={slotModal.timeRange}
                    onChange={(e) => setSlotModal({ ...slotModal, timeRange: e.target.value })}
                    placeholder="07:00 - 08:00"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {tx('បន្ទប់រៀន', 'Classroom')}
                  </label>
                  <input
                    value={slotModal.room}
                    onChange={(e) => setSlotModal({ ...slotModal, room: e.target.value })}
                    placeholder="R-101"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-medium"
                  />
                </div>
              </div>

              {/* 4. Subject Selection or Inline New Subject */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-500">
                    {tx('មុខវិជ្ជា *', 'Subject *')}
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setSlotModal({
                        ...slotModal,
                        createNewSubject: !slotModal.createNewSubject,
                      })
                    }
                    className="text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    {slotModal.createNewSubject
                      ? snapshot.subjects.length > 0
                        ? tx('ជ្រើសរើសមុខវិជ្ជាមានស្រាប់', 'Select existing subject')
                        : ''
                      : tx('+ មុខវិជ្ជាថ្មី', '+ Add subject')}
                  </button>
                </div>

                {slotModal.createNewSubject ? (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 grid grid-cols-5 gap-2">
                    <input
                      required
                      value={slotModal.newSubjectNameKh}
                      onChange={(e) =>
                        setSlotModal({ ...slotModal, newSubjectNameKh: e.target.value })
                      }
                      placeholder={tx('ឈ្មោះមុខវិជ្ជា (ខ្មែរ)', 'Subject (Khmer)')}
                      className="col-span-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 text-xs font-semibold border border-slate-200 dark:border-slate-700"
                    />
                    <input
                      value={slotModal.newSubjectNameEn}
                      onChange={(e) =>
                        setSlotModal({ ...slotModal, newSubjectNameEn: e.target.value })
                      }
                      placeholder="English"
                      className="col-span-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 text-xs border border-slate-200 dark:border-slate-700"
                    />
                    <input
                      type="color"
                      value={slotModal.newSubjectColor}
                      onChange={(e) =>
                        setSlotModal({ ...slotModal, newSubjectColor: e.target.value })
                      }
                      className="h-9 w-full rounded-xl cursor-pointer bg-transparent"
                    />
                  </div>
                ) : (
                  <select
                    value={slotModal.subjectId}
                    onChange={(e) => setSlotModal({ ...slotModal, subjectId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold"
                  >
                    {snapshot.subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {tx(s.nameKh, s.nameEn)} ({s.code})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* 5. Teacher Selection (Optional) or Inline New Teacher */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-500">
                    {tx('គ្រូបង្រៀន (អាចទុកទំនេរសិនបាន)', 'Teacher (Optional)')}
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setSlotModal({
                        ...slotModal,
                        createNewTeacher: !slotModal.createNewTeacher,
                      })
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    <UserPlus className="w-3 h-3" />
                    {slotModal.createNewTeacher
                      ? tx('ជ្រើសរើសគ្រូមានស្រាប់', 'Select existing teacher')
                      : tx('+ បន្ថែមគ្រូថ្មី', '+ Quick add teacher')}
                  </button>
                </div>

                {slotModal.createNewTeacher ? (
                  <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/70 grid grid-cols-2 gap-2">
                    <input
                      required
                      value={slotModal.newTeacherNameKh}
                      onChange={(e) =>
                        setSlotModal({ ...slotModal, newTeacherNameKh: e.target.value })
                      }
                      placeholder={tx('ឈ្មោះគ្រូបង្រៀន *', 'Teacher Full Name *')}
                      className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 text-xs font-semibold border border-slate-200 dark:border-slate-700"
                    />
                    <input
                      value={slotModal.newTeacherSpec}
                      onChange={(e) =>
                        setSlotModal({ ...slotModal, newTeacherSpec: e.target.value })
                      }
                      placeholder={tx('ឯកទេស (ឧ. គណិតវិទ្យា)', 'Specialization')}
                      className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 text-xs border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                ) : (
                  <select
                    value={slotModal.teacherId}
                    onChange={(e) => setSlotModal({ ...slotModal, teacherId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold"
                  >
                    <option value="">
                      {tx('— មិនទាន់កំណត់គ្រូ / Unassigned —', '— Unassigned / TBD —')}
                    </option>
                    {snapshot.teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {tx(t.nameKh, t.nameEn)}
                        {t.specialization ? ` (${t.specialization})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                {slotModal.existingId ? (
                  <button
                    type="button"
                    onClick={async () => {
                      await applyServerResult(
                        dataEngine.deleteTimetableSlot(slotModal.existingId!),
                        tx('បានលុបម៉ោងសិក្សា', 'Slot removed')
                      );
                      setSlotModal(null);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {tx('លុបម៉ោងនេះ', 'Remove Slot')}
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSlotModal(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                  >
                    {tx('បោះបង់', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow"
                  >
                    {tx('រក្សាទុក', 'Save Slot')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
