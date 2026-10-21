import React, { useState } from 'react';
import { 
  Building2, 
  User, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  FileCheck, 
  Sparkles, 
  Search, 
  SlidersHorizontal,
  Download,
  Plus,
  ArrowUpDown,
  BookOpen,
  FileSpreadsheet,
  FileText,
  Key,
  Edit3,
  UserCheck,
  RefreshCw,
  FolderArchive,
  ExternalLink,
  Users
} from 'lucide-react';
import { Institution, Evaluator, EvaluationRecord } from '../types';
import { 
  exportMatchedScheduleToCSV, 
  exportAccessKeysToCSV, 
  exportEvaluatorScheduleToCSV,
  exportToICS 
} from '../utils/exportUtils';
import { getDayNameKorean } from '../utils/calendarUtils';

interface AdminDashboardProps {
  institutions: Institution[];
  evaluators: Evaluator[];
  evaluationRecords: EvaluationRecord[];
  onOpenCoordinationModal: (institutionId?: string) => void;
  onOpenEvaluationForm: (institution: Institution) => void;
  onOpenInstitutionDetail: (institution: Institution) => void;
  onOpenAIAssistant: () => void;
  onOpenSmartMatch: () => void;
  onOpenNewProgramModal: () => void;
  onOpenBatchImport?: () => void;
  onReassignEvaluator?: (institutionId: string, oldEvaluatorId: string, newEvaluatorId: string) => void;
  onUpdateInstitutionSchedule?: (institutionId: string, programId: string, date: string, time: string) => void;
  onShowToast: (msg: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  institutions,
  evaluators,
  evaluationRecords,
  onOpenCoordinationModal,
  onOpenEvaluationForm,
  onOpenInstitutionDetail,
  onOpenAIAssistant,
  onOpenSmartMatch,
  onOpenNewProgramModal,
  onOpenBatchImport,
  onReassignEvaluator,
  onUpdateInstitutionSchedule,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'institutions_96' | 'evaluators_12' | 'activity_files'>('institutions_96');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedEvaluatorFilter, setSelectedEvaluatorFilter] = useState<string>('all');

