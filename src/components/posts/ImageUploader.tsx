import { useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { fileToBase64 } from '../../lib/utils';
import Button from '../ui/Button';

export default function ImageUploader({
  images,
  onChange,
  onError,
}: {
  images: string[];
  onChange: (imgs: string[]) => void;
  onError?: (msg: string) => void;
}) {
  const { token, requireAuth } = useAuth();
  const [uploading, setUploading] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    requireAuth(async () => {
      if (!token) return;
      setUploading(true);
      try {
        const next = [...images];
        for (const file of Array.from(files).slice(0, 10 - images.length)) {
          if (!file.type.startsWith('image/')) continue;
          if (file.size > 4 * 1024 * 1024) {
            onError?.('Maksimal 4MB per gambar');
            continue;
          }
          const base64 = await fileToBase64(file);
          const { url } = await api.uploadImage(token, file.name, base64, file.type);
          next.push(url);
        }
        onChange(next.slice(0, 10));
      } catch (e) {
        onError?.(e instanceof Error ? e.message : 'Upload gagal');
      } finally {
        setUploading(false);
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Gambar</label>
        <span className="text-xs text-zinc-400">{images.length}/10</span>
      </div>
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((img) => (
            <div key={img} className="relative overflow-hidden rounded-xl">
              <img src={img} alt="" className="h-28 w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(images.filter((i) => i !== img))}
                className="absolute right-1.5 top-1.5 rounded-lg bg-black/60 p-1 text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      {images.length < 10 && (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center transition hover:border-violet-400 hover:bg-violet-50/40 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-violet-700">
          <ImagePlus className="mb-2 h-5 w-5 text-zinc-400" />
          <span className="text-sm text-zinc-600 dark:text-zinc-300">
            {uploading ? 'Mengunggah...' : 'Unggah gambar'}
          </span>
          <span className="mt-1 text-xs text-zinc-400">PNG, JPG, WEBP · max 4MB</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      )}
      {uploading && <Button loading disabled className="w-full" variant="secondary">Mengunggah</Button>}
    </div>
  );
}
