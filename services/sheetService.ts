import { ApiPayload, ApiResponse, AppState, SchoolSettings } from "../types";
import { SUPABASE_URL, SUPABASE_KEY } from "../constants";
import { createClient } from "@supabase/supabase-js";

// --- SUPABASE CLIENT INITIALIZATION ---
let supabase: any = null;

// Helper to get configuration
const getSupabaseConfig = () => {
  const envUrl = SUPABASE_URL;
  const envKey = SUPABASE_KEY;
  const localUrl = localStorage.getItem('supabase_url');
  const localKey = localStorage.getItem('supabase_key');
  
  // Prioritas: LocalStorage (jika user manual input) -> Env Var
  // TAPI, kita cek validitasnya
  let url = localUrl || envUrl;
  let key = localKey || envKey;

  // Bersihkan URL
  if (url) {
      url = url.trim();
      // Pastikan ada protocol
      if (!url.startsWith('http')) {
          url = `https://${url}`;
      }
      // Hapus slash di akhir
      if (url.endsWith('/')) {
          url = url.slice(0, -1);
      }
  }

  return { url, key };
};

// Reset Helper (For Settings Page)
export const resetSupabaseClient = () => {
    supabase = null;
};

// Initialize Supabase if config exists
const initSupabase = () => {
  if (supabase) return supabase;

  const { url, key } = getSupabaseConfig();
  
  if (url && key && url !== "https://" && key !== "undefined") {
    try {
      supabase = createClient(url, key, {
          auth: { persistSession: false }, // Tidak perlu auth session untuk public table
          db: { schema: 'public' }
      });
    } catch (e) {
      console.error("Invalid Supabase Config Initialization", e);
      return null;
    }
  }
  return supabase;
};

// Helper: Convert camelCase (Frontend) to snake_case (DB)
const toSnakeCase = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
const toCamelCase = (str: string) => str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());

const mapKeys = (obj: any, mapper: (k: string) => string) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(i => mapKeys(i, mapper));
  
  return Object.keys(obj).reduce((acc, key) => {
    acc[mapper(key)] = mapKeys(obj[key], mapper);
    return acc;
  }, {} as any);
};

// Helper: Unpack Logo JSON from legacy 'logo_url' column
const unpackSettingsLogos = (settingsData: any) => {
  if (!settingsData) return null;
  const processed = { ...settingsData };
  
  // Check if logoUrl contains JSON (delimiter for multiple logos)
  if (processed.logoUrl && typeof processed.logoUrl === 'string' && processed.logoUrl.trim().startsWith('{')) {
      try {
          const parsed = JSON.parse(processed.logoUrl);
          processed.logoUrl = parsed.default || ""; 
          processed.appLogoUrl = parsed.app;
          processed.reportLogoUrl = parsed.report;
      } catch (e) {
          // ignore parse error, treat as simple string
      }
  }
  return processed;
};

