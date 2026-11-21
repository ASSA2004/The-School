---
version: alpha
name: SCHOOL native
colors:
  primary: "#4C9A12"
  primaryText: "#326A12"
  ink: "#14210F"
  muted: "#58664F"
  tint: "#E6F4DC"
  pale: "#F3F9EC"
  white: "#FFFFFF"
  mint: "#E0F4E6"
  peach: "#FDE9DD"
  butter: "#FBF4D2"
  sky: "#DDEEF8"
typography:
  body:
    fontFamily: "Plus Jakarta Sans"
rounded:
  card: "26px"
  tile: "18px"
  pill: "999px"
spacing:
  page: "20px"
  gap: "16px"
components:
  Card:
    borderRadius: "26px"
---
# SCHOOL native design

## Overview
Product UI for school staff who are rushed and parents seeking reassurance. The user's supplied SCHOOL HTML is the visual reference: pale green light, white cards, quiet text, green rings, and a dark floating navigation pill. Preserve that identity rather than introducing a different visual concept.

## Colors
Runtime ownership is `src/theme.ts`; `useTheme()` selects a stable role palette and all shared controls, screen styles and the shell consume it. Principal uses blue, Coordinator violet, In-charge Teacher orange, Teacher yellow, and Parent the original green. Each palette has a pale gradient, tinted surfaces, a darker readable accent and a deep anchor for navigation and buttons. The frontmatter records the original Parent palette. Peach, butter and red retain their status meanings across roles. Light theme only.

## Typography
Bundled Plus Jakarta Sans regular, medium, semibold and bold. Body 13–14, metadata 10–12, titles 16–24, hero values 36. Native text scaling remains enabled. No remote photos or external image dependencies.

## Layout
Phones use one column, 20-unit gutters, 16-unit gaps and a safe-area-aware floating navigation pill. Tablets at 760 use a navigation rail; dashboards split into two columns at 1000. Content caps at 1280. Native ScrollView owns scrolling and retains system scroll indicators.

## Elevation & Depth
Native gradient canvas, translucent white card fill and quiet shadows. Avoid visible borders. Native rendering does not use CSS backdrop filters.

## Shapes
26-unit cards, 18–22-unit inner tiles, fully rounded actions. Interactive targets are at least 44 units except date cells on very narrow phones; those retain 76-unit height.

## Components
`src/filters.tsx` owns class/examination selection and schedule dates. Selected values use compact icon-led fields; editing opens a safe-area-aware bottom sheet with a persistent Apply action. Classes are grouped by grade and section, long lists are searchable, and cancelling preserves the current selection. Schedule uses a stable Monday–Sunday strip, previous/next weeks and Today, with a calendar sheet for arbitrary historical/future dates. Short mutually exclusive choices use a shared segmented track in Chips. All original choices remain available. Historical browsing does not enable past lesson-note editing.

`src/ui.tsx` owns Copy, Card, Title, Button, IconButton, Avatar, Badge, Row, Chips, Ring, Hero, Stat, Field and Empty. Motion is limited to press feedback; no automatic or looping animations. Native inputs and switches own keyboard and accessibility behavior. Illustrative marks use SVG.

## Do's and Don'ts
Prioritize one useful metric per card. Label icons. Preserve whitespace. Keep sample data explicit. Never imply a real message was delivered or that local role switching provides security.

## App identity
Single S monogram, deep green #173D32 and warm cream #F6F5EF. Launcher and favicon contain only the monogram. Splash uses a centered mark without tagline or forced delay. Role colors stay within the app.

## Super Admin workspace
Warm brown identity (#39271F text, #EEDFD1 surfaces, #FAF5EF canvas). Overview prioritizes population, paused access and archive decisions. People, Access and Archive are separate work areas; daily timetables stay in school roles. A role opening screen uses a short fade/slide and respects reduced motion. People use consistent, contrasting initial avatars.
