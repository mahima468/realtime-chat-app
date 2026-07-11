# Realtime Chat App

A real-time chat application with **two frontends** — a **React Native (Expo)**
mobile app and a **React (Vite)** web app — sharing one **Node.js + Express +
Socket.io** backend, with **SQLite** for message persistence.

---

## Features

**Core requirements**
- Send / receive messages instantly over Socket.io (no polling, no refresh needed).
- Chat history persists in SQLite and reloads on refresh/reopen (`GET /api/messages`).
- Message timestamps.
- REST APIs for sending a message and fetching history.
- Graceful handling of connects/disconnects, and of API/socket errors (validation
  errors, dropped connections, failed sends are all surfaced to the UI).

**Bonus features implemented**
- Username-based (dummy) login — no password, just a display name. Persisted
  on the mobile app (via AsyncStorage) with a **Sign out** button; ends the
  session and clears the stored username.
- Typing indicator ("X is typing...").
- Online/offline user presence list, live-updated.
- Message delivery status (`sending` → `sent` → `delivered`) shown under your own
  messages.
- Messages stored in SQLite (`better-sqlite3`), so history survives server restarts.

---

## Project Structure

```
chat-app/
├── backend/
│   ├── src/
│   │   ├── config/db.js            # SQLite connection + schema
│   │   ├── models/messageModel.js  # DB queries for messages
│   │   ├── controllers/messageController.js  # REST handlers
│   │   ├── routes/messageRoutes.js # /api/messages routes
│   │   ├── sockets/socketHandler.js # all Socket.io events
│   │   └── server.js               # app entrypoint
│   ├── .env.example
│   └── package.json
├── frontend/                       # React (Vite) web app
│   ├── src/
│   │   ├── api/api.js              # REST calls (fetch history)
│   │   ├── socket/socket.js        # socket.io-client singleton
│   │   ├── components/             # Login, ChatWindow, MessageBubble,
│   │   │                           # MessageInput, TypingIndicator, UserList
│   │   ├── styles/index.css
│   │   └── App.jsx
│   ├── .env.example
│   └── package.json
└── mobile/                         # React Native (Expo) app
    ├── src/
    │   ├── api/api.js              # REST calls (fetch history)
    │   ├── socket/socket.js        # socket.io-client singleton
    │   ├── theme/colors.js         # design tokens
    │   ├── components/             # Header (incl. Sign out), MessageBubble,
    │   │                           # MessageInput, TypingIndicator
    │   └── screens/                # LoginScreen, ChatScreen
    ├── App.js                      # auth persistence + socket lifecycle
    ├── app.json
    ├── .env.example
    └── package.json
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npm start          # or: npm run dev  (auto-restart with nodemon)
```

The API + Socket.io server starts on **http://localhost:5000**.
A SQLite file is created automatically at `backend/src/db/chat.sqlite` on first run.

**Backend environment variables** (`backend/.env`):

| Variable        | Description                              | Default                  |
|-----------------|-------------------------------------------|---------------------------|
| `PORT`          | Port the server listens on                | `5000`                    |
| `DB_PATH`       | Path to the SQLite database file          | `./src/db/chat.sqlite`    |
| `CLIENT_ORIGIN` | Allowed CORS origin for the frontend      | `http://localhost:5173`   |

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open **http://localhost:5173** in your browser. Open it in two tabs (or two
browsers) to see real-time delivery, typing indicators, and presence working
between two "users".

**Frontend environment variables** (`frontend/.env`):

| Variable          | Description                     | Default                 |
|--------------------|----------------------------------|--------------------------|
| `VITE_SERVER_URL`  | URL of the backend server        | `http://localhost:5000` |

### 3. Mobile app (React Native / Expo)

```bash
cd mobile
npm install
cp .env.example .env
```

Edit `mobile/.env` and set `EXPO_PUBLIC_SERVER_URL` to your **computer's LAN IP**
(not `localhost`) if you're testing on a physical phone with Expo Go, since
`localhost` on a phone refers to the phone itself:

```
EXPO_PUBLIC_SERVER_URL=http://192.168.1.42:5000
```

Find your LAN IP with `ipconfig` (Windows, look for "IPv4 Address") or
`ifconfig` / `ipconfig getifaddr en0` (Mac/Linux). Make sure your phone and
computer are on the same Wi-Fi network, and that the backend's `CLIENT_ORIGIN`
(in `backend/.env`) includes your LAN IP too if you also plan to test the web
build (`http://localhost:5173,http://192.168.1.42:5173`).

Then start the Expo dev server:

```bash
npm start
```

- Scan the QR code with the **Expo Go** app (Android/iOS) to run it on your phone.
- Or press `a` for an Android emulator / `i` for an iOS simulator, if installed.

**Mobile environment variables** (`mobile/.env`):

| Variable                  | Description                       | Default                 |
|-----------------------------|-------------------------------------|--------------------------|
| `EXPO_PUBLIC_SERVER_URL`  | URL/IP of the backend server        | `http://localhost:5000` |

#### Building an APK (EAS Build)

```bash
cd mobile
npm install -g eas-cli   # if not already installed
eas login                # sign in with your Expo account
eas build:configure      # first time only, creates eas.json
eas build -p android --profile preview
```

This runs in Expo's cloud, so no local Android Studio/SDK setup is needed.
Once it finishes, `eas build` prints a download link for the `.apk` — download
it and share that link (or the file itself) as your submission.

