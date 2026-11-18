# SCHOOL — React Native UI

A native Expo app based on the supplied SCHOOL HTML: pale green gradients, rounded cards, progress rings, Plus Jakarta Sans and floating dark navigation. Uses native views, inputs and SVG; no HTML WebView.

## Run

```sh
npm install
npm start
```

Open the QR code with a compatible Expo Go SDK 58 client, or use a development build. Keep your phone and computer on the same Wi-Fi when using the local QR code. `npm run android` opens an installed Android emulator. iOS simulator requires macOS. `npm run web` provides an optional browser build. Dependencies are locked in `package-lock.json`.

## Explore

The app starts as Principal. Open the avatar/Profile to switch roles. It includes Principal, Coordinator (Teachers / Duties), In-charge Teacher, Teacher and Parent views. Mobile layouts use bottom navigation; tablets use a rail and wider dashboard columns.

- Quick Actions lead every home screen; Events is a permanent tab for every role.
- Mark attendance with swipe cards: Present, Late or Leave. Morning and Evening are separate. Submitting starts a ten-minute edit window; each actual edit resets it. Expiry locks the session. Only an in-charge revocation approved by the Principal reopens it.
- Browse monthly attendance calendars, meeting RSVPs and published examination timetables.
- Explore Grades 6–12, Sections A/B, an eight-period master timetable, conflict detection and substitute approval.
- Sample history includes 210 students, exactly 40 staff (5 coordinators, 10 dedicated in-charges and 25 teachers), weekday attendance from June 1, unit/quarterly marks, holidays and events.
- Enter marks, save drafts, submit changes and inspect original/proposed values. Parent views show only published marks, with missing subjects displayed as a dash.
- Switch Kaviya/Rahul in Parent views. Mark homework done/not done.
- Browse class members, profiles, schedules, published lesson notes, events and local messages.
- Register students with optional transport; register staff and record individual permissions.
- Prepare timetable, substitute, exam, event and circular requests; inspect approval history.

Sample changes persist locally. No real student data, login, server, phone calls or externally delivered messages are included. A running app or next launch applies expired review windows; reliable background approval needs a server. Staff permission settings are recorded for UI review, while demo personas use fixed access scopes. Schedules and substitute availability are calculated from the local simulated timetable. Contact/document integrations are explicitly left for the secure backend.

## Checks

```sh
npm run typecheck
npm test
npm run build
```

Source: `App.tsx` owns the responsive shell; `src/screens.tsx` contains screens; `src/ui.tsx` owns reusable controls; `src/theme.ts` owns visual tokens; `src/domain.ts` owns approval and visibility rules; `src/store.tsx` owns local state and persistence.
