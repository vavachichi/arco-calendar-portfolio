import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  FileText,
  Car,
  BookOpen
} from 'lucide-react';
import { Institution, Evaluator, ProgramSchedule, CoordinationProposal } from '../types';
import { getDayNameKorean } from '../utils/calendarUtils';

interface InstitutionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  institution: Institution | null;
  evaluators: Evaluator[];
  proposals: CoordinationProposal[];
  onOpenCoordinationModal: (institutionId: string, programId?: string) => void;
  onOpenEvaluationForm: (institution: Institution) => void;
  onOpenNewProgramModal: (institutionId: string) => void;
}

export const InstitutionDetailModal: React.FC<InstitutionDetailModalProps> = ({
  isOpen,
  onClose,
  institution,
  evaluators,
  proposals,
  onOpenCoordinationModal,
  onOpenEvaluationForm,
  onOpenNewProgramModal,
}) => {
  if (!isOpen || !institution) return null;

  const assignedEvaluatorObjs = institution.assignedEvaluatorIds
    .map((id) => evaluators.find((e) => e.id === id))
    .filter(Boolean);

  const instProposals = proposals.filter((p) => p.institutionId === institution.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">{institution.name}</h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
                  {institution.type} • {institution.region}
                </span>
              </div>
              <p className="text-xs text-slate-400">{institution.address}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Top Status & Evaluation Status Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs text-slate-500 font-medium">현장평가 진행 상태</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-2">
                {institution.evaluationStatus === 'confirmed' && (
                  <>
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> 방문 확정 (실사 예정)
                    </span>
                    <span className="text-xs font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                      {institution.confirmedVisitDate} {institution.confirmedVisitTime}
                    </span>
                  </>
                )}
                {institution.evaluationStatus === 'proposing' && (
                  <span className="text-amber-700 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> 일정 조율 협의 중
                  </span>
                )}
                {institution.evaluationStatus === 'pending' && (
                  <span className="text-slate-600">일정 조율 대기 / 미배정</span>
                )}
                {institution.evaluationStatus === 'completed' && (
                  <span className="text-blue-700 flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> 현장평가 완료
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenCoordinationModal(institution.id);
                }}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                일정 조율 / 변경
              </button>
              {institution.evaluationStatus === 'confirmed' && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenEvaluationForm(institution);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-2xs"
                >
                  평가서 작성
                </button>
              )}
            </div>
          </div>

          {/* Section 1: Resident Writer Profile */}
          <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-purple-950 text-xs flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-purple-600" />
                <span>상주작가 정보</span>
              </h3>
            </div>

            <div className="text-slate-700">
              <span className="text-slate-400">상주작가명:</span>{' '}
              <strong className="text-slate-900">{institution.writerName}</strong> 작가
            </div>

            {institution.writerBio && (
              <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-purple-100 leading-relaxed">
                <strong className="text-slate-800">작가 소개 및 주요 경력:</strong> {institution.writerBio}
              </p>
            )}
          </div>

          {/* Section 2: Contact & Facility Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
              <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>기관 담당자 및 연락처</span>
              </div>
              <div className="text-[11px]">
                담당: <strong className="text-slate-900">{institution.contactPerson}</strong>
              </div>
              <div className="text-[11px] font-mono text-slate-600">
                연락처: {institution.contactPhone}
              </div>
              <div className="text-[11px] text-slate-500">
                이메일: {institution.contactEmail}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
              <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-slate-500" />
                <span>주차 및 방문 안내사항</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {institution.parkingInfo || '도서관/서점 주차장 이용 가능'}
              </p>
              {institution.notes && (
                <p className="text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded">
                  메모: {institution.notes}
                </p>
              )}
            </div>
          </div>

          {/* Section 3: Programs Timetable */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>상주작가 프로그램 시간표 ({institution.programs.length}개)</span>
              </h3>
              <button
                onClick={() => {
                  onClose();
                  onOpenNewProgramModal(institution.id);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>프로그램 추가</span>
              </button>
            </div>

            <div className="space-y-2">
              {institution.programs.length === 0 ? (
                <div className="p-6 text-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-500 space-y-1">
                  <Calendar className="w-7 h-7 mx-auto text-slate-400" />
                  <p className="font-semibold text-slate-700 text-xs">등록된 프로그램 일정이 없습니다.</p>
                  <p className="text-[11px] text-slate-400">상주작가 프로그램 일정이 추후 등록될 예정입니다.</p>
                </div>
              ) : (
                institution.programs.map((prog) => {
                  const isConfirmed =
                    institution.confirmedVisitDate === prog.date &&
                    institution.evaluationStatus === 'confirmed';

                  return (
                    <div
                      key={prog.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isConfirmed
                          ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-600" />
                          <span className="text-sm font-semibold">{prog.title}</span>
                          {isConfirmed && (
                            <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold">
                              실사 참관 확정
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono text-purple-800 bg-purple-50 px-2 py-0.5 rounded font-semibold">
                          {prog.date} ({getDayNameKorean(prog.date)}) {prog.startTime}~{prog.endTime}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 mt-1">{prog.description}</p>

                      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500 mt-2 gap-2">
                        <div>
                          장소: <strong>{prog.locationRoom}</strong> • 대상: {prog.targetAudience} • 참여자: {prog.currentParticipants}/{prog.maxParticipants}명
                        </div>
                        {!isConfirmed && (
                          <button
                            onClick={() => {
                              onClose();
                              onOpenCoordinationModal(institution.id, prog.id);
                            }}
                            className="text-emerald-700 hover:text-emerald-800 font-bold"
                          >
                            이 프로그램으로 방문 조율 →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
