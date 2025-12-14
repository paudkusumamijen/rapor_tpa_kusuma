import { SchoolSettings, TPType } from './types';

// Helper untuk membaca process.env (Node.js / Create-React-App fallback)
const getProcessEnv = (key: string) => {
    try {
        // @ts-ignore
        return typeof process !== 'undefined' ? process.env[key] : undefined;
    } catch (e) {
        return undefined;
    }
};

// --- KONFIGURASI DATABASE (SUPABASE) ---
// PENTING: Di Vercel (Vite), kita WAJIB mengakses 'import.meta.env.VITE_...' secara LITERAl/LANGSUNG.
// Jangan gunakan fungsi dinamis (seperti env[key]) karena Vite melakukan static replacement saat build.

export const SUPABASE_URL = 
    // @ts-ignore
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || 
    getProcessEnv('VITE_SUPABASE_URL') || 
    ""; 

export const SUPABASE_KEY = 
    // @ts-ignore
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_KEY) || 
    getProcessEnv('VITE_SUPABASE_KEY') || 
    "";

// --- KONFIGURASI AI (GEMINI) ---
export const GEMINI_API_KEY = 
    // @ts-ignore
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) || 
    getProcessEnv('VITE_API_KEY') || 
    ""; 

// --- KONFIGURASI ASET ---
export const DEFAULT_LOGO_URL = "https://wohhrumqbuwhfulhrlfy.supabase.co/storage/v1/object/public/images/Logo%20Kusuma-new1.png";

// -------------------------------------

export const INITIAL_SETTINGS: SchoolSettings = {
  name: "TPA AL-HIDAYAH",
  npsn: "12345678",
  address: "Jl. Masjid No. 1",
  postalCode: "12345",
  village: "Sukamaju",
  district: "Maju Jaya",
  regency: "Jakarta Selatan",
  province: "DKI Jakarta",
  website: "www.tpa-alhidayah.id",
  email: "info@tpa-alhidayah.id",
  headmaster: "Ustadz Abdullah, S.Pd.I",
  teacher: "Ustadzah Aisyah",
  currentClass: "Jilid 1",
  semester: "1 (Ganjil)",
  academicYear: "2024/2025",
  reportPlace: "Jakarta",
  reportDate: new Date().toISOString().split('T')[0],
  logoUrl: DEFAULT_LOGO_URL,
  appLogoUrl: DEFAULT_LOGO_URL, 
  reportLogoUrl: DEFAULT_LOGO_URL, 
  aiProvider: 'groq',
  aiApiKey: ""
};

// Kategori Penilaian TPA
export const TP_CATEGORIES = [
    TPType.QURAN, 
    TPType.HAFALAN, 
    TPType.DINUL_ISLAM,
    TPType.PRAKTIK
];

export const LEVEL_LABELS = {
  1: "Mulai Lancar (Perlu Bimbingan)",
  2: "Lancar (Jayyid)",
  3: "Sangat Lancar (Mumtaz)"
};