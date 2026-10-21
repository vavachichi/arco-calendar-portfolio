import React, { useState } from 'react';
import { 
  Building2, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  User, 
  BookOpen, 
  FileText, 
  MapPin, 
  Phone, 
  Sparkles,
  Info,
  Upload,
  FileSpreadsheet,
  Trash2,
  Download,
  FolderOpen
} from 'lucide-react';
import { Institution, ProgramSchedule, Evaluator, CoordinationProposal, ActivityFile } from '../types';
import { getDayNameKorean } from '../utils/calendarUtils';
import { ExcelBatchProgramImport } from './ExcelBatchProgramImport';

interface InstitutionPortalProps {
  currentInstitution: Institution;
  institutions: Institution[];
  evaluators: Evaluator[];
  proposals: CoordinationProposal[];
  onUpdateInstitutions: (newInsts: Institution[]) => void;
  onOpenNewProgramModal: (institutionId: string) => void;
  onOpenCoordinationModal: (institutionId: string, programId?: string) => void;
  onAcceptProposal: (proposalId: string) => void;
  onUploadActivityFile?: (institutionId: string, file: Omit<ActivityFile, 'id'>) => void;
  onDeleteActivityFile?: (institutionId: string, fileId: string) => void;
  onShowToast: (msg: string) => void;
}

