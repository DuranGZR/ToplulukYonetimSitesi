import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [submissionUrl, setSubmissionUrl] = useState('');

  useEffect(() => {
    fetchTaskDetails();
    
    // Her 30 saniyede bir otomatik güncelle

  }, [id]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      // Önce normal task endpoint'ini dene
      try {
        const response = await api.get(`/tasks/${id}/`);
        setTask({ ...response.data, isProjectTask: false });
      } catch (taskError) {
        // Eğer 404 dönerse, project-task endpoint'ini dene
        if (taskError.response?.status === 404) {
          const projectTaskResponse = await api.get(`/project-tasks/${id}/`);
          setTask({ ...projectTaskResponse.data, isProjectTask: true });
        } else {
          throw taskError;
        }
      }
    } catch (error) {
      console.error('Görev detayları yüklenemedi:', error);
      toast.error('Görev bulunamadı');
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimTask = async () => {
    try {
      const response = await api.post(`/tasks/${id}/claim/`);
      toast.success(response.data.message);
      fetchTaskDetails(); // Refresh
      
      // Kullanıcı bilgilerini güncelle
      const userRes = await api.get('/users/me/');
      setUser(userRes.data);
      localStorage.setItem('user', JSON.stringify(userRes.data));
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Görev üstlenme başarısız';
      toast.error(errorMsg);
    }
  };

  const handleCompleteTask = async () => {
    try {
      const response = await api.post(`/tasks/${id}/complete/`, {
        completion_note: 'Görev tamamlandı',
        submission_url: submissionUrl
      });
      toast.success(response.data.message);
      setShowCompleteModal(false);
      setSubmissionUrl('');
      
      // Kullanıcı bilgilerini güncelle
      const userRes = await api.get('/users/me/');
      setUser(userRes.data);
      localStorage.setItem('user', JSON.stringify(userRes.data));
      
      fetchTaskDetails(); // Refresh
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Görev tamamlama başarısız';
      toast.error(errorMsg);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Belirtilmemiş';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'KOLAY': 'from-green-600 to-green-700',
      'ORTA': 'from-yellow-600 to-orange-600',
      'ZOR': 'from-red-600 to-red-700'
    };
    return colors[difficulty] || 'from-gray-600 to-gray-700';
  };

  const getStatusColor = (status) => {
    const colors = {
      'BEKLEMEDE': 'bg-gray-800 text-gray-300',
      'DEVAM_EDIYOR': 'bg-red-600 text-white',
      'TAMAMLANDI': 'bg-green-600 text-white',
      'IPTAL': 'bg-gray-900 text-gray-500',
      // Proje görevleri için
      'YAPILACAK': 'bg-gray-800 text-gray-300'
    };
    return colors[status] || 'bg-gray-800 text-white';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'GELISTIRME': 'DEV',
      'TASARIM': 'DSN',
      'ICERIK': 'CNT',
      'ARASTIRMA': 'RSH',
      'DIGER': 'OTH'
    };
    return icons[category] || 'TSK';
  };

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

  if (!task) {
    return null;
  }

  const isProjectTask = task.isProjectTask;
  const canClaim = !isProjectTask && task.status === 'BEKLEMEDE' && !task.assigned_to && user?.id;
  const canComplete = !isProjectTask && task.status === 'DEVAM_EDIYOR' && task.assigned_to === user?.id;
  const isOverdue = task.is_overdue;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8 px-2 sm:px-4 pb-4 sm:pb-6" style={{ animation: 'fadeIn 0.5s ease-out' }}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/tasks')}
          className="group flex items-center text-gray-400 hover:text-white transition-all text-xs sm:text-sm"
        >
          <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-gray-800 group-hover:bg-red-600 flex items-center justify-center mr-1.5 sm:mr-2 transition-all">
            <svg className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <span className="font-medium">Görevlere Dön</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-5 md:space-y-6">
            {/* Task Header */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl md:rounded-2xl p-4 sm:p-5 md:p-6 lg:p-8 border border-gray-700 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-5 md:mb-6 gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-wrap">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 ${isProjectTask ? 'bg-purple-600' : 'bg-red-600'} rounded-lg sm:rounded-xl flex items-center justify-center text-white ${isProjectTask ? 'text-lg sm:text-xl md:text-2xl' : 'text-sm sm:text-base md:text-lg lg:text-xl font-bold'} shadow-lg flex-shrink-0`}>
                    {isProjectTask ? '📋' : getCategoryIcon(task.category)}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {isProjectTask ? (
                      <span className={`bg-gradient-to-r from-purple-600 to-purple-700 text-white text-[10px] sm:text-xs md:text-sm font-semibold px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full shadow-lg inline-block`}>
                        {task.priority_display || 'Orta'}
                      </span>
                    ) : (
                      <span className={`bg-gradient-to-r ${getDifficultyColor(task.difficulty)} text-white text-[10px] sm:text-xs md:text-sm font-semibold px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full shadow-lg inline-block`}>
                        {task.difficulty_display}
                      </span>
                    )}
                    <span className={`${getStatusColor(task.status)} text-[10px] sm:text-xs md:text-sm font-semibold px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full shadow-lg inline-block`}>
                      {task.status_display}
                    </span>
                    {isProjectTask && (
                      <span className="bg-purple-600/20 text-purple-300 text-[10px] sm:text-xs md:text-sm font-semibold px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full shadow-lg inline-block border border-purple-600/50">
                        Proje Görevi
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">{task.title}</h1>
              
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 text-sm sm:text-base md:text-lg leading-relaxed whitespace-pre-wrap">
                  {task.description || 'Açıklama yok'}
                </p>
              </div>

              {/* Tags - sadece normal görevler için */}
              {!isProjectTask && task.tags && task.tags.trim() !== '' && (
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-4 sm:mt-5 md:mt-6">
                  {task.tags.split(',').map((tag, idx) => (
                    <span key={idx} className="bg-white/10 hover:bg-white/20 text-gray-300 text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full border border-gray-700 transition-colors">
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Requirements - sadece normal görevler için */}
            {!isProjectTask && task.requirements && task.requirements.trim() !== '' && (
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl md:rounded-2xl p-4 sm:p-5 md:p-6 border border-gray-700 shadow-xl">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Gereksinimler
                </h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                    {task.requirements}
                  </p>
                </div>
              </div>
            )}

            {/* Comments Section - sadece normal görevler için */}
            {!isProjectTask && task.comments && task.comments.length > 0 && (
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl md:rounded-2xl p-4 sm:p-5 md:p-6 border border-gray-700 shadow-xl">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Yorumlar ({task.comments.length})
                </h2>
                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                  {task.comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                        <span className="text-white font-semibold text-xs sm:text-sm md:text-base">{comment.user_name}</span>
                        <span className="text-gray-500 text-[10px] sm:text-xs md:text-sm">
                          {new Date(comment.created_at).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      <p className="text-gray-300 text-xs sm:text-sm md:text-base">{comment.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-5 md:space-y-6">
            {/* Task Info Cards */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-700 shadow-xl space-y-3 sm:space-y-4">
              {/* Points */}
              <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-yellow-500/20 to-orange-600/20 rounded-lg sm:rounded-xl border border-yellow-500/30">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm">Puan Ödülü</p>
                    <p className="text-white font-bold text-base sm:text-lg md:text-xl">+{task.points}</p>
                  </div>
                </div>
              </div>

              {/* Category - sadece normal görevler için */}
              {!isProjectTask && (
                <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-800/50 rounded-lg sm:rounded-xl border border-gray-700">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-[9px] sm:text-[10px] md:text-xs">{getCategoryIcon(task.category)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm">Kategori</p>
                      <p className="text-white font-semibold text-xs sm:text-sm md:text-base truncate">{task.category_display}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Priority - sadece proje görevleri için */}
              {isProjectTask && (
                <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-800/50 rounded-lg sm:rounded-xl border border-gray-700">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm">Öncelik</p>
                      <p className="text-white font-semibold text-xs sm:text-sm md:text-base truncate">{task.priority_display || 'Orta'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Committee - sadece normal görevler için */}
              {!isProjectTask && task.committee_name && (
                <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-800/50 rounded-lg sm:rounded-xl border border-gray-700">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm">Komite</p>
                      <p className="text-white font-semibold text-xs sm:text-sm md:text-base truncate">{task.committee_name}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Project - sadece proje görevleri için */}
              {isProjectTask && task.project && (
                <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-800/50 rounded-lg sm:rounded-xl border border-gray-700">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm">Proje</p>
                      <p className="text-white font-semibold text-xs sm:text-sm md:text-base truncate">Proje #{task.project}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Created By - sadece normal görevler için */}
              {!isProjectTask && task.created_by_name && (
                <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-800/50 rounded-lg sm:rounded-xl border border-gray-700">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm">Oluşturan</p>
                      <p className="text-white font-semibold text-xs sm:text-sm md:text-base truncate">{task.created_by_name}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Assigned To */}
              {task.assigned_to_name && (
                <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-800/50 rounded-lg sm:rounded-xl border border-gray-700">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm">Atanan</p>
                      <p className="text-white font-semibold text-xs sm:text-sm md:text-base truncate">{task.assigned_to_name}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Deadline */}
              {task.deadline && (
                <div className={`flex items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl border ${isOverdue ? 'bg-red-900/20 border-red-600' : 'bg-gray-800/50 border-gray-700'}`}>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${isOverdue ? 'bg-red-600' : 'bg-blue-600'}`}>
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm">Son Tarih</p>
                      <p className={`font-semibold text-[10px] sm:text-xs md:text-sm ${isOverdue ? 'text-red-400' : 'text-white'}`}>
                        <span className="truncate block">{formatDate(task.deadline)}</span>
                        {isOverdue && <span className="ml-1 text-[9px] sm:text-[10px]">(Gecikti!)</span>}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submission URL - sadece normal görevler için */}
              {!isProjectTask && task.submission_url && (
                <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-800/50 rounded-lg sm:rounded-xl border border-gray-700">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm">Teslim Linki</p>
                      <a 
                        href={task.submission_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-[10px] sm:text-xs md:text-sm break-all"
                      >
                        {task.submission_url}
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 sm:space-y-3">
              {/* Proje Görevi için Projeye Git butonu */}
              {isProjectTask && task.project && (
                <Link
                  to={`/projects/${task.project}`}
                  className="block w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm md:text-base lg:text-lg transition-all shadow-lg hover:shadow-purple-600/50 text-center"
                >
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Projeye Git
                  </div>
                </Link>
              )}

              {/* Normal görev için butonlar */}
              {!isProjectTask && canClaim && (
                <button
                  onClick={handleClaimTask}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm md:text-base lg:text-lg transition-all shadow-lg hover:shadow-red-600/50"
                >
                  Görevi Üstlen
                </button>
              )}

              {!isProjectTask && canComplete && (
                <button
                  onClick={() => setShowCompleteModal(true)}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm md:text-base lg:text-lg transition-all shadow-lg hover:shadow-green-600/50"
                >
                  Görevi Tamamla
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Complete Modal */}
        {showCompleteModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={() => setShowCompleteModal(false)}>
            <div 
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 max-w-md w-full border border-gray-700 shadow-2xl" 
              onClick={e => e.stopPropagation()}
              style={{ animation: 'scaleIn 0.3s ease-out' }}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-xl sm:text-2xl">
                  ✅
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Görevi Tamamla</h3>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-gray-300 text-[10px] sm:text-xs md:text-sm font-semibold mb-1 sm:mb-2">
                    🔗 Teslim Linki (opsiyonel)
                  </label>
                  <input
                    type="url"
                    value={submissionUrl}
                    onChange={(e) => setSubmissionUrl(e.target.value)}
                    placeholder="GitHub, Drive vb."
                    className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                  />
                </div>
                <div className="flex space-x-2 sm:space-x-3">
                  <button
                    onClick={handleCompleteTask}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold transition-all shadow-lg text-[10px] sm:text-xs md:text-sm"
                  >
                    ✅ Onayla
                  </button>
                  <button
                    onClick={() => setShowCompleteModal(false)}
                    className="flex-1 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold transition-all text-[10px] sm:text-xs md:text-sm"
                  >
                    ❌ İptal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

