import { MessageSquarePlus } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import type { Feedback } from '../../lib/types';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import ToastStack from '../ui/Toast';

export default function FeedbackButton() {
  const { token, requireAuth } = useAuth();
  const { toasts, push } = useToast();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Feedback['category']>('idea');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const openForm = () => requireAuth(() => setOpen(true));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || message.trim().length < 10) return;
    setSending(true);
    try {
      await api.createFeedback(token, { category, message: message.trim() });
      setMessage('');
      setOpen(false);
      push('Terima kasih, masukanmu sudah terkirim.', 'success');
    } catch (error) {
      push(error instanceof Error ? error.message : 'Masukan gagal dikirim', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openForm}
        className="fixed bottom-4 left-4 z-50 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-3.5 py-2.5 text-xs font-medium text-violet-700 shadow-lg shadow-violet-500/10 transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-xl dark:border-violet-900 dark:bg-zinc-900 dark:text-violet-300"
      >
        <MessageSquarePlus className="h-4 w-4" />
        <span className="hidden sm:inline">Beri masukan</span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Beri masukan">
        <form className="space-y-4" onSubmit={submit}>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Masukanmu akan langsung terlihat oleh owner TugasKu.</p>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Jenis masukan</span>
            <select value={category} onChange={(e) => setCategory(e.target.value as Feedback['category'])} className="field-input">
              <option value="idea">Ide atau saran</option>
              <option value="bug">Laporan bug</option>
              <option value="other">Lainnya</option>
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Pesan</span>
            <textarea
              required
              minLength={10}
              maxLength={1200}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ceritakan ide, kendala, atau bug yang kamu temukan..."
              className="field-input min-h-32 resize-y"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" loading={sending}>Kirim masukan</Button>
          </div>
        </form>
      </Modal>
      <ToastStack toasts={toasts} />
    </>
  );
}
