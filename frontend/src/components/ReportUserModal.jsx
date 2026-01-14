import { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function ReportUserModal({ user, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    report_type: 'SPAM',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    { value: 'SPAM', label: 'Spam' },
    { value: 'HARASSMENT', label: 'Taciz/Rahatsız Etme' },
    { value: 'INAPPROPRIATE', label: 'Uygunsuz İçerik' },
    { value: 'FAKE', label: 'Sahte Profil' },
    { value: 'OTHER', label: 'Diğer' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      toast.error('Lütfen açıklama girin');
      return;
    }

    try {
      setLoading(true);
      await api.post('/moderation/reports/', {
        reported_user: user.id,
        ...formData
      });
      toast.success('Rapor gönderildi');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Rapor gönderilemedi:', error);
      toast.error('Rapor gönderilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-800"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">Kullanıcı Bildir</h3>
            <p className="text-sm text-gray-400 mt-1">
              {user?.full_name || user?.username}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">Rapor Tipi</label>
            <select
              value={formData.report_type}
              onChange={(e) => setFormData({ ...formData, report_type: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            >
              {reportTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">Açıklama</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="4"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
              placeholder="Rapor nedeninizi detaylı olarak açıklayın..."
              required
            ></textarea>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-all"
            >
              {loading ? 'Gönderiliyor...' : 'Rapor Gönder'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-all"
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
