import React, { useState, useRef } from 'react';
import { Institution, Evaluator } from '../types';
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X, 
  FileSpreadsheet, 
  Check, 
  Copy,
  Layers,
  Calendar,
  UserCheck,
  Building2,
  Sparkles
} from 'lucide-react';
import { INITIAL_INSTITUTIONS, INITIAL_EVALUATORS } from '../data/mockData';
import { exportAccessKeysToCSV, exportMatchedScheduleToCSV } from '../utils/exportUtils';
import { parseMatchedExcelOrCSV, parseCSVTextToRows } from '../utils/excelImportUtils';

interface BatchDataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  institutions: Institution[];
  evaluators: Evaluator[];
  onUpdateInstitutions: (newInsts: Institution[]) => void;
  onUpdateEvaluators: (newEvals: Evaluator[]) => void;
  onShowToast: (msg: string) => void;
}

export function BatchDataImportModal({
  isOpen,
  onClose,
  institutions,
  evaluators,
  onUpdateInstitutions,
  onUpdateEvaluators,
  onShowToast,
}: BatchDataImportModalProps) {
  const [activeTab, setActiveTab] = useState<'file' | 'paste' | 'evaluators' | 'institutions'>('file');
  const [pastedCSVText, setPastedCSVText] = useState('');
  const [evaluatorText, setEvaluatorText] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewResult, setPreviewResult] = useState<{
    institutions: Institution[];
    evaluators: Evaluator[];
    matchedCount: number;
    unmatchedCount: number;
    message: string;
    sourceName: string;
    details: {
      totalInstitutions: number;
      totalEvaluators: number;
      matchedInstitutions: number;
      confirmedDates: number;
    };
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      setStatusMessage(null);

      const buffer = await file.arrayBuffer();
      const result = parseMatchedExcelOrCSV(buffer, institutions, evaluators);

      setPreviewResult({
        ...result,
        sourceName: file.name
      });
      setIsProcessing(false);
    } catch (err: any) {
      setIsProcessing(false);
      setStatusMessage({
        type: 'error',
        text: `파일 읽기 오류: ${err.message || '파일 형식을 확인해주세요.'}`
      });
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        handleFileUpload(file);
      } else {
        setStatusMessage({
          type: 'error',
          text: '엑셀(.xlsx, .xls) 또는 CSV(.csv) 파일만 지원합니다.'
        });
      }
    }
  };

  const handleParsePastedText = () => {
    if (!pastedCSVText.trim()) {
      setStatusMessage({ type: 'error', text: '붙여넣을 CSV 또는 엑셀 데이터를 입력창에 입력해주세요.' });
      return;
    }

    try {
      setIsProcessing(true);
      setStatusMessage(null);

      const result = parseMatchedExcelOrCSV(pastedCSVText, institutions, evaluators);
      setPreviewResult({
        ...result,
        sourceName: '직접 붙여넣은 CSV 데이터'
      });
      setIsProcessing(false);
      setStatusMessage({
        type: 'success',
        text: `✅ ${result.message}`
      });
    } catch (err: any) {
      setIsProcessing(false);
      setStatusMessage({
        type: 'error',
        text: `데이터 분석 오류: ${err.message}`
      });
    }
  };

  const handleApplyPreview = () => {
    if (!previewResult) return;
    onUpdateInstitutions(previewResult.institutions);
    onUpdateEvaluators(previewResult.evaluators);
    onShowToast(`🎉 [${previewResult.sourceName}] 데이터(${previewResult.details.matchedInstitutions}개 기관 매칭 완료)가 시스템에 정상 반영되었습니다!`);
    onClose();
  };

  const handleApplyEvaluators = () => {
    try {
      if (!evaluatorText.trim()) {
        setStatusMessage({ type: 'error', text: '평가위원 목록 텍스트를 입력해주세요.' });
        return;
      }

      // Parse CSV / Line-by-line format:
      const lines = evaluatorText.trim().split('\n').map((l) => l.trim()).filter(Boolean);
      const parsedEvals: Evaluator[] = [];

      lines.forEach((line, idx) => {
        if (idx === 0 && (line.includes('이름') || line.includes('성명') || line.includes('name'))) {
          return;
        }

        const parts = line.split(/[,\t|]/).map((p) => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 1 && parts[0]) {
          const num = parsedEvals.length + 1;
          const keyNum = String(num).padStart(2, '0');
          parsedEvals.push({
            id: `eval-${num}`,
            accessKey: `EVAL-${keyNum}`,
            code: `ARKO-EVAL-${keyNum}`,
            name: parts[0],
            affiliation: parts[1] || '문예창작과',
            title: parts[2] || '평가위원',
            specialty: (parts[3] as any) || '소설',
            phone: parts[4] || `010-1234-${String(1000 + num).slice(1)}`,
            email: parts[5] || `eval_${num}@arko-eval.kr`,
            preferredRegions: parts[6] ? (parts[6].split(/[\s/]/) as any) : ['서울', '경기'],
            availableDates: ['2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21', '2026-08-22', '2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28'],
            assignedInstitutionIds: [],
            avatarColor: 'bg-emerald-600',
          });
        }
      });

      if (parsedEvals.length > 0) {
        onUpdateEvaluators(parsedEvals);
        onShowToast(`${parsedEvals.length}인의 평가위원 데이터가 성공적으로 반영되었습니다.`);
        onClose();
      } else {
        setStatusMessage({ type: 'error', text: '유효한 평가위원 행을 찾을 수 없습니다.' });
      }
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: `오류 발생: ${e.message}` });
    }
  };

  const handleResetToStandard = () => {
    if (confirm('전달해주신 실제 96개 참여기관 및 12인 평가위원 배정 데이터로 초기화하시겠습니까?')) {
      onUpdateInstitutions(INITIAL_INSTITUTIONS);
      onUpdateEvaluators(INITIAL_EVALUATORS);
      onShowToast('실제 96개 기관 및 12인 평가위원 배정 데이터로 초기화되었습니다.');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0a192c]/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#142d4c] px-6 py-4 text-white flex items-center justify-between border-b border-[#234670]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#2563eb]/30 border border-blue-400/40 flex items-center justify-center text-[#cca43b] shadow-inner">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">평가위원 & 시설 매칭 CSV/엑셀 일괄 등록 센터</h3>
                <span className="bg-[#cca43b] text-[#142d4c] font-black text-[10px] px-2 py-0.5 rounded-full">
                  자동 매칭 엔진
                </span>
              </div>
              <p className="text-xs text-slate-300">
                보내주신 CSV/Excel 양식 데이터(기관명, 담당평가위원, 권역, 상주작가, 방문일정 등)를 즉시 인식하여 캘린더와 매칭을 동기화합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Metrics Subheader */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 font-medium text-slate-700 flex-wrap">
            <span className="text-slate-500 font-bold">현재 등록 현황:</span>
            <span className="font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-md flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              참여기관 {institutions.length}곳
            </span>
            <span className="font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              평가위원 {evaluators.length}명
            </span>
            <span className="font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              매칭 완료 {institutions.filter(i => i.assignedEvaluatorIds.length > 0).length}곳
            </span>
            <span className="font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              일정 확정 {institutions.filter(i => i.evaluationStatus === 'confirmed').length}건
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => exportMatchedScheduleToCSV(institutions, evaluators)}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-800 font-semibold rounded-lg shadow-2xs transition flex items-center space-x-1.5 cursor-pointer text-xs"
              title="현재 매칭 마스터 CSV 다운로드"
            >
              <Download className="w-3.5 h-3.5 text-[#2563eb]" />
              <span>양식 CSV 샘플 받기</span>
            </button>

            <button
              onClick={handleResetToStandard}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition flex items-center space-x-1.5 cursor-pointer text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>기본 96곳/12인 초기화</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white text-xs sm:text-sm font-medium">
          <button
            onClick={() => { setActiveTab('file'); setStatusMessage(null); }}
            className={`flex-1 py-3 text-center border-b-2 transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'file'
                ? 'border-[#2563eb] text-[#2563eb] font-bold bg-blue-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4 text-[#cca43b]" />
            <span>1. 엑셀/CSV 파일 업로드</span>
          </button>
          <button
            onClick={() => { setActiveTab('paste'); setStatusMessage(null); }}
            className={`flex-1 py-3 text-center border-b-2 transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'paste'
                ? 'border-[#2563eb] text-[#2563eb] font-bold bg-blue-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Copy className="w-4 h-4 text-[#2563eb]" />
            <span>2. CSV / 엑셀 텍스트 붙여넣기 (Ctrl+V)</span>
          </button>
          <button
            onClick={() => { setActiveTab('evaluators'); setStatusMessage(null); }}
            className={`flex-1 py-3 text-center border-b-2 transition cursor-pointer ${
              activeTab === 'evaluators'
                ? 'border-[#2563eb] text-[#2563eb] font-bold bg-blue-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            3. 평가위원 명단 직접 입력
          </button>
          <button
            onClick={() => { setActiveTab('institutions'); setStatusMessage(null); }}
            className={`flex-1 py-3 text-center border-b-2 transition cursor-pointer ${
              activeTab === 'institutions'
                ? 'border-[#2563eb] text-[#2563eb] font-bold bg-blue-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            4. 현재 매칭 대장 ({institutions.length}곳)
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Tab 1: File Upload */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx, .xls, .csv, .txt"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {/* Drag & Drop Box */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/30 hover:bg-blue-50/60 rounded-2xl p-8 text-center transition cursor-pointer flex flex-col items-center justify-center space-y-3"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#142d4c] text-white flex items-center justify-center shadow-lg shadow-blue-900/30 border border-[#2b5180]">
                  <FileSpreadsheet className="w-8 h-8 text-[#cca43b]" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-base">
                    엑셀(.xlsx, .xls) 또는 CSV(.csv) 파일을 여기에 드래그하거나 클릭하여 업로드하세요
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    CP949(EUC-KR) 및 UTF-8 인코딩을 자동 감지하며, <b>참여기관명, 배정 전담 평가위원, 권역, 상주작가, 방문일자</b> 열을 자동으로 인식하여 매칭합니다.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-blue-300 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-50">
                  <Upload className="w-4 h-4" />
                  <span>내 컴퓨터에서 파일 선택하기</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Text Paste (Ctrl+V) */}
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 text-xs text-blue-950 space-y-1">
                <p className="font-bold flex items-center space-x-1">
                  <FileText className="w-4 h-4 text-blue-700" />
                  <span>엑셀에서 표 복사 후 붙여넣기 가이드</span>
                </p>
                <p>
                  엑셀(Excel) 프로그램에서 헤더를 포함한 데이터 영역을 드래그하여 <code>Ctrl + C</code> 복사하신 후, 아래 입력창에 <code>Ctrl + V</code>로 붙여넣고 <b>[데이터 분석 및 매칭 미리보기]</b> 버튼을 눌러주세요.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  CSV 또는 엑셀 복사 데이터 입력창
                </label>
                <textarea
                  rows={8}
                  value={pastedCSVText}
                  onChange={(e) => setPastedCSVText(e.target.value)}
                  placeholder={`참여기관명,시설유형,권역,세부지역,상주작가 성명,배정 전담 평가위원,확정 방문일자,확정 방문시간\n아르코문학관,문학관,서울,종로구,김상주,김문학,2026-08-19,14:00\n평창도서관,도서관,강원,평창군,박작가,송아동,2026-08-20,15:00\n...`}
                  className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleParsePastedText}
                  disabled={isProcessing}
                  className="px-5 py-2.5 bg-[#142d4c] hover:bg-[#1f3f66] text-white font-bold rounded-xl text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#cca43b]" />
                  <span>데이터 분석 및 매칭 미리보기</span>
                </button>
              </div>
            </div>
          )}

          {/* Status Message Notification */}
          {statusMessage && (
            <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
              statusMessage.type === 'error' ? 'bg-rose-50 border border-rose-200 text-rose-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            }`}>
              {statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Preview Result Card */}
          {previewResult && (
            <div className="bg-slate-50 rounded-2xl p-5 border-2 border-blue-400 space-y-4 shadow-sm animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span>{previewResult.sourceName} 분석 결과</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[11px] px-2 py-0.5 rounded-full font-bold">
                        매칭 준비 완료
                      </span>
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">{previewResult.message}</p>
                  </div>
                </div>

                <button
                  onClick={handleApplyPreview}
                  className="px-6 py-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer shrink-0"
                >
                  <Check className="w-4 h-4 text-[#cca43b]" />
                  <span>시스템에 지금 즉시 적용하기</span>
                </button>
              </div>

              {/* Metric Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-slate-500 text-[11px] font-medium">인식된 총 기관 수</div>
                  <div className="font-black text-slate-900 text-base mt-0.5">{previewResult.details.totalInstitutions}개소</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-slate-500 text-[11px] font-medium">인식된 평가위원</div>
                  <div className="font-black text-indigo-700 text-base mt-0.5">{previewResult.details.totalEvaluators}명</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-2xs">
                  <div className="text-emerald-700 text-[11px] font-medium">평가위원 배정 기관</div>
                  <div className="font-black text-emerald-700 text-base mt-0.5">{previewResult.details.matchedInstitutions}개소</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-blue-200 bg-blue-50/40 shadow-2xs">
                  <div className="text-blue-700 text-[11px] font-medium">방문일정 확정 건수</div>
                  <div className="font-black text-blue-700 text-base mt-0.5">{previewResult.details.confirmedDates}건</div>
                </div>
              </div>

              {/* Top 5 Samples Preview Table */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                  <span>미리보기 샘플 (상위 5건)</span>
                  <span className="text-[11px] text-slate-500">전체 {previewResult.institutions.length}건 중</span>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="p-2">기관명</th>
                        <th className="p-2">권역</th>
                        <th className="p-2">상주작가</th>
                        <th className="p-2">담당 평가위원</th>
                        <th className="p-2">방문일시</th>
                        <th className="p-2">상태</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {previewResult.institutions.slice(0, 5).map(inst => {
                        const assignedEval = previewResult.evaluators.find(e => inst.assignedEvaluatorIds.includes(e.id));
                        return (
                          <tr key={inst.id} className="hover:bg-slate-50">
                            <td className="p-2 font-bold text-slate-900">{inst.name}</td>
                            <td className="p-2 text-slate-600">{inst.region} {inst.subRegion}</td>
                            <td className="p-2 text-slate-800 font-medium">{inst.writerName}</td>
                            <td className="p-2 font-bold text-indigo-700">
                              {assignedEval ? `${assignedEval.name} 위원` : <span className="text-slate-400 font-normal">미배정</span>}
                            </td>
                            <td className="p-2 text-slate-700 font-mono">
                              {inst.confirmedVisitDate ? `${inst.confirmedVisitDate} ${inst.confirmedVisitTime || '14:00'}` : '-'}
                            </td>
                            <td className="p-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                inst.evaluationStatus === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {inst.evaluationStatus === 'confirmed' ? '방문확정' : '조율중'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Evaluator text input */}
          {activeTab === 'evaluators' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <p className="font-bold flex items-center space-x-1">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>12명의 평가위원 명단 직접 등록</span>
                </p>
                <p>
                  이름, 소속, 직함, 전문분야(소설/시/수필/아동/희곡/평론), 전화번호, 이메일, 선호권역 정보를 줄바꿈으로 입력하시면 평가위원 계정과 접속키가 자동 생성됩니다.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  평가위원 리스트 텍스트
                </label>
                <textarea
                  rows={8}
                  value={evaluatorText}
                  onChange={(e) => setEvaluatorText(e.target.value)}
                  placeholder={`가상 평가위원 01, 가상 연구모임 01, 위원, 시, , evaluator01@example.invalid, 서울/경기\n가상 평가위원 02, 가상 연구모임 02, 위원, 소설, , evaluator02@example.invalid, 서울/충청`}
                  className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleApplyEvaluators}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>입력한 평가위원 명단 반영하기</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 4: Current Match Table */}
          {activeTab === 'institutions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>전국 8개 권역 {institutions.length}개 참여기관의 평가위원 매칭 현황입니다.</span>
                <span className="font-bold text-slate-900 font-mono">총 {institutions.length}개소</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[380px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">접속키</th>
                      <th className="p-2.5">기관명</th>
                      <th className="p-2.5">유형</th>
                      <th className="p-2.5">권역</th>
                      <th className="p-2.5">담당 평가위원</th>
                      <th className="p-2.5">상주작가</th>
                      <th className="p-2.5">방문일정</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {institutions.map((inst) => {
                      const matchedEval = evaluators.find(e => inst.assignedEvaluatorIds.includes(e.id));
                      return (
                        <tr key={inst.id} className="hover:bg-slate-50">
                          <td className="p-2 font-bold text-blue-700 bg-blue-50/50">{inst.accessKey}</td>
                          <td className="p-2 font-sans font-semibold text-slate-900">{inst.name}</td>
                          <td className="p-2 font-sans text-slate-600">{inst.type}</td>
                          <td className="p-2 font-sans text-slate-600">{inst.region} {inst.subRegion}</td>
                          <td className="p-2 font-sans font-bold text-indigo-700">
                            {matchedEval ? `${matchedEval.name} 위원` : <span className="text-slate-400 font-normal">미배정</span>}
                          </td>
                          <td className="p-2 font-sans font-medium text-slate-800">{inst.writerName}</td>
                          <td className="p-2 font-sans text-slate-600">
                            {inst.confirmedVisitDate ? `${inst.confirmedVisitDate} ${inst.confirmedVisitTime || '14:00'}` : '일정 조율 중'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>한국문화예술위원회(ARKO) 상주작가 현장평가 종합 운영본부</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
