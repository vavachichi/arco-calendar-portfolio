import React, { useState } from 'react';
import { 
  User, 
  Calendar as CalendarIcon, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Building2, 
  AlertCircle, 
  FileCheck, 
  ChevronRight, 
  Phone, 
  Search, 
  BookmarkCheck, 
  RefreshCw, 
  Download, 
  FileSpreadsheet, 
  ZoomIn, 
  Check, 
  X, 
  ChevronLeft,
  Info,
  Layers,
  Sparkles,
  CalendarCheck,
  FileText
} from 'lucide-react';
import { 
  Evaluator, 
  Institution, 
  EvaluationRecord, 
  ProgramSchedule 
} from '../types';
import { 
  getDaysInMonth, 
  formatDateToYYYYMMDD, 
  getDayNameKorean 
} from '../utils/calendarUtils';
import { exportEvaluatorScheduleToCSV } from '../utils/exportUtils';

interface EvaluatorPortalProps {
  currentEvaluator: Evaluator;
  institutions: Institution[];
  evaluators: Evaluator[];
  evaluationRecords: EvaluationRecord[];
  onToggleAvailableDate: (evaluatorId: string, date: string) => void;
  onOpenCoordinationModal: (institutionId: string, programId?: string) => void;
  onOpenEvaluationForm: (institution: Institution) => void;
  onOpenInstitutionDetail: (institution: Institution) => void;
  onBookVisit: (institutionId: string, programId: string, date: string, time: string) => void;
  onCancelBooking: (institutionId: string) => void;
  onShowToast: (msg: string) => void;
}

// Color palette for 8 assigned institutions so each institution has a distinct recognizable color
const INSTITUTION_COLORS = [
  { bg: 'bg-emerald-50 text-emerald-950 border-emerald-300', dot: 'bg-emerald-600', badge: 'bg-emerald-600 text-white' },
  { bg: 'bg-blue-50 text-blue-950 border-blue-300', dot: 'bg-blue-600', badge: 'bg-blue-600 text-white' },
  { bg: 'bg-amber-50 text-amber-950 border-amber-300', dot: 'bg-amber-600', badge: 'bg-amber-600 text-white' },
  { bg: 'bg-purple-50 text-purple-950 border-purple-300', dot: 'bg-purple-600', badge: 'bg-purple-600 text-white' },
  { bg: 'bg-rose-50 text-rose-950 border-rose-300', dot: 'bg-rose-600', badge: 'bg-rose-600 text-white' },
  { bg: 'bg-indigo-50 text-indigo-950 border-indigo-300', dot: 'bg-indigo-600', badge: 'bg-indigo-600 text-white' },
  { bg: 'bg-teal-50 text-teal-950 border-teal-300', dot: 'bg-teal-600', badge: 'bg-teal-600 text-white' },
  { bg: 'bg-orange-50 text-orange-950 border-orange-300', dot: 'bg-orange-600', badge: 'bg-orange-600 text-white' },
];

