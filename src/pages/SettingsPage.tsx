import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { SUBJECTS, EDUCATION_LEVELS, CLASS_OPTIONS, type EducationLevel } from '../lib/constants';
import { fileToBase64 } from '../lib/utils';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import ToastStack from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';

export default function SettingsPage() {
  const { token, profile, loading, requireAuth, setProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toasts, push } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    nickname: '',
    username: '',
    bio: '',
    avatar_url: '',
    school: '',
    education_level: '',
    class_level: '',
    favorite_subjects: [] as string[],
    social_links: { instagram: '', twitter: '', github: '', website: '' },
  });

  useEffect(() => {
    if (!loading && !requireAuth()) return;
    if (profile) {
      setForm({
        nickname: profile.nickname || '',
        username: profile.username || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
        school: profile.school || '',
        education_level: profile.education_level || '',
        class_level: profile.class_level || '',
        favorite_subjects: profile.favorite_subjects || [],
        social_links: {
          instagram: profile.social_links?.instagram || '',
          twitter: profile.social_links?.twitter || '',
          github: profile.social_links?.github || '',
          website: profile.social_links?.website || '',
        },
      });
    }
  }, [profile, loading, requireAuth]);

  const classOptions =
    form.education_level && EDUCATION_LEVELS.includes(form.education_level as EducationLevel)
      ? CLASS_OPTIONS[form.education_level as EducationLevel]
      : [];

  const toggleSubject = (s: string) => {
    setForm((f) => {
      const has = f.favorite_subjects.includes(s);
      const favorite_subjects = has
        ? f.favorite_subjects.filter((x) => x !== s)
        : [...f.favorite_subjects, s].slice(0, 8);
      return { ...f, favorite_subjects };
    });
  };

  const uploadAvatar = async (file?: File | null) => {
    if (!file || !token) return;
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const { url } = await api.uploadImage(token, file.name, base64, file.type);
      setForm((f) => ({ ...f, avatar_url: url }));
      push('Foto diunggah', 'success');
    } catch (e) {
      push(e instanceof Error ? e.message : 'Upload gagal', 'error');
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const updated = await api.updateProfile(token, form);
      setProfile(updated);
      await refreshProfile();
      push('Profil disimpan', 'success');
      navigate(`/u/${updated.username}`);
    } catch (err) {
      push(err instanceof Error ? err.message : 'Gagal menyimpan', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return <div className="py-20 text-center text-sm text-zinc-400">Memuat profil...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit profil</h1>
        <p className="mt-1 text-sm text-zinc-500">Perbarui identitas dan informasi akademikmu.</p>
      </div>

      <form onSubmit={save} className="space-y-5 rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/70 sm:p-7">
        <div className="flex items-center gap-4">
          <Avatar src={form.avatar_url} name={form.nickname} size="lg" />
          <div>
            <label className="inline-flex cursor-pointer">
              <span className="rounded-xl border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
                {uploading ? 'Mengunggah...' : 'Ganti foto'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => uploadAvatar(e.target.files?.[0])}
              />
            </label>
            <p className="mt-1 text-xs text-zinc-400">Bisa diganti dari foto Google default.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-medium">Nickname</span>
            <input className="field-input" value={form.nickname} onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))} required />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium">Username</span>
            <input className="field-input" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} required />
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Bio</span>
          <textarea
            className="field-input min-h-[100px]"
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            maxLength={500}
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Sekolah / Kampus</span>
          <input className="field-input" value={form.school} onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))} />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-medium">Jenjang</span>
            <select
              className="field-input"
              value={form.education_level}
              onChange={(e) => setForm((f) => ({ ...f, education_level: e.target.value, class_level: '' }))}
            >
              <option value="">-</option>
              {EDUCATION_LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium">Kelas</span>
            <select
              className="field-input"
              value={form.class_level}
              onChange={(e) => setForm((f) => ({ ...f, class_level: e.target.value }))}
            >
              <option value="">-</option>
              {classOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Pelajaran favorit</p>
          <div className="flex flex-wrap gap-1.5">
            {SUBJECTS.map((s) => {
              const active = form.favorite_subjects.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSubject(s)}
                  className={
                    active
                      ? 'rounded-full bg-violet-600 px-2.5 py-1 text-xs text-white'
                      : 'rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                  }
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {(['instagram', 'twitter', 'github', 'website'] as const).map((key) => (
            <label key={key} className="space-y-1.5">
              <span className="text-sm font-medium capitalize">{key}</span>
              <input
                className="field-input"
                value={form.social_links[key]}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    social_links: { ...f.social_links, [key]: e.target.value },
                  }))
                }
              />
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            Batal
          </Button>
          <Button type="submit" loading={saving}>
            Simpan perubahan
          </Button>
        </div>
      </form>
      <ToastStack toasts={toasts} />
    </div>
  );
}
