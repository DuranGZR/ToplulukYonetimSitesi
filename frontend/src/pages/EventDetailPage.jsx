import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import QRScanner from '../components/QRScanner';
import QRCodeDisplay from '../components/QRCodeDisplay';

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [event, setEvent] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [isAttended, setIsAttended] = useState(false);

  useEffect(() => {
    fetchEventDetails();
    
    // Her 30 saniyede bir otomatik güncelle

  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const [eventRes, attendeesRes, myEventsRes] = await Promise.all([
        api.get(`/events/${id}/`),
        api.get(`/events/${id}/attendees/`),
        api.get('/events/my_events/')
      ]);
      
      setEvent(eventRes.data);
      setAttendances(attendeesRes.data);
      setIsAttended(myEventsRes.data.some(e => e.id === parseInt(id)));
    } catch (error) {
      console.error('Etkinlik detayları yüklenemedi:', error);
      toast.error('Etkinlik bulunamadı');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const handleScanSuccess = async (qrData) => {
    try {
      const response = await api.post(`/events/${id}/scan_qr/`, {
        qr_data: qrData
      });
      
      toast.success(response.data.message);
      setShowScanner(false);
      setIsAttended(true);
      
      // Kullanıcı bilgilerini güncelle
      const userRes = await api.get('/users/me/');
      setUser(userRes.data);
      localStorage.setItem('user', JSON.stringify(userRes.data));
      
      fetchEventDetails(); // Refresh data
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'QR kod tarama başarısız';
      toast.error(errorMsg);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 border-t-4 border-b-4 border-red-600 mx-auto"></div>
            <p className="text-gray-400 mt-3 sm:mt-4 text-sm sm:text-base">Yükleniyor...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return null;
  }

  const isPast = new Date(event.date_time) < new Date();
  const isAdmin = user?.role === 'BASKAN' || user?.role === 'BASKAN_YARDIMCISI';

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8 px-2 sm:px-4" style={{ animation: 'fadeIn 0.5s ease-out' }}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/events')}
          className="group flex items-center text-gray-400 hover:text-white transition-all"
        >
          <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-gray-800 group-hover:bg-red-600 flex items-center justify-center mr-1.5 sm:mr-2 transition-all">
            <svg className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <span className="text-xs sm:text-sm md:text-base font-medium">Etkinliklere Dön</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
            {/* Event Hero */}
            <div className="relative rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden shadow-2xl">
              {/* Poster Image with Overlay */}
              <div className="relative h-48 sm:h-64 md:h-80 lg:h-96">
                {event.poster_image ? (
                  <img 
                    src={event.poster_image} 
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-red-900 via-red-800 to-gray-900 flex items-center justify-center">
                    <svg className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 text-red-500 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
                
                {/* Badges */}
                <div className="absolute top-2 sm:top-3 md:top-4 lg:top-6 left-2 sm:left-3 md:left-4 lg:left-6 right-2 sm:right-3 md:right-4 lg:right-6 flex items-center justify-between">
                  <span className="bg-gradient-to-r from-red-600 to-red-700 text-white text-[10px] sm:text-xs md:text-sm font-semibold px-2 sm:px-2.5 md:px-3 lg:px-4 py-1 sm:py-1.5 md:py-2 rounded-full shadow-lg backdrop-blur-sm">
                    {event.event_type_display}
                  </span>
                  {isAttended && (
                    <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-[10px] sm:text-xs md:text-sm font-semibold px-2 sm:px-2.5 md:px-3 lg:px-4 py-1 sm:py-1.5 md:py-2 rounded-full shadow-lg backdrop-blur-sm flex items-center gap-1 sm:gap-1.5 md:gap-2">
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="hidden sm:inline">Katıldım</span>
                    </span>
                  )}
                </div>

                {/* Title & Description */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6 lg:p-8">
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 md:mb-3 drop-shadow-lg">{event.title}</h1>
                  <p className="text-gray-200 text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed line-clamp-2 sm:line-clamp-3">{event.description}</p>
                </div>
              </div>
            </div>

            {/* Event Info Cards */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
              {/* Date */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 lg:p-6 border border-gray-700 hover:border-red-600 transition-all group">
                <div className="flex items-center mb-1.5 sm:mb-2 md:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3 md:mr-4 group-hover:scale-110 transition-transform">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm">Tarih & Saat</p>
                    <p className="text-white font-semibold text-[10px] sm:text-xs md:text-sm lg:text-base">{formatDate(event.date_time)}</p>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 lg:p-6 border border-gray-700 hover:border-red-600 transition-all group">
                <div className="flex items-center mb-1.5 sm:mb-2 md:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3 md:mr-4 group-hover:scale-110 transition-transform">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm">Konum</p>
                    <p className="text-white font-semibold text-[10px] sm:text-xs md:text-sm lg:text-base">{event.location}</p>
                  </div>
                </div>
              </div>

              {/* Duration */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 lg:p-6 border border-gray-700 hover:border-red-600 transition-all group">
                <div className="flex items-center mb-1.5 sm:mb-2 md:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3 md:mr-4 group-hover:scale-110 transition-transform">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm">Süre</p>
                    <p className="text-white font-semibold text-[10px] sm:text-xs md:text-sm lg:text-base">{event.duration} dakika</p>
                  </div>
                </div>
              </div>

              {/* Points */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 lg:p-6 border border-gray-700 hover:border-yellow-500 transition-all group">
                <div className="flex items-center mb-1.5 sm:mb-2 md:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3 md:mr-4 group-hover:scale-110 transition-transform">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm">Puan Ödülü</p>
                    <p className="text-white font-semibold text-[10px] sm:text-xs md:text-sm lg:text-base">{event.attendance_points} Puan</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Sidebar */}
        <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
          {/* QR Code Display for Admins */}
          {isAdmin && <QRCodeDisplay eventId={id} />}
          
          {/* QR Scan Button for Users */}
          {!isPast && !isAttended && !isAdmin && (
            <div className="bg-gradient-to-br from-red-900 to-gray-900 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-red-800 shadow-xl">
              <div className="text-center mb-3 sm:mb-4 md:mb-5 lg:mb-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-xl sm:rounded-2xl mx-auto mb-2 sm:mb-3 md:mb-4 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-1 sm:mb-2">Yoklama Kaydet</h3>
                <p className="text-gray-300 text-xs sm:text-sm">
                  QR kodu okutarak katılımınızı kaydedin
                </p>
              </div>
              <Link
                to="/qr-scan"
                className="block w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-center py-2.5 sm:py-3 md:py-4 px-4 sm:px-5 md:px-6 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base md:text-lg transition-all shadow-lg hover:shadow-red-600/50 transform hover:scale-105"
              >
                QR Kod Okut
              </Link>
            </div>
          )}

          {/* Attendees */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-700 shadow-xl">
            <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-5 lg:mb-6">
              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white flex items-center gap-1.5 sm:gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Katılımcılar
              </h2>
              <div className="bg-gradient-to-r from-red-600 to-red-700 text-white text-sm sm:text-base md:text-lg font-bold px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full shadow-lg">
                {attendances.length}
              </div>
            </div>
            
            {attendances.length === 0 ? (
              <div className="text-center py-6 sm:py-8 md:py-10 lg:py-12">
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full mx-auto mb-3 sm:mb-4 md:mb-5 lg:mb-6 flex items-center justify-center">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-gray-400 font-semibold text-sm sm:text-base md:text-lg mb-1 sm:mb-2">Henüz katılımcı yok</p>
                <p className="text-gray-500 text-xs sm:text-sm">İlk katılan sen ol! 🎉</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-2.5 md:space-y-3 max-h-[400px] sm:max-h-[450px] md:max-h-[500px] overflow-y-auto custom-scrollbar">
                {attendances.map((attendance, index) => (
                  <div 
                    key={attendance.id} 
                    className="flex items-center justify-between p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-gray-700/50 to-gray-800/50 hover:from-gray-700 hover:to-gray-800 border border-gray-700 hover:border-red-600 transition-all group"
                    style={{ animation: `slideUp 0.3s ease-out ${index * 0.05}s backwards` }}
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                      <div className="relative">
                        {attendance.user.profile_image ? (
                          <img 
                            src={attendance.user.profile_image}
                            alt={attendance.user.full_name}
                            className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full object-cover border-2 sm:border-3 border-gray-600 group-hover:border-red-600 transition-all shadow-lg"
                          />
                        ) : (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center border-2 sm:border-3 border-gray-600 group-hover:border-red-600 transition-all shadow-lg">
                            <span className="text-white font-bold text-xs sm:text-sm md:text-base">
                              {attendance.user.full_name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                        )}
                        <div className="absolute -bottom-0.5 sm:-bottom-1 -right-0.5 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full border-2 border-gray-900 flex items-center justify-center shadow-lg">
                          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-white font-semibold text-xs sm:text-sm md:text-base group-hover:text-red-400 transition-colors">
                          {attendance.user.full_name}
                        </p>
                        <p className="text-gray-400 text-[10px] sm:text-xs flex items-center gap-0.5 sm:gap-1">
                          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          {new Date(attendance.scanned_at).toLocaleString('tr-TR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right bg-gradient-to-br from-yellow-500/20 to-orange-600/20 px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 rounded-lg border border-yellow-500/30">
                      <p className="text-yellow-400 font-bold text-sm sm:text-base md:text-lg">+{attendance.points_earned}</p>
                      <p className="text-yellow-600 text-[10px] sm:text-xs font-semibold">puan</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </Layout>
  );
}
