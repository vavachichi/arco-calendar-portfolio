import {test,expect,type Page} from '@playwright/test';
const prefix='arco_portfolio_synthetic_v1_';
test.beforeEach(async({page})=>{await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort('blockedbyclient'));await page.goto('/');});
async function login(page:Page,key='ADMIN-2026'){await page.getByPlaceholder(/로그인 아이디 \(예:/).fill(key);await page.getByPlaceholder(/비밀번호 \(초기:/).fill('1234');await page.getByRole('button',{name:'로그인하기',exact:true}).click();}
async function stored(page:Page){return page.evaluate(p=>JSON.parse(localStorage.getItem(p+'institutions')||'[]'),prefix);}
test('legacy namespace isolation',async({page})=>{await page.evaluate(()=>localStorage.setItem('arko_institutions',JSON.stringify([{name:'legacy-sentinel'}])));await page.reload();await login(page);await expect(page.locator('body')).not.toContainText('legacy-sentinel');expect((await stored(page)).length).toBe(96);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('arko_institutions')!)[0].name)).toBe('legacy-sentinel');});
test('original evaluator booking and cancellation',async({page})=>{await login(page,'EVAL-01');await page.getByRole('button',{name:'8개관 카드 뷰',exact:true}).click();await page.getByRole('button',{name:'이 프로그램 예약',exact:true}).first().click();expect((await stored(page)).filter((i:any)=>i.confirmedVisitDate).length).toBeGreaterThan(2);await page.getByRole('button',{name:'취소',exact:true}).first().click();await expect(page.locator('body')).toContainText('초기화되었습니다');});
test('original institution metadata upload/delete',async({page})=>{await login(page,'INST-001');await page.locator('input[type=file][accept*=".pdf"]').first().setInputFiles({name:'합성_추가자료.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4 synthetic test')});await expect(page.getByText('합성_추가자료.pdf',{exact:true})).toBeVisible();expect((await stored(page))[0].activityFiles.length).toBe(2);await page.getByRole('button',{name:'파일 삭제',exact:true}).last().click();expect((await stored(page))[0].activityFiles.length).toBe(1);});
test('original CSV and ICS download functions',async({page})=>{await login(page);let pending=page.waitForEvent('download');await page.getByRole('button',{name:'종합 매칭 엑셀 다운로드',exact:true}).click();expect((await pending).suggestedFilename()).toMatch(/\.csv$/);pending=page.waitForEvent('download');await page.evaluate(async()=>{const path='/tests/ai-harness.tsx';const m=await import(path);m.downloadICS();});expect((await pending).suggestedFilename()).toMatch(/\.ics$/);});
test('original Gemini modal with safe examples in test harness',async({page})=>{await page.evaluate(async()=>{const path='/tests/ai-harness.tsx';const m=await import(path);m.mountAI();});await page.getByRole('button',{name:'최적 일정 분석 실행',exact:true}).click();await expect(page.getByText(/포트폴리오용 합성 예시 응답입니다/)).toBeVisible();await page.getByRole('button',{name:'AI 프로그램별 관찰 포인트 & 질문지',exact:true}).click();await page.getByRole('button',{name:'맞춤형 체크리스트 생성',exact:true}).click();await expect(page.getByText('합성 예시: 운영 준비 확인',{exact:true})).toBeVisible();await page.getByRole('button',{name:'AI 공식 공문 & 알림톡 작성기',exact:true}).click();await page.getByRole('button',{name:'공문 & 알림 메시지 생성',exact:true}).click();await expect(page.getByText('[합성 예시] 가상 프로그램 방문 안내',{exact:true})).toBeVisible();});
test('capture four preserved UI screens',async({page})=>{const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await login(page);await page.screenshot({path:'screenshots/02-calendar.png'});await page.getByRole('button',{name:/96개관 & 12위원 총괄대장/}).click();await page.screenshot({path:'screenshots/01-dashboard.png'});await page.getByRole('button',{name:/로그아웃/}).click();await login(page,'EVAL-01');await page.screenshot({path:'screenshots/03-booking.png'});await page.getByRole('button',{name:/로그아웃/}).click();await login(page,'INST-001');await page.getByText('기관 사업 활동 실적 서류 업로드 (한글 HWP / 엑셀 XLSX)',{exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:'screenshots/04-materials.png'});expect(errors).toEqual([]);});

test('existing program registration and reservation change',async({page})=>{
 await login(page,'INST-002');await page.getByRole('button',{name:'프로그램 일정 추가',exact:true}).click();
 await page.locator('div.fixed.inset-0').last().locator('select').first().selectOption('inst-2');
 await page.getByPlaceholder('예: 목요일 밤의 단편소설 창작살롱, 어린이 그림책 탐험대').fill('합성 변경용 프로그램');
 await page.getByRole('button',{name:'프로그램 등록 완료',exact:true}).click();expect((await stored(page))[1].programs.length).toBe(2);
 await page.getByRole('button',{name:/로그아웃/}).click();await login(page,'EVAL-01');await page.getByRole('button',{name:'8개관 카드 뷰',exact:true}).click();
 await page.getByRole('button',{name:'이 일정으로 변경',exact:true}).last().click();
 const list=await stored(page);expect(list[1].confirmedProgramId).toBe(list[1].programs[1].id);
});
test('existing proposal creation from coordination modal',async({page})=>{
 await login(page);await page.getByRole('button',{name:'+ 일정 직접 등록',exact:true}).click();
 const overlay=page.locator('div.fixed.inset-0').last();await overlay.locator('select').first().selectOption('inst-4');
 await page.getByRole('button',{name:'조율 제안 전송',exact:true}).click();
 const list=await page.evaluate(p=>JSON.parse(localStorage.getItem(p+'proposals')!),prefix);expect(list[0].institutionId).toBe('inst-4');expect(list[0].status).toBe('pending');
});
test('existing evaluation form saves synthetic scores',async({page})=>{
 await login(page);await page.getByRole('button',{name:/96개관 & 12위원 총괄대장/}).click();
 await page.getByRole('row').filter({hasText:'가상 문학관 002'}).first().getByRole('button',{name:'평가표',exact:true}).click();
 const overlay=page.locator('div.fixed.inset-0').last();for(const t of await overlay.locator('textarea').all())await t.fill('합성 예시 의견');
 await page.getByRole('button',{name:'평가서 저장 및 제출',exact:true}).click();
 expect((await stored(page))[1].evaluationStatus).toBe('completed');
});