export const EvaluatorPortal: React.FC<EvaluatorPortalProps> = ({
  currentEvaluator,
  institutions,
  evaluators,
  evaluationRecords,
  onToggleAvailableDate,
  onOpenCoordinationModal,
  onOpenEvaluationForm,
  onOpenInstitutionDetail,
  onBookVisit,
  onCancelBooking,
  onShowToast,
}) => {
  // Navigation & View Mode
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(7); // August (0-indexed 7)
  const [viewMode, setViewMode] = useState<'calendar' | 'cards'>('calendar');
  const [isLargeFont, setIsLargeFont] = useState<boolean>(false);
  const [selectedInstFilter, setSelectedInstFilter] = useState<string>('all');
  const [activeModalProgram, setActiveModalProgram] = useState<{ inst: Institution; prog: ProgramSchedule } | null>(null);

  // Filter 8 institutions assigned to this evaluator
  const my8Institutions = institutions.filter((inst) =>
    currentEvaluator.assignedInstitutionIds.includes(inst.id) ||
    inst.assignedEvaluatorIds.includes(currentEvaluator.id)
  );

  // Map each institution to an assigned color index
  const instColorMap = new Map<string, typeof INSTITUTION_COLORS[0]>();
  my8Institutions.forEach((inst, idx) => {
    instColorMap.set(inst.id, INSTITUTION_COLORS[idx % INSTITUTION_COLORS.length]);
  });

  // Calculate booked count out of 8
  const bookedInstitutions = my8Institutions.filter((inst) =>
    inst.assignedEvaluatorIds.includes(currentEvaluator.id) && !!inst.confirmedVisitDate
  );
  const bookedCount = bookedInstitutions.length;
  const totalCount = my8Institutions.length || 8;
  const isAllBooked = bookedCount >= totalCount;

  // Calendar dates math
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0: Sunday
  const emptyLeadingDays = Array.from({ length: firstDayOfWeek });

  // Handle Month Prev / Next
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleDownloadMyScheduleCSV = () => {
    exportEvaluatorScheduleToCSV(currentEvaluator, institutions, evaluationRecords);
    onShowToast(`📥 [${currentEvaluator.name} 위원님] 8개 기관 예약 일정표가 엑셀(CSV)로 다운로드되었습니다.`);
  };

  return (
    <div className={`space-y-5 ${isLargeFont ? 'text-base' : 'text-xs'}`}>
      {/* 1. Evaluator Profile & Booking Summary Header */}
      <div className="bg-gradient-to-r from-[#10243e] via-[#16365c] to-[#10243e] text-white rounded-2xl p-5 sm:p-6 shadow-lg border border-[#234670] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#2563eb] text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0 border border-blue-400/40">
            <User className="w-7 h-7 text-[#cca43b]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className={`font-bold text-white ${isLargeFont ? 'text-2xl' : 'text-xl'}`}>
                {currentEvaluator.name} 평가위원 캘린더
              </h2>
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#cca43b]/20 text-[#cca43b] border border-[#cca43b]/40">
                접속키: {currentEvaluator.accessKey}
              </span>
              {currentEvaluator.residence && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/20">
                  거주지: {currentEvaluator.residence}
                </span>
              )}
            </div>
            <p className={`text-slate-200 mt-1 ${isLargeFont ? 'text-sm' : 'text-xs'}`}>
              관할 배정: <strong className="text-[#cca43b]">{currentEvaluator.jurisdictionSummary || '전담 8개 시설'}</strong>
            </p>
          </div>
        </div>

        {/* Right side: Accessibility & Excel Download */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setIsLargeFont(!isLargeFont)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
              isLargeFont
                ? 'bg-[#cca43b] text-[#142d4c] border-[#e5c158] shadow-md ring-2 ring-[#cca43b]/50'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
            }`}
          >
            <ZoomIn className="w-4 h-4" />
            <span>{isLargeFont ? '🔍 큰 글씨 (ON)' : '🔎 큰 글씨'}</span>
          </button>

          <button
            onClick={handleDownloadMyScheduleCSV}
            className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-1.5 border border-blue-400/50 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#cca43b]" />
            <span>나의 8곳 일정 엑셀 받기</span>
          </button>
        </div>
      </div>

      {/* 2. 8-Institution Booking Progress Tracker */}
      <div className={`bg-white rounded-2xl border ${isAllBooked ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-200'} p-5 shadow-xs space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${isAllBooked ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'}`}>
              {isAllBooked ? '✓' : '2'}
            </span>
            <div>
              <h3 className={`font-bold text-slate-900 ${isLargeFont ? 'text-lg' : 'text-sm'} flex items-center gap-2`}>
                <span>전담 8개 기관 실사 방문 일정 예약</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${isAllBooked ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'}`}>
                  {bookedCount}/{totalCount}곳 확정 ({Math.round((bookedCount / totalCount) * 100)}%)
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                아래 캘린더에서 각 기관이 개설한 3가지 프로그램 일정 중 방문할 1가지를 클릭하여 예약을 완료해주세요.
              </p>
            </div>
          </div>

          {isAllBooked && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-xs border border-emerald-300 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>8개 기관 방문 일정 예약이 모두 완료되었습니다!</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
          <div
            className={`h-full transition-all duration-500 rounded-full ${isAllBooked ? 'bg-emerald-600' : 'bg-amber-500'}`}
            style={{ width: `${(bookedCount / totalCount) * 100}%` }}
          />
        </div>

        {/* 8 Institutions Status Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
          {my8Institutions.map((inst, idx) => {
            const isBooked = inst.assignedEvaluatorIds.includes(currentEvaluator.id) && !!inst.confirmedVisitDate;
            const style = instColorMap.get(inst.id) || INSTITUTION_COLORS[0];
            const isSelected = selectedInstFilter === inst.id;

            return (
              <div
                key={inst.id}
                onClick={() => setSelectedInstFilter(isSelected ? 'all' : inst.id)}
                className={`p-3 rounded-xl border transition cursor-pointer relative ${
                  isSelected ? 'ring-2 ring-slate-900 shadow-xs' : ''
                } ${isBooked ? 'bg-emerald-50/70 border-emerald-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                    <span className="font-bold text-xs text-slate-900 truncate max-w-[130px]" title={inst.name}>
                      {inst.name}
                    </span>
                  </div>
                  {isBooked ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white shrink-0">
                      예약완료
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 shrink-0">
                      미예약
                    </span>
                  )}
                </div>

                <div className="mt-1.5 text-[11px] text-slate-600 space-y-0.5">
                  <p>작가: <strong>{inst.writerName}</strong></p>
                  {isBooked ? (
                    <p className="text-emerald-700 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{inst.confirmedVisitDate} ({inst.confirmedVisitTime})</span>
                    </p>
                  ) : (
                    <p className="text-amber-700 font-medium flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      <span>3개 일정 중 1개 선택 필요</span>
                    </p>
                  )}
                </div>

                {/* Uploaded Activity files indicator */}
                {inst.activityFiles && inst.activityFiles.length > 0 && (
                  <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-purple-700 font-medium">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      <span>실적서류 {inst.activityFiles.length}건</span>
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenInstitutionDetail(inst);
                      }}
                      className="hover:underline font-bold"
                    >
                      열람
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Main Calendar View: 8 Institutions × 3 Programs (24 Events) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Calendar Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className={`px-3 py-1 font-bold text-slate-900 ${isLargeFont ? 'text-lg' : 'text-sm'}`}>
                {currentYear}년 {currentMonth + 1}월
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => {
                setCurrentYear(2026);
                setCurrentMonth(7);
              }}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition shadow-2xs"
            >
              오늘 (8월)
            </button>
          </div>

          {/* View Toggles & Filter */}
          <div className="flex items-center gap-2">
            {selectedInstFilter !== 'all' && (
              <button
                onClick={() => setSelectedInstFilter('all')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold transition flex items-center gap-1"
              >
                <span>전체 8개관 보기</span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <div className="flex items-center p-1 bg-white rounded-xl border border-slate-200 text-xs font-semibold shadow-2xs">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'calendar' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                캘린더 뷰
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'cards' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                8개관 카드 뷰
              </button>
            </div>
          </div>
        </div>

        {/* View Mode 1: Interactive 8-Institution Calendar Grid */}
        {viewMode === 'calendar' ? (
          <div className="p-3 sm:p-4">
            {/* Days Header */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-500 mb-1 py-1 border-b border-slate-100">
              <div className="text-rose-600">일</div>
              <div>월</div>
              <div>화</div>
              <div>수</div>
              <div>목</div>
              <div>금</div>
              <div className="text-blue-600">토</div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {/* Empty leading days */}
              {emptyLeadingDays.map((_, idx) => (
                <div key={`empty-${idx}`} className="min-h-[65px] sm:min-h-[130px] bg-slate-50/40 rounded-xl p-1 border border-transparent" />
              ))}

              {/* Month days */}
              {daysInMonth.map((day) => {
                const dateStr = formatDateToYYYYMMDD(day);
                const dayNum = day.getDate();
                const dayOfWeek = day.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                // Find all programs from the 8 institutions on this date
                const dayPrograms: { inst: Institution; prog: ProgramSchedule }[] = [];

                my8Institutions.forEach((inst) => {
                  if (selectedInstFilter !== 'all' && inst.id !== selectedInstFilter) return;

                  inst.programs.forEach((prog) => {
                    if (prog.date === dateStr) {
                      dayPrograms.push({ inst, prog });
                    }
                  });
                });

                return (
                  <div
                    key={dateStr}
                    onClick={() => {
                      if (dayPrograms.length === 1) {
                        setActiveModalProgram(dayPrograms[0]);
                      }
                    }}
                    className={`min-h-[65px] sm:min-h-[130px] rounded-xl p-1 sm:p-2 border transition flex flex-col justify-between cursor-pointer ${
                      dayPrograms.length > 0
                        ? 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-xs'
                        : 'bg-slate-50/60 border-slate-100'
                    }`}
                  >
                    {/* Day number header */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-bold px-1 sm:px-1.5 py-0.5 rounded-md ${
                            dayOfWeek === 0 ? 'text-rose-600' : dayOfWeek === 6 ? 'text-blue-600' : 'text-slate-800'
                          }`}
                        >
                          {dayNum}
                        </span>

                        {dayPrograms.length > 0 && (
                          <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 bg-slate-100 px-1 sm:px-1.5 py-0.2 rounded-full">
                            {dayPrograms.length}건
                          </span>
                        )}
                      </div>

                      {/* Mobile Dots */}
                      <div className="flex sm:hidden items-center justify-center gap-1 pt-1 flex-wrap">
                        {dayPrograms.map(({ inst, prog }) => {
                          const isThisProgBooked =
                            inst.confirmedProgramId === prog.id &&
                            inst.confirmedVisitDate === prog.date &&
                            inst.assignedEvaluatorIds.includes(currentEvaluator.id);
                          return (
                            <span
                              key={prog.id}
                              className={`w-2 h-2 rounded-full ${isThisProgBooked ? 'bg-emerald-600' : 'bg-purple-600'}`}
                            />
                          );
                        })}
                      </div>

                      {/* Desktop Program Cards inside Date */}
                      <div className="hidden sm:block space-y-1.5 flex-1 overflow-y-auto max-h-[110px] scrollbar-none">
                        {dayPrograms.map(({ inst, prog }) => {
                          const style = instColorMap.get(inst.id) || INSTITUTION_COLORS[0];
                          const isThisProgBooked =
                            inst.confirmedProgramId === prog.id &&
                            inst.confirmedVisitDate === prog.date &&
                            inst.assignedEvaluatorIds.includes(currentEvaluator.id);

                          return (
                            <div
                              key={prog.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveModalProgram({ inst, prog });
                              }}
                              className={`p-1.5 rounded-lg border text-left cursor-pointer transition relative group ${
                                isThisProgBooked
                                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                                  : `${style.bg} hover:shadow-xs`
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className={`text-[10px] font-bold truncate ${isThisProgBooked ? 'text-white' : 'text-slate-900'}`}>
                                  {inst.name}
                                </span>
                                {isThisProgBooked && (
                                  <span className="text-[8px] font-bold bg-white text-emerald-800 px-1 rounded shrink-0">
                                    확정
                                  </span>
                                )}
                              </div>

                              <p className={`text-[9px] truncate mt-0.5 ${isThisProgBooked ? 'text-emerald-100' : 'text-slate-700'}`}>
                                {prog.title}
                              </p>

                              <div className={`text-[8px] flex items-center justify-between mt-0.5 pt-0.5 border-t ${isThisProgBooked ? 'border-emerald-500/60 text-emerald-100' : 'border-slate-200/60 text-slate-500'}`}>
                                <span>{prog.startTime}</span>
                                <span className="font-semibold">{inst.writerName}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* View Mode 2: 8 Institutions Full Cards View */
          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {my8Institutions.map((inst, idx) => {
              const isBooked = inst.assignedEvaluatorIds.includes(currentEvaluator.id) && !!inst.confirmedVisitDate;
              const style = instColorMap.get(inst.id) || INSTITUTION_COLORS[0];

              return (
                <div
                  key={inst.id}
                  className={`rounded-2xl border p-5 space-y-4 transition bg-white ${
                    isBooked ? 'border-emerald-400 ring-1 ring-emerald-300/60' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl ${style.badge} flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}>
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                          <span>{inst.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                            {inst.region} {inst.subRegion}
                          </span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          상주작가: <strong>{inst.writerName}</strong>
                        </p>
                      </div>
                    </div>

                    {isBooked ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 shrink-0">
                        ✓ 실사 예약 확정
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300 shrink-0">
                        {inst.programs.length === 0 ? '일정 등록 대기' : '일정 선택 필요'}
                      </span>
                    )}
                  </div>

                  {/* Programs offered by this institution */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>기관 개설 프로그램 ({inst.programs.length}개)</span>
                      {inst.programs.length > 0 && (
                        <span className="text-[11px] font-normal text-slate-500">클릭하여 예약</span>
                      )}
                    </p>

                    {inst.programs.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-slate-500">
                        <CalendarIcon className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                        <p className="text-xs font-medium text-slate-600">상주작가 프로그램 일정 등록 대기 중</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">기관에서 상주작가 프로그램 일정을 등록하면 여기서 바로 실사 참관을 예약할 수 있습니다.</p>
                      </div>
                    ) : (
                      inst.programs.map((prog, pIdx) => {
                        const isThisBooked =
                          inst.confirmedProgramId === prog.id &&
                          inst.confirmedVisitDate === prog.date &&
                          inst.assignedEvaluatorIds.includes(currentEvaluator.id);

                        return (
                          <div
                            key={prog.id}
                            className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                              isThisBooked
                                ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-300'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <div className="space-y-0.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900 truncate">
                                  {prog.title}
                                </span>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 shrink-0">
                                  {prog.date} ({getDayNameKorean(prog.date)})
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 flex items-center gap-2">
                                <span>⏰ {prog.startTime}~{prog.endTime}</span>
                                <span>📍 {prog.locationRoom || '프로그램실'}</span>
                              </p>
                            </div>

                            {isThisBooked ? (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300">
                                  확정됨
                                </span>
                                <button
                                  onClick={() => onCancelBooking(inst.id)}
                                  className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-50 transition"
                                  title="예약을 초기화하고 다른 프로그램을 다시 선택합니다"
                                >
                                  취소
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => onBookVisit(inst.id, prog.id, prog.date, prog.startTime)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                                  isBooked
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                                }`}
                              >
                                <BookmarkCheck className="w-3.5 h-3.5" />
                                <span>{isBooked ? '이 일정으로 변경' : '이 프로그램 예약'}</span>
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Program Detail & Instant Booking Modal */}
      {activeModalProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-xs">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white">
                    {activeModalProgram.inst.name}
                  </h4>
                  <p className="text-xs text-slate-300">
                    상주작가: {activeModalProgram.inst.writerName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModalProgram(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">
                    참관 대상 프로그램
                  </span>
                  <span className="font-bold text-emerald-950 text-xs">
                    {activeModalProgram.prog.date} ({getDayNameKorean(activeModalProgram.prog.date)})
                  </span>
                </div>
                <h3 className="font-bold text-sm text-emerald-950">
                  {activeModalProgram.prog.title}
                </h3>
                <div className="text-slate-600 space-y-1 pt-1 border-t border-emerald-200/60 text-[11px]">
                  <p>⏰ <strong>시간:</strong> {activeModalProgram.prog.startTime} ~ {activeModalProgram.prog.endTime}</p>
                  <p>📍 <strong>장소:</strong> {activeModalProgram.prog.locationRoom}</p>
                  <p>👥 <strong>대상/인원:</strong> {activeModalProgram.prog.targetAudience} (예상 {activeModalProgram.prog.maxParticipants}명)</p>
                  {activeModalProgram.prog.description && (
                    <p>📝 <strong>내용:</strong> {activeModalProgram.prog.description}</p>
                  )}
                </div>
              </div>

              {/* Institution contact & location info */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-1.5 text-[11px]">
                <p>📍 <strong>주소:</strong> {activeModalProgram.inst.address}</p>
                <p>📞 <strong>기관 연락처:</strong> {activeModalProgram.inst.contactPerson} ({activeModalProgram.inst.contactPhone})</p>
              </div>

              {/* Uploaded activity files if any */}
              {activeModalProgram.inst.activityFiles && activeModalProgram.inst.activityFiles.length > 0 && (
                <div className="space-y-1.5">
                  <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-600" />
                    <span>기관 제출 실적 서류 ({activeModalProgram.inst.activityFiles.length}건)</span>
                  </h5>
                  <div className="space-y-1">
                    {activeModalProgram.inst.activityFiles.map((file) => (
                      <div key={file.id} className="p-2 rounded-lg bg-purple-50/60 border border-purple-200 flex items-center justify-between">
                        <span className="font-medium text-slate-800 truncate">{file.name}</span>
                        <span className="text-[10px] text-purple-700 font-bold uppercase">{file.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer: Book / Cancel Action */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={() => setActiveModalProgram(null)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition"
              >
                닫기
              </button>

              {activeModalProgram.inst.confirmedProgramId === activeModalProgram.prog.id &&
              activeModalProgram.inst.confirmedVisitDate === activeModalProgram.prog.date ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-2 rounded-xl border border-emerald-300">
                    ✓ 현재 확정된 예약입니다
                  </span>
                  <button
                    onClick={() => {
                      onCancelBooking(activeModalProgram.inst.id);
                      setActiveModalProgram(null);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-300 transition"
                  >
                    예약 취소
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onBookVisit(
                      activeModalProgram.inst.id,
                      activeModalProgram.prog.id,
                      activeModalProgram.prog.date,
                      activeModalProgram.prog.startTime
                    );
                    setActiveModalProgram(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <BookmarkCheck className="w-4 h-4" />
                  <span>
                    {activeModalProgram.inst.confirmedVisitDate ? '이 일정으로 변경 예약' : '이 프로그램으로 방문 예약'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
