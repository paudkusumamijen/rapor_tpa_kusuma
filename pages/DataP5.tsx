import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { P5Criteria } from '../types';
import { Plus, Edit2, Trash2, Save, Filter, Archive, X, Star } from 'lucide-react';

const DataP5: React.FC = () => {
  const { p5Criteria, addP5Criteria, updateP5Criteria, deleteP5Criteria, classes, confirmAction } = useApp();
  
  const [selectedClassId, setSelectedClassId] = useState('');
  
  // MODAL STATE for Criteria
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<P5Criteria>>({});
  
  // Filter Criteria by Selected Class
  const filteredCriteria = selectedClassId ? p5Criteria.filter(c => String(c.classId) === String(selectedClassId)) : [];

  const handleOpenModal = (crit?: P5Criteria) => {
    if (!selectedClassId) { alert("Pilih kelas terlebih dahulu untuk menambahkan data."); return; }
    
    if (crit) {
        setIsEditing(crit.id);
        setFormData(crit);
    } else {
        setIsEditing(null);
        // Otomatis menggunakan selectedClassId
        setFormData({ 
            classId: selectedClassId 
        });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(null);
    setFormData({});
  };

  const handleSave = () => {
    if (!formData.subDimension) { alert("Nama Sub Dimensi wajib diisi"); return; }
    
    // Pastikan classId terisi dari state parent jika belum ada
    const dataToSave = {
        ...formData,
        classId: selectedClassId, // Pastikan konsisten dengan filter yang aktif
        descBerkembang: formData.descBerkembang || 'Mulai berkembang...',
        descCakap: formData.descCakap || 'Sudah cakap...',
        descMahir: formData.descMahir || 'Sangat mahir...'
    };
    
    if (isEditing) { updateP5Criteria({ ...dataToSave, id: isEditing } as P5Criteria); } 
    else { addP5Criteria({ ...dataToSave, id: Date.now().toString() } as P5Criteria); }
    
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    const subDimensionName = p5Criteria.find(c => c.id === id)?.subDimension || "Sub Dimensi ini";
    const isConfirmed = await confirmAction(`Apakah Anda yakin ingin menghapus "${subDimensionName}"?`);
    if (isConfirmed) { deleteP5Criteria(String(id)); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
             <Star className="text-orange-500" size={28} />
             {/* JUDUL DIKEMBALIKAN */}
             <h1 className="text-2xl font-bold text-slate-800">Data Kokulikuler (P5)</h1>
        </div>
      </div>

      <div className="space-y-6">
             {/* Class Selector */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                     <div className="w-full md:w-1/2">
                         <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                             <Filter size={16} /> Pilih Kelas
                         </label>
                         <select 
                            className="w-full p-2.5 border rounded-lg text-slate-800 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                            value={selectedClassId}
                            onChange={e => { setSelectedClassId(e.target.value); }}
                         >
                             <option value="">-- Pilih Kelas untuk Mengelola Data --</option>
                             {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                         </select>
                     </div>
                     {selectedClassId && (
                         <button 
                            onClick={() => handleOpenModal()}
                            className="bg-teal-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-teal-700 shadow-sm font-medium text-sm"
                         >
                             <Plus size={18}/> Tambah Sub Dimensi
                         </button>
                     )}
                </div>
            </div>

            {selectedClassId ? (
                <>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b"><tr><th className="p-4 text-slate-600 w-1/3">Sub Dimensi / Elemen</th><th className="p-4 text-slate-600">Deskripsi Capaian Default</th><th className="p-4 text-slate-600 w-24 text-center">Aksi</th></tr></thead>
                            <tbody className="text-slate-700">
                                {filteredCriteria.map(c => (
                                    <tr key={c.id} className="border-b hover:bg-slate-50">
                                        <td className="p-4 font-bold text-slate-800 align-top">{c.subDimension}</td>
                                        <td className="p-4 text-xs text-slate-500 align-top"><div className="grid grid-cols-1 gap-1"><span className="block"><strong className="text-yellow-600">MB:</strong> {c.descBerkembang}</span><span className="block"><strong className="text-blue-600">BSH:</strong> {c.descCakap}</span><span className="block"><strong className="text-green-600">SB:</strong> {c.descMahir}</span></div></td>
                                        <td className="p-4 align-top"><div className="flex justify-center gap-2"><button type="button" onClick={() => handleOpenModal(c)} className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"><Edit2 size={16}/></button><button type="button" onClick={() => handleDelete(c.id)} className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100"><Trash2 size={16}/></button></div></td>
                                    </tr>
                                ))}
                                {filteredCriteria.length === 0 && <tr><td colSpan={3} className="p-12 text-center text-slate-400 flex flex-col items-center"><Archive size={40} className="mb-2 opacity-20"/><p>Belum ada data sub dimensi untuk kelas ini.</p></td></tr>}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
                     <Filter size={48} className="mb-4 opacity-30"/>
                     <p className="text-lg font-medium">Pilih Kelas Terlebih Dahulu</p>
                     <p className="text-sm">Anda harus memilih kelas untuk melihat atau menambah data.</p>
                </div>
            )}
      </div>

      {/* MODAL FORM CRITERIA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center p-5 border-b">
                 <h2 className="text-lg font-bold text-slate-800">{isEditing ? "Edit Sub Dimensi" : "Tambah Sub Dimensi"}</h2>
                 <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
             </div>
             <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                 {/* INFO KELAS (READ ONLY) */}
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-600">
                    <span className="font-bold">Kelas Terpilih:</span> {classes.find(c => c.id === selectedClassId)?.name}
                 </div>

                 <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Nama Sub Dimensi / Elemen</label>
                     <input className="w-full p-2.5 border rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Contoh: Mandiri, Bernalar Kritis..." value={formData.subDimension || ''} onChange={e => setFormData({...formData, subDimension: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-1 gap-4">
                     <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Deskripsi Mulai Berkembang (MB)</label><textarea className="w-full p-2 border rounded-lg bg-white text-slate-800 text-sm focus:ring-2 focus:ring-teal-500 outline-none" rows={2} value={formData.descBerkembang || ''} onChange={e => setFormData({...formData, descBerkembang: e.target.value})} /></div>
                     <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Deskripsi Berkembang Sesuai Harapan (BSH)</label><textarea className="w-full p-2 border rounded-lg bg-white text-slate-800 text-sm focus:ring-2 focus:ring-teal-500 outline-none" rows={2} value={formData.descCakap || ''} onChange={e => setFormData({...formData, descCakap: e.target.value})} /></div>
                     <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Deskripsi Sangat Berkembang (SB)</label><textarea className="w-full p-2 border rounded-lg bg-white text-slate-800 text-sm focus:ring-2 focus:ring-teal-500 outline-none" rows={2} value={formData.descMahir || ''} onChange={e => setFormData({...formData, descMahir: e.target.value})} /></div>
                 </div>
             </div>
             <div className="p-5 border-t bg-slate-50 rounded-b-xl flex justify-end gap-2">
                 <button onClick={handleCloseModal} className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-200 font-medium text-sm">Batal</button>
                 <button onClick={handleSave} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 font-medium text-sm shadow-sm flex items-center gap-2"><Save size={16}/> Simpan</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataP5;