import type { Express } from 'express';
import { INITIAL_INSTITUTIONS, INITIAL_EVALUATORS } from './src/data/mockData';
// Preserve contracts. Ignore request bodies; no external client or provider credentials.
export function registerPortfolioApi(app:Express){
 app.get('/api/health',(_req,res)=>res.json({status:'ok',mode:'synthetic-examples-no-external-api'}));
 app.post('/api/ai/schedule-optimize',(_req,res)=>{const i=INITIAL_INSTITUTIONS[3],p=i.programs[0];res.json({demo:true,recommendedMatches:[{institutionId:i.id,evaluatorIds:[INITIAL_EVALUATORS[0].id],visitDate:p.date,visitTime:p.startTime,programTitle:p.title,rationale:'합성 예시 응답 · Gemini 미호출'}],conflictWarnings:['실제 최적화 결과가 아닌 합성 예시입니다.'],routingTips:'합성 예시: 실제 주소나 이동 경로는 사용하지 않습니다.',summary:'포트폴리오용 합성 예시 응답입니다. 기존 Gemini UI와 적용 흐름을 보존하며 외부 AI API에 연결하지 않습니다.'});});
 app.post('/api/ai/generate-checklist',(_req,res)=>res.json({demo:true,programObservation:['합성 예시: 운영 준비 확인','합성 예시: 프로그램 진행 관찰','합성 예시: 안내 동선 확인'],residentWorkspace:['합성 예시: 창작 공간 확인','합성 예시: 접근 동선 확인'],writerInterview:['합성 질문: 준비 과정은 어땠나요?','합성 질문: 창작 공간은 어떤가요?','합성 질문: 다음 개선점은 무엇인가요?'],managerInterview:['합성 질문: 필요한 지원은 무엇인가요?','합성 질문: 안내는 어떻게 하나요?'],keyNotice:['Gemini 미호출 · 고정 합성 응답','실제 평가 기준 아님']}));
 app.post('/api/ai/generate-notice',(_req,res)=>res.json({demo:true,officialTitle:'[합성 예시] 가상 프로그램 방문 안내',officialBody:'포트폴리오용 합성 예시입니다. 가상 도서관 001의 가상 문학 프로그램 방문 조율 화면을 확인합니다. 실제 발송이나 Gemini 호출은 하지 않았습니다.',mobileMessage:'[합성 예시] 가상 기관 방문 안내입니다. 실제 발송 없이 초안 확인 흐름만 제공합니다.',requiredPreparation:['가상 프로그램 정보','합성 자료 목록','가상 일정']}));
}
