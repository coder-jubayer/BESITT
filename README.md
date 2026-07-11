# Building Management System

Cross-platform mobile app (Android & iOS) for residential building / society management.

## Modules

1. Authentication
2. Notice & Circular
3. Monthly Expense Management
4. Amenity Booking
5. Marketplace
6. Election Voting
7. Smart Guest Approval
8. Emergency & Utility Directory
9. Complaint & Maintenance

## Stack

| Layer | Technology |
|-------|------------|
| Mobile | React Native + Expo (TypeScript) |
| Backend | Node.js + Express |
| Database | MongoDB |
| Push notifications | Expo Push Notifications |
| Real-time | Socket.io |
| Image storage | Server disk |

## Project structure (planned)

```
building-management/
├── mobile/          # Expo React Native app
├── server/          # Node.js API + MongoDB
└── docs/            # Privacy policy, store assets
```

See [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) for the full build plan.

## User roles

- Resident
- Security Guard
- Treasurer
- Committee / Admin
- Manager
