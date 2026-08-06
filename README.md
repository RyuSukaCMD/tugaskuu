# TugasKu

Platform berbagi jawaban tugas beserta penjelasannya. Dibangun dengan Vite + React + TypeScript + Tailwind CSS, Supabase (PostgreSQL + Auth + Storage), dan Vercel Serverless API routes.

## Fitur utama

- Login Google OAuth (modal otomatis untuk aksi yang butuh auth)
- Post pertanyaan & jawaban/penjelasan (Markdown + LaTeX/KaTeX)
- Multi-upload gambar
- Filter feed: jenis, pelajaran, jenjang, kelas, tag, search
- Like, bookmark, share/copy link
- Nested comment + like komentar
- Jawaban pada pertanyaan + upvote/downvote
- Profil lengkap + statistik
- Notifikasi (like, komentar, balasan, jawaban, mention)
- Role owner untuk moderasi konten & kelola user
- Dark mode, SEO metadata, robots.txt, sitemap

## Stack

- Frontend: Vite, React 19, TypeScript, Tailwind CSS v4, Framer Motion, Lucide
- Backend: Vercel Serverless Functions (`api/`)
- Database/Auth/Storage: Supabase
- Markdown: react-markdown, remark-gfm, remark-math, rehype-katex, rehype-sanitize

## Instalasi lokal

```bash
npm install
npm run dev
```

## Environment variables

Salin nilai berikut ke `.env` (sudah disediakan di environment Design Arena):

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
VITE_GOOGLE_CLIENT_ID=
VITE_GOOGLE_AUTH_PROXY=
```

### Google OAuth

1. Buat OAuth Client ID di Google Cloud Console.
2. Authorized redirect URI mengarah ke proxy Design Arena / callback yang dipakai app.
3. Isi `VITE_GOOGLE_CLIENT_ID` dan `VITE_GOOGLE_AUTH_PROXY`.
4. Pastikan provider Google diaktifkan di Supabase Auth.

### PostgreSQL (Supabase)

Tabel yang dipakai:

- `profiles`
- `subjects`
- `posts`
- `question_answers`
- `comments`
- `comment_likes`
- `post_likes`
- `votes`
- `bookmarks`
- `notifications`

### Storage upload

Bucket publik: `tugasku-images`

Digunakan untuk avatar dan gambar post/jawaban melalui endpoint `POST /api/upload`.

## Scripts

```bash
npm run dev      # development
npm run build    # production build
npm run preview  # preview build
```

## Deployment Vercel

1. Push repository.
2. Import project ke Vercel.
3. Set environment variables di dashboard Vercel.
4. Deploy. API routes di folder `api/` otomatis menjadi serverless functions.
5. Pastikan rewrite SPA aktif agar route client-side (`/post/:slug`, `/u/:username`) berfungsi.

## Struktur folder

```
api/                 # serverless API + db client
src/
  components/        # UI, layout, posts, comments, markdown, auth
  contexts/          # Auth + Theme
  hooks/
  lib/               # api client, constants, types, utils, supabase
  pages/
public/
```

## Catatan keamanan

- Validasi input di server
- Sanitasi teks / XSS pada konten
- Rate limiting sederhana per user/action
- Upload dibatasi tipe gambar & ukuran 4MB
- Owner-only endpoints dilindungi di server
