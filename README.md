# InkSync

A real-time collaborative document editor. Multiple people, one document, zero conflicts — just write.

---

## What it is

InkSync lets you create document rooms, invite collaborators, and edit together in real time. Changes propagate instantly across all connected clients. Close the tab, come back later — your content is still there.

---

## Tech Stack

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- Socket.io
- JWT (jsonwebtoken + bcrypt)

**Frontend**
- React + Vite
- Socket.io-client
- Framer Motion
- Axios

---

## Backend — the actual meat

This is where most of the work happened.

### Auth
Standard JWT flow — register, hash password with bcrypt, login, get a token, attach it to every subsequent request via an Authorization header. Middleware strips and verifies the token before any protected route runs.

### Document & Room System
Every document gets a randomly generated 6-character room code (`crypto.randomBytes`). Access is controlled at two levels — the owner, and an `authorized_users` array. Only the owner can add/remove collaborators or delete the room. Anyone in `authorized_users` can read and edit.

### Real-time with Socket.io
This was the most interesting part to build.

- Socket connections are authenticated at the handshake level — JWT is passed via `socket.handshake.auth.token`, verified before the connection is even established
- Joining a room re-checks authorization against the database — a valid token isn't enough, you also need to actually be allowed in that specific room
- Edits are broadcast to everyone in the room except the sender via `socket.to(room_code).emit()`
- Writes to MongoDB are debounced by 1 second — so if you're typing fast, only one DB write happens per second instead of one per keystroke
- Active users per room are tracked with a `Map<room_code, Set<userId>>` and broadcast to the room on join/disconnect

### What I fixed along the way
- `allow_user_to_room` initially accepted any string as a user ID without checking if the user actually existed. Added a `User.findById` check before pushing to `authorized_users`.
- `edit-text` socket event had no check that the emitting socket had actually joined that room — meaning any authenticated user could overwrite any document's content if they knew the room code. Fixed using `socket.rooms.has(room_code)`.

---

## What I learned

- How JWT auth works end to end, not just copy-pasting boilerplate
- Socket.io's room system and how presence tracking actually works under the hood
- Why debouncing DB writes matters in real-time apps
- How to think about authorization at multiple layers — HTTP middleware, socket handshake, and individual event handlers
- That `crypto.randomBytes` exists and is cleaner than `Math.random()` for generating codes

---

## Running locally

```bash
# Backend
cd backend
cp .env.example .env   # fill in MONGO_URI and JWT_SECRET
npm install
node index.js

# Frontend
cd collab-editor
cp .env.example .env   # set VITE_API_URL=http://localhost:5000
npm install
npm run dev
```

---

## Honest disclaimer

The backend is mine. Every route, every socket event, every auth check — written, debugged, and understood by me.

The frontend? Let's just say I had a very capable intern. Goes by Claude. Doesn't sleep, doesn't complain, writes clean React. I reviewed it, understood it, and it works — but I'm not out here pretending I hand-crafted every flex container. Respect the transparency.

---

*Built while learning. Probably has bugs. Open an issue if you find one.*