export const InstitutionPortal: React.FC<InstitutionPortalProps> = ({
  currentInstitution,
  institutions,
  evaluators,
  proposals,
  onUpdateInstitutions,
  onOpenNewProgramModal,
  onOpenCoordinationModal,
  onAcceptProposal,
  onUploadActivityFile,
  onDeleteActivityFile,
  onShowToast,
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const assignedEvaluatorObjs = currentInstitution.assignedEvaluatorIds
    .map((id) => evaluators.find((e) => e.id === id))
    .filter(Boolean);

  const isConfirmed = currentInstitution.evaluationStatus === 'confirmed';

  // Handle local file upload
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setTimeout(() => {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'hwp';
      let fileType: 'hwp' | 'xlsx' | 'docx' | 'pdf' = 'hwp';
      if (ext.includes('xls')) fileType = 'xlsx';
      else if (ext.includes('pdf')) fileType = 'pdf';
      else if (ext.includes('doc')) fileType = 'docx';

      const newFile: Omit<ActivityFile, 'id'> = {
        name: file.name,
        type: fileType,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadedAt: new Date().toISOString().split('T')[0],
        description: '상주작가 지원사업 수행 실적 및 상주작가 프로그램 운영 결과 보고서',
      };

      if (onUploadActivityFile) {
        onUploadActivityFile(currentInstitution.id, newFile);
      }
      setIsUploading(false);
      onShowToast(`📁 '${file.name}' 실적 파일이 성공적으로 업로드되었습니다. 관리자 및 평가위원이 확인할 수 있습니다.`);
    }, 500);
  };

  return (
    <div className="space-y-6 text-xs">
      {/* 1. Top Feature: Excel Batch Upload for 96 Institutions */}
      <ExcelBatchProgramImport
        institutions={institutions}
        onUpdateInstitutions={onUpdateInstitutions}
        onShowToast={onShowToast}
      />

      {/* 2. Selected Institution Banner */}
      <div className="bg-gradient-to-r from-[#10243e] via-[#16365c] to-[#10243e] text-white rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-[#234670]">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#cca43b] text-[#142d4c] flex items-center justify-center font-bold text-lg shadow-md shrink-0 border border-[#e5c158]">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-white">{currentInstitution.name}</h2>
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#cca43b]/20 text-[#cca43b] border border-[#cca43b]/40">
                접속키: {currentInstitution.accessKey}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/20">
                {currentInstitution.type} • {currentInstitution.region} ({currentInstitution.subRegion})
              </span>
            </div>
            <p className="text-xs text-slate-200 mt-1">
              {currentInstitution.address} • 기관 담당자: {currentInstitution.contactPerson || '미등록'} {currentInstitution.contactPhone ? `(${currentInstitution.contactPhone})` : ''}
            </p>
          </div>
        </div>

        {/* Visit Status Badge */}
        <div className="bg-white/10 p-4 rounded-xl backdrop-blur-xs text-xs self-start md:self-auto space-y-1 border border-white/15">
          <div className="text-slate-300 text-[11px] font-medium">현장평가 실사 방문 현황</div>
          {isConfirmed ? (
            <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{currentInstitution.confirmedVisitDate} ({getDayNameKorean(currentInstitution.confirmedVisitDate || '')}) {currentInstitution.confirmedVisitTime} 방문 확정</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[#cca43b] font-bold text-sm">
              <AlertCircle className="w-4 h-4 text-[#cca43b] shrink-0" />
              <span>평가위원 방문 일정 예약 대기 중</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Main 2-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Resident Writer & Programs & File Upload Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Resident Writer Profile */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <BookOpen className="w-4 h-4 text-purple-600" />
                <span>1년 상주작가 프로필</span>
              </h3>
            </div>

            <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-100 space-y-1">
              <div className="text-[11px] text-purple-700 font-semibold">선정 상주작가</div>
              <div className="text-base font-bold text-purple-950">
                {currentInstitution.writerName} 작가
              </div>
            </div>

            {currentInstitution.writerBio && (
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                <strong className="text-slate-900">작가 소개 및 창작 계획:</strong> {currentInstitution.writerBio}
              </p>
            )}
          </div>

          {/* Section 2: Program Schedule Upload & Management */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>상주작가 프로그램 일정 목록 ({currentInstitution.programs.length}개)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  상주작가가 진행하는 문학 프로그램 일정을 등록하여 평가위원 실사 예약을 받습니다.
                </p>
              </div>

              <button
                onClick={() => onOpenNewProgramModal(currentInstitution.id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-2xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>프로그램 일정 추가</span>
              </button>
            </div>

            {currentInstitution.programs.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center space-y-2">
                <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="font-bold text-slate-700 text-sm">등록된 상주작가 프로그램 일정이 없습니다.</div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  상주작가가 진행하는 문학 프로그램 일정을 [프로그램 일정 추가] 버튼 또는 상단 [엑셀 일괄 업로드]로 등록해주시면 평가위원이 방문 일정을 예약합니다.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentInstitution.programs.map((prog, idx) => {
                  const isConfirmedProg = isConfirmed && currentInstitution.confirmedProgramId === prog.id;

                  return (
                    <div
                      key={prog.id}
                      className={`p-4 rounded-xl border-2 transition ${
                        isConfirmedProg
                          ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-300/50'
                          : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-slate-900 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-purple-600 text-white text-[11px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-sm font-bold">{prog.title}</span>
                          {isConfirmedProg && (
                            <span className="text-[11px] bg-emerald-600 text-white px-2.5 py-0.5 rounded-full font-bold">
                              ✓ 평가위원 참관 확정
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-purple-900 bg-purple-100 px-2.5 py-1 rounded-md text-xs font-bold">
                          {prog.date} ({getDayNameKorean(prog.date)}) {prog.startTime}~{prog.endTime}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">{prog.description}</p>

                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/80 text-xs text-slate-500 mt-2.5">
                        <div>
                          장소: <strong>{prog.locationRoom}</strong> • 대상: <strong>{prog.targetAudience}</strong> • 정원: <strong>{prog.maxParticipants}명 (신청 {prog.currentParticipants}명)</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Activity Files Upload (한글/엑셀 실적 서류 업로드) */}
          <div className="bg-white rounded-2xl border border-indigo-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                  <span>기관 사업 활동 실적 서류 업로드 (한글 HWP / 엑셀 XLSX)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  상주작가 지원사업 수행 보고서 및 관련 정산 자료를 업로드하시면 관리자 및 평가위원이 열람합니다.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-2xs flex items-center gap-1.5 shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? '업로드 중...' : '내 PC 파일 선택'}</span>
                  <input
                    type="file"
                    accept=".hwp,.hwpx,.xlsx,.xls,.pdf,.doc,.docx"
                    onChange={handleFileInputChange}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Uploaded Files Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FolderOpen className="w-4 h-4 text-slate-600" />
                <span>제출된 실적 서류 목록 ({currentInstitution.activityFiles?.length || 0}건)</span>
              </h4>

              {currentInstitution.activityFiles && currentInstitution.activityFiles.length > 0 ? (
                <div className="space-y-2">
                  {currentInstitution.activityFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 hover:bg-slate-100 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {file.type}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-xs truncate">{file.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{file.description} • {file.size} • {file.uploadedAt}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          제출완료
                        </span>
                        {onDeleteActivityFile && (
                          <button
                            onClick={() => onDeleteActivityFile(currentInstitution.id, file.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="파일 삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p className="font-bold text-xs text-slate-700">등록된 실적 서류가 없습니다.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">상단의 [내 PC 파일 선택] 버튼으로 한글(HWP) 및 엑셀(XLSX) 파일을 업로드해주세요.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Assigned Evaluator Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-emerald-600" />
              <span>배정 현장평가위원 정보</span>
            </h3>

            {assignedEvaluatorObjs.length > 0 ? (
              <div className="space-y-3">
                {assignedEvaluatorObjs.map((ev) => (
                  <div key={ev.id} className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-950 text-sm">{ev.name} 평가위원</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white font-mono">
                        {ev.accessKey}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 space-y-0.5">
                      {ev.residence && <p>거주지역: <strong>{ev.residence}</strong></p>}
                      <p>관할권역: <strong>{ev.jurisdictionSummary || '8개 시설 전담'}</strong></p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-500">
                <p className="font-bold">배정된 평가위원이 없습니다.</p>
                <p className="text-[11px] text-slate-400 mt-1">관리자가 위원을 배정하면 자동으로 표시됩니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

