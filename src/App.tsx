import { loadPortfolioData, PORTFOLIO_STORAGE_PREFIX } from './data/portfolioStorage';
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { CalendarHub } from './components/CalendarHub';
import { AdminDashboard } from './components/AdminDashboard';
import { EvaluatorPortal } from './components/EvaluatorPortal';
import { InstitutionPortal } from './components/InstitutionPortal';
import { SmartCoordinationModal } from './components/SmartCoordinationModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { EvaluationFormModal } from './components/EvaluationFormModal';
import { DayScheduleModal } from './components/DayScheduleModal';
import { InstitutionDetailModal } from './components/InstitutionDetailModal';
import { NewProgramModal } from './components/NewProgramModal';
import { SmartMatchModal } from './components/SmartMatchModal';
import { AccessKeyLoginModal } from './components/AccessKeyLoginModal';
import { BatchDataImportModal } from './components/BatchDataImportModal';

import { 
  INITIAL_INSTITUTIONS, 
  INITIAL_EVALUATORS, 
  INITIAL_PROPOSALS, 
  INITIAL_EVALUATION_RECORDS 
} from './data/mockData';
import { 
  Institution, 
  Evaluator, 
  CoordinationProposal, 
  EvaluationRecord, 
  UserRole, 
  ProgramSchedule 
} from './types';
import { 
  exportMatchedScheduleToCSV, 
  exportAccessKeysToCSV, 
  exportToICS 
} from './utils/exportUtils';
import { 
  CheckCircle2, 
  Sparkles, 
  Building2, 
  User, 
  KeyRound, 
  FileSpreadsheet, 
  UploadCloud 
} from 'lucide-react';