  // Editing state for quick reschedule
  const [editingInst, setEditingInst] = useState<Institution | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editProgId, setEditProgId] = useState('');

  // Reassignment state
  const [reassignInst, setReassignInst] = useState<Institution | null>(null);
  const [selectedNewEvaluatorId, setSelectedNewEvaluatorId] = useState<string>('');

  // Calculate metrics
  const totalCount = institutions.length; // 96
  const confirmedCount = institutions.filter((i) => i.evaluationStatus === 'confirmed').length;
  const completedCount = institutions.filter((i) => i.evaluationStatus === 'completed').length;
  const pendingCount = institutions.filter((i) => i.evaluationStatus === 'pending' || i.evaluationStatus === 'proposing').length;
  const totalPrograms = institutions.reduce((acc, i) => acc + i.programs.length, 0);
  const totalUploadedFiles = institutions.reduce((acc, i) => acc + (i.activityFiles?.length || 0), 0);

  const confirmationRate = totalCount > 0 ? Math.round(((confirmedCount + completedCount) / totalCount) * 100) : 0;

  // Filtered institutions
  const filtered = institutions.filter((inst) => {
    const matchesSearch =
      inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.writerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.subRegion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inst.accessKey || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = selectedRegion === 'all' || inst.region === selectedRegion;
    const matchesType = selectedType === 'all' || inst.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || inst.evaluationStatus === selectedStatus;
    const matchesEvaluator = selectedEvaluatorFilter === 'all' || inst.assignedEvaluatorIds.includes(selectedEvaluatorFilter);
    return matchesSearch && matchesRegion && matchesType && matchesStatus && matchesEvaluator;
  });

  const handleExportMasterCSV = () => {
    exportMatchedScheduleToCSV(institutions, evaluators, evaluationRecords);
    onShowToast('📊 96개 참여기관 전체 실사 매칭 총괄 엑셀 파일이 다운로드되었습니다.');
  };

  const handleExportAccessKeys = () => {
    exportAccessKeysToCSV(institutions, evaluators);
    onShowToast('🔑 96개 기관 및 12인 평가위원 로그인 접속키 엑셀 파일이 다운로드되었습니다.');
  };

  const handleOpenEditSchedule = (inst: Institution) => {
    setEditingInst(inst);
    setEditDate(inst.confirmedVisitDate || (inst.programs[0]?.date || '2026-08-20'));
    setEditTime(inst.confirmedVisitTime || (inst.programs[0]?.startTime || '14:00'));
    setEditProgId(inst.confirmedProgramId || (inst.programs[0]?.id || ''));
  };

  const handleSaveSchedule = () => {
    if (!editingInst) return;
    if (onUpdateInstitutionSchedule) {
      onUpdateInstitutionSchedule(editingInst.id, editProgId, editDate, editTime);
    }
    setEditingInst(null);
    onShowToast(`✓ [${editingInst.name}] 방문 일정이 ${editDate} ${editTime}으로 변경되었습니다.`);
  };

  const handleOpenReassign = (inst: Institution) => {
    setReassignInst(inst);
    setSelectedNewEvaluatorId(inst.assignedEvaluatorIds[0] || evaluators[0]?.id || '');
  };

  const handleSaveReassign = () => {
    if (!reassignInst || !selectedNewEvaluatorId) return;
    const oldEvalId = reassignInst.assignedEvaluatorIds[0] || '';
    if (onReassignEvaluator) {
      onReassignEvaluator(reassignInst.id, oldEvalId, selectedNewEvaluatorId);
    }
    const newEval = evaluators.find((e) => e.id === selectedNewEvaluatorId);
    setReassignInst(null);
    onShowToast(`✓ [${reassignInst.name}] 담당 평가위원이 '${newEval?.name || '신규 위원'}'님으로 재배정되었습니다.`);
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Top Banner & KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>참여 기관 (도서관/문학관/서점)</span>
            <Building2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{totalCount}개관</div>
          <div className="text-[11px] text-slate-500">등록 프로그램 총 {totalPrograms}개</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>현장평가 위원진</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-800 font-mono">{evaluators.length}명</div>
          <div className="text-[11px] text-emerald-700 font-medium">1인당 8곳 전담 매칭</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>전체 실사 확정률</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono">{confirmationRate}%</div>
          <div className="text-[11px] text-slate-500">
            {confirmedCount + completedCount}관 확정 / {pendingCount}관 조율 중
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>기관 실적 서류 제출</span>
            <FolderArchive className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-900 font-mono">{totalUploadedFiles}건</div>
          <div className="text-[11px] text-slate-500">한글(HWP) 및 엑셀(XLSX) 대장</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1 col-span-2 lg:col-span-1">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>현장평가표 작성</span>
            <FileCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-900 font-mono">{evaluationRecords.length}건</div>
          <div className="text-[11px] text-slate-500">실사 완료 및 점수 집계</div>
        </div>
      </div>

      {/* Main Operations Control Bar */}
      <div className="bg-gradient-to-r from-[#10243e] via-[#16365c] to-[#10243e] text-white rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-[#234670]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">상주작가 지원사업 현장평가 운영본부 관리자 포털</h2>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#cca43b]/20 text-[#cca43b] border border-[#cca43b]/40 font-bold">
              96개 기관 • 12인 평가위원
            </span>
          </div>
          <p className="text-xs text-slate-200 mt-1">
            기관별 상주작가 프로그램과 평가위원 방문 일정을 실시간 조율하고, 기관별 제출 실적 서류를 총괄 관리합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenBatchImport && (
            <button
              onClick={onOpenBatchImport}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#cca43b] hover:bg-[#b89332] text-[#10243e] text-xs font-bold transition shadow-md cursor-pointer border border-[#e5c158]"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#10243e]" />
              <span>엑셀 매칭 일괄 업로드 (.xlsx)</span>
            </button>
          )}

          <button
            onClick={handleExportMasterCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold transition shadow-md cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#cca43b]" />
            <span>전체 96개관 매칭 마스터 엑셀 받기</span>
          </button>

          <button
            onClick={handleExportAccessKeys}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition border border-white/20 cursor-pointer"
          >
            <Key className="w-4 h-4 text-[#cca43b]" />
            <span>접속키 일람표</span>
          </button>

          <button
            onClick={onOpenSmartMatch}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1e40af] hover:bg-[#1d4ed8] text-white text-xs font-bold transition shadow-xs border border-blue-400/30 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#cca43b]" />
            <span>스마트 매칭</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-100 rounded-t-xl p-1 gap-1">
        <button
          onClick={() => setActiveTab('institutions_96')}
          className={`flex-1 py-3 px-4 rounded-lg font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'institutions_96'
              ? 'bg-white text-[#142d4c] shadow-xs border border-slate-200 ring-1 ring-blue-500/20'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 text-[#2563eb]" />
          <span>전체 96개 참여기관 총괄 목록 (일정/위원 수정)</span>
          <span className="text-xs font-mono bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full font-bold">
            {filtered.length}개관
          </span>
        </button>

        <button
          onClick={() => setActiveTab('evaluators_12')}
          className={`flex-1 py-3 px-4 rounded-lg font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'evaluators_12'
              ? 'bg-white text-[#142d4c] shadow-xs border border-slate-200 ring-1 ring-blue-500/20'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-[#2563eb]" />
          <span>12인 평가위원별 8개 기관 배정 현황 (1:8 매칭)</span>
          <span className="text-xs font-mono bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full font-bold">
            12명
          </span>
        </button>

        <button
          onClick={() => setActiveTab('activity_files')}
          className={`flex-1 py-3 px-4 rounded-lg font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'activity_files'
              ? 'bg-white text-[#142d4c] shadow-xs border border-slate-200 ring-1 ring-blue-500/20'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FolderArchive className="w-4 h-4 text-[#2563eb]" />
          <span>기관 제출 실적 서류 아카이브 (한글/엑셀)</span>
          <span className="text-xs font-mono bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full font-bold">
            {totalUploadedFiles}건
          </span>
        </button>
      </div>

      {/* TAB 1: 96 INSTITUTIONS TABLE & QUICK ACTIONS */}
      {activeTab === 'institutions_96' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
          {/* Table Search & Filter Toolbar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="기관명, 작가명, 접속키, 지역 검색..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-800"
                />
              </div>

              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-800"
              >
                <option value="all">전체 권역 (전국)</option>
                <option value="서울">서울</option>
                <option value="경기">경기</option>
                <option value="인천">인천</option>
                <option value="강원">강원</option>
                <option value="충청">충청</option>
                <option value="전라">전라</option>
                <option value="경상">경상</option>
                <option value="제주">제주</option>
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-800"
              >
                <option value="all">전체 유형 (도서관/문학관/서점)</option>
                <option value="도서관">도서관</option>
                <option value="문학관">문학관</option>
                <option value="서점">서점</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-800"
              >
                <option value="all">전체 조율 상태</option>
                <option value="confirmed">방문 확정</option>
                <option value="proposing">협의 중</option>
                <option value="pending">미정/대기</option>
                <option value="completed">평가 완료</option>
              </select>

              <select
                value={selectedEvaluatorFilter}
                onChange={(e) => setSelectedEvaluatorFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-800"
              >
                <option value="all">전체 평가위원 (12인)</option>
                {evaluators.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} 위원 ({ev.affiliation})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenCoordinationModal()}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>새 일정 조율</span>
              </button>
            </div>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden p-3 space-y-3 bg-slate-50">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500 bg-white rounded-xl border border-slate-200">
                검색 조건에 일치하는 기관이 없습니다.
              </div>
            ) : (
              filtered.map((inst) => {
                const assignedEv = evaluators.find((e) => inst.assignedEvaluatorIds.includes(e.id));
                const isConfirmed = inst.evaluationStatus === 'confirmed';
                const isCompleted = inst.evaluationStatus === 'completed';
                const mainProg = inst.programs.find((p) => p.id === inst.confirmedProgramId) || inst.programs[0];

                return (
                  <article key={`mobile-${inst.id}`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {inst.accessKey}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                            {inst.type}
                          </span>
                        </div>
                        <button
                          onClick={() => onOpenInstitutionDetail(inst)}
                          className="block text-left font-bold text-slate-950 text-sm leading-snug hover:text-emerald-700"
                        >
                          {inst.name}
                        </button>
                        <div className="text-[11px] text-slate-500 mt-1">
                          {inst.region} {inst.subRegion}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isConfirmed && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            방문 확정
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                            <CheckCircle2 className="w-3 h-3" />
                            평가 완료
                          </span>
                        )}
                        {!isConfirmed && !isCompleted && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <AlertCircle className="w-3 h-3" />
                            조율중
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-xs">
                      <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5">
                        <div className="text-[10px] font-bold text-slate-400 mb-1">상주작가</div>
                        <div className="font-semibold text-slate-900">{inst.writerName} 작가</div>
                      </div>

                      <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5">
                        <div className="text-[10px] font-bold text-slate-400 mb-1">담당 평가위원</div>
                        {assignedEv ? (
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate">{assignedEv.name} 위원</div>
                              <div className="text-[11px] text-slate-500 truncate">
                                {assignedEv.residence ? `거주: ${assignedEv.residence}` : assignedEv.affiliation}
                              </div>
                            </div>
                            <button
                              onClick={() => handleOpenReassign(inst)}
                              className="shrink-0 text-[11px] font-bold text-indigo-700 underline"
                            >
                              변경
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenReassign(inst)}
                            className="inline-flex items-center gap-1 text-xs text-amber-700 font-bold"
                          >
                            <UserCheck className="w-3 h-3" />
                            위원 배정하기
                          </button>
                        )}
                      </div>

                      <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5">
                        <div className="text-[10px] font-bold text-slate-400 mb-1">현장평가 일정</div>
                        {inst.confirmedVisitDate ? (
                          <div>
                            <div className="font-mono text-emerald-800 font-bold">
                              {inst.confirmedVisitDate} ({inst.confirmedVisitTime})
                            </div>
                            <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                              {mainProg?.title || '프로그램 참관'}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-400 font-mono">미확정</span>
                            <button
                              onClick={() => handleOpenEditSchedule(inst)}
                              className="text-[11px] font-bold text-indigo-700 underline"
                            >
                              일정지정
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-100 p-2.5">
                        <span className="text-[10px] font-bold text-slate-400">실적서류</span>
                        {inst.activityFiles && inst.activityFiles.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                            <FileText className="w-3 h-3" />
                            {inst.activityFiles.length}건
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">미제출</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <button
                        onClick={() => onOpenInstitutionDetail(inst)}
                        className="py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                      >
                        상세
                      </button>
                      <button
                        onClick={() => handleOpenEditSchedule(inst)}
                        className="py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition"
                      >
                        일정변경
                      </button>
                      <button
                        onClick={() => onOpenEvaluationForm(inst)}
                        disabled={!isConfirmed}
                        className={`py-2 rounded-lg text-xs font-bold transition ${
                          isConfirmed
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        평가표
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {/* Table Body */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/90 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold">기관명 / 코드</th>
                  <th className="py-3 px-4 font-bold">상주작가</th>
                  <th className="py-3 px-4 font-bold">담당 평가위원</th>
                  <th className="py-3 px-4 font-bold">현장평가 일시 / 참관 프로그램</th>
                  <th className="py-3 px-4 font-bold">실적서류</th>
                  <th className="py-3 px-4 font-bold">진행 상태</th>
                  <th className="py-3 px-4 font-bold text-right">변동 및 관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      검색 조건에 일치하는 기관이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filtered.map((inst) => {
                    const assignedEv = evaluators.find((e) => inst.assignedEvaluatorIds.includes(e.id));
                    const isConfirmed = inst.evaluationStatus === 'confirmed';
                    const isCompleted = inst.evaluationStatus === 'completed';
                    const mainProg = inst.programs.find(p => p.id === inst.confirmedProgramId) || inst.programs[0];

                    return (
                      <tr key={inst.id} className="hover:bg-slate-50/80 transition">
                        {/* Institution Name & Code */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                              {inst.accessKey}
                            </span>
                            <span
                              className="font-bold text-slate-900 hover:text-emerald-700 cursor-pointer"
                              onClick={() => onOpenInstitutionDetail(inst)}
                            >
                              {inst.name}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {inst.type} • {inst.region} {inst.subRegion}
                          </div>
                        </td>

                        {/* Resident Writer */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">
                            {inst.writerName} 작가
                          </div>
                        </td>

                        {/* Assigned Evaluator */}
                        <td className="py-3 px-4">
                          {assignedEv ? (
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1">
                                <span>{assignedEv.name} 위원</span>
                                <button
                                  onClick={() => handleOpenReassign(inst)}
                                  className="text-indigo-600 hover:text-indigo-800 text-[10px] underline ml-1"
                                  title="담당 평가위원 변경"
                                >
                                  [변경]
                                </button>
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {assignedEv.residence ? `거주: ${assignedEv.residence}` : ''}
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenReassign(inst)}
                              className="text-xs text-amber-700 font-bold hover:underline flex items-center gap-1"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>위원 배정하기</span>
                            </button>
                          )}
                        </td>

                        {/* Scheduled Date & Program */}
                        <td className="py-3 px-4 max-w-xs">
                          {inst.confirmedVisitDate ? (
                            <div>
                              <div className="font-mono text-emerald-800 font-bold flex items-center gap-1">
                                <span>{inst.confirmedVisitDate} ({inst.confirmedVisitTime})</span>
                                <button
                                  onClick={() => handleOpenEditSchedule(inst)}
                                  className="text-slate-400 hover:text-slate-600"
                                  title="일정 수정"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="text-[11px] text-slate-600 truncate font-medium mt-0.5">
                                {mainProg?.title || '프로그램 참관'}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="text-slate-400 font-mono">미확정</span>
                              <button
                                onClick={() => handleOpenEditSchedule(inst)}
                                className="text-indigo-600 hover:text-indigo-800 text-[10px] underline ml-1.5"
                              >
                                [일정지정]
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Files */}
                        <td className="py-3 px-4">
                          {inst.activityFiles && inst.activityFiles.length > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                              <FileText className="w-3 h-3" />
                              <span>{inst.activityFiles.length}건</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">미제출</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {isConfirmed && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>방문 확정</span>
                            </span>
                          )}
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                              <CheckCircle2 className="w-3 h-3 text-blue-600" />
                              <span>평가 완료</span>
                            </span>
                          )}
                          {!isConfirmed && !isCompleted && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              <span>일정 조율중</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onOpenInstitutionDetail(inst)}
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition"
                            >
                              상세
                            </button>
                            <button
                              onClick={() => handleOpenEditSchedule(inst)}
                              className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold transition"
                            >
                              일정변경
                            </button>
                            {isConfirmed && (
                              <button
                                onClick={() => onOpenEvaluationForm(inst)}
                                className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition"
                              >
                                평가표
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: 12 EVALUATORS GRID (1인당 8개 기관 매칭 현황) */}
      {activeTab === 'evaluators_12' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                12인 평가위원별 8개 기관 배정 현황 (총 96개관 100% 분배)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                각 평가위원 카드의 [8곳 일정 엑셀] 버튼을 누르면 해당 위원 전용 일정표를 다운로드할 수 있습니다.
              </p>
            </div>

            <button
              onClick={handleExportMasterCSV}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>전체 12인 일정 일괄 엑셀 다운로드</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {evaluators.map((ev, idx) => {
              const assignedInsts = institutions.filter((i) =>
                ev.assignedInstitutionIds.includes(i.id) || i.assignedEvaluatorIds.includes(ev.id)
              );
              const bookedInsts = assignedInsts.filter((i) => !!i.confirmedVisitDate);
              const isAllDone = bookedInsts.length >= 8;

              return (
                <div
                  key={ev.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:border-emerald-400 transition space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{ev.name} 위원</div>
                          <div className="text-[11px] text-slate-500">
                            {ev.residence ? `거주: ${ev.residence}` : ''} {ev.jurisdictionSummary ? `• 관할: ${ev.jurisdictionSummary}` : ''}
                          </div>
                        </div>
                      </div>

                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                        isAllDone ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {bookedInsts.length}/8곳 확정
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full transition-all"
                        style={{ width: `${(bookedInsts.length / 8) * 100}%` }}
                      />
                    </div>

                    {/* Assigned Institutions List */}
                    <div className="space-y-1 pt-1">
                      <div className="text-[11px] font-bold text-slate-600">배정된 8개 기관:</div>
                      <div className="space-y-1">
                        {assignedInsts.map((inst, iIdx) => {
                          const isBooked = !!inst.confirmedVisitDate;

                          return (
                            <div
                              key={inst.id}
                              className={`p-1.5 rounded-lg border text-[11px] flex items-center justify-between ${
                                isBooked ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-600'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                                <span className="font-bold text-[10px] text-slate-400">{iIdx + 1}.</span>
                                <span className="font-bold truncate">{inst.name}</span>
                              </div>

                              <div className="font-mono text-[10px] shrink-0">
                                {isBooked ? (
                                  <span className="text-emerald-800 font-bold">{inst.confirmedVisitDate?.slice(5)}</span>
                                ) : (
                                  <span className="text-amber-700">미확정</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Card bottom actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">접속키: {ev.accessKey}</span>
                    <button
                      onClick={() => {
                        exportEvaluatorScheduleToCSV(ev, institutions, evaluationRecords);
                        onShowToast(`📥 [${ev.name} 위원] 8개 기관 일정표 엑셀 다운로드 완료`);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>8곳 엑셀</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ACTIVITY FILES ARCHIVE (기관 제출 실적 서류 아카이브) */}
      {activeTab === 'activity_files' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                96개 참여기관 업로드 실적 서류 아카이브 (총 {totalUploadedFiles}건)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                도서관 및 서점에서 업로드한 한글(HWP) 운영 보고서, 엑셀(XLSX) 출석/정산 대장을 통합 열람 및 다운로드합니다.
              </p>
            </div>

            <button
              onClick={() => onShowToast('📥 전체 기관의 실적 서류 일괄 다운로드(ZIP 패키징) 준비 중입니다.')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>전체 서류 일괄 다운로드</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {institutions.map((inst) => {
              const files = inst.activityFiles || [];

              return (
                <div key={inst.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{inst.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {inst.region} {inst.subRegion} • 상주작가: {inst.writerName}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {files.length}건 제출
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {files.length === 0 ? (
                      <div className="text-[11px] text-slate-400 py-2 text-center">제출된 서류 없음</div>
                    ) : (
                      files.map((file) => (
                        <div
                          key={file.id}
                          className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]"
                        >
                          <div className="flex items-center gap-1.5 truncate max-w-[220px]">
                            <span className={`uppercase font-bold text-[9px] px-1 py-0.2 rounded ${
                              file.type === 'hwp' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {file.type}
                            </span>
                            <span className="truncate font-medium text-slate-800">{file.name}</span>
                          </div>

                          <button
                            onClick={() => onShowToast(`📥 '${file.name}' 파일을 다운로드합니다.`)}
                            className="p-1 text-slate-400 hover:text-slate-700"
                            title="다운로드"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* QUICK RESCHEDULE MODAL */}
      {editingInst && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-600" />
                <span>방문 일정 및 프로그램 변동 수정</span>
              </h3>
              <button onClick={() => setEditingInst(null)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900">{editingInst.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">상주작가: {editingInst.writerName}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">참관 프로그램 선택</label>
                <select
                  value={editProgId}
                  onChange={(e) => {
                    setEditProgId(e.target.value);
                    const selectedProg = editingInst.programs.find(p => p.id === e.target.value);
                    if (selectedProg) {
                      setEditDate(selectedProg.date);
                      setEditTime(selectedProg.startTime);
                    }
                  }}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                >
                  {editingInst.programs.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.date} {p.startTime}~{p.endTime})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">방문 일자</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">방문 시간</label>
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingInst(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100"
              >
                취소
              </button>
              <button
                onClick={handleSaveSchedule}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
              >
                일정 저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK REASSIGN EVALUATOR MODAL */}
      {reassignInst && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                <span>담당 평가위원 변경 / 재배정</span>
              </h3>
              <button onClick={() => setReassignInst(null)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900">{reassignInst.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">지역: {reassignInst.region} {reassignInst.subRegion}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">새로운 담당 평가위원 선택 (12인 중 1인)</label>
                <select
                  value={selectedNewEvaluatorId}
                  onChange={(e) => setSelectedNewEvaluatorId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                >
                  {evaluators.map((ev) => {
                    const currentCount = institutions.filter(i => i.assignedEvaluatorIds.includes(ev.id)).length;
                    return (
                      <option key={ev.id} value={ev.id}>
                        {ev.name} 위원 ({ev.affiliation} • 현재 {currentCount}곳 배정)
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setReassignInst(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100"
              >
                취소
              </button>
              <button
                onClick={handleSaveReassign}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm"
              >
                담당위원 변경 확정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
