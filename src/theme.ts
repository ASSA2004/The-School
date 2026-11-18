import type { Role } from './domain';
import { useSchool } from './store';

const base = {
  ink: '#14210F', muted: '#58664F', green: '#4C9A12', greenText: '#326A12',
  tint: '#E6F4DC', pale: '#F3F9EC', white: '#FFFFFF', card: 'rgba(255,255,255,0.90)',
  peach: '#FDE9DD', butter: '#FBF4D2', sky: '#DDEEF8', mint: '#E0F4E6',
  danger: '#9B352D', dangerTint: '#FCE8E5', warning: '#6B5A10',
  regular: 'PlusJakartaSans_400Regular', medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold', bold: 'PlusJakartaSans_700Bold',
  radius: 26, space: 16,
} as const;

// Keep status colors consistent; only the role identity palette changes.
const palettes = {
  Principal: { ink: '#10243B', muted: '#50647A', green: '#397BCB', greenText: '#245B99', tint: '#DFECFA', pale: '#F0F6FD', canvas: '#DCEBFA' },
  Coordinator: { ink: '#29183F', muted: '#685773', green: '#8A5CC7', greenText: '#684095', tint: '#EDE3F8', pale: '#F7F2FC', canvas: '#EADDF8' },
  'In-charge Teacher': { ink: '#382114', muted: '#755F4F', green: '#D67B26', greenText: '#995315', tint: '#FCE8D5', pale: '#FFF6ED', canvas: '#FAE4CE' },
  Teacher: { ink: '#302A10', muted: '#6B6243', green: '#C7A21C', greenText: '#76600B', tint: '#F8EFC6', pale: '#FFFAE9', canvas: '#F7EDBC' },
  Parent: { ink: base.ink, muted: base.muted, green: base.green, greenText: base.greenText, tint: base.tint, pale: base.pale, canvas: '#E3F3D8' },
} satisfies Record<Role, Record<'ink' | 'muted' | 'green' | 'greenText' | 'tint' | 'pale' | 'canvas', string>>;
export const roleThemes = Object.fromEntries(Object.entries(palettes).map(([role, palette]) => [role, { ...base, ...palette }])) as Record<Role, Omit<typeof base, keyof typeof palettes.Parent> & typeof palettes.Parent>;
export type Theme = typeof roleThemes[Role];
export function useTheme(): Theme { return roleThemes[useSchool().role]; }
