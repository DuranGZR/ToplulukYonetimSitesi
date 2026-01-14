import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import SkeletonLoader from '../components/SkeletonLoader';

export default function MeetingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [pastMeetings, setPastMeetings] = useState([]);
  const [myMeetings, setMyMeetings] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [filterValues, setFilterValues] = useState({ committee: 'all', meeting_type: 'all', is_general: 'all' });
  const [sortBy, setSortBy] = useState('date_new');
  const [viewMode, setViewMode] = useState(() => {
    // localStorage'dan görünüm tercihini yükle
    const saved = localStorage.getItem('meetingsViewMode');
    return saved || 'grid'; // 'grid', 'list', 'compact'
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

  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      const [allRes, myRes] = await Promise.all([
        api.get('/meetings/'),
        api.get('/meetings/my_meetings/')
      ]);
      
      const allMeetingsData = Array.isArray(allRes.data) ? allRes.data : (allRes.data.results || []);
      const myMeetingsData = Array.isArray(myRes.data) ? myRes.data : (myRes.data.results || []);
      
      // Sadece aktif toplantıları göster
      const activeAllMeetings = allMeetingsData.filter(meeting => meeting.is_active === true);
      const activeMyMeetings = myMeetingsData.filter(meeting => meeting.is_active === true);
      
      // Tarihe göre yaklaşan ve geçmiş toplantıları ayır
      const now = new Date();
      const upcoming = activeAllMeetings.filter(meeting => new Date(meeting.date_time) >= now);
      const past = activeAllMeetings.filter(meeting => new Date(meeting.date_time) < now);
      
      // Verileri set et ve loading'i kapat
      setMeetings(upcoming);
      setPastMeetings(past);
      setMyMeetings(activeMyMeetings);
      setLoading(false);
    } catch (error) {
      console.error('Toplantılar yüklenemedi:', error);
      toast.error('Toplantılar yüklenirken hata oluştu');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommittees();
    fetchMeetings();
    
    // Her 30 saniyede bir otomatik güncelle

  }, [fetchCommittees, fetchMeetings]);

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const getMeetingTypeColor = useCallback((type) => {
    const colors = {
      'KOMITE': 'from-red-600 to-red-700',
      'GENEL_KURUL': 'from-purple-600 to-purple-700',
      'EGITIM': 'from-green-600 to-green-700',
      'KOORDINASYON': 'from-orange-600 to-orange-700',
      'DIGER': 'from-gray-600 to-gray-700',
    };
    return colors[type] || 'from-gray-600 to-gray-700';
  }, []);

  // Liste Görünümü Componenti
  const MeetingListItem = ({ meeting, index }) => {
    const isPast = new Date(meeting.date_time) < new Date();
    const isAttended = myMeetings.some(m => m.id === meeting.id);

    return (
      <div 
        onClick={() => {
          if (!meeting.id) {
            console.error('Meeting ID is missing:', meeting);
            toast.error('Toplantı ID bulunamadı');
            return;
          }
          navigate(`/meetings/${meeting.id}`);
        }}
        className="group bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-1.5 sm:p-2 md:p-3 lg:p-4 hover:shadow-xl hover:border-red-600/50 transition-all duration-300 border border-gray-700 cursor-pointer"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 md:gap-3 lg:gap-4">
          {/* Sol Taraf - Icon ve Başlık */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 flex-1 min-w-0 w-full sm:w-auto">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 bg-gradient-to-br ${getMeetingTypeColor(meeting.meeting_type)} rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm md:text-base lg:text-lg shadow-lg flex-shrink-0`}>
              📋
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 md:gap-2 mb-0.5 sm:mb-1">
                <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-white truncate w-full sm:w-auto">{meeting.title}</h3>
                <span className={`bg-gradient-to-r ${getMeetingTypeColor(meeting.meeting_type)} text-white text-[10px] sm:text-xs font-semibold px-1 sm:px-1.5 md:px-2 py-0.5 rounded-full whitespace-nowrap`}>
                  {meeting.meeting_type_display}
                </span>
                {isAttended && (
                  <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-[10px] sm:text-xs font-semibold px-1 sm:px-1.5 md:px-2 py-0.5 rounded-full whitespace-nowrap">
                    <span className="hidden sm:inline">✓ Katıldım</span>
                    <span className="sm:hidden">✓</span>
                  </span>
                )}
              </div>
              {meeting.description && (
                <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm line-clamp-1">{meeting.description}</p>
              )}
              {/* Mobilde bilgileri göster */}
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 mt-0.5 sm:mt-1 md:mt-2 sm:hidden text-[10px] sm:text-xs">
                <span className="text-white">{new Date(meeting.date_time).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</span>
                <span className="text-white">{meeting.attendee_count || 0} kişi</span>
              </div>
            </div>
          </div>

          {/* Orta - Bilgiler */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-gray-400 text-xs">Tarih</p>
              <p className="text-white font-semibold">
                {new Date(meeting.date_time).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs">Lokasyon</p>
              <p className="text-white font-semibold text-xs truncate max-w-[100px]">{meeting.location}</p>
            </div>
            {meeting.committee_name && (
              <div className="text-center">
                <p className="text-gray-400 text-xs">Komite</p>
                <p className="text-white font-semibold text-xs truncate max-w-[100px]">{meeting.committee_name}</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-gray-400 text-xs">Katılımcı</p>
              <p className="text-white font-semibold">{meeting.attendee_count || 0}</p>
            </div>
          </div>

          {/* Sağ Taraf - Aksiyon */}
          <div className="flex-shrink-0 w-full sm:w-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!meeting.id) {
                  console.error('Meeting ID is missing:', meeting);
                  toast.error('Toplantı ID bulunamadı');
                  return;
                }
                navigate(`/meetings/${meeting.id}`);
              }}
              className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-lg text-[10px] sm:text-xs md:text-sm font-semibold transition-all shadow-lg"
            >
              {isPast ? 'Detaylar' : 'QR Tara'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Kompakt Görünüm Componenti
  const MeetingCompactItem = ({ meeting, index }) => {
    const isAttended = myMeetings.some(m => m.id === meeting.id);

    return (
      <div 
        onClick={() => {
          if (!meeting.id) {
            console.error('Meeting ID is missing:', meeting);
            toast.error('Toplantı ID bulunamadı');
            return;
          }
          navigate(`/meetings/${meeting.id}`);
        }}
        className="group bg-gray-800 rounded-lg p-1.5 sm:p-2 md:p-2.5 lg:p-3 hover:bg-gray-700 hover:border-red-600/50 transition-all duration-200 border border-gray-700 cursor-pointer"
      >
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 flex-1 min-w-0">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-gradient-to-br ${getMeetingTypeColor(meeting.meeting_type)} rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0`}>
              📋
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[10px] sm:text-xs md:text-sm font-semibold text-white truncate">{meeting.title}</h3>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0">
            {isAttended && (
              <span className="bg-green-600 text-white text-[10px] sm:text-xs font-semibold px-1 sm:px-1.5 md:px-2 py-0.5 sm:py-1 rounded">✓</span>
            )}
            <span className="text-white font-bold text-[10px] sm:text-xs">
              {new Date(meeting.date_time).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const MeetingCard = ({ meeting, index }) => {
    const isPast = new Date(meeting.date_time) < new Date();
    const isAttended = myMeetings.some(m => m.id === meeting.id);

    const handleCardClick = () => {
      if (!meeting.id) {
        console.error('Meeting ID is missing:', meeting);
        toast.error('Toplantı ID bulunamadı');
        return;
      }
      navigate(`/meetings/${meeting.id}`);
    };

    return (
      <div 
        onClick={handleCardClick}
        className="group relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl overflow-hidden hover:shadow-2xl sm:hover:scale-[1.02] transition-all duration-300 border border-gray-700 cursor-pointer"
        style={{ animation: `slideUp 0.3s ease-out ${index * 0.1}s backwards` }}
      >
        {/* Header */}
        <div className="p-2 sm:p-2.5 md:p-3 lg:p-4 xl:p-5">
          <div className="flex items-start justify-between mb-1 sm:mb-1.5 md:mb-2 lg:mb-3">
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-3">
              <div className={`w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-gradient-to-br ${getMeetingTypeColor(meeting.meeting_type)} rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-lg`}>
                📋
              </div>
              <div>
                <span className={`bg-gradient-to-r ${getMeetingTypeColor(meeting.meeting_type)} text-white text-[10px] sm:text-xs font-semibold px-1 sm:px-1.5 md:px-2 lg:px-3 py-0.5 sm:py-1 rounded-full shadow-lg`}>
                  {meeting.meeting_type_display}
                </span>
              </div>
            </div>
            {isAttended && (
              <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-[10px] sm:text-xs font-semibold px-1 sm:px-1.5 md:px-2 lg:px-3 py-0.5 sm:py-1 md:py-1.5 rounded-full shadow-lg flex items-center gap-0.5 sm:gap-1">
                <span className="hidden sm:inline">✓ Katıldım</span>
                <span className="sm:hidden">✓</span>
              </span>
            )}
          </div>

          <h3 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold text-white mb-0.5 sm:mb-1 md:mb-1.5 lg:mb-2 line-clamp-2">{meeting.title}</h3>
          {meeting.description && (
            <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1.5 sm:mb-2 md:mb-3 lg:mb-4 line-clamp-1 sm:line-clamp-2">{meeting.description}</p>
          )}

          <div className="space-y-1 sm:space-y-1.5 md:space-y-2 lg:space-y-2.5 mb-1.5 sm:mb-2 md:mb-3 lg:mb-4">
            <div className="flex items-center text-gray-300 text-[10px] sm:text-xs md:text-sm">
              <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 bg-red-600 rounded-lg flex items-center justify-center mr-1 sm:mr-1.5 md:mr-2 lg:mr-3 flex-shrink-0">
                <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 lg:w-4 lg:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="flex-1 truncate">{formatDate(meeting.date_time)}</span>
            </div>
            <div className="flex items-center text-gray-300 text-[10px] sm:text-xs md:text-sm">
              <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 bg-red-600 rounded-lg flex items-center justify-center mr-1 sm:mr-1.5 md:mr-2 lg:mr-3 flex-shrink-0">
                <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 lg:w-4 lg:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="flex-1 truncate">{meeting.location}</span>
            </div>
            {meeting.committee_name && (
              <div className="hidden sm:flex items-center text-gray-300 text-[10px] sm:text-xs md:text-sm">
                <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-red-600 rounded-lg flex items-center justify-center mr-1.5 sm:mr-2 md:mr-3 flex-shrink-0">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="flex-1 truncate">{meeting.committee_name}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-1.5 md:gap-2 lg:gap-0 pt-1.5 sm:pt-2 md:pt-3 lg:pt-4 border-t border-gray-700">
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 text-[10px] sm:text-xs md:text-sm">
              <div className="flex items-center text-white font-semibold">
                {meeting.attendee_count || 0} katılımcı
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!meeting.id) {
                  console.error('Meeting ID is missing:', meeting);
                  toast.error('Toplantı ID bulunamadı');
                  return;
                }
                navigate(`/meetings/${meeting.id}`);
              }}
              className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-lg text-[10px] sm:text-xs md:text-sm font-semibold transition-all shadow-lg hover:shadow-red-600/50"
            >
              {isPast ? 'Detaylar' : 'QR Tara'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const displayMeetings = useMemo(() => {
    return activeTab === 'upcoming' 
    ? meetings 
    : activeTab === 'past' 
    ? pastMeetings 
    : myMeetings;
  }, [activeTab, meetings, pastMeetings, myMeetings]);

  const safeDisplayMeetings = useMemo(() => {
    return Array.isArray(displayMeetings) ? displayMeetings : [];
  }, [displayMeetings]);

  // Filter and sort (useMemo ile optimize edildi)
  const filteredAndSortedMeetings = useMemo(() => {
    return [...safeDisplayMeetings]
    .filter(meeting => {
      if (filterValues.committee && filterValues.committee !== 'all') {
        if (meeting.committee !== parseInt(filterValues.committee)) return false;
      }
      if (filterValues.meeting_type && filterValues.meeting_type !== 'all') {
        if (meeting.meeting_type !== filterValues.meeting_type) return false;
      }
      if (filterValues.is_general && filterValues.is_general !== 'all') {
        const isGeneral = filterValues.is_general === 'true';
        if (meeting.is_general !== isGeneral) return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date_new': return new Date(b.date_time) - new Date(a.date_time);
        case 'date_old': return new Date(a.date_time) - new Date(b.date_time);
        default: return 0;
      }
    });
  }, [safeDisplayMeetings, filterValues, sortBy]);

  const canCreateMeeting = user?.is_admin || user?.role === 'KOMITE_LIDERI' || user?.role === 'KOMITE_YARDIMCISI';

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
      `}</style>
      <div className="max-w-7xl mx-auto space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6 px-2 sm:px-4 pb-4 sm:pb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 md:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-0.5 sm:mb-1 md:mb-2 text-white">
              Toplantılar
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-400">Topluluk toplantılarına katıl, puan kazan</p>
          </div>
          {canCreateMeeting && (
            <Link
              to="/meetings/create"
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg text-xs sm:text-sm md:text-base text-center"
            >
              + Yeni Toplantı
            </Link>
          )}
        </div>

        {/* Filtreler, Sıralama ve Görünüm Seçenekleri */}
        <div className="space-y-2 sm:space-y-3">
          {/* Filtreler - Grid Yapısı */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5 md:gap-3">
          {/* Komite Filtresi */}
            <div className="flex flex-col gap-1 sm:gap-1.5">
              <label className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">Komite:</label>
            <select
              value={filterValues.committee || 'all'}
              onChange={(e) => setFilterValues(prev => ({ ...prev, committee: e.target.value }))}
                className="w-full bg-slate-900/50 border border-slate-800/50 rounded-lg px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 md:py-2 text-white text-[10px] sm:text-xs md:text-sm focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 hover:border-red-600/50 transition-all cursor-pointer"
            >
              <option value="all">Tüm Komiteler</option>
              {committees.map(committee => (
                <option key={committee.id} value={committee.id.toString()}>
                  {committee.name}
                </option>
              ))}
            </select>
          </div>

          {/* Toplantı Türü Filtresi */}
            <div className="flex flex-col gap-1 sm:gap-1.5">
              <label className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">Tür:</label>
            <select
              value={filterValues.meeting_type || 'all'}
              onChange={(e) => setFilterValues(prev => ({ ...prev, meeting_type: e.target.value }))}
                className="w-full bg-slate-900/50 border border-slate-800/50 rounded-lg px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 md:py-2 text-white text-[10px] sm:text-xs md:text-sm focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 hover:border-red-600/50 transition-all cursor-pointer"
            >
              <option value="all">Tüm Türler</option>
              <option value="KOMITE">Komite Toplantısı</option>
              <option value="GENEL_KURUL">Genel Kurul</option>
              <option value="EGITIM">Eğitim</option>
              <option value="KOORDINASYON">Koordinasyon</option>
              <option value="DIGER">Diğer</option>
            </select>
          </div>

          {/* Genel/Komite Filtresi */}
            <div className="flex flex-col gap-1 sm:gap-1.5">
              <label className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">Tip:</label>
            <select
              value={filterValues.is_general || 'all'}
              onChange={(e) => setFilterValues(prev => ({ ...prev, is_general: e.target.value }))}
                className="w-full bg-slate-900/50 border border-slate-800/50 rounded-lg px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 md:py-2 text-white text-[10px] sm:text-xs md:text-sm focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 hover:border-red-600/50 transition-all cursor-pointer"
            >
              <option value="all">Tümü</option>
                <option value="true">Genel</option>
                <option value="false">Komite</option>
            </select>
          </div>

          {/* Sıralama */}
            <div className="flex flex-col gap-1 sm:gap-1.5">
              <label className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">Sırala:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-800/50 rounded-lg px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 md:py-2 text-white text-[10px] sm:text-xs md:text-sm focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 hover:border-red-600/50 transition-all cursor-pointer"
            >
                <option value="date_new">Yeni → Eski</option>
                <option value="date_old">Eski → Yeni</option>
            </select>
            </div>
          </div>

          {/* Görünüm Toggle Butonları - Ortalanmış */}
          <div className="flex flex-col items-center gap-1 sm:gap-1.5">
            <label className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">Görünüm:</label>
            <div className="flex items-center gap-0.5 sm:gap-1 bg-gray-900 p-0.5 rounded-lg border border-gray-800">
            <button
              onClick={() => {
                setViewMode('grid');
                localStorage.setItem('meetingsViewMode', 'grid');
              }}
                className={`p-1 sm:p-1.5 rounded transition-all ${
                viewMode === 'grid'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              title="Grid Görünümü"
            >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => {
                setViewMode('list');
                localStorage.setItem('meetingsViewMode', 'list');
              }}
                className={`p-1 sm:p-1.5 rounded transition-all ${
                viewMode === 'list'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              title="Liste Görünümü"
            >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => {
                setViewMode('compact');
                localStorage.setItem('meetingsViewMode', 'compact');
              }}
                className={`p-1 sm:p-1.5 rounded transition-all ${
                viewMode === 'compact'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              title="Kompakt Görünüm"
            >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 sm:space-x-1.5 md:space-x-2 bg-gray-900 p-0.5 sm:p-1 md:p-2 rounded-lg sm:rounded-xl border border-gray-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 min-w-0 py-1.5 sm:py-2 md:py-3 px-2 sm:px-3 md:px-4 font-medium transition-all rounded-lg text-[10px] sm:text-xs md:text-sm ${
              activeTab === 'upcoming'
                ? 'bg-red-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span className="truncate">Yaklaşan</span>
            <span className="text-[10px] sm:text-xs opacity-75 ml-0.5 sm:ml-1 md:ml-2">({meetings.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 min-w-0 py-1.5 sm:py-2 md:py-3 px-2 sm:px-3 md:px-4 font-medium transition-all rounded-lg text-[10px] sm:text-xs md:text-sm ${
              activeTab === 'past'
                ? 'bg-red-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span className="truncate">Geçmiş</span>
            <span className="text-[10px] sm:text-xs opacity-75 ml-0.5 sm:ml-1 md:ml-2">({pastMeetings.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`flex-1 min-w-0 py-1.5 sm:py-2 md:py-3 px-2 sm:px-3 md:px-4 font-medium transition-all rounded-lg text-[10px] sm:text-xs md:text-sm ${
              activeTab === 'my'
                ? 'bg-red-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span className="truncate">Katıldıklarım</span>
            <span className="text-[10px] sm:text-xs opacity-75 ml-0.5 sm:ml-1 md:ml-2">({myMeetings.length})</span>
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
            <SkeletonLoader type="card" count={6} />
          </div>
        ) : filteredAndSortedMeetings.length === 0 ? (
          <div className="text-center py-8 sm:py-12 md:py-20 px-4">
            <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-300 mb-1 sm:mb-2">Toplantı bulunamadı</h3>
            <p className="text-xs sm:text-sm md:text-base text-gray-500 mb-3 sm:mb-4 md:mb-6">
              {activeTab === 'my' 
                ? 'Henüz hiç toplantıya katılmadınız. Hemen bir toplantıya katılarak puan kazanmaya başlayın!' 
                : 'Henüz toplantı eklenmemiş. Yakında yeni toplantılar eklenecek!'}
            </p>
            {activeTab === 'my' && meetings.length > 0 && (
              <button
                onClick={() => setActiveTab('upcoming')}
                className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg text-xs sm:text-sm md:text-base"
              >
                Tüm Toplantıları Gör
              </button>
            )}
          </div>
        ) : (
          <>
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
                {filteredAndSortedMeetings.map((meeting, index) => (
                  <MeetingCard key={meeting.id} meeting={meeting} index={index} />
                ))}
              </div>
            )}
            {viewMode === 'list' && (
              <div className="space-y-1.5 sm:space-y-2 md:space-y-3 lg:space-y-4">
                {filteredAndSortedMeetings.map((meeting, index) => (
                  <MeetingListItem key={meeting.id} meeting={meeting} index={index} />
                ))}
              </div>
            )}
            {viewMode === 'compact' && (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-2 md:gap-3">
                {filteredAndSortedMeetings.map((meeting, index) => (
                  <MeetingCompactItem key={meeting.id} meeting={meeting} index={index} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