export default function App() {
  // Portfolio storage: never read or overwrite original keys.
  const [institutions, setInstitutions] = useState<Institution[]>(() => loadPortfolioData('institutions'));
  const [evaluators, setEvaluators] = useState<Evaluator[]>(() => loadPortfolioData('evaluators'));
  const [proposals, setProposals] = useState<CoordinationProposal[]>(() => loadPortfolioData('proposals'));
  const [evaluationRecords, setEvaluationRecords] = useState<EvaluationRecord[]>(() => loadPortfolioData('records'));

  // Authentication & Gate State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('evaluator');
  const [currentEvaluatorId, setCurrentEvaluatorId] = useState<string>(INITIAL_EVALUATORS[0]?.id || 'eval-1');
  const [currentInstitutionId, setCurrentInstitutionId] = useState<string>(INITIAL_INSTITUTIONS[0]?.id || 'inst-1');
  const [activeTab, setActiveTab] = useState<'calendar' | 'dashboard' | 'portal'>('calendar');

  // Modal Visibility States
  const [isKeyLoginOpen, setIsKeyLoginOpen] = useState(false);
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [isCoordinationModalOpen, setIsCoordinationModalOpen] = useState(false);
  const [coordinationTargetInstId, setCoordinationTargetInstId] = useState<string | undefined>();
  const [coordinationTargetProgId, setCoordinationTargetProgId] = useState<string | undefined>();
  const [coordinationTargetDate, setCoordinationTargetDate] = useState<string | undefined>();

  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isEvaluationFormOpen, setIsEvaluationFormOpen] = useState(false);
  const [selectedInstForEvaluation, setSelectedInstForEvaluation] = useState<Institution | null>(null);

  const [isDayScheduleOpen, setIsDayScheduleOpen] = useState(false);
  const [selectedDayStr, setSelectedDayStr] = useState<string>('2026-08-20');

  const [isInstDetailOpen, setIsInstDetailOpen] = useState(false);
  const [selectedInstForDetail, setSelectedInstForDetail] = useState<Institution | null>(null);

  const [isNewProgramOpen, setIsNewProgramOpen] = useState(false);
  const [newProgramTargetInstId, setNewProgramTargetInstId] = useState<string | undefined>();

  const [isSmartMatchOpen, setIsSmartMatchOpen] = useState(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(PORTFOLIO_STORAGE_PREFIX + 'institutions', JSON.stringify(institutions));
  }, [institutions]);

  useEffect(() => {
    localStorage.setItem(PORTFOLIO_STORAGE_PREFIX + 'evaluators', JSON.stringify(evaluators));
  }, [evaluators]);

  useEffect(() => {
    localStorage.setItem(PORTFOLIO_STORAGE_PREFIX + 'proposals', JSON.stringify(proposals));
  }, [proposals]);

  useEffect(() => {
    localStorage.setItem(PORTFOLIO_STORAGE_PREFIX + 'records', JSON.stringify(evaluationRecords));
  }, [evaluationRecords]);

  // Handler: Main Login Gate Action
  const handleLogin = (role: UserRole, targetId: string) => {
    setIsLoggedIn(true);
    setCurrentRole(role);
    if (role === 'evaluator') {
      if (targetId) setCurrentEvaluatorId(targetId);
      setActiveTab('portal');
    } else if (role === 'institution') {
      if (targetId) setCurrentInstitutionId(targetId);
      setActiveTab('portal');
    } else {
      setActiveTab('calendar');
    }
  };

  // Handler: Logout Action
  const handleLogout = () => {
    setIsLoggedIn(false);
    showToast('로그아웃되었습니다. 초기 로그인 화면으로 이동합니다.');
  };

  // Handler: Login Success via Access Key Modal (in-app switch)
  const handleLoginSuccess = (role: UserRole, targetId: string, message: string) => {
    setIsLoggedIn(true);
    setCurrentRole(role);
    if (role === 'evaluator' && targetId) {
      setCurrentEvaluatorId(targetId);
      setActiveTab('portal');
    } else if (role === 'institution' && targetId) {
      setCurrentInstitutionId(targetId);
      setActiveTab('portal');
    } else if (role === 'admin') {
      setActiveTab('calendar');
    }
    showToast(`🔑 ${message}`);
  };

  // Handler: Evaluator 1-Click Direct Booking or Rescheduling (Step 2 & Step 5)
  const handleBookVisit = (institutionId: string, programId: string, date: string, time: string) => {
    const inst = institutions.find((i) => i.id === institutionId);
    const ev = evaluators.find((e) => e.id === currentEvaluatorId);
    if (!inst || !ev) return;

    const isAlreadyBookedSameProgram =
      inst.confirmedProgramId === programId &&
      inst.confirmedVisitDate === date &&
      inst.assignedEvaluatorIds.includes(currentEvaluatorId);

    if (isAlreadyBookedSameProgram) {
      showToast(`이미 ${date} ${time} [${inst.name}]으로 예약되어 있습니다.`);
      return;
    }

    const isReschedule = Boolean(inst.confirmedVisitDate);
    const updatedEvaluatorIds = Array.from(new Set([...inst.assignedEvaluatorIds, currentEvaluatorId]));

    setInstitutions((prev) =>
      prev.map((item) => {
        if (item.id === institutionId) {
          return {
            ...item,
            evaluationStatus: 'confirmed',
            confirmedVisitDate: date,
            confirmedVisitTime: time,
            confirmedProgramId: programId,
            assignedEvaluatorIds: updatedEvaluatorIds,
          };
        }
        return item;
      })
    );

    // Also update evaluator assigned institutions
    setEvaluators((prev) =>
      prev.map((e) => {
        if (e.id === currentEvaluatorId) {
          return {
            ...e,
            assignedInstitutionIds: Array.from(new Set([...e.assignedInstitutionIds, institutionId])),
          };
        }
        return e;
      })
    );

    if (isReschedule) {
      showToast(`🔄 [${inst.name}] 실사 일정이 ${date} (${time})으로 변경 예약되었습니다.`);
    } else {
      showToast(`✅ [${inst.name}] ${date} (${time}) 실사 방문 예약이 완료되었습니다.`);
    }
  };

  // Handler: Evaluator Cancel Booking (Unlocks for re-booking while keeping assignment - Step 5)
  const handleCancelBooking = (institutionId: string) => {
    const inst = institutions.find((i) => i.id === institutionId);
    if (!inst) return;

    setInstitutions((prev) =>
      prev.map((item) => {
        if (item.id === institutionId) {
          return {
            ...item,
            evaluationStatus: 'pending',
            confirmedVisitDate: undefined,
            confirmedVisitTime: undefined,
            confirmedProgramId: undefined,
          };
        }
        return item;
      })
    );

    showToast(`🔄 [${inst.name}] 실사 예약이 초기화되었습니다. 다른 프로그램을 다시 선택하실 수 있습니다.`);
  };

  // Handler: Confirm a visit (Admin/Coordination)
  const handleConfirmVisit = (
    institutionId: string,
    programId: string,
    date: string,
    time: string,
    evaluatorIds: string[],
    note?: string
  ) => {
    setInstitutions((prev) =>
      prev.map((inst) => {
        if (inst.id === institutionId) {
          return {
            ...inst,
            evaluationStatus: 'confirmed',
            confirmedVisitDate: date,
            confirmedVisitTime: time,
            confirmedProgramId: programId,
            assignedEvaluatorIds: evaluatorIds,
            notes: note || inst.notes,
          };
        }
        return inst;
      })
    );

    const instName = institutions.find((i) => i.id === institutionId)?.name || '기관';
    showToast(`✅ [${instName}] ${date} ${time} 현장평가 방문 일정이 확정되었습니다.`);
  };

  // Handler: Send coordination proposal
  const handleSendProposal = (
    institutionId: string,
    programId: string,
    date: string,
    time: string,
    evaluatorId: string,
    message: string
  ) => {
    const senderEval = evaluators.find((e) => e.id === evaluatorId);
    const newProposal: CoordinationProposal = {
      id: `prop-${Date.now()}`,
      institutionId,
      programId,
      evaluatorId: evaluatorId || currentEvaluatorId || 'eval-1',
      proposedDate: date,
      proposedTime: time,
      senderRole: currentRole,
      senderName: currentRole === 'evaluator' ? (senderEval?.name || '평가위원') : '조사회 운영본부',
      status: 'pending',
      message,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setProposals((prev) => [newProposal, ...prev]);

    setInstitutions((prev) =>
      prev.map((inst) => {
        if (inst.id === institutionId && inst.evaluationStatus === 'pending') {
          return { ...inst, evaluationStatus: 'proposing' };
        }
        return inst;
      })
    );

    showToast(`📨 [방문 제안 전송] ${date} ${time} 조율 제안이 전달되었습니다.`);
  };

  // Handler: Accept proposal
  const handleAcceptProposal = (proposalId: string) => {
    const prop = proposals.find((p) => p.id === proposalId);
    if (!prop) return;

    setProposals((prev) =>
      prev.map((p) => (p.id === proposalId ? { ...p, status: 'accepted' } : p))
    );

    handleConfirmVisit(
      prop.institutionId,
      prop.programId,
      prop.proposedDate,
      prop.proposedTime,
      [prop.evaluatorId]
    );
  };

  // Handler: Add new program
  const handleAddProgram = (institutionId: string, program: ProgramSchedule) => {
    setInstitutions((prev) =>
      prev.map((inst) => {
        if (inst.id === institutionId) {
          return {
            ...inst,
            programs: [...inst.programs, program],
          };
        }
        return inst;
      })
    );
    showToast(`📚 '${program.title}' 프로그램이 캘린더에 성공적으로 등록되었습니다.`);
  };

  // Handler: Toggle evaluator available date
  const handleToggleAvailableDate = (evaluatorId: string, date: string) => {
    setEvaluators((prev) =>
      prev.map((ev) => {
        if (ev.id === evaluatorId) {
          const exists = ev.availableDates.includes(date);
          const nextDates = exists
            ? ev.availableDates.filter((d) => d !== date)
            : [...ev.availableDates, date].sort();
          return { ...ev, availableDates: nextDates };
        }
        return ev;
      })
    );
  };

  // Handler: Save evaluation record
  const handleSaveEvaluationRecord = (record: EvaluationRecord) => {
    setEvaluationRecords((prev) => [record, ...prev]);

    setInstitutions((prev) =>
      prev.map((inst) => {
        if (inst.id === record.institutionId) {
          return { ...inst, evaluationStatus: 'completed' };
        }
        return inst;
      })
    );

    showToast(`🏆 현장평가표(총점 ${record.totalScore}점)가 정상 저장되었습니다.`);
  };

  // Handler: Upload activity file from institution
  const handleUploadActivityFile = (institutionId: string, file: Omit<import('./types').ActivityFile, 'id'>) => {
    const newFile: import('./types').ActivityFile = {
      ...file,
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };

    setInstitutions((prev) =>
      prev.map((inst) => {
        if (inst.id === institutionId) {
          const currentFiles = inst.activityFiles || [];
          return {
            ...inst,
            activityFiles: [...currentFiles, newFile],
          };
        }
        return inst;
      })
    );
  };

  // Handler: Delete activity file
  const handleDeleteActivityFile = (institutionId: string, fileId: string) => {
    setInstitutions((prev) =>
      prev.map((inst) => {
        if (inst.id === institutionId) {
          return {
            ...inst,
            activityFiles: (inst.activityFiles || []).filter((f) => f.id !== fileId),
          };
        }
        return inst;
      })
    );
    showToast('🗑️ 실적 서류 파일이 삭제되었습니다.');
  };

  // Handler: Reassign Evaluator (Admin - Step 5)
  const handleReassignEvaluator = (institutionId: string, oldEvaluatorId: string, newEvaluatorId: string) => {
    const inst = institutions.find((i) => i.id === institutionId);
    const newEval = evaluators.find((e) => e.id === newEvaluatorId);

    setInstitutions((prev) =>
      prev.map((item) => {
        if (item.id === institutionId) {
          return {
            ...item,
            evaluationStatus: 'pending',
            confirmedVisitDate: undefined,
            confirmedVisitTime: undefined,
            confirmedProgramId: undefined,
            assignedEvaluatorIds: [newEvaluatorId],
          };
        }
        return item;
      })
    );

    setEvaluators((prev) =>
      prev.map((ev) => {
        if (ev.id === oldEvaluatorId) {
          return {
            ...ev,
            assignedInstitutionIds: ev.assignedInstitutionIds.filter((id) => id !== institutionId),
          };
        }
        if (ev.id === newEvaluatorId) {
          return {
            ...ev,
            assignedInstitutionIds: Array.from(new Set([...ev.assignedInstitutionIds, institutionId])),
          };
        }
        return ev;
      })
    );

    showToast(`🔄 [${inst?.name || '기관'}] 담당 위원이 '${newEval?.name || '신규 위원'}'님으로 재배정되었으며, 새 일정을 선택할 수 있도록 예약이 초기화되었습니다.`);
  };

  // Handler: Update Institution Schedule (Admin)
  const handleUpdateInstitutionSchedule = (
    institutionId: string,
    programId: string,
    date: string,
    time: string
  ) => {
    setInstitutions((prev) =>
      prev.map((inst) => {
        if (inst.id === institutionId) {
          return {
            ...inst,
            evaluationStatus: 'confirmed',
            confirmedVisitDate: date,
            confirmedVisitTime: time,
            confirmedProgramId: programId,
          };
        }
        return inst;
      })
    );
  };

  // Quick Open Modal Helpers
  const openCoordinationModal = (instId?: string, progId?: string, date?: string) => {
    setCoordinationTargetInstId(instId);
    setCoordinationTargetProgId(progId);
    setCoordinationTargetDate(date);
    setIsCoordinationModalOpen(true);
  };

  const openEvaluationForm = (inst: Institution) => {
    setSelectedInstForEvaluation(inst);
    setIsEvaluationFormOpen(true);
  };

  const openInstitutionDetail = (inst: Institution) => {
    setSelectedInstForDetail(inst);
    setIsInstDetailOpen(true);
  };

  const openDayScheduleModal = (dateStr: string) => {
    setSelectedDayStr(dateStr);
    setIsDayScheduleOpen(true);
  };

  const openNewProgramModal = (instId?: string) => {
    setNewProgramTargetInstId(instId || currentInstitutionId);
    setIsNewProgramOpen(true);
  };

  // Current active profiles
  const activeEvaluator = evaluators.find((e) => e.id === currentEvaluatorId) || evaluators[0];
  const activeInstitution = institutions.find((i) => i.id === currentInstitutionId) || institutions[0];

  // If not logged in, show full-screen login gateway
  if (!isLoggedIn) {
    return (
      <>
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
            <div className="px-4 py-3 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}
        <LoginScreen
          institutions={institutions}
          evaluators={evaluators}
          onLogin={handleLogin}
          onShowToast={showToast}
        />
      </>
    );
  }

  const confirmedCount = institutions.filter((i) => i.evaluationStatus === 'confirmed').length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="px-4 py-3 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main App Navigation Header */}
      <Header
        currentRole={currentRole}
        currentEvaluator={activeEvaluator}
        currentInstitution={activeInstitution}
        institutionsCount={institutions.length}
        evaluatorsCount={evaluators.length}
        confirmedCount={confirmedCount}
        onLogout={handleLogout}
        onExportCSV={() => exportMatchedScheduleToCSV(institutions, evaluators, evaluationRecords)}
        onExportAccessKeys={() => exportAccessKeysToCSV(institutions, evaluators)}
        onOpenKeyLogin={() => setIsKeyLoginOpen(true)}
        onOpenBatchImport={() => setIsBatchImportOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {/* If in admin mode, show tab toggles between Calendar & Management Dashboard */}
        {currentRole === 'admin' && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setActiveTab('calendar')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'calendar'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>📅 96개관 통합 캘린더</span>
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>📊 96개관 & 12위원 총괄대장</span>
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                onClick={() => exportMatchedScheduleToCSV(institutions, evaluators, evaluationRecords)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                title="전체 96개 기관 매칭 현황 종합 엑셀 다운로드"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>종합 매칭 엑셀 다운로드</span>
              </button>
              <button
                onClick={() => openCoordinationModal()}
                className="inline-flex items-center justify-center gap-1 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <span>+ 일정 직접 등록</span>
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Render based on Active Role */}
        {currentRole === 'admin' ? (
          activeTab === 'calendar' ? (
            <CalendarHub
              institutions={institutions}
              evaluators={evaluators}
              selectedDate="2026-08-20"
              onSelectDate={(d) => openDayScheduleModal(d)}
              onOpenCoordinationModal={openCoordinationModal}
              onOpenEvaluationForm={openEvaluationForm}
              onOpenInstitutionDetail={openInstitutionDetail}
              onOpenSmartMatchModal={() => setIsSmartMatchOpen(true)}
            />
          ) : (
            <AdminDashboard
              institutions={institutions}
              evaluators={evaluators}
              evaluationRecords={evaluationRecords}
              onOpenCoordinationModal={openCoordinationModal}
              onOpenEvaluationForm={openEvaluationForm}
              onOpenInstitutionDetail={openInstitutionDetail}
              onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
              onOpenSmartMatch={() => setIsSmartMatchOpen(true)}
              onOpenNewProgramModal={() => openNewProgramModal()}
              onOpenBatchImport={() => setIsBatchImportOpen(true)}
              onReassignEvaluator={handleReassignEvaluator}
              onUpdateInstitutionSchedule={handleUpdateInstitutionSchedule}
              onShowToast={showToast}
            />
          )
        ) : currentRole === 'evaluator' ? (
          activeEvaluator ? (
            <EvaluatorPortal
              currentEvaluator={activeEvaluator}
              institutions={institutions}
              evaluators={evaluators}
              evaluationRecords={evaluationRecords}
              onToggleAvailableDate={handleToggleAvailableDate}
              onOpenCoordinationModal={openCoordinationModal}
              onOpenEvaluationForm={openEvaluationForm}
              onOpenInstitutionDetail={openInstitutionDetail}
              onBookVisit={handleBookVisit}
              onCancelBooking={handleCancelBooking}
              onShowToast={showToast}
            />
          ) : null
        ) : (
          /* Institution Role */
          activeInstitution ? (
            <InstitutionPortal
              currentInstitution={activeInstitution}
              institutions={institutions}
              evaluators={evaluators}
              proposals={proposals}
              onUpdateInstitutions={setInstitutions}
              onOpenNewProgramModal={openNewProgramModal}
              onOpenCoordinationModal={openCoordinationModal}
              onAcceptProposal={handleAcceptProposal}
              onUploadActivityFile={handleUploadActivityFile}
              onDeleteActivityFile={handleDeleteActivityFile}
              onShowToast={showToast}
            />
          ) : null
        )}
      </main>

      {/* Access Key Authentication & Switching Modal */}
      <AccessKeyLoginModal
        isOpen={isKeyLoginOpen}
        onClose={() => setIsKeyLoginOpen(false)}
        institutions={institutions}
        evaluators={evaluators}
        onLoginSuccess={handleLoginSuccess}
        currentRole={currentRole}
        currentEvaluatorId={currentEvaluatorId}
        currentInstitutionId={currentInstitutionId}
      />

      {/* Batch Data Import & Access Key Management Modal */}
      <BatchDataImportModal
        isOpen={isBatchImportOpen}
        onClose={() => setIsBatchImportOpen(false)}
        institutions={institutions}
        evaluators={evaluators}
        onUpdateInstitutions={setInstitutions}
        onUpdateEvaluators={setEvaluators}
        onShowToast={showToast}
      />

      {/* Modals & Dialogs */}
      <SmartCoordinationModal
        isOpen={isCoordinationModalOpen}
        onClose={() => setIsCoordinationModalOpen(false)}
        institutions={institutions}
        evaluators={evaluators}
        initialInstitutionId={coordinationTargetInstId}
        initialProgramId={coordinationTargetProgId}
        initialDate={coordinationTargetDate}
        currentRole={currentRole}
        onConfirmVisit={handleConfirmVisit}
        onSendProposal={handleSendProposal}
      />

      <AIAssistantModal
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        institutions={institutions}
        evaluators={evaluators}
        onApplyScheduleMatch={handleConfirmVisit}
      />

      <EvaluationFormModal
        isOpen={isEvaluationFormOpen}
        onClose={() => setIsEvaluationFormOpen(false)}
        institution={selectedInstForEvaluation}
        evaluators={evaluators}
        onSaveRecord={handleSaveEvaluationRecord}
      />

      <DayScheduleModal
        isOpen={isDayScheduleOpen}
        onClose={() => setIsDayScheduleOpen(false)}
        dateStr={selectedDayStr}
        institutions={institutions}
        evaluators={evaluators}
        onOpenCoordinationModal={openCoordinationModal}
        onOpenInstitutionDetail={openInstitutionDetail}
      />

      <InstitutionDetailModal
        isOpen={isInstDetailOpen}
        onClose={() => setIsInstDetailOpen(false)}
        institution={selectedInstForDetail}
        evaluators={evaluators}
        proposals={proposals}
        onOpenCoordinationModal={openCoordinationModal}
        onOpenEvaluationForm={openEvaluationForm}
        onOpenNewProgramModal={openNewProgramModal}
      />

      <NewProgramModal
        isOpen={isNewProgramOpen}
        onClose={() => setIsNewProgramOpen(false)}
        institutions={institutions}
        initialInstitutionId={newProgramTargetInstId}
        onAddProgram={handleAddProgram}
      />

      <SmartMatchModal
        isOpen={isSmartMatchOpen}
        onClose={() => setIsSmartMatchOpen(false)}
        institutions={institutions}
        evaluators={evaluators}
        onConfirmMatch={handleConfirmVisit}
      />
    </div>
  );
}
