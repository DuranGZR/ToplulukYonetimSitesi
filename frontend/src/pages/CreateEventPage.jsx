import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';

export default function CreateEventPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'EGITIM',
    custom_event_type: '',
    date_time: '',
    location: '',
    duration: 60,
    attendance_points: 10,
    poster_image: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, poster_image: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Etkinlik adı gerekli');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error('Açıklama gerekli');
      return;
    }

    if (!formData.date_time) {
      toast.error('Tarih ve saat gerekli');
      return;
    }

    if (!formData.location.trim()) {
      toast.error('Konum gerekli');
      return;
    }

    setLoading(true);
    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      
      // Eğer "DIGER" seçiliyse ve custom_event_type doluysa onu kullan
      const eventType = formData.event_type === 'DIGER' && formData.custom_event_type.trim()
        ? formData.custom_event_type.trim()
        : formData.event_type;
      
      submitData.append('event_type', eventType);
      submitData.append('date_time', formData.date_time);
      submitData.append('location', formData.location);
      submitData.append('duration', formData.duration);
      submitData.append('attendance_points', formData.attendance_points);
      
      if (formData.poster_image) {
        submitData.append('poster_image', formData.poster_image);
      }

      const response = await api.post('/events/', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      toast.success('Etkinlik başarıyla oluşturuldu!');
      navigate(`/events/${response.data.id}`);
    } catch (error) {
      console.error('Etkinlik oluşturulamadı:', error);
      const errorMsg = error.response?.data?.detail || 
                      error.response?.data?.error ||
                      JSON.stringify(error.response?.data) ||
                      'Etkinlik oluşturulurken hata oluştu';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Sadece admin ve başkan yardımcısı oluşturabilir
  if (user?.role !== 'BASKAN' && user?.role !== 'BASKAN_YARDIMCISI') {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto text-center py-12 sm:py-16 md:py-20 px-2 sm:px-4">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-red-500 mb-3 sm:mb-4">Yetkiniz Yok</h1>
          <p className="text-gray-400 mb-4 sm:mb-5 md:mb-6 text-sm sm:text-base">
            Etkinlik oluşturmak için yeterli yetkiniz bulunmamaktadır.
          </p>
          <button
            onClick={() => navigate('/events')}
            className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg text-xs sm:text-sm md:text-base"
          >
            Etkinliklere Dön
          </button>
        </div>
      </Layout>
    );
  }

  return (
      <Layout>
      <div className="max-w-4xl mx-auto px-2 sm:px-4">
        <div className="mb-2 sm:mb-3 md:mb-4 lg:mb-6">
          <button
            onClick={() => navigate('/events')}
            className="text-gray-400 hover:text-white flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-1 sm:mb-1.5 md:mb-2 lg:mb-3"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-4 md:h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-[10px] sm:text-xs md:text-sm lg:text-base">Geri Dön</span>
          </button>
          <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-0.5 sm:mb-1 md:mb-1.5">Yeni Etkinlik Oluştur</h1>
          <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm lg:text-base">Topluluk için yeni bir etkinlik ekleyin</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 lg:p-8 border border-gray-800 space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
          {/* Etkinlik Adı */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
              Etkinlik Adı *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Örn: Python Workshop"
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 text-sm sm:text-base"
              required
            />
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
              Açıklama *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Etkinlik hakkında detaylı bilgi..."
              rows="4"
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 resize-none text-sm sm:text-base"
              required
            />
          </div>

          {/* Etkinlik Türü */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
              Etkinlik Türü *
            </label>
            <select
              name="event_type"
              value={formData.event_type}
              onChange={handleChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 text-sm sm:text-base"
              required
            >
              <option value="EGITIM">Eğitim</option>
              <option value="TEKNIK">Teknik Çalışma</option>
              <option value="SOSYAL">Sosyal Etkinlik</option>
              <option value="PROJE">Proje Toplantısı</option>
              <option value="DIGER">Diğer (Kendin Yaz)</option>
            </select>
            
            {/* Custom Event Type Input - Sadece "Diğer" seçiliyse göster */}
            {formData.event_type === 'DIGER' && (
              <div className="mt-2 sm:mt-3">
                <input
                  type="text"
                  name="custom_event_type"
                  value={formData.custom_event_type}
                  onChange={handleChange}
                  placeholder="Özel etkinlik türünü yazın (Örn: Hackathon, Seminer, vb.)"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-gray-800 border border-red-500 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-400 text-sm sm:text-base"
                  required={formData.event_type === 'DIGER'}
                />
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  📝 Özel bir etkinlik türü girin
                </p>
              </div>
            )}
          </div>

          {/* Tarih ve Saat */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                Tarih ve Saat *
              </label>
              <input
                type="datetime-local"
                name="date_time"
                value={formData.date_time}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 text-sm sm:text-base"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                Süre (dakika) *
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                min="15"
                step="15"
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 text-sm sm:text-base"
                required
              />
            </div>
          </div>

          {/* Konum */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
              Konum *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Örn: Mühendislik Fakültesi D203"
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 text-sm sm:text-base"
              required
            />
          </div>

          {/* Katılım Puanı */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
              Katılım Puanı *
            </label>
            <input
              type="number"
              name="attendance_points"
              value={formData.attendance_points}
              onChange={handleChange}
              min="1"
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 text-sm sm:text-base"
              required
            />
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Etkinliğe katılan üyelerin kazanacağı puan
            </p>
          </div>

          {/* Poster Görseli */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
              Poster Görseli (Opsiyonel)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-gray-800 border border-gray-700 rounded-lg text-white file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-lg file:border-0 file:bg-red-600 file:text-white hover:file:bg-red-700 file:cursor-pointer file:text-xs sm:file:text-sm"
            />
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              PNG, JPG veya GIF (Max 5MB)
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 sm:gap-3 md:gap-4 pt-2 sm:pt-3 md:pt-4">
            <button
              type="button"
              onClick={() => navigate('/events')}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold transition-all border border-gray-700 text-xs sm:text-sm md:text-base"
              disabled={loading}
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm md:text-base"
            >
              {loading ? 'Oluşturuluyor...' : 'Etkinlik Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

