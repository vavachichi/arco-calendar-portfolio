import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  HelpCircle, 
  Table, 
  CalendarCheck,
  FileText
} from 'lucide-react';
import { Institution, ProgramSchedule } from '../types';

interface ExcelBatchProgramImportProps {
  institutions: Institution[];
  onUpdateInstitutions: (newInsts: Institution[]) => void;
  onShowToast: (msg: string) => void;
}

export const ExcelBatchProgramImport: React.FC<ExcelBatchProgramImportProps> = ({
  institutions,
  onUpdateInstitutions,
  onShowToast,
}) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [showSample, setShowSample] = useState(false);

  // Download Excel/CSV sample template
  const handleDownloadTemplate = () => {
    const headers = '기관코드,기관명,상주작가명,프로그램1_명칭,프로그램1_일자,프로그램1_시간,프로그램1_장소,프로그램2_명칭,프로그램2_일자,프로그램2_시간,프로그램2_장소,프로그램3_명칭,프로그램3_일자,프로그램3_시간,프로그램3_장소';
    
    const sampleRows = institutions.slice(0, 10).map((inst, idx) => {
      const p1 = inst.programs[0] || { title: '작가와 함께하는 주민 문학 워크숍', date: '2026-08-19', startTime: '14:00', endTime: '16:00', locationRoom: '1층 다목적실' };
      const p2 = inst.programs[1] || { title: '문학 창작 릴레이 및 낭독회', date: '2026-08-21', startTime: '15:00', endTime: '17:00', locationRoom: '세미나실' };
      const p3 = inst.programs[2] || { title: '어린이·청소년 스토리텔링 교실', date: '2026-08-26', startTime: '10:30', endTime: '12:30', locationRoom: '문화사랑방' };
      
      return `${inst.accessKey},${inst.name},${inst.writerName},${p1.title},${p1.date},${p1.startTime}~${p1.endTime},${p1.locationRoom},${p2.title},${p2.date},${p2.startTime}~${p2.endTime},${p2.locationRoom},${p3.title},${p3.date},${p3.startTime}~${p3.endTime},${p3.locationRoom}`;
    });

    const csvContent = '\uFEFF' + [headers, ...sampleRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', '96개기관_상주작가_프로그램일정_표준양식.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast('📥 96개 기관 프로그램 일정 표준 엑셀/CSV 서식이 다운로드되었습니다.');
  };

  // Handle File Upload (.csv or .txt)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setInputText(text);
        onShowToast(`📄 '${file.name}' 파일을 성공적으로 불러왔습니다. [캘린더 일괄 등록] 버튼을 눌러주세요.`);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  // Parse and Apply Batch Program Upload
  const handleApplyBatchPrograms = () => {
    if (!inputText.trim()) {
      onShowToast('엑셀 데이터 또는 CSV 텍스트를 입력하거나 파일을 첨부해주세요.');
      return;
    }

    setIsProcessing(true);
    try {
      const lines = inputText.trim().split('\n').map(l => l.trim()).filter(Boolean);
      let updatedCount = 0;
      let totalProgramsAdded = 0;

      const instMap = new Map<string, Institution>();
      institutions.forEach(i => {
        instMap.set(i.accessKey.toUpperCase(), { ...i, programs: [...i.programs] });
        instMap.set(i.name.trim(), { ...i, programs: [...i.programs] });
      });

      lines.forEach((line, lineIdx) => {
        // Skip header
        if (lineIdx === 0 && (line.includes('기관코드') || line.includes('기관명') || line.includes('프로그램'))) {
          return;
        }

        const parts = line.split(/[,\t|]/).map(p => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length < 2) return;

        const codeOrName = parts[0];
        const secondCol = parts[1];

        // Find institution by key or name
        let target = instMap.get(codeOrName.toUpperCase()) || instMap.get(secondCol);
        if (!target) {
          // fuzzy search
          const found = Array.from(instMap.values()).find(
            inst => inst.name.includes(codeOrName) || (secondCol && inst.name.includes(secondCol))
          );
          if (found) target = found;
        }

        if (target) {
          const newPrograms: ProgramSchedule[] = [];
          
          // Format 1: Multi-column wide format (code, name, writer, title1, date1, time1, loc1, title2, ...)
          if (parts.length >= 7) {
            for (let i = 3; i < parts.length; i += 4) {
              const title = parts[i];
              const date = parts[i + 1];
              const timeStr = parts[i + 2] || '14:00~16:00';
              const loc = parts[i + 3] || '프로그램실';

              if (title && date && date.includes('-')) {
                const [start, end] = timeStr.includes('~') ? timeStr.split('~') : [timeStr, '16:00'];
                newPrograms.push({
                  id: `prog-${target.id}-${newPrograms.length + 1}-${Date.now().toString(36)}`,
                  title: title,
                  writerName: target.writerName,
                  genre: target.writerGenre,
                  targetAudience: '지역 주민 및 문학 동호회원',
                  description: `${target.writerName} 작가 진행 프로그램`,
                  date: date.trim(),
                  startTime: start.trim(),
                  endTime: end ? end.trim() : '16:00',
                  locationRoom: loc.trim(),
                  maxParticipants: 20,
                  currentParticipants: 15,
                });
              }
            }
          } 
          // Format 2: Single row per program (code/name, title, date, start, end, loc)
          else if (parts.length >= 3) {
            const title = parts[1] || `${target.writerName} 작가 문학 프로그램`;
            const date = parts[2] || '2026-08-20';
            const startTime = parts[3] || '14:00';
            const endTime = parts[4] || '16:00';
            const loc = parts[5] || '도서관 배움터';

            if (date.includes('-')) {
              newPrograms.push({
                id: `prog-${target.id}-${Date.now().toString(36)}`,
                title,
                writerName: target.writerName,
                genre: target.writerGenre,
                targetAudience: '지역 주민',
                description: `${target.writerName} 작가 진행 프로그램`,
                date: date.trim(),
                startTime: startTime.trim(),
                endTime: endTime.trim(),
                locationRoom: loc.trim(),
                maxParticipants: 20,
                currentParticipants: 15,
              });
            }
          }

          if (newPrograms.length > 0) {
            // Replace or merge programs
            target.programs = newPrograms;
            instMap.set(target.id, target);
            updatedCount++;
            totalProgramsAdded += newPrograms.length;
          }
        }
      });

      if (updatedCount > 0) {
        const finalInstList = institutions.map(i => instMap.get(i.id) || i);
        onUpdateInstitutions(finalInstList);
        onShowToast(`🎉 엑셀 분석 완료: 총 ${updatedCount}개 기관의 프로그램 ${totalProgramsAdded}건이 캘린더에 자동 분류 등록되었습니다!`);
        setInputText('');
      } else {
        onShowToast('⚠️ 일치하는 기관을 찾지 못했습니다. 서식(기관코드, 기관명, 프로그램명, 일자)을 확인해주세요.');
      }
    } catch (err: any) {
      onShowToast(`오류 발생: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick autofill sample data for 96 institutions
  const handleLoadStandardPrograms = () => {
    let count = 0;
    const updated = institutions.map((inst, idx) => {
      count++;
      // Standard 3 programs for each institution in August 2026
      const baseDay1 = 18 + (idx % 8);
      const baseDay2 = 20 + ((idx + 2) % 8);
      const baseDay3 = 25 + ((idx + 4) % 6);

      const d1 = `2026-08-${String(baseDay1).padStart(2, '0')}`;
      const d2 = `2026-08-${String(baseDay2).padStart(2, '0')}`;
      const d3 = `2026-08-${String(baseDay3).padStart(2, '0')}`;

      const prog1: ProgramSchedule = {
        id: `prog-${inst.id}-1`,
        title: `${inst.writerName} 작가와 함께하는 주민 문학창작 살롱`,
        writerName: inst.writerName,
        genre: inst.writerGenre,
        date: d1,
        startTime: '14:00',
        endTime: '16:00',
        targetAudience: '성인 지역주민 및 문학 애호가',
        maxParticipants: 20,
        currentParticipants: 15,
        description: '상주작가 집필 공간 소개 및 주민 단편 창작 지도',
        locationRoom: '1층 커뮤니티실',
      };

      const prog2: ProgramSchedule = {
        id: `prog-${inst.id}-2`,
        title: `여름밤 문학 낭독회 & 릴레이 필사 워크숍`,
        writerName: inst.writerName,
        genre: inst.writerGenre,
        date: d2,
        startTime: '15:30',
        endTime: '17:30',
        targetAudience: '청소년 및 일반 주민',
        maxParticipants: 25,
        currentParticipants: 20,
        description: '참여 주민들의 자작시·수필 낭독 및 작가 강평',
        locationRoom: '문학사랑방',
      };

      const prog3: ProgramSchedule = {
        id: `prog-${inst.id}-3`,
        title: `어린이·청소년 스토리텔링 및 상주작가 북토크`,
        writerName: inst.writerName,
        genre: inst.writerGenre,
        date: d3,
        startTime: '10:30',
        endTime: '12:30',
        targetAudience: '어린이 및 학부모',
        maxParticipants: 18,
        currentParticipants: 16,
        description: '작가의 책 읽어주기 및 독서 감상문 쓰기',
        locationRoom: '세미나실',
      };

      return {
        ...inst,
        programs: [prog1, prog2, prog3],
      };
    });

    onUpdateInstitutions(updated);
    onShowToast(`✅ 96개 전체 기관에 각각 3개씩(총 ${count * 3}개) 표준 프로그램 일정이 캘린더에 즉시 분류 등록되었습니다!`);
  };

  return (
    <div className="bg-white rounded-2xl border border-amber-300 shadow-xs p-5 space-y-4">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900">
                96개 기관 프로그램 일정 엑셀(CSV) 일괄 업로드 & 캘린더 자동 분류등록
              </h3>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                핵심 기능
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              엑셀에서 96개 기관의 작가 프로그램 일정을 복사하여 붙여넣거나 파일을 올리면, 기관별로 3개씩 캘린더에 자동 분류 등록됩니다.
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 transition flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>표준 엑셀 서식 다운로드 (.csv)</span>
          </button>

          <button
            onClick={handleLoadStandardPrograms}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
            title="96개 전 기관에 3개씩 기본 프로그램을 자동 생성해 채웁니다"
          >
            <RefreshCw className="w-4 h-4" />
            <span>96개관 3개 일정 자동 채우기</span>
          </button>
        </div>
      </div>

      {/* Upload & Paste Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Input Textarea */}
        <div className="lg:col-span-8 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>엑셀 데이터 붙여넣기 (Ctrl + V) 또는 파일 업로드</span>
            </label>
            <label className="cursor-pointer text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-300 transition inline-flex items-center gap-1">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV/엑셀 파일 선택</span>
              <input
                type="file"
                accept=".csv,.txt,.tsv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`[엑셀 복사-붙여넣기 예시]\n기관코드,기관명,상주작가명,프로그램1_명,일자,시간,장소,프로그램2_명,일자,시간,장소,프로그램3_명,일자,시간,장소\nLIB-001,종로구립박노수문학관,이문열,단편소설 창작,2026-08-19,14:00~16:00,1층,주민 낭독회,2026-08-21,15:00~17:00,강당,북토크,2026-08-26,10:30~12:30,세미나실\nLIB-002,마포서점,한강,시 창작교실,2026-08-18,14:00~16:00,2층,...`}
            rows={5}
            className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden leading-relaxed"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500">
              * 콤마(,), 탭(Tab), 파이프(|) 구분자를 모두 지원합니다.
            </span>

            <button
              onClick={handleApplyBatchPrograms}
              disabled={isProcessing || !inputText.trim()}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
            >
              <CalendarCheck className="w-4 h-4 text-emerald-400" />
              <span>캘린더에 일괄 분류 등록하기</span>
            </button>
          </div>
        </div>

        {/* Right: Quick Guide */}
        <div className="lg:col-span-4 bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 flex flex-col justify-between text-xs">
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>등록 가이드</span>
            </h4>
            <ul className="text-slate-600 space-y-1.5 list-disc list-inside leading-relaxed text-[11px]">
              <li><strong>상주작가 프로그램 일정</strong>: 상주작가가 운영하는 문학 프로그램 일정을 엑셀로 한 번에 등록합니다.</li>
              <li><strong>평가위원 캘린더 자동 연동</strong>: 등록 즉시 해당 기관을 전담하는 평가위원의 캘린더에 일정이 노출됩니다.</li>
              <li><strong>원클릭 예약 연계</strong>: 평가위원이 일정 중 1가지를 클릭하여 손쉽게 실사 일정을 예약하게 됩니다.</li>
            </ul>
          </div>

          <div className="bg-emerald-50 rounded-lg p-2.5 border border-emerald-200 text-emerald-900 font-medium text-[11px] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>현재 96개 기관 중 <strong>{institutions.filter(i => i.programs.length > 0).length}개관</strong> 등록 완료</span>
          </div>
        </div>
      </div>
    </div>
  );
};
