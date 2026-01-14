import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import SkeletonLoader from '../components/SkeletonLoader';

export default function EffortPage() {
  const { user } = useAuth();
  const [efforts, setEfforts] = useState([]);
  const [myEfforts, setMyEfforts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem('effortsViewMode');
    return saved || 'grid';
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEffort, setSelectedEffort] = useState(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEffortDetail, setSelectedEffortDetail] = useState(null);
  const [statistics, setStatistics] = useState(null);
  
  // Filtreler
  const [filters, setFilters] = useState({
    date: '',
    committee: 'all',
    work_type: 'all',
    project: 'all',
    task: 'all',
    search: ''
  });
  
  // Form verileri
  const [formData, setFormData] = useState({
    work_type: 'GENEL',
    project: '',
    task: '',
    duration_hours: '',
    duration_minutes: '',
    description: ''
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchEfforts(),
        fetchMyEfforts(),
        fetchProjects(),
        fetchTasks(),
        fetchCommittees(),
        fetchStatistics()
      ]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  // Filtreler değiştiğinde verileri yeniden yükle
  useEffect(() => {
    fetchEfforts();
  }, [filters]);

  const fetchEfforts = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.date) params.append('date', filters.date);
      if (filters.committee !== 'all') params.append('committee', filters.committee);
      if (filters.work_type !== 'all') params.append('work_type', filters.work_type);
      if (filters.project !== 'all') params.append('project', filters.project);
      if (filters.task !== 'all') params.append('task', filters.task);
      if (filters.search) params.append('search', filters.search);
      
      const response = await api.get(`/efforts/?${params.toString()}`);
      const effortsData = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setEfforts(effortsData);
    } catch (error) {
      console.error('Eforlar yüklenemedi:', error);
      toast.error('Eforlar yüklenirken hata oluştu');
    }
  };

  const fetchMyEfforts = async () => {
    try {
      const response = await api.get('/efforts/my_efforts/');
      const effortsData = Array.isArray(response.data.results) ? response.data.results : [];
      setMyEfforts(effortsData);
    } catch (error) {
      console.error('Eforlarım yüklenemedi:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects/');
      const projectsData = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setProjects(projectsData.filter(p => p.is_active));
    } catch (error) {
      console.error('Projeler yüklenemedi:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks/');
      const tasksData = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setTasks(tasksData.filter(t => t.is_active && t.status !== 'TAMAMLANDI'));
    } catch (error) {
      console.error('Görevler yüklenemedi:', error);
    }
  };

  const fetchCommittees = async () => {
    try {
      const response = await api.get('/committees/');
      const committeesData = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setCommittees(committeesData);
    } catch (error) {
      console.error('Komiteler yüklenemedi:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/efforts/statistics/');
      setStatistics(response.data);
    } catch (error) {
      console.error('İstatistikler yüklenemedi:', error);
    }
  };

  useEffect(() => {
    fetchEfforts();
  }, [filters]);

  const handleCreateEffort = async (e) => {
    e.preventDefault();
    
    if (!formData.duration_hours && !formData.duration_minutes) {
      toast.error('Lütfen süre girin');
      return;
    }
    
    const totalMinutes = (parseInt(formData.duration_hours || 0) * 60) + parseInt(formData.duration_minutes || 0);
    
    if (totalMinutes < 1) {
      toast.error('Süre en az 1 dakika olmalıdır');
      return;
    }

    try {
      const submitData = {
        work_type: formData.work_type,
        duration_minutes: totalMinutes,
        description: formData.description || '',
        date: new Date().toISOString().split('T')[0] // Bugünün tarihi
      };

      if (formData.work_type === 'PROJE' && formData.project) {
        submitData.project = parseInt(formData.project);
      }
      
      if (formData.work_type === 'GOREV' && formData.task) {
        submitData.task = parseInt(formData.task);
      }

      await api.post('/efforts/', submitData);
      toast.success('Efor başarıyla kaydedildi!');
      setShowCreateModal(false);
      setFormData({
        work_type: 'GENEL',
        project: '',
        task: '',
        duration_hours: '',
        duration_minutes: '',
        description: ''
      });
      
      // Kullanıcı bilgilerini güncelle
      const userRes = await api.get('/users/me/');
      localStorage.setItem('user', JSON.stringify(userRes.data));
      
      fetchEfforts();
      fetchMyEfforts();
      fetchStatistics();
    } catch (error) {
      console.error('Efor oluşturulamadı:', error);
      const errorMsg = error.response?.data?.error || 
                      error.response?.data?.detail ||
                      'Efor oluşturulurken hata oluştu';
      toast.error(errorMsg);
    }
  };

  const handleLike = async (effort) => {
    try {
      if (effort.is_liked) {
        await api.delete(`/efforts/${effort.id}/like/`);
      } else {
        await api.post(`/efforts/${effort.id}/like/`);
      }
      fetchEfforts();
      if (activeTab === 'my') {
        fetchMyEfforts();
      }
    } catch (error) {
      console.error('Beğeni işlemi başarısız:', error);
      toast.error('Beğeni işlemi başarısız');
    }
  };

  const handleComment = async (effortId, commentText) => {
    try {
      await api.post(`/efforts/${effortId}/comment/`, { comment: commentText });
      toast.success('Yorum eklendi');
      
      // Yorumları da dahil ederek effort'u yeniden fetch et
      const response = await api.get(`/efforts/${effortId}/`);
      
      // Effortlar listesini güncelle
      setEfforts(prev => prev.map(e => e.id === effortId ? response.data : e));
      setMyEfforts(prev => prev.map(e => e.id === effortId ? response.data : e));
      
      // Eğer detay modalı açıksa, onu da güncelle
      if (showDetailModal && selectedEffortDetail?.id === effortId) {
        setSelectedEffortDetail(response.data);
      }
    } catch (error) {
      console.error('Yorum eklenemedi:', error);
      toast.error('Yorum eklenirken hata oluştu');
    }
  };

  const handleShowDetail = async (effort) => {
    try {
      // Detaylı effort bilgisini fetch et (yorumlar dahil)
      const response = await api.get(`/efforts/${effort.id}/`);
      setSelectedEffortDetail(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Efor detayları yüklenemedi:', error);
      toast.error('Efor detayları yüklenirken hata oluştu');
    }
  };

  const handleEdit = (effort) => {
    setSelectedEffort(effort);
    const hours = Math.floor(effort.duration_minutes / 60);
    const minutes = effort.duration_minutes % 60;
    setFormData({
      work_type: effort.work_type,
      project: effort.project?.toString() || '',
      task: effort.task?.toString() || '',
      duration_hours: hours.toString(),
      duration_minutes: minutes.toString(),
      description: effort.description || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateEffort = async (e) => {
    e.preventDefault();
    
    if (!formData.duration_hours && !formData.duration_minutes) {
      toast.error('Lütfen süre girin');
      return;
    }
    
    const totalMinutes = (parseInt(formData.duration_hours || 0) * 60) + parseInt(formData.duration_minutes || 0);
    
    if (totalMinutes < 1) {
      toast.error('Süre en az 1 dakika olmalıdır');
      return;
    }

    try {
      const submitData = {
        work_type: formData.work_type,
        duration_minutes: totalMinutes,
        description: formData.description || ''
      };

      if (formData.work_type === 'PROJE' && formData.project) {
        submitData.project = parseInt(formData.project);
      } else {
        submitData.project = null;
      }
      
      if (formData.work_type === 'GOREV' && formData.task) {
        submitData.task = parseInt(formData.task);
      } else {
        submitData.task = null;
      }

      await api.patch(`/efforts/${selectedEffort.id}/`, submitData);
      toast.success('Efor güncellendi!');
      setShowEditModal(false);
      setSelectedEffort(null);
      
      // Kullanıcı bilgilerini güncelle
      const userRes = await api.get('/users/me/');
      localStorage.setItem('user', JSON.stringify(userRes.data));
      
      fetchEfforts();
      fetchMyEfforts();
      fetchStatistics();
    } catch (error) {
      console.error('Efor güncellenemedi:', error);
      toast.error('Efor güncellenirken hata oluştu');
    }
  };

  const handleDelete = async (effort) => {
    if (!window.confirm('Bu eforu silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await api.delete(`/efforts/${effort.id}/`);
      toast.success('Efor silindi');
      fetchEfforts();
      fetchMyEfforts();
      fetchStatistics();
    } catch (error) {
      console.error('Efor silinemedi:', error);
      toast.error('Efor silinirken hata oluştu');
    }
  };

  const displayEfforts = activeTab === 'my' ? myEfforts : efforts;
  const safeDisplayEfforts = Array.isArray(displayEfforts) ? displayEfforts : [];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600 mx-auto"></div>
            <p className="text-gray-400 mt-4">Yükleniyor...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <style>{`
        select option {
          background-color: #1e293b;
          color: white;
        }
        select option:hover,
        select option:checked,
        select option:focus {
          background-color: #dc2626 !important;
          color: white !important;
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .view-transition {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>
      <div className="max-w-7xl mx-auto space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6 px-2 sm:px-4 pb-4 sm:pb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 md:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-0.5 sm:mb-1 md:mb-2 text-white">Eforlar</h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-400">Günlük çalışmalarınızı paylaşın, birbirinizi motive edin</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg text-xs sm:text-sm md:text-base text-center"
          >
            + Efor Ekle
          </button>
        </div>

        {/* Liderlik Tablosu */}
        {statistics && statistics.leaderboard && statistics.leaderboard.length > 0 && (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-gray-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl md:text-2xl">🏆</span>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Liderlik Tablosu</h2>
              </div>
              <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm">En çok çalışan ilk {statistics.leaderboard.length} kişi</p>
            </div>
            <div className="overflow-x-auto">
              <div className="max-h-[240px] sm:max-h-[280px] md:max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800" style={{ scrollbarWidth: 'thin' }}>
                <table className="w-full min-w-[400px]">
                  <thead className="sticky top-0 bg-gradient-to-br from-gray-800 to-gray-900 z-10 shadow-lg">
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-3 md:px-4 text-gray-400 text-[10px] sm:text-xs md:text-sm">Sıra</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-3 md:px-4 text-gray-400 text-[10px] sm:text-xs md:text-sm">Kullanıcı</th>
                      <th className="text-right py-2 sm:py-3 px-2 sm:px-3 md:px-4 text-gray-400 text-[10px] sm:text-xs md:text-sm">Toplam Süre</th>
                      <th className="text-right py-2 sm:py-3 px-2 sm:px-3 md:px-4 text-gray-400 text-[10px] sm:text-xs md:text-sm">Puan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistics.leaderboard.map((leader, index) => (
                      <tr key={leader.user__id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                        <td className="py-2 sm:py-3 px-2 sm:px-3 md:px-4 text-white font-bold text-xs sm:text-sm md:text-base">#{index + 1}</td>
                        <td className="py-2 sm:py-3 px-2 sm:px-3 md:px-4 text-white text-xs sm:text-sm md:text-base">
                          {leader.user__first_name} {leader.user__last_name}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-3 md:px-4 text-right text-white text-xs sm:text-sm md:text-base">
                          {Math.round(leader.total_minutes / 60)} saat
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-3 md:px-4 text-right text-yellow-400 font-bold text-xs sm:text-sm md:text-base">
                          {leader.total_points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Filtreler ve Arama */}
        <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 bg-gray-900 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            {/* Arama */}
            <div>
              <label className="block text-[10px] sm:text-xs md:text-sm text-gray-400 mb-1 sm:mb-2">Kişi Ara</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="İsim veya kullanıcı adı..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-white text-[10px] sm:text-xs md:text-sm focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50"
              />
            </div>

            {/* Tarih Filtresi */}
            <div>
              <label className="block text-[10px] sm:text-xs md:text-sm text-gray-400 mb-1 sm:mb-2">Tarih</label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-white text-[10px] sm:text-xs md:text-sm focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50"
              />
            </div>

            {/* Komite Filtresi */}
            <div>
              <label className="block text-[10px] sm:text-xs md:text-sm text-gray-400 mb-1 sm:mb-2">Komite</label>
              <select
                value={filters.committee}
                onChange={(e) => setFilters(prev => ({ ...prev, committee: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-white text-[10px] sm:text-xs md:text-sm focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50"
              >
                <option value="all">Tüm Komiteler</option>
                {committees.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Çalışma Türü Filtresi */}
            <div>
              <label className="block text-[10px] sm:text-xs md:text-sm text-gray-400 mb-1 sm:mb-2">Çalışma Türü</label>
              <select
                value={filters.work_type}
                onChange={(e) => setFilters(prev => ({ ...prev, work_type: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-white text-[10px] sm:text-xs md:text-sm focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50"
              >
                <option value="all">Tümü</option>
                <option value="PROJE">Proje</option>
                <option value="GOREV">Görev</option>
                <option value="GENEL">Genel Çalışma</option>
                <option value="EGITIM">Eğitim</option>
                <option value="ARASTIRMA">Araştırma</option>
                <option value="TOPLANTI">Toplantı</option>
                <option value="DIGER">Diğer</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 sm:space-x-1.5 md:space-x-2 bg-gray-900 p-0.5 sm:p-1 md:p-2 rounded-lg sm:rounded-xl border border-gray-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 min-w-0 py-1.5 sm:py-2 md:py-3 px-2 sm:px-3 md:px-4 font-medium transition-all rounded-lg text-[10px] sm:text-xs md:text-sm ${
              activeTab === 'all'
                ? 'bg-red-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span className="truncate">Tüm Eforlar</span>
            <span className="text-[10px] sm:text-xs opacity-75 ml-0.5 sm:ml-1 md:ml-2">({efforts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`flex-1 min-w-0 py-1.5 sm:py-2 md:py-3 px-2 sm:px-3 md:px-4 font-medium transition-all rounded-lg text-[10px] sm:text-xs md:text-sm ${
              activeTab === 'my'
                ? 'bg-red-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span className="truncate">Benim Eforlarım</span>
            <span className="text-[10px] sm:text-xs opacity-75 ml-0.5 sm:ml-1 md:ml-2">({myEfforts.length})</span>
          </button>
        </div>

        {/* Görünüm Toggle */}
        <div className="flex items-center justify-center sm:justify-end gap-0.5 sm:gap-1 md:gap-2 bg-gray-900 p-0.5 sm:p-1 rounded-lg border border-gray-800 w-full sm:w-fit sm:ml-auto">
          <button
            onClick={() => {
              setViewMode('grid');
              localStorage.setItem('effortsViewMode', 'grid');
            }}
            className={`p-1.5 sm:p-2 rounded transition-all ${
              viewMode === 'grid'
                ? 'bg-red-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            title="Grid Görünümü"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => {
              setViewMode('list');
              localStorage.setItem('effortsViewMode', 'list');
            }}
            className={`p-1.5 sm:p-2 rounded transition-all ${
              viewMode === 'list'
                ? 'bg-red-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            title="Liste Görünümü"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Eforlar Listesi */}
        {safeDisplayEfforts.length === 0 ? (
          <div className="text-center py-8 sm:py-12 md:py-20 px-4">
            <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-300 mb-1 sm:mb-2">Efor bulunamadı</h3>
            <p className="text-xs sm:text-sm md:text-base text-gray-500 mb-3 sm:mb-4 md:mb-6">
              {activeTab === 'my' 
                ? 'Henüz hiç efor kaydınız yok. İlk eforunuzu ekleyerek başlayın!' 
                : 'Henüz efor kaydı yok. İlk eforu ekleyerek başlayın!'}
            </p>
            {activeTab === 'my' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg text-xs sm:text-sm md:text-base"
              >
                İlk Eforumu Ekle
              </button>
            )}
          </div>
        ) : (
          <div 
            key={viewMode}
            className={`${viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6"
              : "space-y-2 sm:space-y-3 md:space-y-4"
            } view-transition`}
          >
            {safeDisplayEfforts.map((effort, index) => (
              <EffortCard 
                key={effort.id} 
                effort={effort} 
                index={index}
                viewMode={viewMode}
                onLike={() => handleLike(effort)}
                onComment={(comment) => handleComment(effort.id, comment)}
                onEdit={() => handleEdit(effort)}
                onDelete={() => handleDelete(effort)}
                onShowDetail={() => handleShowDetail(effort)}
              />
            ))}
          </div>
        )}

        {/* Efor Oluşturma Modal */}
        {showCreateModal && (
          <CreateEffortModal
            formData={formData}
            setFormData={setFormData}
            projects={projects}
            tasks={tasks}
            onSubmit={handleCreateEffort}
            onClose={() => {
              setShowCreateModal(false);
              setFormData({
                work_type: 'GENEL',
                project: '',
                task: '',
                duration_hours: '',
                duration_minutes: '',
                description: ''
              });
            }}
          />
        )}

        {/* Efor Düzenleme Modal */}
        {showEditModal && selectedEffort && (
          <EditEffortModal
            formData={formData}
            setFormData={setFormData}
            projects={projects}
            tasks={tasks}
            onSubmit={handleUpdateEffort}
            onClose={() => {
              setShowEditModal(false);
              setSelectedEffort(null);
            }}
          />
        )}

        {/* Efor Detay Modal */}
        {showDetailModal && selectedEffortDetail && (
          <EffortDetailModal
            effort={selectedEffortDetail}
            onLike={async () => {
              await handleLike(selectedEffortDetail);
              // Detaylı effort'u yeniden fetch et
              const response = await api.get(`/efforts/${selectedEffortDetail.id}/`);
              setSelectedEffortDetail(response.data);
            }}
            onComment={async (comment) => {
              await handleComment(selectedEffortDetail.id, comment);
            }}
            onEdit={() => {
              setShowDetailModal(false);
              handleEdit(selectedEffortDetail);
            }}
            onDelete={async () => {
              setShowDetailModal(false);
              await handleDelete(selectedEffortDetail);
            }}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedEffortDetail(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
}

// Effort Card Component
function EffortCard({ effort, index, viewMode, onLike, onComment, onEdit, onDelete, onShowDetail }) {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const { user } = useAuth();

  if (viewMode === 'list') {
    return (
      <div 
        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-2 sm:p-3 md:p-4 border border-gray-700 hover:shadow-xl hover:border-red-600/50 transition-all cursor-pointer"
        onClick={(e) => {
          if (!e.target.closest('button, a')) {
            onShowDetail();
          }
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 md:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0 w-full sm:w-auto">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 md:gap-2 mb-1 sm:mb-2">
                <span className="text-sm sm:text-base md:text-lg font-bold text-white truncate">{effort.user_full_name}</span>
                <span className={`bg-gradient-to-r ${getWorkTypeColor(effort.work_type)} text-white text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap`}>
                  {effort.work_type_display}
                </span>
                <span className="text-yellow-400 font-bold text-[10px] sm:text-xs md:text-sm">{effort.points_earned} puan</span>
              </div>
              {effort.description && (
                <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2 line-clamp-1">{effort.description}</p>
              )}
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 text-[10px] sm:text-xs md:text-sm text-gray-500">
                <span>{effort.duration_display}</span>
                <span className="hidden sm:inline">{formatDate(effort.date)}</span>
                <span className="sm:hidden">{new Date(effort.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 w-full sm:w-auto justify-between sm:justify-start">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike();
              }}
              className={`p-1.5 sm:p-2 rounded transition-all ${effort.is_liked ? 'text-red-600' : 'text-gray-400 hover:text-red-600'}`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill={effort.is_liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="ml-0.5 sm:ml-1 text-[10px] sm:text-xs">{effort.likes_count}</span>
            </button>
            {effort.can_edit && (
              <div className="flex gap-1.5 sm:gap-2">
                <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="text-blue-400 hover:text-blue-300 text-[10px] sm:text-xs md:text-sm">Düzenle</button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-red-400 hover:text-red-300 text-[10px] sm:text-xs md:text-sm">Sil</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid görünümü
  return (
    <div 
      className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 border border-gray-700 hover:shadow-xl hover:border-red-600/50 transition-all cursor-pointer"
      onClick={(e) => {
        if (!e.target.closest('button, a')) {
          onShowDetail();
        }
      }}
    >
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-sm sm:text-base md:text-lg truncate">{effort.user_full_name}</h3>
            <span className={`bg-gradient-to-r ${getWorkTypeColor(effort.work_type)} text-white text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full inline-block mt-1`}>
              {effort.work_type_display}
            </span>
          </div>
        </div>
        {effort.can_edit && (
          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="text-blue-400 hover:text-blue-300 text-[10px] sm:text-xs md:text-sm">Düzenle</button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-red-400 hover:text-red-300 text-[10px] sm:text-xs md:text-sm">Sil</button>
          </div>
        )}
      </div>

      {effort.description && (
        <p className="text-gray-300 text-[10px] sm:text-xs md:text-sm mb-2 sm:mb-3 line-clamp-2">{effort.description}</p>
      )}

      <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
        <div className="flex items-center justify-between text-[10px] sm:text-xs md:text-sm">
          <span className="text-gray-400">Süre:</span>
          <span className="text-white font-semibold">{effort.duration_display}</span>
        </div>
        <div className="flex items-center justify-between text-[10px] sm:text-xs md:text-sm">
          <span className="text-gray-400">Puan:</span>
          <span className="text-yellow-400 font-bold">{effort.points_earned}</span>
        </div>
        <div className="flex items-center justify-between text-[10px] sm:text-xs md:text-sm">
          <span className="text-gray-400">Tarih:</span>
          <span className="text-white truncate ml-2">{new Date(effort.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-700 gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLike();
          }}
          className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 md:py-2 rounded-lg transition-all text-[10px] sm:text-xs md:text-sm ${
            effort.is_liked 
              ? 'bg-red-600/20 text-red-500' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill={effort.is_liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{effort.likes_count}</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowCommentInput(!showCommentInput);
          }}
          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 md:py-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 transition-all text-[10px] sm:text-xs md:text-sm"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{effort.comments_count}</span>
        </button>
      </div>

      {showCommentInput && (
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-700">
          <div className="flex gap-1.5 sm:gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && commentText.trim()) {
                  onComment(commentText);
                  setCommentText('');
                  setShowCommentInput(false);
                }
              }}
              placeholder="Yorum yazın..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-white text-[10px] sm:text-xs md:text-sm focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (commentText.trim()) {
                  onComment(commentText);
                  setCommentText('');
                  setShowCommentInput(false);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs md:text-sm font-semibold transition-all"
            >
              Gönder
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Create Effort Modal Component
function CreateEffortModal({ formData, setFormData, projects, tasks, onSubmit, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={onClose}>
      <div 
        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 max-w-md w-full border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto" 
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 sm:mb-5 md:mb-6">Yeni Efor Ekle</h2>
        <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4">
          {/* Çalışma Türü */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Çalışma Türü *
            </label>
            <select
              value={formData.work_type}
              onChange={(e) => {
                setFormData(prev => ({ 
                  ...prev, 
                  work_type: e.target.value,
                  project: e.target.value !== 'PROJE' ? '' : prev.project,
                  task: e.target.value !== 'GOREV' ? '' : prev.task
                }));
              }}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500"
              required
            >
              <option value="PROJE">Proje</option>
              <option value="GOREV">Görev</option>
              <option value="GENEL">Genel Çalışma</option>
              <option value="EGITIM">Eğitim</option>
              <option value="ARASTIRMA">Araştırma</option>
              <option value="TOPLANTI">Toplantı</option>
              <option value="DIGER">Diğer</option>
            </select>
          </div>

          {/* Proje Seçimi */}
          {formData.work_type === 'PROJE' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Proje *
              </label>
              <select
                value={formData.project}
                onChange={(e) => setFormData(prev => ({ ...prev, project: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500"
                required={formData.work_type === 'PROJE'}
              >
                <option value="">Proje Seçin</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Görev Seçimi */}
          {formData.work_type === 'GOREV' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Görev *
              </label>
              <select
                value={formData.task}
                onChange={(e) => setFormData(prev => ({ ...prev, task: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500"
                required={formData.work_type === 'GOREV'}
              >
                <option value="">Görev Seçin</option>
                {tasks.map(task => (
                  <option key={task.id} value={task.id}>{task.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Süre */}
          <div>
            <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
              Süre *
            </label>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <input
                  type="number"
                  value={formData.duration_hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_hours: e.target.value }))}
                  placeholder="Saat"
                  min="0"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-white text-[10px] sm:text-xs md:text-sm focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
                  placeholder="Dakika"
                  min="0"
                  max="59"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-white text-[10px] sm:text-xs md:text-sm focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">En az 1 dakika girmelisiniz</p>
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
              Açıklama
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Ne çalıştınız? Kısa açıklama..."
              rows="3"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-white text-[10px] sm:text-xs md:text-sm focus:outline-none focus:border-red-500 resize-none"
            />
          </div>

          {/* Butonlar */}
          <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold transition-all text-[10px] sm:text-xs md:text-sm"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold transition-all text-[10px] sm:text-xs md:text-sm"
            >
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Effort Modal Component
function EditEffortModal({ formData, setFormData, projects, tasks, onSubmit, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={onClose}>
      <div 
        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 max-w-md w-full border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto" 
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 sm:mb-5 md:mb-6">Eforu Düzenle</h2>
        <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4">
          {/* Çalışma Türü */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Çalışma Türü *
            </label>
            <select
              value={formData.work_type}
              onChange={(e) => {
                setFormData(prev => ({ 
                  ...prev, 
                  work_type: e.target.value,
                  project: e.target.value !== 'PROJE' ? '' : prev.project,
                  task: e.target.value !== 'GOREV' ? '' : prev.task
                }));
              }}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500"
              required
            >
              <option value="PROJE">Proje</option>
              <option value="GOREV">Görev</option>
              <option value="GENEL">Genel Çalışma</option>
              <option value="EGITIM">Eğitim</option>
              <option value="ARASTIRMA">Araştırma</option>
              <option value="TOPLANTI">Toplantı</option>
              <option value="DIGER">Diğer</option>
            </select>
          </div>

          {/* Proje Seçimi */}
          {formData.work_type === 'PROJE' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Proje *
              </label>
              <select
                value={formData.project}
                onChange={(e) => setFormData(prev => ({ ...prev, project: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500"
                required={formData.work_type === 'PROJE'}
              >
                <option value="">Proje Seçin</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Görev Seçimi */}
          {formData.work_type === 'GOREV' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Görev *
              </label>
              <select
                value={formData.task}
                onChange={(e) => setFormData(prev => ({ ...prev, task: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500"
                required={formData.work_type === 'GOREV'}
              >
                <option value="">Görev Seçin</option>
                {tasks.map(task => (
                  <option key={task.id} value={task.id}>{task.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Süre */}
          <div>
            <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
              Süre *
            </label>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <input
                  type="number"
                  value={formData.duration_hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_hours: e.target.value }))}
                  placeholder="Saat"
                  min="0"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-white text-[10px] sm:text-xs md:text-sm focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
                  placeholder="Dakika"
                  min="0"
                  max="59"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-white text-[10px] sm:text-xs md:text-sm focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
              Açıklama
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Ne çalıştınız? Kısa açıklama..."
              rows="3"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-white text-[10px] sm:text-xs md:text-sm focus:outline-none focus:border-red-500 resize-none"
            />
          </div>

          {/* Butonlar */}
          <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold transition-all text-[10px] sm:text-xs md:text-sm"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold transition-all text-[10px] sm:text-xs md:text-sm"
            >
              Güncelle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getWorkTypeColor(type) {
  const colors = {
    'PROJE': 'from-blue-600 to-blue-700',
    'GOREV': 'from-green-600 to-green-700',
    'GENEL': 'from-gray-600 to-gray-700',
    'EGITIM': 'from-purple-600 to-purple-700',
    'ARASTIRMA': 'from-orange-600 to-orange-700',
    'TOPLANTI': 'from-red-600 to-red-700',
    'DIGER': 'from-gray-500 to-gray-600',
  };
  return colors[type] || 'from-gray-600 to-gray-700';
}

// Effort Detail Modal Component
function EffortDetailModal({ effort, onLike, onComment, onEdit, onDelete, onClose }) {
  const [commentText, setCommentText] = useState('');
  const { user } = useAuth();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={onClose}>
      <div 
        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-br from-gray-800 to-gray-900 border-b border-gray-700 p-3 sm:p-4 md:p-6 flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate">{effort.user_full_name}</h2>
              <span className={`bg-gradient-to-r ${getWorkTypeColor(effort.work_type)} text-white text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full whitespace-nowrap`}>
                {effort.work_type_display}
              </span>
            </div>
            <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm">{formatDate(effort.date)}</p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {effort.can_edit && (
              <>
                <button onClick={onEdit} className="text-blue-400 hover:text-blue-300 text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 py-1 rounded hover:bg-gray-800">Düzenle</button>
                <button onClick={onDelete} className="text-red-400 hover:text-red-300 text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 py-1 rounded hover:bg-gray-800">Sil</button>
              </>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 md:space-y-6">
          {/* Açıklama */}
          {effort.description && (
            <div>
              <h3 className="text-gray-400 text-[10px] sm:text-xs md:text-sm font-semibold mb-1 sm:mb-2">Açıklama</h3>
              <p className="text-white text-[10px] sm:text-xs md:text-sm">{effort.description}</p>
            </div>
          )}

          {/* Bilgiler */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
            <div className="bg-gray-800/50 rounded-lg p-2 sm:p-3 md:p-4">
              <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1">Süre</p>
              <p className="text-white font-semibold text-sm sm:text-base md:text-lg">{effort.duration_display}</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-2 sm:p-3 md:p-4">
              <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1">Puan</p>
              <p className="text-yellow-400 font-bold text-sm sm:text-base md:text-lg">{effort.points_earned}</p>
            </div>
          </div>

          {/* Proje/Görev Bilgisi */}
          {(effort.project_title || effort.task_title) && (
            <div>
              <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1">
                {effort.project_title ? 'Proje' : 'Görev'}
              </p>
              <p className="text-white text-[10px] sm:text-xs md:text-sm">{effort.project_title || effort.task_title}</p>
            </div>
          )}

          {/* Beğeniler */}
          {effort.likes && effort.likes.length > 0 && (
            <div>
              <h3 className="text-gray-400 text-[10px] sm:text-xs md:text-sm font-semibold mb-2 sm:mb-3">
                Beğeniler ({effort.likes.length})
              </h3>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {effort.likes.map((like) => (
                  <div
                    key={like.id}
                    className="bg-gray-800/50 rounded-lg px-2 sm:px-3 py-1 sm:py-2 flex items-center gap-1 sm:gap-2"
                  >
                    <span className="text-white text-[10px] sm:text-xs md:text-sm">{like.user_full_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Yorumlar */}
          <div>
            <h3 className="text-gray-400 text-[10px] sm:text-xs md:text-sm font-semibold mb-2 sm:mb-3">
              Yorumlar ({effort.comments?.length || 0})
            </h3>
            
            {/* Yorum Listesi */}
            {effort.comments && effort.comments.length > 0 ? (
              <div className="space-y-2 sm:space-y-3 md:space-y-4 mb-3 sm:mb-4">
                {effort.comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-800/50 rounded-lg p-2 sm:p-3 md:p-4">
                    <div className="flex items-start justify-between mb-1 sm:mb-2">
                      <p className="text-white font-semibold text-[10px] sm:text-xs md:text-sm">{comment.user_full_name}</p>
                      <p className="text-gray-500 text-[10px] sm:text-xs">{formatCommentDate(comment.created_at)}</p>
                    </div>
                    <p className="text-gray-300 text-[10px] sm:text-xs md:text-sm">{comment.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-[10px] sm:text-xs md:text-sm mb-3 sm:mb-4">Henüz yorum yapılmamış.</p>
            )}

            {/* Yorum Yapma */}
            <div className="flex gap-1.5 sm:gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && commentText.trim()) {
                    onComment(commentText);
                    setCommentText('');
                  }
                }}
                placeholder="Yorum yazın..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-white text-[10px] sm:text-xs md:text-sm focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50"
              />
              <button
                onClick={() => {
                  if (commentText.trim()) {
                    onComment(commentText);
                    setCommentText('');
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs md:text-sm font-semibold transition-all"
              >
                Gönder
              </button>
            </div>
          </div>
        </div>

        {/* Footer - Beğeni/Yorum Butonları */}
        <div className="sticky bottom-0 bg-gradient-to-br from-gray-800 to-gray-900 border-t border-gray-700 p-3 sm:p-4 flex items-center justify-between gap-2">
          <button
            onClick={onLike}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg transition-all text-[10px] sm:text-xs md:text-sm ${
              effort.is_liked 
                ? 'bg-red-600/20 text-red-500' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill={effort.is_liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{effort.likes_count || 0}</span>
          </button>
          <div className="flex items-center gap-1 sm:gap-2 text-gray-400 text-[10px] sm:text-xs md:text-sm">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{effort.comments_count || 0} yorum</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

function formatCommentDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Az önce';
  if (diffMins < 60) return `${diffMins} dakika önce`;
  if (diffHours < 24) return `${diffHours} saat önce`;
  if (diffDays < 7) return `${diffDays} gün önce`;
  
  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