export const sheetService = {
  // Check connection status
  isConnected: () => {
    const { url, key } = getSupabaseConfig();
    return !!(url && key);
  },

  // --- FETCH SETTINGS ONLY (FOR LOGIN SCREEN) ---
  async fetchSettings(): Promise<SchoolSettings | null> {
    const sb = initSupabase();
    if (!sb) return null;
    try {
      const { data, error } = await sb.from('settings').select('*').limit(1).maybeSingle();
      if (error) throw error;
      const camelData = data ? mapKeys(data, toCamelCase) : null;
      return unpackSettingsLogos(camelData);
    } catch (error) {
      console.error("Settings Fetch Error:", error);
      return null;
    }
  },

  // --- MAIN FETCH METHOD ---
  async fetchAllData(): Promise<AppState | null> {
    const sb = initSupabase();
    
    if (!sb) return null;

    try {
      const [
          { data: classes }, { data: students }, { data: tps }, 
          { data: assessments }, { data: categoryResults }, 
          { data: p5Criteria }, { data: p5Assessments }, 
          { data: reflections }, { data: reflectionQuestions }, 
          { data: reflectionAnswers }, { data: notes }, 
          { data: attendance }, { data: settings }
      ] = await Promise.all([
          sb.from('classes').select('*'), sb.from('students').select('*'), sb.from('tps').select('*'),
          sb.from('assessments').select('*'), sb.from('category_results').select('*'),
          sb.from('p5_criteria').select('*'), sb.from('p5_assessments').select('*'),
          sb.from('reflections').select('*'), sb.from('reflection_questions').select('*'),
          sb.from('reflection_answers').select('*'), sb.from('notes').select('*'),
          sb.from('attendance').select('*'), sb.from('settings').select('*').limit(1).maybeSingle()
      ]);

      return {
          classes: mapKeys(classes || [], toCamelCase),
          students: mapKeys(students || [], toCamelCase),
          tps: mapKeys(tps || [], toCamelCase),
          assessments: mapKeys(assessments || [], toCamelCase),
          categoryResults: mapKeys(categoryResults || [], toCamelCase),
          p5Criteria: mapKeys(p5Criteria || [], toCamelCase),
          p5Assessments: mapKeys(p5Assessments || [], toCamelCase),
          reflections: mapKeys(reflections || [], toCamelCase),
          reflectionQuestions: mapKeys(reflectionQuestions || [], toCamelCase),
          reflectionAnswers: mapKeys(reflectionAnswers || [], toCamelCase),
          notes: mapKeys(notes || [], toCamelCase),
          attendance: mapKeys(attendance || [], toCamelCase),
          settings: settings ? unpackSettingsLogos(mapKeys(settings, toCamelCase)) : undefined 
      } as AppState;

    } catch (error: any) {
      console.error("Supabase Fetch Error:", error);
      // Don't throw here, just return null so UI handles offline mode gracefully
      return null;
    }
  },

  // --- CRUD DISPATCHER ---
  async create(collection: ApiPayload['collection'], data: any) {
    return this.supabaseOp('insert', collection, data);
  },

  async update(collection: ApiPayload['collection'], data: any) {
    return this.supabaseOp('update', collection, data);
  },

  async delete(collection: ApiPayload['collection'], id: string) {
    return this.supabaseOp('delete', collection, { id });
  },
  
  async saveSettings(data: any) {
    const payload = { ...data, id: 'global_settings' };
    
    // Create JSON container for logos
    const logoPackage = {
        default: data.logoUrl,
        app: data.appLogoUrl,
        report: data.reportLogoUrl
    };
    
    payload.logoUrl = JSON.stringify(logoPackage);
    delete payload.appLogoUrl;
    delete payload.reportLogoUrl;

    return this.supabaseOp('upsert', 'settings', payload);
  },

  // --- DATABASE MANAGEMENT ---
  async clearDatabase(keepTPs: boolean = false): Promise<ApiResponse> {
      const sb = initSupabase();
      if (!sb) return { status: 'error', message: 'No connection' };

      try {
          const tablesToDelete = [
              'assessments', 'category_results', 'p5_assessments', 
              'reflections', 'reflection_answers', 'notes', 'attendance',
              'students', 
              'p5_criteria', 'reflection_questions' 
          ];

          if (!keepTPs) tablesToDelete.push('tps');
          tablesToDelete.push('classes');
          
          for (const table of tablesToDelete) {
              const { error } = await sb.from(table).delete().neq('id', '0');
              if (error) throw error;
          }

          return { status: 'success' };
      } catch (e: any) {
          return { status: 'error', message: e.message };
      }
  },

  async restoreDatabase(data: AppState): Promise<ApiResponse> {
      const sb = initSupabase();
      if (!sb) return { status: 'error', message: 'No connection' };

      try {
          await this.clearDatabase(false);

          if (data.settings) {
              const settingsPayload = { ...data.settings, id: 'global_settings' };
              await sb.from('settings').upsert(mapKeys(settingsPayload, toSnakeCase));
          }

          if (data.classes?.length) await sb.from('classes').upsert(mapKeys(data.classes, toSnakeCase));
          if (data.tps?.length) await sb.from('tps').upsert(mapKeys(data.tps, toSnakeCase));
          if (data.p5Criteria?.length) await sb.from('p5_criteria').upsert(mapKeys(data.p5Criteria, toSnakeCase));
          if (data.reflectionQuestions?.length) await sb.from('reflection_questions').upsert(mapKeys(data.reflectionQuestions, toSnakeCase));
          if (data.students?.length) await sb.from('students').upsert(mapKeys(data.students, toSnakeCase));
          if (data.assessments?.length) await sb.from('assessments').upsert(mapKeys(data.assessments, toSnakeCase));
          if (data.categoryResults?.length) await sb.from('category_results').upsert(mapKeys(data.categoryResults, toSnakeCase));
          if (data.p5Assessments?.length) await sb.from('p5_assessments').upsert(mapKeys(data.p5Assessments, toSnakeCase));
          if (data.reflections?.length) await sb.from('reflections').upsert(mapKeys(data.reflections, toSnakeCase));
          if (data.reflectionAnswers?.length) await sb.from('reflection_answers').upsert(mapKeys(data.reflectionAnswers, toSnakeCase));
          if (data.notes?.length) await sb.from('notes').upsert(mapKeys(data.notes, toSnakeCase));
          if (data.attendance?.length) await sb.from('attendance').upsert(mapKeys(data.attendance, toSnakeCase));

          return { status: 'success' };
      } catch (e: any) {
          console.error("Restore Error:", e);
          return { status: 'error', message: e.message };
      }
  },

  // --- STORAGE OPERATION ---
  async uploadImage(file: Blob, folder: 'students' | 'school', fileNameProp?: string): Promise<string | null> {
    const sb = initSupabase();
    if (!sb) return null;

    try {
        const fileExt = file.type.split('/')[1] || 'jpg';
        const uniqueName = fileNameProp || `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const filePath = `${folder}/${uniqueName}`;

        const { error: uploadError } = await sb.storage
            .from('images')
            .upload(filePath, file, { cacheControl: '3600', upsert: true });

        if (uploadError) throw uploadError;

        const { data } = sb.storage.from('images').getPublicUrl(filePath);
        return data.publicUrl;

    } catch (error: any) {
        console.warn("Storage upload error (likely RLS)", error);
        return null;
    }
  },

  // --- SUPABASE OPERATIONS ---
  async supabaseOp(op: 'insert'|'update'|'delete'|'upsert', collection: string, data: any): Promise<ApiResponse> {
    const sb = initSupabase();
    // Jika sb null, berarti config URL/Key kosong
    if (!sb) {
        return { status: 'error', message: 'Koneksi Database belum disetting (URL/Key kosong)' };
    }

    let tableName = toSnakeCase(collection);
    if (collection === 'TPs') tableName = 'tps';
    
    const dbData = op === 'delete' ? null : mapKeys(data, toSnakeCase);

    try {
        let query = sb.from(tableName);
        let error = null;

        if (op === 'insert') {
            const { error: e } = await query.insert(dbData);
            error = e;
        } else if (op === 'update') {
            const { error: e } = await query.update(dbData).eq('id', data.id);
            error = e;
        } else if (op === 'upsert') {
            const { error: e } = await query.upsert(dbData);
            error = e;
        } else if (op === 'delete') {
            const { error: e } = await query.delete().eq('id', data.id);
            error = e;
        }

        if (error) throw error;
        return { status: 'success' };
    } catch (e: any) {
        // PERBAIKAN PESAN ERROR FETCH
        let msg = e.message || "Database Error";
        if (msg.includes("Failed to fetch")) {
            msg = "Gagal terhubung ke Server Database (Failed to fetch). Periksa URL Database atau Koneksi Internet Anda.";
        }
        return { status: 'error', message: msg };
    }
  }
};