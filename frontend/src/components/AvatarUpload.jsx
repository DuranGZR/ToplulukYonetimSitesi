import { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function AvatarUpload({ currentUser, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Dosya boyutu kontrolü (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya boyutu 5MB\'dan küçük olmalı');
      return;
    }

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      toast.error('Sadece resim dosyaları yüklenebilir');
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setUploading(true);
      const response = await api.post('/users/upload_avatar/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Profil fotoğrafı güncellendi');
      onUpdate?.(response.data);
    } catch (error) {
      console.error('Upload hatası:', error);
      toast.error('Fotoğraf yüklenemedi');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Profil fotoğrafını silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      setUploading(true);
      await api.delete('/users/delete_avatar/');
      toast.success('Profil fotoğrafı silindi');
      setPreviewUrl(null);
      onUpdate?.({ ...currentUser, profile_image: null });
    } catch (error) {
      console.error('Silme hatası:', error);
      toast.error('Fotoğraf silinemedi');
    } finally {
      setUploading(false);
    }
  };

  const avatarUrl = previewUrl || (currentUser?.profile_image ? `http://127.0.0.1:8000${currentUser.profile_image}` : null);

  return (
    <div className="flex flex-col items-center">
      {/* Avatar Display */}
      <div className="relative group">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border-4 border-red-600"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-4xl border-4 border-red-600">
            {currentUser?.first_name?.charAt(0)}{currentUser?.last_name?.charAt(0)}
          </div>
        )}
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <label htmlFor="avatar-upload" className="cursor-pointer">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </label>
        </div>

        {/* Loading Overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-70 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      {/* File Input (Hidden) */}
      <input
        id="avatar-upload"
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
      />

      {/* Buttons */}
      <div className="flex gap-2 mt-4">
        <label
          htmlFor="avatar-upload"
          className={`bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-all cursor-pointer ${
            uploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {avatarUrl ? 'Değiştir' : 'Yükle'}
        </label>
        
        {avatarUrl && currentUser?.profile_image && (
          <button
            onClick={handleDelete}
            disabled={uploading}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sil
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-2 text-center">
        JPG, PNG veya GIF. Maksimum 5MB.
      </p>
    </div>
  );
}
