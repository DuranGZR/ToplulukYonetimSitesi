import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import SkeletonLoader from '../components/SkeletonLoader';

export default function PointsHistoryPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, EVENT, TASK, PROJECT, MANUAL

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [logsRes, statsRes] = await Promise.all([
        api.get('/activity/logs/my_logs/'),
        api.get('/activity/my-stats/')
      ]);
      
      // API response formatını kontrol et (array veya {results: []} olabilir)
      const logsData = Array.isArray(logsRes.data) ? logsRes.data : (logsRes.data.results || []);
      setLogs(logsData);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Veriler yüklenemedi:', error);
      toast.error('Puan geçmişi yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getSourceColor = (source) => {
    const colors = {
      EVENT: 'from-purple-500 to-pink-600',
      TASK: 'from-blue-500 to-cyan-600',
      PROJECT: 'from-green-500 to-emerald-600',
      MANUAL: 'from-orange-500 to-red-600',
      OTHER: 'from-gray-500 to-gray-600'
    };
    return colors[source] || 'from-gray-500 to-gray-600';
  };

  const getSourceIcon = (source) => {
    const icons = {
      EVENT: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      TASK: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      PROJECT: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      MANUAL: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      OTHER: (
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    };
    return icons[source] || icons.OTHER;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Az önce';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dakika önce`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} saat önce`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} gün önce`;
    
    return date.toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.source === filter);

  const safeLogs = Array.isArray(filteredLogs) ? filteredLogs : [];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6 px-2 sm:px-4 pb-4 sm:pb-6" style={{ animation: 'fadeIn 0.5s ease-out' }}>
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            Puan Geçmişim
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm md:text-base">Tüm puan hareketlerini görüntüle</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            {/* Total Points */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 lg:p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-1 sm:mb-1.5 md:mb-2">
                <span className="text-gray-400 text-[10px] sm:text-xs md:text-sm">Toplam Puan</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{stats.total_points}</p>
            </div>

            {/* Current Level */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 lg:p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-1 sm:mb-1.5 md:mb-2">
                <span className="text-gray-400 text-[10px] sm:text-xs md:text-sm">Mevcut Seviye</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Level {stats.current_level}</p>
            </div>

            {/* Next Level */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 lg:p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-1 sm:mb-1.5 md:mb-2">
                <span className="text-gray-400 text-[10px] sm:text-xs md:text-sm">Sonraki Seviye</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
              </div>
              {stats.points_to_next_level !== null ? (
                <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white leading-tight">
                  {stats.points_to_next_level > 0 ? `${stats.points_to_next_level} puan kaldı` : 'Maksimum seviye!'}
                </p>
              ) : (
                <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white leading-tight">Maksimum seviye!</p>
              )}
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 bg-gray-900 p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-gray-800">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm ${
              filter === 'all'
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Tümü
          </button>
          <button
            onClick={() => setFilter('EVENT')}
            className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm ${
              filter === 'EVENT'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Etkinlikler
          </button>
          <button
            onClick={() => setFilter('TASK')}
            className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm ${
              filter === 'TASK'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Görevler
          </button>
          <button
            onClick={() => setFilter('PROJECT')}
            className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm ${
              filter === 'PROJECT'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Projeler
          </button>
          <button
            onClick={() => setFilter('MANUAL')}
            className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm ${
              filter === 'MANUAL'
                ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Manuel
          </button>
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
            <SkeletonLoader type="timeline" count={5} />
          </div>
        ) : safeLogs.length === 0 ? (
          <div className="text-center py-10 sm:py-16 md:py-20">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full mx-auto mb-3 sm:mb-4 md:mb-6 flex items-center justify-center border-2 sm:border-3 md:border-4 border-gray-700">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-300 mb-1 sm:mb-2">Puan geçmişi bulunamadı</h3>
            <p className="text-gray-500 text-xs sm:text-sm md:text-base">
              {filter === 'all' 
                ? 'Henüz puan kazanmadınız. Etkinliklere katılın ve görevleri tamamlayın!'
                : 'Bu kategoride puan hareketi bulunmuyor.'}
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-4 sm:left-5 md:left-6 lg:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-600 via-gray-700 to-transparent"></div>

            {/* Timeline Items */}
            <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
              {safeLogs.map((log, index) => (
                <div 
                  key={log.id}
                  className="relative pl-12 sm:pl-14 md:pl-16 lg:pl-20"
                  style={{ animation: `slideUp 0.3s ease-out ${index * 0.05}s backwards` }}
                >
                  {/* Icon */}
                  <div className={`absolute left-0 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-gradient-to-br ${getSourceColor(log.source)} rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg border-2 sm:border-3 md:border-4 border-gray-950`}>
                    <div className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white">
                      {getSourceIcon(log.source)}
                    </div>
                  </div>

                  {/* Content Card */}
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 lg:p-5 border border-gray-700 hover:border-gray-600 transition-all">
                    <div className="flex items-start justify-between gap-2 sm:gap-3 md:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 mb-1 sm:mb-1.5 md:mb-2 flex-wrap">
                          <span className={`bg-gradient-to-r ${getSourceColor(log.source)} px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold text-white`}>
                            {log.source_display}
                          </span>
                          <span className="text-gray-400 text-[10px] sm:text-xs md:text-sm">{formatDate(log.created_at)}</span>
                        </div>
                        <p className="text-white text-xs sm:text-sm md:text-base leading-relaxed">{log.description || 'Açıklama yok'}</p>
                      </div>
                      <div className={`text-lg sm:text-xl md:text-2xl font-bold ml-2 sm:ml-3 md:ml-4 flex-shrink-0 ${log.points > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {log.points > 0 ? '+' : ''}{log.points}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
