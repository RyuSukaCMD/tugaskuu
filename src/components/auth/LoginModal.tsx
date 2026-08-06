import { BookOpen } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { signInWithGoogle } from '../../lib/googleAuth';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

export default function LoginModal() {
  const { loginOpen, setLoginOpen } = useAuth();

  return (
    <Modal open={loginOpen} onClose={() => setLoginOpen(false)} title="Masuk ke TugasKu">
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-violet-50 to-blue-50 p-4 dark:from-violet-950/40 dark:to-blue-950/30">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-zinc-900">
            <BookOpen className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">Berbagi jawaban & penjelasan</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Login diperlukan untuk post, like, vote, komentar, dan edit profil.
            </p>
          </div>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={() => void signInWithGoogle()}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Lanjutkan dengan Google
        </Button>

        <p className="text-center text-xs text-zinc-400">
          Pengunjung tetap bisa membaca seluruh konten tanpa login.
        </p>
      </div>
    </Modal>
  );
}
