// Clean Production Initial Template for Cambodia K-12 School Management System.
// Contains ZERO demo accounts and ZERO fake student/teacher/invoice records.
// Initializes only school configuration defaults and standard MoEYS K-12 subjects.

export function buildInitialSeedData() {
  const settings = {
    schoolNameKh: 'សាលាចំណេះទូទៅ និងអន្តរជាតិ',
    schoolNameEn: 'Cambodia General & International School',
    ministryHeaderKh: 'មន្ទីរអប់រំ យុវជន និងកីឡា',
    ministryHeaderEn: 'Department of Education, Youth and Sport',
    mottoKh: 'ចំណេះដឹង វិន័យ សីលធម៌ និងនវានុវត្តន៍',
    mottoEn: 'Knowledge, Discipline, Morality & Innovation',
    principalNameKh: '',
    principalNameEn: '',
    academicYear: '2026-2027',
    currentSemester: 't1',
    exchangeRate: 4100,
    phone: '',
    email: '',
    website: '',
    addressKh: '',
    addressEn: '',
  };

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

  return {
    settings,
    users: [],
    subjects,
    teachers: [],
    classes: [],
    students: [],
    attendance: [],
    grades: [],
    timetable: [],
    exams: [],
    assignments: [],
    behaviorRecords: [],
    invoices: [],
    payments: [],
    expenses: [],
    payrolls: [],
    teacherLeaves: [],
    libraryBooks: [],
    libraryLoans: [],
    announcements: [],
    auditLogs: [],
  };
}
