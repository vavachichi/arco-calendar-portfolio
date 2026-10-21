import React, { useState } from 'react';
import { 
  Building2, 
  UserCheck, 
  ShieldCheck, 
  KeyRound, 
  Lock,
  BookOpen, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Info,
  Layers,
  HelpCircle
} from 'lucide-react';
import { Institution, Evaluator, UserRole } from '../types';
import { ArkoLogo } from './ArkoLogo';

interface LoginScreenProps {
  institutions: Institution[];
  evaluators: Evaluator[];
  onLogin: (role: UserRole, targetId: string) => void;
  onShowToast: (msg: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  institutions,
  evaluators,
  onLogin,
  onShowToast,
}) => {
  const [selectedRoleTab, setSelectedRoleTab] = useState<UserRole>('evaluator');
  const [inputKey, setInputKey] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Extract last 4 digits helper
  const getLast4Digits = (phone?: string) => {
    if (!phone) return '1234';
    const nums = phone.replace(/[^0-9]/g, '');
    return nums.length >= 4 ? nums.slice(-4) : '1234';
  };

  // Robust Key & Password Matcher
  const matchAndLogin = (rawKey: string, rawPwd?: string) => {
    setErrorMessage('');
    const trimmedKey = rawKey.trim();
    const trimmedPwd = (rawPwd !== undefined ? rawPwd : inputPassword).trim();

    if (!trimmedKey) {
      setErrorMessage('부여받으신 로그인 아이디(접속키)를 입력해주세요.');
      return;
    }

    const cleanKey = trimmedKey.replace(/[\s\-_]/g, '').toUpperCase();

    // 1. Check Admin Keys
    if (
      cleanKey === 'ADMIN' || 
      cleanKey === 'ADMIN2026' || 
      cleanKey === 'ARKOADMIN' || 
      trimmedKey.includes('관리자') || 
      trimmedKey.includes('운영본부')
    ) {
      // Admin password check (if provided)
      if (trimmedPwd && !['ADMIN', '1234', '2026', 'ADMIN2026'].includes(trimmedPwd.toUpperCase())) {
        setErrorMessage('운영본부 관리자 비밀번호가 일치하지 않습니다. (기본: 1234 또는 2026)');
        return;
      }
      onLogin('admin', '');
      onShowToast('🛡️ 운영본부(관리자)로 로그인되었습니다.');
      return;
    }

    // 2. Check Evaluator Match
    let matchedEvaluator = evaluators.find(
      (ev) => 
        (ev.accessKey && ev.accessKey.replace(/[\s\-_]/g, '').toUpperCase() === cleanKey) ||
        (ev.code && ev.code.replace(/[\s\-_]/g, '').toUpperCase() === cleanKey) ||
        ev.id.replace(/[\s\-_]/g, '').toUpperCase() === cleanKey ||
        ev.name === trimmedKey
    );

    if (!matchedEvaluator) {
      const evalNumMatch = cleanKey.match(/^EVAL?(\d{1,2})$/i);
      if (evalNumMatch) {
        const num = parseInt(evalNumMatch[1], 10);
        if (num >= 1 && num <= evaluators.length) {
          matchedEvaluator = evaluators[num - 1] || evaluators.find(e => e.id === `eval-${num}`);
        }
      }
    }

    if (matchedEvaluator) {
      // Validate Password
      const validPwds = [
        matchedEvaluator.password,
        matchedEvaluator.phone ? getLast4Digits(matchedEvaluator.phone) : undefined,
        '1234',
        '2026',
      ].filter(Boolean) as string[];

      if (trimmedPwd && !validPwds.includes(trimmedPwd)) {
        setErrorMessage('비밀번호가 일치하지 않습니다. (초기 비밀번호: 1234)');
        return;
      }

      onLogin('evaluator', matchedEvaluator.id);
      onShowToast(`👋 ${matchedEvaluator.name} 평가위원님, 환영합니다.`);
      return;
    }

    // 3. Check Institution Match
    let matchedInst = institutions.find(
      (inst) => 
        (inst.accessKey && inst.accessKey.replace(/[\s\-_]/g, '').toUpperCase() === cleanKey) ||
        (inst.code && inst.code.replace(/[\s\-_]/g, '').toUpperCase() === cleanKey) ||
        inst.id.replace(/[\s\-_]/g, '').toUpperCase() === cleanKey ||
        inst.name.trim() === trimmedKey
    );

    if (!matchedInst) {
      const instNumMatch = cleanKey.match(/^INST?(\d{1,3})$/i);
      if (instNumMatch) {
        const num = parseInt(instNumMatch[1], 10);
        if (num >= 1 && num <= institutions.length) {
          matchedInst = institutions[num - 1] || institutions.find(i => i.id === `inst-${num}`);
        }
      }
    }

    if (!matchedInst && trimmedKey.length >= 2) {
      matchedInst = institutions.find((i) => i.name.toLowerCase().includes(trimmedKey.toLowerCase()));
    }

    if (matchedInst) {
      // Validate Password
      const validPwds = [
        matchedInst.password,
        getLast4Digits(matchedInst.contactPhone),
        '1234'
      ].filter(Boolean) as string[];

      if (trimmedPwd && !validPwds.includes(trimmedPwd)) {
        setErrorMessage(`비밀번호가 일치하지 않습니다. (초기 비밀번호: 담당자 연락처 뒷 4자리 [${getLast4Digits(matchedInst.contactPhone)}] 또는 1234)`);
        return;
      }

      onLogin('institution', matchedInst.id);
      onShowToast(`🏛️ ${matchedInst.name} 담당자로 로그인되었습니다.`);
      return;
    }

    setErrorMessage(
      `입력하신 아이디 [${trimmedKey}]를 찾을 수 없습니다. (예: EVAL-01, INST-001, ADMIN-2026)`
    );
  };

  const handleDirectKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    matchAndLogin(inputKey, inputPassword);
  };

  const filteredEvaluators = evaluators.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.accessKey && e.accessKey.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.residence && e.residence.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.jurisdictionSummary && e.jurisdictionSummary.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredInstitutions = institutions.filter(
    (i) =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.accessKey && i.accessKey.toLowerCase().includes(searchQuery.toLowerCase())) ||
      i.writerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.subRegion.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0e2238] text-slate-100 flex flex-col justify-between">
      {/* Official Workshop Banner - Matching User Provided Reference Image */}
      <section className="bg-[#142d4c] border-b border-[#234670] px-6 sm:px-12 py-10 sm:py-14 shadow-lg relative overflow-hidden">
        {/* Subtle background geometric accents */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -top-20 w-80 h-80 rounded-full bg-[#cca43b]/10 blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Top Right ARKO Official Logo Box (as in photo) */}
          <div className="flex justify-end mb-6 sm:mb-8">
            <ArkoLogo variant="white-box" className="py-1.5 px-3.5 shadow-md" />
          </div>

          {/* Main Typography exactly inspired by photo */}
          <div className="space-y-2 mb-8">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#cca43b] leading-tight">
              2026 문학상주작가<br className="sm:hidden" /> 지원사업
            </h2>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
              현장평가 통합 매칭 포털
            </h1>
          </div>

          {/* Bottom Divider Line & Info String (as in photo) */}
          <div className="pt-4 border-t border-white/25 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 text-xs sm:text-sm font-medium text-slate-200">
            <div className="text-slate-300 text-xs">
              12인 평가위원 × 96개 참여기관 (도서관·문학관·서점)
            </div>
          </div>
        </div>
      </section>

      {/* Main Login Card Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center my-6">
        <div className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-[#2b4d75]/30 overflow-hidden">
          {/* Card Top Title - Deep Navy */}
          <div className="bg-[#10243e] p-6 sm:p-8 text-white border-b border-[#234670]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                <KeyRound className="w-6 h-6 text-[#cca43b]" />
                <span>사용자 전용 포털 로그인</span>
              </h2>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#cca43b]/20 text-[#cca43b] border border-[#cca43b]/40 font-bold hidden sm:inline-block">
                접속키 (ID + PW) 보안 인증
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
              부여받으신 <strong className="text-white">로그인 아이디</strong>와 <strong className="text-[#cca43b]">비밀번호</strong>(초기: 담당자 연락처 뒷 4자리 또는 1234)를 입력하시면 권한 전용 화면으로 자동 연결됩니다.
            </p>

            {/* Direct Access Key + Password Input Form */}
            <form onSubmit={handleDirectKeySubmit} className="mt-6 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* ID Field */}
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={inputKey}
                    onChange={(e) => { setInputKey(e.target.value); setErrorMessage(''); }}
                    placeholder="로그인 아이디 (예: EVAL-01, INST-001, ADMIN-2026)"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#0a192c] border-2 border-[#24456c] text-white placeholder-slate-400 font-mono text-xs sm:text-sm focus:outline-hidden focus:border-[#3b82f6] transition shadow-inner"
                    autoFocus
                  />
                </div>

                {/* Password Field */}
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={inputPassword}
                    onChange={(e) => { setInputPassword(e.target.value); setErrorMessage(''); }}
                    placeholder="비밀번호 (초기: 연락처 뒤 4자리 or 1234)"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#0a192c] border-2 border-[#24456c] text-white placeholder-slate-400 font-mono text-xs sm:text-sm focus:outline-hidden focus:border-[#3b82f6] transition shadow-inner"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-[#cca43b] shrink-0" />
                  <span>초기 비밀번호는 담당자 전화번호 뒷 4자리 또는 <strong className="text-white">1234</strong> 입니다</span>
                </div>
                <button
                  type="submit"
                  className="px-7 py-3 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <span>로그인하기</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-200 text-xs font-medium flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              )}
            </form>
          </div>

          {/* Role Mode Selection Tab */}
          <div className="p-6 sm:p-8 bg-slate-50 border-t border-slate-200 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-800">
                또는 역할을 선택하여 목록에서 직접 접속:
              </span>
              <span className="text-[11px] text-slate-500">
                * 배정된 12인 평가위원 및 96개관 전체 목록 제공
              </span>
            </div>

            {/* 3 Role Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => { setSelectedRoleTab('evaluator'); setSearchQuery(''); }}
                className={`p-4 rounded-2xl border-2 text-left transition relative cursor-pointer ${
                  selectedRoleTab === 'evaluator'
                    ? 'bg-blue-50/90 border-[#2563eb] ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                    selectedRoleTab === 'evaluator' ? 'bg-[#2563eb] text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                    12명
                  </span>
                </div>
                <div className="font-bold text-slate-900 text-sm">평가위원 전용 로그인</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  배정된 8개 기관 캘린더 확인 및 일정 예약
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setSelectedRoleTab('institution'); setSearchQuery(''); }}
                className={`p-4 rounded-2xl border-2 text-left transition relative cursor-pointer ${
                  selectedRoleTab === 'institution'
                    ? 'bg-amber-50/90 border-[#d97706] ring-2 ring-amber-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                    selectedRoleTab === 'institution' ? 'bg-[#d97706] text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                    96개관
                  </span>
                </div>
                <div className="font-bold text-slate-900 text-sm">참여기관 전용 로그인</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  도서관·문학관·서점 프로그램 등록 & 실적 제출
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setSelectedRoleTab('admin'); setSearchQuery(''); }}
                className={`p-4 rounded-2xl border-2 text-left transition relative cursor-pointer ${
                  selectedRoleTab === 'admin'
                    ? 'bg-[#142d4c]/10 border-[#142d4c] ring-2 ring-[#142d4c]/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                    selectedRoleTab === 'admin' ? 'bg-[#142d4c] text-[#cca43b]' : 'bg-slate-100 text-slate-700'
                  }`}>
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#142d4c] text-[#cca43b]">
                    총괄 마스터
                  </span>
                </div>
                <div className="font-bold text-slate-900 text-sm">운영본부 관리자 포털</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  전체 96개관 매칭 캘린더 & 종합 엑셀 관리
                </div>
              </button>
            </div>

            {/* List / Search based on Tab */}
            {selectedRoleTab === 'evaluator' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-[#2563eb]" />
                    <span>12인 현장평가위원 목록 (클릭하여 즉시 로그인)</span>
                  </h4>
                  <div className="relative w-48">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="위원명 / 아이디 검색..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {filteredEvaluators.map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => {
                        onLogin('evaluator', ev.id);
                        onShowToast(`👋 ${ev.name} 평가위원 전용 화면으로 로그인되었습니다.`);
                      }}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition flex items-center justify-between group cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs group-hover:text-blue-900">
                            {ev.name} 위원
                          </span>
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-900">
                            {ev.accessKey}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {ev.residence ? `거주: ${ev.residence}` : ''} {ev.jurisdictionSummary ? `• 관할: ${ev.jurisdictionSummary}` : '• 담당 8개관'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <span>초기PW: <strong className="font-mono text-blue-700">{ev.phone ? getLast4Digits(ev.phone) : '1234'}</strong></span>
                          <span>•</span>
                          <span>담당 8개 시설</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedRoleTab === 'institution' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-amber-600" />
                    <span>96개 참여기관 (도서관/문학관/서점) 목록 (클릭하여 즉시 로그인)</span>
                  </h4>
                  <div className="relative w-56">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="기관명 / 지역 / 작가 검색..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {filteredInstitutions.slice(0, 30).map((inst) => (
                    <button
                      key={inst.id}
                      onClick={() => {
                        onLogin('institution', inst.id);
                        onShowToast(`🏛️ ${inst.name} 기관 전용 화면으로 로그인되었습니다.`);
                      }}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 text-left transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-xs truncate group-hover:text-amber-900">
                            {inst.name}
                          </span>
                          <span className="text-[10px] px-1 py-0.2 rounded bg-slate-200 text-slate-700 font-medium shrink-0">
                            {inst.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 shrink-0">
                            {inst.accessKey}
                          </span>
                          <span className="text-[11px] text-slate-500 truncate">
                            {inst.region} • 작가: {inst.writerName}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          초기PW: <strong className="font-mono text-amber-700">{getLast4Digits(inst.contactPhone)}</strong>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 transition shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
                {filteredInstitutions.length > 30 && (
                  <p className="text-[11px] text-slate-400 text-center">
                    (검색창에 기관명을 입력하시면 96개 전체 기관 중 원하는 기관을 바로 찾을 수 있습니다)
                  </p>
                )}
              </div>
            )}

            {selectedRoleTab === 'admin' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#142d4c]/10 text-[#142d4c] flex items-center justify-center mx-auto border border-[#142d4c]/20">
                  <ShieldCheck className="w-8 h-8 text-[#142d4c]" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">운영본부 관리자 포털</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    전체 96개 기관의 프로그램 일정 등록 현황 및 12인 평가위원의 방문 매칭 결과를 종합 캘린더로 확인하고 전체 엑셀을 내려받을 수 있습니다.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onLogin('admin', '');
                    onShowToast('🛡️ 운영본부 관리자 포털로 로그인되었습니다.');
                  }}
                  className="px-6 py-3 rounded-xl bg-[#142d4c] hover:bg-[#1b3a60] text-white font-bold text-xs transition shadow-md inline-flex items-center gap-2 cursor-pointer border border-[#2b5180]"
                >
                  <ShieldCheck className="w-4 h-4 text-[#cca43b]" />
                  <span>운영본부 관리자 포털 접속하기</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1b3658] bg-[#0b1b2d] py-4 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-2">
          <span>한국문화예술위원회(ARKO) • 2026 문학기반시설 상주작가 지원사업 현장평가단</span>
        </div>
      </footer>
    </div>
  );
};
