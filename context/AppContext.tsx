import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { AppState, ClassData, Student, LearningObjective, Assessment, CategoryResult, SchoolSettings, P5Criteria, P5Assessment, Reflection, ReflectionQuestion, ReflectionAnswer, StudentNote, AttendanceData, User, UserRole } from '../types';
import { INITIAL_SETTINGS } from '../constants';
import { sheetService } from '../services/sheetService';

const MOCK_DATA: AppState = {
  user: null,
  classes: [],
  students: [],
  tps: [],
  assessments: [],
  categoryResults: [],
  settings: INITIAL_SETTINGS,
  p5Criteria: [],
  p5Assessments: [],
  reflections: [],
  reflectionQuestions: [],
  reflectionAnswers: [],
  notes: [],
  attendance: []
};

interface AppContextType extends AppState {
  isLoading: boolean;
  isOnline: boolean;
  refreshData: () => Promise<void>;
  
  // Auth
  login: (username: string, pass: string) => boolean;
  logout: () => void;

  // Confirmation Modal
  confirmAction: (message: string, title?: string, confirmText?: string, variant?: 'danger' | 'primary' | 'logout') => Promise<boolean>;
  isConfirmModalOpen: boolean;
  confirmModalMessage: string;
  confirmModalTitle: string;
  confirmModalBtnText: string;
  confirmModalVariant: 'danger' | 'primary' | 'logout';
  handleConfirmModalConfirm: () => void;
  handleConfirmModalCancel: () => void;

  addClass: (data: ClassData) => Promise<void>;
  updateClass: (data: ClassData) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  
  addStudent: (data: Student) => Promise<void>;
  updateStudent: (data: Student) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  
  addTp: (data: LearningObjective) => Promise<void>;
  updateTp: (data: LearningObjective) => Promise<void>;
  deleteTp: (id: string) => Promise<void>;
  
  upsertAssessment: (data: Assessment) => Promise<void>;
  upsertCategoryResult: (data: CategoryResult) => Promise<void>;
  
  setSettings: (data: SchoolSettings) => Promise<void>;

  addP5Criteria: (data: P5Criteria) => Promise<void>;
  updateP5Criteria: (data: P5Criteria) => Promise<void>;
  deleteP5Criteria: (id: string) => Promise<void>;
  upsertP5Assessment: (data: P5Assessment) => Promise<void>;

  addReflection: (data: Reflection) => Promise<void>;
  updateReflection: (data: Reflection) => Promise<void>;
  deleteReflection: (id: string) => Promise<void>;
  
  // NEW REFLECTION METHODS
  addReflectionQuestion: (data: ReflectionQuestion) => Promise<void>;
  deleteReflectionQuestion: (id: string) => Promise<void>;
  upsertReflectionAnswer: (data: ReflectionAnswer) => Promise<void>;

  upsertNote: (data: StudentNote) => Promise<void>;
  upsertAttendance: (data: AttendanceData) => Promise<void>;

  // Management System
  handleBackup: () => void;
  handleRestore: (file: File) => Promise<void>;
  handleResetSystem: (keepTPs: boolean) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(MOCK_DATA);
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if Supabase is connected (either via constants or localStorage)
  const isOnline = sheetService.isConnected();

  // --- Confirmation Modal ---
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState('');
  const [confirmModalTitle, setConfirmModalTitle] = useState('Konfirmasi Hapus');
  const [confirmModalBtnText, setConfirmModalBtnText] = useState('Ya, Hapus Data');
  const [confirmModalVariant, setConfirmModalVariant] = useState<'danger' | 'primary' | 'logout'>('danger');
  
  const confirmPromise = useRef<{ resolve: (value: boolean) => void } | null>(null);

  const confirmAction = useCallback((
      message: string, 
      title: string = "Konfirmasi Hapus", 
      confirmText: string = "Ya, Hapus Data",
      variant: 'danger' | 'primary' | 'logout' = 'danger'
  ): Promise<boolean> => {
    setIsConfirmModalOpen(true);
    setConfirmModalMessage(message);
    setConfirmModalTitle(title);
    setConfirmModalBtnText(confirmText);
    setConfirmModalVariant(variant);

    return new Promise((resolve) => {
      confirmPromise.current = { resolve };
    });
  }, []);

  const handleConfirmModalConfirm = () => {
    setIsConfirmModalOpen(false);
    if (confirmPromise.current) {
      confirmPromise.current.resolve(true);
      confirmPromise.current = null;
    }
  };

  const handleConfirmModalCancel = () => {
    setIsConfirmModalOpen(false);
    if (confirmPromise.current) {
      confirmPromise.current.resolve(false);
      confirmPromise.current = null;
    }
  };

