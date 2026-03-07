import { useState, useRef } from 'react';
import { Upload, FileImage, X, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/button';
import patientService from '../../../services/patient.service';

interface Props {
  patientId: string;
  currentUrl: string | null;
  onUploaded: (url: string) => void;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024;

export default function AadhaarUpload({ patientId, currentUrl, onUploaded }: Props) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP, or PDF files are allowed');
      return;
    }

    if (file.size > MAX_SIZE) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const url = await patientService.uploadAadhaar(patientId, file);
      setPreviewUrl(url);
      onUploaded(url);
      toast.success('Aadhaar card uploaded successfully');
    } catch {
      toast.error('Failed to upload Aadhaar card');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-600">Aadhaar Card Image</label>

      {previewUrl ? (
        <div className="relative group">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
              <FileImage className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">Aadhaar Card Uploaded</p>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
              >
                View Document <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-blue-600 hover:bg-blue-50"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                Replace
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                onClick={() => setPreviewUrl(null)}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-gray-200 rounded-lg py-4 px-3 flex flex-col items-center gap-2 hover:border-blue-300 hover:bg-blue-50/30 transition-colors cursor-pointer disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-gray-400" />
          )}
          <div className="text-center">
            <p className="text-xs font-medium text-gray-600">
              {uploading ? 'Uploading...' : 'Click to upload Aadhaar card'}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">JPEG, PNG, WebP, or PDF (max 5MB)</p>
          </div>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
