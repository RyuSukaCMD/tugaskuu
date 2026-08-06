import { Flag } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import ToastStack from '../ui/Toast';
import { useToast } from '../../hooks/useToast';

export default function ReportUserButton({ userId }: { userId: string }) {
  const { token, requireAuth } = useAuth();
  const { toasts, push } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('harassment');
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!token) return; setSending(true);
    try { await api.createUserReport(token, { reported_user_id: userId, reason, details }); setOpen(false); setDetails(''); push('Laporan pengguna sudah dikirim.', 'success'); }
    catch (err) { push(err instanceof Error ? err.message : 'Laporan gagal dikirim', 'error'); }
    finally { setSending(false); }
  };
  return <><Button size="sm" variant="outline" onClick={() => requireAuth(() => setOpen(true))}><Flag className="h-3.5 w-3.5" /> Laporkan</Button>
    <Modal open={open} onClose={() => setOpen(false)} title="Laporkan pengguna"><form className="space-y-4" onSubmit={submit}><p className="text-sm text-zinc-500">Laporkan hanya bila ada pelanggaran komunitas.</p><select className="field-input" value={reason} onChange={(e) => setReason(e.target.value)}><option value="harassment">Pelecehan / perilaku tidak pantas</option><option value="impersonation">Penyamaran identitas</option><option value="spam">Spam</option><option value="other">Lainnya</option></select><textarea className="field-input min-h-24 resize-y" value={details} maxLength={1000} placeholder="Penjelasan tambahan (opsional)" onChange={(e) => setDetails(e.target.value)} /><div className="flex flex-wrap justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>Batal</Button><Button type="submit" variant="danger" loading={sending}>Kirim laporan</Button></div></form></Modal><ToastStack toasts={toasts} /></>;
}
