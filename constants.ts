import { SchoolSettings, TPType } from './types';

// Helper untuk membaca Env Var dengan aman (mendukung Vite, Create-React-App, dan Vercel)
const getEnv = (key: string) => {
  let val = "";
  
  // 1. Cek process.env (biasanya untuk Create-React-App atau Node env)
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
        val = process.env[key];
    }
  } catch (e) {}

  if (val) return val;

  // 2. Cek import.meta.env (standar Vite)
  try {
    // Menggunakan casting any untuk menghindari error TS pada property 'env'
    const meta = import.meta as any;
    if (typeof meta !== 'undefined' && meta.env && meta.env[key]) {
        val = meta.env[key];
    }
  } catch (e) {}
  
  return val;
};

// --- KONFIGURASI DATABASE (SUPABASE) ---
// Mendukung berbagai format penamaan agar kompatibel dengan Vercel Settings
export const SUPABASE_URL = getEnv('VITE_SUPABASE_URL') || getEnv('REACT_APP_SUPABASE_URL') || getEnv('SUPABASE_URL') || ""; 
export const SUPABASE_KEY = getEnv('VITE_SUPABASE_KEY') || getEnv('REACT_APP_SUPABASE_KEY') || getEnv('SUPABASE_KEY') || "";

// --- KONFIGURASI AI (GEMINI) ---
// Mengambil API Key dari environment variable (Vercel)
export const GEMINI_API_KEY = getEnv('VITE_API_KEY') || getEnv('REACT_APP_API_KEY') || getEnv('API_KEY') || ""; 

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