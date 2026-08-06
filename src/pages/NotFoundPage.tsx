import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="text-sm font-medium text-violet-600">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Halaman tidak ditemukan</h1>
      <p className="mt-2 max-w-md text-sm text-zinc-500">
        Tautan yang kamu buka mungkin sudah dipindahkan atau tidak pernah ada.
      </p>
      <Link to="/" className="mt-6">
        <Button>Kembali ke beranda</Button>
      </Link>
    </div>
  );
}
