
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Save } from 'lucide-react';

const Kehadiran: React.FC = () => {
  const { students, classes, attendance, upsertAttendance } = useApp();
  const [selectedClassId, setSelectedClassId] = useState('');

  const filteredStudents = selectedClassId 
    ? students.filter(s => String(s.classId) === String(selectedClassId))
    : [];

  const handleInputChange = (studentId: string, field: 'sick'|'permission'|'alpha', value: string) => {
      const numVal = parseInt(value) || 0;
      // Find current state or create new object
      const current = attendance.find(a => String(a.studentId) === String(studentId)) || {
          id: Date.now().toString(),
          studentId: studentId,
          sick: 0, permission: 0, alpha: 0
      };
      
      upsertAttendance({
          ...current,
          [field]: numVal
      });
  };

  return (
    <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Kehadiran Siswa</h1>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Kelas</label>
            <select className="w-full md:w-1/3 p-2 border rounded-lg bg-white text-slate-800" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
                <option value="">-- Pilih Kelas --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
        </div>

        {selectedClassId && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="p-4 text-slate-600">Nama Siswa</th>
                            <th className="p-4 text-slate-600 w-24 text-center">Sakit</th>
                            <th className="p-4 text-slate-600 w-24 text-center">Izin</th>
                            <th className="p-4 text-slate-600 w-24 text-center">Tanpa Ket.</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-700">
                        {filteredStudents.map(s => {
                            const att = attendance.find(a => String(a.studentId) === String(s.id)) || { sick: 0, permission: 0, alpha: 0 };
                            return (
                                <tr key={s.id} className="border-b hover:bg-slate-50">
                                    <td className="p-4 font-medium">{s.name}</td>
                                    <td className="p-2 text-center">
                                        <input 
                                            type="number" 
                                            min="0"
                                            className="w-16 p-2 border rounded text-center bg-white"
                                            value={att.sick}
                                            onChange={e => handleInputChange(s.id, 'sick', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-2 text-center">
                                        <input 
                                            type="number" 
                                            min="0"
                                            className="w-16 p-2 border rounded text-center bg-white"
                                            value={att.permission}
                                            onChange={e => handleInputChange(s.id, 'permission', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-2 text-center">
                                        <input 
                                            type="number" 
                                            min="0"
                                            className="w-16 p-2 border rounded text-center bg-white"
                                            value={att.alpha}
                                            onChange={e => handleInputChange(s.id, 'alpha', e.target.value)}
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredStudents.length === 0 && (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-400">Tidak ada siswa di kelas ini.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        )}
    </div>
  );
};

export default Kehadiran;
