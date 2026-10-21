// Tests only; not imported into the application bundle or exposed by new UI controls.
import React from 'react';
import {createRoot} from 'react-dom/client';
import {AIAssistantModal} from '../src/components/AIAssistantModal';
import {INITIAL_INSTITUTIONS,INITIAL_EVALUATORS} from '../src/data/mockData';
import {exportToICS} from '../src/utils/exportUtils';
export function mountAI(){const el=document.createElement('div');document.body.appendChild(el);const root=createRoot(el);root.render(<AIAssistantModal isOpen={true} onClose={()=>{root.unmount();el.remove();}} institutions={INITIAL_INSTITUTIONS} evaluators={INITIAL_EVALUATORS} onApplyScheduleMatch={()=>{}}/>);}
export function downloadICS(){exportToICS(INITIAL_INSTITUTIONS,INITIAL_EVALUATORS);}
