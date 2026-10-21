import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Bot, 
  Calendar, 
  FileCheck2, 
  Mail, 
  Copy, 
  Check, 
  Loader2, 
  AlertCircle, 
  MapPin, 
  CheckCircle2,
  Building2,
  User,
  ArrowRight
} from 'lucide-react';
import { Institution, Evaluator } from '../types';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  institutions: Institution[];
  evaluators: Evaluator[];
  onApplyScheduleMatch?: (institutionId: string, programId: string, date: string, time: string, evaluatorIds: string[]) => void;
}

type AITab = 'optimizer' | 'checklist' | 'notice';

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  institutions,
  evaluators,
  onApplyScheduleMatch,
}) => {
  const [activeTab, setActiveTab] = useState<AITab>('optimizer');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Tab 1: Schedule Optimizer State
  const [optimizerResult, setOptimizerResult] = useState<any | null>(null);

  // Tab 2: Checklist Generator State
  const [selectedInstIdForChecklist, setSelectedInstIdForChecklist] = useState<string>(
    institutions[0]?.id || ''
  );
  const [checklistResult, setChecklistResult] = useState<any | null>(null);

  // Tab 3: Official Notice Generator State
  const [noticeType, setNoticeType] = useState<'confirmation' | 'request' | 'change'>('confirmation');
  const [selectedInstIdForNotice, setSelectedInstIdForNotice] = useState<string>(
    institutions[0]?.id || ''
  );
  const [noticeResult, setNoticeResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // 1. Trigger AI Schedule Optimization
  const runScheduleOptimizer = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/schedule-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutions: institutions.map((i) => ({
            id: i.id,
            name: i.name,
            region: i.region,
            subRegion: i.subRegion,
            type: i.type,
            writerName: i.writerName,
            programs: i.programs.map((p) => ({
              id: p.id,
              title: p.title,
              date: p.date,
              startTime: p.startTime,
              endTime: p.endTime,
            })),
            status: i.evaluationStatus,
          })),
          evaluators: evaluators.map((e) => ({
            id: e.id,
            name: e.name,
            specialty: e.specialty,
            preferredRegions: e.preferredRegions,
            availableDates: e.availableDates,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('AI 분석 서버 응답 오류가 발생했습니다.');
      }
      const data = await response.json();
      setOptimizerResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || '최적화 분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Trigger AI Checklist Generation
  const runChecklistGenerator = async () => {
    const inst = institutions.find((i) => i.id === selectedInstIdForChecklist);
    if (!inst) return;
    const prog = inst.programs[0];

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/generate-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionName: inst.name,
          writerName: inst.writerName,
          programTitle: prog ? prog.title : '상주작가 문학 프로그램',
          programTarget: prog ? prog.targetAudience : '지역 주민',
          programDescription: prog ? prog.description : inst.writerBio,
        }),
      });

      if (!response.ok) {
        throw new Error('AI 체크리스트 생성 실패');
      }
      const data = await response.json();
      setChecklistResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || '체크리스트 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Trigger AI Notice Drafter
  const runNoticeGenerator = async () => {
    const inst = institutions.find((i) => i.id === selectedInstIdForNotice);
    if (!inst) return;
    const prog = inst.programs[0];
    const evaluatorNames = inst.assignedEvaluatorIds
      .map((id) => evaluators.find((e) => e.id === id)?.name)
      .filter(Boolean);

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/generate-notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: noticeType,
          institutionName: inst.name,
          evaluatorNames: evaluatorNames.length > 0 ? evaluatorNames : ['김문학 평론가', '이도서 연구위원'],
          visitDate: inst.confirmedVisitDate || prog?.date || '2026-08-20',
          visitTime: inst.confirmedVisitTime || prog?.startTime || '14:00',
          programTitle: prog ? prog.title : '상주작가 문학 프로그램',
          contactPerson: `${inst.contactPerson} (${inst.contactPhone})`,
        }),
      });

      if (!response.ok) {
        throw new Error('AI 공문 및 알림 생성 실패');
      }
      const data = await response.json();
      setNoticeResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || '공문 작성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">ARKO 상주작가 AI 지능형 일정 & 실사 지원 센터</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
                  Gemini 3.7 Flash Engine
                </span>
              </div>
              <p className="text-xs text-indigo-200/80">
                지역 동선 최적화 분석, 프로그램별 맞춤형 실사 체크리스트, 공식 공문 및 알림 템플릿 자동 작성
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('optimizer')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all ${
              activeTab === 'optimizer'
                ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>AI 일정 최적화 & 동선 추천</span>
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all ${
              activeTab === 'checklist'
                ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>AI 프로그램별 관찰 포인트 & 질문지</span>
          </button>
          <button
            onClick={() => setActiveTab('notice')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all ${
              activeTab === 'notice'
                ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>AI 공식 공문 & 알림톡 작성기</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: SCHEDULE OPTIMIZER */}
          {activeTab === 'optimizer' && (
            <div className="space-y-4">
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    전국 참여기관 및 평가위원 일정 자동 정합성 분석
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    상주작가 프로그램 진행 일시와 평가위원 가능 일자, 지리적 인접 권역을 종합 연산하여 최적의 방문 일정을 제안합니다.
                  </p>
                </div>
                <button
                  onClick={runScheduleOptimizer}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>AI 연산 중...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>최적 일정 분석 실행</span>
                    </>
                  )}
                </button>
              </div>

              {optimizerResult && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Summary */}
                  {optimizerResult.summary && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs">
                      <div className="font-bold flex items-center gap-1.5 mb-1 text-emerald-900">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>AI 분석 종합 소견</span>
                      </div>
                      <p className="leading-relaxed">{optimizerResult.summary}</p>
                    </div>
                  )}

                  {/* Routing Tips */}
                  {optimizerResult.routingTips && (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs">
                      <div className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-amber-700" />
                        <span>연계 동선 추천 (같은 날 묶음 실사 권장)</span>
                      </div>
                      <p>{optimizerResult.routingTips}</p>
                    </div>
                  )}

                  {/* Recommended Matches List */}
                  {optimizerResult.recommendedMatches && (
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs mb-2">
                        추천 매칭 일정 목록 ({optimizerResult.recommendedMatches.length}건)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {optimizerResult.recommendedMatches.map((m: any, idx: number) => {
                          const inst = institutions.find((i) => i.id === m.institutionId || i.name === m.institutionName);
                          return (
                            <div
                              key={idx}
                              className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 shadow-2xs space-y-2"
                            >
                              <div className="flex items-center justify-between font-bold text-slate-900">
                                <span>{inst ? inst.name : m.institutionName || '기관'}</span>
                                <span className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                                  {m.visitDate} {m.visitTime}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-600">
                                참관: <strong>{m.programTitle || '문학 프로그램'}</strong>
                              </div>
                              <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded">
                                {m.rationale}
                              </p>
                              {onApplyScheduleMatch && inst && (
                                <button
                                  onClick={() =>
                                    onApplyScheduleMatch(
                                      inst.id,
                                      inst.programs[0]?.id || '',
                                      m.visitDate,
                                      m.visitTime,
                                      m.evaluatorIds || inst.assignedEvaluatorIds
                                    )
                                  }
                                  className="w-full mt-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                                >
                                  <span>이 일정으로 즉시 확정 적용</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CHECKLIST GENERATOR */}
          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      대상 기관 및 프로그램 선택
                    </label>
                    <select
                      value={selectedInstIdForChecklist}
                      onChange={(e) => setSelectedInstIdForChecklist(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 font-medium text-slate-800 text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                    >
                      {institutions.map((i) => (
                        <option key={i.id} value={i.id}>
                          [{i.region}] {i.name} ({i.type}) - 상주작가: {i.writerName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={runChecklistGenerator}
                    disabled={loading}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0 self-end disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>생성 중...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>맞춤형 체크리스트 생성</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {checklistResult && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Program Observation Points */}
                  {checklistResult.programObservation && (
                    <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 space-y-2">
                      <h4 className="font-bold text-purple-950 text-xs flex items-center gap-2">
                        <FileCheck2 className="w-4 h-4 text-purple-600" />
                        <span>1. 상주작가 프로그램 실시간 참관 핵심 관찰 포인트</span>
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                        {checklistResult.programObservation.map((item: string, i: number) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Writer Interview Questions */}
                  {checklistResult.writerInterview && (
                    <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-2">
                      <h4 className="font-bold text-indigo-950 text-xs flex items-center gap-2">
                        <User className="w-4 h-4 text-indigo-600" />
                        <span>2. 상주작가 심층 인터뷰 추천 질문지</span>
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                        {checklistResult.writerInterview.map((item: string, i: number) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Manager Interview & Workspace */}
                  {checklistResult.managerInterview && (
                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                      <h4 className="font-bold text-emerald-950 text-xs flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-600" />
                        <span>3. 도서관 사서 / 서점 대표 인터뷰 & 집무 환경 점검</span>
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                        {checklistResult.managerInterview.map((item: string, i: number) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OFFICIAL NOTICE DRAFTER */}
          {activeTab === 'notice' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      공문 / 안내 유형
                    </label>
                    <select
                      value={noticeType}
                      onChange={(e) => setNoticeType(e.target.value as any)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 font-medium text-slate-800 text-xs bg-white"
                    >
                      <option value="confirmation">방문 일정 최종 확정 공문</option>
                      <option value="request">일정 조율 및 방문 협조 요청문</option>
                      <option value="change">일정 변경 안내문</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      대상 기관
                    </label>
                    <select
                      value={selectedInstIdForNotice}
                      onChange={(e) => setSelectedInstIdForNotice(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 font-medium text-slate-800 text-xs bg-white"
                    >
                      {institutions.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name} (작가: {i.writerName})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={runNoticeGenerator}
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>작성 중...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>공문 & 알림 메시지 생성</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {noticeResult && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Official Letter Body */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h4 className="font-bold text-slate-900 text-xs">
                        {noticeResult.officialTitle || '[공문] 현장평가 방문 협조의 건'}
                      </h4>
                      <button
                        onClick={() => handleCopy(noticeResult.officialBody, 'letter')}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded bg-indigo-50 border border-indigo-200"
                      >
                        {copiedKey === 'letter' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>복사 완료!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>공문 복사</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="text-[11px] text-slate-700 whitespace-pre-wrap font-sans leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {noticeResult.officialBody}
                    </pre>
                  </div>

                  {/* Mobile SMS / KakaoTalk Template */}
                  {noticeResult.mobileMessage && (
                    <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-amber-950 text-xs">
                          카카오톡 알림톡 / 문자 발송용 메시지
                        </h4>
                        <button
                          onClick={() => handleCopy(noticeResult.mobileMessage, 'mobile')}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 hover:text-amber-950 px-2 py-1 rounded bg-amber-100 border border-amber-300"
                        >
                          {copiedKey === 'mobile' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>복사 완료!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>문자 복사</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="text-[11px] text-slate-800 whitespace-pre-wrap font-sans leading-relaxed bg-white p-3 rounded-lg border border-amber-200">
                        {noticeResult.mobileMessage}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            한국문화예술위원회 상주작가 지원사업 현장평가 AI 운영 솔루션
          </span>
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
