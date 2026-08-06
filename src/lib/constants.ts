export const SUBJECTS = [
  'Bahasa Indonesia',
  'Bahasa Inggris',
  'Bahasa Daerah',
  'Bahasa Asing Lain',
  'Matematika',
  'Informatika',
  'IPA',
  'IPS',
  'PPKn/Pancasila',
  'Agama',
  'Seni Budaya',
  'PJOK',
  'Prakarya',
  'Ekonomi',
  'Akuntansi',
  'Geografi',
  'Sejarah',
  'Biologi',
  'Kimia',
  'Fisika',
  'Sosiologi',
  'Antropologi',
  'Bahasa Jepang',
  'Bahasa Korea',
  'Bahasa Mandarin',
  'Lainnya',
] as const;

export const EDUCATION_LEVELS = ['SD', 'SMP', 'SMA/SMK', 'Kuliah', 'Umum'] as const;

export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

export const CLASS_OPTIONS: Record<EducationLevel, string[]> = {
  SD: ['1', '2', '3', '4', '5', '6'],
  SMP: ['7', '8', '9'],
  'SMA/SMK': ['10', '11', '12'],
  Kuliah: ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8', 'Umum'],
  Umum: ['Umum'],
};

export const FEED_TABS = [
  { id: 'latest', label: 'Terbaru' },
  { id: 'popular', label: 'Populer' },
  { id: 'trending', label: 'Trending' },
] as const;

export const POST_TYPES = [
  { id: 'all', label: 'Semua' },
  { id: 'question', label: 'Pertanyaan' },
  { id: 'answer', label: 'Jawaban' },
] as const;
