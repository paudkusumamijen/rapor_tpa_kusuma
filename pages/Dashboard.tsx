import React from 'react';
import { useApp } from '../context/AppContext';
import { Users, BookOpen, GraduationCap, Star, CalendarDays, TrendingUp, CheckCircle2 } from 'lucide-react';

// --- KOMPONEN GRAFIK DONUT SVG (Ringan & Cepat) ---
const DonutChart: React.FC<{ percent: number; size?: number; color?: string }> = ({ 
  percent, 
  size = 120, 
  color = "text-green-600" 
}) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* SVG Container */}
      <svg className="transform -rotate-90 w-full h-full">
        {/* Background Circle (Merah Muda untuk yang belum dinilai) */}
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke="currentColor"
          strokeWidth="10"
          fill="transparent"
          className="text-red-100" 
        />
        {/* Progress Circle (Dynamic Color) */}
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke="currentColor"
          strokeWidth="10"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${color} transition-all duration-1000 ease-out`}
        />
      </svg>
      {/* Text Percentage in Middle */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700">
        <span className={`text-xl font-bold ${color}`}>{percent}%</span>
        <span className="text-[10px] uppercase font-semibold text-slate-400">Selesai</span>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { students, classes, tps, p5Criteria, settings, assessments } = useApp();

  const stats = [
    { label: "Total Siswa", value: students.length, icon: <GraduationCap size={32} />, color: "bg-blue-500" },
    { label: "Total Kelas", value: classes.length, icon: <Users size={32} />, color: "bg-teal-500" },
    { label: "Total TP", value: tps.length, icon: <BookOpen size={32} />, color: "bg-orange-500" },
    { label: "Total P5", value: p5Criteria.length, icon: <Star size={32} />, color: "bg-purple-500" },
  ];

  // --- LOGIKA KALKULASI PROGRES ---
  const getClassProgress = (classId: string) => {
      const classStudents = students.filter(s => String(s.classId) === String(classId));
      const totalStudents = classStudents.length;

      if (totalStudents === 0) return { graded: 0, total: 0, percent: 0, notGraded: 0 };

      // Hitung siswa yang memiliki SETIDAKNYA SATU nilai pada semester & tahun ajaran aktif
      const gradedCount = classStudents.filter(s => {
          return assessments.some(a => 
              String(a.studentId) === String(s.id) &&
              a.semester === settings.semester &&
              a.academicYear === settings.academicYear
          );
      }).length;

      return {
          graded: gradedCount,
          notGraded: totalStudents - gradedCount,
          total: totalStudents,
          percent: Math.round((gradedCount / totalStudents) * 100)
      };
  };

  // --- LOGIKA WARNA DINAMIS ---
  const getProgressColor = (percent: number) => {
    if (percent <= 15) return "text-red-800";       // Merah Tua (0-15%)
    if (percent <= 40) return "text-orange-500";    // Jingga (16-40%)
    if (percent <= 65) return "text-yellow-500";    // Kuning (41-65%)
    if (percent < 100) return "text-lime-500";      // Hijau Muda (66-99%)
    return "text-green-700";                        // Hijau Tua (100%)
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard Overview</h1>
      
      {/* Highlight Tahun Ajaran */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
         <div className="flex items-center gap-4">
             <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
                 <CalendarDays size={32} />
             </div>
             <div>
                 <p className="text-slate-500 text-sm font-medium">Tahun Pelajaran</p>
                 <h2 className="text-2xl font-bold text-slate-800">{settings.academicYear || "-"}</h2>
             </div>
         </div>
         <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
         <div className="flex items-center gap-4">
             <div>
                 <p className="text-slate-500 text-sm font-medium text-right md:text-left">Semester</p>
                 <h2 className="text-2xl font-bold text-slate-800 text-right md:text-left">{settings.semester || "-"}</h2>
             </div>
         </div>
      </div>

      {/* --- KARTU SELAMAT DATANG --- */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-10 -translate-y-10">
            <GraduationCap size={200} />
        </div>
        <h2 className="text-2xl font-bold mb-2 relative z-10">Selamat Datang di Aplikasi Rapor Merdeka!</h2>
        <p className="text-indigo-100 mb-6 max-w-2xl relative z-10 text-sm leading-relaxed">
          Aplikasi ini dirancang khusus untuk membantu Bapak/Ibu Guru PAUD KUSUMA dalam menyusun laporan perkembangan anak (Rapor) Kurikulum Merdeka secara efisien. 
          Manfaatkan <strong>Sistem Otomatis</strong> untuk membantu menyusun narasi deskripsi yang unik dan personal untuk setiap anak.
        </p>
        <div className="relative z-10 flex gap-3">
             <button onClick={() => window.location.hash = '#/nilai'} className="bg-white text-indigo-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-50 shadow-sm">
                 Mulai Input Nilai
             </button>
             <button onClick={() => window.location.hash = '#/siswa'} className="bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-900 shadow-sm border border-indigo-500">
                 Kelola Data Siswa
             </button>
        </div>
      </div>

      {/* Grid Statistik Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 transition-transform hover:-translate-y-1">
            <div className={`${stat.color} text-white p-4 rounded-xl shadow-md`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">{stat.label}</p>
              <h2 className="text-3xl font-bold text-slate-800">{stat.value}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* --- SECTION GRAFIK PROGRES KELAS --- */}
      <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="text-slate-700" size={24} />
              <h2 className="text-xl font-bold text-slate-800">Progres Penilaian Siswa per Kelas</h2>
          </div>
          
          {classes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {classes.map(cls => {
                    const progress = getClassProgress(cls.id);
                    
                    // DAPATKAN WARNA DINAMIS
                    const chartColor = getProgressColor(progress.percent);

                    return (
                        <div key={cls.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">{cls.name}</h3>
                                    <p className="text-xs text-slate-500 font-medium">Wali Kelas: {cls.teacherName}</p>
                                </div>
                                {progress.percent === 100 && <CheckCircle2 size={20} className="text-green-700" />}
                            </div>
                            
                            <div className="flex items-center justify-center py-2">
                                <DonutChart percent={progress.percent} color={chartColor} />
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex flex-col items-center">
                                    <span className="text-xs text-slate-400 font-semibold uppercase">Sudah Dinilai</span>
                                    <div className="flex items-center gap-1 font-bold text-slate-700">
                                        {/* Indikator Mengikuti Warna Chart */}
                                        <div className={`w-2 h-2 rounded-full ${chartColor.replace('text-', 'bg-')}`}></div>
                                        {progress.graded} Siswa
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex flex-col items-center">
                                    <span className="text-xs text-slate-400 font-semibold uppercase">Belum</span>
                                    <div className="flex items-center gap-1 font-bold text-slate-700">
                                        {/* Indikator Merah Muda */}
                                        <div className="w-2 h-2 rounded-full bg-red-100"></div>
                                        {progress.notGraded} Siswa
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
          ) : (
             <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-400">
                 <p>Belum ada data kelas. Silakan tambahkan kelas terlebih dahulu di menu Data Kelas.</p>
             </div>
          )}
      </div>
    </div>
  );
};

export default Dashboard;