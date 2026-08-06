import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import LoginModal from '../auth/LoginModal';

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 top-0 h-72 w-72 rounded-full bg-violet-400/10 blur-3xl dark:bg-violet-600/10" />
        <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl dark:bg-blue-600/10" />
      </div>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
      <Footer />
      <LoginModal />
    </div>
  );
}
