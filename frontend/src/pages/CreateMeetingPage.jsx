import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';

export default function CreateMeetingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [committees, setCommittees] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    meeting_type: 'KOMITE',
    date_time: '',
    location: '',
    duration: 60,
    committee: '',
    is_general: false,
    agenda_items: ''
  });

  useEffect(() => {
    fetchCommittees();
  }, []);

  const fetchCommittees = async () => {
    try {
      const response = await api.get('/committees/');
      const committeesData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || []);
      
      // Komite lideri veya yardımcısı ise sadece kendi komitesini göster
      if (user.role === 'KOMITE_LIDERI' || user.role === 'KOMITE_YARDIMCISI') {
        const userCommittee = committeesData.find(c => 
          c.leader === user.id || c.vice_leader === user.id
        );
        if (userCommittee) {
          setCommittees([userCommittee]);
          // Otomatik olarak kendi komitesini seç
          setFormData(prev => ({ ...prev, committee: userCommittee.id.toString() }));
        } else {
          // Eğer kullanıcının komitesi yoksa boş liste
          setCommittees([]);
        }
      } else {
        // Admin veya başkan için tüm komiteler
        setCommittees(committeesData);
      }
    } catch (error) {
      console.error('Komiteler yüklenemedi:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    // Genel toplantı seçilirse komite seçimini temizle
    if (name === 'is_general' && checked) {
      setFormData(prev => ({ ...prev, committee: '' }));
    }
    // Komite seçilirse genel toplantıyı kapat
    if (name === 'committee' && value) {
      setFormData(prev => ({ ...prev, is_general: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Toplantı adı gerekli');
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

    // Genel toplantı kontrolü
    if (formData.is_general && !user.is_admin) {
      toast.error('Sadece başkan ve başkan yardımcıları genel toplantı oluşturabilir.');
      return;
    }

    // Komite toplantısı kontrolü
    if (!formData.is_general && !formData.committee) {
      toast.error('Komite seçimi gerekli');
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        title: formData.title,
        description: formData.description || '',
        meeting_type: formData.meeting_type,
        date_time: formData.date_time,
        location: formData.location,
        duration: parseInt(formData.duration),
        is_general: formData.is_general,
        agenda_items: formData.agenda_items || '',
      };

      if (!formData.is_general && formData.committee) {
        submitData.committee = parseInt(formData.committee);
      }

      const response = await api.post('/meetings/', submitData);
      
      // API yanıtından id'yi kontrol et
      if (!response.data?.id) {
        toast.error('Toplantı oluşturuldu ancak ID alınamadı. Lütfen sayfayı yenileyin.');
        navigate('/meetings');
        return;
      }
      
      toast.success('Toplantı başarıyla oluşturuldu! QR kod otomatik oluşturuldu.');
      navigate(`/meetings/${response.data.id}`);
    } catch (error) {
      console.error('Toplantı oluşturulamadı:', error);
      const errorMsg = error.response?.data?.detail || 
                      error.response?.data?.error ||
                      (error.response?.data?.non_field_errors && error.response.data.non_field_errors[0]) ||
                      JSON.stringify(error.response?.data) ||
                      'Toplantı oluşturulurken hata oluştu';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const canCreateMeeting = user?.is_admin || user?.role === 'KOMITE_LIDERI' || user?.role === 'KOMITE_YARDIMCISI';

  if (!canCreateMeeting) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto text-center py-12 sm:py-16 md:py-20 px-2 sm:px-4">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-red-500 mb-3 sm:mb-4">Yetkiniz Yok</h1>
          <p className="text-gray-400 mb-4 sm:mb-5 md:mb-6 text-sm sm:text-base">
            Toplantı oluşturmak için yeterli yetkiniz bulunmamaktadır.
          </p>
          <button
            onClick={() => navigate('/meetings')}
            className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg text-xs sm:text-sm md:text-base"
          >
            Toplantılara Dön
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
            onClick={() => navigate('/meetings')}
            className="text-gray-400 hover:text-white flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-1 sm:mb-1.5 md:mb-2 lg:mb-3"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-4 md:h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-[10px] sm:text-xs md:text-sm lg:text-base">Geri Dön</span>
          </button>
          <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-0.5 sm:mb-1 md:mb-1.5">Yeni Toplantı Oluştur</h1>
          <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm lg:text-base">Topluluk için yeni bir toplantı planlayın</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 lg:p-8 border border-gray-800 space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
          {/* Toplantı Adı */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
              Toplantı Adı *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Örn: Aylık Koordinasyon Toplantısı"
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 text-sm sm:text-base"
              required
            />
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
              Açıklama
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Toplantı hakkında detaylı bilgi..."
              rows="4"
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 resize-none text-sm sm:text-base"
            />
          </div>

          {/* Toplantı Türü */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
              Toplantı Türü *
            </label>
            <select
              name="meeting_type"
              value={formData.meeting_type}
              onChange={handleChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 text-sm sm:text-base"
              required
            >
              <option value="KOMITE">Komite Toplantısı</option>
              <option value="GENEL_KURUL">Genel Kurul</option>
              <option value="EGITIM">Eğitim</option>
              <option value="KOORDINASYON">Koordinasyon</option>
              <option value="DIGER">Diğer</option>
            </select>
          </div>

          {/* Genel Toplantı / Komite Seçimi */}
          <div className="space-y-3 sm:space-y-4">
            {user.is_admin && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_general"
                  checked={formData.is_general}
                  onChange={handleChange}
                  className="w-4 h-4 text-red-600 bg-gray-800 border-gray-700 rounded focus:ring-red-500"
                />
                <label className="ml-2 sm:ml-3 text-xs sm:text-sm font-medium text-gray-300">
                  Genel Toplantı (Tüm topluluk için)
                </label>
              </div>
            )}

            {!formData.is_general && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                  Komite *
                </label>
                <select
                  name="committee"
                  value={formData.committee}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  required={!formData.is_general}
                  disabled={(user.role === 'KOMITE_LIDERI' || user.role === 'KOMITE_YARDIMCISI') && !user.is_admin}
                >
                  <option value="">Komite Seçin</option>
                  {committees.map(committee => (
                    <option key={committee.id} value={committee.id}>
                      {committee.name}
                    </option>
                  ))}
                </select>
                {(user.role === 'KOMITE_LIDERI' || user.role === 'KOMITE_YARDIMCISI') && !user.is_admin && (
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Sadece kendi komitenize toplantı oluşturabilirsiniz.
                  </p>
                )}
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

          {/* Gündem Maddeleri */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
              Gündem Maddeleri
            </label>
            <textarea
              name="agenda_items"
              value={formData.agenda_items}
              onChange={handleChange}
              placeholder="Her satıra bir gündem maddesi yazın&#10;Örn:&#10;1. Aylık raporlar&#10;2. Yeni projeler&#10;3. Sorunlar ve çözümler"
              rows="5"
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 resize-none text-sm sm:text-base"
            />
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Her satıra bir gündem maddesi yazın
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 sm:gap-3 md:gap-4 pt-2 sm:pt-3 md:pt-4">
            <button
              type="button"
              onClick={() => navigate('/meetings')}
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
              {loading ? 'Oluşturuluyor...' : 'Toplantı Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

