import React from 'react';
import { 
  Building2, 
  UserCheck, 
  ShieldCheck, 
  CheckCircle2, 
  KeyRound, 
  LogOut,
  UploadCloud
} from 'lucide-react';
import { UserRole, Institution, Evaluator } from '../types';
import { ArkoLogo } from './ArkoLogo';

interface HeaderProps {
  currentRole: UserRole;
  currentEvaluator?: Evaluator;
  currentInstitution?: Institution;
  institutionsCount: number;
  evaluatorsCount: number;
  confirmedCount: number;
  onLogout: () => void;
  onExportCSV: () => void;
  onExportAccessKeys: () => void;
  onOpenBatchImport: () => void;
  onOpenKeyLogin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  currentEvaluator,
  currentInstitution,
  institutionsCount,
  evaluatorsCount,
  confirmedCount,
  onLogout,
  onExportCSV,
  onExportAccessKeys,
  onOpenBatchImport,
  onOpenKeyLogin,
}) => {
  const rate = institutionsCount > 0 ? Math.round((confirmedCount / institutionsCount) * 100) : 0;

  return (
    <header className="bg-[#142d4c] text-white border-b border-[#234670] sticky top-0 z-30 shadow-md">
      {/* Top Notice Bar */}
      <div className="bg-[#0e2238] text-slate-200 text-xs px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-[#1b3658]">
        <div className="flex items-center gap-3 font-medium">
          <ArkoLogo variant="light" className="h-4" />
          <span className="hidden md:inline text-slate-300 text-[11px] border-l border-slate-700 pl-3">
            2026 문학기반시설 상주작가 지원사업 현장평가 시스템
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-300">
          <span className="bg-[#1b3a60] px-2.5 py-0.5 rounded text-white border border-[#2b5180]">
            평가위원 <strong className="text-[#e5c158]">{evaluatorsCount}명</strong>
          </span>
          <span className="bg-[#1b3a60] px-2.5 py-0.5 rounded text-white border border-[#2b5180]">
            참여기관 <strong className="text-[#e5c158]">{institutionsCount}곳</strong>
          </span>
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold bg-[#112a47] px-2.5 py-0.5 rounded border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>매칭 확정률: {confirmedCount}/{institutionsCount}곳 ({rate}%)</span>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Title & Portal Mode */}
        <div className="flex items-center gap-3.5">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-md shrink-0 border ${
            currentRole === 'admin' 
              ? 'bg-[#1b3a60] border-[#36649e] shadow-blue-950/40' 
              : currentRole === 'evaluator' 
              ? 'bg-[#1d4ed8] border-blue-400 shadow-blue-900/40' 
              : 'bg-[#b45309] border-amber-400 shadow-amber-950/40'
          }`}>
            {currentRole === 'admin' ? (
              <ShieldCheck className="w-6 h-6 text-[#e5c158]" />
            ) : currentRole === 'evaluator' ? (
              <UserCheck className="w-6 h-6 text-white" />
            ) : (
              <Building2 className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {currentRole === 'admin' && '운영본부 관리자 포털'}
                {currentRole === 'evaluator' && '현장평가위원 전용 방문예약 포털'}
                {currentRole === 'institution' && '참여기관 상주작가 프로그램 포털'}
              </h1>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                currentRole === 'admin'
                  ? 'bg-[#e5c158]/20 text-[#e5c158] border-[#e5c158]/40'
                  : currentRole === 'evaluator'
                  ? 'bg-blue-400/20 text-blue-200 border-blue-400/40'
                  : 'bg-amber-400/20 text-amber-200 border-amber-400/40'
              }`}>
                {currentRole === 'admin' && '운영본부'}
                {currentRole === 'evaluator' && '평가위원 12인'}
                {currentRole === 'institution' && '참여기관 96개관'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {currentRole === 'admin' && '전국 96개 기관 프로그램 등록 현황 및 12인 평가위원 매칭 종합 관리'}
              {currentRole === 'evaluator' && '본인에게 배정된 8개 기관의 일정을 확인하고 참관 방문을 예약합니다'}
              {currentRole === 'institution' && '상주작가 프로그램 일정을 등록하고 실적 서류를 제출합니다'}
            </p>
          </div>
        </div>

        {/* Right User Info & Logout Button */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Active User Badge */}
          {currentRole === 'evaluator' && currentEvaluator && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1b3a60] border border-[#2e598d] text-xs text-white">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="font-bold">
                {currentEvaluator.name} 위원님
              </div>
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30">
                {currentEvaluator.accessKey}
              </span>
            </div>
          )}

          {currentRole === 'institution' && currentInstitution && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1b3a60] border border-[#2e598d] text-xs text-white">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <div className="font-bold max-w-[180px] truncate">
                {currentInstitution.name}
              </div>
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-200 border border-amber-400/30">
                {currentInstitution.accessKey}
              </span>
            </div>
          )}

          {currentRole === 'admin' && (
            <div className="flex items-center gap-2">
              <button
                onClick={onExportAccessKeys}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1b3a60] hover:bg-[#234b7a] text-white text-xs font-bold transition border border-[#2e598d] cursor-pointer"
                title="전체 96개 기관 및 12인 위원의 접속키/로그인아이디 목록을 엑셀로 다운로드합니다"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#e5c158]" />
                <span>접속키 대장 엑셀</span>
              </button>
              <button
                onClick={onOpenBatchImport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1b3a60] hover:bg-[#234b7a] text-white text-xs font-bold transition border border-[#2e598d] cursor-pointer"
                title="96개 기관 및 12인 위원 기초 정보 일괄 등록"
              >
                <UploadCloud className="w-3.5 h-3.5 text-[#e5c158]" />
                <span>기초 데이터 관리</span>
              </button>
            </div>
          )}

          {/* Key Login / Switch Trigger */}
          <button
            onClick={onOpenKeyLogin}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition border border-white/20 cursor-pointer"
            title="다른 사용자 계정으로 전환"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#e5c158]" />
            <span>계정 전환</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-900/60 hover:bg-rose-900 text-rose-200 border border-rose-700/60 text-xs font-bold transition shadow-xs cursor-pointer"
            title="로그아웃하고 첫 로그인 화면으로 이동합니다"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-300" />
            <span>로그아웃</span>
          </button>
        </div>
      </div>
    </header>
  );
};

