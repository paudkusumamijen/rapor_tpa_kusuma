import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LearningObjective, TPType } from '../types';
import { TP_CATEGORIES } from '../constants';
import { Trash2, Edit2, Plus, Filter, X, Save, ChevronDown, ChevronRight, BookOpen } from 'lucide-react';

const InputTP: React.FC = () => {
  const { tps, classes, addTp, updateTp, deleteTp, confirmAction } = useApp();
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<LearningObjective>>({ category: TPType.QURAN });

  // State untuk mengontrol Accordion (key: nama kategori, value: boolean true/false)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const filteredTps = selectedClassId 
    ? tps.filter(t => String(t.classId) === String(selectedClassId))
    : [];

  const handleOpenModal = (tp?: LearningObjective) => {
    if (!selectedClassId) { alert("Pilih kelas terlebih dahulu!"); return; }
    
    if (tp) {
      setIsEditing(tp.id);
      setFormData(tp);
    } else {
      setIsEditing(null);
      setFormData({ category: TPType.QURAN, description: '', activity: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
      setIsModalOpen(false);
      setIsEditing(null);
  };

  const handleSave = () => {
    if (!selectedClassId) { alert("Pilih kelas terlebih dahulu!"); return; }
    if (!formData.description || !formData.activity) { alert("TP dan Aktivitas wajib diisi"); return; }

    const dataToSave = { ...formData, classId: selectedClassId };

    if (isEditing) {
      updateTp({ ...dataToSave, id: isEditing } as LearningObjective);
    } else {
      addTp({ ...dataToSave, id: Date.now().toString() } as LearningObjective);
    }
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirmAction(`Apakah Anda yakin ingin menghapus Tujuan Pembelajaran ini? Data penilaian terkait mungkin akan hilang.`);
    if (isConfirmed) {
        deleteTp(String(id));
    }
  };

  const toggleCategory = (category: string) => {
      setExpandedCategories(prev => ({
          ...prev,
          [category]: !prev[category]
      }));
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
              <BookOpen className="text-teal-600" size={28} />
              {/* TITLE KEMBALI KE SEMULA */}
              <h1 className="text-2xl font-bold text-slate-800">Input Tujuan Pembelajaran (TP)</h1>
          </div>
          {selectedClassId && (
            <button 
                onClick={() => handleOpenModal()} 
                className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700 shadow-sm font-medium text-sm"
            >
                <Plus size={18} /> Tambah TP Baru
            </button>
          )}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Filter size={18} /> Pilih Kelas
          </label>
          <select 
            className="w-full md:w-1/2 p-2.5 border rounded-lg text-slate-800 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
            value={selectedClassId}
            onChange={e => { setSelectedClassId(e.target.value); }}
          >
              <option value="">-- Pilih Kelas untuk Mengelola TP --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
      </div>

      {selectedClassId ? (
        <div className="space-y-4">
            {TP_CATEGORIES.map(category => {
                const categoryTps = filteredTps.filter(t => t.category === category);
                const isOpen = expandedCategories[category];
                
                return (
                    <div key={category} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-200">
                        {/* Header Accordion */}
                        <div 
                            onClick={() => toggleCategory(category)}
                            className={`p-4 font-bold text-slate-700 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors ${isOpen ? 'bg-slate-50 border-b border-slate-200' : 'bg-white'}`}
                        >
                            <div className="flex items-center gap-3">
                                {isOpen ? <ChevronDown size={20} className="text-teal-600"/> : <ChevronRight size={20} className="text-slate-400"/>}
                                <span>{category}</span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded border font-normal ${categoryTps.length > 0 ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-slate-100 text-slate-500'}`}>
                                {categoryTps.length} TP
                            </span>
                        </div>

                        {/* Content Accordion */}
                        {isOpen && (
                            <div className="animate-in slide-in-from-top-2 duration-200">
                                {categoryTps.length > 0 ? (
                                    <table className="w-full text-left text-sm">
                                        <thead className="border-b bg-slate-50/50"><tr><th className="p-3 font-semibold text-slate-600 w-1/3">Tujuan Pembelajaran</th><th className="p-3 font-semibold text-slate-600">Aktivitas / Metode</th><th className="p-3 text-right font-semibold text-slate-600 w-24">Aksi</th></tr></thead>
                                        <tbody className="text-slate-700">
                                            {categoryTps.map(tp => (
                                                <tr key={tp.id} className="border-b last:border-0 hover:bg-slate-50">
                                                    <td className="p-3 align-top font-medium">{tp.description}</td>
                                                    <td className="p-3 align-top text-slate-600 italic">{tp.activity}</td>
                                                    <td className="p-3 flex justify-end gap-2 align-top">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => handleOpenModal(tp)} 
                                                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                                                            title="Edit TP"
                                                        >
                                                            <Edit2 size={16}/>
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleDelete(tp.id)} 
                                                            className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors"
                                                            title="Hapus TP"
                                                        >
                                                            <Trash2 size={16}/>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="p-8 text-center text-slate-400 italic text-sm border-t border-slate-100">
                                        <p className="mb-2">Belum ada TP untuk aspek ini.</p>
                                        <button 
                                            onClick={() => {
                                                setFormData({ category: category as TPType, description: '', activity: '' });
                                                setIsEditing(null);
                                                setIsModalOpen(true);
                                            }}
                                            className="text-teal-600 font-bold hover:underline"
                                        >
                                            + Tambah TP Sekarang
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
      ) : (
          <div className="text-center p-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
             <p className="text-slate-400">Silakan pilih kelas terlebih dahulu untuk melihat dan menambah Tujuan Pembelajaran.</p>
          </div>
      )}

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="text-lg font-bold text-slate-800">{isEditing ? "Edit Tujuan Pembelajaran" : "Tambah TP Baru"}</h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Read Only Class Info */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-600">
                  <span className="font-bold">Kelas:</span> {classes.find(c => c.id === selectedClassId)?.name}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kategori Aspek</label>
                <select 
                    className="w-full p-2.5 border rounded-lg text-slate-800 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                    value={formData.category} 
                    onChange={e => setFormData({ ...formData, category: e.target.value as TPType })}
                >
                    {TP_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi TP</label>
                <textarea 
                    className="w-full p-2.5 border rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                    rows={3} 
                    placeholder="Contoh: Hafalan Surah Al-Fatihah, Praktik Wudhu..."
                    value={formData.description || ''} 
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Aktivitas / Metode</label>
                <input 
                    className="w-full p-2.5 border rounded-lg text-slate-800 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="Contoh: Talaqqi, Demonstrasi, Penugasan"
                    value={formData.activity || ''} 
                    onChange={e => setFormData({ ...formData, activity: e.target.value })}
                />
              </div>
            </div>

            <div className="p-5 border-t bg-slate-50 rounded-b-xl flex justify-end gap-2">
                <button onClick={handleCloseModal} className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-200 font-medium text-sm">Batal</button>
                <button onClick={handleSave} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 font-medium text-sm shadow-sm flex items-center gap-2">
                    <Save size={16} /> Simpan
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InputTP;