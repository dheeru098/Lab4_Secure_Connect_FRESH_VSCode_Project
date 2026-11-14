# Lab 4 — Secure Connect and Communication Platform

A Node.js backend for Web Dev III, Unit 4. This project implements account creation and login, JWT authentication, password hashing, protected routes, role-based access control, private notes with CRUD operations, Socket.IO real-time communication, and EventEmitter activity logging.

## What you need

- Node.js and npm
- VS Code
- Postman desktop
- An existing MongoDB Atlas account and cluster, or a local MongoDB server

Nothing else needs to be installed as a desktop application. The Node packages are installed with `npm install`.

## Quick setup on Windows

1. Extract the project ZIP and open `Lab4_Secure_Connect.code-workspace` in VS Code (or double-click `OPEN_IN_VS_CODE.cmd`).
2. In the project terminal, run `npm.cmd install` (this also works in PowerShell when npm scripts are blocked).
3. Run `copy .env.example .env` in Command Prompt (CMD). In PowerShell use `Copy-Item .env.example .env`.
4. Open `.env`. Set `MONGODB_URI` to your Atlas URI. Use a separate database name, **`secure_connect_lab4`**, after `.mongodb.net/`, so your Lab 3 database is left alone. The database user's password may need URL encoding.
5. Set `JWT_SECRET` to a long, randomly generated secret of at least 32 characters. From CMD you can generate a random value with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` and paste the result after `JWT_SECRET=`. Do not include quotes.
6. Stop your Lab 3 server if it uses port 5000, then run `npm.cmd start`.
7. Check that the terminal shows `MongoDB connected` and `Server running at http://localhost:5000`.
8. Test `GET http://localhost:5000/` or import the Postman collection in the `postman` folder.

Your existing MongoDB Atlas cluster is enough; the MongoDB VS Code extension is optional. The new Lab 4 Node packages are bcrypt, dotenv, Express, jsonwebtoken, MongoDB driver, and Socket.IO.

**Security:** `.env` is excluded from Git by `.gitignore`. Never upload `.env`, a JWT signing secret, or a real database password. Reset any password that has appeared in a screenshot.

## API routes

| Method | URL | Auth | What it does |
|---|---|---|---|
| POST | `/api/auth/signup` | None | Register a new user |
| POST | `/api/auth/login` | None | Verify password and issue JWT |
| GET | `/api/auth/me` | Bearer JWT | View current user |
| GET | `/api/auth/admin` | Bearer JWT + admin | Demonstrate role-based access |
| GET | `/api/notes` | Bearer JWT | List only your notes |
| POST | `/api/notes` | Bearer JWT | Create a note |
| GET | `/api/notes/:id` | Bearer JWT | Read your note |
| PUT | `/api/notes/:id` | Bearer JWT | Update your note |
| DELETE | `/api/notes/:id` | Bearer JWT | Delete your note |
| GET | `/chat` | Browser page | Open a basic Socket.IO chat tester |

The API uses JSON and returns appropriate HTTP status codes: 201 for created resources, 200 for successful reads/updates/deletes, 400 for invalid input, 401 for missing/invalid token, 403 for the wrong role, 404 for unknown or non-owned notes, and 409 for duplicate emails.

### Example signup

**POST** `http://localhost:5000/api/auth/signup`

```json
{
  "username": "victor",
  "email": "victor@example.com",
  "password": "strongpassword123"
}
```

The response contains the user's ID, name, email, and role, but never the hashed password.

### Example login

**POST** `http://localhost:5000/api/auth/login`

```json
{
  "email": "victor@example.com",
  "password": "strongpassword123"
}
```

Copy the returned `token`. For protected requests, add `Authorization: Bearer YOUR_TOKEN`. The JWT expires after two hours.

### Example note

**POST** `http://localhost:5000/api/notes` with the bearer token:

```json
{
  "title": "My First Note",
  "content": "This is my first note of Web Dev III"
}
```

Each note has a MongoDB-generated ID, an owner, and `createdAt`/`updatedAt` timestamps. Only the owner can read, edit, or delete it.

## Postman collection

Import `postman/Lab4_Secure_Connect.postman_collection.json`. The collection has ready-made requests for signup, login, protected routes, notes CRUD, unauthorized access, and the admin-only check. It automatically saves the JWT returned by login into a collection variable named `token`, and the note ID returned by Create Note into `noteId`. If signup says `Email already registered`, change the `email` collection variable or start directly with Login.

Run requests in this order: Signup, Login, Get Current User, List Notes, Create Note, Get One Note, Update Note, Delete Note. Run `Notes Without Token` and `Admin Route (normal user denied)` to verify the security requirements.

## Real-time chat with Socket.IO

1. Log in through Postman and copy the returned JWT.
2. Open `http://localhost:5000/chat` in a browser.
3. Paste the JWT into the page and click **Connect**.
4. Repeat in a second browser tab using a valid JWT. Both tabs initially join the `general` room.
5. Send a message in one tab. It should appear instantly in both tabs, and the server console should log the EventEmitter `chat:message` event.
6. You can enter a room name and click **Join** to create or join another room. Users can send only to rooms they have joined.

Socket connections require a valid JWT. Chat messages are broadcast live but not saved to MongoDB. This is deliberate: the lab asks for real-time event-driven communication, not chat-history storage.

## Role-based access control

New accounts always have role `user`. The admin route rejects them with HTTP 403. To demonstrate the allowed case, use MongoDB Atlas Data Explorer to edit the `role` field of a test user's document from `user` to `admin`, then log in again and call `GET /api/auth/admin`. There is deliberately no public endpoint for self-assigning admin privileges.

## Suggested verification checklist

- Signup returns 201; a duplicate email returns 409.
- Login returns a JWT; incorrect credentials return 401.
- `/api/auth/me` with a valid token succeeds; `/api/notes` without a token returns 401.
- A normal user is denied the admin route with 403.
- Notes can be created, listed, retrieved, updated, and deleted.
- A different user cannot read or modify someone else's notes.
- Two browser tabs exchange Socket.IO messages live; connections without a JWT are rejected.
- Server console logs registration, login, note changes, and chat messages using EventEmitter.

## GitHub submission

Commit source code, `.env.example`, `package.json`, `README.md`, Postman collection, HTML tester, and the workspace. Never commit `.env` or `node_modules`. Test your API and chat locally before submitting the GitHub repository URL.
