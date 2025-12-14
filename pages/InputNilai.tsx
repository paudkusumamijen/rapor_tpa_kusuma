import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AssessmentLevel, TPType } from '../types';
import { TP_CATEGORIES } from '../constants';
import { generateCategoryDescription } from '../services/geminiService';
import { Save, Loader2, Sparkles, Filter, Edit3 } from 'lucide-react';

// Fungsi helper untuk membersihkan tag HTML dari data lama (hasil Quill) agar rapi di Textarea
const cleanHtml = (html: string) => {
    if (!html) return "";
    let text = html.replace(/<\/p>/gi, '\n').replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<[^>]+>/g, '');
    text = text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    return text.trim();
};

const InputNilai: React.FC = () => {
  const { students, classes, tps, assessments, categoryResults, upsertAssessment, upsertCategoryResult, settings } = useApp();
  
  // Use Dynamic Categories from Settings
  const activeCategories = settings.assessmentCategories && settings.assessmentCategories.length > 0 
    ? settings.assessmentCategories 
    : TP_CATEGORIES;

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  
  // State Active Category (String)
  const [activeCategory, setActiveCategory] = useState<string>(activeCategories[0] || TPType.QURAN);
  
  // Update activeCategory jika list kategori berubah (misal setelah edit di settings)
  useEffect(() => {
      if (!activeCategories.includes(activeCategory)) {
          setActiveCategory(activeCategories[0] || '');
      }
  }, [activeCategories]);

  // State Lokal untuk menampung nilai sementara sebelum disimpan
  const [tempScores, setTempScores] = useState<Record<string, AssessmentLevel>>({});
  
  const [teacherKeywords, setTeacherKeywords] = useState('');
  const [finalDescription, setFinalDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredStudents = selectedClassId 
    ? students.filter(s => String(s.classId) === String(selectedClassId)) 
    : [];

  const selectedStudent = students.find(s => String(s.id) === String(selectedStudentId));
  
  const categoryTps = selectedStudent 
    ? tps.filter(t => t.category === activeCategory && String(t.classId) === String(selectedStudent.classId))
    : [];

  useEffect(() => {
    if (selectedStudentId && activeCategory) {
        // 1. Load Scores (Assessments)
        const scores: Record<string, AssessmentLevel> = {};
        categoryTps.forEach(tp => {
            const existing = assessments.find(a => String(a.studentId) === String(selectedStudentId) && String(a.tpId) === String(tp.id));
            if (existing) scores[tp.id] = existing.score;
        });
        setTempScores(scores);

        // 2. Load Description (CategoryResult)
        const res = categoryResults.find(r => String(r.studentId) === String(selectedStudentId) && r.category === activeCategory);
        if (res) {
            setTeacherKeywords(res.teacherNote || '');
            const desc = res.generatedDescription || '';
            setFinalDescription(desc.includes('<') ? cleanHtml(desc) : desc);
        } else {
            setTeacherKeywords('');
            setFinalDescription('');
        }
    }
  }, [selectedStudentId, activeCategory, assessments, categoryResults]); 

  const handleScoreChange = (tpId: string, score: AssessmentLevel) => {
      setTempScores(prev => ({ ...prev, [tpId]: score }));
  };

  const handleGenerateAI = async () => {
    if (!selectedStudent) return;
    
    const assessmentsPayload = categoryTps
        .filter(tp => tempScores[tp.id]) 
        .map(tp => ({
            tp: tp.description,
            activity: tp.activity,
            score: tempScores[tp.id]
        }));

    if (assessmentsPayload.length === 0) {
        alert("Mohon isi nilai TP pada tabel di atas terlebih dahulu.");
        return;
    }

    setIsGenerating(true);
    try {
        const result = await generateCategoryDescription(
            selectedStudent.name,
            activeCategory,
            assessmentsPayload,
            teacherKeywords,
            settings.aiApiKey || "",
            settings.aiProvider || 'groq'
        );
        setFinalDescription(result);
    } catch (e) {
        alert("Gagal menyusun narasi.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleGenerateTemplate = () => {
    if (!selectedStudent) return;
    
    const assessmentsPayload = categoryTps
        .filter(tp => tempScores[tp.id]) 
        .map(tp => ({
            tp: tp.description,
            activity: tp.activity,
            score: tempScores[tp.id]
        }));

    if (assessmentsPayload.length === 0) {
        alert("Mohon isi nilai TP pada tabel di atas terlebih dahulu.");
        return;
    }

    import('../services/geminiService').then(module => {
        const result = module.generateTemplateDescription(selectedStudent.name, activeCategory, assessmentsPayload);
        setFinalDescription(result);
    });
  };

  const handleSaveAll = async () => {
      if (!selectedStudentId) return;

      for (const tp of categoryTps) {
          const score = tempScores[tp.id];
          if (score) {
              await upsertAssessment({
                  id: `${selectedStudentId}-${tp.id}`,
                  studentId: selectedStudentId,
                  tpId: tp.id,
                  score: score,
                  semester: settings.semester,
                  academicYear: settings.academicYear
              });
          }
      }

      if (finalDescription) {
          await upsertCategoryResult({
              id: `${selectedStudentId}-${activeCategory}`,
              studentId: selectedStudentId,
              category: activeCategory,
              teacherNote: teacherKeywords,
              generatedDescription: finalDescription,
              semester: settings.semester,
              academicYear: settings.academicYear
          });
      }

      alert("Data Penilaian & Deskripsi berhasil disimpan!");
  };

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Input Nilai & Deskripsi</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2"><Filter size={16} /> Filter Kelas:</label>
                <select className="w-full p-2 border rounded-lg text-slate-800 bg-white" value={selectedClassId} onChange={e => { setSelectedClassId(e.target.value); setSelectedStudentId(''); }}>
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Pilih Siswa:</label>
                <select className="w-full p-2 border rounded-lg text-slate-800 bg-white disabled:bg-slate-100" value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} disabled={!selectedClassId}>
                    <option value="">-- Pilih Siswa --</option>
                    {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>
        </div>
      </div>

      {selectedStudentId ? (
        <div className="flex-1 flex flex-col">
            {/* DYNAMIC CATEGORY TABS */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                {activeCategories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${
                            activeCategory === cat 
                            ? 'bg-teal-600 text-white shadow' 
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex-1 overflow-auto">
                <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b">{activeCategory}</h2>

                {categoryTps.length === 0 ? (
                    <div className="text-center p-8 text-slate-400 bg-slate-50 rounded-lg">
                        <p>Belum ada Tujuan Pembelajaran (TP) untuk kelas dan kategori ini.</p>
                        <p className="text-sm mt-2">Pastikan Anda sudah menginput TP pada menu "Input TP" dan memilih kelas yang sesuai ({classes.find(c => c.id === selectedClassId)?.name}).</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto mb-8 border rounded-lg">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-xs">
                                    <tr>
                                        <th className="p-3 border-b border-r w-1/3">Tujuan Pembelajaran (TP)</th>
                                        <th className="p-3 border-b border-r w-1/3">Aktivitas</th>
                                        <th className="p-3 border-b text-center">Dimensi Kemandirian (Nilai)</th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-700">
                                    {categoryTps.map(tp => (
                                        <tr key={tp.id} className="border-b hover:bg-slate-50">
                                            <td className="p-3 border-r align-top">{tp.description}</td>
                                            <td className="p-3 border-r align-top text-slate-500">{tp.activity}</td>
                                            <td className="p-3 align-top">
                                                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                                    {[1, 2, 3].map(val => (
                                                        <label key={val} className={`cursor-pointer px-3 py-2 rounded border text-xs font-bold text-center flex-1 transition-all ${
                                                            tempScores[tp.id] === val 
                                                            ? 'bg-indigo-100 border-indigo-500 text-indigo-700' 
                                                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                                        }`}>
                                                            <input 
                                                                type="radio" 
                                                                name={`tp-${tp.id}`} 
                                                                value={val} 
                                                                checked={tempScores[tp.id] === val}
                                                                onChange={() => handleScoreChange(tp.id, val as AssessmentLevel)}
                                                                className="hidden"
                                                            />
                                                            {val === 1 ? 'Berkembang' : val === 2 ? 'Cakap' : 'Mahir'}
                                                        </label>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Sparkles size={18} className="text-indigo-600"/> Susun Deskripsi Narasi</h3>
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Kata Kunci / Catatan Guru (Opsional)</label>
                                    <textarea 
                                        className="w-full p-3 border rounded-lg bg-white text-slate-800 text-sm h-32 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Contoh: Ananda sangat antusias saat praktik sholat, perlu motivasi saat berbagi mainan..."
                                        value={teacherKeywords}
                                        onChange={e => setTeacherKeywords(e.target.value)}
                                    />
                                    <div className="mt-3 flex gap-2 flex-col lg:flex-row">
                                        <button 
                                            onClick={handleGenerateAI}
                                            disabled={isGenerating}
                                            className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold shadow hover:bg-indigo-700 flex justify-center items-center gap-2 text-sm"
                                        >
                                            {isGenerating ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>}
                                            {isGenerating ? "Sedang Menyusun..." : `Susun Narasi Otomatis`}
                                        </button>
                                        <button 
                                            onClick={handleGenerateTemplate}
                                            className="flex-1 bg-white border border-slate-300 text-slate-700 py-2 rounded-lg font-bold hover:bg-slate-50 flex justify-center items-center gap-2 text-sm"
                                        >
                                            Gunakan Template
                                        </button>
                                    </div>
                                    {!settings.aiApiKey && (
                                        <p className="text-xs text-orange-600 mt-2 text-center">
                                            *Kode Lisensi Layanan belum disetting. Gunakan Template Offline atau atur di Pengaturan.
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Deskripsi Rapor</label>
                                    <div className="flex-1">
                                         <textarea 
                                            value={finalDescription} 
                                            onChange={(e) => setFinalDescription(e.target.value)} 
                                            className="w-full p-3 border rounded-lg bg-white text-slate-800 h-64 focus:ring-2 focus:ring-teal-500 outline-none leading-relaxed resize-none text-sm"
                                            placeholder="Hasil deskripsi akan muncul di sini. Silakan edit teks sesuai kebutuhan..."
                                         />
                                         <p className="text-xs text-slate-400 mt-2 text-right">Tekan Enter untuk baris baru.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end border-t pt-4">
                            <button 
                                onClick={handleSaveAll}
                                className="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-teal-700 flex items-center gap-2 transform active:scale-95 transition-all"
                            >
                                <Save size={20}/> Simpan Nilai & Deskripsi {activeCategory}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-300 rounded-xl m-4 bg-slate-50">
             <Edit3 size={48} className="mb-2 opacity-30"/>
             <p className="font-medium">Pilih Siswa untuk Memulai Penilaian</p>
        </div>
      )}
    </div>
  );
};

export default InputNilai;