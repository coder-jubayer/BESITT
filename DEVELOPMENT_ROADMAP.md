# Building Management System — Development Roadmap

> **Goal:** Production-ready cross-platform mobile apps (Android + iOS) for Google Play & App Store, built with **React Native + Expo**, using **free-tier backend services**, with industry-standard architecture and performance.

---

## Table of Contents

1. [Product Scope](#1-product-scope)
2. [Recommended Architecture](#2-recommended-architecture)
3. [Tech Stack (Free & Store-Ready)](#3-tech-stack-free--store-ready)
4. [Project Structure](#4-project-structure)
5. [Development Phases (Step-by-Step)](#5-development-phases-step-by-step)
6. [Module Implementation Order](#6-module-implementation-order)
7. [Role-Based Access Plan](#7-role-based-access-plan)
8. [Backend & Data Model Overview](#8-backend--data-model-overview)
9. [Performance & Quality Standards](#9-performance--quality-standards)
10. [App Store & Play Store Readiness](#10-app-store--play-store-readiness)
11. [Cost Summary (Free vs Required Paid)](#11-cost-summary-free-vs-required-paid)
12. [Execution Checklist](#12-execution-checklist)

---

## 1. Product Scope

Based on `APP.txt`, the system includes **9 core modules** and **4 user roles** across **3 client surfaces**:

| Surface | Users | Platform |
|---------|-------|----------|
| Resident Mobile App | Residents | Android + iOS |
| Security Guard Mobile App | Guards | Android + iOS |
| Admin / Manager Web Panel | Committee, Treasurer, Manager | Web (Phase 2 — separate from mobile roadmap) |

### Core Modules

| # | Module | Primary Users |
|---|--------|---------------|
| 1 | Authentication | All |
| 2 | Notice & Circular | Committee → Residents |
| 3 | Monthly Expense Management | Treasurer → Residents |
| 4 | Amenity Booking | Residents |
| 5 | Marketplace | Residents |
| 6 | Election Voting | Committee → Residents |
| 7 | Smart Guest Approval | Guard ↔ Residents |
| 8 | Emergency & Utility Directory | Residents |
| 9 | Complaint & Maintenance | Residents ↔ Manager |

---

## 2. Recommended Architecture

### Mobile Strategy: **One Codebase, Role-Based Experience**

Instead of building 2–3 separate native apps, use **one React Native app** with role-based navigation after login:

```
┌─────────────────────────────────────────────────────┐
│              React Native + Expo App                │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Resident │  │  Guard   │  │ Admin/Committee  │  │
│  │   Tabs   │  │   Tabs   │  │  (Mobile Lite)   │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │ REST / Realtime
┌──────────────────────▼──────────────────────────────┐
│           Firebase (Free Spark Tier)                │
│  Auth │ Firestore │ Storage │ FCM │ Cloud Functions │
└─────────────────────────────────────────────────────┘
```

**Why this approach:**
- Single codebase → half the maintenance, one Play Store + one App Store listing
- Guards and residents share auth, notifications, and building context
- Admin web panel can be added later (React web app sharing Firebase backend)
- Meets store requirements for both platforms via Expo EAS

**Alternative (only if business requires):** Separate Guard app as a second store listing — same codebase, different `app.json` flavor/build profile.

---

## 3. Tech Stack (Free & Store-Ready)

| Layer | Choice | Why | Cost |
|-------|--------|-----|------|
| Mobile framework | **Expo SDK 52+** (React Native) | Store builds, OTA updates, push, camera, deep links | Free |
| Language | **TypeScript** | Type safety, industry standard | Free |
| Navigation | **Expo Router** (file-based) | Deep linking, store-friendly URLs | Free |
| Backend | **Firebase** (Spark plan) | Auth, DB, storage, push, serverless | Free tier |
| Auth | **Firebase Auth** | Email/password, password reset | Free tier |
| Database | **Cloud Firestore** | Realtime, offline, scalable | Free tier |
| File storage | **Firebase Storage** | Complaint images, marketplace photos | Free tier |
| Push notifications | **Expo Notifications + FCM/APNs** | Notice alerts, guest approval | Free |
| Server logic | **Cloud Functions** (minimal) | Double-booking prevention, vote integrity | Free tier |
| State (client) | **Zustand** + **TanStack Query** | Lightweight, cache, offline | Free |
| Forms & validation | **React Hook Form + Zod** | Robust forms | Free |
| UI | **NativeWind** (Tailwind) or **React Native Paper** | Professional UI, fast iteration | Free |
| Images | **expo-image** | Performance, caching | Free |
| QR / OTP | **expo-camera** + **react-native-qrcode-svg** | Guest pre-approval | Free |
| Builds & submit | **EAS Build + EAS Submit** | Play Store & App Store binaries | Free tier (limited builds/month) |
| Analytics (optional) | **Firebase Analytics** | Usage insights | Free |
| Crash reporting | **Firebase Crashlytics** via Expo | Production stability | Free |

### Store Account Requirements (Not Avoidable)

| Store | One-Time / Annual Fee |
|-------|----------------------|
| Google Play Console | $25 one-time |
| Apple Developer Program | $99/year |

Everything else in this stack can run on free tiers for early production.

---

## 4. Project Structure

```
building-management/
├── app/                          # Expo Router screens
│   ├── (auth)/                   # Login, forgot password
│   │   ├── login.tsx
│   │   └── forgot-password.tsx
│   ├── (resident)/               # Resident tab navigator
│   │   ├── home.tsx
│   │   ├── notices/
│   │   ├── expenses/
│   │   ├── amenities/
│   │   ├── marketplace/
│   │   ├── elections/
│   │   ├── guests/
│   │   ├── emergency/
│   │   └── complaints/
│   ├── (guard)/                  # Guard tab navigator
│   │   ├── visitors/
│   │   └── approvals/
│   ├── (admin)/                  # Committee/Treasurer mobile views
│   │   ├── notices/manage/
│   │   ├── expenses/manage/
│   │   └── elections/manage/
│   ├── profile.tsx
│   └── _layout.tsx               # Auth gate + role router
├── src/
│   ├── components/               # Reusable UI
│   ├── hooks/                    # useAuth, useNotices, etc.
│   ├── services/                 # Firebase API layer
│   │   ├── auth.service.ts
│   │   ├── notices.service.ts
│   │   ├── expenses.service.ts
│   │   └── ...
│   ├── stores/                   # Zustand stores
│   ├── types/                    # TypeScript interfaces
│   ├── utils/                    # Helpers, formatters
│   ├── constants/                # Categories, roles, config
│   └── theme/                    # Colors, typography
├── assets/                       # Icons, splash, fonts
├── firebase/                     # Security rules, indexes
│   ├── firestore.rules
│   ├── storage.rules
│   └── firestore.indexes.json
├── functions/                    # Cloud Functions (Node.js)
├── app.json                      # Expo config (bundle IDs)
├── eas.json                      # Build profiles (dev/preview/production)
├── .env.example
└── package.json
```

### Bundle IDs (set once, used for stores)

| Platform | Example ID |
|----------|------------|
| Android | `com.yourorg.buildingmanagement` |
| iOS | `com.yourorg.buildingmanagement` |

Use the **same reverse-DNS ID** on both stores.

---

## 5. Development Phases (Step-by-Step)

This is the **master sequence** we will follow. Each phase produces a testable, shippable increment.

---

### PHASE 0 — Foundation & Tooling (Week 1)

**Objective:** Repo, Expo project, Firebase project, store-ready config.

| Step | Task | Deliverable |
|------|------|-------------|
| 0.1 | Install Node.js LTS, Git, Android Studio, Xcode (Mac for iOS builds) | Dev environment ready |
| 0.2 | Create Expo app: `npx create-expo-app@latest building-management -t tabs` | Base project |
| 0.3 | Add TypeScript strict mode, ESLint, Prettier | Code quality baseline |
| 0.4 | Create Firebase project (Auth, Firestore, Storage, Functions) | Firebase console |
| 0.5 | Connect Firebase to Expo (`@react-native-firebase` or Firebase JS SDK + config) | Auth/Firestore working |
| 0.6 | Configure `app.json`: name, slug, icon, splash, `android.package`, `ios.bundleIdentifier` | Store metadata |
| 0.7 | Create `eas.json` with `development`, `preview`, `production` profiles | EAS ready |
| 0.8 | Set up Expo Router with `(auth)` and role groups | Navigation skeleton |
| 0.9 | Define design system (colors, spacing, typography, Button, Input, Card) | UI kit |
| 0.10 | Create `.env.example` for Firebase keys (never commit secrets) | Env template |

**Exit criteria:** App launches on Android emulator + iOS simulator; Firebase connected; blank role-based shell after mock login.

---

### PHASE 1 — Authentication & User Profile (Week 2)

**Module:** #1 Authentication

| Step | Task | Details |
|------|------|---------|
| 1.1 | Firebase Auth: email/password sign-in | Login screen |
| 1.2 | Forgot password flow | Email reset link |
| 1.3 | Firestore `users` collection | Fields: `uid`, `name`, `email`, `phone`, `role`, `unitNumber`, `buildingId`, `fcmToken`, `createdAt` |
| 1.4 | Role enum: `resident`, `guard`, `treasurer`, `committee`, `manager`, `admin` | RBAC foundation |
| 1.5 | Auth context + secure session persistence | Auto-login |
| 1.6 | Profile screen: view/edit name, phone, unit | Read/update profile |
| 1.7 | Post-login role router | Redirect to `(resident)` / `(guard)` / `(admin)` |
| 1.8 | Firestore security rules: users read own doc; admin manages | Security baseline |
| 1.9 | Register FCM token on login | Push foundation |

**Exit criteria:** Login, logout, forgot password, profile edit, role-based home screen.

---

### PHASE 2 — Notice & Circular (Week 3)

**Module:** #2 Notice & Circular

| Step | Task | Details |
|------|------|---------|
| 2.1 | Firestore `notices` collection | `title`, `body`, `buildingId`, `createdBy`, `createdAt`, `attachments[]` |
| 2.2 | Admin: create/edit/delete notice (mobile admin section) | Committee role |
| 2.3 | Resident: notice list + detail screen | Paginated, pull-to-refresh |
| 2.4 | Push notification on new notice | Cloud Function → FCM |
| 2.5 | Mark notice as read (optional `noticeReads` subcollection) | Unread badge |
| 2.6 | Security rules: committee write; residents read own building | RBAC |

**Exit criteria:** Committee posts notice → residents see it + receive push.

---

### PHASE 3 — Monthly Expense Management (Week 4)

**Module:** #3 Monthly Expense Management

| Step | Task | Details |
|------|------|---------|
| 3.1 | Firestore `expenses` collection | `month`, `year`, `buildingId`, `category`, `amount`, `note`, `addedBy` |
| 3.2 | Expense categories constant | Guard Salary, Cleaner Salary, Manager Salary, Generator, Lift, Electricity, WASA, Other |
| 3.3 | Treasurer: add/edit expense form | Category picker, amount validation |
| 3.4 | Resident: monthly summary screen | Total + month selector |
| 3.5 | Resident: category breakdown chart | Simple bar/pie (react-native-chart-kit or similar) |
| 3.6 | Security rules: treasurer/committee write; residents read | RBAC |

**Exit criteria:** Treasurer logs expenses; residents view summary and breakdown.

---

### PHASE 4 — Amenity Booking (Week 5)

**Module:** #4 Amenity Booking

| Step | Task | Details |
|------|------|---------|
| 4.1 | Firestore `amenities` + `bookings` | Amenities: Guest Parking, Pool, Hall, Table Tennis, Billiard |
| 4.2 | Define slot model | `amenityId`, `date`, `startTime`, `endTime`, `userId`, `status` |
| 4.3 | Resident: view amenities list | |
| 4.4 | Resident: calendar/time slot picker | Show available vs booked |
| 4.5 | **Cloud Function: atomic booking** | Transaction to prevent double booking |
| 4.6 | Resident: my bookings + cancel | |
| 4.7 | Admin: amenity schedule config (optional hours/blackouts) | Committee |

**Exit criteria:** Book slot; second user cannot book same slot; booking list works.

---

### PHASE 5 — Marketplace (Week 6)

**Module:** #5 Marketplace

| Step | Task | Details |
|------|------|---------|
| 5.1 | Firestore `listings` collection | `title`, `description`, `price`, `images[]`, `sellerId`, `contactPhone`, `status` |
| 5.2 | Firebase Storage for listing images | Compress before upload (`expo-image-manipulator`) |
| 5.3 | Create listing form | Multi-image picker |
| 5.4 | Browse listings (grid/list) | Filter, search |
| 5.5 | Listing detail + contact seller | `Linking.openURL('tel:...')` or WhatsApp |
| 5.6 | My listings: edit, mark sold, delete | |
| 5.7 | Security rules: seller owns listing; residents read building listings | |

**Exit criteria:** Full CRUD listings with images; contact flow works.

---

### PHASE 6 — Election Voting (Week 7)

**Module:** #6 Election Voting

| Step | Task | Details |
|------|------|---------|
| 6.1 | Firestore `elections`, `candidates`, `votes` | Election: title, startDate, endDate, showResults, buildingId |
| 6.2 | Admin: create election + add candidates | Committee |
| 6.3 | Resident: view active elections + candidates | |
| 6.4 | **Cloud Function: cast vote** | One vote per user per election (enforced server-side) |
| 6.5 | Results screen (if `showResults` enabled) | Live count |
| 6.6 | Close election automatically after `endDate` | Scheduled function or client check + rules |

**Exit criteria:** Vote once only; results accurate; admin manages elections.

---

### PHASE 7 — Smart Guest Approval (Week 8)

**Module:** #7 Smart Guest Approval

| Step | Task | Details |
|------|------|---------|
| 7.1 | Firestore `visitors` collection | name, phone, purpose, residentId, unitNumber, status, timestamps |
| 7.2 | Guard: register visitor + send approval request | Push to resident |
| 7.3 | Resident: approve/deny notification + in-app | Realtime listener |
| 7.4 | Guard: view approval status list | Pending / approved / denied |
| 7.5 | Resident**: pre-approve guest** | Generate QR code or OTP |
| 7.6 | Guard: scan QR or verify OTP | Fast check-in |
| 7.7 | Guest history for residents | Paginated list |
| 7.8 | Push notifications for all state changes | |

**Exit criteria:** End-to-end visitor flow with realtime status and pre-approval.

---

### PHASE 8 — Emergency & Utility Directory (Week 9)

**Module:** #8 Emergency & Utility Directory

| Step | Task | Details |
|------|------|---------|
| 8.1 | Firestore `emergencyContacts` | name, role, phone, buildingId, order |
| 8.2 | Default contacts seed | Fire, Police, Manager, Guard, Gas, Welfare |
| 8.3 | Admin: manage contacts | CRUD |
| 8.4 | Resident: directory list with one-tap call | `Linking.openURL('tel:...')` |
| 8.5 | Optional: quick-dial favorites | Local preference |

**Exit criteria:** Directory visible; tap-to-call works on device.

---

### PHASE 9 — Complaint & Maintenance (Week 10)

**Module:** #9 Complaint & Maintenance

| Step | Task | Details |
|------|------|---------|
| 9.1 | Firestore `complaints` + `complaintComments` | category, description, images[], status, assignedTo |
| 9.2 | Status flow | `open` → `in_progress` → `resolved` → `closed` |
| 9.3 | Resident: create complaint + upload images/video | Storage |
| 9.4 | Resident: track status + view manager comments | |
| 9.5 | Manager: complaint inbox + update status + reply | |
| 9.6 | Push on status change / new comment | |
| 9.7 | Categories constant | Plumbing, Electrical, Lift, Security, Other |

**Exit criteria:** Full ticket lifecycle with media and two-way comments.

---

### PHASE 10 — Polish, Performance & Offline (Week 11)

| Step | Task | Details |
|------|------|---------|
| 10.1 | Enable Firestore offline persistence | Works without network |
| 10.2 | Image lazy loading + list virtualization (`FlashList`) | Smooth scrolling |
| 10.3 | Error boundaries + user-friendly error states | |
| 10.4 | Loading skeletons + empty states | Professional UX |
| 10.5 | Accessibility: labels, contrast, font scaling | Store quality |
| 10.6 | Deep linking for notifications | Open correct screen |
| 10.7 | App icon, splash, store screenshots | Branding |

**Exit criteria:** App feels fast; handles offline gracefully; no jank on lists.

---

### PHASE 11 — Testing & QA (Week 12)

| Step | Task | Details |
|------|------|---------|
| 11.1 | Unit tests for utils, validators, services | Jest |
| 11.2 | Integration tests for auth + booking + voting | Critical paths |
| 11.3 | Test on real Android devices (multiple API
) | |
| 11.4 | Test on real iPhone (multiple iOS versions) | |
| 11.5 | Test all roles: resident, guard, treasurer, committee, manager | |
| 11.6 | Security rules audit | Firebase emulator |
| 11.7 | Performance profiling (React DevTools, Flipper) | |
| 11.8 | Fix all P0/P1 bugs | |

**Exit criteria:** Zero critical bugs; all modules pass QA matrix.

---

### PHASE 12 — Store Submission (Week 13)

See [Section 10](#10-app-store--play-store-readiness) for full checklist.

| Step | Task |
|------|------|
| 12.1 | Production EAS build (Android AAB + iOS IPA) |
| 12.2 | Google Play: create app, content rating, privacy policy, Data safety form |
| 12.3 | App Store: App Store Connect, privacy nutrition labels, screenshots |
| 12.4 | Internal testing → closed testing → production (Play) |
| 12.5 | TestFlight → App Store review (iOS) |
| 12.6 | Monitor Crashlytics + reviews post-launch |

**Exit criteria:** App live on both stores.

---

## 6. Module Implementation Order

Priority order balances **dependencies** and **user value**:

```
Phase 0: Foundation
    ↓
Phase 1: Auth (blocks everything)
    ↓
Phase 2: Notices (high visibility, validates push)
    ↓
Phase 8: Emergency Directory (quick win, low complexity)
    ↓
Phase 3: Expenses
    ↓
Phase 9: Complaints
    ↓
Phase 7: Guest Approval (guard + resident, high value)
    ↓
Phase 4: Amenity Booking (needs Cloud Functions)
    ↓
Phase 5: Marketplace
    ↓
Phase 6: Elections (needs secure Cloud Functions)
    ↓
Phase 10–12: Polish → QA → Store
```

---

## 7. Role-Based Access Plan

| Feature | Resident | Guard | Treasurer | Committee | Manager |
|---------|:--------:|:-----:|:---------:|:---------:|:-------:|
| Login / Profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| View notices | ✅ | ✅ | ✅ | ✅ | ✅ |
| Post notices | ❌ | ❌ | ❌ | ✅ | ✅ |
| View expenses | ✅ | ❌ | ✅ | ✅ | ✅ |
| Add expenses | ❌ | ❌ | ✅ | ✅ | ❌ |
| Book amenities | ✅ | ❌ | ❌ | ✅ | ❌ |
| Marketplace | ✅ | ❌ | ❌ | ❌ | ❌ |
| Vote | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage elections | ❌ | ❌ | ❌ | ✅ | ❌ |
| Register visitors | ❌ | ✅ | ❌ | ❌ | ❌ |
| Approve visitors | ✅ | ❌ | ❌ | ❌ | ❌ |
| Emergency directory | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage directory | ❌ | ❌ | ❌ | ✅ | ✅ |
| Submit complaints | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage complaints | ❌ | ❌ | ❌ | ✅ | ✅ |

Implement via:
1. **Firestore security rules** (authoritative)
** server)
2. **Client-side navigation guards** (hide unauthorized UI)
3. **Custom claims** on Firebase Auth tokens for role (optional, recommended at scale)

---

## 8. Backend & Data Model Overview

### Firestore Collections

```
buildings/{buildingId}
users/{userId}
notices/{noticeId}
expenses/{expenseId}
amenities/{amenityId}
bookings/{bookingId}
listings/{listingId}
elections/{electionId}
  └── candidates/{candidateId}
  └── votes/{voteId}          # doc id = userId (one vote enforced)
visitors/{visitorId}
emergencyContacts/{contactId}
complaints/{complaintId}
  └── comments/{commentId}
```

### Cloud Functions (Minimal, Critical Only)

| Function | Purpose |
|----------|---------|
| `onNoticeCreated` | Send push to building residents |
| `createBooking` | Atomic slot reservation |
| `castVote` | Enforce one vote per election |
| `onVisitorRequest` | Push resident for approval |
| `onComplaintUpdate` | Notify resident of status change |

Keep business logic that **must not be bypassed** on the server; everything else can be direct Firestore reads/writes with rules.

---

## 9. Performance & Quality Standards

| Area | Standard |
|------|----------|
| App launch | < 3 seconds cold start on mid-range device |
| List scrolling | 60 FPS using `FlashList` for long lists |
| Images | WebP/compressed, cached via `expo-image` |
| Offline | Core read screens work offline (Firestore cache) |
| Bundle size | Monitor with EAS; lazy-load heavy screens |
| API | Realtime listeners only where needed; unsubscribe on unmount |
| Memory | No memory leaks from listeners; cleanup in `useEffect` |
| TypeScript | Strict mode, no `any` in services layer |
| Security | All Firestore/Storage rules tested in emulator |

---

## 10. App Store & Play Store Readiness

### Required Assets

| Asset | Android | iOS |
|-------|---------|-----|
| App icon | 512×512 PNG | 1024×1024 PNG |
| Feature graphic | 1024×500 | — |
| Screenshots | Phone + tablet | 6.7", 6.5", 5.5" iPhone |
| Privacy policy URL | Required | Required |
| Short description | 80 chars | Subtitle 30 chars |
| Full description | 4000 chars | 4000 chars |

### Legal & Compliance

- [ ] **Privacy Policy** (host free on GitHub Pages or Firebase Hosting)
- [ ] **Terms of Service** (recommended)
- [ ] **Data Safety form** (Google): declare Firebase data collection
- [ ] **App Privacy labels** (Apple): contact info, photos, identifiers
- [ ] **Content rating questionnaire** (both stores)
- [ ] **Export compliance** (iOS): typically "No encryption" or standard exemption for HTTPS-only apps

### `app.json` Store Config Example

```json
{
  "expo": {
    "name": "Building Management",
    "slug": "building-management",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": { "image": "./assets/splash.png", "resizeMode": "contain" },
    "ios": {
      "bundleIdentifier": "com.yourorg.buildingmanagement",
      "buildNumber": "1",
      "supportsTablet": true,
      "infoPlist": {
        "NSCameraUsageDescription": "Scan guest QR codes",
        "NSPhotoLibraryUsageDescription": "Upload complaint and marketplace photos"
      }
    },
    "android": {
      "package": "com.yourorg.buildingmanagement",
      "versionCode": 1,
      "adaptiveIcon": { "foregroundImage": "./assets/adaptive-icon.png" },
      "permissions": ["CAMERA", "READ_EXTERNAL_STORAGE", "VIBRATE"]
    },
    "plugins": [
      "expo-router",
      ["expo-notifications", { "icon": "./assets/notification-icon.png" }]
    ]
  }
}
```

### EAS Build Profiles (`eas.json`)

```json
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "distribution": "internal" },
    "production": { "autoIncrement": true }
  },
  "submit": {
    "production": {
      "android": { "serviceAccountKeyPath": "./google-play-key.json" },
      "ios": { "appleId": "your@email.com", "ascAppId": "1234567890" }
    }
  }
}
```

### Submission Flow

```
Development builds (internal testing)
        ↓
Preview builds (TestFlight + Play Internal Testing)
        ↓
Production builds (EAS Build)
        ↓
EAS Submit → Play Console + App Store Connect
        ↓
Review (1–7 days typical)
        ↓
Live on stores
```

---

## 11. Cost Summary (Free vs Required Paid)

| Item | Cost |
|------|------|
| React Native + Expo | Free |
| Firebase Spark plan | Free (limits apply; sufficient for one building/society) |
| EAS Build free tier | ~15 Android + 15 iOS builds/month |
| GitHub (code hosting) | Free |
| Privacy policy hosting | Free (GitHub Pages) |
| Google Play Console | **$25 one-time** |
| Apple Developer Program | **$99/year** |
| Mac for local iOS testing (optional) | Use EAS cloud builds if no Mac |

**Upgrade path when scaling:** Firebase Blaze (pay-as-you-go), EAS paid plan for more builds, dedicated admin web hosting.

---

## 12. Execution Checklist

Use this as the living tracker when we build:

- [ ] **Phase 0** — Foundation & tooling
- [ ] **Phase 1** — Authentication & profile
- [ ] **Phase 2** — Notice & circular
- [ ] **Phase 3** — Monthly expenses
- [ ] **Phase 4** — Amenity booking
- [ ] **Phase 5** — Marketplace
- [ ] **Phase 6** — Election voting
- [ ] **Phase 7** — Smart guest approval
- [ ] **Phase 8** — Emergency directory
- [ ] **Phase 9** — Complaint & maintenance
- [ ] **Phase 10** — Polish & performance
- [ ] **Phase 11** — Testing & QA
- [ ] **Phase 12** — Store submission

---

## Next Step

When you are ready to start building, we begin with **Phase 0**:

1. Initialize the Expo + TypeScript project in this workspace
2. Create the Firebase project and connect it
3. Set up folder structure, design system, and EAS config
4. Scaffold auth screens and role-based navigation

Say **"Start Phase 0"** and we will implement it in this repository.
