import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { children, initialState, migrateAttendance, Role, settleDue, State } from './domain';
import { populateSchool } from './simulation';
export type Page = 'Home' | 'People' | 'Class' | 'Schedule' | 'Operations' | 'Profile' | 'Attendance' | 'Marks' | 'Homework' | 'Approvals' | 'Notifications' | 'Events' | 'Reports' | 'Messages' | 'Detail' | 'Editor' | 'Examination Timetable' | 'Master timetable' | 'Settings';
export type Route = { name: Page; id?: string; mode?: string };
type Context = {
  state: State; update: React.Dispatch<React.SetStateAction<State>>; ready: boolean;
  role: Role; setRole: (r: Role) => void; child: string; setChild: (s: string) => void;
  classId: string; setClassId: (s: string) => void; route: Route; go: (name: Page, options?: Omit<Route, 'name'>) => void; back: () => void;
  notice: string; notify: (s: string) => void; now: number;
};
const Context = createContext<Context | null>(null);
const KEY = 'school-native-demo-v1';
export function SchoolProvider({ children: content }: { children: ReactNode }) {
  const [state, update] = useState<State>(() => populateSchool(initialState()));
  const [ready, setReady] = useState(false);
  const [role, changeRole] = useState<Role>('Principal');
  const [child, changeChild] = useState(children[0]);
  const [classId, setClassId] = useState('10-A');
  const [stack, setStack] = useState<Route[]>([{ name: 'Home' }]);
  const [notice, notify] = useState('');
  const [now, setNow] = useState(Date.now());
  const queue = useRef(Promise.resolve());
  useEffect(() => { let active = true; AsyncStorage.getItem(KEY).then(raw => {
    if (!active || !raw) return;
    const parsed = JSON.parse(raw);
    if (parsed.version !== 1 || !Array.isArray(parsed.data?.students) || !Array.isArray(parsed.data?.requests)) throw new Error('Invalid saved data');
    update(settleDue(populateSchool(migrateAttendance(parsed.data))));
  }).catch(() => notify('Saved preview data could not be loaded. Sample data is available.')).finally(() => { if (active) setReady(true); }); return () => { active = false; }; }, []);
  useEffect(() => { if (!ready) return; const payload = JSON.stringify({ version: 1, data: state }); queue.current = queue.current.then(() => AsyncStorage.setItem(KEY, payload)).catch(() => { notify('Changes are available now, but could not be saved on this device.'); }); }, [state, ready]);
  useEffect(() => { const tick = () => { const time = Date.now(); setNow(time); update(s => settleDue(s, time)); }; const timer = setInterval(tick, 1000); const subscription = AppState.addEventListener('change', status => { if (status === 'active') tick(); }); return () => { clearInterval(timer); subscription.remove(); }; }, []);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => notify(''), 6500); return () => clearTimeout(timer); }, [notice]);
  const go = (name: Page, options?: Omit<Route, 'name'>) => setStack(s => [...s, { name, ...options }]);
  const back = () => setStack(s => s.length > 1 ? s.slice(0, -1) : s);
  const setRole = (r: Role) => { changeRole(r); setClassId(r === 'Parent' ? (child === 'Kaviya' ? '9-B' : '10-A') : '10-A'); setStack([{ name: 'Home' }]); };
  const setChild = (c: string) => { changeChild(c); setClassId(c === 'Kaviya' ? '9-B' : '10-A'); };
  return <Context.Provider value={{ state, update, ready, role, setRole, child, setChild, classId, setClassId, route: stack[stack.length - 1], go, back, notice, notify, now }}>{content}</Context.Provider>;
}
export function useSchool() { const value = useContext(Context); if (!value) throw new Error('SchoolProvider is required'); return value; }
