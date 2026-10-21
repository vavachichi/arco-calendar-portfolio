import { Institution, Evaluator, EvaluationRecord } from '../types';

/**
 * Downloads a text file with a specified mime type and filename
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 1. 평가위원 개인 전용: 8개 전담 기관 방문 일정표 엑셀 다운로드
 * 평가위원이 본인이 방문하기로 매칭/확정한 8개 기관의 일정을 엑셀로 다운로드
 */
export function exportEvaluatorScheduleToCSV(
  evaluator: Evaluator,
  institutions: Institution[],
  records?: EvaluationRecord[]
) {
  const targetInstitutions = institutions.filter((inst) =>
    evaluator.assignedInstitutionIds.includes(inst.id) || inst.assignedEvaluatorIds.includes(evaluator.id)
  );

  const headers = [
    '연번',
    '기관코드',
    '참여기관명',
    '시설유형',
    '권역/지역',
    '소재지 주소',
    '기관 담당자',
    '담당자 연락처',
    '담당자 이메일',
    '상주작가 성명',
    '주차 및 방문안내',
    '예약 상태',
    '실사 방문일자',
    '실사 방문시간',
    '참관 프로그램명',
    '프로그램 진행장소',
    '기관 제출 실적서류',
    '현장평가 점수'
  ];

  const rows = targetInstitutions.map((inst, index) => {
    const prog = inst.programs.find((p) => p.id === inst.confirmedProgramId) || inst.programs[0];
    const record = records?.find((r) => r.institutionId === inst.id && r.evaluatorId === evaluator.id);

    const isBooked = inst.assignedEvaluatorIds.includes(evaluator.id) && !!inst.confirmedVisitDate;
    const statusText = isBooked
      ? (record ? '실사완료' : '방문확정')
      : '일정 선택 필요 (대기)';

    const filesStr = (inst.activityFiles || []).map(f => f.name).join('; ') || '등록 서류 없음';

    return [
      index + 1,
      `"${inst.code || inst.id}"`,
      `"${inst.name}"`,
      `"${inst.type}"`,
      `"${inst.region} ${inst.subRegion}"`,
      `"${inst.address}"`,
      `"${inst.contactPerson || '-'}"`,
      `"${inst.contactPhone || '-'}"`,
      `"${inst.contactEmail || '-'}"`,
      `"${inst.writerName}"`,
      `"${inst.parkingInfo || '도서관/서점 주차장'}"`,
      `"${statusText}"`,
      `"${inst.confirmedVisitDate || '-'}"`,
      `"${inst.confirmedVisitTime || '-'}"`,
      `"${prog ? prog.title : '-'}"`,
      `"${prog ? prog.locationRoom : '-'}"`,
      `"${filesStr}"`,
      `"${record ? `${record.totalScore}점` : '-'}"`,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [
    `# [한국문화예술위원회] 상주작가 지원사업 현장평가 방문 일정표`,
    `# 평가위원: ${evaluator.name} (${evaluator.affiliation} | ${evaluator.title}) | 연락처: ${evaluator.phone}`,
    `# 총 배정 기관: ${targetInstitutions.length}곳 (확정: ${targetInstitutions.filter(i => i.assignedEvaluatorIds.includes(evaluator.id) && i.confirmedVisitDate).length}곳)`,
    headers.join(','),
    ...rows
  ].join('\r\n');

  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(
    csvContent,
    `상주작가_현장평가_방문일정표_${evaluator.name}위원_${dateStr}.csv`,
    'text/csv;charset=utf-8;'
  );
}

/**
 * 2. 관리자(리서치팀) 종합: 전체 96개 기관 & 12인 평가위원 실사 매칭 종합 엑셀
 */
export function exportMatchedScheduleToCSV(
  institutions: Institution[],
  evaluators: Evaluator[],
  records?: EvaluationRecord[]
) {
  const headers = [
    '연번',
    '기관코드',
    '기관접속키',
    '참여기관명',
    '시설유형',
    '권역',
    '세부지역',
    '소재지 주소',
    '기관 담당자',
    '담당자 연락처',
    '담당자 이메일',
    '상주작가 성명',
    '주차 안내',
    '실사/조율 상태',
    '확정 방문일자',
    '확정 방문시간',
    '참관 프로그램명',
    '프로그램 진행장소',
    '배정 전담 평가위원',
    '평가위원 소속/직함',
    '평가위원 연락처',
    '평가위원 접속키',
    '기관 제출 실적보고서 유무',
    '현장평가 점수(100점)',
    '비고/특이사항'
  ];

  const rows = institutions.map((inst, index) => {
    const assignedEval = evaluators.find((e) => inst.assignedEvaluatorIds.includes(e.id)) ||
      evaluators.find((e) => e.assignedInstitutionIds.includes(inst.id));

    const prog = inst.programs.find((p) => p.id === inst.confirmedProgramId) || inst.programs[0];
    const record = records?.find((r) => r.institutionId === inst.id);

    const statusKor =
      inst.evaluationStatus === 'confirmed'
        ? '방문 확정'
        : inst.evaluationStatus === 'proposing'
        ? '조율 중'
        : inst.evaluationStatus === 'completed'
        ? '실사 완료'
        : '일정 대기';

    const hasFiles = (inst.activityFiles && inst.activityFiles.length > 0)
      ? `제출 완료 (${inst.activityFiles.length}건)`
      : '미제출';

    return [
      index + 1,
      `"${inst.code || inst.id}"`,
      `"${inst.accessKey || '-'}"`,
      `"${inst.name}"`,
      `"${inst.type}"`,
      `"${inst.region}"`,
      `"${inst.subRegion}"`,
      `"${inst.address}"`,
      `"${inst.contactPerson || '-'}"`,
      `"${inst.contactPhone || '-'}"`,
      `"${inst.contactEmail || '-'}"`,
      `"${inst.writerName}"`,
      `"${inst.parkingInfo || '-'}"`,
      `"${statusKor}"`,
      `"${inst.confirmedVisitDate || '-'}"`,
      `"${inst.confirmedVisitTime || '-'}"`,
      `"${prog ? prog.title : '-'}"`,
      `"${prog ? prog.locationRoom : '-'}"`,
      `"${assignedEval ? assignedEval.name : '미배정'}"`,
      `"${assignedEval ? `${assignedEval.affiliation} ${assignedEval.title}` : '-'}"`,
      `"${assignedEval ? assignedEval.phone : '-'}"`,
      `"${assignedEval ? assignedEval.accessKey : '-'}"`,
      `"${hasFiles}"`,
      `"${record ? `${record.totalScore}점` : '-'}"`,
      `"${(inst.notes || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [
    `# [한국문화예술위원회] 상주작가 지원사업 현장평가 총괄 매칭 마스터`,
    `# 기준일: ${new Date().toLocaleDateString('ko-KR')} | 총 기관 수: ${institutions.length}개소 | 총 평가위원: ${evaluators.length}인`,
    headers.join(','),
    ...rows
  ].join('\r\n');

  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(
    csvContent,
    `ARKO_상주작가_현장평가_전체매칭결과_96개기관_${dateStr}.csv`,
    'text/csv;charset=utf-8;'
  );
}

export const exportCalendarToCSV = exportMatchedScheduleToCSV;
export const exportToCSV = exportMatchedScheduleToCSV;

/**
 * 3. 96개 기관 + 12인 평가위원 접속 계정/비밀번호 발송용 명단 엑셀
 */
export function exportAccessKeysToCSV(institutions: Institution[], evaluators: Evaluator[]) {
  const headers = [
    '구분',
    '연번',
    '고유코드',
    '로그인 아이디(접속키)',
    '초기 비밀번호',
    '대상명 (기관명/위원명)',
    '시설유형 / 소속',
    '권역 / 선호권역',
    '담당자 / 직함',
    '연락처 (SMS 발송용)',
    '이메일 (안내문 발송용)',
    '상주작가 / 전문분야',
    'SMS 안내문구 템플릿',
  ];

  const rows: string[] = [];

  const getLast4Digits = (phone: string) => {
    const nums = phone.replace(/[^0-9]/g, '');
    return nums.length >= 4 ? nums.slice(-4) : '1234';
  };

  // 1) 96 Institutions
  institutions.forEach((inst, idx) => {
    const pwd = inst.password || getLast4Digits(inst.contactPhone);
    const smsMsg = `[ARKO 상주작가 현장평가] ${inst.name} 담당자님, 프로그램 캘린더 등록 포털 로그인 아이디: [${inst.accessKey}], 비밀번호: [${pwd}] 입니다.`;
    rows.push(
      [
        '"참여기관"',
        idx + 1,
        `"${inst.code || inst.id}"`,
        `"${inst.accessKey}"`,
        `"${pwd}"`,
        `"${inst.name}"`,
        `"${inst.type}"`,
        `"${inst.region}"`,
        `"${inst.contactPerson}"`,
        `"${inst.contactPhone}"`,
        `"${inst.contactEmail}"`,
        `"${inst.writerName}"`,
        `"${smsMsg}"`,
      ].join(',')
    );
  });

  // 2) 12 Evaluators
  evaluators.forEach((ev, idx) => {
    const pwd = ev.password || getLast4Digits(ev.phone);
    const smsMsg = `[ARKO 상주작가 현장평가] ${ev.name} 위원님, 배정 8개 기관 방문 예약 포털 로그인 아이디: [${ev.accessKey}], 비밀번호: [${pwd}] 입니다.`;
    rows.push(
      [
        '"평가위원"',
        idx + 1,
        `"${ev.code || ev.id}"`,
        `"${ev.accessKey}"`,
        `"${pwd}"`,
        `"${ev.name}"`,
        `"${ev.affiliation}"`,
        `"${ev.preferredRegions.join('/')}"`,
        `"${ev.title}"`,
        `"${ev.phone}"`,
        `"${ev.email}"`,
        `"${ev.specialty}"`,
        `"${smsMsg}"`,
      ].join(',')
    );
  });

  const csvContent = '\uFEFF' + [
    `# [한국문화예술위원회] 2026 상주작가 지원사업 현장평가 사용자 접속 계정(아이디/비밀번호) 발송 대장`,
    `# 초기 비밀번호는 [연락처 뒷 4자리] 또는 [1234]로 일괄 지정되어 있습니다.`,
    headers.join(','),
    ...rows
  ].join('\r\n');

  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(csvContent, `ARKO_현장평가_로그인계정및비밀번호대장_${dateStr}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * 4. Generates an RFC 5545 compliant iCalendar (.ics) file
 */
export function exportToICS(institutions: Institution[], evaluators: Evaluator[]): void;
export function exportToICS(events: any[]): void;
export function exportToICS(instOrEvents: any, evaluators?: any): void {
  let icsContent: string;
  if (Array.isArray(instOrEvents) && instOrEvents.length > 0 && 'type' in instOrEvents[0]) {
    icsContent = generateICSFromEvents(instOrEvents);
  } else {
    icsContent = generateICS(instOrEvents, evaluators || []);
  }
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(icsContent, `상주작가_현장평가_일정_${dateStr}.ics`, 'text/calendar;charset=utf-8;');
}

function generateICS(institutions: Institution[], evaluators: Evaluator[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ARKO Resident Writer Evaluation Scheduler//KR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:상주작가 지원사업 현장평가 일정',
    'X-WR-TIMEZONE:Asia/Seoul',
  ];

  institutions.forEach((inst) => {
    if (inst.confirmedVisitDate && inst.confirmedVisitTime) {
      const prog = inst.programs.find((p) => p.id === inst.confirmedProgramId) || inst.programs[0];
      const cleanDate = inst.confirmedVisitDate.replace(/-/g, '');
      const cleanStartTime = inst.confirmedVisitTime.replace(/:/g, '') + '00';
      const cleanEndTime = (prog?.endTime || '17:00').replace(/:/g, '') + '00';

      const evaluatorNames = inst.assignedEvaluatorIds
        .map((id) => evaluators.find((e) => e.id === id)?.name)
        .filter(Boolean)
        .join(', ');

      const description = `[문학기반시설 상주작가 지원사업 현장평가]\n` +
        `■ 참여기관: ${inst.name} (${inst.type})\n` +
        `■ 상주작가: ${inst.writerName}\n` +
        `■ 참관 프로그램: ${prog ? prog.title : '상주작가 프로그램'}\n` +
        `■ 배정 평가위원: ${evaluatorNames || '배정중'}\n` +
        `■ 기관 담당자: ${inst.contactPerson || '-'} (${inst.contactPhone || '-'})\n` +
        `■ 주차: ${inst.parkingInfo || '도서관/서점 주차장'}`;

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:arko-visit-${inst.id}-${inst.confirmedVisitDate}@arko-eval.kr`);
      lines.push(`DTSTAMP:${formatICSNow()}`);
      lines.push(`DTSTART:${cleanDate}T${cleanStartTime}`);
      lines.push(`DTEND:${cleanDate}T${cleanEndTime}`);
      lines.push(`SUMMARY:[현장평가] ${inst.name} - ${inst.writerName} 작가 프로그램 참관`);
      lines.push(`LOCATION:${inst.address}`);
      lines.push(`DESCRIPTION:${escapeICS(description)}`);
      lines.push('STATUS:CONFIRMED');
      lines.push('END:VEVENT');
    }
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function generateICSFromEvents(events: any[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ARKO Resident Writer Evaluation Scheduler//KR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:상주작가 지원사업 현장평가 일정',
    'X-WR-TIMEZONE:Asia/Seoul',
  ];

  events.forEach((ev) => {
    if (ev.date && ev.startTime) {
      const cleanDate = ev.date.replace(/-/g, '');
      const cleanStartTime = ev.startTime.replace(/:/g, '') + '00';
      const cleanEndTime = (ev.endTime || '18:00').replace(/:/g, '') + '00';

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:arko-event-${ev.id}@arko-eval.kr`);
      lines.push(`DTSTAMP:${formatICSNow()}`);
      lines.push(`DTSTART:${cleanDate}T${cleanStartTime}`);
      lines.push(`DTEND:${cleanDate}T${cleanEndTime}`);
      lines.push(`SUMMARY:[${ev.type === 'visit_confirmed' ? '현장평가' : '프로그램'}] ${ev.title}`);
      lines.push(`DESCRIPTION:${escapeICS(`기관: ${ev.institutionName} | 상주작가: ${ev.writerName}`)}`);
      lines.push('STATUS:CONFIRMED');
      lines.push('END:VEVENT');
    }
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function formatICSNow(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const h = String(now.getUTCHours()).padStart(2, '0');
  const min = String(now.getUTCMinutes()).padStart(2, '0');
  const s = String(now.getUTCSeconds()).padStart(2, '0');
  return `${y}${m}${d}T${h}${min}${s}Z`;
}

function escapeICS(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}
