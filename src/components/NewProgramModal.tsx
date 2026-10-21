import React, { useState } from 'react';
import { X, Plus, Calendar, Clock, BookOpen, Users, MapPin } from 'lucide-react';
import { Institution, ProgramSchedule, WriterGenre } from '../types';

interface NewProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  institutions: Institution[];
  initialInstitutionId?: string;
  onAddProgram: (institutionId: string, program: ProgramSchedule) => void;
}

export const NewProgramModal: React.FC<NewProgramModalProps> = ({
  isOpen,
  onClose,
  institutions,
  initialInstitutionId,
  onAddProgram,
}) => {
  const [selectedInstId, setSelectedInstId] = useState<string>(
    initialInstitutionId || institutions[0]?.id || ''
  );
  const [title, setTitle] = useState<string>('');
  const [date, setDate] = useState<string>('2026-08-26');
  const [startTime, setStartTime] = useState<string>('14:00');
  const [endTime, setEndTime] = useState<string>('16:00');
  const [targetAudience, setTargetAudience] = useState<string>('지역 성인 주민 15명');
  const [description, setDescription] = useState<string>('');
  const [locationRoom, setLocationRoom] = useState<string>('도서관 2층 배움터');
  const [maxParticipants, setMaxParticipants] = useState<number>(15);

  if (!isOpen) return null;

  const targetInst = institutions.find((i) => i.id === selectedInstId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newProg: ProgramSchedule = {
      id: `prog-custom-${Date.now()}`,
      title: title.trim(),
      writerName: targetInst?.writerName || '상주작가',
      genre: '' as WriterGenre,
      targetAudience: targetAudience.trim(),
      description: description.trim() || `${targetInst?.writerName} 작가와 함께하는 문학 창작 프로그램`,
      date,
      startTime,
      endTime,
      locationRoom: locationRoom.trim(),
      maxParticipants: Number(maxParticipants) || 15,
      currentParticipants: Math.floor(Number(maxParticipants) * 0.9),
      materialsPrepared: true,
    };

    onAddProgram(selectedInstId, newProg);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">상주작가 프로그램 등록</h2>
              <p className="text-xs text-slate-400">평가위원이 참관할 수 있는 도서관/문학관/서점 프로그램 일정 추가</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Target Facility */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              개설 기관 선택
            </label>
            <select
              value={selectedInstId}
              onChange={(e) => setSelectedInstId(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 font-medium text-slate-800 text-xs bg-white focus:ring-2 focus:ring-emerald-500"
            >
              {institutions.map((i) => (
                <option key={i.id} value={i.id}>
                  [{i.region}] {i.name} (상주작가: {i.writerName})
                </option>
              ))}
            </select>
          </div>

          {/* Program Title */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              프로그램명 *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 목요일 밤의 단편소설 창작살롱, 어린이 그림책 탐험대"
              className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                진행 일자 *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                시작 시간 *
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                종료 시간 *
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>

          {/* Location & Participants */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                진행 장소/강의실
              </label>
              <input
                type="text"
                value={locationRoom}
                onChange={(e) => setLocationRoom(e.target.value)}
                placeholder="예: 3층 문화교실, 서점 중앙 테이블"
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                모집 정원 (명)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              참여 대상
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="예: 관내 중·고등학생 15명, 지역 성인 주민 12명"
              className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              프로그램 주요 내용 및 구성
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="프로그램의 세부 진행 내용, 합평/워크숍/낭독 등 운영 형태 작성"
              className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs"
            >
              프로그램 등록 완료
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
