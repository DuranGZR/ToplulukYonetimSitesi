import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import SkeletonLoader from '../components/SkeletonLoader';

export default function EventsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [sortBy, setSortBy] = useState('date_new');
  const [viewMode, setViewMode] = useState(() => {
    // localStorage'dan görünüm tercihini yükle
    const saved = localStorage.getItem('eventsViewMode');
    return saved || 'grid'; // 'grid', 'list', 'compact', 'detailed'
  });

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const [allRes, myRes] = await Promise.all([
        api.get('/events/'),
        api.get('/events/my_events/')
      ]);
      
      // API response formatını kontrol et (array veya {results: []} olabilir)
      const allEventsData = Array.isArray(allRes.data) ? allRes.data : (allRes.data.results || []);
      const myEventsData = Array.isArray(myRes.data) ? myRes.data : (myRes.data.results || []);
      
      // Sadece aktif etkinlikleri göster (is_active === true)
      const activeAllEvents = allEventsData.filter(event => event.is_active === true);
      const activeMyEvents = myEventsData.filter(event => event.is_active === true);
      
      // Tarihe göre yaklaşan ve geçmiş etkinlikleri ayır
      const now = new Date();
      const upcoming = activeAllEvents.filter(event => new Date(event.date_time) >= now);
      const past = activeAllEvents.filter(event => new Date(event.date_time) < now);
      
      // Verileri set et ve loading'i kapat
      setEvents(upcoming);
      setPastEvents(past);
      setMyEvents(activeMyEvents);
      setLoading(false);
    } catch (error) {
      console.error('Etkinlikler yüklenemedi:', error);
      toast.error('Etkinlikler yüklenirken hata oluştu');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    
    // Her 30 saniyede bir otomatik güncelle

  }, [fetchEvents]);

  const getEventTypeColor = (type) => {
    return 'from-red-600 to-red-600';
  };

  const getEventTypeIcon = (type) => {
    return '';
  };

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

  // Liste Görünümü Componenti
  const EventListItem = ({ event, index }) => {
    const isPast = new Date(event.date_time) < new Date();
    const isAttended = myEvents.some(e => e.id === event.id);

    return (
      <div 
        onClick={() => navigate(`/events/${event.id}`)}
        className="group bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-2 sm:p-3 md:p-4 hover:shadow-xl hover:border-red-600/50 transition-all duration-300 border border-gray-700 cursor-pointer"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 md:gap-4">
          {/* Sol Taraf - Poster ve Başlık */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0 w-full sm:w-auto">
            {/* Küçük Poster */}
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-lg overflow-hidden flex-shrink-0">
              {event.poster_image ? (
                <img 
                  src={event.poster_image} 
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 md:gap-2 mb-0.5 sm:mb-1">
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-white truncate w-full sm:w-auto">{event.title}</h3>
                <span className="bg-red-600 text-white text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
                  {event.event_type_display}
                </span>
                {isAttended && (
                  <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
                    ✓ Katıldım
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm line-clamp-1">{event.description}</p>
              {/* Mobilde bilgileri göster */}
              <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-2 sm:hidden text-[10px] sm:text-xs">
                <span className="text-gray-400">{new Date(event.date_time).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</span>
                <span className="text-yellow-400 font-bold">+{event.attendance_points}</span>
              </div>
            </div>
          </div>

          {/* Orta - Bilgiler */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-gray-400 text-xs">Tarih</p>
              <p className="text-white font-semibold">
                {new Date(event.date_time).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs">Lokasyon</p>
              <p className="text-white font-semibold text-xs truncate max-w-[100px]">{event.location}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs">Puan</p>
              <p className="text-yellow-400 font-bold">{event.attendance_points}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs">Katılımcı</p>
              <p className="text-white font-semibold">{event.attendee_count || 0}</p>
            </div>
          </div>

          {/* Sağ Taraf - Aksiyon */}
          <div className="flex-shrink-0 w-full sm:w-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/events/${event.id}`);
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
  const EventCompactItem = ({ event, index }) => {
    const isAttended = myEvents.some(e => e.id === event.id);

    return (
      <div 
        onClick={() => navigate(`/events/${event.id}`)}
        className="group bg-gray-800 rounded-lg p-2 sm:p-2.5 md:p-3 hover:bg-gray-700 hover:border-red-600/50 transition-all duration-200 border border-gray-700 cursor-pointer"
      >
        <div className="flex items-center justify-between gap-2 sm:gap-2.5 md:gap-3">
          <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 flex-1 min-w-0">
            {/* Küçük Poster */}
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded overflow-hidden flex-shrink-0">
              {event.poster_image ? (
                <img 
                  src={event.poster_image} 
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[10px] sm:text-xs md:text-sm font-semibold text-white truncate">{event.title}</h3>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <span className="text-yellow-400 text-[10px] sm:text-xs font-bold">{event.attendance_points}</span>
              {isAttended && (
                <span className="bg-green-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded">✓</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const EventCard = ({ event, index }) => {
    const isPast = new Date(event.date_time) < new Date();
    const isAttended = myEvents.some(e => e.id === event.id);

    return (
      <div 
        onClick={() => navigate(`/events/${event.id}`)}
        className="group relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl overflow-hidden hover:shadow-2xl sm:hover:scale-[1.02] transition-all duration-300 border border-gray-700 cursor-pointer"
        style={{ animation: `slideUp 0.3s ease-out ${index * 0.1}s backwards` }}
      >
        {/* Image with Gradient Overlay */}
        <div className="relative h-32 sm:h-40 md:h-48 lg:h-56 overflow-hidden">
          {event.poster_image ? (
            <img 
              src={event.poster_image} 
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
              <svg className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
          
          {/* Badges on Image */}
          <div className="absolute top-1.5 sm:top-2 md:top-4 left-1.5 sm:left-2 md:left-4 right-1.5 sm:right-2 md:right-4 flex items-center justify-between">
            <span className="bg-red-600 text-white text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-1.5 rounded-full shadow-lg">
              {event.event_type_display}
            </span>
            {isAttended && (
              <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-1.5 rounded-full shadow-lg flex items-center gap-0.5 sm:gap-1">
                ✓ Katıldım
              </span>
            )}
          </div>

          {/* Title on Image */}
          <div className="absolute bottom-1.5 sm:bottom-2 md:bottom-4 left-1.5 sm:left-2 md:left-4 right-1.5 sm:right-2 md:right-4">
            <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white drop-shadow-lg line-clamp-2">{event.title}</h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-2 sm:p-3 md:p-4 lg:p-5">
          <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm mb-2 sm:mb-3 md:mb-4 line-clamp-2">{event.description}</p>

          <div className="space-y-1.5 sm:space-y-2 md:space-y-2.5 mb-2 sm:mb-3 md:mb-4">
            <div className="flex items-center text-gray-300 text-[10px] sm:text-xs md:text-sm">
              <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-red-600 rounded-lg flex items-center justify-center mr-1.5 sm:mr-2 md:mr-3 flex-shrink-0">
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <span className="flex-1 truncate">{formatDate(event.date_time)}</span>
            </div>
            <div className="flex items-center text-gray-300 text-[10px] sm:text-xs md:text-sm">
              <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-red-600 rounded-lg flex items-center justify-center mr-1.5 sm:mr-2 md:mr-3 flex-shrink-0">
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <span className="flex-1 truncate">{event.location}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 md:gap-0 pt-2 sm:pt-3 md:pt-4 border-t border-gray-700">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 text-[10px] sm:text-xs md:text-sm">
              <div className="flex items-center text-white font-semibold">
                {event.attendance_points} puan
              </div>
              <div className="flex items-center text-gray-400">
                {event.attendee_count || 0} kişi
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Kartın onClick'ini engelle
                navigate(`/events/${event.id}`);
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

  const displayEvents = useMemo(() => {
    return activeTab === 'upcoming' 
    ? events 
    : activeTab === 'past' 
    ? pastEvents 
    : myEvents;
  }, [activeTab, events, pastEvents, myEvents]);

  // Ensure displayEvents is always an array
  const safeDisplayEvents = useMemo(() => {
    return Array.isArray(displayEvents) ? displayEvents : [];
  }, [displayEvents]);

  // Sort - Sadece sıralama (useMemo ile optimize edildi)
  const filteredAndSortedEvents = useMemo(() => {
    return [...safeDisplayEvents].sort((a, b) => {
      switch (sortBy) {
        case 'date_new': return new Date(b.date_time) - new Date(a.date_time);
        case 'date_old': return new Date(a.date_time) - new Date(b.date_time);
        case 'points_high': return b.points - a.points;
        case 'points_low': return a.points - b.points;
        case 'title_az': return a.title.localeCompare(b.title, 'tr');
        case 'title_za': return b.title.localeCompare(a.title, 'tr');
        default: return 0;
      }
    });
  }, [safeDisplayEvents, sortBy]);

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
      <div className="max-w-7xl mx-auto space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6 px-2 sm:px-4 pb-4 sm:pb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 md:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-0.5 sm:mb-1 md:mb-2 text-white">
              Etkinlikler
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-400">Topluluk etkinliklerine katıl, puan kazan</p>
          </div>
          {(user?.role === 'BASKAN' || user?.role === 'BASKAN_YARDIMCISI') && (
            <Link
              to="/events/create"
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg text-xs sm:text-sm md:text-base text-center"
            >
              + Yeni Etkinlik
            </Link>
          )}
        </div>

        {/* Sıralama ve Görünüm Seçenekleri */}
        <div className="flex flex-col gap-2 sm:gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
          {/* Sıralama */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 w-full sm:w-auto">
            <label className="text-[10px] sm:text-xs md:text-sm text-gray-400 whitespace-nowrap">Sırala:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 sm:flex-none bg-slate-900/50 border border-slate-800/50 rounded-lg px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 md:py-2 text-white text-[10px] sm:text-xs md:text-sm focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 hover:border-red-600/50 transition-all cursor-pointer"
            >
              <option value="date_new">Tarih (Yeni → Eski)</option>
              <option value="date_old">Tarih (Eski → Yeni)</option>
              <option value="points_high">Puan (Yüksek → Düşük)</option>
              <option value="points_low">Puan (Düşük → Yüksek)</option>
              <option value="title_az">İsim (A → Z)</option>
              <option value="title_za">İsim (Z → A)</option>
            </select>
          </div>

          {/* Görünüm Toggle Butonları */}
          <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 bg-gray-900 p-0.5 sm:p-1 rounded-lg border border-gray-800 w-full sm:w-auto justify-center sm:justify-start">
              <button
                onClick={() => {
                  setViewMode('grid');
                  localStorage.setItem('eventsViewMode', 'grid');
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
                  localStorage.setItem('eventsViewMode', 'list');
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
                  localStorage.setItem('eventsViewMode', 'compact');
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
                  localStorage.setItem('eventsViewMode', 'detailed');
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
                ? 'bg-red-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span className="truncate">Yaklaşan</span>
            <span className="text-[10px] sm:text-xs opacity-75 ml-0.5 sm:ml-1 md:ml-2">({events.length})</span>
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
            <span className="text-[10px] sm:text-xs opacity-75 ml-0.5 sm:ml-1 md:ml-2">({pastEvents.length})</span>
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
            <span className="text-[10px] sm:text-xs opacity-75 ml-0.5 sm:ml-1 md:ml-2">({myEvents.length})</span>
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
            <SkeletonLoader type="card" count={6} />
          </div>
        ) : filteredAndSortedEvents.length === 0 ? (
          <div className="text-center py-8 sm:py-12 md:py-20 px-4">
            <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-300 mb-1 sm:mb-2">Etkinlik bulunamadı</h3>
            <p className="text-xs sm:text-sm md:text-base text-gray-500 mb-3 sm:mb-4 md:mb-6">
              {activeTab === 'my' 
                ? 'Henüz hiç etkinliğe katılmadınız. Hemen bir etkinliğe katılarak puan kazanmaya başlayın!' 
                : 'Henüz etkinlik eklenmemiş. Yakında yeni etkinlikler eklenecek!'}
            </p>
            {activeTab === 'my' && events.length > 0 && (
              <button
                onClick={() => setActiveTab('all')}
                className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg text-xs sm:text-sm md:text-base"
              >
                Tüm Etkinlikleri Gör
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Grid Görünümü */}
            {viewMode === 'grid' && (
              <div key={viewMode} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6 view-transition">
                {filteredAndSortedEvents.map((event, index) => (
                  <EventCard key={event.id} event={event} index={index} />
                ))}
              </div>
            )}

            {/* Liste Görünümü */}
            {viewMode === 'list' && (
              <div key={viewMode} className="space-y-1.5 sm:space-y-2 md:space-y-3 view-transition">
                {filteredAndSortedEvents.map((event, index) => (
                  <EventListItem key={event.id} event={event} index={index} />
                ))}
              </div>
            )}

            {/* Kompakt Görünüm */}
            {viewMode === 'compact' && (
              <div key={viewMode} className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-2 md:gap-3 view-transition">
                {filteredAndSortedEvents.map((event, index) => (
                  <EventCompactItem key={event.id} event={event} index={index} />
                ))}
              </div>
            )}

            {/* Detaylı Görünüm (Grid ama daha büyük kartlar) */}
            {viewMode === 'detailed' && (
              <div key={viewMode} className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:gap-6 view-transition">
                {filteredAndSortedEvents.map((event, index) => (
                  <EventCard key={event.id} event={event} index={index} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