### 4. Production build (web, optional)

```bash
cd frontend
npm run build     # outputs static files to frontend/dist
npm run preview   # serve the production build locally
```

---

## REST API Reference

| Method | Endpoint         | Description                          | Body                          |
|--------|------------------|---------------------------------------|--------------------------------|
| GET    | `/api/messages`  | Fetch full chat history (oldest first)| —                               |
| POST   | `/api/messages`  | Send a message (also broadcasts it)   | `{ "username": "...", "text": "..." }` |
| GET    | `/health`        | Health check                          | —                               |

## Socket.io Events

| Event             | Direction        | Payload                                   | Purpose |
|--------------------|------------------|---------------------------------------------|---------|
| `user:join`        | client → server  | `username` (string)                        | Dummy login, registers presence |
| `user:joined`      | server → client  | `username`                                  | Confirms join succeeded |
| `presence:update`  | server → clients | `string[]` of online usernames              | Live online user list |
| `message:send`     | client → server  | `{ text, clientTempId }` + ack callback     | Send a new message |
| `message:new`      | server → clients | message object                              | Broadcast a new message |
| `message:status`   | server → clients | `{ id, status }`                            | Delivery status updates |
| `typing:start`     | client → server  | —                                            | User started typing |
| `typing:stop`      | client → server  | —                                            | User stopped typing |
| `typing:update`    | server → clients | `{ username, isTyping }`                    | Broadcast typing state |
| `error:app`        | server → client  | error message string                        | Application-level error |

---

## Design Decisions

- **Layered backend structure** (`config` / `models` / `controllers` / `routes` /
  `sockets`) keeps DB access, HTTP handling, and real-time logic separate and
  independently testable, rather than putting everything in one `server.js`.
- **Socket.io is the source of truth for delivery.** The `POST /api/messages`
  REST endpoint also works standalone (and still broadcasts via `io.emit`), but
  the chat UI sends messages through the socket directly so it gets an
  acknowledgement callback (`ack`) and can distinguish "sending" vs "failed" vs
  "delivered" without a second round-trip.
- **Optimistic UI with reconciliation.** When a user sends a message, a local
  "sending" bubble is shown immediately. The socket payload includes a
  `clientTempId` that the server echoes back on the broadcast so the sender's
  own client can swap the temporary bubble for the persisted message (with its
  real ID and status) instead of showing a duplicate.
- **SQLite via `better-sqlite3`** was chosen over MongoDB for zero-setup local
  persistence — no external service to install or connect to, which matters for
  a 24-hour take-home. Swapping the `models/messageModel.js` layer for a Mongo-
  backed implementation would be a contained change since all DB access goes
  through that one module.
- **Presence tracked in-memory** as a `Map<username, Set<socketId>>` on the
  server. This correctly handles a user with multiple tabs/devices open (they
  only go "offline" once every socket for that username has disconnected).
- **Dummy auth by design.** The assessment calls for username-based dummy
  login, so there's no password or session/JWT layer — a username is chosen on
  a simple form and used directly to join the socket room. On mobile, the
  username is persisted with `AsyncStorage` so the app remembers who's "logged
  in" between opens, and a **Sign out** button clears it and returns to the
  login screen.
- **Two frontends, one backend contract.** The web and mobile apps are
  independent codebases but talk to the exact same REST/Socket.io API, so
  behavior (delivery status, typing, presence) is identical on both. This also
  means the backend didn't need any mobile-specific changes beyond making CORS
  configurable for multiple origins.
- **CORS accepts a comma-separated origin list** (`CLIENT_ORIGIN` in
  `backend/.env`) rather than a single string, since local dev now involves a
  browser origin (`localhost:5173`) and a phone on the LAN reaching the server
  by IP; requests with no `Origin` header (native app traffic) are always
  allowed through.

## Assumptions

- Single global chat room (no separate channels/DMs) — every connected client
  sees every message, matching "broadcast new messages to connected users".
- No message editing/deletion, since it wasn't in the requirements.
- Usernames are not unique-enforced and there's no real session/token — this is
  intentionally a lightweight "dummy" login, not real authentication. The
  mobile app remembers the last-used username locally (for convenience) until
  you tap Sign out; the web app does not persist it across reloads.
- CORS accepts a small, explicit allowlist of origins (`CLIENT_ORIGIN`) for
  local development and LAN testing; a production deployment would set this to
  the deployed frontend's real URL(s).

---

## Running Two Clients to Test Real-Time Behavior

**Web:**
1. Start the backend (`npm start` in `backend/`).
2. Start the frontend (`npm run dev` in `frontend/`).
3. Open `http://localhost:5173` in two separate browser tabs.
4. Log in with a different username in each tab (e.g. `alice` and `bob`).
5. Send a message from one tab — it should appear instantly in the other,
   with a "delivered" status back on the sender's side, and both tabs should
   show each other in the online users list and typing indicator.

**Mobile + Web together (good for a screen recording):**
1. Start the backend as above.
2. Start the web frontend (`npm run dev` in `frontend/`) and open it in a browser.
3. Start the mobile app (`npm start` in `mobile/`) and open it via Expo Go on
   your phone, pointed at the same backend (LAN IP, see the mobile setup
   section above).
4. Log in with a different username on each. Messages, typing, presence, and
   delivery status should all sync live between the phone and the browser.
