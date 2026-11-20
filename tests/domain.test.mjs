import { createRequire } from 'node:module';
import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, submitRequest, decide, settleDue, canReview, canSeeTransport, visibleStudents, summarizeMarks, attendanceKey, saveAttendance, requestAttendanceRevocation, migrateAttendance, ATTENDANCE_GRACE_MS, teacherConflict, scheduleFor } from '../src/domain.ts';
const makeRequest = (extra = {}) => ({ id: 'test', kind: 'Attendance', title: 'Morning attendance', by: 'Anitha', classId: '10-A', original: 'None', proposed: 'Rahul present', submittedAt: 1000, deadline: 1801000, status: 'Pending', key: attendanceKey('10-A','Morning','2026-11-17'), attendance: { s1: 'P', s2: 'A' }, ...extra });
test('submission begins a ten-minute edit window and requires the whole roster', () => {
  const state=initialState(),key=attendanceKey('10-A','Morning','2026-11-17');
  assert.equal(saveAttendance(state,key,{s1:'P'},'Teacher',1000),state);
  const values={s1:'P',s2:'L',s3:'A',s4:'P'};
  const saved=saveAttendance(state,key,values,'Teacher',1000);
  assert.equal(saved.attendance[key],undefined);
  assert.equal(saved.requests[0].deadline,1000+ATTENDANCE_GRACE_MS);
  assert.equal(decide(saved,saved.requests[0].id,'Approved','Principal',2000),saved);
});
test('declining a marks change preserves current approved marks', () => {
  const state = initialState(); const r = makeRequest({ kind: 'Marks', key: '10-A|Quarterly|Mathematics', attendance: undefined, marks: { s1: '20' } });
  const result = decide(submitRequest(state,r),r.id,'Declined','Principal');
  assert.deepEqual(result.marks,state.marks); assert.equal(result.requests[0].status,'Declined');
});
test('edits restart the timer, no-op edits do not, and expiry locks permanently', () => {
  const key=attendanceKey('10-A','Morning','2026-11-17'),values={s1:'P',s2:'L',s3:'A',s4:'P'};
  const submitted=saveAttendance(initialState(),key,values,'Teacher',1000);
  assert.equal(saveAttendance(submitted,key,values,'Teacher',2000),submitted);
  const edited=saveAttendance(submitted,key,{...values,s3:'P'},'Teacher',100000);
  assert.equal(edited.requests[0].deadline,700000);
  assert.equal(settleDue(edited,699999).attendance[key],undefined);
  const locked=settleDue(edited,700000);
  assert.equal(locked.attendance[key].s3,'P');
  assert.deepEqual(saveAttendance(locked,key,{...values,s1:'A'},'Teacher',700001),locked);
  const boundary=saveAttendance(edited,key,{...values,s1:'A'},'Teacher',700000);
  assert.equal(boundary.attendance[key].s1,'P');
  assert.equal(locked.requests.find(r=>r.kind==='Event').status,'Pending');
});
test('only in-charge can request revocation; only Principal can explicitly approve', () => {
  const key=attendanceKey('10-A','Morning','2026-11-17'),values={s1:'P',s2:'P',s3:'A',s4:'P'};
  let state=settleDue(saveAttendance(initialState(),key,values,'Teacher',1000),601000);
  assert.equal(requestAttendanceRevocation(state,key,'Teacher','Correction',602000),state);
  state=requestAttendanceRevocation(state,key,'In-charge Teacher','Incorrect leave',602000);
  const request=state.requests[0];
  assert.equal(request.deadline,undefined);
  assert.equal(decide(state,request.id,'Approved','Coordinator'),state);
  assert.equal(decide(state,request.id,'Automatically Approved','Principal'),state);
  assert.ok(decide(state,request.id,'Declined','Principal').attendance[key]);
  const reopened=decide(state,request.id,'Approved','Principal');
  assert.equal(reopened.attendance[key],undefined);
  assert.equal(saveAttendance(reopened,key,values,'Teacher',700000).requests[0].kind,'Attendance');
});
test('legacy sessions migrate to Evening and the new grace window', () => {
 const r=makeRequest({key:'2026-11-17|10-A|Afternoon'});const old=submitRequest(initialState(),r);
 const migrated=migrateAttendance(old);
 assert.equal(migrated.requests[0].key,'2026-11-17|10-A|Evening');
 assert.equal(migrated.requests[0].deadline,601000);
 assert.notEqual(attendanceKey('10-A','Morning'),attendanceKey('10-A','Evening'));
});
test('parent visibility and transport stay within their child relationship', () => {
  const state = initialState();
  assert.deepEqual(visibleStudents(state,'Parent','10-A','Rahul').map(s => s.name),['Rahul']);
  const rahul = state.students[0], kaviya = state.students[4];
  assert.equal(canSeeTransport('Teacher',rahul,'Rahul'),false);
  assert.equal(canSeeTransport('Parent',kaviya,'Rahul'),false);
  assert.equal(canSeeTransport('In-charge Teacher',kaviya,'Kaviya'),false);
  assert.equal(canSeeTransport('Parent',rahul,'Rahul'),true);
});
test('coordinator review scope is limited to assigned routine updates', () => {
  assert.equal(canReview('Coordinator',makeRequest()),false);
  assert.equal(canReview('Coordinator',makeRequest({kind:'Marks'})),true);
  assert.equal(canReview('Coordinator',makeRequest({ classId:'9-B' })),false);
  assert.equal(canReview('Coordinator',makeRequest({ kind:'Timetable' })),false);
  assert.equal(canReview('Parent',makeRequest()),false);
});
test('mark summaries exclude missing data and validate bounds', () => {
  assert.deepEqual(summarizeMarks({ a:'',b:' ' },100).average,null);
  const summary = summarizeMarks({ a:'90',b:'20',c:'' },100);
  assert.equal(summary.average,55); assert.equal(summary.pass,1); assert.equal(summary.fail,1);
  assert.equal(summarizeMarks({ a:'101' },100).valid,false);
  assert.equal(summarizeMarks({ a:'-1' },100).valid,false);
  assert.equal(summarizeMarks({ a:'text' },100).valid,false);
});

