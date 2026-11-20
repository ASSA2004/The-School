export const roles = ['Principal', 'Coordinator', 'In-charge Teacher', 'Teacher', 'Parent'] as const;
export type Role = typeof roles[number];
export type AttendanceValue = 'P' | 'A' | 'L';
export type RequestStatus = 'Pending' | 'Approved' | 'Declined' | 'Automatically Approved';
export type RequestKind = 'Student archive' | 'Class update' | 'Attendance' | 'Attendance revocation' | 'Marks' | 'Timetable' | 'Examination' | 'Subject assignment' | 'Substitute' | 'Event' | 'Circular';
export type Request = {
  id: string; kind: RequestKind; title: string; by: string; classId: string;
  original: string; proposed: string; submittedAt: number; deadline?: number;
  status: RequestStatus; decidedAt?: number; reviewer?: string;
  key?: string; attendance?: Record<string, AttendanceValue>; marks?: Record<string, string>; editedAt?: number;
  archivedStudent?: Student; classChange?: { id: string; room: string; studentIds: string[] }; periodChange?: Period; examSlots?: ExamSlot[];
};
export type Student = { id: string; name: string; classId: string; roll: number; parent: string; admission: string; transport?: { type: string; vehicle: string; route: string; pickup: string; dropoff: string } };
export type Staff = { id: string; name: string; role: Role; subject: string; classId: string; duties: string[]; incharge?: string[] };
export type SchoolEvent = { id: string; title: string; date: string; kind: 'Meeting' | 'Event' | 'Holiday' | 'Examination' | 'Circular'; description: string; audience: 'All' | 'Principal'; attending: string[]; exam?: string };
export type Period = { classId: string; period: number; subject: string; teacherId: string; date?: string; substituteId?: string; originalTeacherId?: string };
export type ExamSlot = { exam: string; classId: string; subject: string; date: string; start: string; end: string; invigilator: string };
export type Homework = { id: string; title: string; description: string; classId: string; subject: string; due: string; status: 'Draft' | 'Published'; done: string[]; by: string };
export type Note = { key: string; title: string; status: 'Draft' | 'Published'; classId: string; subject: string; teacherId?: string; revision?: boolean };
export type State = {
  remarks?: {id:string;studentId:string;text:string;by:Role;createdAt:number;kind:'Remark'|'Suggestion'}[];
  archivedStudents?: Student[]; classRooms?: Record<string,string>; requests: Request[]; attendance: Record<string, Record<string, AttendanceValue>>;
  attendanceDrafts?: Record<string, Record<string, AttendanceValue>>;
  events?: SchoolEvent[]; timetable?: Period[]; examTimetable?: ExamSlot[]; subjectNames?: string[]; simulationVersion?: number;
  marks: Record<string, Record<string, string>>; drafts: Record<string, Record<string, string>>;
  students: Student[]; staff: Staff[]; homework: Homework[]; notes: Note[];
  messages: { id: string; to: string; text: string; by: Role }[];
  history: string[]; notifications: boolean;
};
export const subjects = ['Tamil', 'English', 'Mathematics', 'Science', 'Social Science'];
export const exams = ['Unit Test', 'Quarterly', 'Half-yearly', 'Annual'];
export const classes = Array.from({ length: 7 }, (_, i) => [`${i + 6}-A`, `${i + 6}-B`]).flat();
export const children = ['Kaviya', 'Rahul'];
export function schoolDate(date = new Date()) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date); }
export function attendanceKey(classId: string, session: string, date = schoolDate()) { return `${date}|${classId}|${session}`; }
export function marksKey(classId: string, exam: string, subject: string) { return `${classId}|${exam}|${subject}`; }
export function canReview(role: Role, request: Request) { return request.kind !== 'Attendance' && (role === 'Principal' || (role === 'Coordinator' && request.classId === '10-A' && request.kind === 'Marks')); }
export function canSeeTransport(role: Role, student: Student, child: string) { return role === 'Principal' || (role === 'In-charge Teacher' && student.classId === '10-A') || (role === 'Parent' && student.name === child && children.includes(child)); }
export function visibleStudents(state: State, role: Role, classId: string, child: string) { return state.students.filter(s => s.classId === classId && (role !== 'Parent' || s.name === child)); }
export function summarizeMarks(values: Record<string, string>, max: number) {
  const entered = Object.entries(values).filter(([, v]) => v.trim() !== '');
  const valid = entered.every(([, v]) => Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) <= max);
  const sorted = entered.map(([id, v]) => ({ id, value: Number(v) })).sort((a, b) => b.value - a.value);
  return { valid, count: entered.length, average: sorted.length ? Math.round(sorted.reduce((s, x) => s + x.value, 0) / sorted.length / max * 100) : null, pass: sorted.filter(x => x.value / max >= .35).length, fail: sorted.filter(x => x.value / max < .35).length, highest: sorted[0], lowest: sorted[sorted.length - 1] };
}
export function submitRequest(state: State, request: Request): State {
  if (state.requests.some(r => r.status === 'Pending' && r.key && r.key === request.key)) return state;
  if (request.kind === 'Attendance' && request.key && state.attendance[request.key]) return state;
  return { ...state, requests: [request, ...state.requests], history: [`${request.title} submitted by ${request.by}`, ...state.history] };
}
export function decide(state: State, id: string, status: Exclude<RequestStatus, 'Pending'>, reviewer: string, now = Date.now()): State {
  const request = state.requests.find(r => r.id === id);
  if (!request || request.status !== 'Pending') return state;
  if (request.kind === 'Attendance' && (status !== 'Automatically Approved' || !request.deadline || now < request.deadline)) return state;
  if (request.kind === 'Attendance revocation' && (reviewer !== 'Principal' || status === 'Automatically Approved')) return state;
  if (request.classChange && reviewer !== 'Principal') return state;
  if (request.archivedStudent && reviewer !== 'Principal') return state;
  const approved = status !== 'Declined';
  if (approved && request.periodChange && teacherConflict(state, request.periodChange)) return state;
  const attendance = { ...state.attendance };
  if (approved && request.key && request.kind === 'Attendance revocation') delete attendance[request.key];
  else if (approved && request.key && request.attendance) attendance[request.key] = request.attendance;
  if (request.archivedStudent) return {...state, archivedStudents:(state.archivedStudents??[]).filter(st=>st.id!==request.archivedStudent!.id),students:approved?state.students:[...state.students,request.archivedStudent],requests:state.requests.map(r=>r.id===id?{...r,status,reviewer,decidedAt:now}:r),history:[`${request.title} � ${status}`, ...state.history]};
  return { ...state,
    classRooms: approved && request.classChange ? {...state.classRooms,[request.classChange.id]:request.classChange.room} : state.classRooms,
    students: approved && request.classChange ? state.students.map(st=>request.classChange!.studentIds.includes(st.id)?{...st,classId:request.classChange!.id}:st) : state.students,
    events: approved && ['Event','Circular','Examination'].includes(request.kind) ? [...(state.events??[]),{id:request.id,title:request.title,date:request.examSlots?.[0]?.date??request.proposed.match(/\d{4}-\d{2}-\d{2}/)?.[0]??schoolDate(),kind:request.kind as 'Event'|'Circular'|'Examination',description:request.proposed,audience:request.kind==='Circular'?'Principal':'All',attending:[],exam:request.examSlots?.[0]?.exam}] : state.events,
    timetable: approved && request.periodChange ? [...(state.timetable??[]).filter(p=>!(p.classId===request.periodChange!.classId && p.period===request.periodChange!.period && p.date===request.periodChange!.date)),request.periodChange] : state.timetable,
    examTimetable: approved && request.examSlots ? [...(state.examTimetable??[]).filter(p=>!request.examSlots!.some(x=>x.classId===p.classId&&x.exam===p.exam&&x.subject===p.subject)),...request.examSlots] : state.examTimetable,
    messages: approved && request.kind === 'Substitute' && request.periodChange ? [...state.messages,...state.staff.filter(st=>[request.periodChange!.teacherId,request.periodChange!.originalTeacherId].includes(st.id)||st.incharge?.includes(request.classId)).map(st=>({id:`${request.id}-${st.id}`,to:st.name,text:`Substitute approved · Class ${request.classId} · Period ${request.periodChange!.period} · ${request.periodChange!.date}`,by:'Principal' as Role}))] : state.messages,
    requests: state.requests.map(r => r.id === id ? { ...r, status, reviewer, decidedAt: now } : r),
    attendance,
    marks: approved && request.key && request.marks ? { ...state.marks, [request.key]: request.marks } : state.marks,
    history: [`${request.title} · ${status} · ${reviewer}`, ...state.history],
  };
}
export function scheduleFor(state: State, classId: string, date: string): Period[] {
  return Array.from({length:8},(_,i)=>{const rows=(state.timetable??[]).filter(p=>p.classId===classId&&p.period===i+1);return rows.find(p=>p.date===date)??rows.find(p=>!p.date);}).filter((p):p is Period=>!!p);
}
export function teacherConflict(state: State, change: Period): boolean {
  return [...new Set([...classes,...Object.keys(state.classRooms??{})])].some(c=>c!==change.classId&&scheduleFor(state,c,change.date??schoolDate()).some(p=>p.period===change.period&&p.teacherId===change.teacherId));
}
export function settleDue(state: State, now = Date.now()): State {
  return state.requests.reduce((next, r) => r.status === 'Pending' && r.deadline !== undefined && r.deadline <= now && r.kind !== 'Attendance revocation' ? decide(next, r.id, 'Automatically Approved', r.kind === 'Attendance' ? '10-minute edit window ended' : '30-minute review window', now) : next, state);
}

