import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import SkeletonLoader from '../components/SkeletonLoader';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [lastMonthWinner, setLastMonthWinner] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, eventsRes, tasksRes, pastMonthsRes] = await Promise.all([
        api.get('/activity/my-stats/'),
        api.get('/events/upcoming/'),
        api.get('/tasks/my_tasks/'),
        api.get('/activity/past-months/')
      ]);
      
      const eventsData = Array.isArray(eventsRes.data) ? eventsRes.data : (eventsRes.data?.results || []);
      const tasksData = Array.isArray(tasksRes.data) ? tasksRes.data : (tasksRes.data?.results || []);
      
      setStats(statsRes.data);
      setUpcomingEvents(eventsData.slice(0, 3));
      setMyTasks(tasksData.filter(t => t.status === 'DEVAM_EDIYOR').slice(0, 5));
      setRecentActivities(statsRes.data.recent_activities?.slice(0, 5) || []);
      
      // En son finalize olmuş ayı göster
      if (pastMonthsRes.data && pastMonthsRes.data.length > 0) {
        setLastMonthWinner(pastMonthsRes.data[0]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Dashboard verileri yüklenemedi:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Memoize hesaplamalar
  const monthlyPoints = useMemo(() => {
    return stats?.points_by_source?.reduce((sum, item) => sum + item.total, 0) || 0;
  }, [stats?.points_by_source]);

  if (loading) {
    return (
      <Layout>
        <div className="space-y-8">
          <div className="h-48 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl animate-pulse border border-gray-700"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SkeletonLoader type="stat" count={3} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <SkeletonLoader type="list" count={3} />
            </div>
            <div className="space-y-4">
              <SkeletonLoader type="list" count={3} />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6 animate-fade-in px-2 sm:px-4 pb-4 sm:pb-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-900 p-3 sm:p-4 md:p-6 lg:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 bg-white opacity-5 rounded-full -mr-12 sm:-mr-16 md:-mr-24 lg:-mr-32 -mt-12 sm:-mt-16 md:-mt-24 lg:-mt-32"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-24 sm:h-24 md:w-36 md:h-36 lg:w-48 lg:h-48 bg-white opacity-5 rounded-full -ml-8 sm:-ml-12 md:-ml-18 lg:-ml-24 -mb-8 sm:-mb-12 md:-mb-18 lg:-mb-24"></div>
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-1 sm:mb-2">
              Hoş Geldin, {user?.first_name}
            </h1>
            <p className="text-red-100 text-xs sm:text-sm md:text-base lg:text-lg">HSD İnönü Topluluk Yönetim Platformı</p>
          </div>
        </div>

        {/* Ayın Parlayan Yıldızı Banner */}
        {lastMonthWinner && lastMonthWinner.winner_details && lastMonthWinner.winner_details.length > 0 && (
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 p-4 sm:p-6 shadow-2xl">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-5xl sm:text-6xl animate-pulse">⭐</div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {lastMonthWinner.month_name} Ayının Parlayan Yıldızı
                  </h3>
                  <p className="text-gray-800 text-sm mt-1">
                    {lastMonthWinner.winner_details.length === 1 ? 'Kazanan' : `${lastMonthWinner.winner_details.length} Kazanan`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap justify-center">
                {lastMonthWinner.winner_details.slice(0, 3).map((winner, idx) => (
                  <div key={winner.id} className="flex items-center bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30">
                    <img 
                      src={winner.profile_image || '/default-avatar.png'} 
                      alt={`${winner.first_name} ${winner.last_name}`}
                      className="w-10 h-10 rounded-full border-2 border-white shadow-lg object-cover"
                    />
                    <div className="ml-3">
                      <p className="font-bold text-gray-900">{winner.first_name} {winner.last_name}</p>
                      <p className="text-sm text-gray-800">{lastMonthWinner.leaderboard_snapshot[idx]?.points || 0} puan</p>
                    </div>
                    {idx === 0 && <span className="ml-2 text-xl">🏆</span>}
                  </div>
                ))}
                {lastMonthWinner.winner_details.length > 3 && (
                  <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30">
                    <span className="text-gray-900 font-semibold">+{lastMonthWinner.winner_details.length - 3} daha</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
          {/* Monthly Points Card */}
          <div className="group relative overflow-hidden bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6 shadow-xl hover:shadow-2xl hover:border-red-600 transition-all duration-300">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="bg-red-600 p-2 sm:p-3 rounded-lg">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-400 text-[10px] sm:text-xs md:text-sm font-medium">Bu Ay</span>
              </div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-1 text-white">
                {monthlyPoints}
              </h3>
              <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm">
                <span className="font-semibold text-white">Son 30 gün</span> kazanılan
              </p>
              <div className="mt-1.5 sm:mt-2 md:mt-3 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-600 rounded-full" style={{width: '60%'}}></div>
              </div>
            </div>
          </div>

          {/* Star Count Card */}
          <div className="group relative overflow-hidden bg-gray-900 border border-gray-800 rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-xl hover:shadow-2xl hover:border-red-600 transition-all duration-300">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
                <div className="bg-yellow-600 p-1.5 sm:p-2 md:p-2.5 lg:p-3 rounded-lg">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <span className="text-gray-400 text-[10px] sm:text-xs md:text-sm font-medium">Yıldız</span>
              </div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-1 text-white">{user?.star_count || 0}</h3>
              <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm">
                Parlayan Yıldız <span className="font-semibold text-yellow-400">kazanımı</span>
              </p>
            </div>
          </div>

          {/* Active Tasks Card */}
          <div className="group relative overflow-hidden bg-gray-900 border border-gray-800 rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-xl hover:shadow-2xl hover:border-red-600 transition-all duration-300">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
                <div className="bg-red-600 p-1.5 sm:p-2 md:p-2.5 lg:p-3 rounded-lg">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-400 text-[10px] sm:text-xs md:text-sm font-medium">Görevler</span>
              </div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-1 sm:mb-2 text-white">{myTasks.length}</h3>
              <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm">Aktif görevlerin</p>
              <div className="flex items-center mt-1.5 sm:mt-2 md:mt-3 space-x-1">
                {[...Array(Math.min(myTasks.length, 5))].map((_, i) => (
                  <div key={i} className="w-2 h-2 bg-red-600 rounded-full animate-pulse" style={{animationDelay: `${i * 0.2}s`}}></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <Link to="/events" className="group relative overflow-hidden bg-gray-900 border border-gray-800 hover:border-red-600 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-lg hover:shadow-2xl transition-all duration-300">
            <div className="relative z-10">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-red-600 rounded-lg flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-0.5 sm:mb-1 text-white text-xs sm:text-sm md:text-base">Etkinlikler</h3>
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-400">QR ile katıl, puan kazan</p>
            </div>
          </Link>

          <Link to="/tasks" className="group relative overflow-hidden bg-gray-900 border border-gray-800 hover:border-red-600 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-lg hover:shadow-2xl transition-all duration-300">
            <div className="relative z-10">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-red-600 rounded-lg flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="font-semibold mb-0.5 sm:mb-1 text-white text-xs sm:text-sm md:text-base">Görev Havuzu</h3>
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-400">Görevleri üstlen</p>
            </div>
          </Link>

          <Link to="/projects" className="group relative overflow-hidden bg-gray-900 border border-gray-800 hover:border-red-600 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-lg hover:shadow-2xl transition-all duration-300">
            <div className="relative z-10">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-red-600 rounded-lg flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="font-semibold mb-0.5 sm:mb-1 text-white text-xs sm:text-sm md:text-base">Projeler</h3>
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-400">Takım projelerine katıl</p>
            </div>
          </Link>

          <Link to="/leaderboard" className="group relative overflow-hidden bg-gray-900 border border-gray-800 hover:border-red-600 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-lg hover:shadow-2xl transition-all duration-300">
            <div className="relative z-10">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-red-600 rounded-lg flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-0.5 sm:mb-1 text-white text-xs sm:text-sm md:text-base">Lider Tablosu</h3>
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-400">Sıralamada yüksel</p>
            </div>
          </Link>
        </div>

        {/* Recent Activities */}
        {recentActivities.length > 0 && (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-700 shadow-xl">
            <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
              <div className="flex items-center">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-white">Son Aktiviteler</h2>
              </div>
              <Link to="/points-history" className="text-purple-400 hover:text-purple-300 text-xs sm:text-sm font-medium flex items-center group">
                Detay
                <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {recentActivities.map((activity, index) => (
                <div 
                  key={activity.id} 
                  className="flex items-center justify-between bg-gray-800/50 hover:bg-gray-700/50 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 transition-all duration-300 border border-gray-700 animate-slide-up"
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="bg-purple-500/20 p-1.5 sm:p-2 rounded-lg">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white text-xs sm:text-sm font-medium">{activity.description}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
                        {new Date(activity.created_at).toLocaleDateString('tr-TR', { 
                          day: 'numeric', 
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center bg-yellow-500/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg">
                    <span className="text-yellow-400 font-bold text-xs sm:text-sm">+{activity.points}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Events */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-700 shadow-xl">
            <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
              <div className="flex items-center">
                <div className="bg-gradient-to-br from-red-500 to-red-600 p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-white">Yaklaşan Etkinlikler</h2>
              </div>
              <Link to="/events" className="text-red-400 hover:text-red-300 text-xs sm:text-sm font-medium flex items-center group">
                Tümü
                <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-6 sm:py-8 md:py-12">
                <div className="bg-gray-800/50 rounded-full w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-400 text-xs sm:text-sm md:text-base">Yaklaşan etkinlik yok</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {upcomingEvents.map((event, index) => (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="block group relative overflow-hidden bg-gray-800/50 hover:bg-gray-700/50 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 transition-all duration-300 border border-gray-700 hover:border-red-500/50 animate-slide-up"
                    style={{animationDelay: `${index * 0.1}s`}}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative z-10">
                      <h3 className="text-white font-semibold mb-1 sm:mb-2 group-hover:text-red-400 transition-colors text-xs sm:text-sm md:text-base">{event.title}</h3>
                      <div className="flex items-center flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm">
                        <div className="flex items-center text-gray-400">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(event.date_time).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                        </div>
                        <div className="bg-yellow-500/10 text-yellow-400 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-medium flex items-center text-xs sm:text-sm">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          +{event.attendance_points}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* My Tasks */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-700 shadow-xl">
            <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
              <div className="flex items-center">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-white">Aktif Görevlerim</h2>
              </div>
              <Link to="/tasks" className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-medium flex items-center group">
                Tümü
                <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            {myTasks.length === 0 ? (
              <div className="text-center py-6 sm:py-8 md:py-12">
                <div className="bg-gray-800/50 rounded-full w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-400 text-xs sm:text-sm md:text-base">Aktif görev yok</p>
                <Link to="/tasks" className="inline-block mt-2 sm:mt-3 text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-medium">
                  Görev havuzuna göz at →
                </Link>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {myTasks.map((task, index) => (
                  <div 
                    key={task.id} 
                    className="group relative overflow-hidden bg-gray-800/50 hover:bg-gray-700/50 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 transition-all duration-300 border border-gray-700 hover:border-blue-500/50 animate-slide-up"
                    style={{animationDelay: `${index * 0.1}s`}}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-1 sm:mb-2">
                        <h3 className="text-white font-semibold flex-1 group-hover:text-blue-400 transition-colors text-xs sm:text-sm md:text-base">{task.title}</h3>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className={`${
                          task.difficulty === 'KOLAY' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                          task.difficulty === 'ORTA' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 
                          'bg-red-500/20 text-red-400 border-red-500/30'
                        } text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border`}>
                          {task.difficulty_display}
                        </span>
                        <div className="bg-yellow-500/10 text-yellow-400 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium flex items-center">
                          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          +{task.points}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
