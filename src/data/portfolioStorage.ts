import { INITIAL_INSTITUTIONS, INITIAL_EVALUATORS, INITIAL_PROPOSALS, INITIAL_EVALUATION_RECORDS } from './mockData';
export const PORTFOLIO_STORAGE_PREFIX='arco_portfolio_synthetic_v1_';
const seeds={institutions:INITIAL_INSTITUTIONS,evaluators:INITIAL_EVALUATORS,proposals:INITIAL_PROPOSALS,records:INITIAL_EVALUATION_RECORDS};
export function loadPortfolioData<K extends keyof typeof seeds>(key:K):typeof seeds[K]{
 const fallback=()=>structuredClone(seeds[key]);
 try{const raw=localStorage.getItem(PORTFOLIO_STORAGE_PREFIX+key);if(!raw)return fallback();const value=JSON.parse(raw);if(!Array.isArray(value))return fallback();
 if(key==='institutions'){if(value.length!==96||value.some((v,i)=>{const s=INITIAL_INSTITUTIONS[i];return !v||v.id!==s.id||v.name!==s.name||v.writerName!==s.writerName||v.contactPerson!==s.contactPerson||v.contactEmail!==s.contactEmail||v.contactPhone!==''||!Array.isArray(v.programs)||!Array.isArray(v.assignedEvaluatorIds);}))return fallback();}
 else if(key==='evaluators'){if(value.length!==12||value.some((v,i)=>{const s=INITIAL_EVALUATORS[i];return !v||v.id!==s.id||v.name!==s.name||v.email!==s.email||v.phone!==''||!Array.isArray(v.availableDates)||!Array.isArray(v.assignedInstitutionIds);}))return fallback();}
 else if(value.some(v=>!v||typeof v.id!=='string'||!INITIAL_INSTITUTIONS.some(i=>i.id===v.institutionId)||!INITIAL_EVALUATORS.some(e=>e.id===v.evaluatorId)))return fallback();
 return value as typeof seeds[K];}catch{return fallback();}
}
