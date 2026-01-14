import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import SkeletonLoader from '../components/SkeletonLoader';

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    // localStorage'dan görünüm tercihini yükle
    const saved = localStorage.getItem('projectsViewMode');
    return saved || 'grid'; // 'grid', 'list', 'compact', 'detailed'
  });

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const [allRes, myRes] = await Promise.all([
        api.get('/projects/'),
        api.get('/projects/my_projects/')
      ]);
      
      // API response formatını kontrol et (array veya {results: []})
      const allProjects = Array.isArray(allRes.data) ? allRes.data : (allRes.data?.results || []);
      const myProjectsData = Array.isArray(myRes.data) ? myRes.data : (myRes.data?.results || []);
      
      // Verileri set et ve loading'i kapat
      setProjects(allProjects);
      setMyProjects(myProjectsData);
      setLoading(false);
    } catch (error) {
      console.error('Projeler yüklenemedi:', error);
      toast.error('Projeler yüklenirken hata oluştu');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    
    // Her 30 saniyede bir otomatik güncelle

  }, [fetchProjects]);

  const getStatusColor = (status) => {
    const colors = {
      PLANLAMA: 'bg-gradient-to-r from-gray-600 to-gray-700 text-white',
      AKTIF: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white',
      BEKLEMEDE: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
      TAMAMLANDI: 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white',
      IPTAL: 'bg-gradient-to-r from-red-800 to-red-900 text-gray-300'
    };
    return colors[status] || 'bg-gradient-to-r from-gray-600 to-gray-700 text-white';
  };

  const getStatusIcon = (status) => {
    const icons = {
      PLANLAMA: '📝',
      AKTIF: '🔥',
      BEKLEMEDE: '⏸️',
      TAMAMLANDI: '✅',
      IPTAL: '❌'
    };
    return icons[status] || '📌';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      DUSUK: 'from-green-500 to-emerald-500',
      ORTA: 'from-yellow-500 to-orange-500',
      YUKSEK: 'from-orange-500 to-red-500',
      KRITIK: 'from-red-500 to-pink-600'
    };
    return colors[priority] || 'from-gray-500 to-gray-600';
  };

  const getPriorityIcon = (priority) => {
    const icons = {
      DUSUK: '🟢',
      ORTA: '🟡',
      YUKSEK: '🟠',
      KRITIK: '🔴'
    };
    return icons[priority] || '⚪';
  };

  const getProgressGradient = (percentage) => {
    if (percentage >= 75) return 'from-green-500 to-emerald-600';
    if (percentage >= 50) return 'from-blue-500 to-cyan-600';
    if (percentage >= 25) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-600';
  };

  // Liste Görünümü Componenti
  const ProjectListItem = ({ project, index = 0 }) => {
    return (
      <Link 
        to={`/projects/${project.id}`}
        className="group bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-2 sm:p-3 md:p-4 hover:shadow-xl hover:border-red-600/50 transition-all duration-300 border border-gray-700 block"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 md:gap-4">
          {/* Sol Taraf - İkon ve Başlık */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0 w-full sm:w-auto">
            <div className={`bg-gradient-to-r ${getPriorityColor(project.priority)} w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0`}>
              <span className="text-base sm:text-lg md:text-xl">{getPriorityIcon(project.priority)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 md:gap-2 mb-0.5 sm:mb-1">
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-white truncate w-full sm:w-auto">{project.title}</h3>
                <span className={`${getStatusColor(project.status)} text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap`}>
                  {getStatusIcon(project.status)} {project.status_display}
                </span>
              </div>
              <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm line-clamp-1">{project.description}</p>
              {/* Mobilde bilgileri göster */}
              <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-2 sm:hidden text-[10px] sm:text-xs">
                <span className="text-white font-bold">{project.completion_percentage}%</span>
                <span className="text-white font-bold">{project.completed_task_count}/{project.task_count}</span>
                <span className="text-yellow-400 font-bold">{project.total_points}</span>
              </div>
            </div>
          </div>

          {/* Orta - Bilgiler */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-gray-400 text-xs">İlerleme</p>
              <p className="text-white font-bold">{project.completion_percentage}%</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs">Görevler</p>
              <p className="text-white font-bold">
                {project.completed_task_count}/{project.task_count}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs">Puan</p>
              <p className="text-yellow-400 font-bold">{project.total_points}</p>
            </div>
            {project.committee_name && (
              <div className="text-center">
                <p className="text-gray-400 text-xs">Komite</p>
                <p className="text-blue-400 font-semibold text-xs">{project.committee_name}</p>
              </div>
            )}
          </div>

          {/* Sağ Taraf - Progress Bar */}
          <div className="hidden lg:block w-32 flex-shrink-0">
            <div className="relative w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div 
                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getProgressGradient(project.completion_percentage)} rounded-full transition-all duration-500`}
                style={{ width: `${project.completion_percentage}%` }}
              />
            </div>
          </div>
        </div>
      </Link>
    );
  };

  // Kompakt Görünüm Componenti
  const ProjectCompactItem = ({ project, index = 0 }) => {
    return (
      <Link 
        to={`/projects/${project.id}`}
        className="group bg-gray-800 rounded-lg p-2 sm:p-2.5 md:p-3 hover:bg-gray-700 hover:border-red-600/50 transition-all duration-200 border border-gray-700 block"
      >
        <div className="flex items-center justify-between gap-2 sm:gap-2.5 md:gap-3">
          <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 flex-1 min-w-0">
            <div className={`bg-gradient-to-r ${getPriorityColor(project.priority)} w-8 h-8 sm:w-10 sm:h-10 rounded flex items-center justify-center flex-shrink-0`}>
              <span className="text-xs sm:text-sm">{getPriorityIcon(project.priority)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[10px] sm:text-xs md:text-sm font-semibold text-white truncate">{project.title}</h3>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <span className="text-white text-[10px] sm:text-xs font-bold">{project.completion_percentage}%</span>
              <span className={`${getStatusColor(project.status)} text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded`}>
                {project.status_display}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  const ProjectCard = ({ project, index = 0 }) => {
    return (
      <Link 
        to={`/projects/${project.id}`}
        className="group relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 lg:p-6 hover:shadow-2xl sm:hover:scale-[1.02] transition-all duration-300 border border-gray-700 block"
        style={{ animation: `slideUp 0.3s ease-out ${index * 0.1}s backwards` }}
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-red-600 opacity-5 rounded-full -mr-10 sm:-mr-12 md:-mr-16 -mt-10 sm:-mt-12 md:-mt-16 group-hover:opacity-10 transition-opacity"></div>
        
        {/* Header with Status and Priority */}
        <div className="relative flex items-start justify-between mb-2 sm:mb-3 md:mb-4">
          <span className={`${getStatusColor(project.status)} text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-1.5 rounded-full shadow-lg flex items-center gap-0.5 sm:gap-1`}>
            {getStatusIcon(project.status)} <span className="hidden sm:inline">{project.status_display}</span>
          </span>
          <div className={`bg-gradient-to-r ${getPriorityColor(project.priority)} w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-lg flex items-center justify-center shadow-lg`}>
            <span className="text-xs sm:text-sm md:text-lg">{getPriorityIcon(project.priority)}</span>
          </div>
        </div>

        <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white mb-1 sm:mb-2 line-clamp-2 group-hover:text-red-400 transition-colors">{project.title}</h3>
        <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm mb-2 sm:mb-3 md:mb-4 line-clamp-2">{project.description}</p>

        {/* Progress Bar with Animation */}
        <div className="mb-2 sm:mb-3 md:mb-4">
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1 md:mb-2">
            <span className="font-semibold">İlerleme</span>
            <span className="text-white font-bold">{project.completion_percentage}%</span>
          </div>
          <div className="relative w-full bg-gray-800 rounded-full h-1.5 sm:h-2 md:h-3 overflow-hidden">
            <div 
              className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getProgressGradient(project.completion_percentage)} rounded-full transition-all duration-500 shadow-lg`}
              style={{ width: `${project.completion_percentage}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:gap-3 mb-2 sm:mb-3 md:mb-4">
          <div className="bg-white/5 rounded-lg p-1.5 sm:p-2 md:p-3 text-center">
            <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Görevler</p>
            <p className="text-xs sm:text-base md:text-lg font-bold text-white">
              {project.completed_task_count}<span className="text-gray-500">/{project.task_count}</span>
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-1.5 sm:p-2 md:p-3 text-center">
            <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Toplam Puan</p>
            <p className="text-xs sm:text-base md:text-lg font-bold text-white">
              {project.total_points}
            </p>
          </div>
        </div>

        {/* Committee Badge */}
        {project.committee_name && (
          <div className="mb-2 sm:mb-3 md:mb-4 p-1.5 sm:p-2 md:p-3 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700/50 rounded-lg">
            <p className="text-[10px] sm:text-xs text-blue-300 mb-0.5 sm:mb-1 font-semibold">Komite</p>
            <p className="text-[10px] sm:text-xs md:text-sm text-white font-bold flex items-center gap-1 sm:gap-2">
              <span className="text-sm sm:text-base md:text-lg">🎯</span>
              {project.committee_name}
            </p>
          </div>
        )}

        {/* Owner */}
        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 md:mb-4 p-1.5 sm:p-2 bg-white/5 rounded-lg">
          <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center text-[10px] sm:text-xs md:text-sm font-bold">
            {project.owner_name?.charAt(0) || 'P'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-xs text-gray-400">Proje Sahibi</p>
            <p className="text-[10px] sm:text-xs md:text-sm text-white font-semibold truncate">{project.owner_name}</p>
          </div>
        </div>

        {/* Team Members */}
        {project.team_member_names && project.team_member_names.length > 0 && (
          <div className="pt-2 sm:pt-3 md:pt-4 border-t border-gray-700">
            <p className="text-gray-400 text-[10px] sm:text-xs font-semibold mb-1.5 sm:mb-2 flex items-center gap-1 sm:gap-2">
              Takım ({project.team_member_names.length} kişi)
            </p>
            <div className="flex flex-wrap gap-1 sm:gap-1.5 md:gap-2">
              {project.team_member_names.slice(0, 4).map((name, idx) => (
                <span 
                  key={idx} 
                  className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-gray-200 text-[10px] sm:text-xs px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-1.5 rounded-full border border-gray-600 transition-colors"
                >
                  {name}
                </span>
              ))}
              {project.team_member_names.length > 4 && (
                <span className="bg-gradient-to-r from-red-600 to-red-700 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-1.5 rounded-full font-semibold">
                  +{project.team_member_names.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Overdue Warning */}
        {project.is_overdue && (
          <div className="mt-2 sm:mt-3 md:mt-4 bg-gradient-to-r from-red-900/30 to-red-800/30 border border-red-600/50 rounded-lg px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 text-[10px] sm:text-xs text-red-300 flex items-center gap-1 sm:gap-2 font-semibold">
            ⚠️ Son tarihi geçmiş - Acil aksiyon gerekli!
          </div>
        )}

        {/* Hover Arrow */}
        <div className="absolute bottom-1.5 sm:bottom-2 md:bottom-4 right-1.5 sm:right-2 md:right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center">
            <span className="text-white text-[10px] sm:text-xs md:text-sm">→</span>
          </div>
        </div>
      </Link>
    );
  };

  const displayProjects = useMemo(() => {
    return activeTab === 'all' ? projects : myProjects;
  }, [activeTab, projects, myProjects]);
  
  // Safe array to prevent TypeError
  const safeDisplayProjects = useMemo(() => {
    return Array.isArray(displayProjects) ? displayProjects : [];
  }, [displayProjects]);

  // Filtering - sadece isim ile arama (useMemo ile optimize edildi)
  const filteredProjects = useMemo(() => {
    if (!searchQuery) return safeDisplayProjects;
    
        const searchLower = searchQuery.toLowerCase();
    return safeDisplayProjects.filter(project => {
      return project.title?.toLowerCase().includes(searchLower);
    });
  }, [safeDisplayProjects, searchQuery]);

  return (
    <Layout>
      <style>{`
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
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-0.5 sm:mb-1 md:mb-2 text-white">
              Projeler
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-400">Topluluk projelerine katıl, birlikte üret</p>
          </div>
          {(user?.role === 'BASKAN' || user?.role === 'BASKAN_YARDIMCISI' || user?.role === 'KOMITE_LIDERI' || user?.role === 'KOMITE_YARDIMCISI') && (
            <Link
              to="/projects/create"
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg hover:shadow-red-600/50 text-xs sm:text-sm md:text-base text-center"
            >
              <span className="text-base sm:text-lg md:text-xl">+</span> Yeni Proje
            </Link>
          )}
        </div>

        {/* Arama ve Görünüm Seçenekleri */}
        <div className="flex flex-col gap-2 sm:gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
          {/* Arama - Sadece İsim */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-1 w-full sm:w-auto">
            <label className="text-[10px] sm:text-xs md:text-sm text-gray-400 whitespace-nowrap">Ara:</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Proje ismi ara..."
              className="flex-1 bg-slate-900/50 border border-slate-800/50 rounded-lg px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 md:py-2 text-white text-[10px] sm:text-xs md:text-sm focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all placeholder-gray-500"
            />
          </div>

          {/* Görünüm Toggle Butonları */}
          <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 bg-gray-900 p-0.5 sm:p-1 rounded-lg border border-gray-800 w-full sm:w-auto justify-center sm:justify-start">
            <button
              onClick={() => {
                setViewMode('grid');
                localStorage.setItem('projectsViewMode', 'grid');
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
                localStorage.setItem('projectsViewMode', 'list');
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
                localStorage.setItem('projectsViewMode', 'compact');
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
                localStorage.setItem('projectsViewMode', 'detailed');
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
            onClick={() => setActiveTab('my')}
            className={`flex-1 min-w-0 py-1.5 sm:py-2 md:py-3 px-2 sm:px-3 md:px-4 font-medium transition-all rounded-lg text-[10px] sm:text-xs md:text-sm ${
              activeTab === 'my'
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span className="truncate">Projelerim</span>
            <span className="text-[10px] sm:text-xs opacity-75 ml-0.5 sm:ml-1 md:ml-2">({myProjects.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 min-w-0 py-1.5 sm:py-2 md:py-3 px-2 sm:px-3 md:px-4 font-medium transition-all rounded-lg text-[10px] sm:text-xs md:text-sm ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span className="truncate">Tüm Projeler</span>
            <span className="text-[10px] sm:text-xs opacity-75 ml-0.5 sm:ml-1 md:ml-2">({projects.length})</span>
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
            <SkeletonLoader type="card" count={6} />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-8 sm:py-12 md:py-20 px-4">
            <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-300 mb-1 sm:mb-2">Proje bulunamadı</h3>
            <p className="text-xs sm:text-sm md:text-base text-gray-500 mb-3 sm:mb-4 md:mb-6">
              {searchQuery
                ? 'Arama kriterlerine uygun proje bulunamadı'
                : activeTab === 'my' 
                  ? 'Henüz bir projeye dahil değilsiniz. Tüm projelere göz atın veya yeni bir proje başlatın!' 
                  : 'Henüz proje eklenmemiş. Yakında yeni projeler eklenecek!'}
            </p>
            {activeTab === 'my' && projects.length > 0 && (
              <button
                onClick={() => setActiveTab('all')}
                className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg text-xs sm:text-sm md:text-base"
              >
                Tüm Projeleri Gör
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Grid Görünümü */}
            {viewMode === 'grid' && (
              <div key={viewMode} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6 view-transition">
                {filteredProjects.map((project, index) => (
                  <ProjectCard key={project.id} project={project} index={index} />
                ))}
              </div>
            )}

            {/* Liste Görünümü */}
            {viewMode === 'list' && (
              <div key={viewMode} className="space-y-1.5 sm:space-y-2 md:space-y-3 view-transition">
                {filteredProjects.map((project, index) => (
                  <ProjectListItem key={project.id} project={project} index={index} />
                ))}
              </div>
            )}

            {/* Kompakt Görünüm */}
            {viewMode === 'compact' && (
              <div key={viewMode} className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-2 md:gap-3 view-transition">
                {filteredProjects.map((project, index) => (
                  <ProjectCompactItem key={project.id} project={project} index={index} />
                ))}
              </div>
            )}

            {/* Detaylı Görünüm (Grid ama daha büyük kartlar) */}
            {viewMode === 'detailed' && (
              <div key={viewMode} className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:gap-6 view-transition">
                {filteredProjects.map((project, index) => (
                  <ProjectCard key={project.id} project={project} index={index} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
