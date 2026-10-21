import React from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Building2, 
  CheckCircle2, 
  Plus, 
  MapPin,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Institution, Evaluator, ProgramSchedule } from '../types';
import { getDayNameKorean } from '../utils/calendarUtils';

interface DayScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string; // YYYY-MM-DD
  institutions: Institution[];
  evaluators: Evaluator[];
  onOpenCoordinationModal: (institutionId?: string, programId?: string, date?: string) => void;
  onOpenInstitutionDetail: (institution: Institution) => void;
}

export const DayScheduleModal: React.FC<DayScheduleModalProps> = ({
  isOpen,
  onClose,
  dateStr,
  institutions,
  evaluators,
  onOpenCoordinationModal,
  onOpenInstitutionDetail,
}) => {
  if (!isOpen || !dateStr) return null;

  // Find all programs on this date
  const programsOnDate: { inst: Institution; prog: ProgramSchedule }[] = [];
  institutions.forEach((inst) => {
    inst.programs.forEach((prog) => {
      if (prog.date === dateStr) {
        programsOnDate.push({ inst, prog });
      }
    });
  });

  // Find confirmed visits on this date
  const confirmedVisitsOnDate = institutions.filter(
    (i) => i.confirmedVisitDate === dateStr && (i.evaluationStatus === 'confirmed' || i.evaluationStatus === 'completed')
  );

  // Find available evaluators on this date
  const availableEvaluators = evaluators.filter((ev) =>
    ev.availableDates.includes(dateStr)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 font-bold text-xs">
              {dateStr.slice(8)}일
            </div>
            <div>
              <h2 className="text-base font-bold">
                {dateStr} ({getDayNameKorean(dateStr)}요일) 일정 상세
              </h2>
              <p className="text-xs text-slate-400">
                상주작가 프로그램 진행 현황 및 방문 가능한 평가위원 목록
              </p>
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
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Section 1: Confirmed Visits */}
          {confirmedVisitsOnDate.length > 0 && (
            <div>
              <h3 className="font-bold text-emerald-900 text-xs flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>현장평가 방문 확정 ({confirmedVisitsOnDate.length}건)</span>
              </h3>
              <div className="space-y-2">
                {confirmedVisitsOnDate.map((inst) => {
                  const evalNames = inst.assignedEvaluatorIds
                    .map((id) => evaluators.find((e) => e.id === id)?.name)
                    .filter(Boolean)
                    .join(', ');

                  return (
                    <div
                      key={inst.id}
                      onClick={() => {
                        onClose();
                        onOpenInstitutionDetail(inst);
                      }}
                      className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100/70 transition-colors cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between font-bold text-emerald-950">
                        <span className="text-sm">{inst.name} ({inst.type})</span>
                        <span className="font-mono bg-emerald-600 text-white px-2 py-0.5 rounded text-xs">
                          {inst.confirmedVisitTime || '14:00'} 실사
                        </span>
                      </div>
                      <div className="text-slate-600 text-[11px]">
                        상주작가: <strong>{inst.writerName}</strong> • 담당 평가위원: <strong>{evalNames || '배정중'}</strong>
                      </div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{inst.address}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 2: Active Writer Programs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-purple-600" />
                <span>상주작가 프로그램 ({programsOnDate.length}건)</span>
              </h3>
              <span className="text-[11px] text-slate-400">평가위원이 참관 가능한 프로그램</span>
            </div>

            {programsOnDate.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500">
                해당 일자에 등록된 상주작가 프로그램이 없습니다.
              </div>
            ) : (
              <div className="space-y-2">
                {programsOnDate.map(({ inst, prog }) => {
                  const isConfirmed = inst.confirmedVisitDate === dateStr && inst.evaluationStatus === 'confirmed';

                  return (
                    <div
                      key={prog.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-purple-300 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-600" />
                          <span className="text-sm font-semibold">{prog.title}</span>
                          <span className="text-[10px] text-slate-500 font-normal">[{inst.name}]</span>
                        </div>
                        <span className="text-xs font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-semibold">
                          {prog.startTime} ~ {prog.endTime}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600">{prog.description}</p>

                      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500 gap-2">
                        <div>
                          작가: <strong>{inst.writerName}</strong> • 장소: {prog.locationRoom} • 참여: {prog.currentParticipants}/{prog.maxParticipants}명
                        </div>
                        {!isConfirmed && (
                          <button
                            onClick={() => {
                              onClose();
                              onOpenCoordinationModal(inst.id, prog.id, dateStr);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
                          >
                            <span>방문 조율/제안</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Available Evaluators */}
          <div>
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 mb-2">
              <User className="w-4 h-4 text-blue-600" />
              <span>방문 가능한 평가위원 ({availableEvaluators.length}명)</span>
            </h3>

            {availableEvaluators.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500">
                해당 일자에 가능일로 등록한 평가위원이 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableEvaluators.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{ev.name} 위원</div>
                      <div className="text-[10px] text-slate-500">
                        {ev.affiliation} • {ev.specialty}
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
                      방문 가능
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onOpenCoordinationModal(undefined, undefined, dateStr);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>이 날짜에 새 실사 조율</span>
          </button>

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
