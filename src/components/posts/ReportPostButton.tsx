import { Flag } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import type { Report } from '../../lib/types';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import ToastStack from '../ui/Toast';

export default function ReportPostButton({ postId }: { postId: number }) {
  const { token, requireAuth } = useAuth();
  const { toasts, push } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Report['reason']>('spam');
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setSending(true);
    try {
      await api.createReport(token, { post_id: postId, reason, details });
      setOpen(false);
      setDetails('');
      push('Laporan sudah dikirim untuk ditinjau owner.', 'success');
    } catch (error) {
      push(error instanceof Error ? error.message : 'Laporan gagal dikirim', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => requireAuth(() => setOpen(true))}
        className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-300"
        aria-label="Laporkan postingan"
      >
        <Flag className="h-3.5 w-3.5" /> Laporkan
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Laporkan postingan">
        <form className="space-y-4" onSubmit={submit}>
          <p className="text-sm text-zinc-500">Laporan akan ditinjau oleh owner. Gunakan fitur ini dengan bertanggung jawab.</p>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Alasan</span>
            <select className="field-input" value={reason} onChange={(e) => setReason(e.target.value as Report['reason'])}>
              <option value="spam">Spam atau promosi</option>
              <option value="harassment">Pelecehan / konten tidak pantas</option>
              <option value="misinformation">Informasi menyesatkan</option>
              <option value="copyright">Pelanggaran hak cipta</option>
              <option value="other">Lainnya</option>
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Penjelasan tambahan <span className="font-normal text-zinc-400">(opsional)</span></span>
            <textarea className="field-input min-h-24 resize-y" maxLength={1000} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Jelaskan laporanmu bila perlu..." />
          </label>
          <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>Batal</Button><Button type="submit" variant="danger" loading={sending}>Kirim laporan</Button></div>
        </form>
      </Modal>
      <ToastStack toasts={toasts} />
    </>
  );
}
