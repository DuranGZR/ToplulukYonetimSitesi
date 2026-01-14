import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function CommitteeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [committee, setCommittee] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, members, projects

  const fetchCommitteeDetails = async () => {
    try {
      setLoading(true);
      const [committeeRes, projectsRes] = await Promise.all([
        api.get(`/committees/${id}/`),
        api.get(`/projects/?committee=${id}`)
      ]);
      
      setCommittee(committeeRes.data);
      // API response formatını kontrol et (array veya {results: []} olabilir)
      setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : projectsRes.data.results || []);
    } catch (error) {
      console.error('Komite detayları yüklenemedi:', error);
      toast.error('Komite bulunamadı');
      navigate('/committees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommitteeDetails();
    
    // Her 30 saniyede bir otomatik güncelle
    const interval = setInterval(() => {
      fetchCommitteeDetails();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [id]);

  // ✅ DÜZELTME: Backend'ten gelen Türkçe status değerleri ile eşleşen mapping
  const getStatusColor = (status) => {
    const colors = {
      'PLANLAMA': 'bg-yellow-500',
      'AKTIF': 'bg-blue-500',
      'BEKLEMEDE': 'bg-gray-500',
      'TAMAMLANDI': 'bg-green-500',
      'IPTAL': 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  // ✅ DÜZELTME: Backend'ten gelen Türkçe priority değerleri ile eşleşen mapping
  const getPriorityColor = (priority) => {
    const colors = {
      'DUSUK': 'text-green-400',
      'ORTA': 'text-yellow-400',
      'YUKSEK': 'text-orange-400',
      'KRITIK': 'text-red-400'
    };
    return colors[priority] || 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!committee) {
    return null;
  }

  const isMember = committee.members_detail?.some(m => m.id === user?.id);
  const isLeader = committee.leader === user?.id;
  const isViceLeader = committee.vice_leader === user?.id;
  const isAdmin = user?.role === 'BASKAN' || user?.role === 'BASKAN_YARDIMCISI';
  const canManage = isAdmin || isLeader || isViceLeader;

  const activeProjects = projects.filter(p => p.is_active && p.status !== 'COMPLETED' && p.status !== 'CANCELLED');
  const completedProjects = projects.filter(p => p.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/committees')}
        className="flex items-center text-gray-400 hover:text-white transition-colors"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Komitelere Dön
      </button>

      {/* Header */}
      <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 rounded-xl p-8 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-white mb-3">{committee.name}</h1>
            <p className="text-purple-200 text-lg mb-6 leading-relaxed">
              {committee.description}
            </p>
            
            {/* Stats Row */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-purple-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                <span className="text-purple-100 font-medium">{committee.members_detail?.length || 0} Üye</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-purple-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
                </svg>
                <span className="text-purple-100 font-medium">{activeProjects.length} Aktif Proje</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-purple-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-purple-100 font-medium">{completedProjects.length} Tamamlanan</span>
              </div>
            </div>
          </div>

          {isMember && (
            <div className="flex-shrink-0">
              <span className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Üyesiniz
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900 rounded-lg p-1 flex space-x-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            activeTab === 'overview'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Genel Bakış
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            activeTab === 'members'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <svg className="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
          Üyeler ({committee.members_detail?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            activeTab === 'projects'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <svg className="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
          </svg>
          Projeler ({projects.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Leadership */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Yönetim</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Leader */}
                {committee.leader_detail && (
                  <div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg border-2 border-purple-600">
                    {committee.leader_detail.profile_image ? (
                      <img 
                        src={committee.leader_detail.profile_image}
                        alt={committee.leader_detail.full_name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-purple-500"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center border-2 border-purple-500">
                        <span className="text-white font-bold text-xl">
                          {committee.leader_detail.full_name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-purple-400 text-sm font-medium">Komite Başkanı</span>
                      </div>
                      <p className="text-white font-bold text-lg">{committee.leader_detail.full_name}</p>
                      <p className="text-gray-400 text-sm">{committee.leader_detail.email}</p>
                    </div>
                  </div>
                )}

                {/* Vice Leader */}
                {committee.vice_leader_detail && (
                  <div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg border-2 border-purple-500">
                    {committee.vice_leader_detail.profile_image ? (
                      <img 
                        src={committee.vice_leader_detail.profile_image}
                        alt={committee.vice_leader_detail.full_name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-purple-400"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center border-2 border-purple-400">
                        <span className="text-white font-bold text-xl">
                          {committee.vice_leader_detail.full_name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-purple-400 text-sm font-medium">Komite Başkan Yardımcısı</span>
                      </div>
                      <p className="text-white font-bold text-lg">{committee.vice_leader_detail.full_name}</p>
                      <p className="text-gray-400 text-sm">{committee.vice_leader_detail.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg p-6 border border-blue-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-300 text-sm mb-1">Toplam Proje</p>
                    <p className="text-white text-3xl font-bold">{projects.length}</p>
                  </div>
                  <svg className="w-12 h-12 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
                  </svg>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-900 to-yellow-800 rounded-lg p-6 border border-yellow-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-300 text-sm mb-1">Aktif Proje</p>
                    <p className="text-white text-3xl font-bold">{activeProjects.length}</p>
                  </div>
                  <svg className="w-12 h-12 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-lg p-6 border border-green-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-300 text-sm mb-1">Tamamlanan</p>
                    <p className="text-white text-3xl font-bold">{completedProjects.length}</p>
                  </div>
                  <svg className="w-12 h-12 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-lg p-6 border border-purple-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-sm mb-1">Toplam Üye</p>
                    <p className="text-white text-3xl font-bold">{committee.members_detail?.length || 0}</p>
                  </div>
                  <svg className="w-12 h-12 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Komite Üyeleri</h2>
              {canManage && (
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all">
                  <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Üye Ekle
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {committee.members_detail?.map(member => (
                <div 
                  key={member.id}
                  className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors group"
                >
                  <div className="flex items-center space-x-4">
                    {member.profile_image ? (
                      <img 
                        src={member.profile_image}
                        alt={member.full_name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-gray-700 group-hover:border-purple-600 transition-colors"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center border-2 border-gray-700 group-hover:border-purple-600 transition-colors">
                        <span className="text-white font-bold text-lg">
                          {member.full_name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate group-hover:text-purple-300 transition-colors">
                        {member.full_name}
                      </p>
                      <p className="text-gray-400 text-sm truncate">{member.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-yellow-500 text-xs font-medium">Lv {member.level || 1}</span>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-500 text-xs">{member.total_points || 0} puan</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {(!committee.members_detail || committee.members_detail.length === 0) && (
              <div className="text-center py-12">
                <svg className="w-20 h-20 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-gray-500 text-lg">Henüz üye yok</p>
              </div>
            )}
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            {canManage && (
              <div className="flex justify-end">
                <Link
                  to="/projects/create"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all inline-flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Yeni Proje Oluştur
                </Link>
              </div>
            )}

            {projects.length === 0 ? (
              <div className="bg-gray-900 rounded-lg p-12 text-center">
                <svg className="w-20 h-20 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-gray-500 text-lg mb-2">Henüz proje yok</p>
                <p className="text-gray-600">Bu komite için ilk projeyi oluşturun</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {projects.map(project => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="bg-gray-900 rounded-lg p-6 hover:bg-gray-850 transition-all border border-gray-800 hover:border-purple-600 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`${getStatusColor(project.status)} text-white text-xs px-2 py-1 rounded`}>
                            {project.status_display}
                          </span>
                          <span className={`${getPriorityColor(project.priority)} text-xs font-medium`}>
                            {project.priority_display}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors mb-2">
                          {project.title}
                        </h3>
                        <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">
                          {project.description}
                        </p>
                      </div>
                    </div>

                    {/* Project Stats */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-800">
                      <div>
                        <p className="text-gray-500 text-xs mb-1">İlerleme</p>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all"
                              style={{ width: `${project.completion_percentage || 0}%` }}
                            />
                          </div>
                          <span className="text-purple-400 text-xs font-medium">
                            {project.completion_percentage || 0}%
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-gray-500 text-xs mb-1">Görevler</p>
                        <p className="text-white font-medium">
                          {project.completed_task_count || 0}/{project.task_count || 0}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500 text-xs mb-1">Takım</p>
                        <div className="flex -space-x-2">
                          {project.team_member_names?.slice(0, 3).map((name, idx) => (
                            <div 
                              key={idx}
                              className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 border-2 border-gray-900 flex items-center justify-center"
                              title={name}
                            >
                              <span className="text-white text-xs font-bold">
                                {name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          ))}
                          {project.team_member_names?.length > 3 && (
                            <div className="w-7 h-7 rounded-full bg-gray-700 border-2 border-gray-900 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                +{project.team_member_names.length - 3}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
