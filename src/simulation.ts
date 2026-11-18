import type { State, SchoolEvent, Staff, Student, Period } from './domain';
import { classes, subjects, schoolDate, attendanceKey, marksKey } from './domain';
export const HOLIDAYS = ['2026-08-15','2026-10-02','2026-10-20','2026-11-09'];
export function populateSchool(state: State): State {
  if (state.simulationVersion === 3) return state;
  const names = ['Aarav','Aisha','Daniel','Diya','Ibrahim','Maria','Arjun','Fatima','Joseph','Nila','Yusuf','Esther','Karthik','Zoya','Samuel','Meera','Imran','Ruth','Vikram','Sana','Joel','Ananya','Omar','Grace','Surya','Hana','David','Kavya','Rehan','Sarah'];
  const students: Student[] = [...state.students];
  classes.forEach((classId,ci) => {
    for (let roll=1;roll<=15;roll++) {
      if (students.some(s=>s.classId===classId&&s.roll===roll)) continue;
      const name=names[(ci*15+roll-1)%names.length]+' '+String.fromCharCode(65+(ci+roll)%26);
      students.push({ id:`sim-${classId}-${roll}`,name,classId,roll,parent:`${name.split(' ')[0]}'s parent`,admission:`SCH-${classId}-${String(roll).padStart(3,'0')}` });
    }
  });
  const staff: Staff[] = state.staff.map(st=>({...st,incharge:st.incharge?[...st.incharge]:undefined}));
  const roleCounts = { Coordinator: 5, 'In-charge Teacher': 10, Teacher: 25 } as const;
  Object.entries(roleCounts).forEach(([role,total])=>{
    for(let count=staff.filter(s=>s.role===role).length;count<total;count++) {
      const index=staff.length;
      staff.push({id:`staff-${index+1}`,name:`${names[index%names.length]} ${String.fromCharCode(65+index%26)}`,role:role as Staff['role'],subject:subjects[index%5],classId:classes[index%14],duties:['Attendance','Marks',...(role==='Coordinator'?['Timetable','Substitute']:[])]});
    }
  });
  const coordinators=staff.filter(s=>s.role==='Coordinator');
  coordinators.slice(0,3).forEach((s,i)=>{s.incharge=[classes[i]];});
  staff.filter(s=>s.role==='In-charge Teacher').forEach((s,i)=>{s.incharge=[i===0?'10-A':i===1?'9-B':classes[(i+3)%14]];});
  const assigned=new Set(staff.flatMap(s=>s.incharge??[]));
  classes.filter(c=>!assigned.has(c)).forEach((c,i)=>{const owner=staff.filter(s=>s.role==='In-charge Teacher')[i%10];owner.incharge=[...(owner.incharge??[]),c];});
  const attendance={...state.attendance};
  const today=schoolDate();
  for(let date=new Date('2026-06-01T12:00:00Z');date.toISOString().slice(0,10)<today;date.setUTCDate(date.getUTCDate()+1)) {
    const day=date.toISOString().slice(0,10); if([0,6].includes(date.getUTCDay())||HOLIDAYS.includes(day))continue;
    classes.forEach((classId,ci)=>['Morning','Evening'].forEach((session,si)=>{
      const key=attendanceKey(classId,session,day);if(attendance[key])return;
      attendance[key]=Object.fromEntries(students.filter(s=>s.classId===classId).map(s=>{const n=(date.getUTCDate()+s.roll*7+ci*3)%31;return[s.id,n===0||n===1&&si===1?'A':n===2?'L':'P'];}));
    }));
  }
  const marks={...state.marks};classes.forEach((classId,ci)=>['Unit Test','Quarterly'].forEach(exam=>subjects.forEach((subject,sub)=>{
    const key=marksKey(classId,exam,subject),max=exam==='Unit Test'?20:100;
    const values=Object.fromEntries(students.filter(s=>s.classId===classId).map(s=>[s.id,String(Math.round((.32+((s.roll*7+sub*11+ci*3)%68)/100)*max))]));
    marks[key]={...values,...marks[key]};
  })));
  const events:SchoolEvent[]=[
    {id:'meeting-event',title:'Parent–teacher meet',date:'2026-11-21',kind:'Meeting',description:'Meet the teaching team in the school hall at 10:00 am. Teacher RSVP updates appear here.',audience:'All',attending:[]},
    {id:'exam-event',title:'Quarterly examination timetable',date:'2026-09-21',kind:'Examination',description:'Published subject-wise examination dates, timings and invigilators.',audience:'All',attending:[],exam:'Quarterly'},
    {id:'meeting-active',title:'Learning progress check-in',date:today,kind:'Meeting',description:'Today at 3:00 pm in the school hall. See which teachers are attending.',audience:'All',attending:['t1','t4']},
    ...Array.from({length:6},(_,i)=>({id:`event-${i}`,title:['Welcome to the school year','Reading week','Independence Day programme','Quarterly review meeting','Science discovery day','Children’s Day celebration'][i],date:`2026-${String(i+6).padStart(2,'0')}-14`,kind:i===3?'Meeting' as const:'Event' as const,description:'School community programme. Sample historical announcement.',audience:'All' as const,attending:i===3?['t1','t2','t4']:[]})),
    ...HOLIDAYS.map(date=>({id:`holiday-${date}`,title:'School holiday',date,kind:'Holiday' as const,description:'No classes or attendance sessions today.',audience:'All' as const,attending:[]})),
    {id:'staff-circular',title:'Staff planning meeting',date:today,kind:'Circular',description:'4:15 pm · Staff room · Review upcoming academic responsibilities.',audience:'Principal',attending:[]},
  ];
  const timetable:Period[]=classes.flatMap((classId,ci)=>Array.from({length:8},(_,p)=>({classId,period:p+1,subject:subjects[p%5],teacherId:staff[(ci+p*classes.length)%staff.length].id})));
  const own=timetable.find(p=>p.classId==='10-A'&&p.period===1)!; const conflict=timetable.find(p=>p.period===1&&p.teacherId==='t1');if(conflict)conflict.teacherId=own.teacherId;own.teacherId='t1';own.subject='Mathematics';
  const examTimetable=classes.flatMap(classId=>['Unit Test','Quarterly'].flatMap(exam=>subjects.map((subject,i)=>({classId,exam,subject,date:`2026-${exam==='Quarterly'?'09':'07'}-${21+i}`,start:'09:00',end:'11:00',invigilator:staff[(i+2)%staff.length].name}))));
  return {...state,students,staff,attendance,marks,events:state.events??events,timetable:[...timetable,...(state.timetable??[]).filter(p=>p.date)],examTimetable:state.examTimetable??examTimetable,subjectNames:state.subjectNames??subjects,simulationVersion:3};
}
