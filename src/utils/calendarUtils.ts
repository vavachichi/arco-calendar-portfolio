import { Institution, Evaluator, CalendarEvent } from '../types';

export function getDaysInMonth(year: number, month: number): Date[] {
  const date = new Date(year, month, 1);
  const days: Date[] = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

export function formatDateToYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDayNameKorean(dateStr: string): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const d = new Date(dateStr);
  return days[d.getDay()] || '';
}

export function buildCalendarEvents(
  institutions: Institution[],
  evaluators: Evaluator[],
  filterRegion?: string,
  filterType?: string,
  filterStatus?: string,
  filterEvaluatorId?: string,
  searchKeyword?: string
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  institutions.forEach((inst) => {
    // Apply filters
    if (filterRegion && filterRegion !== 'all' && inst.region !== filterRegion) return;
    if (filterType && filterType !== 'all' && inst.type !== filterType) return;
    if (filterStatus && filterStatus !== 'all' && inst.evaluationStatus !== filterStatus) return;
    if (filterEvaluatorId && filterEvaluatorId !== 'all' && !inst.assignedEvaluatorIds.includes(filterEvaluatorId)) return;
    if (searchKeyword && searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase().trim();
      const match =
        inst.name.toLowerCase().includes(kw) ||
        inst.writerName.toLowerCase().includes(kw) ||
        inst.subRegion.toLowerCase().includes(kw) ||
        inst.programs.some((p) => p.title.toLowerCase().includes(kw));
      if (!match) return;
    }

    const evaluatorNames = inst.assignedEvaluatorIds
      .map((id) => evaluators.find((e) => e.id === id)?.name)
      .filter(Boolean) as string[];

    // 1. Add all writer program schedules
    inst.programs.forEach((prog) => {
      const isConfirmedVisit =
        inst.evaluationStatus === 'confirmed' &&
        inst.confirmedVisitDate === prog.date &&
        (inst.confirmedProgramId === prog.id || !inst.confirmedProgramId);

      const isCompletedVisit =
        inst.evaluationStatus === 'completed' &&
        inst.confirmedVisitDate === prog.date;

      events.push({
        id: `event-prog-${prog.id}`,
        type: isCompletedVisit ? 'visit_confirmed' : isConfirmedVisit ? 'visit_confirmed' : 'program',
        date: prog.date,
        startTime: prog.startTime,
        endTime: prog.endTime,
        title: prog.title,
        institutionId: inst.id,
        institutionName: inst.name,
        writerName: inst.writerName,
        evaluatorNames: isConfirmedVisit || isCompletedVisit ? evaluatorNames : undefined,
        status: inst.evaluationStatus,
        programDetails: prog,
      });
    });

    // 2. If there's a confirmed visit date not directly matched to an individual program, ensure it's registered
    if (inst.evaluationStatus === 'confirmed' && inst.confirmedVisitDate && inst.confirmedVisitTime) {
      const alreadyHasEvent = events.some(
        (e) => e.institutionId === inst.id && e.date === inst.confirmedVisitDate && e.type === 'visit_confirmed'
      );
      if (!alreadyHasEvent) {
        events.push({
          id: `event-visit-${inst.id}`,
          type: 'visit_confirmed',
          date: inst.confirmedVisitDate,
          startTime: inst.confirmedVisitTime,
          endTime: calculateEndTime(inst.confirmedVisitTime, 120),
          title: `[실사 확정] ${inst.name} 현장평가`,
          institutionId: inst.id,
          institutionName: inst.name,
          writerName: inst.writerName,
          evaluatorNames,
          status: 'confirmed',
        });
      }
    }
  });

  return events;
}

export function calculateEndTime(startTime: string, durationMinutes: number = 120): string {
  const [h, m] = startTime.split(':').map(Number);
  const totalMin = (h || 0) * 60 + (m || 0) + durationMinutes;
  const endH = Math.floor(totalMin / 60) % 24;
  const endM = totalMin % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

export interface MatchScoreResult {
  institution: Institution;
  program: import('../types').ProgramSchedule;
  evaluator: Evaluator;
  score: number; // 0 ~ 100
  reasons: string[];
  isAvailableOnDate: boolean;
  isRegionalMatch: boolean;
  isSpecialtyMatch: boolean;
}

export function findSmartMatches(
  institutions: Institution[],
  evaluators: Evaluator[]
): MatchScoreResult[] {
  const results: MatchScoreResult[] = [];

  institutions.forEach((inst) => {
    // Focus on pending or proposing institutions
    if (inst.evaluationStatus === 'confirmed' || inst.evaluationStatus === 'completed') return;

    inst.programs.forEach((prog) => {
      evaluators.forEach((evaluator) => {
        // Restore missing result flag; original scoring weights unchanged.
        const isSpecialtyMatch = Boolean(evaluator.specialty && evaluator.specialty === prog.genre);
        let score = 50;
        const reasons: string[] = [];

        const isAvailableOnDate = evaluator.availableDates.includes(prog.date);
        if (isAvailableOnDate) {
          score += 30;
          reasons.push(`${prog.date} (${getDayNameKorean(prog.date)}) 평가위원 방문 가능`);
        } else {
          score -= 25;
        }

        const isRegionalMatch = evaluator.preferredRegions.includes(inst.region);
        if (isRegionalMatch) {
          score += 15;
          reasons.push(`선호 지역 일치 (${inst.region})`);
        }

        if (inst.assignedEvaluatorIds.includes(evaluator.id)) {
          score += 10;
          reasons.push('담당 평가위원 사전 배정됨');
        }

        if (score >= 60) {
          results.push({
            institution: inst,
            program: prog,
            evaluator,
            score: Math.min(100, score),
            reasons,
            isAvailableOnDate,
            isRegionalMatch,
            isSpecialtyMatch,
          });
        }
      });
    });
  });

  return results.sort((a, b) => b.score - a.score);
}
