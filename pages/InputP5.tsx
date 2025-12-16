import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useLocation } from 'react-router-dom';
import { P5Criteria, AssessmentLevel } from '../types';
import { generateP5Description } from '../services/geminiService';
import { Save, Filter, Sparkles, Loader2, X, CheckCircle } from 'lucide-react';
import { LEVEL_LABELS } from '../constants';

export default function InputP5() {
  const { p5Criteria, students, classes, p5Assessments, upsertP5Assessment, settings } = useApp();
  const location = useLocation(); // Hook untuk terima state navigasi
  
  // State for Assessment
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [activeCritId, setActiveCritId] = useState<string | null>(null);
  
  // Form State
  const [currentScore, setCurrentScore] = useState<AssessmentLevel>(AssessmentLevel.BERKEMBANG);
  const [teacherNote, setTeacherNote] = useState('');
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // New: Saving state
  const [showToast, setShowToast] = useState(false); // State for toast notification

  // --- HANDLE NAVIGATION STATE (DEEP LINKING) ---
  useEffect(() => {
      if (location.state) {
          const { classId, studentId } = location.state as { classId: string; studentId: string };
          if (classId) setSelectedClassId(classId);
          if (studentId) setSelectedStudentId(studentId);
          // Clear history state
          window.history.replaceState({}, document.title);
      }
  }, []);

  // Hide toast after 3 seconds
  useEffect(() => {
      if (showToast) {
          const timer = setTimeout(() => setShowToast(false), 3000);
          return () => clearTimeout(timer);
      }
  }, [showToast]);

  // Filters
  const filteredStudents = selectedClassId ? students.filter(s => String(s.classId) === String(selectedClassId)) : [];
  const selectedStudent = students.find(s => String(s.id) === String(selectedStudentId));
  
  // Criteria filtering: Use student's class
  const assessmentCriteria = selectedStudent ? p5Criteria.filter(c => String(c.classId) === String(selectedStudent.classId)) : [];

  const handleOpenAssessment = (crit: P5Criteria) => {
    setActiveCritId(crit.id);
    const existing = p5Assessments.find(a => String(a.studentId) === String(selectedStudentId) && String(a.criteriaId) === String(crit.id));
    if (existing) { 
        setCurrentScore(existing.score); 
        setTeacherNote(existing.teacherNote || ''); 
        setDescription(existing.generatedDescription || ''); 
    } else { 
        setCurrentScore(AssessmentLevel.BERKEMBANG); 
        setTeacherNote(''); 
        setDescription(''); 
    }
  };

  const handleGenerateAI = async (subDimension: string) => {
      if (!selectedStudent) return;
      if (!teacherNote) { alert("Mohon isi 'Kata Kunci Kegiatan' terlebih dahulu agar untuk membuat deskripsi yang sesuai."); return; }
      setIsGenerating(true);
      try {
          const res = await generateP5Description(
              selectedStudent.name, 
              subDimension, 
              currentScore, 
              teacherNote,
              settings.aiApiKey || "",
              settings.aiProvider || 'groq'
          );
          if (res.startsWith("Error")) { alert(res); } else { setDescription(res); }
      } catch (e) { alert("Gagal menghubungi Layanan Cerdas. Periksa koneksi internet."); } finally { setIsGenerating(false); }
  };

  const handleGenerateTemplate = (subDimension: string) => {
      if (!selectedStudent) return;
      const res = `Ananda ${selectedStudent.name} ${currentScore === 3 ? 'sangat berkembang' : currentScore === 2 ? 'berkembang sesuai harapan' : 'mulai berkembang'} dalam ${subDimension}. ${teacherNote}`;
      setDescription(res);
  };

  const handleSaveAssessment = async () => {
    if (!selectedStudentId || !activeCritId) return;

    // VALIDASI KELENGKAPAN
    if (!teacherNote.trim() || !description.trim()) {
        alert("Penilaian belum lengkap!\n\nKata Kunci dan Hasil Deskripsi wajib diisi sebelum menyimpan.");
        return;
    }

    setIsSaving(true);
    
    try {
        await upsertP5Assessment({
            id: `${selectedStudentId}-${activeCritId}`, 
            studentId: selectedStudentId, 
            criteriaId: activeCritId, 
            score: currentScore, 
            teacherNote: teacherNote, 
            generatedDescription: description
        });
        
        // Show success toast
        setShowToast(true);
        setActiveCritId(null);
    } catch (error) {
        alert("Gagal menyimpan data.");
        console.error(error);
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="relative h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Input Nilai Kokulikuler</h1>
      </div>

      {/* TOAST NOTIFICATION */}
      {showToast && (
          <div className="fixed top-20 right-4 z-50 bg-purple-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-10 duration-300">
              <CheckCircle size={24} className="text-purple-200" />
              <div>
                  <h4 className="font-bold text-lg">Berhasil Disimpan!</h4>
                  <p className="text-purple-100 text-sm">Nilai Kokulikuler tersimpan.</p>
              </div>
          </div>
      )}

      <div className="space-y-6">
             {/* Filters */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                            <Filter size={16}/> Filter Kelas
                        </label>
                        <select 
                            className="w-full p-2 border rounded-lg bg-white text-slate-800" 
                            value={selectedClassId} 
                            onChange={e => { setSelectedClassId(e.target.value); setSelectedStudentId(''); setActiveCritId(null); }}
                        >
                            <option value="">-- Pilih Kelas --</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Pilih Siswa</label>
                        <select 
                            className="w-full p-2 border rounded-lg bg-white text-slate-800 disabled:bg-slate-100 disabled:text-slate-400" 
                            value={selectedStudentId} 
                            onChange={e => { setSelectedStudentId(e.target.value); setActiveCritId(null); }} 
                            disabled={!selectedClassId}
                        >
                            <option value="">-- Pilih Siswa --</option>
                            {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                 </div>
             </div>
             
             {/* List Criteria & Input Area */}
             {selectedStudentId ? (
                 <div className="space-y-4">
                    <h3 className="font-bold text-lg text-slate-800 border-b pb-2">
                        Daftar Sub Dimensi Kokulikuler ({classes.find(c => c.id === selectedClassId)?.name})
                    </h3>
                    
                    {assessmentCriteria.length > 0 ? (
                        assessmentCriteria.map(c => {
                            const isEditingThis = activeCritId === c.id;
                            const existing = p5Assessments.find(a => String(a.studentId) === String(selectedStudentId) && String(a.criteriaId) === String(c.id));
                            
                            if (!isEditingThis) {
                                return (
                                    <div key={c.id} className={`bg-white rounded-xl border shadow-sm p-5 flex justify-between items-center transition-all ${existing ? 'border-l-4 border-l-purple-500' : 'border-slate-200'}`}>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-lg">{c.subDimension}</h4>
                                            {existing ? (
                                                <div className="mt-2 text-sm text-slate-600">
                                                    <span className="inline-block bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-bold mr-2">
                                                        {existing.score === 1 ? 'Berkembang' : existing.score === 2 ? 'Cakap' : 'Mahir'}
                                                    </span>
                                                    <span className="italic">"{existing.generatedDescription?.substring(0, 60)}..."</span>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-slate-400 mt-1">Belum dinilai</p>
                                            )}
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => handleOpenAssessment(c)} 
                                            className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${existing ? 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50' : 'bg-indigo-600 text-white border-transparent hover:bg-indigo-700'}`}
                                        >
                                            {existing ? 'Edit Nilai' : 'Input Nilai'}
                                        </button>
                                    </div>
                                );
                            }
                            
                            // FORM INPUT
                            return (
                                <div key={c.id} className="bg-white rounded-xl border-2 border-indigo-500 shadow-lg p-6 relative animate-in fade-in zoom-in-95 duration-200">
                                    <button type="button" onClick={() => setActiveCritId(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                                        <X size={24}/>
                                    </button>
                                    
                                    <h4 className="font-bold text-xl text-indigo-700 mb-6">{c.subDimension}</h4>
                                    
                                    <div className="space-y-6">
                                        {/* 1. Score Selection */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">1. Pilih Tingkat Pencapaian</label>
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                {[AssessmentLevel.BERKEMBANG, AssessmentLevel.CAKAP, AssessmentLevel.MAHIR].map(val => (
                                                    <button 
                                                        type="button" 
                                                        key={val} 
                                                        onClick={() => setCurrentScore(val)} 
                                                        className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all ${currentScore === val ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-inner' : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-300'}`}
                                                    >
                                                        {LEVEL_LABELS[val]}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 2. Teacher Note */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide flex justify-between">
                                                <span>2. Kata Kunci Kegiatan / Perilaku <span className="text-red-500">*</span></span>
                                            </label>
                                            <input 
                                                className={`w-full p-3 border rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none ${!teacherNote ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-300'}`}
                                                placeholder="Contoh: mau berbagi mainan..." 
                                                value={teacherNote} 
                                                onChange={e => setTeacherNote(e.target.value)} 
                                            />
                                            {!teacherNote && <p className="text-xs text-red-500 mt-1">Wajib diisi</p>}
                                            <p className="text-xs text-slate-500 mt-1">*Digunakan untuk membuat narasi yang akurat.</p>
                                        </div>

                                        {/* 3. Generate AI */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">3. Buat Deskripsi Otomatis</label>
                                            <div className="flex gap-2">
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleGenerateAI(c.subDimension)} 
                                                    disabled={!teacherNote || isGenerating} 
                                                    className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 font-bold text-white shadow-md transition-all ${!teacherNote ? 'bg-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'}`}
                                                >
                                                    {isGenerating ? <Loader2 size={18} className="animate-spin"/> : <Sparkles size={18}/>} 
                                                    {isGenerating ? 'Menyusun...' : 'Susun Narasi Otomatis'}
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleGenerateTemplate(c.subDimension)} 
                                                    className="px-4 py-3 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 text-sm"
                                                >
                                                    Offline
                                                </button>
                                            </div>
                                        </div>

                                        {/* 4. Result Textarea */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide flex justify-between">
                                                <span>4. Hasil Deskripsi (Bisa Diedit) <span className="text-red-500">*</span></span>
                                                {!description && <span className="text-xs text-red-500 font-normal">Wajib diisi</span>}
                                            </label>
                                            <textarea 
                                                className={`w-full p-3 border rounded-lg bg-white text-slate-800 h-32 leading-relaxed focus:ring-2 focus:ring-teal-500 outline-none ${!description ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-300'}`}
                                                value={description} 
                                                onChange={e => setDescription(e.target.value)} 
                                                placeholder="Hasil narasi akan muncul di sini..." 
                                            />
                                        </div>

                                        {/* Save Button */}
                                        <div className="flex justify-end pt-4 border-t border-slate-100">
                                            <button 
                                                type="button" 
                                                onClick={handleSaveAssessment} 
                                                disabled={isSaving}
                                                className="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700 shadow-lg flex items-center gap-2 transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isSaving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>}
                                                {isSaving ? 'Menyimpan...' : 'Simpan Penilaian'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : ( 
                        <div className="text-center p-8 bg-orange-50 rounded-xl border border-orange-200">
                            <p className="text-orange-800 font-medium">Belum ada data Sub Dimensi untuk kelas ini.</p>
                            <p className="text-sm mt-2 text-orange-600">Silakan masuk ke menu "Data Master Data Kokulikuler" untuk menambahkan data.</p>
                        </div> 
                    )}
                 </div>
             ) : ( 
                 <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 text-slate-400">
                     <Filter size={48} className="mb-4 opacity-30"/>
                     <p className="text-lg font-medium">Pilih Siswa Terlebih Dahulu</p>
                 </div> 
             )}
      </div>
    </div>
  );
}