  // --- Initialize Auth from LocalStorage ---
  useEffect(() => {
    const savedUser = localStorage.getItem('appUser');
    if (savedUser) {
        setState(prev => ({ ...prev, user: JSON.parse(savedUser) }));
    }
  }, []);

  // --- Load Settings (Logo/Name) for Login Screen ---
  useEffect(() => {
    if (isOnline) {
        // Fetch only settings when app loads to populate login screen info
        sheetService.fetchSettings().then(s => {
            if (s) {
                setState(prev => ({ ...prev, settings: s }));
            }
        });
    }
  }, [isOnline]);

  // --- Full Data Loading (Authenticated) ---
  useEffect(() => {
    if (state.user) { // Only load full data if logged in
        if (isOnline) {
          refreshData();
        } else {
            const saved = localStorage.getItem('raporPaudData');
            if (saved) {
                // Jangan timpa user saat load data lokal
                const parsed = JSON.parse(saved);
                setState(prev => ({ ...parsed, user: prev.user }));
            }
        }
    }
  }, [isOnline, state.user?.username]); // Dependency on user username to prevent loop

  useEffect(() => {
    if (state.user) {
        localStorage.setItem('raporPaudData', JSON.stringify(state));
    }
  }, [state]);

  // --- Auth Functions ---
  const login = (u: string, p: string): boolean => {
      // SIMPLE HARDCODED AUTH (Tanpa Database)
      if (u === 'admin' && p === 'admin') {
          const user: User = { username: 'admin', name: 'Administrator', role: 'admin' };
          setState(prev => ({ ...prev, user }));
          localStorage.setItem('appUser', JSON.stringify(user));
          return true;
      }
      if (u === 'guru' && p === 'guru') {
          const user: User = { username: 'guru', name: 'Guru Kelas', role: 'guru' };
          setState(prev => ({ ...prev, user }));
          localStorage.setItem('appUser', JSON.stringify(user));
          return true;
      }
      if (u === 'ortu' && p === 'ortu') {
          const user: User = { username: 'ortu', name: 'Orang Tua', role: 'orangtua' };
          setState(prev => ({ ...prev, user }));
          localStorage.setItem('appUser', JSON.stringify(user));
          return true;
      }
      return false;
  };

  const logout = () => {
      setState(prev => ({ ...prev, user: null }));
      localStorage.removeItem('appUser');
  };

  const refreshData = async () => {
    if (!isOnline) return;
    setIsLoading(true);
    const data = await sheetService.fetchAllData();
    if (data) {
      const normalizedData: AppState = {
          ...data,
          user: state.user, // Keep current user
          classes: (data.classes || []).map(c => ({...c, id: String(c.id)})),
          students: (data.students || []).map(s => ({...s, id: String(s.id), classId: String(s.classId)})),
          tps: (data.tps || []).map(t => ({...t, id: String(t.id), classId: String(t.classId)})),
          assessments: (data.assessments || []).map(a => ({...a, id: String(a.id), studentId: String(a.studentId), tpId: String(a.tpId)})),
          categoryResults: (data.categoryResults || []).map(a => ({...a, id: String(a.id), studentId: String(a.studentId)})),
          p5Criteria: (data.p5Criteria || []).map(x => ({...x, id: String(x.id), classId: String(x.classId || '')})),
          p5Assessments: (data.p5Assessments || []).map(x => ({...x, id: String(x.id), studentId: String(x.studentId), criteriaId: String(x.criteriaId)})),
          reflections: (data.reflections || []).map(x => ({...x, id: String(x.id), studentId: String(x.studentId)})),
          reflectionQuestions: (data.reflectionQuestions || []).map(x => ({...x, id: String(x.id), classId: String(x.classId)})),
          reflectionAnswers: (data.reflectionAnswers || []).map(x => ({...x, id: String(x.id), questionId: String(x.questionId), studentId: String(x.studentId)})),
          notes: (data.notes || []).map(x => ({...x, id: String(x.id), studentId: String(x.studentId)})),
          attendance: (data.attendance || []).map(x => ({...x, id: String(x.id), studentId: String(x.studentId)})),
          settings: data.settings || INITIAL_SETTINGS
      };
      setState(normalizedData);
    }
    setIsLoading(false);
  };

  const handleAsyncAction = async (
    apiCall: () => Promise<any>,
    localUpdate: () => void,
    collectionName: string,
    itemId: string
  ) => {
    localUpdate(); 
    
    if (isOnline) {
      const res = await apiCall();
      if (res.status === 'error') {
        alert(`Gagal menyimpan ke Database: ${res.message} (Collection: ${collectionName}, ID: ${itemId})`);
        console.error(`API Error for ${collectionName}:`, res.message);
      } else {
        console.log(`Saved ${collectionName} ID: ${itemId}`);
      }
    }
  };

