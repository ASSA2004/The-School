import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, PanResponder, Pressable, ScrollView, View } from 'react-native';
import { assignedClasses, attendanceKey, AttendanceValue, canMarkAttendance, children, classes, requestAttendanceRevocation, saveAttendance, schoolDate, visibleStudents } from './domain';
import { useSchool } from './store';
import { Avatar, Badge, Button, Card, Chips, Copy, Empty, Field, IconButton, Stat, Title, useUiStyles } from './ui';
import { useTheme } from './theme';

const labels: Record<AttendanceValue, string> = { P: 'Present', L: 'Late', A: 'Leave' };
const remaining = (deadline: number, now: number) => { const sec = Math.max(0, Math.ceil((deadline - now) / 1000)); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; };
export default function AttendanceScreen() {
  const a = useSchool(); const [tab, setTab] = useState('Today');
  return <>{a.role === 'Parent' ? <Chips items={children} value={a.child} onChange={a.setChild} /> : true ? <Chips items={assignedClasses(a.state,a.role)} value={a.classId} onChange={a.setClassId} /> : <Copy muted>Class {a.classId} · Your assigned class</Copy>}<Chips items={['Today','Overall']} value={tab} onChange={setTab} />{tab === 'Today' ? <Session key={`${a.classId}-${a.role}-${a.child}`} date={schoolDate()} /> : <Calendar key={`${a.classId}-${a.role}-${a.child}`} />}</>;
}
function Session({ date }: { date: string }) {
  const a = useSchool(); const t = useTheme(); const s = useUiStyles();
  const [session, setSession] = useState('Morning'); const [index, setIndex] = useState(0); const [reason, setReason] = useState(''); const [showReason, setShowReason] = useState(false);
  const [moving, setMoving] = useState(false); const busy = useRef(false); const translate = useRef(new Animated.Value(0)).current;
  const reduced = useRef(false);
  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled().then(v => { reduced.current = v; }); const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', v => { reduced.current = v; }); return () => { sub.remove(); translate.stopAnimation(); }; }, []);
  useEffect(() => { setIndex(0); setReason(''); setShowReason(false); translate.setValue(0); busy.current = false; setMoving(false); }, [session, date]);
  const key = attendanceKey(a.classId, session, date);
  const students = visibleStudents(a.state, a.role, a.classId, a.child).sort((x,y) => x.roll - y.roll);
  const pending = a.state.requests.find(r => r.kind === 'Attendance' && r.key === key && r.status === 'Pending');
  const finalized = a.state.attendance[key];
  const revoke = a.state.requests.find(r => r.kind === 'Attendance revocation' && r.key === key && r.status === 'Pending');
  const reopened = a.state.requests.some(r => r.kind === 'Attendance revocation' && r.key === key && r.status === 'Approved');
  const canEdit = canMarkAttendance(a.role, a.classId, a.state, session, date, a.now) && !finalized && (!pending || (pending.deadline ?? 0) > a.now) && (date === schoolDate() || reopened);
  const values = finalized ?? pending?.attendance ?? a.state.attendanceDrafts?.[key] ?? {};
  const marked = students.filter(st => values[st.id]).length; const student = students[index];
  const advance = (direction: number) => {
    if (busy.current) return;
    const next = Math.max(0, Math.min(students.length - 1, index + direction));
    if (next === index) return;
    busy.current = true; setMoving(true);
    const finish = () => { setIndex(next); translate.setValue(reduced.current ? 0 : direction * 55); Animated.timing(translate, { toValue: 0, duration: reduced.current ? 0 : 120, useNativeDriver: true }).start(() => { busy.current = false; setMoving(false); }); };
    Animated.timing(translate, { toValue: reduced.current ? 0 : -direction * 320, duration: reduced.current ? 0 : 180, useNativeDriver: true }).start(({ finished }) => { if (finished) finish(); });
  };
  const pan = PanResponder.create({ onMoveShouldSetPanResponder: (_, g) => !busy.current && Math.abs(g.dx) > 24 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5, onPanResponderMove: (_, g) => { translate.setValue(Math.max(-120, Math.min(120,g.dx))); }, onPanResponderRelease: (_, g) => { translate.setValue(0); if (Math.abs(g.dx) > 45) advance(g.dx < 0 ? 1 : -1); }, onPanResponderTerminate: () => translate.setValue(0) });
  const mark = (value: AttendanceValue) => {
    if (!canEdit || !student || busy.current) return;
    a.update(state => {
      const live = state.requests.find(r => r.kind === 'Attendance' && r.key === key && r.status === 'Pending');
      if (live) return saveAttendance(state, key, { ...live.attendance, [student.id]: value }, a.role);
      if (state.attendance[key]) return state;
      return { ...state, attendanceDrafts: { ...state.attendanceDrafts, [key]: { ...state.attendanceDrafts?.[key], [student.id]: value } } };
    });
    advance(1);
  };
  const count = (v: AttendanceValue) => students.filter(st => values[st.id] === v).length;
  return <><Copy muted size={11}>{date} · Two sessions per school day</Copy><Chips items={['Morning','Afternoon']} value={session==='Evening'?'Afternoon':session} onChange={v=>setSession(v==='Afternoon'?'Evening':v)} />
    <View style={s.between}><Badge label={finalized?'Complete':pending?'Edit timer running':'Not taken'} />{canEdit&&students.length>0&&<Button secondary label="All present" onPress={()=>{const all=Object.fromEntries(students.map(st=>[st.id,'P' as AttendanceValue]));a.update(state=>state.requests.some(r=>r.key===key&&r.status==='Pending')?saveAttendance(state,key,all,a.role):{...state,attendanceDrafts:{...state.attendanceDrafts,[key]:all}});}}/>}</View>
    {!canEdit&&a.role!=='Parent'&&<Copy muted>View only � Later scheduled teachers can take an untaken session once their period starts. Submitted sessions stay with the original teacher during the edit timer.</Copy>}
    {pending && <Card><View style={s.between}><Badge label={canEdit?"Editable":"Taken � timer running"} /><Copy bold size={27}>{remaining(pending.deadline!, a.now)}</Copy></View><Copy muted>Ten-minute edit window. Changing a status restarts the countdown. The session locks automatically when it ends.</Copy></Card>}
    {finalized && <Card><Badge label="Complete" /><Copy muted>This {session.toLowerCase()} session is finalized. No staff member can submit it again without an approved revocation.</Copy></Card>}
    {!students.length ? <Empty title="No students in this class" detail="Register students before taking attendance." /> : !canEdit && !pending && !finalized ? <Empty title="No attendance recorded yet" detail="The assigned teacher's submission will appear here." /> : <>
    <View style={{ overflow: 'hidden', paddingVertical: 4 }}><Animated.View {...pan.panHandlers} style={{ transform: [{ translateX: translate }] }}><Card><View style={s.between}><Copy muted size={11}>STUDENT {index + 1} OF {students.length}</Copy><Badge label={values[student.id] ? labels[values[student.id]] : 'Not marked'} /></View><View style={{ alignItems: 'center', gap: 12, paddingVertical: 20 }}><Avatar name={student.name} /><Copy bold size={28}>{student.name}</Copy><Copy muted>Roll {student.roll} · Class {student.classId}</Copy></View>{canEdit && <View style={{ flexDirection: 'row', gap: 8 }}>{(['P','L','A'] as AttendanceValue[]).map(value => <Pressable accessibilityRole="button" accessibilityLabel={`${student.name}: ${labels[value]}`} accessibilityState={{ selected: values[student.id] === value, disabled: moving }} disabled={moving} key={value} onPress={() => mark(value)} style={({ pressed }) => ({ flex: 1, minHeight: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: values[student.id] === value ? t.ink : value === 'P' ? t.mint : value === 'L' ? t.butter : t.peach, opacity: pressed || moving ? .6 : 1 })}><Copy bold style={{ color: values[student.id] === value ? t.white : t.ink }}>{labels[value]}</Copy></Pressable>)}</View>}<View style={s.between}><Button label="Back" secondary disabled={index === 0 || moving} onPress={() => advance(-1)} /><Copy size={10} muted>Swipe to browse</Copy><Button label="Next" secondary disabled={index === students.length - 1 || moving} onPress={() => advance(1)} /></View></Card></Animated.View></View>
    <Card><Title>Live summary · {marked}/{students.length}</Title><View style={s.horizontal}><Stat label="Present" value={count('P')} color={t.mint} /><Stat label="Late" value={count('L')} color={t.butter} /><Stat label="Leave" value={count('A')} color={t.peach} /></View><ScrollView horizontal contentContainerStyle={{ gap: 8 }}>{students.filter(st => values[st.id]).map(st => <Pressable key={st.id} accessibilityRole="button" accessibilityLabel={`Review ${st.name}, ${labels[values[st.id]]}`} onPress={() => { if (!moving) setIndex(students.findIndex(x => x.id === st.id)); }} style={{ minWidth: 105, padding: 12, gap: 5, borderRadius: 16, backgroundColor: t.pale }}><Copy bold size={12}>{st.name}</Copy><Copy muted size={11}>Roll {st.roll} · {labels[values[st.id]]}</Copy></Pressable>)}</ScrollView><Copy muted size={11}>Late counts as present in daily history. Tap a summary card to review that student.</Copy></Card>
    {canEdit && !pending && <><Button label="Submit attendance" disabled={marked !== students.length || moving} onPress={() => { a.update(state => saveAttendance(state, key, state.attendanceDrafts?.[key] ?? {}, a.role)); a.notify('Submitted. You have ten minutes to edit this session.'); }} />{marked !== students.length && <Copy muted size={12}>Mark all {students.length} students before submitting.</Copy>}</>}
    </>}
    {finalized && a.role === 'In-charge Teacher' && a.classId === '10-A' && (revoke ? <Card><Badge label="Pending" /><Copy>Revocation requested. The session remains locked until the Principal approves.</Copy></Card> : <Card>{showReason ? <><Field label="Reason for reopening this session" value={reason} onChange={setReason} multiline /><Button label="Send revocation request" disabled={!reason.trim()} onPress={() => { a.update(state => requestAttendanceRevocation(state,key,a.role,reason)); setShowReason(false); a.notify('Revocation sent to the Principal.'); }} /></> : <Button label="Request attendance revocation" secondary onPress={() => setShowReason(true)} />}</Card>)}
  </>;
}
function Calendar() {
  const a = useSchool(); const t = useTheme(); const s = useUiStyles();
  const students = visibleStudents(a.state,a.role,a.classId,a.child).sort((x,y) => x.roll-y.roll);
  const [studentId,setStudentId] = useState(students[0]?.id ?? ''); const [month,setMonth] = useState(schoolDate().slice(0,7)); const [selected,setSelected] = useState(schoolDate());
  const year = Number(month.slice(0,4)), mon = Number(month.slice(5,7));
  const days = new Date(Date.UTC(year,mon,0)).getUTCDate(); const padding = (new Date(Date.UTC(year,mon-1,1)).getUTCDay()+6)%7;
  const move = (delta: number) => { const date = new Date(Date.UTC(year,mon-1+delta,1)); setMonth(date.toISOString().slice(0,7)); setSelected(''); };
  function status(date: string) {
    const morning = a.state.attendance[attendanceKey(a.classId,'Morning',date)]?.[studentId]; const evening = a.state.attendance[attendanceKey(a.classId,'Evening',date)]?.[studentId];
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    if (!morning && !evening) return { color: 'transparent', label: weekday === 0 || weekday === 6 ? 'Weekend' : 'No recorded attendance' };
    if (!morning || !evening) return { color: t.pale, label: 'One session recorded' };
    const present = Number(morning !== 'A') + Number(evening !== 'A');
    return { color: present === 2 ? '#DFF2DF' : present === 1 ? '#FFF0B8' : '#FADDD9', label: present === 2 ? 'Full-day present' : present === 1 ? 'Half-day present' : 'Full-day absence' };
  }
  return <>{a.role !== 'Parent' && <Chips items={students.map(st=>`${st.roll}. ${st.name}`)} value={students.find(st=>st.id===studentId) ? `${students.find(st=>st.id===studentId)!.roll}. ${students.find(st=>st.id===studentId)!.name}` : ''} onChange={v=>setStudentId(students.find(st=>`${st.roll}. ${st.name}`===v)!.id)} />}<Card><View style={s.between}><IconButton name="chevron-back" label="Previous month" onPress={()=>move(-1)} /><Copy bold>{new Date(Date.UTC(year,mon-1,1)).toLocaleDateString('en-IN',{month:'long',year:'numeric',timeZone:'UTC'})}</Copy><IconButton name="chevron-forward" label="Next month" onPress={()=>move(1)} /></View><View style={{flexDirection:'row',flexWrap:'wrap'}}>{['M','T','W','T','F','S','S'].map((label,i)=><View key={`weekday-${i}`} style={{width:'14.285%',alignItems:'center',paddingVertical:8}}><Copy muted size={11}>{label}</Copy></View>)}{Array.from({length:padding},(_,i)=><View key={`pad-${i}`} style={{width:'14.285%'}} />)}{Array.from({length:days},(_,i)=>{ const date=`${month}-${String(i+1).padStart(2,'0')}`, day=status(date); return <Pressable key={date} accessibilityRole="button" accessibilityLabel={`${date}: ${day.label}`} accessibilityState={{selected:selected===date}} onPress={()=>setSelected(date)} style={{width:'14.285%',minHeight:48,alignItems:'center',justifyContent:'center'}}><View style={{width:36,height:36,borderRadius:18,backgroundColor:day.color,alignItems:'center',justifyContent:'center',borderWidth:selected===date?2:0,borderColor:t.ink}}><Copy bold size={12}>{i+1}</Copy></View></Pressable>;})}</View><Copy muted size={11}>Green: full day · Yellow: half day · Red: absent{ '\n' }Unrecorded days and weekends stay blank.</Copy></Card>{selected && <Card><Title>{selected} · {status(selected).label}</Title>{['Morning','Evening'].map(session=>{ const value=a.state.attendance[attendanceKey(a.classId,session,selected)]?.[studentId]; return <View key={session} style={s.between}><Copy>{session}</Copy><Badge label={value?labels[value]:'Not finalized'} /></View>;})}</Card>}{selected && a.role !== 'Parent' && <Session key={selected} date={selected} />}</>;
}
