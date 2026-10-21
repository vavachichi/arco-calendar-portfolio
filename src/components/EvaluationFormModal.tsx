import React, { useState } from 'react';
import { 
  X, 
  FileCheck, 
  Printer, 
  Save, 
  Star, 
  Building2, 
  User, 
  Calendar, 
  CheckCircle2, 
  Sparkles,
  Info,
  Camera
} from 'lucide-react';
import { Institution, EvaluationRecord, ProgramSchedule, Evaluator } from '../types';

interface EvaluationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  institution: Institution | null;
  evaluators: Evaluator[];
  onSaveRecord: (record: EvaluationRecord) => void;
}

export const EvaluationFormModal: React.FC<EvaluationFormModalProps> = ({
  isOpen,
  onClose,
  institution,
  evaluators,
  onSaveRecord,
}) => {
  if (!isOpen || !institution) return null;

  const prog = institution.programs.find((p) => p.id === institution.confirmedProgramId) || institution.programs[0];
  const assignedEvaluatorObjs = institution.assignedEvaluatorIds
    .map((id) => evaluators.find((e) => e.id === id))
    .filter(Boolean);

  // Rubric Scores State
  const [creationEnv, setCreationEnv] = useState<number>(23); // max 25
  const [progOperation, setProgOperation] = useState<number>(32); // max 35
  const [instSupport, setInstSupport] = useState<number>(18); // max 20
  const [communityImpact, setCommunityImpact] = useState<number>(18); // max 20

  // Interview & Qualitative Memos State
  const [writerMemo, setWriterMemo] = useState<string>(
    `${institution.writerName} 작가는 주 3회 이상 창작 및 기획에 매진 중이며, 지역주민들의 글쓰기 열의와 기관의 적극적인 지원에 높은 만족도를 표명함.`
  );
  const [managerMemo, setManagerMemo] = useState<string>(
    `기관 담당자(${institution.contactPerson || '담당자'})는 상주작가 배치 이후 문학 프로그램 접수 개시 직후 마감되는 등 호응도가 매우 높으며, 향후 지원 사업 지속 참여를 희망함.`
  );
  const [generalImpression, setGeneralImpression] = useState<string>(
    `참관한 '${prog?.title || '상주작가 프로그램'}'은 지역 특성과 문학 창작의 조화가 돋보였으며, 참여자들의 능동적인 발표와 상주작가의 섬세한 개별 멘토링이 충실하게 이루어짐.`
  );
  const [recommendations, setRecommendations] = useState<string>(
    `수료생들의 창작집 발간 및 지역 도서관/서점 연계 낭독 북콘서트 등 후속 성과 확산을 위한 소액 출판 지원 연계 권장.`
  );

  const totalScore = creationEnv + progOperation + instSupport + communityImpact;

  const getGrade = (score: number) => {
    if (score >= 95) return { grade: 'S (최우수)', color: 'text-purple-600 bg-purple-50 border-purple-200' };
    if (score >= 85) return { grade: 'A (우수)', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    if (score >= 75) return { grade: 'B (보통)', color: 'text-blue-600 bg-blue-50 border-blue-200' };
    if (score >= 65) return { grade: 'C (미흡)', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    return { grade: 'D (매우 미흡)', color: 'text-rose-600 bg-rose-50 border-rose-200' };
  };

  const currentGrade = getGrade(totalScore);

  const handleSave = () => {
    const record: EvaluationRecord = {
      id: `rec-${institution.id}-${Date.now()}`,
      institutionId: institution.id,
      evaluatorId: assignedEvaluatorObjs[0]?.id || 'eval-1',
      evaluatorName: assignedEvaluatorObjs.map((e) => e?.name).join(', ') || '평가위원',
      visitDate: institution.confirmedVisitDate || '2026-08-20',
      visitTime: institution.confirmedVisitTime || '14:00',
      programId: prog?.id || '',
      scores: {
        creationEnvironment: creationEnv,
        programOperation: progOperation,
        institutionSupport: instSupport,
        communityImpact: communityImpact,
      },
      totalScore,
      writerInterviewSummary: writerMemo,
      managerInterviewSummary: managerMemo,
      generalImpression,
      recommendations,
      photos: [],
      submittedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };
    onSaveRecord(record);
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                문학기반시설 상주작가 지원사업 현장평가서
              </h2>
              <p className="text-xs text-slate-400">
                {institution.name} ({institution.region}) • 상주작가: {institution.writerName}
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
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Target Facility Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
            <div>
              <span className="text-slate-400">참여 기관명:</span>{' '}
              <strong className="text-slate-900">{institution.name}</strong> ({institution.type})
            </div>
            <div>
              <span className="text-slate-400">상주작가:</span>{' '}
              <strong className="text-slate-900">{institution.writerName}</strong>
            </div>
            <div>
              <span className="text-slate-400">실사 방문일시:</span>{' '}
              <span className="font-mono text-emerald-800 font-bold">
                {institution.confirmedVisitDate || '2026-08-20'} {institution.confirmedVisitTime || '14:00'}
              </span>
            </div>
            <div>
              <span className="text-slate-400">참관 프로그램:</span>{' '}
              <span className="font-semibold text-purple-900">{prog?.title || '주민 창작 워크숍'}</span>
            </div>
          </div>

          {/* Quantitative Rubric Evaluation (4 Domains) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs">
                ■ 정량 평가 지표 (100점 만점)
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">총점:</span>
                <span className="text-base font-bold text-slate-900 font-mono">
                  {totalScore} / 100점
                </span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-xs border ${currentGrade.color}`}>
                  {currentGrade.grade}
                </span>
              </div>
            </div>

            {/* 1. Creation Environment */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span>1. 상주작가 창작 및 집무 환경 (배점: 25점)</span>
                <span className="text-emerald-700 font-mono">{creationEnv}점</span>
              </div>
              <p className="text-[11px] text-slate-500">
                - 집무공간의 독립성 및 쾌적성, 집필 환경 지원, 상주 여건의 적정성
              </p>
              <input
                type="range"
                min="10"
                max="25"
                value={creationEnv}
                onChange={(e) => setCreationEnv(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* 2. Program Operation */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span>2. 상주작가 프로그램 질적 수준 및 운영 충실도 (배점: 35점)</span>
                <span className="text-emerald-700 font-mono">{progOperation}점</span>
              </div>
              <p className="text-[11px] text-slate-500">
                - 프로그램 기획의 참신성, 상주작가의 지도 역량, 참여 주민의 집중도 및 참여율
              </p>
              <input
                type="range"
                min="15"
                max="35"
                value={progOperation}
                onChange={(e) => setProgOperation(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* 3. Institution Support */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span>3. 기관의 협조도 및 행정·홍보 지원 (배점: 20점)</span>
                <span className="text-emerald-700 font-mono">{instSupport}점</span>
              </div>
              <p className="text-[11px] text-slate-500">
                - 기관 담당자의 적극성, 주민 대상 홍보 채널 가동, 예산 및 재료 집행 지원
              </p>
              <input
                type="range"
                min="8"
                max="20"
                value={instSupport}
                onChange={(e) => setInstSupport(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* 4. Community Impact */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span>4. 지역사회 문학 생태계 기여도 및 파급효과 (배점: 20점)</span>
                <span className="text-emerald-700 font-mono">{communityImpact}점</span>
              </div>
              <p className="text-[11px] text-slate-500">
                - 지역 주민의 문학 향유권 신장, 주민 창작물 공유 및 후속 활동 연계성
              </p>
              <input
                type="range"
                min="8"
                max="20"
                value={communityImpact}
                onChange={(e) => setCommunityImpact(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Qualitative Interviews & Memos */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs">
              ■ 정성 평가 인터뷰 및 현장 의견
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                상주작가 심층 면담 요약
              </label>
              <textarea
                rows={2}
                value={writerMemo}
                onChange={(e) => setWriterMemo(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                기관 담당자 (사서/서점 대표) 면담 요약
              </label>
              <textarea
                rows={2}
                value={managerMemo}
                onChange={(e) => setManagerMemo(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                현장 참관 종합 총평
              </label>
              <textarea
                rows={2}
                value={generalImpression}
                onChange={(e) => setGeneralImpression(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                발전 제언 및 향후 개선사항
              </label>
              <textarea
                rows={2}
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>서식 인쇄</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>평가서 저장 및 제출</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
