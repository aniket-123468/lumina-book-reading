<div align="center">

# 📖 Lumina

**A personal PDF reading web app** — upload, organize, and read your books with a distraction-free reader, highlights, and cross-device reading progress sync.

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-GridFS-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![JWT](https://img.shields.io/badge/Auth-JWT_%2B_Google_OAuth-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![License](https://img.shields.io/badge/License-Unspecified-lightgrey?style=flat-square)]()

[Overview](#-overview) •
[Features](#-features) •
[Tech Stack](#-tech-stack) •
[Architecture](#-architecture) •
[Getting Started](#-getting-started) •
[API Reference](#-api-reference)

</div>

---

## 📖 Overview

Most PDF readers are either bare-bones browser plugins or bloated desktop apps — neither gives you a clean, personal library with progress tracking and highlights that follow you across devices.

**Lumina** is a self-hosted personal reading app: upload a PDF, and it's rendered in a custom in-browser reader with adjustable typography, theming, and page tracking. Every book's reading position, font size, and highlights are saved per-user in MongoDB, so picking up where you left off is automatic.

## ✨ Features

| | |
|---|---|
| 🔐 **Secure Authentication** | Email/password (bcrypt-hashed) + Google OAuth 2.0, with short-lived JWT access tokens and HttpOnly refresh-token cookies |
| 📚 **Personal Library** | Upload and manage PDFs, stored directly in MongoDB via **GridFS** (no external file storage needed) |
| 📖 **Custom PDF Reader** | Built on `pdfjs-dist` for in-browser rendering, with adjustable font size, line height, and theme (Light / Warm Cream / Dark) |
| 🔖 **Reading Progress Sync** | Current page, font settings, and theme are saved per book, per user — resume instantly on any device |
| 🖍️ **Highlights & Notes** | Highlight text in 4 colors with optional notes, tied to exact page position and text snippet |
| 🛡️ **Rate-Limited Login** | Login endpoint capped at 5 attempts per 15 minutes to blunt brute-force attempts |
| 📱 **Responsive UI** | Mobile bottom navigation + animated Three.js background on auth screens |

## 🛠️ Tech Stack

<table>
<tr>
<td valign="top" width="50%">

**Frontend**
- React 19 + Vite
- Tailwind CSS 3 (`@tailwindcss/typography`, `@tailwindcss/forms`)
- Zustand — state management
- React Router 7
- `pdfjs-dist` — PDF rendering engine
- Three.js — animated backgrounds
- Lucide React — icons

</td>
<td valign="top" width="50%">

**Backend**
- Node.js + Express 5
- MongoDB + Mongoose + **GridFS** (binary PDF storage)
- Passport.js (`passport-google-oauth20`)
- JWT (access + refresh token pattern)
- bcrypt
- Multer (in-memory upload handling)
- express-validator, express-rate-limit

</td>
</tr>
</table>

## 🏗️ Architecture

```
lumina-book-reading/
├── backend/
│   └── src/
│       ├── config/          # DB connection, Passport (Google OAuth), Multer upload config
│       ├── controllers/     # auth, book, highlight, reading-state logic
│       ├── middleware/      # JWT auth guard
│       ├── models/          # User, Book, Highlight, ReadingState (Mongoose schemas)
│       ├── routes/          # Express route definitions
│       └── index.js         # App entry point
│
└── frontend/
    └── src/
        ├── components/      # ThreeJsBackground, MobileBottomNav
        ├── pages/           # Login, Signup, Library, Reader, Highlights
        ├── store/           # Zustand auth/app store
        └── utils/           # Authenticated API client (auto token refresh)
```

<details>
<summary><strong>💡 Design decisions worth knowing</strong></summary>
<br>

- **PDFs stored in MongoDB GridFS, not disk/S3** — files are streamed directly into a GridFS bucket via the MongoDB driver, avoiding filesystem persistence issues on ephemeral hosts and removing the need for a separate object storage service.
- **Manual GridFS upload over `multer-gridfs-storage`** — the popular `multer-gridfs-storage` package throws connection errors on modern Mongoose/MongoDB driver versions, so uploads use `multer.memoryStorage()` and a manual `GridFSBucket` stream instead.
- **Access + refresh token split** — a short-lived (15 min) JWT access token is used for API calls, while a long-lived (7 day) refresh token lives in an HttpOnly cookie — balancing security against staying logged in across sessions.
- **Google OAuth account linking** — if a Google sign-in email matches an existing password-based account, the accounts are merged (`googleId` attached) rather than creating a duplicate user.
- **Per-user, per-book reading state** — a compound unique index on `(userId, bookId)` in `ReadingState` guarantees exactly one saved reading position per book per user.

</details>

## 🚀 Getting Started

### Prerequisites

- Node.js `v18+`
- MongoDB (local instance or MongoDB Atlas)
- A Google Cloud OAuth 2.0 Client ID (for Google login)

### 1. Clone the repository

```bash
git clone https://github.com/aniket-123468/lumina-book-reading.git
cd lumina-book-reading
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/lumina
JWT_SECRET=your_jwt_secret_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

Start the backend:

```bash
npm run dev
```

The API runs at `http://localhost:5000`.

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create a `.env` file inside `frontend/`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

## 📡 API Reference

All routes except `/auth/signup`, `/auth/login`, and `/auth/google*` require a `Bearer <token>` in the `Authorization` header.

<details>
<summary><strong>Click to expand full endpoint list</strong></summary>
<br>

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Create a new account (name, email, password) |
| `POST` | `/api/auth/login` | Log in (rate-limited to 5 attempts / 15 min) |
| `POST` | `/api/auth/refresh` | Exchange refresh cookie for a new access token |
| `POST` | `/api/auth/logout` | Clear refresh token cookie |
| `GET` | `/api/auth/me` | Get current authenticated user |
| `GET` | `/api/auth/google` | Start Google OAuth flow |
| `GET` | `/api/auth/google/callback` | Google OAuth callback, issues tokens |
| `GET` | `/api/books` | List current user's books |
| `POST` | `/api/books` | Upload a new PDF (multipart, field name `pdf`) |
| `GET` | `/api/books/:id` | Get a single book's metadata |
| `GET` | `/api/books/:id/file` | Stream the raw PDF file from GridFS |
| `DELETE` | `/api/books/:id` | Delete a book |
| `GET` | `/api/reading-state/:bookId` | Get saved reading position/settings for a book |
| `PUT` | `/api/reading-state` | Update reading position, font size, theme |
| `GET` | `/api/highlights` | Get all highlights across all books |
| `GET` | `/api/highlights/:bookId` | Get highlights for a specific book |
| `POST` | `/api/highlights` | Create a highlight |
| `DELETE` | `/api/highlights/:id` | Delete a highlight |

</details>

## 🗺️ Roadmap

- [ ] Text-to-speech / read-aloud mode
- [ ] Full-text search within a book
- [ ] EPUB support alongside PDF
- [ ] Shared/collaborative highlight collections

## 📄 License

This project does not currently specify a license. Contact the repository owner for usage permissions.

---

<div align="center">

Built by [Aniket](https://github.com/aniket-123468)

</div>
