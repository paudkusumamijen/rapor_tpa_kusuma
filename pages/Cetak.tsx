import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TP_CATEGORIES, DEFAULT_LOGO_URL } from '../constants';
import { Printer, Eye } from 'lucide-react';
import { AssessmentLevel } from '../types';

const Cetak: React.FC = () => {
  const { students, assessments, categoryResults, settings, classes, tps, p5Criteria, p5Assessments, notes, attendance } = useApp();
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  
  // Use Dynamic Categories from Settings
  const activeCategories = settings.assessmentCategories && settings.assessmentCategories.length > 0 
    ? settings.assessmentCategories 
    : TP_CATEGORIES;
  
  const selectedStudent = students.find(s => String(s.id) === String(selectedStudentId));
  const studentClass = classes.find(c => String(c.id) === String(selectedStudent?.classId));

  const reportLogo = settings.reportLogoUrl || settings.logoUrl || DEFAULT_LOGO_URL;

  const filteredStudents = selectedClassId 
    ? students.filter(s => String(s.classId) === String(selectedClassId))
    : [];

  const studentNote = notes.find(n => String(n.studentId) === String(selectedStudentId));
  const studentAttendance = attendance.find(a => String(a.studentId) === String(selectedStudentId)) || { sick: 0, permission: 0, alpha: 0 };

  const studentP5Criteria = selectedStudent ? p5Criteria.filter(c => {
      const isClassMatch = String(c.classId) === String(selectedStudent.classId);
      const hasAssessment = p5Assessments.some(a => 
          String(a.studentId) === String(selectedStudentId) && 
          String(a.criteriaId) === String(c.id)
      );
      return isClassMatch && hasAssessment;
  }) : [];

  const handlePrint = () => {
    if (!selectedStudent) { alert("Pilih siswa terlebih dahulu."); return; }

    const contentElement = document.getElementById('print-area-all');
    if (!contentElement) return;

    const title = `Rapor - ${selectedStudent.name}`;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert("Pop-up diblokir. Izinkan pop-up untuk mencetak.");
        return;
    }

    let cleanHtml = contentElement.innerHTML;
    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <title>${title}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
            <style>
                body { 
                    font-family: 'Inter', sans-serif; 
                    background: white; 
                    color: black;
                    margin: 0;
                    padding: 0;
                    -webkit-print-color-adjust: exact; 
                    print-color-adjust: exact; 
                }
                
                @page { 
                    size: A4; 
                    margin: 0; 
                }

                .sheet { 
                    width: 210mm; 
                    min-height: 297mm; 
                    padding: 15mm; 
                    margin: 0 auto; 
                    position: relative; 
                    box-sizing: border-box; 
                    page-break-after: always;
                    background: white;
                }
                
                .sheet:last-child { 
                    page-break-after: auto; 
                }

                .report-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    border: 1px solid #000000;
                    border-radius: 8px;
                    overflow: hidden;
                    font-size: 11px;
                    margin-bottom: 0;
                }

                .report-table th, .report-table td {
                    border-right: 1px solid #000000;
                    border-bottom: 1px solid #000000;
                    padding: 6px 8px;
                }

                .report-table th {
                    background-color: #e2e8f0 !important;
                    color: #000000 !important;
                    font-weight: bold;
                    text-transform: uppercase;
                    text-align: center;
                    border-top: none;
                }

                .report-table th:last-child, 
                .report-table td:last-child {
                    border-right: none;
                }

                .report-table tr:last-child td {
                    border-bottom: none;
                }

                .text-justify { text-align: justify; }
                .font-bold { font-weight: 700; }
                .font-black { font-weight: 900; }
                .uppercase { text-transform: uppercase; }
                .text-center { text-align: center; }
                
                .no-border-table td, .no-border-table th { border: none !important; padding: 2px 4px; }
                
                .bg-yellow-200 { background-color: #fef08a !important; } 
                .bg-green-200 { background-color: #bbf7d0 !important; }  
                .bg-blue-200 { background-color: #bfdbfe !important; }    
                
                .border-yellow-400 { border-color: #facc15 !important; }
                .border-green-400 { border-color: #4ade80 !important; }
                .border-blue-400 { border-color: #60a5fa !important; }

                .whitespace-pre-wrap {
                    white-space: pre-wrap;
                }
            </style>
        </head>
        <body>
            ${cleanHtml}
            <script>
                setTimeout(() => {
                    window.print();
                }, 1000);
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const getBadgeContent = (score: number) => {
      switch (score) {
          case 1:
              return (
                  <span className="inline-block px-3 py-1 rounded-full bg-yellow-200 text-black border border-yellow-400 text-[9px] font-black tracking-wider uppercase shadow-sm whitespace-nowrap">
                      BERKEMBANG
                  </span>
              );
          case 2:
              return (
                  <span className="inline-block px-3 py-1 rounded-full bg-blue-200 text-black border border-blue-400 text-[9px] font-black tracking-wider uppercase shadow-sm whitespace-nowrap">
                      CAKAP
                  </span>
              );
          case 3:
              return (
                  <span className="inline-block px-3 py-1 rounded-full bg-green-200 text-black border border-green-400 text-[9px] font-black tracking-wider uppercase shadow-sm whitespace-nowrap">
                      MAHIR
                  </span>
              );
          default: 
              return "-";
      }
  };

  return (
    <div className="h-full flex flex-col">
      <style>{`
        .report-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            border: 1px solid #000000;
            border-radius: 8px;
            overflow: hidden;
            font-size: 11px;
        }
        .report-table th, .report-table td {
            border-right: 1px solid #000000;
            border-bottom: 1px solid #000000;
            padding: 6px 8px;
        }
        .report-table th {
            background-color: #e2e8f0;
            color: #000000;
            font-weight: bold;
            text-transform: uppercase;
            text-align: center;
        }
        .report-table th:last-child, .report-table td:last-child {
            border-right: none;
        }
        .report-table tr:last-child td {
            border-bottom: none;
        }
      `}</style>

      <div className="flex flex-col xl:flex-row justify-between items-center mb-6 gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Cetak Rapor</h1>
            <p className="text-sm text-slate-500">Preview ukuran kertas A4. Klik tombol cetak untuk membuka dokumen PDF.</p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-3 w-full xl:w-auto">
             <select
                className="p-2.5 border rounded-lg text-slate-800 bg-white min-w-[200px] shadow-sm focus:ring-2 focus:ring-teal-500 outline-none"
                value={selectedClassId}
                onChange={e => { setSelectedClassId(e.target.value); setSelectedStudentId(''); }}
             >
                <option value="">-- Pilih Kelas --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>

             <select 
                className="p-2.5 border rounded-lg text-slate-800 bg-white min-w-[250px] shadow-sm focus:ring-2 focus:ring-teal-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                disabled={!selectedClassId}
            >
                <option value="">-- Pilih Siswa --</option>
                {filteredStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                ))}
            </select>
            
            <button 
                onClick={handlePrint} 
                disabled={!selectedStudentId}
                className="bg-teal-600 text-white px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-teal-700 disabled:opacity-50 transition-colors shadow-lg font-bold"
            >
                <Printer size={18} /> Cetak / Buka PDF
            </button>
        </div>
      </div>
      
      <div className="flex-1 bg-slate-700 overflow-auto p-8 flex justify-center rounded-xl border border-slate-600 relative shadow-inner">
        {selectedStudent ? (
            <div id="print-area-all" className="transform scale-[0.6] md:scale-[0.85] origin-top transition-transform">
                
                {/* ================= SHEET 1: COVER ================= */}
                <div className="sheet bg-white shadow-2xl mb-8 mx-auto" style={{ width: '210mm', minHeight: '297mm', padding: '15mm' }}>
                     <div className="w-full h-full border-[3px] border-double border-slate-800 rounded-3xl p-10 flex flex-col items-center justify-between" style={{ minHeight: 'calc(297mm - 30mm)' }}>
                        <div className="mt-10 text-center">
                            <img 
                                src={reportLogo} 
                                alt="Logo Sekolah" 
                                crossOrigin="anonymous"
                                className="w-40 h-40 mb-8 object-contain mx-auto"
                            />
                            
                            <h1 className="text-3xl font-extrabold uppercase tracking-wide text-slate-900 mb-2">
                                Laporan Hasil
                            </h1>
                            <h2 className="text-xl font-bold uppercase text-slate-700">
                                Capaian Perkembangan Peserta Didik<br/>
                                Pendidikan Anak Usia Dini (PAUD)
                            </h2>
                        </div>

                        <div className="w-full text-center">
                            <p className="text-sm font-semibold text-slate-500 uppercase mb-2 tracking-widest">Nama Peserta Didik</p>
                            <div className="border-2 border-slate-800 rounded-xl py-4 px-8 bg-slate-50 inline-block w-4/5">
                                <h3 className="text-2xl font-bold uppercase">{selectedStudent.name}</h3>
                            </div>
                        </div>

                        <div className="mb-10 text-center">
                            <p className="text-sm font-semibold text-slate-500 uppercase mb-1 tracking-widest">NISN</p>
                            <p className="text-xl font-bold">{selectedStudent.nisn}</p>
                        </div>

                        <div className="mb-10 w-full border-t-2 border-slate-200 pt-8 text-center">
                            <h3 className="text-xl font-bold uppercase mb-1">{settings.name}</h3>
                            <p className="text-sm font-medium text-slate-600 uppercase">
                                KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH<br/>
                                REPUBLIK INDONESIA
                            </p>
                        </div>
                     </div>
                </div>

                {/* ================= SHEET 2: IDENTITY ================= */}
                <div className="sheet bg-white shadow-2xl mb-8 mx-auto" style={{ width: '210mm', minHeight: '297mm', padding: '15mm' }}>
                    <div className="text-center mb-8">
                        <div className="inline-block bg-red-600 text-white px-6 py-1.5 rounded-full mb-4 font-bold tracking-widest uppercase text-xs">
                            PAUD MERDEKA
                        </div>
                        <h1 className="text-xl font-black uppercase text-slate-800 tracking-wide underline underline-offset-4 decoration-2 decoration-teal-500">
                            Keterangan Diri Anak Didik
                        </h1>
                    </div>

                    <table className="w-full no-border-table text-sm leading-loose">
                        <tbody>
                            <tr><td className="w-6 font-bold text-slate-400">1.</td><td className="w-48 font-semibold">Nama Lengkap</td><td className="w-4">:</td><td className="uppercase font-bold text-slate-900">{selectedStudent.name}</td></tr>
                            <tr><td className="font-bold text-slate-400">2.</td><td className="font-semibold">NISN</td><td>:</td><td>{selectedStudent.nisn}</td></tr>
                            <tr><td className="font-bold text-slate-400">3.</td><td className="font-semibold">Tempat, Tanggal Lahir</td><td>:</td><td className="uppercase">{selectedStudent.pob}, {selectedStudent.dob}</td></tr>
                            <tr><td className="font-bold text-slate-400">4.</td><td className="font-semibold">Jenis Kelamin</td><td>:</td><td>{selectedStudent.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</td></tr>
                            <tr><td className="font-bold text-slate-400">5.</td><td className="font-semibold">Agama</td><td>:</td><td className="uppercase">{selectedStudent.religion}</td></tr>
                            <tr><td className="font-bold text-slate-400">6.</td><td className="font-semibold">Anak Ke-</td><td>:</td><td>{selectedStudent.childOrder}</td></tr>
                            
                            <tr><td colSpan={4} className="pt-4 pb-1 font-bold text-teal-700 uppercase tracking-wide border-b border-slate-200">Orang Tua / Wali</td></tr>
                            
                            <tr><td className="font-bold text-slate-400 pt-2">7.</td><td className="font-semibold pt-2">Nama Ayah</td><td className="pt-2">:</td><td className="uppercase pt-2">{selectedStudent.fatherName}</td></tr>
                            <tr><td className="font-bold text-slate-400">8.</td><td className="font-semibold">Pekerjaan Ayah</td><td>:</td><td className="uppercase">{selectedStudent.fatherJob}</td></tr>
                            <tr><td className="font-bold text-slate-400">9.</td><td className="font-semibold">Nama Ibu</td><td>:</td><td className="uppercase">{selectedStudent.motherName}</td></tr>
                            <tr><td className="font-bold text-slate-400">10.</td><td className="font-semibold">Pekerjaan Ibu</td><td>:</td><td className="uppercase">{selectedStudent.motherJob}</td></tr>
                            <tr><td className="font-bold text-slate-400">11.</td><td className="font-semibold">No. Telepon / HP</td><td>:</td><td>{selectedStudent.phone}</td></tr>
                            <tr><td className="font-bold text-slate-400 align-top">12.</td><td className="font-semibold align-top">Alamat Lengkap</td><td className="align-top">:</td><td className="align-top">{selectedStudent.address}</td></tr>
                        </tbody>
                    </table>

                    <div className="mt-8 flex justify-between items-end">
                         <div className="w-32 flex flex-col items-center ml-8">
                            <div className="w-28 h-36 border-2 border-dashed border-slate-400 flex items-center justify-center bg-slate-50 overflow-hidden relative shadow-sm">
                                {selectedStudent.photoUrl ? (
                                    <img src={selectedStudent.photoUrl} crossOrigin="anonymous" className="w-full h-full object-cover" alt="Foto Siswa" />
                                ) : (
                                    <div className="text-center p-2 text-slate-400">
                                        <p className="text-[10px]">Tempel Foto</p>
                                        <p className="text-sm font-bold">3 x 4</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="text-center w-60">
                            <p className="text-sm">{settings.reportPlace}, {settings.reportDate}</p>
                            <p className="text-sm font-bold mb-16">Kepala Sekolah</p>
                            <p className="font-bold underline text-sm">{settings.headmaster}</p>
                        </div>
                    </div>
                </div>

                {/* ================= SHEET 3: RAPOR ISI ================= */}
                <div className="sheet bg-white mb-8 mx-auto" style={{ width: '210mm', minHeight: '297mm', padding: '15mm' }}>
                    <div className="text-center mb-6">
                        <h2 className="text-md font-bold uppercase leading-tight">
                            LAPORAN HASIL PERKEMBANGAN PESERTA DIDIK<br/>
                            PENDIDIKAN ANAK USIA DINI (PAUD)
                        </h2>
                    </div>

                    <div className="flex justify-between items-start text-xs mb-6 font-medium border-b-2 border-double border-slate-300 pb-2">
                        <div className="w-[55%]">
                            <table className="w-full no-border-table">
                                <tbody>
                                    <tr><td className="w-28 align-top">Nama Sekolah</td><td className="w-2 align-top">:</td><td className="uppercase">{settings.name}</td></tr>
                                    <tr><td className="align-top">Nama Peserta Didik</td><td className="align-top">:</td><td className="uppercase font-bold">{selectedStudent.name}</td></tr>
                                    <tr><td className="align-top">NIK / NISN</td><td className="align-top">:</td><td>{selectedStudent.nisn}</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="w-[40%]">
                            <table className="w-full no-border-table">
                                <tbody>
                                    <tr><td className="w-24 align-top">Kelas</td><td className="w-2 align-top">:</td><td className="uppercase">{studentClass?.name}</td></tr>
                                    <tr><td className="align-top">Sem / Th. Ajaran</td><td className="align-top">:</td><td>{settings.semester} / {settings.academicYear}</td></tr>
                                    <tr><td className="align-top">TB / BB</td><td className="align-top">:</td><td>{selectedStudent.height || 0} cm / {selectedStudent.weight || 0} kg</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* I. CAPAIAN PEMBELAJARAN (DYNAMIC CATEGORIES) */}
                    <h3 className="text-sm font-bold text-slate-900 uppercase mb-2">I. Capaian Pembelajaran</h3>
                    <div className="space-y-6 mb-6">
                        {activeCategories.map(category => {
                            const catTps = tps.filter(t => t.category === category && String(t.classId) === String(selectedStudent.classId));
                            if (catTps.length === 0) return null;

                            const catAssessments = assessments.filter(a => String(a.studentId) === String(selectedStudent.id) && catTps.some(t => String(t.id) === String(a.tpId)));
                            const catResult = categoryResults.find(r => String(r.studentId) === String(selectedStudent.id) && r.category === category);
                            
                            return (
                                <div key={category} className="mb-4">
                                    <div className="font-bold text-xs uppercase mb-1 pl-2 border-l-4 border-slate-800 tracking-wide">
                                        {category}
                                    </div>
                                    <table className="report-table">
                                        <thead>
                                            <tr>
                                                <th className="w-[35%]">Tujuan Pembelajaran</th>
                                                <th className="w-[45%]">Aktivitas</th>
                                                <th className="w-[20%]">DIMENSI KEMANDIRIAN</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {catTps.map((tp) => {
                                                const ass = catAssessments.find(a => String(a.tpId) === String(tp.id));
                                                const score = ass?.score || 0;
                                                return (
                                                    <tr key={tp.id} className="even:bg-slate-50">
                                                        <td className="align-top text-[11px] leading-snug">{tp.description}</td>
                                                        <td className="align-top text-[11px] text-slate-600 italic leading-snug">{tp.activity}</td>
                                                        <td className="align-middle text-center">
                                                            {getBadgeContent(score)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    
                                    <div className="border border-black p-3 bg-white shadow-sm rounded-lg mt-2 relative z-0">
                                        <p className="text-[10px] font-black text-slate-500 mb-1 tracking-widest uppercase flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 inline-block"></span>
                                            Deskripsi Capaian
                                        </p>
                                        <div className="text-justify text-[11px] leading-relaxed text-slate-800 font-medium whitespace-pre-wrap">
                                            {catResult?.generatedDescription || "-"}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* II. KOKURIKULER (P5) */}
                    {studentP5Criteria.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-slate-900 uppercase mb-2">II. KOKURIKULER</h3>
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th className="w-[30%]">Dimensi</th>
                                        <th>Deskripsi Capaian</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentP5Criteria.map((c) => {
                                        const assessment = p5Assessments.find(a => String(a.studentId) === String(selectedStudentId) && String(a.criteriaId) === String(c.id));
                                        const score = assessment?.score;
                                        let desc = assessment?.generatedDescription;
                                        if (!desc) {
                                            if (score === AssessmentLevel.BERKEMBANG) desc = c.descBerkembang;
                                            else if (score === AssessmentLevel.CAKAP) desc = c.descCakap;
                                            else if (score === AssessmentLevel.MAHIR) desc = c.descMahir;
                                            else desc = "-";
                                        }
                                        return (
                                            <tr key={c.id} className="even:bg-slate-50">
                                                <td className="align-top font-bold text-[11px]">{c.subDimension}</td>
                                                <td className="align-top text-justify text-[11px] leading-tight relative">
                                                    <div className="whitespace-pre-wrap">{desc}</div>
                                                    {score && (
                                                        <div className="mt-1 text-right">
                                                           {getBadgeContent(score)}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* III. CATATAN & IV. KEHADIRAN */}
                    <div className="flex gap-4 mb-4" style={{ pageBreakInside: 'avoid' }}>
                         <div className="flex-1">
                             <div>
                                 <h3 className="text-xs font-bold text-slate-900 uppercase mb-1">III. Catatan Guru</h3>
                                 <div className="border border-black p-2 text-[11px] text-justify min-h-[110px] rounded-lg bg-white whitespace-pre-wrap">{studentNote?.note || "-"}</div>
                             </div>
                         </div>
                         <div className="w-[30%]">
                             <h3 className="text-xs font-bold text-slate-900 uppercase mb-1">IV. Kehadiran</h3>
                             <table className="report-table">
                                <thead>
                                    <tr><th className="text-left">Keterangan</th><th className="text-center">Jumlah</th></tr>
                                </thead>
                                <tbody>
                                    <tr><td>Sakit</td><td className="text-center font-bold">{studentAttendance.sick}</td></tr>
                                    <tr><td>Izin</td><td className="text-center font-bold">{studentAttendance.permission}</td></tr>
                                    <tr><td>Tanpa Ket.</td><td className="text-center font-bold">{studentAttendance.alpha}</td></tr>
                                </tbody>
                             </table>
                         </div>
                    </div>

                    {/* SIGNATURES */}
                    <div className="flex justify-between text-xs mt-8 px-4" style={{ pageBreakInside: 'avoid' }}>
                        <div className="text-center w-48">
                            <p>Mengetahui,</p>
                            <p className="font-bold">Orang Tua/Wali,</p>
                            <div className="h-20"></div>
                            <p className="border-b border-black inline-block w-full mx-auto"></p>
                        </div>
                        <div className="text-center min-w-[220px]">
                            <p>{settings.reportPlace}, {settings.reportDate}</p>
                            <p>Wali Kelas,</p>
                            <div className="h-20"></div>
                            <p className="font-bold underline whitespace-nowrap">
                                {studentClass?.teacherName ? studentClass.teacherName : settings.teacher}
                            </p>
                            <p>NUPTK: {studentClass?.nuptk ? studentClass.nuptk : '-'}</p>
                        </div>
                    </div>
                     <div className="mt-4 text-center text-xs" style={{ pageBreakInside: 'avoid' }}>
                        <p>Mengetahui,</p>
                        <p>Kepala Sekolah</p>
                        <div className="h-20"></div>
                        <p className="font-bold underline">{settings.headmaster}</p>
                    </div>
                </div>
            </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-white m-4 rounded-xl border border-dashed border-slate-300">
            <Eye size={64} className="mb-4 text-slate-200"/>
            <p className="text-lg font-medium text-slate-500">Preview Rapor (A4)</p>
            <p className="text-sm">Silakan pilih kelas dan siswa di menu atas untuk melihat preview rapor.</p>
        </div>
      )}
    </div>
  </div>
  );
};

export default Cetak;