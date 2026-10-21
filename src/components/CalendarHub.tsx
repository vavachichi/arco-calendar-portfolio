import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Filter, 
  Search, 
  Clock, 
  MapPin, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Layers,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Info,
  CalendarCheck,
  Check,
  ChevronDown,
  Building2,
  CalendarDays,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { 
  Institution, 
  Evaluator, 
  FacilityType, 
  Region, 
  EvaluationStatus, 
  CalendarEvent,
  ProgramSchedule
} from '../types';
import { 
  getDaysInMonth, 
  formatDateToYYYYMMDD, 
  getDayNameKorean, 
  buildCalendarEvents 
} from '../utils/calendarUtils';

interface CalendarHubProps {
  institutions: Institution[];
  evaluators: Evaluator[];
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  onOpenCoordinationModal: (institutionId?: string, programId?: string, date?: string) => void;
  onOpenInstitutionDetail: (institution: Institution) => void;
  onOpenEvaluationForm: (institution: Institution) => void;
  onOpenSmartMatchModal: () => void;
}

type ViewMode = 'month' | 'agenda' | 'week' | 'matrix';

export const CalendarHub: React.FC<CalendarHubProps> = ({
  institutions,
  evaluators,
  selectedDate,
  onSelectDate,
  onOpenCoordinationModal,
  onOpenInstitutionDetail,
  onOpenEvaluationForm,
  onOpenSmartMatchModal,
}) => {
  // Calendar Navigation State (Default: August 2026)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(7); // 0-indexed: 7 is August
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [activeDate, setActiveDate] = useState<string>(selectedDate || '2026-08-20');

  // Filters State
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedEvaluatorFilter, setSelectedEvaluatorFilter] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  // Month navigation helpers
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

  const handleToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(7); // August 2026
    setActiveDate('2026-08-20');
    onSelectDate('2026-08-20');
  };

  const handleCellClick = (dateStr: string) => {
    setActiveDate(dateStr);
    onSelectDate(dateStr);
  };

  // Build days for month grid
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
  const emptyLeadingDays = Array.from({ length: firstDayOfWeek });

  // Filter institutions
  const filteredInstitutions = institutions.filter((inst) => {
    if (selectedRegion !== 'all' && inst.region !== selectedRegion) return false;
    if (selectedType !== 'all' && inst.type !== selectedType) return false;
    if (selectedStatus !== 'all' && inst.evaluationStatus !== selectedStatus) return false;
    if (selectedEvaluatorFilter !== 'all' && !inst.assignedEvaluatorIds.includes(selectedEvaluatorFilter)) return false;
    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase().trim();
      return (
        inst.name.toLowerCase().includes(kw) ||
        inst.writerName.toLowerCase().includes(kw) ||
        inst.subRegion.toLowerCase().includes(kw) ||
        (inst.accessKey || '').toLowerCase().includes(kw)
      );
    }
    return true;
  });

  // Filtered Events
  const calendarEvents = buildCalendarEvents(
    filteredInstitutions,
    evaluators,
    selectedRegion,
    selectedType,
    selectedStatus,
    selectedEvaluatorFilter,
    searchKeyword
  );

  // Selected Date Details (for bottom agenda panel)
  const selectedDateEvents = calendarEvents.filter((e) => e.date === activeDate);
  const selectedDateConfirmed = filteredInstitutions.filter(
    (i) => i.confirmedVisitDate === activeDate && (i.evaluationStatus === 'confirmed' || i.evaluationStatus === 'completed')
  );
  const selectedDatePrograms: { inst: Institution; prog: ProgramSchedule }[] = [];
  filteredInstitutions.forEach((inst) => {
    inst.programs.forEach((prog) => {
      if (prog.date === activeDate) {
        selectedDatePrograms.push({ inst, prog });
      }
    });
  });
  const selectedDateEvaluators = evaluators.filter((ev) => ev.availableDates.includes(activeDate));

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 1. View Switcher & Month Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Month Navigation */}
        <div className="flex items-center justify-between sm:justify-start gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-slate-900 transition"
              title="이전 달"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs sm:text-sm font-bold text-slate-900 px-2 sm:px-3 min-w-[95px] text-center font-mono">
              {currentYear}년 {currentMonth + 1}월
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-slate-900 transition"
              title="다음 달"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-blue-200 text-blue-900 bg-blue-50/60 hover:bg-blue-100 transition cursor-pointer"
          >
            이번 달 (8월)
          </button>

          <button
            onClick={onOpenSmartMatchModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#142d4c] border border-[#2b5180] text-[#cca43b] text-xs font-bold hover:bg-[#1b3a60] transition cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#cca43b]" />
            <span>AI 최적 매칭 추천</span>
          </button>

          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`md:hidden inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer ${
              isFilterOpen ? 'bg-[#142d4c] text-white border-[#142d4c]' : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>필터</span>
          </button>
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setViewMode('month')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer ${
              viewMode === 'month'
                ? 'bg-white text-[#142d4c] shadow-xs font-bold ring-1 ring-blue-500/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-[#2563eb]" />
            <span>월간 캘린더</span>
          </button>
          <button
            onClick={() => setViewMode('agenda')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer ${
              viewMode === 'agenda'
                ? 'bg-white text-[#142d4c] shadow-xs font-bold ring-1 ring-blue-500/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5 text-[#2563eb]" />
            <span>일자별 리스트</span>
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer ${
              viewMode === 'week'
                ? 'bg-white text-[#142d4c] shadow-xs font-bold ring-1 ring-blue-500/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#2563eb]" />
            <span>주간 시간표</span>
          </button>
          <button
            onClick={() => setViewMode('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer ${
              viewMode === 'matrix'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>매칭 매트릭스</span>
          </button>
        </div>
      </div>

      {/* 2. Filter & Search Bar */}
      <div className={`bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs space-y-3 ${
        isFilterOpen ? 'block' : 'hidden md:block'
      }`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="기관명 / 작가명 / 지역 검색..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
            />
          </div>

          {/* Region filter */}
          <div>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">전체 권역 (전국 8개 권역)</option>
              <option value="서울">서울권역</option>
              <option value="경기">경기권역</option>
              <option value="인천">인천권역</option>
              <option value="강원">강원권역</option>
              <option value="충청">충청/대전권역</option>
              <option value="전라">전라/광주권역</option>
              <option value="경상">경상/부산/대구권역</option>
              <option value="제주">제주권역</option>
            </select>
          </div>

          {/* Facility type filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">전체 시설 유형 (도서관/문학관/서점)</option>
              <option value="도서관">도서관</option>
              <option value="문학관">문학관</option>
              <option value="서점">서점</option>
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">전체 조율 상태</option>
              <option value="confirmed">🟢 방문 확정 (실사 예정)</option>
              <option value="proposing">🟡 조율 중 (제안/협의)</option>
              <option value="pending">⚪ 대기 / 미조율</option>
              <option value="completed">🔵 실사 완료</option>
            </select>
          </div>

          {/* Evaluator filter */}
          <div>
            <select
              value={selectedEvaluatorFilter}
              onChange={(e) => setSelectedEvaluatorFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">전체 평가위원</option>
              {evaluators.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} 위원 ({ev.specialty})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600 pt-2 border-t border-slate-100 gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-slate-800">캘린더 범례:</span>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
              <span>상주작가 프로그램 ({calendarEvents.filter(e => e.type === 'program').length}건)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              <span>현장평가 방문 확정 ({filteredInstitutions.filter(i => i.evaluationStatus === 'confirmed' || i.evaluationStatus === 'completed').length}건)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
              <span>평가위원 방문 가능</span>
            </div>
          </div>

          <div className="text-slate-500">
            필터 조회 기관: <strong className="text-slate-800 font-mono">{filteredInstitutions.length}개소</strong>
          </div>
        </div>
      </div>

      {/* 3. Main View: Month Calendar (Clean & Compact) */}
      {viewMode === 'month' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Day of week headers */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-700 py-2.5">
              <div className="text-rose-600">일 <span className="hidden sm:inline font-normal text-[10px] text-rose-400">(Sun)</span></div>
              <div>월 <span className="hidden sm:inline font-normal text-[10px] text-slate-400">(Mon)</span></div>
              <div>화 <span className="hidden sm:inline font-normal text-[10px] text-slate-400">(Tue)</span></div>
              <div>수 <span className="hidden sm:inline font-normal text-[10px] text-slate-400">(Wed)</span></div>
              <div>목 <span className="hidden sm:inline font-normal text-[10px] text-slate-400">(Thu)</span></div>
              <div>금 <span className="hidden sm:inline font-normal text-[10px] text-slate-400">(Fri)</span></div>
              <div className="text-blue-600">토 <span className="hidden sm:inline font-normal text-[10px] text-blue-400">(Sat)</span></div>
            </div>

            {/* Month grid */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
              {/* Leading empty cells */}
              {emptyLeadingDays.map((_, idx) => (
                <div key={`empty-${idx}`} className="bg-slate-50/40 p-1 sm:p-2 min-h-[65px] sm:min-h-[105px]" />
              ))}

              {/* Actual day cells */}
              {daysInMonth.map((dayDate) => {
                const dateStr = formatDateToYYYYMMDD(dayDate);
                const dayOfWeek = dayDate.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const isSelected = activeDate === dateStr;

                // Programs on this date
                const programsOnDay: { inst: Institution; prog: ProgramSchedule }[] = [];
                filteredInstitutions.forEach((inst) => {
                  inst.programs.forEach((prog) => {
                    if (prog.date === dateStr) {
                      programsOnDay.push({ inst, prog });
                    }
                  });
                });

                // Confirmed visits on this date
                const confirmedOnDay = filteredInstitutions.filter(
                  (i) => i.confirmedVisitDate === dateStr && (i.evaluationStatus === 'confirmed' || i.evaluationStatus === 'completed')
                );

                // Available evaluators
                const evaluatorsOnDay = evaluators.filter((ev) => ev.availableDates.includes(dateStr));

                return (
                  <div
                    key={dateStr}
                    onClick={() => handleCellClick(dateStr)}
                    className={`p-1.5 sm:p-2 min-h-[65px] sm:min-h-[105px] max-h-[140px] flex flex-col justify-between transition cursor-pointer group hover:bg-slate-50/90 ${
                      isSelected 
                        ? 'ring-2 ring-emerald-600 ring-inset bg-emerald-50/30' 
                        : isWeekend ? 'bg-slate-50/30' : 'bg-white'
                    }`}
                  >
                    <div>
                      {/* Date header line */}
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : dayOfWeek === 0
                              ? 'text-rose-600'
                              : dayOfWeek === 6
                              ? 'text-blue-600'
                              : 'text-slate-800'
                          }`}
                        >
                          {dayDate.getDate()}
                        </span>

                        {/* Evaluators counter (Desktop only) */}
                        {evaluatorsOnDay.length > 0 && (
                          <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded-full border border-blue-100">
                            <User className="w-2.5 h-2.5" />
                            <span>{evaluatorsOnDay.length}</span>
                          </span>
                        )}
                      </div>

                      {/* Mobile Dots View */}
                      <div className="flex sm:hidden items-center justify-center gap-1 pt-1">
                        {confirmedOnDay.length > 0 && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600" title={`실사 ${confirmedOnDay.length}건`} />
                        )}
                        {programsOnDay.length > 0 && (
                          <span className="w-2 h-2 rounded-full bg-purple-600" title={`프로그램 ${programsOnDay.length}개`} />
                        )}
                        {evaluatorsOnDay.length > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title={`위원 ${evaluatorsOnDay.length}명 가능`} />
                        )}
                      </div>

                      {/* Desktop Compact Badges (Max 2 Badges + Count to prevent overflow) */}
                      <div className="hidden sm:flex flex-col gap-1 overflow-hidden">
                        {/* 1. Confirmed Visits (Top Priority) */}
                        {confirmedOnDay.length > 0 && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCellClick(dateStr);
                            }}
                            className="px-1.5 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-between shadow-2xs transition truncate"
                            title={`[실사 확정] ${confirmedOnDay.map(i => i.name).join(', ')}`}
                          >
                            <span className="truncate">🟢 실사 {confirmedOnDay[0].name}</span>
                            {confirmedOnDay.length > 1 && (
                              <span className="text-[9px] font-mono shrink-0 ml-0.5 bg-emerald-800 px-1 rounded">
                                +{confirmedOnDay.length - 1}
                              </span>
                            )}
                          </div>
                        )}

                        {/* 2. Program Summary Badge */}
                        {programsOnDay.length > 0 && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCellClick(dateStr);
                            }}
                            className="px-1.5 py-0.5 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-[10px] font-semibold flex items-center justify-between transition truncate"
                            title={`[프로그램 진행] ${programsOnDay.map(p => `${p.inst.name}(${p.prog.title})`).join(', ')}`}
                          >
                            <span className="truncate">📚 {programsOnDay[0].inst.name}</span>
                            {programsOnDay.length > 1 && (
                              <span className="text-[9px] font-mono text-purple-700 shrink-0 ml-0.5 font-bold">
                                +{programsOnDay.length - 1}개
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Hint / Click indicator */}
                    <div className="hidden sm:flex items-center justify-between text-[9px] text-slate-400 pt-0.5 border-t border-slate-100/60 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>상세보기</span>
                      <span className="text-emerald-700 font-bold">클릭</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Selected Date Instant Agenda Panel (Mobile & Web) */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                  {activeDate.slice(8)}일
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span>{activeDate} ({getDayNameKorean(activeDate)}요일) 통합 일정 상세</span>
                    <span className="text-xs font-normal text-slate-500">
                      (실사 {selectedDateConfirmed.length}건 • 프로그램 {selectedDatePrograms.length}개)
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    방문 가능 평가위원: {selectedDateEvaluators.length > 0 ? selectedDateEvaluators.map(e => e.name).join(', ') : '해당일 등록 위원 없음'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectDate(activeDate)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>전체 팝업으로 보기</span>
                </button>
                <button
                  onClick={() => onOpenCoordinationModal(undefined, undefined, activeDate)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>+ 일정 조율 등록</span>
                </button>
              </div>
            </div>

            {/* List of Programs & Visits on Selected Date */}
            {selectedDateConfirmed.length === 0 && selectedDatePrograms.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                이 날짜에는 등록된 상주작가 프로그램이나 실사 일정이 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* 1. Confirmed Visits */}
                {selectedDateConfirmed.map((inst) => {
                  const evalName = inst.assignedEvaluatorIds
                    .map((id) => evaluators.find((e) => e.id === id)?.name)
                    .filter(Boolean)
                    .join(', ') || '평가위원';

                  return (
                    <div
                      key={`conf-card-${inst.id}`}
                      className="p-3.5 rounded-xl border-2 border-emerald-200 bg-emerald-50/60 flex flex-col justify-between space-y-2"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                            🟢 현장평가 방문 확정
                          </span>
                          <span className="text-xs font-mono font-bold text-emerald-800">
                            {inst.confirmedVisitTime || '14:00'}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{inst.name}</h4>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          {inst.region} {inst.subRegion} • 상주작가: {inst.writerName}
                        </p>
                        <div className="text-[11px] text-emerald-900 font-semibold mt-1">
                          👤 전담 위원: {evalName} 위원
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-emerald-200/60">
                        <button
                          onClick={() => onOpenInstitutionDetail(inst)}
                          className="flex-1 py-1.5 rounded-lg bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold text-center transition cursor-pointer"
                        >
                          기관 상세
                        </button>
                        <button
                          onClick={() => onOpenCoordinationModal(inst.id, undefined, activeDate)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition cursor-pointer"
                        >
                          일정 변경
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* 2. Program Schedules */}
                {selectedDatePrograms.map(({ inst, prog }) => (
                  <div
                    key={`prog-card-${prog.id}`}
                    className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                          📚 상주작가 프로그램
                        </span>
                        <span className="text-xs font-mono font-bold text-purple-800">
                          {prog.startTime} ~ {prog.endTime}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{inst.name}</h4>
                      <p className="text-[11px] font-semibold text-purple-900 mt-0.5 truncate">
                        {prog.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        작가: {inst.writerName} • 장소: {prog.locationRoom || '프로그램실'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-purple-200/60">
                      <button
                        onClick={() => onOpenInstitutionDetail(inst)}
                        className="flex-1 py-1.5 rounded-lg bg-white hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold text-center transition cursor-pointer"
                      >
                        기관 정보
                      </button>
                      <button
                        onClick={() => onOpenCoordinationModal(inst.id, prog.id, activeDate)}
                        className="px-2.5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition cursor-pointer"
                      >
                        이 날짜로 실사 확정
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Agenda (일자별 리스트) View */}
      {viewMode === 'agenda' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-emerald-600" />
              <span>2026년 8월 전체 일자별 프로그램 & 실사 일정 아젠다</span>
            </h3>
            <span className="text-xs text-slate-500">
              총 {filteredInstitutions.length}개 기관 대상
            </span>
          </div>

          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
            {daysInMonth.map((dayDate) => {
              const dateStr = formatDateToYYYYMMDD(dayDate);
              const progsOnDay: { inst: Institution; prog: ProgramSchedule }[] = [];
              filteredInstitutions.forEach((inst) => {
                inst.programs.forEach((p) => {
                  if (p.date === dateStr) progsOnDay.push({ inst, prog: p });
                });
              });
              const confirmedOnDay = filteredInstitutions.filter((i) => i.confirmedVisitDate === dateStr);

              if (progsOnDay.length === 0 && confirmedOnDay.length === 0) return null;

              return (
                <div key={`agenda-${dateStr}`} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono">
                        {dateStr} ({getDayNameKorean(dateStr)})
                      </span>
                      <span className="text-xs font-semibold text-slate-600">
                        실사 {confirmedOnDay.length}건 • 프로그램 {progsOnDay.length}개
                      </span>
                    </div>
                    <button
                      onClick={() => onOpenCoordinationModal(undefined, undefined, dateStr)}
                      className="text-xs text-emerald-700 hover:text-emerald-800 font-bold"
                    >
                      + 조율 제안
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {confirmedOnDay.map((inst) => (
                      <div
                        key={`agenda-conf-${inst.id}`}
                        onClick={() => onOpenInstitutionDetail(inst)}
                        className="p-3 rounded-lg border border-emerald-300 bg-emerald-50 text-slate-900 text-xs flex items-center justify-between cursor-pointer hover:bg-emerald-100 transition"
                      >
                        <div>
                          <div className="font-bold text-emerald-900 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>[실사] {inst.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            작가: {inst.writerName} • {inst.region}
                          </div>
                        </div>
                        <span className="font-mono text-emerald-800 font-bold">{inst.confirmedVisitTime}</span>
                      </div>
                    ))}

                    {progsOnDay.map(({ inst, prog }) => (
                      <div
                        key={`agenda-prog-${prog.id}`}
                        onClick={() => onOpenCoordinationModal(inst.id, prog.id, dateStr)}
                        className="p-3 rounded-lg border border-purple-200 bg-purple-50/70 text-slate-900 text-xs flex items-center justify-between cursor-pointer hover:bg-purple-100 transition"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-purple-900 truncate">
                            📚 {inst.name}
                          </div>
                          <div className="text-[11px] text-purple-700 truncate mt-0.5 font-medium">
                            {prog.title}
                          </div>
                        </div>
                        <span className="font-mono text-purple-800 shrink-0 text-[11px] font-bold">
                          {prog.startTime}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Week Timeline View */}
      {viewMode === 'week' && (
        <WeekTimelineView
          selectedDate={activeDate}
          institutions={filteredInstitutions}
          evaluators={evaluators}
          onSelectDate={handleCellClick}
          onOpenCoordinationModal={onOpenCoordinationModal}
          onOpenInstitutionDetail={onOpenInstitutionDetail}
        />
      )}

      {/* 6. Coordination Matrix View */}
      {viewMode === 'matrix' && (
        <CoordinationMatrixView
          institutions={filteredInstitutions}
          evaluators={evaluators}
          onOpenCoordinationModal={onOpenCoordinationModal}
          onOpenInstitutionDetail={onOpenInstitutionDetail}
        />
      )}
    </div>
  );
};

/* -------------------------------------------------------------
 * 1. Week Timeline View Component
 * ------------------------------------------------------------- */
interface WeekTimelineViewProps {
  selectedDate: string;
  institutions: Institution[];
  evaluators: Evaluator[];
  onSelectDate: (date: string) => void;
  onOpenCoordinationModal: (institutionId?: string, programId?: string, date?: string) => void;
  onOpenInstitutionDetail: (institution: Institution) => void;
}

const WeekTimelineView: React.FC<WeekTimelineViewProps> = ({
  selectedDate,
  institutions,
  evaluators,
  onSelectDate,
  onOpenCoordinationModal,
  onOpenInstitutionDetail,
}) => {
  const curr = new Date(selectedDate || '2026-08-20');
  const day = curr.getDay(); // 0 is Sunday
  const sunday = new Date(curr);
  sunday.setDate(curr.getDate() - day);

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });

  const hours = [
    '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', 
    '17:00', '18:00', '19:00', '20:00'
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800">
          주간 시간표 ({formatDateToYYYYMMDD(weekDays[0])} ~ {formatDateToYYYYMMDD(weekDays[6])})
        </span>
        <span className="text-xs text-slate-500 hidden sm:inline">
          시간대별 상주작가 프로그램 & 현장평가 방문 일정
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Week Grid Header */}
          <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-100/70 text-xs font-semibold text-slate-700 text-center py-2">
            <div className="border-r border-slate-200 text-slate-500">시간</div>
            {weekDays.map((d) => {
              const dateStr = formatDateToYYYYMMDD(d);
              const isSelected = dateStr === selectedDate;
              return (
                <div
                  key={dateStr}
                  onClick={() => onSelectDate(dateStr)}
                  className={`cursor-pointer px-1 py-0.5 rounded ${
                    isSelected ? 'bg-emerald-600 text-white font-bold' : ''
                  }`}
                >
                  <div>{getDayNameKorean(dateStr)}요일</div>
                  <div className="text-[11px] font-mono">{d.getMonth() + 1}.{d.getDate()}</div>
                </div>
              );
            })}
          </div>

          {/* Hourly Matrix */}
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {hours.map((hourStr) => {
              const hourNum = parseInt(hourStr.split(':')[0], 10);

              return (
                <div key={hourStr} className="grid grid-cols-8 min-h-[48px] divide-x divide-slate-100">
                  <div className="p-2 text-[11px] font-mono text-slate-400 text-center bg-slate-50/50 flex items-center justify-center">
                    {hourStr}
                  </div>

                  {weekDays.map((d) => {
                    const dateStr = formatDateToYYYYMMDD(d);
                    const matchingPrograms: { inst: Institution; prog: ProgramSchedule }[] = [];
                    institutions.forEach((inst) => {
                      inst.programs.forEach((prog) => {
                        if (prog.date === dateStr) {
                          const progStartH = parseInt(prog.startTime.split(':')[0], 10);
                          const progEndH = parseInt(prog.endTime.split(':')[0], 10);
                          if (hourNum >= progStartH && hourNum <= progEndH) {
                            matchingPrograms.push({ inst, prog });
                          }
                        }
                      });
                    });

                    const matchingConfirmed = institutions.filter(
                      (i) =>
                        i.confirmedVisitDate === dateStr &&
                        parseInt((i.confirmedVisitTime || '14:00').split(':')[0], 10) === hourNum
                    );

                    return (
                      <div
                        key={dateStr}
                        onClick={() => onOpenCoordinationModal(undefined, undefined, dateStr)}
                        className="p-1 min-h-[48px] flex flex-col gap-1 hover:bg-slate-50 transition cursor-pointer"
                      >
                        {matchingConfirmed.map((inst) => (
                          <div
                            key={`conf-${inst.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenInstitutionDetail(inst);
                            }}
                            className="p-1 rounded bg-emerald-600 text-white text-[10px] font-semibold flex items-center gap-1 shadow-2xs truncate"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{inst.name} 실사</span>
                          </div>
                        ))}

                        {matchingPrograms.slice(0, 2).map(({ inst, prog }) => (
                          <div
                            key={`prog-${prog.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenCoordinationModal(inst.id, prog.id, dateStr);
                            }}
                            className="p-1 rounded bg-purple-50 text-purple-900 border border-purple-200 text-[10px] font-medium flex items-center gap-1 truncate"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0" />
                            <span className="truncate">{inst.name}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------
 * 2. Coordination Matrix View Component
 * ------------------------------------------------------------- */
interface CoordinationMatrixViewProps {
  institutions: Institution[];
  evaluators: Evaluator[];
  onOpenCoordinationModal: (institutionId?: string, programId?: string, date?: string) => void;
  onOpenInstitutionDetail: (institution: Institution) => void;
}

const CoordinationMatrixView: React.FC<CoordinationMatrixViewProps> = ({
  institutions,
  evaluators,
  onOpenCoordinationModal,
  onOpenInstitutionDetail,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
          <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
          <span>12인 평가위원 전담 8개 기관 매칭 현황 매트릭스</span>
        </h4>
        <span className="text-xs text-slate-500">
          각 평가위원별 배정 8개 기관의 실사 확정 상태
        </span>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[650px] overflow-y-auto">
        {evaluators.map((ev) => {
          const assignedInsts = institutions.filter((i) => i.assignedEvaluatorIds.includes(ev.id));
          const confirmedCount = assignedInsts.filter((i) => i.confirmedVisitDate).length;

          return (
            <div key={ev.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <div>
                  <div className="font-bold text-slate-900 text-xs">{ev.name} 위원</div>
                  <div className="text-[11px] text-slate-500">{ev.affiliation} • {ev.specialty}</div>
                </div>
                <div className="text-right">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    confirmedCount === 8 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {confirmedCount} / 8곳 확정
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                {assignedInsts.map((inst) => (
                  <div
                    key={inst.id}
                    onClick={() => onOpenInstitutionDetail(inst)}
                    className="p-2 rounded-lg bg-white border border-slate-200 hover:border-emerald-300 text-xs flex items-center justify-between cursor-pointer transition"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-slate-800 truncate">{inst.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {inst.region} • 작가: {inst.writerName}
                      </div>
                    </div>
                    {inst.confirmedVisitDate ? (
                      <span className="text-[10px] font-mono font-bold text-emerald-700 shrink-0 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {inst.confirmedVisitDate.slice(5)} {inst.confirmedVisitTime}
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-700 shrink-0 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        미확정
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
