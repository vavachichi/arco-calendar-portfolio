import React, { useState } from 'react';
import { Institution, Evaluator, UserRole } from '../types';
import { 
  KeyRound, 
  Building2, 
  UserCheck, 
  ShieldCheck, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  HelpCircle,
  X
} from 'lucide-react';

interface AccessKeyLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  institutions: Institution[];
  evaluators: Evaluator[];
  onLoginSuccess: (role: UserRole, targetId: string, message: string) => void;
  currentRole: UserRole;
  currentEvaluatorId: string;
  currentInstitutionId: string;
}

export function AccessKeyLoginModal({
  isOpen,
  onClose,
  institutions,
  evaluators,
  onLoginSuccess,
  currentRole,
  currentEvaluatorId,
  currentInstitutionId,
}: AccessKeyLoginModalProps) {
  const [activeTab, setActiveTab] = useState<'key_input' | 'institution_select' | 'evaluator_select'>('key_input');
  const [inputKey, setInputKey] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const trimmed = inputKey.trim();

    if (!trimmed) {
      setErrorMessage('접속 키(Access Key)를 입력해주세요.');
      return;
    }

    const clean = trimmed.replace(/[\s\-_]/g, '').toUpperCase();

    // 1. Check Master Admin Key
    if (
      clean === 'ADMIN' || 
      clean === 'ADMIN2026' || 
      clean === 'ARKOADMIN' || 
      trimmed.includes('관리자') || 
      trimmed.includes('운영본부')
    ) {
      onLoginSuccess('admin', '', '운영본부 관리자 포털로 인증되었습니다.');
      onClose();
      return;
    }

    // 2. Check Evaluator Keys
    let matchedEvaluator = evaluators.find(
      (ev) => 
        (ev.accessKey && ev.accessKey.replace(/[\s\-_]/g, '').toUpperCase() === clean) ||
        (ev.code && ev.code.replace(/[\s\-_]/g, '').toUpperCase() === clean) ||
        ev.id.replace(/[\s\-_]/g, '').toUpperCase() === clean ||
        ev.name === trimmed
    );

    if (!matchedEvaluator) {
      const evalNumMatch = clean.match(/^EVAL?(\d{1,2})$/i);
      if (evalNumMatch) {
        const num = parseInt(evalNumMatch[1], 10);
        if (num >= 1 && num <= evaluators.length) {
          matchedEvaluator = evaluators[num - 1] || evaluators.find(e => e.id === `eval-${num}`);
        }
      }
    }

    if (matchedEvaluator) {
      onLoginSuccess('evaluator', matchedEvaluator.id, `${matchedEvaluator.name} 평가위원님으로 인증되었습니다.`);
      onClose();
      return;
    }

    // 3. Check Institution Keys
    let matchedInst = institutions.find(
      (inst) => 
        (inst.accessKey && inst.accessKey.replace(/[\s\-_]/g, '').toUpperCase() === clean) ||
        (inst.code && inst.code.replace(/[\s\-_]/g, '').toUpperCase() === clean) ||
        inst.id.replace(/[\s\-_]/g, '').toUpperCase() === clean ||
        inst.name.trim() === trimmed
    );

    if (!matchedInst) {
      const instNumMatch = clean.match(/^INST?(\d{1,3})$/i);
      if (instNumMatch) {
        const num = parseInt(instNumMatch[1], 10);
        if (num >= 1 && num <= institutions.length) {
          matchedInst = institutions[num - 1] || institutions.find(i => i.id === `inst-${num}`);
        }
      }
    }

    if (!matchedInst && trimmed.length >= 2) {
      matchedInst = institutions.find((i) => i.name.toLowerCase().includes(trimmed.toLowerCase()));
    }

    if (matchedInst) {
      onLoginSuccess('institution', matchedInst.id, `${matchedInst.name} 참여기관으로 인증되었습니다.`);
      onClose();
      return;
    }

    setErrorMessage(`일치하는 접속 키 [${trimmed}]를 찾을 수 없습니다. (예: INST-001, EVAL-01, ADMIN-2026)`);
  };

  const handleSelectInstitution = (inst: Institution) => {
    onLoginSuccess('institution', inst.id, `${inst.name} 참여기관으로 전환되었습니다.`);
    onClose();
  };

  const handleSelectEvaluator = (ev: Evaluator) => {
    onLoginSuccess('evaluator', ev.id, `${ev.name} 평가위원님으로 전환되었습니다.`);
    onClose();
  };

  const filteredInstitutions = institutions.filter(
    (i) =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.accessKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.writerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEvaluators = evaluators.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.accessKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.affiliation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        id="access-key-login-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">현장평가 통합 로그인 & 접속키 인증</h3>
              <p className="text-xs text-slate-300">
                12인 평가위원, 97개 참여기관, 조사회 운영본부 전용 포털
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-sm font-medium">
          <button
            onClick={() => { setActiveTab('key_input'); setErrorMessage(''); }}
            className={`flex-1 py-3 px-4 text-center border-b-2 transition flex items-center justify-center space-x-2 ${
              activeTab === 'key_input'
                ? 'border-emerald-600 text-emerald-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>접속 키 직접 입력</span>
          </button>
          <button
            onClick={() => { setActiveTab('evaluator_select'); setErrorMessage(''); }}
            className={`flex-1 py-3 px-4 text-center border-b-2 transition flex items-center justify-center space-x-2 ${
              activeTab === 'evaluator_select'
                ? 'border-emerald-600 text-emerald-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>평가위원 (12인 목록)</span>
          </button>
          <button
            onClick={() => { setActiveTab('institution_select'); setErrorMessage(''); }}
            className={`flex-1 py-3 px-4 text-center border-b-2 transition flex items-center justify-center space-x-2 ${
              activeTab === 'institution_select'
                ? 'border-emerald-600 text-emerald-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>참여기관 (97곳 목록)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'key_input' && (
            <div className="space-y-6">
              <form onSubmit={handleKeySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    부여받으신 접속 키 (Access Key)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={inputKey}
                      onChange={(e) => setInputKey(e.target.value)}
                      placeholder="예: INST-001 (참여기관) 또는 EVAL-01 (평가위원)"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base font-mono font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      autoFocus
                    />
                    <KeyRound className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                  {errorMessage && (
                    <p className="text-xs font-semibold text-rose-600 mt-2 flex items-center space-x-1">
                      <span>⚠️ {errorMessage}</span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2"
                >
                  <span>로그인 및 포털 접속하기</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Guide Box */}
              <div className="text-xs text-slate-500 space-y-1 bg-amber-50/60 p-3 rounded-lg border border-amber-200/60">
                <div className="font-semibold text-amber-900 flex items-center space-x-1">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                  <span>접속 키 체계 안내</span>
                </div>
                <p>• <strong>참여기관 (96개관)</strong>: <code>INST-001</code> ~ <code>INST-096</code> (프로그램 일정 캘린더 등록 및 수정)</p>
                <p>• <strong>평가위원 (12인)</strong>: <code>EVAL-01</code> ~ <code>EVAL-12</code> (기관 프로그램 실사 예약 및 평가표 제출)</p>
                <p>• <strong>운영본부</strong>: <code>ADMIN-2026</code> (전체 매칭 현황 및 엑셀 다운로드)</p>
              </div>
            </div>
          )}

          {activeTab === 'evaluator_select' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="평가위원 성명, 소속, 전문분야, 접속키 검색..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                {filteredEvaluators.map((ev) => {
                  const isCurrent = currentRole === 'evaluator' && currentEvaluatorId === ev.id;
                  return (
                    <div
                      key={ev.id}
                      onClick={() => handleSelectEvaluator(ev)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-emerald-400 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-slate-900">{ev.name} 위원</span>
                          <span className="font-mono text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                            {ev.accessKey}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 truncate max-w-[200px]">{ev.affiliation}</p>
                        <p className="text-[11px] text-slate-500">
                          {ev.specialty} · 선호: {ev.preferredRegions.join(', ')}
                        </p>
                      </div>
                      {isCurrent && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'institution_select' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="참여기관명(도서관/서점), 권역, 상주작가명, 접속키 검색..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="text-xs text-slate-500 font-medium">
                전체 97개 기관 중 {filteredInstitutions.length}곳 표시
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                {filteredInstitutions.map((inst) => {
                  const isCurrent = currentRole === 'institution' && currentInstitutionId === inst.id;
                  return (
                    <div
                      key={inst.id}
                      onClick={() => handleSelectInstitution(inst)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-blue-400 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-slate-900 truncate max-w-[160px]">{inst.name}</span>
                          <span className="font-mono text-[10px] font-semibold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                            {inst.accessKey}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          <span className="font-semibold text-slate-800">작가: {inst.writerName}</span>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {inst.region} · {inst.type} · 프로그램 {inst.programs.length}개
                        </p>
                      </div>
                      {isCurrent && <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            현재 접속: <strong className="text-slate-800">
              {currentRole === 'admin' && '조사회 운영본부 (관리자)'}
              {currentRole === 'evaluator' && `평가위원: ${evaluators.find(e => e.id === currentEvaluatorId)?.name || '선택됨'}`}
              {currentRole === 'institution' && `참여기관: ${institutions.find(i => i.id === currentInstitutionId)?.name || '선택됨'}`}
            </strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