test('double-booked timetable assignments cannot be approved',()=>{
 const state={...initialState(),timetable:[{classId:'6-A',period:1,subject:'Tamil',teacherId:'t1'},{classId:'10-A',period:1,subject:'Science',teacherId:'t3'}]};
 const change={classId:'10-A',period:1,subject:'Tamil',teacherId:'t1',date:'2026-11-17'};
 assert.equal(teacherConflict(state,change),true);
 const request=makeRequest({kind:'Substitute',key:'slot',attendance:undefined,deadline:undefined,periodChange:change});
 const pending=submitRequest(state,request);
 assert.equal(decide(pending,request.id,'Approved','Principal'),pending);
 assert.equal(scheduleFor(state,'10-A','2026-11-17')[0].teacherId,'t3');
});

test('school simulation has 210 students, 40 staff, complete weekdays and no timetable conflicts',()=>{
 const require=createRequire(import.meta.url),ts=require('typescript');const cache={};
 function load(path){if(cache[path])return cache[path];const module={exports:{}};const js=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('require','module','exports',js)(name=>name==='./domain'?load('src/domain.ts'):require(name),module,module.exports);cache[path]=module.exports;return module.exports;}
 const domain=load('src/domain.ts'),sim=load('src/simulation.ts');const state=sim.populateSchool(domain.initialState());
 assert.equal(state.students.length,210);assert.equal(state.staff.length,40);
 assert.equal(state.staff.filter(s=>s.role==='Coordinator').length,5);
 assert.equal(state.staff.filter(s=>s.role==='In-charge Teacher').length,10);
 assert.equal(state.staff.filter(s=>s.role==='Teacher').length,25);
 assert.equal(state.staff.filter(s=>s.role==='Coordinator'&&s.incharge?.length).length,3);
 assert.equal(state.timetable.length,112);assert.equal(new Set(state.timetable.map(p=>p.teacherId)).size,40);
 assert.equal(state.timetable.filter(p=>domain.teacherConflict(state,p)).length,0);
 for(const classId of domain.classes){assert.equal(state.students.filter(s=>s.classId===classId).length,15);assert.ok(state.attendance['2026-06-01|'+classId+'|Morning']);assert.ok(state.attendance['2026-06-01|'+classId+'|Evening']);assert.equal(state.attendance['2026-06-07|'+classId+'|Morning'],undefined);}
 assert.equal(sim.populateSchool(state),state);
});

test('past examination dates can be added and edited through approval without duplicate slots',()=>{
 const slot={exam:'Quarterly',classId:'10-A',subject:'Mathematics',date:'2026-09-23',start:'09:00',end:'11:00',invigilator:'Anitha'};
 const state={...initialState(),examTimetable:[slot]};
 const revised={...slot,date:'2026-09-22',start:'10:00',end:'12:00'};
 const request=makeRequest({kind:'Examination',key:'exam|10-A|Quarterly|Mathematics',attendance:undefined,deadline:undefined,examSlots:[revised]});
 const pending=submitRequest(state,request);
 assert.deepEqual(pending.examTimetable,[slot]);
 assert.deepEqual(decide(pending,request.id,'Declined','Principal').examTimetable,[slot]);
 const approved=decide(pending,request.id,'Approved','Principal');
 assert.deepEqual(approved.examTimetable,[revised]);
 const add={...request,id:'new-exam',key:'exam|10-A|Quarterly|English',examSlots:[{...slot,subject:'English'}]};
 assert.equal(decide(submitRequest(approved,add),add.id,'Approved','Principal').examTimetable.length,2);
});

 test('attendance responsibility follows session start and Principal can fill gaps', async () => {
 const {canMarkAttendance}=await import('../src/domain.ts');
 const state={timetable:[{classId:'10-A',period:1,teacherId:'t1',subject:'Math'},{classId:'10-A',period:6,teacherId:'t2',subject:'English'}]};
 assert.equal(canMarkAttendance('Principal','10-A',state,'Evening'),true);
 assert.equal(canMarkAttendance('Teacher','10-A',state,'Morning'),true);
 assert.equal(canMarkAttendance('Teacher','10-A',state,'Evening'),false);
 assert.equal(canMarkAttendance('Coordinator','10-A',state,'Evening'),true);
 assert.equal(canMarkAttendance('Parent','10-A',state,'Morning'),false);
 });
