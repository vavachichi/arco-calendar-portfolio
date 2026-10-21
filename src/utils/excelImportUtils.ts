import * as XLSX from 'xlsx';
import { Institution, Evaluator, Region, FacilityType, EvaluationStatus, WriterGenre } from '../types';

export interface ParseExcelResult {
  institutions: Institution[];
  evaluators: Evaluator[];
  matchedCount: number;
  unmatchedCount: number;
  message: string;
  details: {
    totalInstitutions: number;
    totalEvaluators: number;
    matchedInstitutions: number;
    confirmedDates: number;
  };
}

/**
 * Standardize and clean string
 */
function cleanStr(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val).trim().replace(/^["']|["']$/g, '');
}

/**
 * Parse date string into YYYY-MM-DD
 */
function parseDateStr(raw: string): string {
  if (!raw || raw === '-' || raw === '미정' || raw === '일정 대기') return '';
  
  // Format: 2026-08-19 or 2026.08.19 or 2026/08/19
  const standardMatch = raw.match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
  if (standardMatch) {
    const y = standardMatch[1];
    const m = String(standardMatch[2]).padStart(2, '0');
    const d = String(standardMatch[3]).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Format: 8월 19일 or 08월 19일 or 8/19
  const monthDayMatch = raw.match(/(\d{1,2})월\s*(\d{1,2})일/) || raw.match(/(\d{1,2})\/(\d{1,2})/);
  if (monthDayMatch) {
    const m = String(monthDayMatch[1]).padStart(2, '0');
    const d = String(monthDayMatch[2]).padStart(2, '0');
    return `2026-${m}-${d}`;
  }

  // Handle Excel serial date numbers (e.g., 46253)
  const num = Number(raw);
  if (!isNaN(num) && num > 40000 && num < 60000) {
    const date = new Date(Math.round((num - 25569) * 86400 * 1000));
    return date.toISOString().slice(0, 10);
  }

  return '';
}

/**
 * Parse time string into HH:mm
 */
function parseTimeStr(raw: string): string {
  if (!raw || raw === '-') return '14:00';
  const timeMatch = raw.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    return `${String(timeMatch[1]).padStart(2, '0')}:${timeMatch[2]}`;
  }
  if (raw.includes('오전') || raw.includes('AM') || raw.includes('am')) {
    const m = raw.match(/(\d{1,2})/);
    if (m) return `${String(m[1]).padStart(2, '0')}:00`;
  }
  if (raw.includes('오후') || raw.includes('PM') || raw.includes('pm')) {
    const m = raw.match(/(\d{1,2})/);
    if (m) {
      const h = Number(m[1]) < 12 ? Number(m[1]) + 12 : Number(m[1]);
      return `${String(h).padStart(2, '0')}:00`;
    }
  }
  return '14:00';
}

/**
 * Robust CSV parser that handles commas inside quotes and comment lines
 */
export function parseCSVTextToRows(text: string): string[][] {
  const lines = text.split(/\r\n|\n|\r/);
  const rows: string[][] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue; // Skip comments and empty lines

    // Parse CSV line handling quotes and delimiters (comma, tab, semicolon)
    const delimiter = trimmed.includes('\t') ? '\t' : (trimmed.includes(';') && !trimmed.includes(',') ? ';' : ',');
    const row: string[] = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < trimmed.length; i++) {
      const char = trimmed[i];
      if (char === '"') {
        if (inQuotes && trimmed[i + 1] === '"') {
          cur += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        row.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    row.push(cur.trim());
    if (row.some(cell => cell.length > 0)) {
      rows.push(row);
    }
  }

  return rows;
}

/**
 * Decode buffer trying UTF-8, then fallback to EUC-KR / CP949
 */
export function decodeBufferToText(buffer: ArrayBuffer): string {
  try {
    const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
    return utf8Decoder.decode(buffer);
  } catch {
    try {
      const eucKrDecoder = new TextDecoder('euc-kr');
      return eucKrDecoder.decode(buffer);
    } catch {
      const defaultDecoder = new TextDecoder('utf-8');
      return defaultDecoder.decode(buffer);
    }
  }
}

/**
 * Core parsing function accepting ArrayBuffer or CSV string
 */
export function parseMatchedExcelOrCSV(
  input: ArrayBuffer | string,
  existingInstitutions: Institution[],
  existingEvaluators: Evaluator[]
): ParseExcelResult {
  let allRows: any[][] = [];

  if (typeof input === 'string') {
    allRows = parseCSVTextToRows(input);
  } else {
    // Try XLSX read first
    try {
      const workbook = XLSX.read(input, { type: 'array' });
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) continue;
        const sheetRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        if (sheetRows.length > 0) {
          allRows = allRows.concat(sheetRows);
        }
      }
    } catch {
      // If XLSX read fails (e.g. raw CSV buffer), decode text
      const decodedText = decodeBufferToText(input);
      allRows = parseCSVTextToRows(decodedText);
    }
  }

  if (allRows.length === 0) {
    return {
      institutions: existingInstitutions,
      evaluators: existingEvaluators,
      matchedCount: 0,
      unmatchedCount: existingInstitutions.length,
      message: '데이터를 읽을 수 없거나 파일 내용이 비어 있습니다.',
      details: { totalInstitutions: existingInstitutions.length, totalEvaluators: existingEvaluators.length, matchedInstitutions: 0, confirmedDates: 0 }
    };
  }

  // Clone existing lists
  const institutions: Institution[] = existingInstitutions.map(inst => ({
    ...inst,
    assignedEvaluatorIds: [...inst.assignedEvaluatorIds],
    programs: [...inst.programs],
    activityFiles: [...(inst.activityFiles || [])]
  }));

  const evaluators: Evaluator[] = existingEvaluators.map(ev => ({
    ...ev,
    assignedInstitutionIds: [...ev.assignedInstitutionIds],
    availableDates: [...ev.availableDates],
    preferredRegions: [...ev.preferredRegions]
  }));

  // Find header row
  let headerRowIdx = -1;
  const colMap: Record<string, number> = {};

  for (let r = 0; r < Math.min(allRows.length, 15); r++) {
    const row = allRows[r];
    const joined = row.join(' ').toLowerCase();
    if (
      joined.includes('기관') ||
      joined.includes('시설') ||
      joined.includes('위원') ||
      joined.includes('평가') ||
      joined.includes('이름') ||
      joined.includes('성명') ||
      joined.includes('작가') ||
      joined.includes('접속키') ||
      joined.includes('아이디')
    ) {
      headerRowIdx = r;
      row.forEach((cell: any, cIdx: number) => {
        const str = cleanStr(cell).replace(/\s+/g, '');
        if (str) colMap[str] = cIdx;
      });
      break;
    }
  }

  if (headerRowIdx === -1) {
    headerRowIdx = 0;
    allRows[0].forEach((cell: any, cIdx: number) => {
      const str = cleanStr(cell).replace(/\s+/g, '');
      if (str) colMap[str] = cIdx;
    });
  }

  const findCol = (keywords: string[]): number => {
    for (const [key, cIdx] of Object.entries(colMap)) {
      for (const kw of keywords) {
        const cleanedKw = kw.replace(/\s+/g, '');
        if (key === cleanedKw || key.includes(cleanedKw)) return cIdx;
      }
    }
    return -1;
  };

  const instNameCol = findCol(['참여기관명', '기관명', '도서관명', '서점명', '문학관명', '시설명', '대상명(기관명/위원명)', '대상명', '기관', '시설']);
  const instCodeCol = findCol(['기관코드', '기관접속키', '고유코드', '로그인아이디(접속키)', '접속키', '코드', '아이디']);
  const evalNameCol = findCol(['배정전담평가위원', '담당평가위원', '평가위원', '담당위원', '위원명', '평가위원성명', '평가위원명', '위원', '배정위원']);
  const evalAffilCol = findCol(['평가위원소속/직함', '시설유형/소속', '소속/직함', '소속기관', '소속', '직함']);
  const evalPhoneCol = findCol(['평가위원연락처', '연락처(SMS발송용)', '평가위원전화', '위원연락처']);
  const evalKeyCol = findCol(['평가위원접속키', '위원접속키', '위원코드']);
  
  const regionCol = findCol(['권역', '권역/선호권역', '지역', '소재지', '시도']);
  const subRegionCol = findCol(['세부지역', '시군구', '구군']);
  const addressCol = findCol(['소재지주소', '주소', '도로명주소']);
  const typeCol = findCol(['시설유형', '유형', '구분', '종류']);
  
  const contactPersonCol = findCol(['기관담당자', '담당자', '담당자/직함']);
  const contactPhoneCol = findCol(['담당자연락처', '전화번호', '휴대폰', '연락처']);
  const contactEmailCol = findCol(['담당자이메일', '이메일(안내문발송용)', '이메일']);
  
  const writerNameCol = findCol(['상주작가성명', '상주작가/전문분야', '상주작가', '작가명', '작가', '문학인']);
  const writerGenreCol = findCol(['작가문학장르', '문학장르', '전문분야', '장르', '분야']);
  const writerWorkspaceCol = findCol(['상주작가집무실위치', '집무실위치', '집무실']);
  const parkingCol = findCol(['주차안내', '주차정보', '주차']);
  
  const dateCol = findCol(['확정방문일자', '실사방문일자', '방문일자', '방문일', '실사일', '일정', '방문예정일', '방문일시']);
  const timeCol = findCol(['확정방문시간', '실사방문시간', '방문시간', '시간']);
  const progTitleCol = findCol(['참관프로그램명', '프로그램명', '프로그램']);
  const progRoomCol = findCol(['프로그램진행장소', '진행장소', '강좌실', '장소']);
  const statusCol = findCol(['실사/조율상태', '예약상태', '진행상태', '상태']);
  const scoreCol = findCol(['현장평가점수', '평가점수', '점수']);
  const notesCol = findCol(['비고/특이사항', '비고', '특이사항', '메모']);

  let matchedCount = 0;
  let confirmedDates = 0;

  // Process data rows
  for (let r = headerRowIdx + 1; r < allRows.length; r++) {
    const row = allRows[r];
    if (!row || row.length === 0) continue;

    const rawInstName = instNameCol !== -1 ? cleanStr(row[instNameCol]) : '';
    const rawInstCode = instCodeCol !== -1 ? cleanStr(row[instCodeCol]) : '';
    const rawEvalName = evalNameCol !== -1 ? cleanStr(row[evalNameCol]) : '';

    // Check if row is purely an evaluator (e.g. from an account CSV where 구분='평가위원')
    const rawCategory = cleanStr(row[0]);
    const isPureEvaluatorRow = rawCategory.includes('평가위원') || (rawEvalName && !rawInstName);

    if (isPureEvaluatorRow) {
      const evalName = rawEvalName || rawInstName;
      if (evalName) {
        let evalObj = evaluators.find(e => e.name === evalName);
        const evalAffil = evalAffilCol !== -1 ? cleanStr(row[evalAffilCol]) : '';
        const evalPhone = evalPhoneCol !== -1 ? cleanStr(row[evalPhoneCol]) : '';
        const evalKey = evalKeyCol !== -1 ? cleanStr(row[evalKeyCol]) : '';
        const evalRegion = regionCol !== -1 ? cleanStr(row[regionCol]) : '';

        if (!evalObj) {
          const newIdx = evaluators.length + 1;
          const keyNum = String(newIdx).padStart(2, '0');
          evalObj = {
            id: `eval-${newIdx}`,
            accessKey: evalKey || `EVAL-${keyNum}`,
            code: `ARKO-EVAL-${keyNum}`,
            name: evalName,
            affiliation: evalAffil || '한국작가회의 / 문학평론',
            title: '평가위원',
            specialty: '소설',
            phone: evalPhone || `010-1234-${String(1000 + newIdx).slice(1)}`,
            email: `eval_${newIdx}@arko-eval.kr`,
            preferredRegions: evalRegion ? [evalRegion as Region] : ['서울', '경기'],
            availableDates: ['2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21', '2026-08-22', '2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28'],
            assignedInstitutionIds: [],
            avatarColor: 'bg-emerald-600',
          };
          evaluators.push(evalObj);
        } else {
          if (evalAffil) evalObj.affiliation = evalAffil;
          if (evalPhone) evalObj.phone = evalPhone;
          if (evalKey) evalObj.accessKey = evalKey;
        }
      }
      continue;
    }

    // Normal institution row
    if (!rawInstName && !rawInstCode) continue;

    // Find institution by name or code or access key
    let targetInst = institutions.find(i => 
      (rawInstCode && (i.code === rawInstCode || i.accessKey === rawInstCode || i.id === rawInstCode)) ||
      (rawInstName && (i.name === rawInstName || i.name.replace(/\s+/g, '') === rawInstName.replace(/\s+/g, '') || rawInstName.includes(i.name) || i.name.includes(rawInstName)))
    );

    const rawType = typeCol !== -1 ? cleanStr(row[typeCol]) : '';
    const rawRegion = regionCol !== -1 ? cleanStr(row[regionCol]) : '';
    const rawSubRegion = subRegionCol !== -1 ? cleanStr(row[subRegionCol]) : '';
    const rawAddress = addressCol !== -1 ? cleanStr(row[addressCol]) : '';
    const rawContactPerson = contactPersonCol !== -1 ? cleanStr(row[contactPersonCol]) : '';
    const rawContactPhone = contactPhoneCol !== -1 ? cleanStr(row[contactPhoneCol]) : '';
    const rawContactEmail = contactEmailCol !== -1 ? cleanStr(row[contactEmailCol]) : '';
    const rawWriter = writerNameCol !== -1 ? cleanStr(row[writerNameCol]) : '';
    const rawGenre = writerGenreCol !== -1 ? cleanStr(row[writerGenreCol]) : '';
    const rawWorkspace = writerWorkspaceCol !== -1 ? cleanStr(row[writerWorkspaceCol]) : '';
    const rawParking = parkingCol !== -1 ? cleanStr(row[parkingCol]) : '';
    const rawDate = dateCol !== -1 ? cleanStr(row[dateCol]) : '';
    const rawTime = timeCol !== -1 ? cleanStr(row[timeCol]) : '';
    const rawProgTitle = progTitleCol !== -1 ? cleanStr(row[progTitleCol]) : '';
    const rawProgRoom = progRoomCol !== -1 ? cleanStr(row[progRoomCol]) : '';
    const rawStatus = statusCol !== -1 ? cleanStr(row[statusCol]) : '';
    const rawNotes = notesCol !== -1 ? cleanStr(row[notesCol]) : '';

    let facilityType: FacilityType = '도서관';
    if (rawType.includes('문학') || (rawInstName && rawInstName.includes('문학관'))) facilityType = '문학관';
    else if (rawType.includes('서점') || rawType.includes('책방') || (rawInstName && (rawInstName.includes('서점') || rawInstName.includes('문고') || rawInstName.includes('서가')))) facilityType = '서점';

    if (!targetInst) {
      const newIdx = institutions.length + 1;
      const keyNum = String(newIdx).padStart(3, '0');
      targetInst = {
        id: `inst-${newIdx}`,
        accessKey: rawInstCode && rawInstCode.startsWith('INST-') ? rawInstCode : `INST-${keyNum}`,
        code: rawInstCode || `ARKO-INST-${keyNum}`,
        name: rawInstName || `참여기관 ${newIdx}`,
        type: facilityType,
        region: (rawRegion as Region) || '서울',
        subRegion: rawSubRegion || '시군구',
        address: rawAddress || `${rawRegion || '서울'} 소재지`,
        contactPerson: rawContactPerson || '상주작가 담당자',
        contactPhone: rawContactPhone || '',
        contactEmail: rawContactEmail || `contact_${newIdx}@arko-inst.kr`,
        writerName: rawWriter || '상주작가',
        writerGenre: (rawGenre as WriterGenre) || ('' as WriterGenre),
        writerBio: '지역 주민과 함께하는 창작 활동',
        writerWorkspace: rawWorkspace || '상주작가 집무실',
        parkingInfo: rawParking || '전용 주차장 완비',
        notes: rawNotes || '',
        programs: [
          {
            id: `prog-${newIdx}-1`,
            title: rawProgTitle || `${rawInstName || '상주작가'} 문학 특강`,
            writerName: rawWriter || '상주작가',
            genre: (rawGenre as WriterGenre) || ('' as WriterGenre),
            date: parseDateStr(rawDate) || '2026-08-19',
            startTime: parseTimeStr(rawTime),
            endTime: '16:00',
            locationRoom: rawProgRoom || '문화강좌실',
            targetAudience: '지역 주민 및 독자 30명',
            description: '주민과 함께하는 소통 문학 특강',
            maxParticipants: 30,
            currentParticipants: 20
          }
        ],
        assignedEvaluatorIds: [],
        evaluationStatus: 'pending' as EvaluationStatus,
        activityFiles: []
      };
      institutions.push(targetInst);
    } else {
      // Update fields if provided
      if (rawType) targetInst.type = facilityType;
      if (rawRegion) targetInst.region = rawRegion as Region;
      if (rawSubRegion) targetInst.subRegion = rawSubRegion;
      if (rawAddress) targetInst.address = rawAddress;
      if (rawContactPerson) targetInst.contactPerson = rawContactPerson;
      if (rawContactPhone) targetInst.contactPhone = rawContactPhone;
      if (rawContactEmail) targetInst.contactEmail = rawContactEmail;
      if (rawWriter) targetInst.writerName = rawWriter;
      if (rawGenre) targetInst.writerGenre = rawGenre as WriterGenre;
      if (rawWorkspace) targetInst.writerWorkspace = rawWorkspace;
      if (rawParking) targetInst.parkingInfo = rawParking;
      if (rawNotes) targetInst.notes = rawNotes;

      if (rawProgTitle) {
        if (targetInst.programs.length > 0) {
          targetInst.programs[0].title = rawProgTitle;
          if (rawProgRoom) targetInst.programs[0].locationRoom = rawProgRoom;
        } else {
          targetInst.programs.push({
            id: `prog-${targetInst.id}-1`,
            title: rawProgTitle,
            writerName: targetInst.writerName,
            genre: '' as WriterGenre,
            date: parseDateStr(rawDate) || '2026-08-19',
            startTime: parseTimeStr(rawTime),
            endTime: '16:00',
            locationRoom: rawProgRoom || '문화강좌실',
            targetAudience: '지역 주민 및 독자 30명',
            description: '상주작가 프로그램',
            maxParticipants: 30,
            currentParticipants: 20
          });
        }
      }
    }

    // Match Evaluator
    const evalName = rawEvalName.replace(/위원|교수|작가/g, '').trim();
    if (evalName && evalName !== '-' && evalName !== '미배정' && evalName !== '대기') {
      let evalObj = evaluators.find(e => 
        e.name === evalName || 
        e.name === rawEvalName || 
        e.name.includes(evalName) || 
        evalName.includes(e.name)
      );

      if (!evalObj) {
        const newIdx = evaluators.length + 1;
        const keyNum = String(newIdx).padStart(2, '0');
        const evalAffil = evalAffilCol !== -1 ? cleanStr(row[evalAffilCol]) : '';
        const evalPhone = evalPhoneCol !== -1 ? cleanStr(row[evalPhoneCol]) : '';
        evalObj = {
          id: `eval-${newIdx}`,
          accessKey: `EVAL-${keyNum}`,
          code: `ARKO-EVAL-${keyNum}`,
          name: evalName,
          affiliation: evalAffil || '한국문인협회',
          title: '현장평가위원',
          specialty: '소설',
          phone: evalPhone || `010-5678-${String(1000 + newIdx).slice(1)}`,
          email: `eval_${newIdx}@arko-eval.kr`,
          preferredRegions: [targetInst.region],
          availableDates: ['2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21', '2026-08-22', '2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28'],
          assignedInstitutionIds: [],
          avatarColor: 'bg-indigo-600',
        };
        evaluators.push(evalObj);
      }

      // Link institution and evaluator
      if (!targetInst.assignedEvaluatorIds.includes(evalObj.id)) {
        targetInst.assignedEvaluatorIds = [evalObj.id];
      }
      if (!evalObj.assignedInstitutionIds.includes(targetInst.id)) {
        evalObj.assignedInstitutionIds.push(targetInst.id);
      }

      // Handle Visit Date & Time
      const parsedDate = parseDateStr(rawDate);
      if (parsedDate) {
        targetInst.confirmedVisitDate = parsedDate;
        targetInst.confirmedVisitTime = parseTimeStr(rawTime);
        targetInst.evaluationStatus = 'confirmed';
        confirmedDates++;
      } else if (rawStatus.includes('확정') || rawStatus.includes('완료')) {
        targetInst.evaluationStatus = 'confirmed';
      } else {
        targetInst.evaluationStatus = 'proposing';
      }

      matchedCount++;
    }
  }

  // Ensure 2-way consistency
  evaluators.forEach(ev => {
    ev.assignedInstitutionIds = institutions
      .filter(inst => inst.assignedEvaluatorIds.includes(ev.id))
      .map(inst => inst.id);
  });

  const matchedInstitutions = institutions.filter(i => i.assignedEvaluatorIds.length > 0).length;

  return {
    institutions,
    evaluators,
    matchedCount,
    unmatchedCount: institutions.length - matchedInstitutions,
    message: `전체 ${institutions.length}개 기관 중 ${matchedInstitutions}개소 매칭(${confirmedDates}건 일정 확정), 평가위원 ${evaluators.length}명 연결을 완료하였습니다.`,
    details: {
      totalInstitutions: institutions.length,
      totalEvaluators: evaluators.length,
      matchedInstitutions,
      confirmedDates
    }
  };
}

export const parseMatchedExcelFile = parseMatchedExcelOrCSV;
