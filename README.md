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

Salin `.env.example` menjadi `.env.local`, lalu isi nilainya. File `.env.local` tidak boleh di-commit.

```bash
cp .env.example .env.local
```

Variabel yang dibutuhkan hanya empat:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

- Ambil semuanya di **Supabase Dashboard → Project Settings → API**.
- `VITE_SUPABASE_ANON_KEY` adalah publishable/anon key dan digunakan di browser.
- `SUPABASE_SERVICE_ROLE_KEY` hanya untuk Vercel Serverless Functions. Jangan masukkan ke GitHub atau variabel berawalan `VITE_`.
- Di Vercel, tambahkan keempat variabel tersebut lewat **Project → Settings → Environment Variables**, lalu redeploy.

### Google OAuth

Login Google menggunakan OAuth bawaan Supabase; tidak ada environment variable Google atau proxy Design Arena.

1. Di **Supabase Dashboard → Authentication → Providers → Google**, aktifkan Google dan isi Google Client ID serta Client Secret.
2. Di **Supabase Dashboard → Authentication → URL Configuration**, isi Site URL dengan domain Vercel aplikasi dan tambahkan URL localhost/domain preview pada Redirect URLs.
3. Di Google Cloud Console, tambahkan callback Supabase berikut ke **Authorized redirect URIs**:
   `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`.

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
