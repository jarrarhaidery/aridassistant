import { useRef } from "react";

interface ImageUploadProps {
  onImageSelected: (file: File, preview: string) => void;
  disabled?: boolean;
}

export default function ImageUpload({ onImageSelected, disabled }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    onImageSelected(file, previewUrl);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="p-3.5 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-2xl transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed group"
        title="Upload image"
      >
        <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>
    </>
  );
}