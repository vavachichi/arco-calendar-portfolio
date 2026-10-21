import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  User, 
  Building2, 
  Send, 
  Sparkles,
  Info,
  MapPin,
  FileText
} from 'lucide-react';
import { Institution, Evaluator, ProgramSchedule, UserRole } from '../types';
import { getDayNameKorean } from '../utils/calendarUtils';

interface SmartCoordinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  institutions: Institution[];
  evaluators: Evaluator[];
  initialInstitutionId?: string;
  initialProgramId?: string;
  initialDate?: string;
  currentRole: UserRole;
  onConfirmVisit: (institutionId: string, programId: string, date: string, time: string, evaluatorIds: string[], note?: string) => void;
  onSendProposal: (institutionId: string, programId: string, date: string, time: string, evaluatorId: string, message: string) => void;
}

export const SmartCoordinationModal: React.FC<SmartCoordinationModalProps> = ({
  isOpen,
  onClose,
  institutions,
  evaluators,
  initialInstitutionId,
  initialProgramId,
  initialDate,
  currentRole,
  onConfirmVisit,
  onSendProposal,
}) => {
  const [selectedInstId, setSelectedInstId] = useState<string>(
    initialInstitutionId || institutions[0]?.id || ''
  );
  const [selectedProgId, setSelectedProgId] = useState<string>(
    initialProgramId || ''
  );
  const [visitDate, setVisitDate] = useState<string>(
    initialDate || '2026-08-20'
  );
  const [visitTime, setVisitTime] = useState<string>('14:00');
  const [primaryEvaluatorId, setPrimaryEvaluatorId] = useState<string>(
    evaluators[0]?.id || ''
  );
  const [secondaryEvaluatorId, setSecondaryEvaluatorId] = useState<string>(
    evaluators[1]?.id || ''
  );
  const [noteMessage, setNoteMessage] = useState<string>('');

  const targetInst = institutions.find((i) => i.id === selectedInstId);
  const targetProg = targetInst?.programs.find((p) => p.id === selectedProgId) || targetInst?.programs[0];

  // Update selected program when institution changes
  useEffect(() => {
    if (targetInst && targetInst.programs.length > 0) {
      if (!targetInst.programs.some((p) => p.id === selectedProgId)) {
        setSelectedProgId(targetInst.programs[0].id);
        setVisitDate(targetInst.programs[0].date);
        setVisitTime(targetInst.programs[0].startTime);
      }
    }
  }, [selectedInstId, targetInst]);

  useEffect(() => {
    if (initialInstitutionId) setSelectedInstId(initialInstitutionId);
    if (initialProgramId) setSelectedProgId(initialProgramId);
    if (initialDate) setVisitDate(initialDate);
  }, [initialInstitutionId, initialProgramId, initialDate]);

  if (!isOpen || !targetInst) return null;

  // Conflict & Verification Checks
  const primaryEval = evaluators.find((e) => e.id === primaryEvaluatorId);
  const secondaryEval = evaluators.find((e) => e.id === secondaryEvaluatorId);

  const isPrimaryAvailable = primaryEval?.availableDates.includes(visitDate);
  const isSecondaryAvailable = secondaryEval?.availableDates.includes(visitDate);
  const isProgramActiveOnDate = targetInst.programs.some((p) => p.date === visitDate);
  const hasRegionMatch = primaryEval?.preferredRegions.includes(targetInst.region);

  const handleConfirm = () => {
    const evalIds = [primaryEvaluatorId];
    if (secondaryEvaluatorId && secondaryEvaluatorId !== primaryEvaluatorId) {
      evalIds.push(secondaryEvaluatorId);
    }
    onConfirmVisit(
      selectedInstId,
      targetProg ? targetProg.id : '',
      visitDate,
      visitTime,
      evalIds,
      noteMessage
    );
    onClose();
  };

  const handleProposal = () => {
    onSendProposal(
      selectedInstId,
      targetProg ? targetProg.id : '',
      visitDate,
      visitTime,
      primaryEvaluatorId,
      noteMessage || `${visitDate} ${visitTime} 상주작가 프로그램 현장평가 방문을 제안합니다.`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">상주작가 현장평가 방문 일정 조율</h2>
              <p className="text-xs text-slate-400">참여기관 프로그램 진행일시와 평가위원 일정 매칭</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Target Institution Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              1. 대상 기관 선택 (도서관 / 서점)
            </label>
            <select
              value={selectedInstId}
              onChange={(e) => setSelectedInstId(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 font-medium text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  [{inst.region}] {inst.name} ({inst.type}) - 상주작가: {inst.writerName}
                </option>
              ))}
            </select>
            <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-2">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>{targetInst.address}</span>
              <span>• 담당: {targetInst.contactPerson} ({targetInst.contactPhone})</span>
            </div>
          </div>

          {/* Target Writer Program Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              2. 참관할 상주작가 프로그램 선택
            </label>
            <div className="space-y-2">
              {targetInst.programs.map((prog) => {
                const isSelected = prog.id === selectedProgId;
                return (
                  <div
                    key={prog.id}
                    onClick={() => {
                      setSelectedProgId(prog.id);
                      setVisitDate(prog.date);
                      setVisitTime(prog.startTime);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-300'
                        : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-600" />
                        {prog.title}
                      </span>
                      <span className="text-xs font-mono text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                        {prog.date} ({getDayNameKorean(prog.date)}) {prog.startTime}~{prog.endTime}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">{prog.description}</p>
                    <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-3">
                      <span>장소: {prog.locationRoom}</span>
                      <span>대상: {prog.targetAudience}</span>
                      <span>참여: {prog.currentParticipants}/{prog.maxParticipants}명</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visit Date & Time setting */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                3. 현장평가 방문 일자
              </label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 font-medium text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                현장평가 방문 시작 시간
              </label>
              <input
                type="time"
                value={visitTime}
                onChange={(e) => setVisitTime(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 font-medium text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>

          {/* Evaluator Selection (2-person committee) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                4. 주 평가위원 (정)
              </label>
              <select
                value={primaryEvaluatorId}
                onChange={(e) => setPrimaryEvaluatorId(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 font-medium text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {evaluators.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} 위원 ({ev.specialty} / {ev.affiliation.slice(0, 10)})
                  </option>
                ))}
              </select>
              <div className="mt-1 text-[11px]">
                {isPrimaryAvailable ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> 해당 일자 방문 가능
                  </span>
                ) : (
                  <span className="text-rose-600 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> 해당 일자 가능일 미등록 (사전 확인 요망)
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                부 평가위원 (2인 1조)
              </label>
              <select
                value={secondaryEvaluatorId}
                onChange={(e) => setSecondaryEvaluatorId(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 font-medium text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="">배정 안 함 (1인 단독)</option>
                {evaluators
                  .filter((e) => e.id !== primaryEvaluatorId)
                  .map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} 위원 ({ev.specialty} / {ev.affiliation.slice(0, 10)})
                    </option>
                  ))}
              </select>
              <div className="mt-1 text-[11px]">
                {secondaryEvaluatorId ? (
                  isSecondaryAvailable ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> 해당 일자 방문 가능
                    </span>
                  ) : (
                    <span className="text-amber-600 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> 해당 일자 가능일 미등록
                    </span>
                  )
                ) : (
                  <span className="text-slate-400">1인 단독 방문으로 설정됨</span>
                )}
              </div>
            </div>
          </div>

          {/* Validation & Conflict Alert Banner */}
          <div className={`p-3 rounded-xl border text-xs ${
            isProgramActiveOnDate && (isPrimaryAvailable || isSecondaryAvailable)
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className="font-bold flex items-center gap-1.5 mb-1">
              {isProgramActiveOnDate ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              )}
              <span>일정 조율 정합성 검증 결과</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-700">
              <li>
                {isProgramActiveOnDate ? (
                  <span className="text-emerald-700">선택한 날짜에 상주작가 프로그램이 진행됩니다. (참관 가능)</span>
                ) : (
                  <span className="text-rose-600 font-bold">주의: 선택한 날짜에 등록된 프로그램이 없습니다. 프로그램 일정으로 조정을 권장합니다.</span>
                )}
              </li>
              <li>
                {hasRegionMatch ? (
                  <span className="text-emerald-700">평가위원의 선호 권역({targetInst.region})과 일치합니다.</span>
                ) : (
                  <span>타 권역 평가위원입니다. (이동 시간 고려 필요)</span>
                )}
              </li>
            </ul>
          </div>

          {/* Memo / Message */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              5. 조율 메모 및 안내 전달사항 (선택)
            </label>
            <textarea
              rows={2}
              value={noteMessage}
              onChange={(e) => setNoteMessage(e.target.value)}
              placeholder="예: 프로그램 시작 20분 전 도착하여 기관 시설 현장 확인 후 참관 예정"
              className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
          >
            취소
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleProposal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors shadow-2xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>조율 제안 전송</span>
            </button>
            <button
              onClick={handleConfirm}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>현장평가 방문 확정</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
