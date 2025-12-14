import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { SchoolSettings } from '../types';
import { SUPABASE_URL, SUPABASE_KEY } from '../constants';
import { resetSupabaseClient, sheetService } from '../services/sheetService';
import { Save, Database, RefreshCw, Upload, Image as ImageIcon, Trash2, Lock, Flame, CheckCircle2, Sparkles, Key, AlertCircle, Cpu, ShieldCheck, Edit, Loader2, Download, RefreshCcw, FileUp, Smartphone, Printer } from 'lucide-react';

const Pengaturan: React.FC = () => {
  const { settings, setSettings, refreshData, isLoading, isOnline, handleBackup, handleRestore, handleResetSystem, confirmAction } = useApp();
  const [formData, setFormData] = useState<SchoolSettings>(settings);
  
  // States for DB Config (Supabase URL/Key must still be handled locally/env as they are needed to connect)
  const [sbUrl, setSbUrl] = useState('');
  const [sbKey, setSbKey] = useState('');

  const [connStatus, setConnStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // Upload States
  const [isUploadingAppLogo, setIsUploadingAppLogo] = useState(false);
  const [isUploadingReportLogo, setIsUploadingReportLogo] = useState(false);
  
  const appLogoInputRef = useRef<HTMLInputElement>(null);
  const reportLogoInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  // Cek apakah konfigurasi Supabase sudah ditanam (via Env Vars)
  const isHardcodedSb = !!SUPABASE_URL && !!SUPABASE_KEY;
  // Cek apakah Database sudah terkonfigurasi (baik hardcode maupun localstorage)
  const isDbConfigured = isHardcodedSb || (!!sbUrl && !!sbKey);

  // Cek apakah AI sudah disetting
  const isAiConfigured = !!settings.aiApiKey;
  // Mode edit untuk AI (jika user ingin mengubah key yang sudah ada)
  const [isEditingAi, setIsEditingAi] = useState(false);

  useEffect(() => { setFormData(settings); }, [settings]);
  
  // Load Supabase config from localStorage or constants
  useEffect(() => {
    // Jika Hardcoded, paksa pakai Env Var
    if (isHardcodedSb) {
        setSbUrl(SUPABASE_URL);
        setSbKey(SUPABASE_KEY);
    } else {
        const storedSbUrl = localStorage.getItem('supabase_url') || '';
        const storedSbKey = localStorage.getItem('supabase_key') || '';
        setSbUrl(storedSbUrl);
        setSbKey(storedSbKey);
    }
  }, [isHardcodedSb]);

  const handleChange = (field: keyof SchoolSettings, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Generic Logo Uploader
  const handleGenericLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, targetField: 'appLogoUrl' | 'reportLogoUrl') => {
    const file = e.target.files?.[0];
    const isApp = targetField === 'appLogoUrl';
    const setUploading = isApp ? setIsUploadingAppLogo : setIsUploadingReportLogo;

    if (file) {
      if (file.size > 2 * 1024 * 1024) { alert("Ukuran file maksimal 2MB"); return; }
      
      setUploading(true);
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
             const img = new Image();
             img.src = event.target.result as string;
             img.onload = async () => {
                 const canvas = document.createElement('canvas');
                 const ctx = canvas.getContext('2d');
                 const maxSize = 300;
                 let width = img.width; let height = img.height;
                 if (width > height) { if (width > maxSize) { height *= maxSize / width; width = maxSize; } } 
                 else { if (height > maxSize) { width *= maxSize / height; height = maxSize; } }
                 canvas.width = width; canvas.height = height;
                 ctx?.drawImage(img, 0, 0, width, height);
                 
                 // Pre-generate Base64 for fallback
                 const base64Url = canvas.toDataURL('image/jpeg', 0.8);

                 if (isOnline) {
                     canvas.toBlob(async (blob) => {
                         if (blob) {
                             const prefix = isApp ? 'app_logo' : 'report_logo';
                             const publicUrl = await sheetService.uploadImage(blob, 'school', `${prefix}_${Date.now()}.jpg`);
                             if (publicUrl) {
                                 setFormData(prev => ({ ...prev, [targetField]: publicUrl }));
                             } else {
                                 // Fallback to Base64
                                 console.warn("Upload failed (RLS or Network), using Base64 fallback.");
                                 setFormData(prev => ({ ...prev, [targetField]: base64Url }));
                             }
                             setUploading(false);
                         }
                     }, 'image/jpeg', 0.8);
                 } else {
                     // Offline Fallback
                     setFormData(prev => ({ ...prev, [targetField]: base64Url }));
                     setUploading(false);
                 }
             };
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          handleRestore(file);
      }
      if (backupInputRef.current) backupInputRef.current.value = '';
  };

  const onResetClick = async () => {
      const isConfirmed = await confirmAction("PERINGATAN BAHAYA!\n\nAnda akan menghapus SELURUH DATA SISWA, KELAS, DAN NILAI untuk memulai Tahun Ajaran Baru.\n\nData yang dihapus TIDAK BISA DIKEMBALIKAN kecuali Anda sudah melakukan BACKUP.\n\nApakah Anda yakin ingin melanjutkan?");
      if (isConfirmed) {
           const keepTPs = window.confirm("Apakah Anda ingin tetap menyimpan Data Tujuan Pembelajaran (TP)?\n\nKlik OK untuk Menyimpan TP.\nKlik Cancel untuk Menghapus TP juga.");
           handleResetSystem(keepTPs);
      }
  };

  const handleSaveSettings = async () => {
    // Jika user mengupdate salah satu logo, pastikan logoUrl (legacy) juga terisi 
    // (prioritaskan reportLogoUrl, lalu appLogoUrl)
    const legacyLogo = formData.reportLogoUrl || formData.appLogoUrl || formData.logoUrl;
    
    await setSettings({
        ...formData,
        logoUrl: legacyLogo // Keep backward compatibility
    });
    
    setIsEditingAi(false); 
    alert("Semua Pengaturan berhasil disimpan ke Database!");
  };

  const handleSaveDbConfig = async () => {
      if (isHardcodedSb) return;
      localStorage.setItem('supabase_url', sbUrl);
      localStorage.setItem('supabase_key', sbKey);
      
      // Reset client Supabase agar menggunakan config baru
      resetSupabaseClient();
      
      alert("Konfigurasi Database disimpan! Mencoba terhubung...");
      await testConnection();
  };

  const handleClearData = () => {
      if (confirm("PERINGATAN: Ini akan menghapus koneksi database dari browser ini. Anda harus memasukkan URL & Key lagi nanti. Lanjutkan?")) {
          localStorage.removeItem('supabase_url');
          localStorage.removeItem('supabase_key');
          
          resetSupabaseClient();
          
          alert("Konfigurasi lokal dihapus. Browser akan dimuat ulang.");
          window.location.reload(); 
      }
  };

  const testConnection = async () => {
      setConnStatus('idle');
      try {
          await refreshData();
          setConnStatus('success');
          alert("Koneksi Database Berhasil!");
      } catch (e) {
          setConnStatus('error');
          alert("Gagal terhubung ke Database. Periksa URL dan Key Anda.");
      }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Pengaturan Aplikasi</h1>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* --- KOLOM KIRI: Identitas Sekolah --- */}
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Database size={20} className="text-indigo-600"/> Identitas Sekolah
                </h2>
                <div className="space-y-4">
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Nama Satuan PAUD</label><input className="w-full p-2 border rounded bg-white text-slate-800" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} /></div>
                    <div className="flex gap-4">
                        <div className="w-1/2"><label className="block text-sm font-medium text-slate-700 mb-1">NPSN</label><input className="w-full p-2 border rounded bg-white text-slate-800" value={formData.npsn || ''} onChange={e => handleChange('npsn', e.target.value)} /></div>
                        <div className="w-1/2"><label className="block text-sm font-medium text-slate-700 mb-1">Kode Pos</label><input className="w-full p-2 border rounded bg-white text-slate-800" value={formData.postalCode || ''} onChange={e => handleChange('postalCode', e.target.value)} /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Alamat Lengkap</label><textarea className="w-full p-2 border rounded bg-white text-slate-800" rows={2} value={formData.address || ''} onChange={e => handleChange('address', e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Desa / Kelurahan</label><input className="w-full p-2 border rounded bg-white text-slate-800" value={formData.village || ''} onChange={e => handleChange('village', e.target.value)} /></div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Kecamatan</label><input className="w-full p-2 border rounded bg-white text-slate-800" value={formData.district || ''} onChange={e => handleChange('district', e.target.value)} /></div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Kabupaten / Kota</label><input className="w-full p-2 border rounded bg-white text-slate-800" value={formData.regency || ''} onChange={e => handleChange('regency', e.target.value)} /></div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Provinsi</label><input className="w-full p-2 border rounded bg-white text-slate-800" value={formData.province || ''} onChange={e => handleChange('province', e.target.value)} /></div>
                    </div>
                </div>
            </div>

            {/* --- LOGO SETTINGS --- */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <ImageIcon size={20} className="text-pink-600"/> Pengaturan Logo
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* LOGO APLIKASI */}
                    <div className="flex flex-col items-center p-4 border border-slate-100 rounded-xl bg-slate-50">
                        <span className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                            <Smartphone size={14}/> Logo Aplikasi
                        </span>
                        <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-white overflow-hidden relative mb-3">
                             {isUploadingAppLogo && (
                                 <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
                                     <Loader2 className="animate-spin text-white" size={24} />
                                 </div>
                             )}
                            {formData.appLogoUrl || formData.logoUrl ? (
                                <img src={formData.appLogoUrl || formData.logoUrl} alt="App Logo" className="w-full h-full object-contain" />
                            ) : (
                                <span className="text-xs text-slate-400 text-center">No Logo</span>
                            )}
                        </div>
                        <input type="file" ref={appLogoInputRef} className="hidden" accept="image/*" onChange={(e) => handleGenericLogoUpload(e, 'appLogoUrl')} />
                        <div className="flex gap-2">
                             <button onClick={() => appLogoInputRef.current?.click()} disabled={isUploadingAppLogo} className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium hover:bg-slate-50 flex items-center gap-1 disabled:opacity-50">
                                <Upload size={12}/> Upload
                             </button>
                             {formData.appLogoUrl && (
                                <button onClick={() => setFormData(prev => ({ ...prev, appLogoUrl: '' }))} className="px-2 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100"><Trash2 size={12}/></button>
                             )}
                        </div>
                    </div>

                    {/* LOGO RAPOR */}
                    <div className="flex flex-col items-center p-4 border border-slate-100 rounded-xl bg-slate-50">
                        <span className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                            <Printer size={14}/> Logo Cetak Rapor
                        </span>
                        <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-white overflow-hidden relative mb-3">
                             {isUploadingReportLogo && (
                                 <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
                                     <Loader2 className="animate-spin text-white" size={24} />
                                 </div>
                             )}
                            {formData.reportLogoUrl || formData.logoUrl ? (
                                <img src={formData.reportLogoUrl || formData.logoUrl} alt="Report Logo" className="w-full h-full object-contain" />
                            ) : (
                                <span className="text-xs text-slate-400 text-center">No Logo</span>
                            )}
                        </div>
                        <input type="file" ref={reportLogoInputRef} className="hidden" accept="image/*" onChange={(e) => handleGenericLogoUpload(e, 'reportLogoUrl')} />
                        <div className="flex gap-2">
                             <button onClick={() => reportLogoInputRef.current?.click()} disabled={isUploadingReportLogo} className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium hover:bg-slate-50 flex items-center gap-1 disabled:opacity-50">
                                <Upload size={12}/> Upload
                             </button>
                             {formData.reportLogoUrl && (
                                <button onClick={() => setFormData(prev => ({ ...prev, reportLogoUrl: '' }))} className="px-2 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100"><Trash2 size={12}/></button>
                             )}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-end">
                <button onClick={handleSaveSettings} disabled={isUploadingAppLogo || isUploadingReportLogo} className="bg-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-700 flex items-center gap-2 shadow-lg disabled:opacity-50">
                    <Save size={20}/> Simpan Data Sekolah
                </button>
            </div>
        </div>

        {/* --- KOLOM KANAN: Penandatangan & Koneksi --- */}
        <div className="space-y-6">
            
            {/* --- MANAJEMEN DATA (BACKUP/RESTORE) --- */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <RefreshCcw size={20} className="text-blue-500"/> Manajemen Data
                </h2>
                
                <div className="space-y-4">
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-800">
                        <p className="font-bold mb-1">Persiapan Tahun Ajaran Baru?</p>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>Lakukan <strong>Backup Data</strong> (Download JSON) terlebih dahulu untuk arsip.</li>
                            <li>Gunakan tombol <strong>Reset Data</strong> untuk menghapus siswa & nilai lama.</li>
                            <li>Gunakan <strong>Restore Data</strong> jika ingin mengembalikan data lama.</li>
                        </ul>
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="flex gap-2">
                             <button 
                                onClick={handleBackup}
                                className="flex-1 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-900 shadow-sm flex items-center justify-center gap-2"
                             >
                                 <Download size={16}/> Backup Data (JSON)
                             </button>
                             
                             <input type="file" ref={backupInputRef} className="hidden" accept=".json" onChange={handleRestoreFile} />
                             <button 
                                onClick={() => backupInputRef.current?.click()}
                                className="flex-1 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 shadow-sm flex items-center justify-center gap-2"
                             >
                                 <FileUp size={16}/> Restore Data
                             </button>
                        </div>
                        
                        <button 
                            onClick={onResetClick}
                            className="w-full bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-100 flex items-center justify-center gap-2 transition-colors"
                        >
                            <Trash2 size={16}/> Reset Data (Tahun Ajaran Baru)
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Penandatangan Rapor</h2>
                <div className="space-y-4">
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Nama Kepala Sekolah</label><input className="w-full p-2 border rounded bg-white text-slate-800" value={formData.headmaster || ''} onChange={e => handleChange('headmaster', e.target.value)} /></div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Semester</label><input className="w-full p-2 border rounded bg-white text-slate-800" value={formData.semester || ''} onChange={e => handleChange('semester', e.target.value)} /></div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Tahun Ajaran</label><input className="w-full p-2 border rounded bg-white text-slate-800" value={formData.academicYear || ''} onChange={e => handleChange('academicYear', e.target.value)} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Tempat Tgl Rapor</label><input className="w-full p-2 border rounded bg-white text-slate-800" value={formData.reportPlace || ''} onChange={e => handleChange('reportPlace', e.target.value)} /></div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Rapor</label><input type="date" className="w-full p-2 border rounded bg-white text-slate-800" value={formData.reportDate || ''} onChange={e => handleChange('reportDate', e.target.value)} /></div>
                    </div>
                </div>
            </div>

            {/* --- KONEKSI LAYANAN CERDAS (Database Stored) --- */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Cpu size={100} /></div>
                
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <Sparkles size={20} className="text-purple-500"/> Konfigurasi Layanan Penulisan
                </h2>
                
                <div className="relative z-10">
                    {/* TAMPILAN SUKSES / TERSEMBUNYI */}
                    {isAiConfigured && !isEditingAi ? (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-5 animate-in fade-in zoom-in-95 duration-300">
                             <div className="flex items-center justify-between mb-2">
                                 <div className="flex items-center gap-3">
                                     <div className="bg-green-100 p-2 rounded-full text-green-600">
                                         <ShieldCheck size={24} />
                                     </div>
                                     <div>
                                         <h3 className="font-bold text-green-800 text-lg">Layanan Siap Digunakan</h3>
                                         <p className="text-xs text-green-700 font-medium">
                                             Tipe Server: <span className="uppercase">{formData.aiProvider === 'gemini' ? 'Server A (Google)' : 'Server B (Groq)'}</span>
                                         </p>
                                     </div>
                                 </div>
                                 <button 
                                    onClick={() => setIsEditingAi(true)}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                                    title="Ubah Konfigurasi"
                                 >
                                     <Edit size={18} />
                                 </button>
                             </div>
                             <p className="text-xs text-green-600 ml-12">
                                 Kunci Lisensi tersimpan aman. Fitur penulisan otomatis dapat digunakan pada menu Input Nilai.
                             </p>
                        </div>
                    ) : (
                        /* TAMPILAN EDIT / INPUT */
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            {isEditingAi && (
                                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-xs text-yellow-800 mb-2 flex items-center justify-between">
                                    <span className="flex items-center gap-2"><AlertCircle size={14}/> Mode Edit Konfigurasi</span>
                                    <button onClick={() => setIsEditingAi(false)} className="text-slate-500 underline hover:text-slate-700">Batal</button>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Pilih Tipe Server</label>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setFormData(prev => ({...prev, aiProvider: 'groq'}))}
                                        className={`flex-1 py-2 px-3 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 transition-all ${formData.aiProvider === 'groq' ? 'bg-orange-600 text-white border-orange-600 shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        <Flame size={16}/> Server B (Gratis)
                                    </button>
                                    <button 
                                        onClick={() => setFormData(prev => ({...prev, aiProvider: 'gemini'}))}
                                        className={`flex-1 py-2 px-3 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 transition-all ${formData.aiProvider === 'gemini' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        <Sparkles size={16}/> Server A
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                    Kunci Lisensi / Kode Akses Layanan
                                </label>
                                <div className="relative">
                                    <Key size={14} className="absolute left-3 top-3 text-slate-400"/>
                                    <input 
                                        className="w-full p-2 pl-9 border rounded bg-white text-slate-800 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none" 
                                        placeholder="Masukkan kode lisensi..."
                                        value={formData.aiApiKey || ''} 
                                        onChange={e => handleChange('aiApiKey', e.target.value)} 
                                        type="password"
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <button onClick={handleSaveSettings} className="w-full bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-900 shadow-md">Simpan Konfigurasi</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- KONEKSI DATABASE (SUPABASE) --- */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Flame size={20} className="text-orange-500"/> Koneksi Database</h2>
                    {isHardcodedSb && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold flex items-center gap-1"><Lock size={10}/> Vercel Config</span>}
                </div>
                
                {isHardcodedSb ? (
                     // TAMPILAN SUKSES DATABASE (Hardcoded/Env Var)
                     <div className="bg-green-50 p-5 rounded-xl border border-green-200 text-green-800 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                             <div className="bg-green-100 p-2 rounded-full text-green-600">
                                 <CheckCircle2 size={24} />
                             </div>
                             <div>
                                 <h3 className="font-bold text-lg">Database Terhubung</h3>
                                 <p className="text-xs text-green-700">Mode: Environment Variable (Vercel)</p>
                             </div>
                        </div>
                        <p className="text-xs text-green-600 italic">
                            Koneksi diatur melalui pengaturan Vercel dan terkunci demi keamanan.
                        </p>
                     </div>
                ) : isDbConfigured ? (
                    // TAMPILAN SUKSES DATABASE (Manual Input)
                     <div className="bg-green-50 p-5 rounded-xl border border-green-200 text-green-800 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                             <div className="bg-green-100 p-2 rounded-full text-green-600">
                                 <CheckCircle2 size={24} />
                             </div>
                             <div>
                                 <h3 className="font-bold text-lg">Database Terhubung</h3>
                                 <p className="text-xs text-green-700">Mode: Manual (Browser Storage)</p>
                             </div>
                        </div>
                        <div className="mt-2 border-t border-green-200 pt-3 flex justify-between items-center">
                            <span className="text-xs text-green-600">Ingin mengganti database?</span>
                            <button 
                                onClick={handleClearData}
                                className="text-xs bg-white border border-green-300 px-3 py-1.5 rounded-lg font-bold text-green-700 hover:bg-green-50 shadow-sm"
                            >
                                Putuskan / Ganti
                            </button>
                        </div>
                     </div>
                ) : (
                    // TAMPILAN INPUT DATABASE
                    <div className="space-y-4">
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-xs text-yellow-800">
                             <p><strong>Catatan:</strong> URL & Key Database ini disimpan di Browser Anda agar bisa terhubung. Jangan bagikan ke orang lain.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Project URL</label>
                            <input className="w-full p-2 border rounded bg-slate-50 text-slate-800 text-sm font-mono" placeholder="https://xyz.supabase.co" value={sbUrl} onChange={e => setSbUrl(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Anon / Public Key</label>
                            <input className="w-full p-2 border rounded bg-slate-50 text-slate-800 text-sm font-mono" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..." value={sbKey} onChange={e => setSbKey(e.target.value)} />
                        </div>
                        <div className="flex gap-2 pt-2">
                             <button onClick={handleSaveDbConfig} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-900 flex-1">Simpan Koneksi DB</button>
                             <button onClick={testConnection} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 flex items-center gap-2"><RefreshCw size={14} className={isLoading ? 'animate-spin' : ''}/> Tes</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Pengaturan;