  // --- MANAGEMENT ACTIONS ---

  const handleBackup = () => {
      const jsonString = JSON.stringify(state, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Backup_Rapor_PAUD_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
  };

  const handleRestore = async (file: File) => {
      setIsLoading(true);
      try {
          const text = await file.text();
          const data = JSON.parse(text);
          if (!data.settings || !data.classes) throw new Error("Format file backup tidak valid.");
          
          if (isOnline) {
              const res = await sheetService.restoreDatabase(data);
              if (res.status === 'error') throw new Error(res.message);
          }
          
          setState(prev => ({...data, user: prev.user})); // Update local state but keep user
          alert("Data berhasil dipulihkan dari Backup!");
          await refreshData();
      } catch (e: any) {
          alert("Gagal restore data: " + e.message);
      } finally {
          setIsLoading(false);
      }
  };

  const handleResetSystem = async (keepTPs: boolean) => {
      setIsLoading(true);
      try {
          if (isOnline) {
             const res = await sheetService.clearDatabase(keepTPs);
             if (res.status === 'error') throw new Error(res.message);
          }

          // Reset Local State
          setState(prev => ({
              ...MOCK_DATA,
              user: prev.user, // Keep User
              settings: prev.settings, // Keep Settings
              tps: keepTPs ? prev.tps : [] // Keep TPs optional
          }));
          
          alert("Sistem berhasil dikosongkan untuk Tahun Ajaran Baru!");
          await refreshData();
      } catch (e: any) {
          alert("Gagal reset data: " + e.message);
      } finally {
          setIsLoading(false);
      }
  };

  // --- CRUD HELPERS ---

  const addClass = async (d: ClassData) => {
    const dStr = { ...d, id: String(d.id) };
    await handleAsyncAction(
        () => sheetService.create('classes', dStr), 
        () => setState(prev => ({ ...prev, classes: [...prev.classes, dStr] })), 
        'classes', dStr.id
    );
  };
  const updateClass = async (d: ClassData) => {
    const dStr = { ...d, id: String(d.id) };
    await handleAsyncAction(
        () => sheetService.update('classes', dStr), 
        () => setState(prev => ({ ...prev, classes: prev.classes.map(i => i.id === dStr.id ? dStr : i) })), 
        'classes', dStr.id
    );
  };
  const deleteClass = async (id: string) => {
    await handleAsyncAction(
        () => sheetService.delete('classes', id), 
        () => setState(prev => ({ ...prev, classes: prev.classes.filter(i => i.id !== id) })), 
        'classes', id
    );
  };

  const addStudent = async (d: Student) => {
    const dStr = { ...d, id: String(d.id), classId: String(d.classId) };
    await handleAsyncAction(
        () => sheetService.create('students', dStr), 
        () => setState(prev => ({ ...prev, students: [...prev.students, dStr] })), 
        'students', dStr.id
    );
  };
  const updateStudent = async (d: Student) => {
    const dStr = { ...d, id: String(d.id), classId: String(d.classId) };
    await handleAsyncAction(
        () => sheetService.update('students', dStr), 
        () => setState(prev => ({ ...prev, students: prev.students.map(i => i.id === dStr.id ? dStr : i) })), 
        'students', dStr.id
    );
  };
  const deleteStudent = async (id: string) => {
    await handleAsyncAction(
        () => sheetService.delete('students', id), 
        () => setState(prev => ({ ...prev, students: prev.students.filter(i => i.id !== id) })), 
        'students', id
    );
  };

  const addTp = async (d: LearningObjective) => {
    const dStr = { ...d, id: String(d.id) };
    await handleAsyncAction(
        () => sheetService.create('TPs', dStr), 
        () => setState(prev => ({ ...prev, tps: [...prev.tps, dStr] })), 
        'TPs', dStr.id
    );
  };
  const updateTp = async (d: LearningObjective) => {
    const dStr = { ...d, id: String(d.id) };
    await handleAsyncAction(
        () => sheetService.update('TPs', dStr), 
        () => setState(prev => ({ ...prev, tps: prev.tps.map(i => i.id === dStr.id ? dStr : i) })), 
        'TPs', dStr.id
    );
  };
  const deleteTp = async (id: string) => {
    await handleAsyncAction(
        () => sheetService.delete('TPs', id), 
        () => setState(prev => ({ ...prev, tps: prev.tps.filter(i => i.id !== id) })), 
        'TPs', id
    );
  };

  const upsertAssessment = async (d: Assessment) => {
    const dStr = { ...d, id: String(d.id), studentId: String(d.studentId), tpId: String(d.tpId) };
    await handleAsyncAction(
        () => {
             const exists = state.assessments.find(a => String(a.studentId) === dStr.studentId && String(a.tpId) === dStr.tpId);
             return exists ? sheetService.update('assessments', dStr) : sheetService.create('assessments', dStr);
        },
        () => {
            setState(prev => {
                const list = prev.assessments;
                const idx = list.findIndex(a => String(a.studentId) === dStr.studentId && String(a.tpId) === dStr.tpId);
                const newArr = [...list];
                if (idx >= 0) newArr[idx] = dStr; else newArr.push(dStr);
                return { ...prev, assessments: newArr };
            });
        },
        'assessments', dStr.id
    );
  };

  const upsertCategoryResult = async (d: CategoryResult) => {
    const dStr = { ...d, id: String(d.id), studentId: String(d.studentId) };
    await handleAsyncAction(
        () => {
             const exists = state.categoryResults.find(a => String(a.studentId) === dStr.studentId && a.category === dStr.category);
             return exists ? sheetService.update('categoryResults', dStr) : sheetService.create('categoryResults', dStr);
        },
        () => {
            setState(prev => {
                const list = prev.categoryResults;
                const idx = list.findIndex(a => String(a.studentId) === dStr.studentId && a.category === dStr.category);
                const newArr = [...list];
                if (idx >= 0) newArr[idx] = dStr; else newArr.push(dStr);
                return { ...prev, categoryResults: newArr };
            });
        },
        'categoryResults', dStr.id
    );
  };
  
  const setSettings = async (settings: SchoolSettings) => {
    await handleAsyncAction(
        () => sheetService.saveSettings(settings), 
        () => setState(prev => ({ ...prev, settings })), 
        'settings', 'global'
    );
  };

  // --- NEW FEATURES HELPERS ---

  const addP5Criteria = async (d: P5Criteria) => {
    const dStr = { ...d, id: String(d.id), classId: String(d.classId) };
    await handleAsyncAction(
        () => sheetService.create('p5Criteria', dStr), 
        () => setState(prev => ({ ...prev, p5Criteria: [...prev.p5Criteria, dStr] })), 
        'p5Criteria', dStr.id
    );
  };
  const updateP5Criteria = async (d: P5Criteria) => {
    const dStr = { ...d, id: String(d.id), classId: String(d.classId) };
    await handleAsyncAction(
        () => sheetService.update('p5Criteria', dStr), 
        () => setState(prev => ({ ...prev, p5Criteria: prev.p5Criteria.map(i => i.id === dStr.id ? dStr : i) })), 
        'p5Criteria', dStr.id
    );
  };
  const deleteP5Criteria = async (id: string) => {
    await handleAsyncAction(
        () => sheetService.delete('p5Criteria', id), 
        () => setState(prev => ({ ...prev, p5Criteria: prev.p5Criteria.filter(i => i.id !== id) })), 
        'p5Criteria', id
    );
  };

  const upsertP5Assessment = async (d: P5Assessment) => {
    const dStr = { ...d, id: String(d.id), studentId: String(d.studentId), criteriaId: String(d.criteriaId) };
    await handleAsyncAction(
      () => {
        const exists = state.p5Assessments.find(a => String(a.studentId) === dStr.studentId && String(a.criteriaId) === dStr.criteriaId);
        return exists ? sheetService.update('p5Assessments', dStr) : sheetService.create('p5Assessments', dStr);
      },
      () => {
        setState(prev => {
            const list = prev.p5Assessments;
            const idx = list.findIndex(a => String(a.studentId) === dStr.studentId && String(a.criteriaId) === dStr.criteriaId);
            const newArr = [...list];
            if (idx >= 0) newArr[idx] = dStr; else newArr.push(dStr);
            return { ...prev, p5Assessments: newArr };
        });
      },
      'p5Assessments', dStr.id
    );
  };

  // Deprecated Reflection Methods (but kept for compatibility)
  const addReflection = async (d: Reflection) => {
    const dStr = { ...d, id: String(d.id), studentId: String(d.studentId) };
    await handleAsyncAction(
        () => sheetService.create('reflections', dStr), 
        () => setState(prev => ({ ...prev, reflections: [...prev.reflections, dStr] })), 
        'reflections', dStr.id
    );
  };
  const updateReflection = async (d: Reflection) => {
    const dStr = { ...d, id: String(d.id), studentId: String(d.studentId) };
    await handleAsyncAction(
        () => sheetService.update('reflections', dStr), 
        () => setState(prev => ({ ...prev, reflections: prev.reflections.map(i => i.id === dStr.id ? dStr : i) })), 
        'reflections', dStr.id
    );
  };
  const deleteReflection = async (id: string) => {
    await handleAsyncAction(
        () => sheetService.delete('reflections', id), 
        () => setState(prev => ({ ...prev, reflections: prev.reflections.filter(i => i.id !== id) })), 
        'reflections', id
    );
  };

  // --- NEW REFLECTION METHODS (Question & Answer) ---
  const addReflectionQuestion = async (d: ReflectionQuestion) => {
    const dStr = { ...d, id: String(d.id), classId: String(d.classId) };
    await handleAsyncAction(
        () => sheetService.create('reflectionQuestions', dStr), 
        () => setState(prev => ({ ...prev, reflectionQuestions: [...prev.reflectionQuestions, dStr] })), 
        'reflectionQuestions', dStr.id
    );
  };

  const deleteReflectionQuestion = async (id: string) => {
    await handleAsyncAction(
        () => sheetService.delete('reflectionQuestions', id), 
        () => setState(prev => ({ ...prev, reflectionQuestions: prev.reflectionQuestions.filter(i => i.id !== id) })), 
        'reflectionQuestions', id
    );
  };

  const upsertReflectionAnswer = async (d: ReflectionAnswer) => {
    const dStr = { ...d, id: String(d.id), questionId: String(d.questionId), studentId: String(d.studentId) };
    await handleAsyncAction(
        () => {
             const exists = state.reflectionAnswers.find(a => String(a.questionId) === dStr.questionId && String(a.studentId) === dStr.studentId);
             return exists ? sheetService.update('reflectionAnswers', dStr) : sheetService.create('reflectionAnswers', dStr);
        },
        () => {
            setState(prev => {
                const list = prev.reflectionAnswers;
                const idx = list.findIndex(a => String(a.questionId) === dStr.questionId && String(a.studentId) === dStr.studentId);
                const newArr = [...list];
                if (idx >= 0) newArr[idx] = dStr; else newArr.push(dStr);
                return { ...prev, reflectionAnswers: newArr };
            });
        },
        'reflectionAnswers', dStr.id
    );
  };

  const upsertNote = async (d: StudentNote) => {
    const dStr = { ...d, id: String(d.id), studentId: String(d.studentId) };
    await handleAsyncAction(
      () => {
        const exists = state.notes.find(a => String(a.studentId) === dStr.studentId);
        return exists ? sheetService.update('notes', dStr) : sheetService.create('notes', dStr);
      },
      () => {
        setState(prev => {
            const list = prev.notes;
            const idx = list.findIndex(a => String(a.studentId) === dStr.studentId);
            const newArr = [...list];
            if (idx >= 0) newArr[idx] = dStr; else newArr.push(dStr);
            return { ...prev, notes: newArr };
        });
      },
      'notes', dStr.id
    );
  };

  const upsertAttendance = async (d: AttendanceData) => {
    const dStr = { ...d, id: String(d.id), studentId: String(d.studentId) };
    await handleAsyncAction(
      () => {
        const exists = state.attendance.find(a => String(a.studentId) === dStr.studentId);
        return exists ? sheetService.update('attendance', dStr) : sheetService.create('attendance', dStr);
      },
      () => {
        setState(prev => {
            const list = prev.attendance;
            const idx = list.findIndex(a => String(a.studentId) === dStr.studentId);
            const newArr = [...list];
            if (idx >= 0) newArr[idx] = dStr; else newArr.push(dStr);
            return { ...prev, attendance: newArr };
        });
      },
      'attendance', dStr.id
    );
  };

  return (
    <AppContext.Provider value={{
      ...state,
      isLoading, isOnline, refreshData,
      login, logout,
      confirmAction, isConfirmModalOpen, confirmModalMessage, confirmModalTitle, confirmModalBtnText, confirmModalVariant, handleConfirmModalConfirm, handleConfirmModalCancel,
      addClass, updateClass, deleteClass,
      addStudent, updateStudent, deleteStudent,
      addTp, updateTp, deleteTp,
      upsertAssessment, upsertCategoryResult, setSettings,
      addP5Criteria, updateP5Criteria, deleteP5Criteria, upsertP5Assessment,
      addReflection, updateReflection, deleteReflection,
      addReflectionQuestion, deleteReflectionQuestion, upsertReflectionAnswer,
      upsertNote, upsertAttendance,
      handleBackup, handleRestore, handleResetSystem
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};