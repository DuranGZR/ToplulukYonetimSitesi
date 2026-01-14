import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';

export default function CreateProjectPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [committees, setCommittees] = useState([]);
  const [committeeMembers, setCommitteeMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'PLANLAMA',
    priority: 'ORTA',
    committee: '',
    start_date: '',
    end_date: '',
    deadline: '',
    tags: '',
    repository_url: '',
    documentation_url: ''
  });

  useEffect(() => {
    fetchCommittees();
  }, []);

  useEffect(() => {
    if (formData.committee) {
      fetchCommitteeMembers(formData.committee);
    } else {
      setCommitteeMembers([]);
      setSelectedMembers([]);
    }
  }, [formData.committee]);

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

  const fetchCommitteeMembers = async (committeeId) => {
    try {
      const response = await api.get(`/committees/${committeeId}/members/`);
      const membersData = Array.isArray(response.data) ? response.data : (response.data?.results || []);
      setCommitteeMembers(membersData);
    } catch (error) {
      console.error('Komite üyeleri yüklenemedi:', error);
      toast.error('Komite üyeleri yüklenirken hata oluştu');
    }
  };

  const toggleMember = (memberId) => {
    setSelectedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Proje adı gerekli');
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
        committee: formData.committee || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        deadline: formData.deadline || null,
        team_members: selectedMembers,
      };

      console.log('Submitting project data:', submitData);
      const response = await api.post('/projects/', submitData);
      toast.success('Proje başarıyla oluşturuldu!');
      navigate(`/projects/${response.data.id}`);
    } catch (error) {
      console.error('Proje oluşturulamadı:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.detail || 
                      error.response?.data?.error ||
                      JSON.stringify(error.response?.data) ||
                      'Proje oluşturulurken hata oluştu';
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/projects')}
            className="text-gray-400 hover:text-white flex items-center gap-2 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Geri Dön
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">Yeni Proje Oluştur</h1>
          <p className="text-gray-400">Topluluk için yeni bir proje başlat</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-6">
          {/* Proje Adı */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Proje Adı <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-600"
              placeholder="Proje adını girin..."
              required
            />
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Açıklama <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-600"
              placeholder="Proje hakkında detaylı açıklama..."
              required
            />
          </div>

          {/* Durum ve Öncelik */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Durum</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-600"
              >
                <option value="PLANLAMA">Planlama</option>
                <option value="AKTIF">Aktif</option>
                <option value="BEKLEMEDE">Beklemede</option>
                <option value="TAMAMLANDI">Tamamlandı</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Öncelik</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-600"
              >
                <option value="DUSUK">Düşük</option>
                <option value="ORTA">Orta</option>
                <option value="YUKSEK">Yüksek</option>
                <option value="KRITIK">Kritik</option>
              </select>
            </div>
          </div>

          {/* Komite Seçimi */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Komite {(user.role === 'KOMITE_LIDERI' || user.role === 'KOMITE_YARDIMCISI') && <span className="text-red-500">*</span>}
            </label>
            <select
              name="committee"
              value={formData.committee}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-600"
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
            <p className="text-xs text-gray-500 mt-1">
              {formData.committee 
                ? 'Sadece seçilen komite üyeleri bu projeyi görebilir'
                : 'Tüm üyeler bu projeyi görebilir'}
            </p>
          </div>

          {/* Takım Üyeleri Seçimi */}
          {formData.committee && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Takım Üyeleri (Opsiyonel)
              </label>
              {committeeMembers.length > 0 ? (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <p className="text-xs text-gray-400 mb-3">Projeye atanacak üyeleri seçin (bildirim gönderilecek)</p>
                  <div className="space-y-2">
                    {committeeMembers.map(member => (
                      <label 
                        key={member.id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(member.id)}
                          onChange={() => toggleMember(member.id)}
                          className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center text-sm font-bold">
                            {member.full_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="text-sm text-white font-medium">{member.full_name}</p>
                            <p className="text-xs text-gray-400">{member.username}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {selectedMembers.length > 0 && (
                    <p className="text-xs text-green-400 mt-3 font-semibold">
                      ✓ {selectedMembers.length} üye seçildi
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-400">Komite üyeleri yükleniyor...</p>
                </div>
              )}
            </div>
          )}

          {/* Tarihler */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Başlangıç Tarihi</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Bitiş Tarihi</label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Son Tarih</label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          {/* Etiketler */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Etiketler</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-600"
              placeholder="React, Python, AI (virgülle ayırın)"
            />
          </div>

          {/* URL'ler */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Repository URL</label>
              <input
                type="url"
                name="repository_url"
                value={formData.repository_url}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-600"
                placeholder="https://github.com/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Dokümantasyon URL</label>
              <input
                type="url"
                name="documentation_url"
                value={formData.documentation_url}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-600"
                placeholder="https://docs.example.com/..."
              />
            </div>
          </div>

          {/* Butonlar */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Oluşturuluyor...' : 'Proje Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
