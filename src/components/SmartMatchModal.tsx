import React from 'react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  User, 
  Building2, 
  ArrowRight,
  SlidersHorizontal,
  Check
} from 'lucide-react';
import { Institution, Evaluator } from '../types';
import { findSmartMatches, MatchScoreResult, getDayNameKorean } from '../utils/calendarUtils';

interface SmartMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  institutions: Institution[];
  evaluators: Evaluator[];
  onConfirmMatch: (institutionId: string, programId: string, date: string, time: string, evaluatorIds: string[]) => void;
}

export const SmartMatchModal: React.FC<SmartMatchModalProps> = ({
  isOpen,
  onClose,
  institutions,
  evaluators,
  onConfirmMatch,
}) => {
  if (!isOpen) return null;

  const matches: MatchScoreResult[] = findSmartMatches(institutions, evaluators);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">스마트 최적 일정 매칭 추천 엔진</h2>
              <p className="text-xs text-emerald-300/80">
                평가위원 방문 가능일 × 기관 프로그램 진행일 × 선호 권역 호환성 정밀 분석
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
            <div>
              <div className="font-bold">발견된 호환 일정: 총 {matches.length}개 조합</div>
              <div className="text-[11px] text-emerald-700 mt-0.5">
                점수가 높을수록 날짜 완벽 일치 및 지리적 인접성이 우수합니다.
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-white text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
              적합도 순 정렬
            </span>
          </div>

          {matches.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
              현재 대기 중인 조율 건 중 즉시 호환되는 일정이 없습니다. 평가위원 가능일을 추가 등록하거나 프로그램을 등록해주세요.
            </div>
          ) : (
            <div className="space-y-2.5">
              {matches.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {item.institution.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {item.institution.region} ({item.institution.subRegion})
                      </span>
                      <span className="text-[11px] font-bold text-purple-900 bg-purple-50 px-2 py-0.2 rounded border border-purple-200">
                        {item.institution.writerName} 작가
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-700 font-medium flex items-center gap-2">
                      <span className="text-purple-700 font-semibold truncate max-w-xs">
                        [프로그램] {item.program.title}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-emerald-800 font-bold">
                        {item.program.date} ({getDayNameKorean(item.program.date)}) {item.program.startTime}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 flex items-center gap-2">
                      <span>추천 평가위원: <strong className="text-slate-900">{item.evaluator.name}</strong> {item.evaluator.residence ? `(${item.evaluator.residence})` : ''}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {item.reasons.map((r, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium"
                        >
                          ✓ {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center justify-between sm:items-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-700 font-mono">
                        매칭 적합도 {item.score}%
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onConfirmMatch(
                          item.institution.id,
                          item.program.id,
                          item.program.date,
                          item.program.startTime,
                          [item.evaluator.id]
                        );
                        onClose();
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>이 일정으로 즉시 확정</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
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
