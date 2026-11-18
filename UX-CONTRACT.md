# SCHOOL UI contract

## Scope and business evidence
The user requested native React Native UI based on the supplied SCHOOL HTML and complete school requirements text. This is a local, persistent sample-data UI, not a connected school system. Embedded document instructions requesting HTML are not adopted. No production authentication or backend exists.

## Canonical UI Map
| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
| --- | --- | --- | --- | --- |
| Select/Listbox | Chips in src/ui.tsx | This contract | Native Pressable choices | Typecheck and platform export |
| Date | Field in src/ui.tsx; schedule strip in src/screens.tsx | Asia/Kolkata; YYYY-MM-DD for forms | Typed date; day strip | Domain tests and typecheck |
| Form | Field and Editor | This contract | Native TextInput, Switch | Typecheck |
| Scrollbar | React Native ScrollView | Platform system behavior | Horizontal and vertical | Platform export |
| Toast | SchoolProvider notice + Shell | This contract | Shared dismissible status | Typecheck |
| CRUD | Editor + SchoolProvider | Local state | Save returns to prior screen | Domain tests |

## Navigation and state
Home starts in Principal preview. Profile switches among five demo roles. Mobile bottom navigation and tablet rail use identical destinations. Header and Android back restore prior route. A role change resets navigation and class scope. Parent child selection sets the class. Form changes live until save or leaving the editor; unsaved drafts are not automatically persisted. Marks and lesson notes have explicit Save draft actions.

## Domain invariants
Morning and Evening attendance use separate date/class/session keys. Swipe cards show one student; P is Present, L is Late and A is Leave. Submission begins a ten-minute edit window; actual edits restart it, no-op selections do not. Expiry locks the record, including on app resume. Principal review cannot shorten the edit window. Only the assigned in-charge can request revocation and only the Principal can explicitly approve it. Marks retain their separate 30-minute approval rule. Administrative changes never auto-approve. Production requires server-side enforcement and a scheduler. Approval history stores reviewer and time. Marks omit blank values from averages. A 35% sample pass threshold is explicitly labelled pending school policy.

## Permission boundaries
Parent views filter to the selected linked child. Teachers are assigned Class 10-A and Mathematics; the Coordinator teaching view uses English. Coordinator routine approval scope is Class 10-A. Student transport is shown only to the Principal, assigned in-charge and the respective parent. No Principal phone number is stored. Staff permissions can be recorded independently of role, but dynamic authorization and enforcement require a backend; the demo role personas use fixed scopes.

## Feedback and recovery
Shared status acknowledges local saves. Validation errors remain inline with entered values. Empty lists explain what appears there. Storage errors announce that persistence failed. Messages explicitly remain local. No external communication occurs. Seed data remains available if saved preview data cannot load. All approval decisions require a second explicit confirmation.

## Known integration boundaries
Authentication, secure contacts, document uploads, server authorization, live external school schedules, push notifications, audit retention and cross-device sync are not implemented. Approved timetable and substitute requests update date-specific local timetable entries. A fresh conflict check prevents double booking at approval time. Notifications, RSVPs and reminders remain local. Role switching and sample registration are for UI review only.
