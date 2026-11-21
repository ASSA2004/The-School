import {RoleOpening, SuperAdminWorkspace} from './src/SuperAdmin';
import React, { useEffect } from 'react';
import { ActivityIndicator, Image, BackHandler, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import { SchoolProvider, useSchool, Page } from './src/store';
import { Avatar, Copy, Icon, IconButton, IconName, useUiStyles } from './src/ui';
import { useTheme } from './src/theme';
import { Screen } from './src/screens';
const navIcons: Partial<Record<Page, IconName>> = { Home: 'home-outline', Events: 'sparkles-outline', People: 'people-outline', Class: 'book-outline', Schedule: 'calendar-outline', Operations: 'grid-outline', Profile: 'person-outline' };
function Shell() { const t = useTheme(); const styles = useShellStyles();
  const app = useSchool();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const tablet = width >= 760;
  const [fontsLoaded, fontError] = useFonts({ PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold });
  useEffect(() => { const sub = BackHandler.addEventListener('hardwareBackPress', () => { if (app.route.name === 'Home') return false; app.back(); return true; }); return () => sub.remove(); }, [app.route]);
  const nav: Page[] = app.role === 'Principal' || app.role === 'Coordinator' ? ['Home','Events','Class','Schedule','Operations'] : ['Home','Events','Class','Schedule','Profile'];
  const selected = nav.includes(app.route.name) ? app.route.name : ['Attendance','Marks','Homework'].includes(app.route.name) ? 'Class' : app.route.name === 'Approvals' ? 'Operations' : 'Home';
  if (!app.ready || (!fontsLoaded && !fontError)) return <View style={{flex:1,backgroundColor:'#F6F5EF',justifyContent:'center',alignItems:'center'}}><Image source={require('./assets/splash.png')} style={{width:120,height:120}} accessibilityLabel="SCHOOL" /></View>;
  if(!app.entered)return <RoleOpening/>;
  if(app.role==='Super Admin')return <SuperAdminWorkspace/>;
  const navigation = <View style={[styles.nav, tablet && styles.rail]}>{nav.map(name => <Pressable accessibilityRole="tab" accessibilityLabel={name} accessibilityState={{ selected: selected === name }} key={name} onPress={() => app.go(name)} style={({ pressed }) => [styles.navItem, tablet && { justifyContent: 'flex-start', paddingHorizontal: 18 }, selected === name && { backgroundColor: t.white }, pressed && { opacity: .75 }]}><Icon name={navIcons[name]!} color={selected === name ? t.ink : t.tint} size={21} />{(selected === name || tablet) && <Copy bold size={11} style={{ color: selected === name ? t.ink : t.tint }}>{name}</Copy>}</Pressable>)}</View>;
  return <LinearGradient colors={[t.canvas,t.pale,t.white]} locations={[0,.45,1]} style={{ flex: 1 }}><StatusBar style="dark" /><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, paddingTop: insets.top }}><View style={{ flex: 1, flexDirection: 'row', maxWidth: 1280, width: '100%', alignSelf: 'center' }}>
    {tablet && <View style={{ width: 205, padding: 22, gap: 35 }}><View style={{ gap: 8, paddingVertical: 20 }}><Icon name="school-outline" size={28} color={t.greenText} /><Copy size={22} bold>SCHOOL</Copy><Copy size={11} muted>One connected school.</Copy></View>{navigation}<Copy size={10} muted>Sample school · UI preview</Copy></View>}
    <View style={{ flex: 1 }}><View style={[styles.header, { paddingHorizontal: tablet ? 32 : 20 }]}>
      {app.route.name === 'Home' ? <><Pressable accessibilityRole="button" accessibilityLabel="Open profile and switch demo role" onPress={() => app.go('Profile')}><Avatar name={app.role === 'Parent' ? 'Meena' : app.role === 'Principal' ? 'Principal' : app.role === 'Coordinator' ? 'Priya' : 'Anitha'} dark /></Pressable><View style={{ flex: 1 }}><Copy muted size={11}>Good morning</Copy><Copy size={17} bold>{app.role === 'Parent' ? 'Meena' : app.role === 'Principal' ? 'Principal' : app.role === 'Coordinator' ? 'Priya' : 'Anitha'}</Copy></View><IconButton name="notifications-outline" label="Notifications" onPress={() => app.go('Notifications')} /></> : <><IconButton name="chevron-back" label="Go back" onPress={app.back} /><View style={{ flex: 1, alignItems: 'center' }}><Copy bold size={17}>{app.route.name === 'Editor' ? app.route.mode : app.route.name === 'Detail' ? 'Details' : app.route.name}</Copy></View><IconButton name="person-outline" label="Profile" onPress={() => app.go('Profile')} /></>}
    </View><ScrollView key={`${app.role}-${app.route.name}-${app.route.id ?? ''}-${app.route.mode ?? ''}`} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: tablet ? 32 : 20, paddingTop: 8, paddingBottom: tablet ? 36 : 110 + insets.bottom, gap: 16 }}><Screen /></ScrollView>
    {!tablet && <View style={{ position: 'absolute', bottom: Math.max(insets.bottom, 14), left: 16, right: 16 }}>{navigation}</View>}
    {!!app.notice && <Pressable accessibilityRole="button" accessibilityLabel={`${app.notice} Dismiss`} accessibilityLiveRegion="polite" onPress={() => app.notify('')} style={[styles.notice, { bottom: tablet ? 20 : 90 + insets.bottom }]}><Copy size={12} style={{ color: t.white, flex: 1 }}>{app.notice}</Copy><Icon name="close" color={t.white} size={18} /></Pressable>}
    </View></View></KeyboardAvoidingView></LinearGradient>;
}
export default function App() { return <SafeAreaProvider><SchoolProvider><Shell /></SchoolProvider></SafeAreaProvider>; }
function useShellStyles() { const t = useTheme(); return React.useMemo(() => StyleSheet.create({
  header: { minHeight: 83, flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 14 },
  nav: { backgroundColor: t.ink, borderRadius: 999, padding: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 2, shadowColor: t.ink, shadowOpacity: .16, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  navItem: { minHeight: 48, minWidth: 44, paddingHorizontal: 11, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  rail: { flexDirection: 'column', alignItems: 'stretch', borderRadius: 28, gap: 8, padding: 8 },
  notice: { position: 'absolute', left: 20, right: 20, padding: 16, backgroundColor: t.ink, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
}), [t]); }
