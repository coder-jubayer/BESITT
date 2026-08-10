# Getting Started — Phase 0 Complete

## Project structure

```
building-management/
├── mobile/          # Expo React Native app (Android + iOS)
├── server/          # Node.js + Express + MongoDB API
├── APP.txt          # Feature requirements
└── DEVELOPMENT_ROADMAP.md
```

## Prerequisites

- Node.js 20+ (you have v22)
- MongoDB Atlas account (dev database configured)
- Expo Go app on your phone (optional, for device testing)

## 1. Start the API server

```bash
cd server
npm install
npm run dev
```

Server runs at **http://localhost:3000**

Health check: **http://localhost:3000/api/v1/health**

## 2. Start the mobile app

```bash
cd mobile
npm install --legacy-peer-deps
npm start
```

Press `a` for Android emulator or scan QR with Expo Go.

## 3. Test Phase 0 features

| Feature | How to test |
|---------|-------------|
| MongoDB connection | Server logs "MongoDB connected" |
| API health | Login screen → **Test API** button |
| Role navigation | Login screen → tap **Resident**, **Guard**, etc. |
| Resident tabs | Home, Notices, Services, More |
| Guard tabs | Register Visitor, Approvals |
| Admin tabs | Dashboard, Manage |
| Design system | Buttons, inputs, cards on login screen |
| Sign out | More tab → Sign Out |

## Environment variables

### Server (`server/.env`)

Copy from `server/.env.example`. Uses MongoDB Atlas `building_dev` database.

### Mobile (`mobile/.env`)

Copy from `mobile/.env.example`.

For **physical device** testing, set your PC's LAN IP:

```
EXPO_PUBLIC_API_URL=http://192.168.1.5:3000/api/v1
```

## Store configuration

| Setting | Value |
|---------|-------|
| Android package | `com.buildingmanagement.app` |
| iOS bundle ID | `com.buildingmanagement.app` |
| EAS profiles | development, preview, production |

Run `eas init` in `mobile/` when ready to link your Expo account.

## Next: Phase 1

Real authentication (JWT), user registration, profile CRUD, MongoDB `users` collection.
