export type FacilityType = '도서관' | '문학관' | '서점';
export type Region = '서울' | '경기' | '인천' | '강원' | '충청' | '전라' | '경상' | '제주';
export type EvaluationStatus = 'pending' | 'proposing' | 'confirmed' | 'completed';
export type UserRole = 'admin' | 'evaluator' | 'institution';
export type WriterGenre = '시' | '소설' | '수필' | '아동/청소년문학' | '희곡/시나리오' | '평론';

export interface ActivityFile {
  id: string;
  name: string;
  size: string; // e.g. '1.8 MB'
  type: 'hwp' | 'xlsx' | 'docx' | 'pdf';
  uploadedAt: string; // e.g. '2026-08-10'
  description: string; // e.g. '상주작가 1분기 주민 문학프로그램 운영 실적 보고서'
  downloadUrl?: string;
}

export interface ProgramSchedule {
  id: string;
  title: string;
  writerName: string;
  genre: WriterGenre;
  targetAudience: string;
  description: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (e.g., '14:00')
  endTime: string; // HH:mm (e.g., '16:00')
  locationRoom: string;
  maxParticipants: number;
  currentParticipants: number;
  sessionNumber?: number;
  totalSessions?: number;
  materialsPrepared?: boolean;
}

export interface Institution {
  id: string;
  accessKey: string; // Login Key (e.g., 'INST-001' ~ 'INST-096')
  password?: string; // Login Password (e.g., contact phone last 4 digits or custom PIN)
  code?: string; // e.g. 'ARKO-INST-001'
  name: string;
  type: FacilityType;
  region: Region;
  subRegion: string; // e.g. '서울 마포구', '경기 수원시'
  address: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  writerName: string;
  writerGenre: WriterGenre;
  writerBio: string;
  writerWorkspace: string; // e.g. '본관 3층 상주작가 집무실'
  programs: ProgramSchedule[];
  evaluationStatus: EvaluationStatus;
  assignedEvaluatorIds: string[]; // Typically 1 evaluator (8 institutions per evaluator for 12 evaluators = 96 institutions)
  confirmedVisitDate?: string; // YYYY-MM-DD
  confirmedVisitTime?: string; // HH:mm
  confirmedProgramId?: string;
  preferredDays?: string[]; // e.g. ['화', '목', '토']
  parkingInfo?: string;
  notes?: string;
  activityFiles?: ActivityFile[]; // Uploaded performance/activity documents (한글 HWP, 엑셀 XLSX, PDF 등)
}

export interface Evaluator {
  id: string;
  accessKey: string; // Login Key (e.g., 'EVAL-01' ~ 'EVAL-12')
  password?: string; // Login Password
  code?: string;
  name: string;
  residence?: string; // e.g. '대구', '서울', '대전', '인천', '경기', '전남', '경남'
  jurisdictionSummary?: string; // e.g. '서울(6), 전남(1), 제주(1)'
  affiliation?: string;
  title?: string;
  specialty?: string;
  phone?: string;
  email?: string;
  preferredRegions?: Region[];
  availableDates?: string[]; // YYYY-MM-DD array
  assignedInstitutionIds: string[]; // Exactly 8 institutions per evaluator
  avatarColor: string;
}

export interface EvaluationRecord {
  id: string;
  institutionId: string;
  evaluatorId: string;
  evaluatorName: string;
  visitDate: string;
  visitTime: string;
  programId: string;
  scores: {
    creationEnvironment: number; // 1-25 (창작 및 상주 환경)
    programOperation: number; // 1-35 (주민 프로그램 운영 수준)
    institutionSupport: number; // 1-20 (기관 협조 및 행정지원)
    communityImpact: number; // 1-20 (지역사회 기여 및 호응도)
  };
  totalScore: number;
  writerInterviewSummary: string;
  managerInterviewSummary: string;
  generalImpression: string;
  recommendations: string;
  photos: string[];
  submittedAt: string;
}

export interface CoordinationProposal {
  id: string;
  institutionId: string;
  evaluatorId: string;
  programId: string;
  proposedDate: string;
  proposedTime: string;
  senderRole: UserRole;
  senderName: string;
  status: 'pending' | 'accepted' | 'rejected' | 'modified';
  message: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  type: 'program' | 'visit_confirmed' | 'visit_pending' | 'evaluator_available';
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  institutionId: string;
  institutionName: string;
  writerName: string;
  evaluatorNames?: string[];
  status?: EvaluationStatus;
  color?: string;
  programDetails?: ProgramSchedule;
}
