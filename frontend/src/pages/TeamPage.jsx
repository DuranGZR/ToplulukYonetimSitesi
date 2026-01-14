import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import ReportUserModal from '../components/ReportUserModal';

export default function TeamPage() {
  const { user } = useAuth();
  const [committees, setCommittees] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommittee, setSelectedCommittee] = useState('all');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberProfile, setMemberProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [committeesRes, membersRes] = await Promise.all([
        api.get('/committees/'),
        api.get('/users/')
      ]);
      
      const committeesData = Array.isArray(committeesRes.data) 
        ? committeesRes.data 
        : (committeesRes.data?.results || []);
      
      setCommittees(committeesData);
      setMembers(membersRes.data.results || membersRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Veriler yüklenemedi:', error);
      toast.error('Veriler yüklenirken hata oluştu');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchMemberProfile = async (memberId) => {
    try {
      setLoadingProfile(true);
      const response = await api.get(`/users/${memberId}/profile/`);
      setMemberProfile(response.data);
      setShowProfileModal(true);
    } catch (error) {
      console.error('Profil yüklenemedi:', error);
      toast.error('Profil bilgileri yüklenirken hata oluştu');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleMemberClick = (member) => {
    setSelectedMember(member);
    fetchMemberProfile(member.id);
  };

  const getRoleDisplay = (role) => {
    const roleLabelMap = {
      'BASKAN': 'Başkan',
      'BASKAN_YARDIMCISI': 'Başkan Yardımcısı',
      'KOMITE_LIDERI': 'Komite Lideri',
      'KOMITE_YARDIMCISI': 'Komite Yardımcısı',
      'UYE': 'Üye',
    };
    return roleLabelMap[role] || role;
  };

  const safeMembers = useMemo(() => {
    return Array.isArray(members) ? members : [];
  }, [members]);
  
  const safeCommittees = useMemo(() => {
    return Array.isArray(committees) ? committees : [];
  }, [committees]);

  const filteredMembers = useMemo(() => {
    if (selectedCommittee === 'all') return safeMembers;
    
    return safeMembers.filter(m => {
      const committee = safeCommittees.find(c => c.id === selectedCommittee);
      if (!committee) return false;
      return committee.members?.includes(m.id) || 
             m.id === committee.leader || 
             m.id === committee.vice_leader;
    });
  }, [selectedCommittee, safeMembers, safeCommittees]);

  const stats = useMemo(() => {
    return {
      total: safeMembers.length,
      baskan: safeMembers.filter(m => m.role === 'BASKAN' || m.role === 'BASKAN_YARDIMCISI').length,
      committees: safeCommittees.length,
      leaders: safeMembers.filter(m => m.role === 'KOMITE_LIDERI' || m.role === 'KOMITE_YARDIMCISI').length
    };
  }, [safeMembers, safeCommittees]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6 px-2 sm:px-4 pb-4 sm:pb-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-1 sm:mb-2 md:mb-3">Ekibimiz</h1>
          <p className="text-gray-400 text-xs sm:text-sm md:text-base lg:text-lg">HSD İnönü topluluğunun tüm üyeleri</p>
        </div>

        {/* Stats - Minimal */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <div className="bg-slate-900/50 rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 lg:p-6 text-center border border-slate-800/50">
            <p className="text-slate-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Toplam Üye</p>
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 lg:p-6 text-center border border-slate-800/50">
            <p className="text-slate-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Yönetim</p>
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-red-500">{stats.baskan}</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 lg:p-6 text-center border border-slate-800/50">
            <p className="text-slate-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Komiteler</p>
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">{stats.committees}</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 lg:p-6 text-center border border-slate-800/50">
            <p className="text-slate-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Liderler</p>
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">{stats.leaders}</p>
          </div>
        </div>

        {/* Committee Filters - Minimal */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCommittee('all')}
            className={`px-2 sm:px-3 md:px-4 lg:px-5 py-1 sm:py-1.5 md:py-2 lg:py-2.5 rounded-lg sm:rounded-xl font-medium transition-all text-[10px] sm:text-xs md:text-sm whitespace-nowrap ${
              selectedCommittee === 'all'
                ? 'bg-red-600 text-white'
                : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800/50 border border-slate-800/50'
            }`}
          >
            Tümü ({stats.total})
          </button>
          {safeCommittees.map(committee => {
            const memberCount = safeMembers.filter(m => 
              committee.members?.includes(m.id) || 
              m.id === committee.leader || 
              m.id === committee.vice_leader
            ).length;
            
            return (
              <button
                key={committee.id}
                onClick={() => setSelectedCommittee(committee.id)}
                className={`px-2 sm:px-3 md:px-4 lg:px-5 py-1 sm:py-1.5 md:py-2 lg:py-2.5 rounded-lg sm:rounded-xl font-medium transition-all text-[10px] sm:text-xs md:text-sm whitespace-nowrap ${
                  selectedCommittee === committee.id
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800/50 border border-slate-800/50'
                }`}
              >
                {committee.name} ({memberCount})
              </button>
            );
          })}
        </div>

        {/* Members Grid - Clean & Minimal */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-3 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-900/50 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">Üye bulunamadı</h3>
            <p className="text-slate-500">Bu filtrede gösterilecek üye yok.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                onClick={() => handleMemberClick(member)}
                className="bg-slate-900/30 rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 lg:p-5 border border-slate-800/50 hover:border-red-600/50 hover:bg-slate-900/50 transition-all cursor-pointer group"
              >
                {/* Avatar */}
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    {member.profile_image ? (
                      <img 
                        src={`http://127.0.0.1:8000${member.profile_image}`}
                        alt={member.full_name}
                        className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full object-cover mb-1.5 sm:mb-2 md:mb-3 group-hover:scale-105 transition-transform border-2 border-slate-700 group-hover:border-red-600"
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white font-semibold text-xs sm:text-sm md:text-base lg:text-lg mb-1.5 sm:mb-2 md:mb-3 group-hover:scale-105 transition-transform">
                        {member.first_name?.charAt(0)}{member.last_name?.charAt(0)}
                      </div>
                    )}
                    {/* Star Badge */}
                    {member.star_count > 0 && (
                      <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full w-6 h-6 flex items-center justify-center text-xs border-2 border-slate-900 shadow-lg">
                        {member.star_count >= 10 ? '✨' : 
                         member.star_count >= 5 ? '💫' : 
                         member.star_count >= 3 ? '🌟' : '⭐'}
                      </div>
                    )}
                  </div>
                  <h3 className="text-xs sm:text-sm font-semibold text-white mb-0.5 sm:mb-1 line-clamp-1">
                    {member.full_name}
                  </h3>
                  
                  {/* Role */}
                  <p className="text-[10px] sm:text-xs text-slate-400 mb-1.5 sm:mb-2">
                    {getRoleDisplay(member.role)}
                  </p>
                  
                  {/* Stats - Minimal */}
                  <div className="flex items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-slate-800/50 w-full justify-center">
                    <div className="text-center">
                      <p className="text-[10px] sm:text-xs text-slate-500">Level</p>
                      <p className="text-xs sm:text-sm font-bold text-red-500">{member.level}</p>
                    </div>
                    <div className="w-px h-4 sm:h-6 bg-slate-800"></div>
                    <div className="text-center">
                      <p className="text-[10px] sm:text-xs text-slate-500">Puan</p>
                      <p className="text-xs sm:text-sm font-bold text-white">{member.total_points}</p>
                    </div>
                  </div>

                  {/* Report Button */}
                  {member.id !== user.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMember(member);
                        setShowReportModal(true);
                      }}
                      className="mt-2 sm:mt-3 w-full bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white py-1 sm:py-1.5 rounded-lg transition-all text-[10px] sm:text-xs"
                    >
                      Bildir
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile Preview Modal */}
      {showProfileModal && selectedMember && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={() => {
            setShowProfileModal(false);
            setMemberProfile(null);
          }}
        >
          <div 
            className="bg-slate-900 rounded-lg sm:rounded-xl md:rounded-2xl max-w-2xl w-full border border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {loadingProfile ? (
              <div className="flex justify-center items-center py-12 sm:py-20">
                <div className="w-8 h-8 sm:w-12 sm:h-12 border-3 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : memberProfile ? (
              <>
                {/* Header */}
                <div className="relative bg-gradient-to-br from-red-600/10 to-transparent p-4 sm:p-6 md:p-8 border-b border-slate-800">
                  <button
                    onClick={() => {
                      setShowProfileModal(false);
                      setMemberProfile(null);
                    }}
                    className="absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 text-slate-400 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  <div className="flex items-start gap-3 sm:gap-4 md:gap-6">
                    {memberProfile.profile_image ? (
                      <img 
                        src={`http://127.0.0.1:8000${memberProfile.profile_image}`}
                        alt={memberProfile.full_name}
                        className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-lg sm:rounded-xl object-cover border-2 border-red-600"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-lg sm:rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white font-bold text-lg sm:text-xl md:text-2xl border-2 border-red-700">
                        {memberProfile.first_name?.charAt(0)}{memberProfile.last_name?.charAt(0)}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-0.5 sm:mb-1 truncate">{memberProfile.full_name}</h2>
                      <p className="text-xs sm:text-sm md:text-base text-slate-400 mb-1 sm:mb-2 truncate">@{memberProfile.username}</p>
                      <span className="bg-red-600/20 text-red-400 text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-red-600/30">
                        {getRoleDisplay(memberProfile.role)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 md:space-y-6">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                    <div className="bg-slate-800/50 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 text-center border border-slate-800/50">
                      <p className="text-slate-400 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Level</p>
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-500">{memberProfile.level}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 text-center border border-slate-800/50">
                      <p className="text-slate-400 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Toplam Puan</p>
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">{memberProfile.total_points}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 text-center border border-slate-800/50">
                      <p className="text-slate-400 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Yetenekler</p>
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">{memberProfile.skills?.length || 0}</p>
                    </div>
                  </div>

                  {/* Personal Info */}
                  <div className="bg-slate-800/30 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-slate-800/50">
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white mb-2 sm:mb-3 md:mb-4">Kişisel Bilgiler</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                      {memberProfile.email && (
                        <div>
                          <p className="text-slate-500 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Email</p>
                          <p className="text-white text-xs sm:text-sm break-all">{memberProfile.email}</p>
                        </div>
                      )}
                      {memberProfile.department && (
                        <div>
                          <p className="text-slate-500 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Bölüm</p>
                          <p className="text-white text-xs sm:text-sm">{memberProfile.department}</p>
                        </div>
                      )}
                      {memberProfile.grade && (
                        <div>
                          <p className="text-slate-500 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Sınıf</p>
                          <p className="text-white text-xs sm:text-sm">{memberProfile.grade}</p>
                        </div>
                      )}
                      {memberProfile.phone && (
                        <div>
                          <p className="text-slate-500 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Telefon</p>
                          <p className="text-white text-xs sm:text-sm">{memberProfile.phone}</p>
                        </div>
                      )}
                    </div>
                    {memberProfile.bio && (
                      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-800/50">
                        <p className="text-slate-500 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Bio</p>
                        <p className="text-slate-300 text-xs sm:text-sm">{memberProfile.bio}</p>
                      </div>
                    )}
                  </div>

                  {/* Skills */}
                  {memberProfile.skills && memberProfile.skills.length > 0 && (
                    <div className="bg-slate-800/30 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-slate-800/50">
                      <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white mb-2 sm:mb-3 md:mb-4">Yetenekler</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                        {memberProfile.skills.map((skill) => (
                          <div
                            key={skill.id}
                            className="bg-slate-900/50 p-2 sm:p-3 md:p-4 rounded-lg border border-slate-800/50"
                          >
                            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                              <span className="text-white font-medium text-xs sm:text-sm">{skill.name}</span>
                              {skill.is_learning && (
                                <span className="bg-blue-600/20 text-blue-400 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full border border-blue-600/30">
                                  Öğreniyor
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <div className="flex gap-0.5 sm:gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full ${
                                      i < skill.proficiency
                                        ? 'bg-red-600'
                                        : 'bg-slate-700'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-red-500 text-[10px] sm:text-xs font-semibold">
                                {skill.proficiency}/5
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Social Links */}
                  {memberProfile.social_links && memberProfile.social_links.length > 0 && (
                    <div className="bg-slate-800/30 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-slate-800/50">
                      <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white mb-2 sm:mb-3 md:mb-4">İletişim</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        {memberProfile.social_links.map((link) => (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-slate-900/50 p-2 sm:p-3 md:p-4 rounded-lg border border-slate-800/50 hover:border-blue-600/50 transition-all group"
                          >
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="text-blue-500 group-hover:text-blue-400 transition-colors">
                                {link.platform === 'linkedin' && (
                                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                  </svg>
                                )}
                                {link.platform === 'github' && (
                                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                  </svg>
                                )}
                                {link.platform === 'twitter' && (
                                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                  </svg>
                                )}
                                {link.platform === 'instagram' && (
                                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                  </svg>
                                )}
                                {(link.platform === 'website' || link.platform === 'other') && (
                                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                                  </svg>
                                )}
                                {link.platform === 'medium' && (
                                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/>
                                  </svg>
                                )}
                                {link.platform === 'youtube' && (
                                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                  </svg>
                                )}
                                {link.platform === 'behance' && (
                                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M22 7h-7v-2h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14h-8.027c.13 3.211 3.483 3.312 4.588 2.029h3.168zm-7.686-4h4.965c-.105-1.547-1.136-2.219-2.477-2.219-1.466 0-2.277.768-2.488 2.219zm-9.574 6.988h-6.466v-14.967h6.953c5.476.081 5.58 5.444 2.72 6.906 3.461 1.26 3.577 8.061-3.207 8.061zm-3.466-8.988h3.584c2.508 0 2.906-3-.312-3h-3.272v3zm3.391 3h-3.391v3.016h3.341c3.055 0 2.868-3.016.05-3.016z"/>
                                  </svg>
                                )}
                                {link.platform === 'dribbble' && (
                                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.04 6.4 1.73 1.358 3.92 2.166 6.29 2.166 1.42 0 2.77-.29 4-.814zm-11.62-2.58c.232-.4 3.045-5.055 8.332-6.765.135-.045.27-.084.405-.12-.26-.585-.54-1.167-.832-1.74C7.17 11.775 2.206 11.71 1.756 11.7l-.004.312c0 2.633.998 5.037 2.634 6.855zm-2.42-8.955c.46.008 4.683.026 9.477-1.248-1.698-3.018-3.53-5.558-3.8-5.928-2.868 1.35-5.01 3.99-5.676 7.17zM9.6 2.052c.282.38 2.145 2.914 3.822 6 3.645-1.365 5.19-3.44 5.373-3.702-1.81-1.61-4.19-2.586-6.795-2.586-.825 0-1.63.1-2.4.285zm10.335 3.483c-.218.29-1.935 2.493-5.724 4.04.24.49.47.985.68 1.486.08.18.15.36.22.53 3.41-.43 6.8.26 7.14.33-.02-2.42-.88-4.64-2.31-6.38z"/>
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium text-xs sm:text-sm truncate">{link.title}</p>
                                <p className="text-slate-400 text-[10px] sm:text-xs truncate">{link.platform_display}</p>
                              </div>
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 group-hover:text-blue-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {selectedMember?.id !== user.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowProfileModal(false);
                        setShowReportModal(true);
                      }}
                      className="w-full bg-slate-800/50 hover:bg-slate-800 text-white py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl transition-all font-medium text-xs sm:text-sm md:text-base border border-slate-800/50"
                    >
                      Kullanıcıyı Bildir
                    </button>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && selectedMember && (
        <ReportUserModal
          user={selectedMember}
          onClose={() => {
            setShowReportModal(false);
            setSelectedMember(null);
          }}
          onSuccess={() => {}}
        />
      )}
    </Layout>
  );
}
