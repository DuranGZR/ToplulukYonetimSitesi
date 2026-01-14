import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import SkeletonLoader from '../components/SkeletonLoader';

export default function TasksPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [pastTasks, setPastTasks] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [filterValues, setFilterValues] = useState({ committee: 'all' });
  const [viewMode, setViewMode] = useState(() => {
    // localStorage'dan görünüm tercihini yükle
    const saved = localStorage.getItem('tasksViewMode');
    return saved || 'grid'; // 'grid', 'list', 'compact', 'detailed'
  });

  const fetchCommittees = useCallback(async () => {
    try {
      const response = await api.get('/committees/');
      const committeesData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || []);
      setCommittees(committeesData);
    } catch (error) {
      console.error('Komiteler yüklenemedi:', error);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const [availableRes, myRes, myProjectTasksRes] = await Promise.all([
        api.get('/tasks/available/'),
        api.get('/tasks/my_tasks/'),
        api.get('/project-tasks/my_tasks/')
      ]);
      
      // API response formatını kontrol et (array veya {results: []} olabilir)
      const availableTasksData = Array.isArray(availableRes.data) ? availableRes.data : (availableRes.data?.results || []);
      const myTasksData = Array.isArray(myRes.data) ? myRes.data : (myRes.data?.results || []);
      const myProjectTasksData = Array.isArray(myProjectTasksRes.data) ? myProjectTasksRes.data : (myProjectTasksRes.data?.results || []);
      
      // Normal görevler + Proje görevlerini birleştir
      const combinedMyTasks = [
        ...myTasksData,
        ...myProjectTasksData.map(task => ({
          ...task,
          isProjectTask: true,
          category: 'GELISTIRME',
          category_display: 'Proje Görevi',
          difficulty: task.priority === 'YUKSEK' ? 'ZOR' : task.priority === 'ORTA' ? 'ORTA' : 'KOLAY',
          difficulty_display: task.priority_display
        }))
      ];
      
      // Deadline'a göre yaklaşan ve geçmiş görevleri ayır
      const now = new Date();
      const upcoming = availableTasksData.filter(task => {
        if (!task.deadline) return true; // Deadline yoksa yaklaşan sayılır
        return new Date(task.deadline) >= now;
      });
      const past = availableTasksData.filter(task => {
        if (!task.deadline) return false; // Deadline yoksa geçmiş sayılmaz
        return new Date(task.deadline) < now;
      });
      
      // Verileri set et ve loading'i kapat
      setTasks(upcoming);
      setPastTasks(past);
      setMyTasks(combinedMyTasks);
      setLoading(false);
    } catch (error) {
      console.error('Görevler yüklenemedi:', error);
      toast.error('Görevler yüklenirken hata oluştu');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommittees();
    fetchTasks();
    
    // Her 30 saniyede bir otomatik güncelle

  }, [fetchCommittees, fetchTasks]);

  const handleClaimTask = useCallback(async (taskId) => {
    try {
      const response = await api.post(`/tasks/${taskId}/claim/`);
      toast.success(response.data.message);
      fetchTasks(); // Refresh
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Görev üstlenme başarısız';
      toast.error(errorMsg);
    }
  }, [fetchTasks]);

  const handleCompleteTask = async (taskId, submissionUrl = '') => {
    try {
      const response = await api.post(`/tasks/${taskId}/complete/`, {
        completion_note: 'Görev tamamlandı',
        submission_url: submissionUrl
      });
      toast.success(response.data.message);
      
      // Kullanıcı bilgilerini güncelle
      const userRes = await api.get('/users/me/');
      setUser(userRes.data);
      localStorage.setItem('user', JSON.stringify(userRes.data));
      
      fetchTasks(); // Refresh tasks
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Görev tamamlama başarısız';
      toast.error(errorMsg);
    }
  };

  const handleTransferTask = async (taskId, userId, reason = '') => {
    try {
      const response = await api.post(`/tasks/${taskId}/transfer/`, {
        user_id: userId,
        reason: reason
      });
      toast.success(response.data.message);
      fetchTasks(); // Refresh tasks
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Görev devretme başarısız';
      toast.error(errorMsg);
    }
  };

  const handleCancelTask = async (taskId, reason) => {
    try {
      const response = await api.post(`/tasks/${taskId}/cancel/`, {
        reason: reason
      });
      toast.success(response.data.message);
      fetchTasks(); // Refresh tasks
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Görev iptal etme başarısız';
      toast.error(errorMsg);
    }
  };

  const handleShareTask = async (taskId, userId = null) => {
    try {
      const response = await api.post(`/tasks/${taskId}/share/`, userId ? { user_id: userId } : {});
      const shareData = response.data.share_data;
      
      // Clipboard'a kopyala
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.task_url);
        toast.success('Görev linki kopyalandı!');
      } else {
        // Fallback: Manuel kopyalama
        const textArea = document.createElement('textarea');
        textArea.value = shareData.task_url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success('Görev linki kopyalandı!');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Görev paylaşımı başarısız';
      toast.error(errorMsg);
    }
  };


  const getDifficultyColor = (difficulty) => {
    return 'from-gray-700 to-gray-700';
  };

  const getDifficultyIcon = (difficulty) => {
    const icons = {
      KOLAY: '•',
      ORTA: '••',
      ZOR: '•••'
    };
    return icons[difficulty] || '•';
  };

  const getCategoryIcon = (category, isProjectTask) => {
    if (isProjectTask) return '📋';
    
    const icons = {
      GELISTIRME: 'DEV',
      TASARIM: 'DSN',
      ICERIK: 'CNT',
      ARASTIRMA: 'RSH',
      DIGER: 'OTH'
    };
    return icons[category] || 'TSK';
  };

  const getCategoryGradient = (category) => {
    return 'from-red-600 to-red-600';
  };

  const getStatusColor = (status) => {
    const colors = {
      BEKLEMEDE: 'bg-gray-800 text-gray-300',
      DEVAM_EDIYOR: 'bg-red-600 text-white',
      TAMAMLANDI: 'bg-gray-700 text-white',
      IPTAL: 'bg-gray-900 text-gray-500'
    };
    return colors[status] || 'bg-gray-800 text-white';
  };

  const getStatusIcon = (status) => {
    return '';
  };

  // Liste Görünümü Componenti
  const TaskListItem = ({ task, showActions = true, index = 0 }) => {
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [submissionUrl, setSubmissionUrl] = useState('');
    const [transferUserId, setTransferUserId] = useState('');
    const [transferReason, setTransferReason] = useState('');
    const [cancelReason, setCancelReason] = useState('');
    const [taskCommitteeMembers, setTaskCommitteeMembers] = useState([]);

    const handleComplete = () => {
      handleCompleteTask(task.id, submissionUrl);
      setShowCompleteModal(false);
      setSubmissionUrl('');
    };

    const handleTransfer = async () => {
      if (!transferUserId) {
        toast.error('Lütfen bir kullanıcı seçin');
        return;
      }
      await handleTransferTask(task.id, transferUserId, transferReason);
      setShowTransferModal(false);
      setTransferUserId('');
      setTransferReason('');
    };

    const handleCancel = async () => {
      if (!cancelReason.trim()) {
        toast.error('Lütfen iptal sebebini belirtin');
        return;
      }
      await handleCancelTask(task.id, cancelReason);
      setShowCancelModal(false);
      setCancelReason('');
    };

    const handleOpenTransferModal = async () => {
      if (task.committee) {
        try {
          const response = await api.get(`/committees/${task.committee}/members/`);
          const membersData = Array.isArray(response.data) ? response.data : (response.data?.results || []);
          setTaskCommitteeMembers(membersData);
        } catch (error) {
          console.error('Komite üyeleri yüklenemedi:', error);
          setTaskCommitteeMembers([]);
        }
      } else {
        try {
          const response = await api.get('/users/');
          const usersData = Array.isArray(response.data) ? response.data : (response.data?.results || []);
          setTaskCommitteeMembers(usersData);
        } catch (error) {
          console.error('Kullanıcılar yüklenemedi:', error);
          setTaskCommitteeMembers([]);
        }
      }
      setShowTransferModal(true);
    };

    return (
      <div 
        onClick={(e) => {
          if (!e.target.closest('button, a')) {
            navigate(`/tasks/${task.id}`);
          }
        }}
        className="group bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-3 sm:p-4 hover:shadow-xl hover:border-red-600/50 transition-all duration-300 border border-gray-700 cursor-pointer"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          {/* Sol Taraf - İkon ve Başlık */}
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 ${task.isProjectTask ? 'bg-purple-600' : 'bg-red-600'} rounded-lg flex items-center justify-center ${task.isProjectTask ? 'text-lg sm:text-xl' : 'text-xs font-bold'} text-white shadow-lg flex-shrink-0`}>
              {getCategoryIcon(task.category, task.isProjectTask)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                <h3 className="text-base sm:text-lg font-bold text-white truncate w-full sm:w-auto">{task.title}</h3>
                <span className={`${getStatusColor(task.status)} text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap`}>
                  {task.status_display}
                </span>
              </div>
              <p className="text-gray-400 text-xs sm:text-sm line-clamp-1">{task.description}</p>
              {/* Mobilde bilgileri göster */}
              <div className="flex items-center gap-3 mt-2 sm:hidden text-xs">
                <span className="text-yellow-400 font-bold">+{task.points}</span>
                {task.deadline && (
                  <span className={`font-semibold ${task.is_overdue ? 'text-red-400' : 'text-white'}`}>
                    {task.isProjectTask 
                      ? new Date(task.deadline).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
                      : task.time_remaining?.split(' ')[0] + ' gün' || 'Belirsiz'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Orta - Bilgiler */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-gray-400 text-xs">Puan</p>
              <p className="text-yellow-400 font-bold">+{task.points}</p>
            </div>
            {task.deadline && (
              <div className="text-center">
                <p className="text-gray-400 text-xs">Son Tarih</p>
                <p className={`font-semibold ${task.is_overdue ? 'text-red-400' : 'text-white'}`}>
                  {task.isProjectTask 
                    ? new Date(task.deadline).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
                    : task.time_remaining?.split(' ')[0] + ' gün' || 'Belirsiz'}
                </p>
              </div>
            )}
            {task.committee_name && (
              <div className="text-center">
                <p className="text-gray-400 text-xs">Komite</p>
                <p className="text-red-400 font-semibold text-xs">{task.committee_name}</p>
              </div>
            )}
          </div>

          {/* Sağ Taraf - Aksiyonlar */}
          {showActions && (
            <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end sm:justify-start">
              {!task.isProjectTask && task.status === 'BEKLEMEDE' && !task.assigned_to && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClaimTask(task.id);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                >
                  Üstlen
                </button>
              )}
              {!task.isProjectTask && task.status === 'DEVAM_EDIYOR' && task.assigned_to === user?.id && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCompleteModal(true);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                  >
                    Tamamla
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenTransferModal();
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                    title="Devret"
                  >
                    🔄
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCancelModal(true);
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                    title="İptal"
                  >
                    ⚠️
                  </button>
                </>
              )}
              <Link
                to={`/tasks/${task.id}`}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              >
                Detay
              </Link>
            </div>
          )}
        </div>

        {/* Complete Modal */}
        {showCompleteModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowCompleteModal(false)}>
            <div 
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700 shadow-2xl" 
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-2xl">
                  ✅
                </div>
                <h3 className="text-2xl font-bold text-white">Görevi Tamamla</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-2">
                    🔗 Teslim Linki (opsiyonel)
                  </label>
                  <input
                    type="url"
                    value={submissionUrl}
                    onChange={(e) => setSubmissionUrl(e.target.value)}
                    placeholder="GitHub, Drive vb."
                    className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleComplete}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white px-4 py-3 rounded-lg font-semibold transition-all shadow-lg"
                  >
                    ✅ Onayla
                  </button>
                  <button
                    onClick={() => setShowCompleteModal(false)}
                    className="flex-1 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-3 rounded-lg font-semibold transition-all"
                  >
                    ❌ İptal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transfer Modal */}
        {showTransferModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowTransferModal(false)}>
            <div 
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700 shadow-2xl" 
              onClick={e => e.stopPropagation()}
              style={{ animation: 'scaleIn 0.3s ease-out' }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-2xl">
                  🔄
                </div>
                <h3 className="text-2xl font-bold text-white">Görevi Devret</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-2">
                    Kullanıcı Seç
                  </label>
                  <select
                    value={transferUserId}
                    onChange={(e) => setTransferUserId(e.target.value)}
                    className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="">Kullanıcı seçin...</option>
                    {taskCommitteeMembers
                      .filter(member => member.id !== user?.id)
                      .map(member => (
                        <option key={member.id} value={member.id}>
                          {member.full_name} {member.level ? `(Level ${member.level})` : ''}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-2">
                    Devretme Sebebi (opsiyonel)
                  </label>
                  <textarea
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    placeholder="Neden devrediyorsunuz?"
                    rows={3}
                    className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleTransfer}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white px-4 py-3 rounded-lg font-semibold transition-all shadow-lg"
                  >
                    Devret
                  </button>
                  <button
                    onClick={() => setShowTransferModal(false)}
                    className="flex-1 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-3 rounded-lg font-semibold transition-all"
                  >
                    İptal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={() => setShowCancelModal(false)}>
            <div 
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 max-w-md w-full border border-gray-700 shadow-2xl" 
              onClick={e => e.stopPropagation()}
              style={{ animation: 'scaleIn 0.3s ease-out' }}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center text-xl sm:text-2xl">
                  ⚠️
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Görevi İptal Et</h3>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <p className="text-gray-300 text-[10px] sm:text-xs md:text-sm">
                  Bu görevi iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </p>
                <div>
                  <label className="block text-gray-300 text-[10px] sm:text-xs md:text-sm font-semibold mb-1 sm:mb-2">
                    İptal Sebebi <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Görevi neden iptal ediyorsunuz?"
                    rows={3}
                    required
                    className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all resize-none"
                  />
                </div>
                <div className="flex space-x-2 sm:space-x-3">
                  <button
                    onClick={handleCancel}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold transition-all shadow-lg text-[10px] sm:text-xs md:text-sm"
                  >
                    İptal Et
                  </button>
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold transition-all text-[10px] sm:text-xs md:text-sm"
                  >
                    Vazgeç
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Kompakt Görünüm Componenti
  const TaskCompactItem = ({ task, showActions = true, index = 0 }) => {
    return (
      <div 
        onClick={(e) => {
          if (!e.target.closest('button, a')) {
            navigate(`/tasks/${task.id}`);
          }
        }}
        className="group bg-gray-800 rounded-lg p-3 hover:bg-gray-700 hover:border-red-600/50 transition-all duration-200 border border-gray-700 cursor-pointer"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`w-8 h-8 ${task.isProjectTask ? 'bg-purple-600' : 'bg-red-600'} rounded flex items-center justify-center ${task.isProjectTask ? 'text-lg' : 'text-xs font-bold'} text-white flex-shrink-0`}>
              {getCategoryIcon(task.category, task.isProjectTask)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white truncate">{task.title}</h3>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-yellow-400 text-xs font-bold">+{task.points}</span>
              <span className={`${getStatusColor(task.status)} text-xs px-2 py-0.5 rounded`}>
                {task.status_display}
              </span>
            </div>
          </div>
          {showActions && !task.isProjectTask && task.status === 'BEKLEMEDE' && !task.assigned_to && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClaimTask(task.id);
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-semibold transition-all flex-shrink-0"
            >
              Üstlen
            </button>
          )}
        </div>
      </div>
    );
  };

  const TaskCard = ({ task, showActions = true, index = 0 }) => {
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [submissionUrl, setSubmissionUrl] = useState('');
    const [transferUserId, setTransferUserId] = useState('');
    const [transferReason, setTransferReason] = useState('');
    const [cancelReason, setCancelReason] = useState('');
    const [taskCommitteeMembers, setTaskCommitteeMembers] = useState([]);

    const handleComplete = () => {
      handleCompleteTask(task.id, submissionUrl);
      setShowCompleteModal(false);
      setSubmissionUrl('');
    };

    const handleTransfer = async () => {
      if (!transferUserId) {
        toast.error('Lütfen bir kullanıcı seçin');
        return;
      }
      await handleTransferTask(task.id, transferUserId, transferReason);
      setShowTransferModal(false);
      setTransferUserId('');
      setTransferReason('');
    };

    const handleCancel = async () => {
      if (!cancelReason.trim()) {
        toast.error('Lütfen iptal sebebini belirtin');
        return;
      }
      await handleCancelTask(task.id, cancelReason);
      setShowCancelModal(false);
      setCancelReason('');
    };

    // Görev devretme modal'ı açıldığında komite üyelerini yükle
    const handleOpenTransferModal = async () => {
      if (task.committee) {
        try {
          const response = await api.get(`/committees/${task.committee}/members/`);
          const membersData = Array.isArray(response.data) ? response.data : (response.data?.results || []);
          setTaskCommitteeMembers(membersData);
        } catch (error) {
          console.error('Komite üyeleri yüklenemedi:', error);
          setTaskCommitteeMembers([]);
        }
      } else {
        // Komite yoksa tüm kullanıcıları yükle (admin için)
        try {
          const response = await api.get('/users/');
          const usersData = Array.isArray(response.data) ? response.data : (response.data?.results || []);
          setTaskCommitteeMembers(usersData);
        } catch (error) {
          console.error('Kullanıcılar yüklenemedi:', error);
          setTaskCommitteeMembers([]);
        }
      }
      setShowTransferModal(true);
    };

    const handleCardClick = (e) => {
      // Eğer buton veya link tıklanmışsa, kart tıklamasını engelle
      if (e.target.closest('button, a')) {
        return;
      }
      // Görev detay sayfasına git
      navigate(`/tasks/${task.id}`);
    };

    return (
      <div 
        onClick={handleCardClick}
        className="relative group bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 hover:shadow-2xl sm:hover:scale-[1.02] transition-all duration-300 border border-gray-700 cursor-pointer"
        style={{ animation: `slideUp 0.3s ease-out ${index * 0.1}s backwards` }}
      >
        {/* Category Icon Background */}
        <div className={`absolute top-1.5 sm:top-2 md:top-4 right-1.5 sm:right-2 md:right-4 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-gradient-to-br ${getCategoryGradient(task.category)} opacity-10 rounded-full blur-xl`}></div>
        
        {/* Header */}
        <div className="relative flex items-start justify-between mb-2 sm:mb-3 md:mb-4 gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-1 min-w-0">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${task.isProjectTask ? 'bg-purple-600' : 'bg-red-600'} rounded-lg flex items-center justify-center ${task.isProjectTask ? 'text-lg sm:text-xl md:text-2xl' : 'text-[10px] sm:text-xs font-bold'} text-white shadow-lg flex-shrink-0`}>
              {getCategoryIcon(task.category, task.isProjectTask)}
            </div>
            <div className="min-w-0">
              <span className={`bg-gradient-to-r ${getDifficultyColor(task.difficulty)} text-white text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded-full shadow-lg flex items-center gap-0.5 sm:gap-1 inline-flex`}>
                {getDifficultyIcon(task.difficulty)} {task.difficulty_display}
              </span>
            </div>
          </div>
          <span className={`${getStatusColor(task.status)} text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-1.5 rounded-full shadow-lg flex items-center gap-0.5 sm:gap-1 flex-shrink-0`}>
            {getStatusIcon(task.status)} {task.status_display}
          </span>
        </div>

        <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white mb-1 sm:mb-2 line-clamp-2">{task.title}</h3>
        <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm mb-2 sm:mb-3 md:mb-4 line-clamp-2 sm:line-clamp-3">{task.description}</p>

        {task.tags && task.tags.trim() !== '' && (
          <div className="flex flex-wrap gap-1 sm:gap-1.5 md:gap-2 mb-2 sm:mb-3 md:mb-4">
            {task.tags.split(',').map((tag, idx) => (
              <span key={idx} className="bg-white/5 hover:bg-white/10 text-gray-300 text-[9px] sm:text-[10px] md:text-xs px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded-full border border-gray-700 transition-colors">
                #{tag.trim()}
              </span>
            ))}
          </div>
        )}

        <div className="space-y-1.5 sm:space-y-2 md:space-y-2.5 mb-2 sm:mb-3 md:mb-4 bg-white/5 rounded-lg p-1.5 sm:p-2 md:p-3">
          {task.isProjectTask && (
            <div className="flex items-center justify-between text-[10px] sm:text-xs md:text-sm mb-1.5 sm:mb-2 pb-1.5 sm:pb-2 border-b border-purple-500/30">
              <span className="text-purple-400 font-semibold flex items-center gap-0.5 sm:gap-1">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
                </svg>
                Proje Görevi
              </span>
              <span className="text-purple-300 text-[9px] sm:text-[10px] md:text-xs">{task.status_display}</span>
            </div>
          )}
          
          {!task.isProjectTask && (
            <div className="flex items-center justify-between text-[10px] sm:text-xs md:text-sm">
              <span className="text-gray-400">Kategori</span>
              <span className="text-white font-semibold truncate ml-2">{task.category_display}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between text-[10px] sm:text-xs md:text-sm">
            <span className="text-gray-400">Puan Ödülü</span>
            <span className="text-white font-bold text-xs sm:text-sm md:text-base">+{task.points}</span>
          </div>
          
          {task.committee_name && (
            <div className="flex items-center justify-between text-[10px] sm:text-xs md:text-sm">
              <span className="text-gray-400">Komite</span>
              <span className="text-red-400 font-semibold truncate ml-2">{task.committee_name}</span>
            </div>
          )}
          
          {task.deadline && (
            <div className="flex items-center justify-between text-[10px] sm:text-xs md:text-sm">
              <span className="text-gray-400">Son Tarih</span>
              <span className={`font-semibold truncate ml-2 ${task.is_overdue ? 'text-red-400' : 'text-white'}`}>
                {task.isProjectTask 
                  ? new Date(task.deadline).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
                  : task.time_remaining || 'Belirsiz'
                }
              </span>
            </div>
          )}
          
          {/* Atanan kişi gösterimi */}
          {task.assigned_to_name && (
            <div className="flex items-center justify-between text-[10px] sm:text-xs md:text-sm">
              <span className="text-gray-400">Atanan</span>
              <span className="text-white font-semibold truncate ml-2">{task.assigned_to_name}</span>
            </div>
          )}
        </div>

        {showActions && (
          <div className="pt-2 sm:pt-3 md:pt-4 border-t border-gray-700">
            {/* Proje Görevi */}
            {task.isProjectTask && (
              <Link
                to={`/projects/${task.project}`}
                className="block w-full bg-purple-600 hover:bg-purple-700 text-white px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold text-center transition-all shadow-lg text-xs sm:text-sm md:text-base"
              >
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Projeye Git
                </div>
              </Link>
            )}
            
            {/* Normal Görev */}
            {/* Görevi Üstlen butonu: BEKLEMEDE durumunda, assigned_to yok olmalı */}
            {!task.isProjectTask && task.status === 'BEKLEMEDE' && !task.assigned_to && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClaimTask(task.id);
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-red-600/50 text-xs sm:text-sm md:text-base"
              >
                Görevi Üstlen
              </button>
            )}
            {!task.isProjectTask && task.status === 'DEVAM_EDIYOR' && task.assigned_to === user?.id && (
              <div className="space-y-1.5 sm:space-y-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCompleteModal(true);
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 rounded-lg text-[10px] sm:text-xs md:text-sm font-semibold transition-all shadow-lg"
                >
                  Görevi Tamamla
                </button>
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenTransferModal();
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 rounded-lg text-[10px] sm:text-xs md:text-sm font-semibold transition-all flex items-center justify-center gap-0.5 sm:gap-1"
                    title="Görevi başka birine devret"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span className="hidden sm:inline">Devret</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareTask(task.id);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 rounded-lg text-[10px] sm:text-xs md:text-sm font-semibold transition-all flex items-center justify-center gap-0.5 sm:gap-1"
                    title="Görevi paylaş"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.885 12.938 9 12.482 9 12c0-.482-.115-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span className="hidden sm:inline">Paylaş</span>
                  </button>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCancelModal(true);
                  }}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-lg text-[10px] sm:text-xs md:text-sm font-semibold transition-all"
                >
                  Görevi İptal Et
                </button>
                <Link
                  to={`/tasks/${task.id}`}
                  className="block w-full bg-gray-800 hover:bg-gray-700 text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg text-[10px] sm:text-xs md:text-sm font-semibold text-center transition-all"
                >
                  Detaylar
                </Link>
              </div>
            )}
            {!task.isProjectTask && task.status === 'TAMAMLANDI' && (
              <Link
                to={`/tasks/${task.id}`}
                className="block w-full bg-gray-800 hover:bg-gray-700 text-white px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold text-center transition-all text-xs sm:text-sm md:text-base"
              >
                Detayları Gör
              </Link>
            )}
          </div>
        )}

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
                    onClick={handleComplete}
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

        {/* Transfer Modal */}
        {showTransferModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={() => setShowTransferModal(false)}>
            <div 
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 max-w-md w-full border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto" 
              onClick={e => e.stopPropagation()}
              style={{ animation: 'scaleIn 0.3s ease-out' }}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-xl sm:text-2xl">
                  🔄
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Görevi Devret</h3>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-gray-300 text-[10px] sm:text-xs md:text-sm font-semibold mb-1 sm:mb-2">
                    Kullanıcı Seç
                  </label>
                  <select
                    value={transferUserId}
                    onChange={(e) => setTransferUserId(e.target.value)}
                    className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="">Kullanıcı seçin...</option>
                    {taskCommitteeMembers
                      .filter(member => member.id !== user?.id) // Kendisini hariç tut
                      .map(member => (
                        <option key={member.id} value={member.id}>
                          {member.full_name} {member.level ? `(Level ${member.level})` : ''}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 text-[10px] sm:text-xs md:text-sm font-semibold mb-1 sm:mb-2">
                    Devretme Sebebi (opsiyonel)
                  </label>
                  <textarea
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    placeholder="Neden devrediyorsunuz?"
                    rows={3}
                    className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                  />
                </div>
                <div className="flex space-x-2 sm:space-x-3">
                  <button
                    onClick={handleTransfer}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold transition-all shadow-lg text-[10px] sm:text-xs md:text-sm"
                  >
                    Devret
                  </button>
                  <button
                    onClick={() => setShowTransferModal(false)}
                    className="flex-1 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold transition-all text-[10px] sm:text-xs md:text-sm"
                  >
                    İptal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={() => setShowCancelModal(false)}>
            <div 
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 max-w-md w-full border border-gray-700 shadow-2xl" 
              onClick={e => e.stopPropagation()}
              style={{ animation: 'scaleIn 0.3s ease-out' }}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center text-xl sm:text-2xl">
                  ⚠️
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Görevi İptal Et</h3>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <p className="text-gray-300 text-[10px] sm:text-xs md:text-sm">
                  Bu görevi iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </p>
                <div>
                  <label className="block text-gray-300 text-[10px] sm:text-xs md:text-sm font-semibold mb-1 sm:mb-2">
                    İptal Sebebi <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Görevi neden iptal ediyorsunuz?"
                    rows={3}
                    required
                    className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all resize-none"
                  />
                </div>
                <div className="flex space-x-2 sm:space-x-3">
                  <button
                    onClick={handleCancel}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold transition-all shadow-lg text-[10px] sm:text-xs md:text-sm"
                  >
                    İptal Et
                  </button>
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold transition-all text-[10px] sm:text-xs md:text-sm"
                  >
                    Vazgeç
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const displayTasks = useMemo(() => {
    return activeTab === 'upcoming' 
    ? tasks 
    : activeTab === 'past' 
    ? pastTasks 
    : myTasks;
  }, [activeTab, tasks, pastTasks, myTasks]);

  // Safe array to prevent TypeError
  const safeDisplayTasks = useMemo(() => {
    return Array.isArray(displayTasks) ? displayTasks : [];
  }, [displayTasks]);

  // Filtering logic - sadece komite filtresi (useMemo ile optimize edildi)
  const filteredAndSortedTasks = useMemo(() => {
    return [...safeDisplayTasks]
    .filter(task => {
      // Filter by committee
      if (filterValues.committee && filterValues.committee !== 'all') {
        const committeeId = parseInt(filterValues.committee);
        // Eğer komite seçildiyse, sadece o komitenin görevleri gösterilmeli
        if (task.committee !== committeeId) return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Basit sıralama: Puan yüksekten düşüğe
      return b.points - a.points;
    });
  }, [safeDisplayTasks, filterValues.committee]);

  return (
    <Layout>
      <style>{`
        /* Dropdown option stilleri - Ana renklere uygun */
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
        select:focus option:checked {
          background-color: #dc2626 !important;
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
      <div className="max-w-7xl mx-auto space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6 px-2 sm:px-4 pb-4 sm:pb-6" style={{ animation: 'fadeIn 0.5s ease-out' }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 md:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-0.5 sm:mb-1 md:mb-2 text-white">
              Görev Havuzu
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-400">Görevleri üstlen, tamamla ve puan kazan</p>
          </div>
          {(user?.role === 'BASKAN' || user?.role === 'BASKAN_YARDIMCISI' || user?.role === 'KOMITE_LIDERI' || user?.role === 'KOMITE_YARDIMCISI') && (
            <Link
              to="/tasks/create"
              className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg hover:shadow-red-600/50 flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base"
            >
              <span className="text-base sm:text-lg md:text-xl">+</span> Yeni Görev
            </Link>
          )}
        </div>

        {/* Filtreler ve Görünüm Seçenekleri */}
        <div className="flex flex-col gap-2 sm:gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
          {/* Komite Filtresi */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 w-full sm:w-auto">
            <label className="text-[10px] sm:text-xs md:text-sm text-gray-400 whitespace-nowrap">Komite:</label>
            <select
              value={filterValues.committee || 'all'}
              onChange={(e) => setFilterValues(prev => ({ ...prev, committee: e.target.value }))}
              className="flex-1 sm:flex-none bg-slate-900/50 border border-slate-800/50 rounded-lg px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 md:py-2 text-white text-[10px] sm:text-xs md:text-sm focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 hover:border-red-600/50 transition-all cursor-pointer"
            >
              <option value="all">Tüm Komiteler</option>
              {committees.map(committee => (
                <option key={committee.id} value={committee.id.toString()}>
                  {committee.name}
                </option>
              ))}
            </select>
          </div>

          {/* Görünüm Toggle Butonları */}
          <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 bg-gray-900 p-0.5 sm:p-1 rounded-lg border border-gray-800 w-full sm:w-auto justify-center sm:justify-start">
            <button
              onClick={() => {
                setViewMode('grid');
                localStorage.setItem('tasksViewMode', 'grid');
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
                localStorage.setItem('tasksViewMode', 'list');
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
            <button
              onClick={() => {
                setViewMode('compact');
                localStorage.setItem('tasksViewMode', 'compact');
              }}
              className={`p-1.5 sm:p-2 rounded transition-all ${
                viewMode === 'compact'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              title="Kompakt Görünüm"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </button>
            <button
              onClick={() => {
                setViewMode('detailed');
                localStorage.setItem('tasksViewMode', 'detailed');
              }}
              className={`p-1.5 sm:p-2 rounded transition-all ${
                viewMode === 'detailed'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              title="Detaylı Görünüm"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 sm:space-x-1.5 md:space-x-2 bg-gray-900 p-0.5 sm:p-1 md:p-2 rounded-lg sm:rounded-xl border border-gray-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 min-w-0 py-1.5 sm:py-2 md:py-3 px-2 sm:px-3 md:px-4 font-medium transition-all rounded-lg text-[10px] sm:text-xs md:text-sm ${
              activeTab === 'upcoming'
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span className="truncate">Yaklaşan</span>
            <span className="text-[10px] sm:text-xs opacity-75 ml-0.5 sm:ml-1 md:ml-2">({tasks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 min-w-0 py-1.5 sm:py-2 md:py-3 px-2 sm:px-3 md:px-4 font-medium transition-all rounded-lg text-[10px] sm:text-xs md:text-sm ${
              activeTab === 'past'
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span className="truncate">Geçmiş</span>
            <span className="text-[10px] sm:text-xs opacity-75 ml-0.5 sm:ml-1 md:ml-2">({pastTasks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`flex-1 min-w-0 py-1.5 sm:py-2 md:py-3 px-2 sm:px-3 md:px-4 font-medium transition-all rounded-lg text-[10px] sm:text-xs md:text-sm ${
              activeTab === 'my'
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center justify-center gap-0.5 sm:gap-1 md:gap-2">
              <span className="truncate">Görevlerim</span>
              <span className="text-[10px] sm:text-xs opacity-75">({myTasks.length})</span>
            </div>
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
            <SkeletonLoader type="card" count={6} />
          </div>
        ) : filteredAndSortedTasks.length === 0 ? (
          <div className="text-center py-8 sm:py-12 md:py-20 px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full mx-auto mb-3 sm:mb-4 md:mb-6 flex items-center justify-center border-4 border-gray-700">
              <span className="text-2xl sm:text-3xl md:text-5xl text-gray-700">•</span>
            </div>
            <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-300 mb-1 sm:mb-2">Görev bulunamadı</h3>
            <p className="text-xs sm:text-sm md:text-base text-gray-500 mb-3 sm:mb-4 md:mb-6">
              {Object.values(filterValues).some(v => v && (typeof v === 'object' ? v.min || v.max : true))
                ? 'Seçilen filtrelere uygun görev bulunamadı'
                : activeTab === 'upcoming' 
                  ? 'Şu anda yaklaşan görev bulunmuyor'
                  : activeTab === 'past'
                  ? 'Süresi geçmiş görev bulunmuyor'
                  : 'Henüz üstlendiğiniz görev bulunmuyor'}
            </p>
            {activeTab === 'my' && tasks.length > 0 && (
              <button
                onClick={() => setActiveTab('upcoming')}
                className="bg-gradient-to-r from-red-600 to-red-700 text-white px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 rounded-lg sm:rounded-xl font-semibold hover:from-red-500 hover:to-red-600 transition-all shadow-lg text-xs sm:text-sm md:text-base"
              >
                Müsait Görevleri Gör
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Grid Görünümü */}
            {viewMode === 'grid' && (
              <div key={viewMode} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6 view-transition">
                {filteredAndSortedTasks.map((task, index) => (
                  <TaskCard key={task.id} task={task} index={index} />
                ))}
              </div>
            )}

            {/* Liste Görünümü */}
            {viewMode === 'list' && (
              <div key={viewMode} className="space-y-1.5 sm:space-y-2 md:space-y-3 view-transition">
                {filteredAndSortedTasks.map((task, index) => (
                  <TaskListItem key={task.id} task={task} index={index} />
                ))}
              </div>
            )}

            {/* Kompakt Görünüm */}
            {viewMode === 'compact' && (
              <div key={viewMode} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1.5 sm:gap-2 md:gap-3 view-transition">
                {filteredAndSortedTasks.map((task, index) => (
                  <TaskCompactItem key={task.id} task={task} index={index} />
                ))}
              </div>
            )}

            {/* Detaylı Görünüm (Grid ama daha büyük kartlar) */}
            {viewMode === 'detailed' && (
              <div key={viewMode} className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:gap-6 view-transition">
                {filteredAndSortedTasks.map((task, index) => (
                  <TaskCard key={task.id} task={task} index={index} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
