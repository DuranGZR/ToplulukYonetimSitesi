import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';

export default function CreateTaskPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [committees, setCommittees] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'GELISTIRME',
    difficulty: 'ORTA',
    points: 10,
    committee: '',
    deadline: '',
    tags: '',
    requirements: ''
  });

  useEffect(() => {
    fetchCommittees();
  }, []);


  const fetchCommittees = async () => {
    try {
      const response = await api.get('/committees/');
      
      // API'den gelen veriyi doğru şekilde parse et
      const committeesData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || []);
      
      setCommittees(committeesData);
      
      // Eğer komite lideri ise, sadece kendi komitesini seç
      if (user.role === 'KOMITE_LIDERI' || user.role === 'KOMITE_YARDIMCISI') {
        const userCommittee = committeesData.find(c => 
          c.leader === user.id || c.vice_leader === user.id
        );
        if (userCommittee) {
          setFormData(prev => ({ ...prev, committee: userCommittee.id }));
        }
      }
    } catch (error) {
      console.error('Komiteler yüklenemedi:', error);
      toast.error('Komiteler yüklenirken hata oluştu');
    }
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Görev başlığı gerekli');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error('Açıklama gerekli');
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        points: parseInt(formData.points),
        committee: formData.committee || null,
        deadline: formData.deadline || null,
      };

      await api.post('/tasks/', submitData);
      toast.success('Görev başarıyla oluşturuldu!');
      navigate('/tasks');
    } catch (error) {
      console.error('Görev oluşturulamadı:', error);
      const errorMsg = error.response?.data?.detail || 
                      error.response?.data?.error || 
                      'Görev oluşturulurken hata oluştu';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Komite lideri sadece kendi komitesini görmeli
  const availableCommittees = user.role === 'BASKAN' || user.role === 'BASKAN_YARDIMCISI'
    ? committees
    : committees.filter(c => c.leader === user.id || c.vice_leader === user.id);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-2 sm:px-4 pb-4 sm:pb-6">
        <div className="mb-4 sm:mb-5 md:mb-6">
          <button
            onClick={() => navigate('/tasks')}
            className="text-gray-400 hover:text-white flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 text-xs sm:text-sm"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Geri Dön
          </button>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">Yeni Görev Oluştur</h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-400">Topluluk için yeni bir görev ekle</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-800 space-y-4 sm:space-y-5 md:space-y-6">
          {/* Görev Başlığı */}
          <div>
            <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
              Görev Başlığı <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-white text-[10px] sm:text-xs md:text-sm focus:outline-none focus:border-red-600"
              placeholder="Görev başlığını girin..."
              required
            />
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
              Açıklama <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-white text-[10px] sm:text-xs md:text-sm focus:outline-none focus:border-red-600 resize-none"
              placeholder="Görev hakkında detaylı açıklama..."
              required
            />
          </div>

          {/* Kategori, Zorluk ve Puan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Kategori</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-white text-[10px] sm:text-xs md:text-sm focus:outline-none focus:border-red-600"
              >
                <option value="GELISTIRME">Yazılım Geliştirme</option>
                <option value="TASARIM">Tasarım</option>
                <option value="ICERIK">İçerik Üretimi</option>
                <option value="ARASTIRMA">Araştırma</option>
                <option value="DIGER">Diğer</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Zorluk</label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-white text-[10px] sm:text-xs md:text-sm focus:outline-none focus:border-red-600"
              >
                <option value="KOLAY">Kolay</option>
                <option value="ORTA">Orta</option>
                <option value="ZOR">Zor</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Puan Ödülü</label>
              <input
                type="number"
                name="points"
                value={formData.points}
                onChange={handleChange}
                min="5"
                max="500"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-white text-[10px] sm:text-xs md:text-sm focus:outline-none focus:border-red-600"
                required
              />
            </div>
          </div>

          {/* Komite Seçimi */}
          <div>
            <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
              Komite {(user.role === 'KOMITE_LIDERI' || user.role === 'KOMITE_YARDIMCISI') && <span className="text-red-500">*</span>}
            </label>
            <select
              name="committee"
              value={formData.committee}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-white text-[10px] sm:text-xs md:text-sm focus:outline-none focus:border-red-600"
              disabled={user.role === 'KOMITE_LIDERI' || user.role === 'KOMITE_YARDIMCISI'}
              required={user.role === 'KOMITE_LIDERI' || user.role === 'KOMITE_YARDIMCISI'}
            >
              {(user.role === 'BASKAN' || user.role === 'BASKAN_YARDIMCISI') && (
                <option value="">Genel (Tüm üyeler görebilir)</option>
              )}
              {availableCommittees.map(committee => (
                <option key={committee.id} value={committee.id}>
                  {committee.name}
                </option>
              ))}
            </select>
            <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 mt-1">
              {formData.committee 
                ? 'Sadece seçilen komite üyeleri bu görevi görebilir ve üstlenebilir'
                : 'Tüm üyeler bu görevi görebilir ve üstlenebilir'}
            </p>
          </div>

          {/* Bilgi: Komite seçildiyse, o komitenin tüm üyeleri görevi görebilir ve üstlenebilir */}
          {formData.committee && (
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-2 sm:p-3 md:p-4">
              <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-blue-300">
                💡 Seçilen komitenin tüm üyeleri bu görevi görebilir ve üstlenebilir. Görev onaylandıktan sonra komite üyeleri görev havuzunda görebilecek.
              </p>
            </div>
          )}

          {/* Son Tarih */}
          <div>
            <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Son Tarih</label>
            <input
              type="datetime-local"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-white text-[10px] sm:text-xs md:text-sm focus:outline-none focus:border-red-600"
            />
          </div>

          {/* Etiketler */}
          <div>
            <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Etiketler</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-white text-[10px] sm:text-xs md:text-sm focus:outline-none focus:border-red-600"
              placeholder="React, Python, AI (virgülle ayırın)"
            />
          </div>

          {/* Gereksinimler */}
          <div>
            <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Gereksinimler</label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              rows="3"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-white text-[10px] sm:text-xs md:text-sm focus:outline-none focus:border-red-600 resize-none"
              placeholder="Görev için gerekli bilgi ve beceriler..."
            />
          </div>

          {/* Butonlar */}
          <div className="flex gap-2 sm:gap-3 md:gap-4 pt-3 sm:pt-4">
            <button
              type="button"
              onClick={() => navigate('/tasks')}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold transition-all text-xs sm:text-sm md:text-base"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm md:text-base"
            >
              {loading ? 'Oluşturuluyor...' : 'Görev Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