export const ATTENDANCE_GRACE_MS = 10 * 60 * 1000;
export function assignedClasses(state: State, role: Role) {
 if(role==='Principal')return [...new Set([...classes,...Object.keys(state.classRooms??{})])];
 const actor=role==='Coordinator'?'t2':'t1';
 return [...new Set((state.timetable??[]).filter(p=>p.teacherId===actor).map(p=>p.classId).concat(role==='In-charge Teacher'?['10-A']:[]))];
}
export function canMarkAttendance(role: Role, classId: string, state?: State, session='Morning', date=schoolDate()) {
 if(role==='Principal')return true;
 if(!['Teacher','In-charge Teacher','Coordinator'].includes(role))return false;
 if(!state?.timetable?.length)return classId==='10-A';
 const period=session==='Morning'?1:6;
 return scheduleFor(state,classId,date).some(p=>p.period===period&&p.teacherId===(role==='Coordinator'?'t2':'t1'));
}
export function saveAttendance(state: State, key: string, values: Record<string, AttendanceValue>, role: Role, now = Date.now()): State {
  const settled = settleDue(state, now);
  const [date, classId, session] = key.split('|');
  if (!date || !['Morning','Evening'].includes(session) || !canMarkAttendance(role, classId, settled, session, date) || settled.attendance[key]) return settled;
  const roster = settled.students.filter(s => s.classId === classId);
  if (!roster.length || roster.some(s => !['P','A','L'].includes(values[s.id])) || Object.keys(values).length !== roster.length) return settled;
  const pending = settled.requests.find(r => r.kind === 'Attendance' && r.key === key && r.status === 'Pending');
  const proposed = roster.map(s => `${s.name}: ${values[s.id] === 'P' ? 'Present' : values[s.id] === 'L' ? 'Late' : 'Leave'}`).join(' · ');
  if (pending) {
    if (roster.every(s => pending.attendance?.[s.id] === values[s.id])) return settled;
    return { ...settled, requests: settled.requests.map(r => r.id === pending.id ? { ...r, attendance: { ...values }, proposed, editedAt: now, deadline: now + ATTENDANCE_GRACE_MS } : r), history: [`${classId} ${session} attendance edited by ${role}; 10-minute window restarted`, ...settled.history] };
  }
  return submitRequest(settled, { id: `attendance-${key}-${now}`, kind: 'Attendance', title: `${classId} ${session.toLowerCase()} attendance`, by: role, classId, original: 'No active finalized session', proposed, key, attendance: { ...values }, submittedAt: now, deadline: now + ATTENDANCE_GRACE_MS, status: 'Pending' });
}
export function requestAttendanceRevocation(state: State, key: string, role: Role, reason: string, now = Date.now()): State {
  const settled = settleDue(state, now); const classId = key.split('|')[1];
  if (role !== 'In-charge Teacher' || classId !== '10-A' || !settled.attendance[key] || !reason.trim()) return settled;
  return submitRequest(settled, { id: `revoke-${key}-${now}`, kind: 'Attendance revocation', title: `Reopen ${classId} ${key.split('|')[2]} attendance`, by: role, classId, key, original: JSON.stringify(settled.attendance[key]), proposed: `Unlock this session for correction. Reason: ${reason.trim()}`, submittedAt: now, status: 'Pending' });
}
export function migrateAttendance(state: State): State {
  // Preserve existing previews, translating the old Afternoon session to Evening.
  const normalize = (key: string) => key.replace(/\|Afternoon$/, '|Evening');
  return { ...state, attendance: Object.fromEntries(Object.entries(state.attendance).map(([k,v]) => [normalize(k),v])), requests: state.requests.map(r => r.kind === 'Attendance' ? { ...r, key: r.key ? normalize(r.key) : r.key, deadline: r.status === 'Pending' ? (r.editedAt ?? r.submittedAt) + ATTENDANCE_GRACE_MS : r.deadline } : r) };
}
export function initialState(): State {
  const students: Student[] = [
    { id: 's1', name: 'Rahul', classId: '10-A', roll: 1, parent: 'Meena', admission: 'SCH-1001', transport: { type: 'School Bus', vehicle: 'Bus 03', route: 'North route', pickup: 'Library stop · 8:10 am', dropoff: 'Library stop · 4:15 pm' } },
    { id: 's2', name: 'Arun', classId: '10-A', roll: 2, parent: 'Lakshmi', admission: 'SCH-1002' },
    { id: 's3', name: 'Manuel', classId: '10-A', roll: 3, parent: 'Maria', admission: 'SCH-1003' },
    { id: 's4', name: 'Ashlam', classId: '10-A', roll: 4, parent: 'Fathima', admission: 'SCH-1004' },
    { id: 's5', name: 'Kaviya', classId: '9-B', roll: 1, parent: 'Meena', admission: 'SCH-0901', transport: { type: 'Parent Pickup', vehicle: 'Not applicable', route: 'Not applicable', pickup: 'Main gate · 8:30 am', dropoff: 'Main gate · 4:00 pm' } },
  ];
  const marks: State['marks'] = {};
  subjects.forEach((sub, i) => { marks[marksKey('10-A', 'Quarterly', sub)] = { s1: String([76,82,90,79,85][i]), s2: String([85,88,94,87,90][i]), s3: String([80,85,92,88,89][i]), s4: String([90,91,96,92,94][i]) }; marks[marksKey('9-B', 'Quarterly', sub)] = { s5: [88,91,95,84,null][i]?.toString() ?? '' }; });
  return { students, marks, drafts: {}, attendance: {}, notes: [], messages: [], history: [], notifications: true,
    staff: [
      { id: 't1', name: 'Anitha', role: 'In-charge Teacher', subject: 'Mathematics', classId: '10-A', duties: ['Attendance', 'Marks', 'Class remarks'] },
      { id: 't2', name: 'Priya', role: 'Coordinator', subject: 'English', classId: '10-A', duties: ['Timetable', 'Substitute', 'Registration'] },
      { id: 't3', name: 'Suresh', role: 'Teacher', subject: 'Science', classId: '10-A', duties: ['Marks'] },
      { id: 't4', name: 'Revathi', role: 'In-charge Teacher', subject: 'Tamil', classId: '9-B', duties: ['Attendance', 'Marks'] },
    ],
    requests: [
      { id: 'r1', kind: 'Timetable', title: 'Wednesday timetable change', by: 'Priya', classId: '10-A', original: 'Period 3 · Science · Suresh', proposed: 'Period 3 · English · Priya', submittedAt: Date.now() - 600000, status: 'Pending' },
      { id: 'r2', kind: 'Event', title: 'Science exhibition', by: 'Priya', classId: '10-A', original: 'Not published', proposed: '20 November 2026 · 10:00 am · School hall', submittedAt: Date.now() - 900000, status: 'Pending' },
      { id: 'r3', kind: 'Subject assignment', title: 'Class 10-A English assignment', by: 'Priya', classId: '10-A', original: 'English · Anitha', proposed: 'English · Priya', submittedAt: Date.now() - 1200000, status: 'Pending' },
    ],
    homework: [
      { id: 'h1', title: 'A little practice, a lot of progress', description: 'Complete exercise 4.2, questions 1–5. Show each step in your notebook.', classId: '10-A', subject: 'Mathematics', due: '2026-11-18', status: 'Published', done: ['s2','s4'], by: 'Anitha' },
      { id: 'h2', title: 'The world of plants', description: 'Draw and label a leaf. Write two sentences about photosynthesis.', classId: '9-B', subject: 'Science', due: '2026-11-19', status: 'Published', done: [], by: 'Revathi' },
    ],
  };
}
