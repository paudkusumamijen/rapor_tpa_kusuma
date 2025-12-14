
export enum AssessmentLevel {
  BERKEMBANG = 1,
  CAKAP = 2,
  MAHIR = 3
}

// UBAH KATEGORI UNTUK TPA (Tetap disimpan sebagai konstanta default, tapi tipe data di object menggunakan string)
export enum TPType {
  QURAN = 'Al-Qur\'an / Jilid',
  HAFALAN = 'Hafalan Surah & Doa',
  DINUL_ISLAM = 'Dinul Islam (Aqidah & Akhlak)',
  PRAKTIK = 'Praktik Ibadah & Bahasa Arab'
}

// AUTH TYPES
export type UserRole = 'admin' | 'guru' | 'orangtua';

export interface User {
  id?: string; // Optional karena user session mgkn tdk butuh id
  username: string;
  password?: string; // Needed for DB mapping
  name: string;
  role: UserRole;
}

export interface ClassData {
  id: string;
  name: string; // Kelas/Kelompok/Jilid
  teacherName: string; // Ustadz/Ustadzah
  nuptk: string;
}

export interface Student {
  id: string; // NISN or UUID
  nisn: string; // Bisa diganti No Induk Santri
  name: string;
  classId: string; // Links to ClassData
  pob: string; // Tempat Lahir
  dob: string; // Tanggal Lahir
  religion: string;
  childOrder: number; // Anak ke-
  gender: 'L' | 'P';
  phone: string;
  fatherName: string;
  motherName: string;
  fatherJob: string;
  motherJob: string;
  address: string;
  photoUrl?: string;
  height?: number; // Tinggi Badan (cm)
  weight?: number; // Berat Badan (kg)
}

export interface LearningObjective {
  id: string;
  classId: string; // NEW: Links to ClassData (TP is now specific to a class)
  category: string; // CHANGED: Now string to support dynamic categories
  description: string; // Materi / Target
  activity: string; // Metode
}

// Data Penilaian per TP (Hanya skor, teacherNote optional)
export interface Assessment {
  id: string;
  studentId: string;
  tpId: string; // Links to LearningObjective
  score: AssessmentLevel;
  semester: string;
  academicYear: string;
}

// NEW: Data Deskripsi Akhir per Kategori (Hasil AI / Edit Guru)
export interface CategoryResult {
  id: string;
  studentId: string;
  category: string; // TPType
  teacherNote: string; // Kata kunci umum untuk kategori ini
  generatedDescription: string; // Deskripsi Narasi Final
  semester: string;
  academicYear: string;
}

// --- NEW FEATURES TYPES ---

// 1. KOKURIKULER (P5) - Bisa dipakai untuk ADAB HARIAN
export interface P5Criteria {
  id: string;
  classId: string; // NEW: Links to ClassData (Sub dimension per class)
  subDimension: string;
  descBerkembang: string; // Deskripsi untuk nilai 1
  descCakap: string;      // Deskripsi untuk nilai 2
  descMahir: string;      // Deskripsi untuk nilai 3
}

export interface P5Assessment {
  id: string;
  studentId: string;
  criteriaId: string;
  score: AssessmentLevel;
  teacherNote?: string; // Kata kunci guru
  generatedDescription?: string; // Hasil AI
}

// 2. REFLEKSI ORANG TUA (OLD STRUCTURE - DEPRECATED BUT KEPT FOR COMPATIBILITY IF NEEDED)
export interface Reflection {
  id: string;
  studentId: string;
  question: string;
  answer: string;
}

// 2.1 NEW REFLECTION STRUCTURE
export interface ReflectionQuestion {
  id: string;
  classId: string;
  question: string;
  active: boolean; // status aktif
}

export interface ReflectionAnswer {
  id: string;
  questionId: string;
  studentId: string;
  answer: string;
}

// 3. CATATAN PERKEMBANGAN
export interface StudentNote {
  id: string;
  studentId: string;
  note: string;
}

// 4. KEHADIRAN
export interface AttendanceData {
  id: string;
  studentId: string;
  sick: number;
  permission: number;
  alpha: number;
}

export interface SchoolSettings {
  name: string;
  npsn: string; // No Statistik TPA
  address: string;
  postalCode: string;
  village: string; // Desa
  district: string; // Kecamatan
  regency: string; // Kabupaten
  province: string;
  website: string;
  email: string;
  headmaster: string; // Kepala TPA
  teacher: string; // Default teacher name if not in class
  currentClass: string;
  semester: string;
  academicYear: string;
  reportDate: string;
  reportPlace: string;
  logoUrl?: string; // Deprecated, kept for backup
  appLogoUrl?: string; // New: Logo for App UI
  reportLogoUrl?: string; // New: Logo for Print Report
  // AI CONFIGURATION (STORED IN DB)
  aiProvider?: 'gemini' | 'groq';
  aiApiKey?: string;
  // DYNAMIC CATEGORIES
  assessmentCategories?: string[]; // List of active TP Categories
}

export interface AppState {
  user: User | null; // Auth State (Current Logged In)
  classes: ClassData[];
  students: Student[];
  tps: LearningObjective[];
  assessments: Assessment[];
  categoryResults: CategoryResult[]; // New State
  settings: SchoolSettings;
  // New States
  p5Criteria: P5Criteria[];
  p5Assessments: P5Assessment[];
  reflections: Reflection[]; // Old
  reflectionQuestions: ReflectionQuestion[]; // New
  reflectionAnswers: ReflectionAnswer[]; // New
  notes: StudentNote[];
  attendance: AttendanceData[];
}

// Response structure from Google Apps Script
export interface ApiResponse {
  status: 'success' | 'error';
  message?: string;
  data?: any;
}

export interface ApiPayload {
  action: 'create' | 'update' | 'delete' | 'readAll';
  collection: 'classes' | 'students' | 'TPs' | 'assessments' | 'categoryResults' | 'settings' | 'p5Criteria' | 'p5Assessments' | 'reflections' | 'reflectionQuestions' | 'reflectionAnswers' | 'notes' | 'attendance';
  data?: any;
  id?: string;
}

// Global declaration for external libraries
declare global {
  interface Window {
    html2pdf: any;
    XLSX: any;
  }
}
