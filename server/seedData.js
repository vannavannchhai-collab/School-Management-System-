// Shared deterministic seed generator for Angkor General & International School ERP
// Used by both the SQLite backend server and the Offline PWA client-side engine.

export function buildInitialSeedData() {
  const settings = {
    schoolNameKh: 'សាលាចំណេះទូទៅ និងអន្តរជាតិ អង្គរ',
    schoolNameEn: 'Angkor General & International School',
    ministryHeaderKh: 'មន្ទីរអប់រំ យុវជន និងកីឡា ខេត្តសៀមរាប',
    ministryHeaderEn: 'Provincial Department of Education, Youth and Sport — Siem Reap',
    mottoKh: 'ចំណេះដឹង វិន័យ សីលធម៌ និងនវានុវត្តន៍',
    mottoEn: 'Knowledge, Discipline, Morality & Innovation',
    principalNameKh: 'បណ្ឌិត វណ្ណា វណ្ណឆៃ',
    principalNameEn: 'Dr. Vanna Vannchhai',
    academicYear: '2026-2027',
    currentSemester: 't1',
    exchangeRate: 4100,
    phone: '012 888 999 / 063 965 888',
    email: 'info@angkorschool.edu.kh',
    website: 'www.angkorschool.edu.kh',
    addressKh: 'មហាវិថីសម្តេចហ៊ុនសែន សង្កាត់ស្វាយដង្គំ ក្រុងសៀមរាប ខេត្តសៀមរាប',
    addressEn: 'Samdech Hun Sen Blvd, Sangkat Svay Dangkum, Siem Reap City, Cambodia',
  };

  const users = [
    {
      id: 'usr-admin',
      username: 'admin',
      passwordPlain: 'admin123',
      role: 'admin',
      nameKh: 'បណ្ឌិត វណ្ណា វណ្ណឆៃ',
      nameEn: 'Dr. Vanna Vannchhai',
      titleKh: 'នាយកសាលា / អភិបាលប្រព័ន្ធ',
      titleEn: 'School Principal / Super Admin',
      email: 'principal@angkorschool.edu.kh',
      phone: '012 888 999',
      linkedId: 'TCH-001',
      avatarColor: '#2563eb',
    },
    {
      id: 'usr-teacher',
      username: 'teacher',
      passwordPlain: 'teacher123',
      role: 'teacher',
      nameKh: 'លោកគ្រូ សាម រតនៈ',
      nameEn: 'Mr. Sam Ratanak',
      titleKh: 'គ្រូបន្ទុកថ្នាក់ទី១២ក (គណិតវិទ្យា)',
      titleEn: 'Homeroom Teacher 12A (Mathematics)',
      email: 'ratanak.sam@angkorschool.edu.kh',
      phone: '012 345 111',
      linkedId: 'TCH-002',
      avatarColor: '#059669',
    },
    {
      id: 'usr-accountant',
      username: 'accountant',
      passwordPlain: 'acc123',
      role: 'accountant',
      nameKh: 'កញ្ញា លី សុគន្ធា',
      nameEn: 'Ms. Ly Sokunthea',
      titleKh: 'ប្រធានគណនេយ្យ និងហិរញ្ញវត្ថុ',
      titleEn: 'Chief Accountant & Finance Officer',
      email: 'finance@angkorschool.edu.kh',
      phone: '077 456 222',
      linkedId: 'TCH-011',
      avatarColor: '#d97706',
    },
    {
      id: 'usr-student',
      username: 'student',
      passwordPlain: 'student123',
      role: 'student',
      nameKh: 'សុខ ដារា',
      nameEn: 'Sok Dara',
      titleKh: 'សិស្សថ្នាក់ទី១២ក / អាណាព្យាបាល',
      titleEn: 'Grade 12A Student & Parent Portal',
      email: 'sok.dara@student.angkorschool.edu.kh',
      phone: '012 701 001',
      linkedId: 'STU-001',
      avatarColor: '#7c3aed',
    },
  ];

  const subjects = [
    { id: 'SUB-MATH', code: 'MATH', nameKh: 'គណិតវិទ្យា', nameEn: 'Mathematics', category: 'science', maxScore: 100, coefficient: 2.5, color: '#2563eb' },
    { id: 'SUB-KHM', code: 'KHMR', nameKh: 'អក្សរសាស្ត្រខ្មែរ', nameEn: 'Khmer Literature', category: 'language', maxScore: 100, coefficient: 2.0, color: '#059669' },
    { id: 'SUB-PHY', code: 'PHYS', nameKh: 'រូបវិទ្យា', nameEn: 'Physics', category: 'science', maxScore: 100, coefficient: 1.5, color: '#7c3aed' },
    { id: 'SUB-CHM', code: 'CHEM', nameKh: 'គីមីវិទ្យា', nameEn: 'Chemistry', category: 'science', maxScore: 100, coefficient: 1.5, color: '#db2777' },
    { id: 'SUB-BIO', code: 'BIOL', nameKh: 'ជីវវិទ្យា', nameEn: 'Biology', category: 'science', maxScore: 100, coefficient: 1.5, color: '#16a34a' },
    { id: 'SUB-HIS', code: 'HIST', nameKh: 'ប្រវត្តិវិទ្យា', nameEn: 'History', category: 'social', maxScore: 100, coefficient: 1.0, color: '#d97706' },
    { id: 'SUB-GEO', code: 'GEOG', nameKh: 'ភូមិវិទ្យា', nameEn: 'Geography', category: 'social', maxScore: 100, coefficient: 1.0, color: '#0891b2' },
    { id: 'SUB-ENG', code: 'ENGL', nameKh: 'ភាសាអង់គ្លេស', nameEn: 'English Language', category: 'language', maxScore: 100, coefficient: 2.0, color: '#4f46e5' },
    { id: 'SUB-ICT', code: 'ICTS', nameKh: 'កុំព្យូទ័រ (ICT)', nameEn: 'Computer & ICT', category: 'stem', maxScore: 100, coefficient: 1.0, color: '#0d9488' },
    { id: 'SUB-MOR', code: 'MORL', nameKh: 'សីលធម៌-ពលរដ្ឋវិជ្ជា', nameEn: 'Moral & Civics', category: 'social', maxScore: 100, coefficient: 1.0, color: '#ea580c' },
  ];

  const teachers = [
    {
      id: 'TCH-001',
      teacherCode: 'EMP-2020-001',
      nameKh: 'បណ្ឌិត វណ្ណា វណ្ណឆៃ',
      nameEn: 'Dr. Vanna Vannchhai',
      gender: 'M',
      dob: '1984-04-12',
      phone: '012 888 999',
      email: 'principal@angkorschool.edu.kh',
      address: 'សង្កាត់ស្វាយដង្គំ ក្រុងសៀមរាប',
      roleTitleKh: 'នាយកសាលា',
      roleTitleEn: 'School Principal',
      department: 'Administration',
      qualification: 'បណ្ឌិតគ្រប់គ្រងអប់រំ (Ph.D in Education)',
      specialization: 'គ្រប់គ្រងអប់រំ',
      hireDate: '2020-01-10',
      baseSalary: 1100,
      status: 'active',
    },
    {
      id: 'TCH-002',
      teacherCode: 'EMP-2021-002',
      nameKh: 'លោកគ្រូ សាម រតនៈ',
      nameEn: 'Mr. Sam Ratanak',
      gender: 'M',
      dob: '1989-08-19',
      phone: '012 345 111',
      email: 'ratanak.sam@angkorschool.edu.kh',
      address: 'សង្កាត់សាលាកំរើក ក្រុងសៀមរាប',
      roleTitleKh: 'គ្រូឧត្តម គណិតវិទ្យា',
      roleTitleEn: 'Senior Math Teacher',
      department: 'Mathematics & STEM',
      qualification: 'អនុបណ្ឌិតគណិតវិទ្យា (M.Sc Mathematics)',
      specialization: 'គណិតវិទ្យា',
      hireDate: '2021-09-01',
      baseSalary: 680,
      status: 'active',
    },
    {
      id: 'TCH-003',
      teacherCode: 'EMP-2021-003',
      nameKh: 'អ្នកគ្រូ គឹម សុភាព',
      nameEn: 'Ms. Kim Sopheap',
      gender: 'F',
      dob: '1991-02-24',
      phone: '070 512 333',
      email: 'sopheap.kim@angkorschool.edu.kh',
      address: 'សង្កាត់គោកចក ក្រុងសៀមរាប',
      roleTitleKh: 'គ្រូឧត្តម អក្សរសាស្ត្រខ្មែរ',
      roleTitleEn: 'Senior Khmer Literature Teacher',
      department: 'Languages & Humanities',
      qualification: 'បរិញ្ញាបត្រអក្សរសាស្ត្រខ្មែរ (B.A Khmer)',
      specialization: 'អក្សរសាស្ត្រខ្មែរ',
      hireDate: '2021-10-01',
      baseSalary: 620,
      status: 'active',
    },
    {
      id: 'TCH-004',
      teacherCode: 'EMP-2022-004',
      nameKh: 'លោកគ្រូ យ៉ា សុជ្ជារ៉ា',
      nameEn: 'Mr. Ya Sochjara',
      gender: 'M',
      dob: '1990-11-05',
      phone: '092 678 444',
      email: 'sochjara.ya@angkorschool.edu.kh',
      address: 'សង្កាត់ជ្រាវ ក្រុងសៀមរាប',
      roleTitleKh: 'គ្រូបង្រៀន រូបវិទ្យា',
      roleTitleEn: 'Physics Teacher',
      department: 'Natural Sciences',
      qualification: 'បរិញ្ញាបត្ររូបវិទ្យា (B.Sc Physics - NIE)',
      specialization: 'រូបវិទ្យា',
      hireDate: '2022-08-15',
      baseSalary: 640,
      status: 'active',
    },
    {
      id: 'TCH-005',
      teacherCode: 'EMP-2022-005',
      nameKh: 'អ្នកគ្រូ ចាន់ មុនីរ័ត្ន',
      nameEn: 'Ms. Chan Moniroth',
      gender: 'F',
      dob: '1993-06-14',
      phone: '089 334 555',
      email: 'moniroth.chan@angkorschool.edu.kh',
      address: 'សង្កាត់ស្លក្រាម ក្រុងសៀមរាប',
      roleTitleKh: 'គ្រូបង្រៀន គីមី និងជីវវិទ្យា',
      roleTitleEn: 'Chemistry & Biology Teacher',
      department: 'Natural Sciences',
      qualification: 'បរិញ្ញាបត្រគីមីវិទ្យា (B.Sc Chemistry)',
      specialization: 'គីមីវិទ្យា',
      hireDate: '2022-09-01',
      baseSalary: 610,
      status: 'active',
    },
    {
      id: 'TCH-006',
      teacherCode: 'EMP-2022-006',
      nameKh: 'លោកគ្រូ ហេង ពិសិដ្ឋ',
      nameEn: 'Mr. Heng Piseth',
      gender: 'M',
      dob: '1992-01-30',
      phone: '096 712 666',
      email: 'piseth.heng@angkorschool.edu.kh',
      address: 'សង្កាត់ស្វាយដង្គំ ក្រុងសៀមរាប',
      roleTitleKh: 'គ្រូបង្រៀន ភាសាអង់គ្លេស (TESOL)',
      roleTitleEn: 'English Lecturer (TESOL)',
      department: 'Foreign Languages',
      qualification: 'អនុបណ្ឌិតអប់រំភាសាអង់គ្លេស (M.A TESOL)',
      specialization: 'ភាសាអង់គ្លេស',
      hireDate: '2022-10-01',
      baseSalary: 650,
      status: 'active',
    },
    {
      id: 'TCH-007',
      teacherCode: 'EMP-2023-007',
      nameKh: 'អ្នកគ្រូ ម៉ៅ សុខលីន',
      nameEn: 'Ms. Mao Soklin',
      gender: 'F',
      dob: '1995-03-22',
      phone: '017 908 777',
      email: 'soklin.mao@angkorschool.edu.kh',
      address: 'សង្កាត់សាលាកំរើក ក្រុងសៀមរាប',
      roleTitleKh: 'គ្រូបង្រៀន បឋមសិក្សា',
      roleTitleEn: 'Primary Homeroom Teacher',
      department: 'Primary Education',
      qualification: 'គរុកោសល្យបឋមសិក្សា (PTTC)',
      specialization: 'បឋមសិក្សា',
      hireDate: '2023-01-15',
      baseSalary: 490,
      status: 'active',
    },
    {
      id: 'TCH-008',
      teacherCode: 'EMP-2023-008',
      nameKh: 'អ្នកគ្រូ ស៊ុន បូផា',
      nameEn: 'Ms. Sun Bopha',
      gender: 'F',
      dob: '1996-09-10',
      phone: '078 210 888',
      email: 'bopha.sun@angkorschool.edu.kh',
      address: 'សង្កាត់គោកចក ក្រុងសៀមរាប',
      roleTitleKh: 'គ្រូមត្តេយ្យសិក្សា',
      roleTitleEn: 'Early Childhood Educator',
      department: 'Kindergarten',
      qualification: 'គរុកោសល្យមត្តេយ្យសិក្សា',
      specialization: 'មត្តេយ្យសិក្សា',
      hireDate: '2023-08-01',
      baseSalary: 450,
      status: 'active',
    },
    {
      id: 'TCH-009',
      teacherCode: 'EMP-2023-009',
      nameKh: 'លោកគ្រូ ប្រាក់ វិបុល',
      nameEn: 'Mr. Prak Vibol',
      gender: 'M',
      dob: '1994-07-08',
      phone: '015 445 999',
      email: 'vibol.prak@angkorschool.edu.kh',
      address: 'សង្កាត់ស្លក្រាម ក្រុងសៀមរាប',
      roleTitleKh: 'គ្រូបង្រៀន កុំព្យូទ័រ និងប្រព័ន្ធ IT',
      roleTitleEn: 'ICT Teacher & Lab Coordinator',
      department: 'Mathematics & STEM',
      qualification: 'បរិញ្ញាបត្រវិទ្យាសាស្ត្រកុំព្យូទ័រ (B.Sc CS)',
      specialization: 'កុំព្យូទ័រ (ICT)',
      hireDate: '2023-09-01',
      baseSalary: 580,
      status: 'active',
    },
    {
      id: 'TCH-010',
      teacherCode: 'EMP-2023-010',
      nameKh: 'លោកគ្រូ នួន សុវណ្ណ',
      nameEn: 'Mr. Nuon Sovann',
      gender: 'M',
      dob: '1988-12-03',
      phone: '011 823 112',
      email: 'sovann.nuon@angkorschool.edu.kh',
      address: 'សង្កាត់ស្វាយដង្គំ ក្រុងសៀមរាប',
      roleTitleKh: 'គ្រូប្រវត្តិវិទ្យា និងភូមិវិទ្យា',
      roleTitleEn: 'Social Studies Teacher',
      department: 'Languages & Humanities',
      qualification: 'បរិញ្ញាបត្រប្រវត្តិវិទ្យា (B.A History)',
      specialization: 'ប្រវត្តិវិទ្យា',
      hireDate: '2023-09-01',
      baseSalary: 560,
      status: 'active',
    },
    {
      id: 'TCH-011',
      teacherCode: 'EMP-2021-011',
      nameKh: 'កញ្ញា លី សុគន្ធា',
      nameEn: 'Ms. Ly Sokunthea',
      gender: 'F',
      dob: '1994-05-18',
      phone: '077 456 222',
      email: 'finance@angkorschool.edu.kh',
      address: 'សង្កាត់ស្វាយដង្គំ ក្រុងសៀមរាប',
      roleTitleKh: 'ប្រធានគណនេយ្យ និងបេឡា',
      roleTitleEn: 'Chief Accountant',
      department: 'Finance & Accounting',
      qualification: 'បរិញ្ញាបត្រគណនេយ្យ និងហិរញ្ញវត្ថុ',
      specialization: 'ហិរញ្ញវត្ថុ',
      hireDate: '2021-06-01',
      baseSalary: 630,
      status: 'active',
    },
    {
      id: 'TCH-012',
      teacherCode: 'EMP-2024-012',
      nameKh: 'អ្នកស្រី ជា ចាន់ណា',
      nameEn: 'Mrs. Chea Channa',
      gender: 'F',
      dob: '1992-10-27',
      phone: '085 601 234',
      email: 'library@angkorschool.edu.kh',
      address: 'សង្កាត់សាលាកំរើក ក្រុងសៀមរាប',
      roleTitleKh: 'បណ្ណារក្ស និងកិច្ចការសិស្ស',
      roleTitleEn: 'Head Librarian & Student Affairs',
      department: 'Library & Student Services',
      qualification: 'បរិញ្ញាបត្រគ្រប់គ្រងព័ត៌មានវិទ្យា',
      specialization: 'បណ្ណាល័យ',
      hireDate: '2024-01-10',
      baseSalary: 460,
      status: 'active',
    },
  ];

  const classes = [
    {
      id: 'CLS-K2',
      code: 'K2-A',
      nameKh: 'មត្តេយ្យកម្រិតខ្ពស់ ក',
      nameEn: 'Kindergarten K2-A',
      gradeLevel: 0,
      category: 'kindergarten',
      track: 'General',
      homeroomTeacherId: 'TCH-008',
      room: 'K-101',
      shift: 'Full-Day',
      schedule: '07:30–16:00',
      capacity: 25,
      monthlyTuition: 85,
      academicYear: '2026-2027',
    },
    {
      id: 'CLS-3A',
      code: 'G3-A',
      nameKh: 'ថ្នាក់ទី៣ក',
      nameEn: 'Grade 3A',
      gradeLevel: 3,
      category: 'primary',
      track: 'General',
      homeroomTeacherId: 'TCH-007',
      room: 'P-201',
      shift: 'Full-Day',
      schedule: '07:15–16:30',
      capacity: 30,
      monthlyTuition: 100,
      academicYear: '2026-2027',
    },
    {
      id: 'CLS-6A',
      code: 'G6-A',
      nameKh: 'ថ្នាក់ទី៦ក',
      nameEn: 'Grade 6A',
      gradeLevel: 6,
      category: 'primary',
      track: 'General',
      homeroomTeacherId: 'TCH-006',
      room: 'P-204',
      shift: 'Full-Day',
      schedule: '07:00–16:30',
      capacity: 32,
      monthlyTuition: 115,
      academicYear: '2026-2027',
    },
    {
      id: 'CLS-8A',
      code: 'G8-A',
      nameKh: 'ថ្នាក់ទី៨ក',
      nameEn: 'Grade 8A',
      gradeLevel: 8,
      category: 'lower_secondary',
      track: 'General',
      homeroomTeacherId: 'TCH-009',
      room: 'S-301',
      shift: 'Morning & Afternoon',
      schedule: '07:00–17:00',
      capacity: 35,
      monthlyTuition: 135,
      academicYear: '2026-2027',
    },
    {
      id: 'CLS-9A',
      code: 'G9-A',
      nameKh: 'ថ្នាក់ទី៩ក (ឌីប្លូម)',
      nameEn: 'Grade 9A (Diploma)',
      gradeLevel: 9,
      category: 'lower_secondary',
      track: 'General',
      homeroomTeacherId: 'TCH-005',
      room: 'S-302',
      shift: 'Morning & Afternoon',
      schedule: '07:00–17:00',
      capacity: 35,
      monthlyTuition: 145,
      academicYear: '2026-2027',
    },
    {
      id: 'CLS-11A',
      code: 'G11-A',
      nameKh: 'ថ្នាក់ទី១១ក (វិទ្យាសាស្ត្រ)',
      nameEn: 'Grade 11A (Science)',
      gradeLevel: 11,
      category: 'upper_secondary',
      track: 'Science',
      homeroomTeacherId: 'TCH-004',
      room: 'H-401',
      shift: 'Morning & Afternoon',
      schedule: '07:00–17:00',
      capacity: 36,
      monthlyTuition: 165,
      academicYear: '2026-2027',
    },
    {
      id: 'CLS-12A',
      code: 'G12-A',
      nameKh: 'ថ្នាក់ទី១២ក (វិទ្យាសាស្ត្រ)',
      nameEn: 'Grade 12A (Science)',
      gradeLevel: 12,
      category: 'upper_secondary',
      track: 'Science',
      homeroomTeacherId: 'TCH-002',
      room: 'H-402',
      shift: 'Morning & Afternoon',
      schedule: '07:00–17:15',
      capacity: 36,
      monthlyTuition: 180,
      academicYear: '2026-2027',
    },
    {
      id: 'CLS-12B',
      code: 'G12-B',
      nameKh: 'ថ្នាក់ទី១២ខ (សង្គម)',
      nameEn: 'Grade 12B (Social)',
      gradeLevel: 12,
      category: 'upper_secondary',
      track: 'Social Science',
      homeroomTeacherId: 'TCH-003',
      room: 'H-403',
      shift: 'Morning & Afternoon',
      schedule: '07:00–17:15',
      capacity: 36,
      monthlyTuition: 175,
      academicYear: '2026-2027',
    },
  ];

  const rawStudents = [
    // CLS-12A (8 students)
    ['STU-001', 'សុខ ដារា', 'Sok Dara', 'M', '2008-03-14', 'CLS-12A', 'លោក សុខ ចាន់ថន', '012 701 001', 'អាជីវករ', 25],
    ['STU-002', 'ចាន់ សុភា', 'Chan Sophea', 'F', '2008-07-22', 'CLS-12A', 'លោក ចាន់ វុទ្ធី', '077 701 002', 'មន្ត្រីរាជការ', 50],
    ['STU-003', 'គឹម វណ្ណៈ', 'Kim Vannak', 'M', '2008-01-09', 'CLS-12A', 'អ្នកស្រី គឹម សុខា', '092 701 003', 'គ្រូពេទ្យ', 0],
    ['STU-004', 'នាង ភក្តី', 'Neang Phakdey', 'F', '2008-11-18', 'CLS-12A', 'លោក នាង សំណាង', '070 701 004', 'វិស្វករ', 0],
    ['STU-005', 'ជា សុជាតា', 'Chea Socheata', 'F', '2008-05-05', 'CLS-12A', 'លោក ជា រិទ្ធី', '017 701 005', 'ធនាគារិក', 100],
    ['STU-006', 'ហេង សុភក្តិ', 'Heng Sophak', 'M', '2008-09-29', 'CLS-12A', 'លោក ហេង ឆៃ', '096 701 006', 'ពាណិជ្ជករ', 0],
    ['STU-007', 'ពៅ ចន្ធី', 'Pov Chandy', 'F', '2008-04-12', 'CLS-12A', 'អ្នកស្រី ពៅ ម៉ាលី', '012 701 007', 'អាជីវករ', 15],
    ['STU-008', 'ពេជ្រ សុវឌ្ឍនៈ', 'Pech Sovathana', 'M', '2008-12-02', 'CLS-12A', 'លោក ពេជ្រ ដារ៉ា', '089 701 008', 'មេធាវី', 0],
    // CLS-12B (5 students)
    ['STU-009', 'អ៊ឹង សុភាព', 'Ung Sophap', 'M', '2008-06-21', 'CLS-12B', 'លោក អ៊ឹង ប៊ុនថន', '012 701 009', 'មន្ត្រីរាជការ', 0],
    ['STU-010', 'តាំង សុវណ្ណារ៉ា', 'Tang Sovannara', 'M', '2008-02-17', 'CLS-12B', 'លោក តាំង ហុក', '077 701 010', 'សណ្ឋាគារ', 0],
    ['STU-011', 'លី គឹមហ៊ាង', 'Ly Kimheang', 'F', '2008-08-08', 'CLS-12B', 'អ្នកស្រី លី ណារី', '092 701 011', 'អាជីវករ', 20],
    ['STU-012', 'ស្រី ធីតា', 'Srei Thida', 'F', '2008-10-15', 'CLS-12B', 'លោក ស្រី សុផល', '070 701 012', 'គ្រូបង្រៀន', 50],
    ['STU-013', 'សៀវ ចាន់ថា', 'Siev Chantha', 'M', '2008-03-27', 'CLS-12B', 'លោក សៀវ រ៉ាវុធ', '096 701 013', 'កសិកម្ម', 0],
    // CLS-11A (5 students)
    ['STU-014', 'កែវ មករា', 'Keo Mokara', 'F', '2009-01-19', 'CLS-11A', 'លោក កែវ ពិសី', '012 701 014', 'មគ្គុទ្ទេសក៍ទេសចរណ៍', 25],
    ['STU-015', 'ឌួង សុវណ្ណី', 'Duong Sovanny', 'F', '2009-05-24', 'CLS-11A', 'អ្នកស្រី ឌួង ចន្ទ្រា', '077 701 015', 'គណនេយ្យករ', 0],
    ['STU-016', 'មាស រតនា', 'Meas Ratana', 'M', '2009-09-11', 'CLS-11A', 'លោក មាស សារឿន', '092 701 016', 'ស្ថាបត្យករ', 0],
    ['STU-017', 'ឆាយ ពិសិដ្ឋ', 'Chhay Piseth', 'M', '2009-04-03', 'CLS-11A', 'លោក ឆាយ វណ្ណា', '070 701 017', 'អាជីវករ', 0],
    ['STU-018', 'សាន សុខម៉ី', 'San Sokmey', 'F', '2009-11-30', 'CLS-11A', 'លោក សាន សម្បត្តិ', '017 701 018', 'វិស្វករ', 15],
    // CLS-9A (5 students)
    ['STU-019', 'ឃឹម បញ្ញា', 'Khim Panha', 'M', '2011-02-14', 'CLS-9A', 'លោក ឃឹម សុផាត', '012 701 019', 'មន្ត្រីរាជការ', 0],
    ['STU-020', 'រស់ ស្រីនិច្ច', 'Ros Sreyneang', 'F', '2011-06-08', 'CLS-9A', 'អ្នកស្រី រស់ សុភា', '089 701 020', 'អាជីវករ', 50],
    ['STU-021', 'ឡុង វិចិត្រ', 'Long Vichetr', 'M', '2011-10-22', 'CLS-9A', 'លោក ឡុង សុខុន', '096 701 021', 'ដឹកជញ្ជូន', 0],
    ['STU-022', 'ផាន់ ដាលីន', 'Phan Dalin', 'F', '2011-03-17', 'CLS-9A', 'លោក ផាន់ រដ្ឋា', '015 701 022', 'ភោជនីយដ្ឋាន', 0],
    ['STU-023', 'ញ៉ែម សុភ័ក្រ', 'Nhem Sopheak', 'M', '2011-08-05', 'CLS-9A', 'លោក ញ៉ែម វីរៈ', '012 701 023', 'មគ្គុទ្ទេសក៍ទេសចរណ៍', 0],
    // CLS-8A (4 students)
    ['STU-024', 'ស៊ឹម ចាន់រស្មី', 'Sim Chanraksmey', 'F', '2012-04-16', 'CLS-8A', 'លោក ស៊ឹម ធារ៉ា', '077 701 024', 'អាជីវករ', 0],
    ['STU-025', 'វង្ស សុវណ្ណរាជ', 'Vong Sovannreach', 'M', '2012-09-09', 'CLS-8A', 'លោក វង្ស ណារ៉ុង', '092 701 025', 'ធនាគារិក', 20],
    ['STU-026', 'ហួត ម៉ូនីកា', 'Huot Monika', 'F', '2012-01-25', 'CLS-8A', 'អ្នកស្រី ហួត សុខនី', '070 701 026', 'វេជ្ជបណ្ឌិត', 0],
    ['STU-027', 'ប៉ែន ឧត្តម', 'Pen Oudom', 'M', '2012-12-12', 'CLS-8A', 'លោក ប៉ែន សារ៉ាត់', '017 701 027', 'ពាណិជ្ជករ', 0],
    // CLS-6A (3 students)
    ['STU-028', 'យិន សុខហេង', 'Yin Sokheng', 'M', '2014-05-19', 'CLS-6A', 'លោក យិន ចាន់', '012 701 028', 'អាជីវករ', 0],
    ['STU-029', 'ថន ស្រីពេជ្រ', 'Thorn Sreypich', 'F', '2014-07-04', 'CLS-6A', 'អ្នកស្រី ថន ចរិយា', '078 701 029', 'គ្រូបង្រៀន', 50],
    ['STU-030', 'កង វីរៈបុត្រ', 'Kong Vireakbot', 'M', '2014-11-28', 'CLS-6A', 'លោក កង សុធា', '096 701 030', 'វិស្វករ', 0],
    // CLS-3A (3 students)
    ['STU-031', 'សំ អរុណរះ', 'Sam Arunreah', 'M', '2017-03-10', 'CLS-3A', 'លោក សំ ពិសិដ្ឋ', '012 701 031', 'សណ្ឋាគារ', 0],
    ['STU-032', 'ឈុន សុវណ្ណទេវី', 'Chhun Sovanndevi', 'F', '2017-08-21', 'CLS-3A', 'អ្នកស្រី ឈុន លក្ខិណា', '077 701 032', 'ធនាគារិក', 15],
    ['STU-033', 'អ៊ុំ បញ្ញាវន្ត', 'Oum Panhavorn', 'M', '2017-12-06', 'CLS-3A', 'លោក អ៊ុំ សុផល', '092 701 033', 'មន្ត្រីរាជការ', 0],
    // CLS-K2 (3 students)
    ['STU-034', 'លឹម ច័ន្ទកញ្ញា', 'Lim Chankanha', 'F', '2020-02-14', 'CLS-K2', 'លោក លឹម ហេង', '012 701 034', 'អាជីវករ', 0],
    ['STU-035', 'សៅ ភិរម្យ', 'Sao Phirom', 'M', '2020-06-30', 'CLS-K2', 'លោក សៅ រតនៈ', '070 701 035', 'ស្ថាបត្យករ', 0],
    ['STU-036', 'ហុង សិរីមង្គល', 'Hong Sereymongkol', 'M', '2020-10-09', 'CLS-K2', 'អ្នកស្រី ហុង សុជាតា', '089 701 036', 'គ្រូពេទ្យ', 0],
  ];

  const districts = [
    'សង្កាត់ស្វាយដង្គំ ក្រុងសៀមរាប',
    'សង្កាត់សាលាកំរើក ក្រុងសៀមរាប',
    'សង្កាត់គោកចក ក្រុងសៀមរាប',
    'សង្កាត់ស្លក្រាម ក្រុងសៀមរាប',
    'សង្កាត់ជ្រាវ ក្រុងសៀមរាប',
  ];

  const students = rawStudents.map((r, idx) => {
    const num = String(idx + 1).padStart(3, '0');
    return {
      id: r[0],
      studentCode: `STU-2026-${num}`,
      moeysId: `SR-26-${100800 + idx}`,
      nameKh: r[1],
      nameEn: r[2],
      gender: r[3],
      dob: r[4],
      pob: 'ខេត្តសៀមរាប',
      classId: r[5],
      enrollmentDate: '2026-09-01',
      guardianName: r[6],
      guardianRelation: idx % 3 === 1 ? 'ម្តាយ (Mother)' : 'ឪពុក (Father)',
      guardianPhone: r[7],
      guardianOccupation: r[8],
      phone: r[7],
      email: `${r[2].toLowerCase().replace(/\s+/g, '.')}@student.angkorschool.edu.kh`,
      address: districts[idx % districts.length],
      scholarshipPct: r[9],
      transportOpt: idx % 4 === 0 ? 'School Bus Zone A' : 'Self Drop-off',
      status: 'active',
      medicalNotes: idx === 3 ? 'អាលែកហ្ស៊ីជាមួយសណ្តែកដី (Peanut allergy)' : '',
      notes: r[9] >= 50 ? 'សិស្សអាហារូបករណ៍ឆ្នើមប្រចាំឆ្នាំ' : '',
      photo: null,
    };
  });

  // Deterministic pseudo-random helper so data is super realistic and stable
  let seed = 20261029;
  const nextRand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  // Attendance for the last 12 school days ending 2026-10-29
  const schoolDates = [
    '2026-10-15', '2026-10-16', '2026-10-17',
    '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24',
    '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29',
  ];
  const attendance = [];
  for (const dt of schoolDates) {
    for (let si = 0; si < students.length; si++) {
      const st = students[si];
      const r = nextRand();
      let status = 'present';
      // Make STU-006 have slightly lower attendance so chronic absence alert has realistic data
      if (st.id === 'STU-006' && r > 0.65) {
        status = r > 0.85 ? 'absent' : 'late';
      } else if (st.id === 'STU-013' && r > 0.68) {
        status = 'absent';
      } else if (r > 0.94) {
        status = 'absent';
      } else if (r > 0.89) {
        status = 'late';
      } else if (r > 0.86) {
        status = 'excused';
      }
      attendance.push({
        id: `ATT-${dt}-${st.id}`,
        studentId: st.id,
        classId: st.classId,
        date: dt,
        status,
        checkInTime: status === 'present' ? '06:52' : status === 'late' ? '07:19' : '',
        remarks: status === 'excused' ? 'សុំច្បាប់ពីអាណាព្យាបាល' : status === 'late' ? 'ស្ទះចរាចរណ៍' : '',
        recordedBy: 'TCH-002',
      });
    }
  }

  // Grades across periods: '2026-09', '2026-10', and 't1' (Semester 1)
  const periods = ['2026-09', '2026-10', 't1'];
  const grades = [];
  // Give each student a realistic baseline talent profile
  const talentBase = {};
  students.forEach((s, idx) => {
    if (s.id === 'STU-005') talentBase[s.id] = 94; // Top #1 Honor student
    else if (s.id === 'STU-001') talentBase[s.id] = 89; // Sok Dara - Grade A/B top student
    else if (s.id === 'STU-002') talentBase[s.id] = 91;
    else if (s.id === 'STU-012') talentBase[s.id] = 90;
    else if (s.id === 'STU-014') talentBase[s.id] = 88;
    else if (s.id === 'STU-020') talentBase[s.id] = 92;
    else talentBase[s.id] = 62 + ((idx * 7) % 31);
  });

  const subjectsForClass = (clsId) => {
    if (clsId === 'CLS-K2') return ['SUB-KHM', 'SUB-MATH', 'SUB-ENG', 'SUB-MOR'];
    if (clsId === 'CLS-3A' || clsId === 'CLS-6A') return ['SUB-KHM', 'SUB-MATH', 'SUB-ENG', 'SUB-HIS', 'SUB-ICT', 'SUB-MOR'];
    return ['SUB-MATH', 'SUB-KHM', 'SUB-PHY', 'SUB-CHM', 'SUB-BIO', 'SUB-HIS', 'SUB-GEO', 'SUB-ENG', 'SUB-ICT', 'SUB-MOR'];
  };

  for (const s of students) {
    const subs = subjectsForClass(s.classId);
    for (const p of periods) {
      for (const subId of subs) {
        const subObj = subjects.find((x) => x.id === subId);
        const base = talentBase[s.id] || 75;
        const swing = Math.round((nextRand() - 0.48) * 14);
        const score = Math.max(42, Math.min(100, base + swing));
        grades.push({
          id: `GRD-${p}-${s.id}-${subId}`,
          studentId: s.id,
          classId: s.classId,
          subjectId: subId,
          subjectName: subObj ? subObj.nameKh : subId,
          periodCode: p,
          score,
          maxScore: 100,
          remarks: score >= 90 ? 'ល្អប្រសើរណាស់' : score < 50 ? 'ត្រូវប្រឹងប្រែងបន្ថែម' : '',
          updatedAt: '2026-10-28T09:00:00Z',
        });
      }
    }
  }

  // Weekly Timetable Slots (Days 1=Mon .. 6=Sat, Periods 1..6)
  const periodTimes = {
    1: '07:00 - 08:00',
    2: '08:00 - 09:00',
    3: '09:15 - 10:15',
    4: '10:15 - 11:15',
    5: '13:30 - 14:30',
    6: '14:30 - 15:30',
    7: '15:45 - 16:45',
  };

  const timetable = [];
  const classTemplates = {
    'CLS-12A': [
      [1, 1, 'SUB-MATH', 'TCH-002'], [1, 2, 'SUB-PHY', 'TCH-004'], [1, 3, 'SUB-KHM', 'TCH-003'], [1, 4, 'SUB-ENG', 'TCH-006'], [1, 5, 'SUB-CHM', 'TCH-005'], [1, 6, 'SUB-ICT', 'TCH-009'],
      [2, 1, 'SUB-PHY', 'TCH-004'], [2, 2, 'SUB-MATH', 'TCH-002'], [2, 3, 'SUB-BIO', 'TCH-005'], [2, 4, 'SUB-HIS', 'TCH-010'], [2, 5, 'SUB-ENG', 'TCH-006'], [2, 6, 'SUB-KHM', 'TCH-003'],
      [3, 1, 'SUB-MATH', 'TCH-002'], [3, 2, 'SUB-CHM', 'TCH-005'], [3, 3, 'SUB-ENG', 'TCH-006'], [3, 4, 'SUB-GEO', 'TCH-010'], [3, 5, 'SUB-PHY', 'TCH-004'], [3, 6, 'SUB-MOR', 'TCH-003'],
      [4, 1, 'SUB-KHM', 'TCH-003'], [4, 2, 'SUB-MATH', 'TCH-002'], [4, 3, 'SUB-PHY', 'TCH-004'], [4, 4, 'SUB-BIO', 'TCH-005'], [4, 5, 'SUB-ICT', 'TCH-009'], [4, 6, 'SUB-ENG', 'TCH-006'],
      [5, 1, 'SUB-MATH', 'TCH-002'], [5, 2, 'SUB-CHM', 'TCH-005'], [5, 3, 'SUB-HIS', 'TCH-010'], [5, 4, 'SUB-KHM', 'TCH-003'], [5, 5, 'SUB-BIO', 'TCH-005'], [5, 6, 'SUB-PHY', 'TCH-004'],
      [6, 1, 'SUB-MATH', 'TCH-002'], [6, 2, 'SUB-ENG', 'TCH-006'], [6, 3, 'SUB-CHM', 'TCH-005'], [6, 4, 'SUB-ICT', 'TCH-009'],
    ],
    'CLS-12B': [
      [1, 1, 'SUB-KHM', 'TCH-003'], [1, 2, 'SUB-HIS', 'TCH-010'], [1, 3, 'SUB-MATH', 'TCH-002'], [1, 4, 'SUB-GEO', 'TCH-010'], [1, 5, 'SUB-ENG', 'TCH-006'],
      [2, 1, 'SUB-ENG', 'TCH-006'], [2, 2, 'SUB-KHM', 'TCH-003'], [2, 3, 'SUB-MOR', 'TCH-010'], [2, 4, 'SUB-MATH', 'TCH-002'], [2, 5, 'SUB-ICT', 'TCH-009'],
      [3, 1, 'SUB-HIS', 'TCH-010'], [3, 2, 'SUB-ENG', 'TCH-006'], [3, 3, 'SUB-KHM', 'TCH-003'], [3, 4, 'SUB-MATH', 'TCH-002'],
      [4, 1, 'SUB-GEO', 'TCH-010'], [4, 2, 'SUB-KHM', 'TCH-003'], [4, 3, 'SUB-ENG', 'TCH-006'], [4, 4, 'SUB-ICT', 'TCH-009'],
      [5, 1, 'SUB-KHM', 'TCH-003'], [5, 2, 'SUB-MATH', 'TCH-002'], [5, 3, 'SUB-ENG', 'TCH-006'], [5, 4, 'SUB-MOR', 'TCH-010'],
      [6, 1, 'SUB-HIS', 'TCH-010'], [6, 2, 'SUB-GEO', 'TCH-010'], [6, 3, 'SUB-KHM', 'TCH-003'],
    ],
    'CLS-11A': [
      [1, 1, 'SUB-PHY', 'TCH-004'], [1, 2, 'SUB-CHM', 'TCH-005'], [1, 3, 'SUB-ICT', 'TCH-009'], [1, 4, 'SUB-MATH', 'TCH-002'],
      [2, 1, 'SUB-BIO', 'TCH-005'], [2, 2, 'SUB-ENG', 'TCH-006'], [2, 3, 'SUB-MATH', 'TCH-002'], [2, 4, 'SUB-PHY', 'TCH-004'],
      [3, 1, 'SUB-CHM', 'TCH-005'], [3, 2, 'SUB-PHY', 'TCH-004'], [3, 3, 'SUB-ICT', 'TCH-009'], [3, 4, 'SUB-ENG', 'TCH-006'],
      [4, 1, 'SUB-MATH', 'TCH-002'], [4, 2, 'SUB-BIO', 'TCH-005'], [4, 3, 'SUB-KHM', 'TCH-003'], [4, 4, 'SUB-PHY', 'TCH-004'],
      [5, 1, 'SUB-ENG', 'TCH-006'], [5, 2, 'SUB-PHY', 'TCH-004'], [5, 3, 'SUB-MATH', 'TCH-002'], [5, 4, 'SUB-CHM', 'TCH-005'],
    ],
    'CLS-9A': [
      [1, 1, 'SUB-CHM', 'TCH-005'], [1, 2, 'SUB-ENG', 'TCH-006'], [1, 3, 'SUB-HIS', 'TCH-010'], [1, 4, 'SUB-ICT', 'TCH-009'],
      [2, 1, 'SUB-MATH', 'TCH-002'], [2, 2, 'SUB-PHY', 'TCH-004'], [2, 3, 'SUB-KHM', 'TCH-003'], [2, 4, 'SUB-ENG', 'TCH-006'],
      [3, 1, 'SUB-KHM', 'TCH-003'], [3, 2, 'SUB-BIO', 'TCH-005'], [3, 3, 'SUB-GEO', 'TCH-010'], [3, 4, 'SUB-PHY', 'TCH-004'],
    ],
  };

  Object.entries(classTemplates).forEach(([clsId, rows]) => {
    const cls = classes.find((c) => c.id === clsId);
    rows.forEach(([day, period, subId, tchId]) => {
      timetable.push({
        id: `TT-${clsId}-${day}-${period}`,
        classId: clsId,
        subjectId: subId,
        teacherId: tchId,
        dayOfWeek: day,
        periodIndex: period,
        timeRange: periodTimes[period],
        room: cls ? cls.room : 'A-101',
      });
    });
  });

  // Exams Schedule
  const exams = [
    {
      id: 'EXM-001',
      titleKh: 'ប្រឡងប្រចាំខែតុលា ២០២៦',
      titleEn: 'October 2026 Monthly Assessment',
      periodCode: '2026-10',
      examType: 'monthly',
      classId: 'all',
      startDate: '2026-10-26',
      endDate: '2026-10-28',
      status: 'completed',
    },
    {
      id: 'EXM-002',
      titleKh: 'ប្រឡងឆមាសទី១ ឆ្នាំសិក្សា ២០២៦-២០២៧',
      titleEn: 'Semester 1 Official Examination',
      periodCode: 't1',
      examType: 'semester1',
      classId: 'all',
      startDate: '2026-12-14',
      endDate: '2026-12-19',
      status: 'scheduled',
    },
    {
      id: 'EXM-003',
      titleKh: 'ប្រឡងសាកល្បងសញ្ញាបត្រមធ្យមសិក្សាទុតិយភូមិ (បាក់ឌុបលើកទី១)',
      titleEn: 'Grade 12 National BacII Mock Exam #1',
      periodCode: '2026-11',
      examType: 'mock_bacii',
      classId: 'CLS-12A',
      startDate: '2026-11-23',
      endDate: '2026-11-25',
      status: 'scheduled',
    },
  ];

  // Homework / Assignments
  const assignments = [
    {
      id: 'ASN-001',
      classId: 'CLS-12A',
      subjectId: 'SUB-MATH',
      teacherId: 'TCH-002',
      title: 'លំហាត់អាំងតេក្រាល និងសមីការឌីផេរ៉ង់ស្យែល (ជំពូកទី៤)',
      description: 'ដោះស្រាយលំហាត់ទី ១ ដល់ ១៥ ទំព័រទី ១១៨ ក្នុងសៀវភៅពុម្ពគណិតវិទ្យាថ្នាក់ទី១២ រួចបង្ហាញដំណោះស្រាយលម្អិត។',
      dueDate: '2026-11-03',
      maxPoints: 20,
      status: 'open',
      createdAt: '2026-10-27',
    },
    {
      id: 'ASN-002',
      classId: 'CLS-12A',
      subjectId: 'SUB-PHY',
      teacherId: 'TCH-004',
      title: 'របាយការណ៍ពិសោធន៍អគ្គិសនីម៉ាញេទិច',
      description: 'សង្ខេបលទ្ធផលពិសោធន៍ក្នុងបន្ទប់ Lab និងគណនាដែនម៉ាញេទិចនៃសូលេណូអ៊ីត។',
      dueDate: '2026-11-05',
      maxPoints: 25,
      status: 'open',
      createdAt: '2026-10-28',
    },
    {
      id: 'ASN-003',
      classId: 'CLS-12B',
      subjectId: 'SUB-KHM',
      teacherId: 'TCH-003',
      title: 'តែងសេចក្តីបែបពិភាក្សា៖ តម្លៃនៃអក្សរសិល្ប៍ខ្មែរសម័យអង្គរ',
      description: 'សរសេរតែងសេចក្តីប្រវែងយ៉ាងតិច ៣ ទំព័រ ដោយលើកឧទាហរណ៍ពីសិលាចារឹក និងស្នាដៃអក្សរសិល្ប៍បុរាណ។',
      dueDate: '2026-11-04',
      maxPoints: 30,
      status: 'open',
      createdAt: '2026-10-26',
    },
    {
      id: 'ASN-004',
      classId: 'CLS-11A',
      subjectId: 'SUB-ICT',
      teacherId: 'TCH-009',
      title: 'គម្រោងបង្កើតគេហទំព័រ HTML/CSS & JavaScript មូលដ្ឋាន',
      description: 'រចនាគេហទំព័របង្ហាញពីតំបន់ទេសចរណ៍ប្រាសាទបុរាណក្នុងខេត្តសៀមរាប។',
      dueDate: '2026-11-08',
      maxPoints: 50,
      status: 'open',
      createdAt: '2026-10-25',
    },
  ];

  // Behavior & Merit Records
  const behaviorRecords = [
    {
      id: 'BHV-001',
      studentId: 'STU-005',
      date: '2026-10-20',
      type: 'award',
      points: 15,
      title: 'ជ័យលាភីលេខ១ សិស្សពូកែគណិតវិទ្យាប្រចាំខេត្ត',
      description: 'ទទួលបានមេដាយមាសក្នុងការប្រកួតសិស្សពូកែគណិតវិទ្យាថ្នាក់ខេត្តសៀមរាប។',
      recordedBy: 'បណ្ឌិត វណ្ណា វណ្ណឆៃ',
    },
    {
      id: 'BHV-002',
      studentId: 'STU-001',
      date: '2026-10-22',
      type: 'merit',
      points: 10,
      title: 'ប្រធានថ្នាក់ឆ្នើម និងជួយបង្រៀនមិត្តរួមថ្នាក់',
      description: 'ដឹកនាំក្រុមសិក្សាស្រាវជ្រាវ និងជួយពន្យល់មេរៀនដល់សិស្សក្នុងថ្នាក់ទី១២ក។',
      recordedBy: 'លោកគ្រូ សាម រតនៈ',
    },
    {
      id: 'BHV-003',
      studentId: 'STU-020',
      date: '2026-10-24',
      type: 'merit',
      points: 10,
      title: 'ចូលរួមសកម្មភាពបរិស្ថានសាលាស្អាត',
      description: 'ដឹកនាំយុទ្ធនាការដាំកូនឈើ និងសម្អាតបរិវេណសាលា។',
      recordedBy: 'អ្នកគ្រូ ចាន់ មុនីរ័ត្ន',
    },
    {
      id: 'BHV-004',
      studentId: 'STU-006',
      date: '2026-10-27',
      type: 'warning',
      points: -5,
      title: 'មករៀនយឺតលើស ៣ ដងក្នុងមួយខែ',
      description: 'បានណែនាំ និងជូនដំណឹងដល់អាណាព្យាបាលដើម្បីជួយតាមដានពេលវេលាមករៀន។',
      recordedBy: 'លោកគ្រូ សាម រតនៈ',
    },
  ];

  // Tuition Invoices & Payments
  const invoices = [];
  const payments = [];
  students.forEach((s, idx) => {
    const cls = classes.find((c) => c.id === s.classId);
    const subtotal = cls ? cls.monthlyTuition : 120;
    const discountAmount = Math.round((subtotal * (s.scholarshipPct || 0)) / 100);
    const totalAmount = subtotal - discountAmount;
    const invNo = `INV-2026-${String(idx + 1).padStart(4, '0')}`;
    const invId = `INV-${s.id}-202610`;

    let status = 'paid';
    let paidAmount = totalAmount;
    let method = idx % 3 === 0 ? 'ABA KHQR' : idx % 3 === 1 ? 'Cash' : 'ACLEDA';

    if (totalAmount === 0) {
      status = 'paid';
      paidAmount = 0;
      method = 'Scholarship 100%';
    } else if (idx % 7 === 3) {
      status = 'partial';
      paidAmount = Math.round(totalAmount * 0.5);
    } else if (idx % 8 === 5) {
      status = 'unpaid';
      paidAmount = 0;
      method = '';
    } else if (idx === 12 || idx === 22) {
      status = 'overdue';
      paidAmount = 0;
      method = '';
    }

    invoices.push({
      id: invId,
      invoiceNo: invNo,
      studentId: s.id,
      classId: s.classId,
      title: 'ថ្លៃសិក្សាប្រចាំខែតុលា ២០២៦ (October Tuition)',
      category: 'tuition',
      periodLabel: '2026-10',
      subtotal,
      discountAmount,
      totalAmount,
      paidAmount,
      dueDate: status === 'overdue' ? '2026-10-10' : '2026-11-05',
      status,
      paymentMethod: method,
      lastPaidAt: paidAmount > 0 ? '2026-10-06' : '',
      notes: s.scholarshipPct > 0 ? `អាហារូបករណ៍ ${s.scholarshipPct}%` : '',
      createdAt: '2026-10-01',
    });

    if (paidAmount > 0) {
      payments.push({
        id: `PAY-${idx + 1}`,
        receiptNo: `RCP-2026-${String(idx + 1).padStart(4, '0')}`,
        invoiceId: invId,
        studentId: s.id,
        amount: paidAmount,
        method,
        referenceNo: method === 'ABA KHQR' ? `ABA${902180 + idx}` : `REF${10040 + idx}`,
        receivedBy: 'កញ្ញា លី សុគន្ធា',
        paidAt: `2026-10-${String((idx % 20) + 2).padStart(2, '0')}`,
        notes: 'បង់ថ្លៃសិក្សាខែតុលា',
      });
    }
  });

  // School Expenses
  const expenses = [
    {
      id: 'EXP-001',
      expenseNo: 'EXP-2026-001',
      title: 'ថ្លៃអគ្គិសនី និងទឹកស្អាតប្រចាំខែតុលា (EDC & Water)',
      category: 'utilities',
      amount: 485,
      expenseDate: '2026-10-08',
      paidTo: 'អគ្គិសនីកម្ពុជា សាខាសៀមរាប',
      method: 'ABA KHQR',
      notes: 'អគារសិក្សាទាំង ៣ ខ្នង និងបន្ទប់កុំព្យូទ័រ',
    },
    {
      id: 'EXP-002',
      expenseNo: 'EXP-2026-002',
      title: 'ទិញសម្ភារៈពិសោធន៍វិទ្យាសាស្ត្រ និងសៀវភៅបណ្ណាល័យថ្មី',
      category: 'supplies',
      amount: 620,
      expenseDate: '2026-10-14',
      paidTo: 'បណ្ណាគារ អង្គរធំ',
      method: 'Bank Transfer',
      notes: 'គីមីវិទ្យា រូបវិទ្យា និងសៀវភៅអានបន្ថែម ៨០ ក្បាល',
    },
    {
      id: 'EXP-003',
      expenseNo: 'EXP-2026-003',
      title: 'ថែទាំម៉ាស៊ីនត្រជាក់ និងប្រព័ន្ធអ៊ីនធឺណិត Fiber Optic',
      category: 'maintenance',
      amount: 240,
      expenseDate: '2026-10-19',
      paidTo: 'ក្រុមហ៊ុនបច្ចេកទេស សៀមរាប',
      method: 'Cash',
      notes: 'លាងសម្អាតម៉ាស៊ីនត្រជាក់ ១២ គ្រឿង',
    },
    {
      id: 'EXP-004',
      expenseNo: 'EXP-2026-004',
      title: 'រៀបចំកម្មវិធីប្រកួតសិស្សពូកែ និងបណ្ណសរសើរ',
      category: 'events',
      amount: 195,
      expenseDate: '2026-10-25',
      paidTo: 'រោងពុម្ព វប្បធម៌ខ្មែរ',
      method: 'ABA KHQR',
      notes: 'ពានរង្វាន់ មេដាយ និងបណ្ណសរសើរសិស្សឆ្នើម',
    },
  ];

  // Monthly Payrolls (October 2026)
  const payrolls = teachers.map((t, idx) => {
    const allowance = idx === 0 ? 150 : 40;
    const bonus = idx % 3 === 0 ? 35 : 0;
    const deduction = idx === 4 ? 15 : 0;
    const netSalary = t.baseSalary + allowance + bonus - deduction;
    const isPaid = idx < 9;
    return {
      id: `PAYR-202610-${t.id}`,
      payrollNo: `SLIP-202610-${String(idx + 1).padStart(3, '0')}`,
      teacherId: t.id,
      monthKey: '2026-10',
      baseSalary: t.baseSalary,
      allowance,
      bonus,
      deduction,
      netSalary,
      status: isPaid ? 'paid' : 'pending',
      paidAt: isPaid ? '2026-10-28' : '',
      paymentMethod: isPaid ? 'ABA Payroll' : '',
      notes: isPaid ? 'បើកប្រាក់ខែតុលារួចរាល់' : 'រង់ចាំអនុម័តបេឡា',
    };
  });

  // Teacher Leave Requests
  const teacherLeaves = [
    {
      id: 'LV-001',
      teacherId: 'TCH-005',
      leaveType: 'ច្បាប់ឈឺ (Sick Leave)',
      startDate: '2026-10-22',
      endDate: '2026-10-23',
      days: 2,
      reason: 'ពិនិត្យសុខភាពនៅមន្ទីរពេទ្យខេត្ត',
      status: 'approved',
      approvedBy: 'បណ្ឌិត វណ្ណា វណ្ណឆៃ',
      createdAt: '2026-10-21',
    },
    {
      id: 'LV-002',
      teacherId: 'TCH-009',
      leaveType: 'ធុរៈផ្ទាល់ខ្លួន (Personal Leave)',
      startDate: '2026-11-02',
      endDate: '2026-11-02',
      days: 1,
      reason: 'ចូលរួមកម្មវិធីគ្រួសារនៅរាជធានីភ្នំពេញ',
      status: 'pending',
      approvedBy: '',
      createdAt: '2026-10-28',
    },
    {
      id: 'LV-003',
      teacherId: 'TCH-006',
      leaveType: 'វគ្គបំប៉នវិជ្ជាជីវៈ (Training)',
      startDate: '2026-11-06',
      endDate: '2026-11-07',
      days: 2,
      reason: 'ចូលរួមសិក្ខាសាលាវិធីសាស្ត្របង្រៀនភាសាអង់គ្លេសថ្មី',
      status: 'pending',
      approvedBy: '',
      createdAt: '2026-10-29',
    },
  ];

  // Library Catalog & Loans
  const libraryBooks = [
    { id: 'BK-001', bookCode: 'LIB-MATH-12', isbn: '978-99963-01-12', titleKh: 'កម្រងលំហាត់គណិតវិទ្យាជ្រើសរើសថ្នាក់ទី១២ (ត្រៀមបាក់ឌុប)', titleEn: 'Advanced Grade 12 BacII Mathematics', author: 'ក្រសួងអប់រំ យុវជន និងកីឡា', category: 'Mathematics', shelf: 'A-01', totalCopies: 15, availableCopies: 12, publishYear: 2025 },
    { id: 'BK-002', bookCode: 'LIB-KHM-01', isbn: '978-99963-02-08', titleKh: 'សិក្សាអត្ថបទអក្សរសិល្ប៍ខ្មែរ៖ រឿងទុំទាវ និងរឿងព្រះវេស្សន្តរ', titleEn: 'Khmer Classical Literature Analysis', author: 'វិទ្យាស្ថានពុទ្ធសាសនបណ្ឌិត្យ', category: 'Literature', shelf: 'B-02', totalCopies: 12, availableCopies: 10, publishYear: 2023 },
    { id: 'BK-003', bookCode: 'LIB-PHY-12', isbn: '978-99963-03-19', titleKh: 'រូបវិទ្យាទំនើប និងអគ្គិសនីម៉ាញេទិច ថ្នាក់ទី១១-១២', titleEn: 'Modern Physics & Electromagnetism', author: 'សាស្ត្រាចារ្យ យ៉ា សុជ្ជារ៉ា', category: 'Science', shelf: 'A-04', totalCopies: 10, availableCopies: 9, publishYear: 2024 },
    { id: 'BK-004', bookCode: 'LIB-HIS-05', isbn: '978-99963-04-21', titleKh: 'ប្រវត្តិសាស្ត្រនៃចក្រភពអង្គរ និងអរិយធម៌ខ្មែរ', titleEn: 'History of the Angkor Empire & Khmer Civilization', author: 'បណ្ឌិត ត្រឹង ងា / សិក្សាស្រាវជ្រាវ', category: 'History', shelf: 'C-01', totalCopies: 14, availableCopies: 13, publishYear: 2022 },
    { id: 'BK-005', bookCode: 'LIB-ENG-09', isbn: '978-0-19-450112-5', titleKh: 'វេយ្យាករណ៍ និងការសរសេរភាសាអង់គ្លេសកម្រិតខ្ពស់', titleEn: 'Oxford Academic English Grammar & Writing', author: 'Oxford University Press', category: 'English', shelf: 'D-03', totalCopies: 18, availableCopies: 16, publishYear: 2024 },
    { id: 'BK-006', bookCode: 'LIB-ICT-03', isbn: '978-99963-09-44', titleKh: 'មូលដ្ឋានគ្រឹះនៃការសរសេរកម្មវិធី Python និង Web', titleEn: 'Introduction to Python & Modern Web Development', author: 'លោកគ្រូ ប្រាក់ វិបុល', category: 'ICT & Tech', shelf: 'E-01', totalCopies: 10, availableCopies: 8, publishYear: 2025 },
    { id: 'BK-007', bookCode: 'LIB-CHM-11', isbn: '978-99963-05-33', titleKh: 'គីមីសរីរាង្គ និងប្រតិកម្មគីមីវិទ្យាវិទ្យាល័យ', titleEn: 'Organic Chemistry for High School', author: 'នាយកដ្ឋានអភិវឌ្ឍកម្មវិធីសិក្សា', category: 'Science', shelf: 'A-06', totalCopies: 12, availableCopies: 12, publishYear: 2024 },
    { id: 'BK-008', bookCode: 'LIB-KID-02', isbn: '978-99963-08-11', titleKh: 'រឿងនិទានអប់រំកុមារខ្មែរ (សុភាទន្សាយ)', titleEn: 'Illustrated Khmer Folktales for Children', author: 'សមាគមអ្នកនិពន្ធខ្មែរ', category: 'Children', shelf: 'K-01', totalCopies: 20, availableCopies: 19, publishYear: 2024 },
  ];

  const libraryLoans = [
    { id: 'LN-001', bookId: 'BK-001', borrowerType: 'student', borrowerId: 'STU-001', borrowerName: 'សុខ ដារា (12A)', issueDate: '2026-10-20', dueDate: '2026-11-03', returnDate: '', fineAmount: 0, status: 'borrowed' },
    { id: 'LN-002', bookId: 'BK-001', borrowerType: 'student', borrowerId: 'STU-005', borrowerName: 'ជា សុជាតា (12A)', issueDate: '2026-10-22', dueDate: '2026-11-05', returnDate: '', fineAmount: 0, status: 'borrowed' },
    { id: 'LN-003', bookId: 'BK-002', borrowerType: 'student', borrowerId: 'STU-011', borrowerName: 'លី គឹមហ៊ាង (12B)', issueDate: '2026-10-10', dueDate: '2026-10-24', returnDate: '', fineAmount: 1.5, status: 'overdue' },
    { id: 'LN-004', bookId: 'BK-006', borrowerType: 'student', borrowerId: 'STU-014', borrowerName: 'កែវ មករា (11A)', issueDate: '2026-10-24', dueDate: '2026-11-07', returnDate: '', fineAmount: 0, status: 'borrowed' },
    { id: 'LN-005', bookId: 'BK-005', borrowerType: 'teacher', borrowerId: 'TCH-006', borrowerName: 'លោកគ្រូ ហេង ពិសិដ្ឋ', issueDate: '2026-10-18', dueDate: '2026-11-18', returnDate: '', fineAmount: 0, status: 'borrowed' },
    { id: 'LN-006', bookId: 'BK-004', borrowerType: 'student', borrowerId: 'STU-002', borrowerName: 'ចាន់ សុភា (12A)', issueDate: '2026-10-05', dueDate: '2026-10-19', returnDate: '2026-10-18', fineAmount: 0, status: 'returned' },
  ];

  // Announcements & School Events
  const announcements = [
    {
      id: 'ANN-001',
      titleKh: 'សេចក្តីជូនដំណឹងស្តីពីការប្រឡងសាកល្បងបាក់ឌុបលើកទី១ សម្រាប់សិស្សថ្នាក់ទី១២',
      titleEn: 'Grade 12 Mock BacII Examination #1 Announcement',
      contentKh: 'សូមជូនដំណឹងដល់លោកគ្រូ-អ្នកគ្រូ អាណាព្យាបាល និងប្អូនៗសិស្សថ្នាក់ទី១២ទាំងអស់ឱ្យបានជ្រាបថា សាលានឹងរៀបចំការប្រឡងសាកល្បងសញ្ញាបត្រមធ្យមសិក្សាទុតិយភូមិលើកទី១ ចាប់ពីថ្ងៃទី ២៣ ដល់ ២៥ ខែវិច្ឆិកា ឆ្នាំ២០២៦។',
      contentEn: 'All Grade 12 students and parents are informed that the first National BacII Mock Examination will be held from November 23–25, 2026.',
      audience: 'all',
      priority: 'urgent',
      eventDate: '2026-11-23',
      authorName: 'បណ្ឌិត វណ្ណា វណ្ណឆៃ',
      pinned: true,
      createdAt: '2026-10-28',
    },
    {
      id: 'ANN-002',
      titleKh: 'កម្មវិធីជំនួបរវាងគណៈគ្រប់គ្រងសាលា គ្រូបន្ទុកថ្នាក់ និងមាតាបិតាសិស្ស',
      titleEn: 'Parent-Teacher Conference & Term Progress Review',
      contentKh: 'សាលាขอគោរពអញ្ជើញមាតាបិតា និងអាណាព្យាបាលសិស្សគ្រប់កម្រិតថ្នាក់ ចូលរួមកិច្ចប្រជុំពិភាក្សាអំពីលទ្ធផលសិក្សាប្រចាំខែតុលា នៅថ្ងៃសៅរ៍ ទី០៧ ខែវិច្ឆិកា ឆ្នាំ២០២៦ ម៉ោង ០៨:០០ ព្រឹក។',
      contentEn: 'Parents and guardians are cordially invited to attend our Parent-Teacher Conference on Saturday, November 7, 2026 at 8:00 AM.',
      audience: 'parents',
      priority: 'important',
      eventDate: '2026-11-07',
      authorName: 'ការិយាល័យសិក្សាធិការ',
      pinned: true,
      createdAt: '2026-10-26',
    },
    {
      id: 'ANN-003',
      titleKh: 'ឈប់សម្រាកព្រះរាជពិធីបុណ្យអុំទូក បណ្តែតប្រទីប និងសំពះព្រះខែ អកអំបុក',
      titleEn: 'Royal Water Festival Public Holiday Notice',
      contentKh: 'សិស្សានុសិស្ស និងបុគ្គលិកសិក្សាទាំងអស់នឹងត្រូវឈប់សម្រាកក្នុងឱកាសព្រះរាជពិធីបុណ្យអុំទូក ចំនួន ៣ ថ្ងៃ ហើយចូលរៀនវិញតាមកាលវិភាគធម្មតា។',
      contentEn: 'School will observe a 3-day holiday for the Royal Water Festival and resume classes on the following business day.',
      audience: 'all',
      priority: 'normal',
      eventDate: '2026-11-24',
      authorName: 'រដ្ឋបាលសាលា',
      pinned: false,
      createdAt: '2026-10-24',
    },
    {
      id: 'ANN-004',
      titleKh: 'ការបើកវគ្គបំប៉នបន្ថែមមុខវិជ្ជា STEM និង Robotics នាថ្ងៃសៅរ៍',
      titleEn: 'Saturday STEM, Coding & Robotics Club Registration Open',
      contentKh: 'សិស្សចាប់ពីថ្នាក់ទី៦ ដល់ទី១២ អាចចុះឈ្មោះចូលរួមក្លឹប STEM និងការសរសេរកូដដោយឥតគិតថ្លៃនៅបន្ទប់កុំព្យូទ័រជាន់ទី៣។',
      contentEn: 'Grades 6–12 students can now register for Saturday STEM & Robotics Club free of charge in ICT Lab 3F.',
      audience: 'students',
      priority: 'normal',
      eventDate: '2026-11-14',
      authorName: 'លោកគ្រូ ប្រាក់ វិបុល',
      pinned: false,
      createdAt: '2026-10-22',
    },
  ];

  const auditLogs = [
    { id: 'LOG-001', userName: 'បណ្ឌិត វណ្ណា វណ្ណឆៃ', role: 'admin', action: 'អនុម័តច្បាប់ឈប់សម្រាក', module: 'HR', details: 'Approved 2-day sick leave for Ms. Chan Moniroth', createdAt: '2026-10-28 14:20' },
    { id: 'LOG-002', userName: 'លោកគ្រូ សាម រតនៈ', role: 'teacher', action: 'បញ្ចូលពិន្ទុប្រចាំខែតុលា', module: 'Grades', details: 'Saved October Mathematics scores for Grade 12A', createdAt: '2026-10-28 16:05' },
    { id: 'LOG-003', userName: 'កញ្ញា លី សុគន្ធា', role: 'accountant', action: 'បើកប្រាក់បៀវត្សរ៍', module: 'Payroll', details: 'Processed October salaries for 9 teaching staff via ABA Payroll', createdAt: '2026-10-28 17:10' },
    { id: 'LOG-004', userName: 'លោកគ្រូ សាម រតនៈ', role: 'teacher', action: 'កត់ត្រាវត្តមានសិស្ស', module: 'Attendance', details: 'Recorded daily attendance for Grade 12A (2026-10-29)', createdAt: '2026-10-29 07:30' },
  ];

  return {
    settings,
    users,
    subjects,
    teachers,
    classes,
    students,
    attendance,
    grades,
    timetable,
    exams,
    assignments,
    behaviorRecords,
    invoices,
    payments,
    expenses,
    payrolls,
    teacherLeaves,
    libraryBooks,
    libraryLoans,
    announcements,
    auditLogs,
  };
}
