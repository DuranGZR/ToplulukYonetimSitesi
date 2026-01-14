import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function ModerationPanel() {
  const [pendingContent, setPendingContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('events');
  const [reports, setReports] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports();
    } else {
      fetchPendingContent();
    }
  }, [activeTab]);

  const fetchPendingContent = async () => {
    try {
      setLoading(true);
      let endpoint = '';
      
      switch(activeTab) {
        case 'events':
          endpoint = '/events/?approval_status=PENDING';
          break;
        case 'tasks':
          // Görevler için hem PENDING hem de IPTAL durumundaki görevleri getir
          endpoint = '/tasks/';
          break;
        case 'projects':
          endpoint = '/projects/?approval_status=PENDING';
          break;
        default:
          endpoint = '/events/?approval_status=PENDING';
      }
      
      const response = await api.get(endpoint);
      console.log('Moderation Panel - Endpoint:', endpoint);
      console.log('Moderation Panel - Response:', response.data);
      const allData = Array.isArray(response.data) ? response.data : response.data.results || [];
      console.log('Moderation Panel - All Data:', allData);
      
      // Görevler için hem PENDING hem de IPTAL durumundaki görevleri filtrele
      let filtered = [];
      if (activeTab === 'tasks') {
        filtered = allData.filter(item => 
          item.approval_status === 'PENDING' || item.status === 'IPTAL'
        );
      } else {
        // Diğerleri için sadece PENDING
        filtered = allData.filter(item => item.approval_status === 'PENDING');
      }
      
      console.log('Moderation Panel - Filtered Items:', filtered);
      setPendingContent(filtered);
    } catch (error) {
      console.error('İçerikler yüklenemedi:', error);
      toast.error('İçerikler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/moderation/reports/pending/');
      setReports(Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (error) {
      console.error('Raporlar yüklenemedi:', error);
      toast.error('Raporlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewReport = async (reportId, status, adminNotes) => {
    try {
      await api.post(`/moderation/reports/${reportId}/review/`, {
        status,
        admin_notes: adminNotes
      });
      toast.success('Rapor incelendi');
      setShowReviewModal(false);
      fetchReports();
    } catch (error) {
      toast.error('Rapor incelenemedi');
    }
  };

  const handleApprove = async (id, type) => {
    try {
      let endpoint = '';
      
      switch(type) {
        case 'event':
          endpoint = `/events/${id}/approve/`;
          break;
        case 'task':
          endpoint = `/tasks/${id}/approve/`;
          break;
        case 'project':
          endpoint = `/projects/${id}/approve/`;
          break;
      }
      
      await api.post(endpoint);
      toast.success('İçerik onaylandı');
      fetchPendingContent();
    } catch (error) {
      console.error('Onaylama hatası:', error);
      toast.error(error.response?.data?.error || 'İçerik onaylanamadı');
    }
  };

  const handleReactivate = async (id, type) => {
    try {
      let endpoint = '';
      
      switch(type) {
        case 'task':
          endpoint = `/tasks/${id}/reactivate/`;
          break;
        default:
          toast.error('Bu içerik türü için tekrar yayınlama desteklenmiyor');
          return;
      }
      
      await api.post(endpoint);
      toast.success('Görev tekrar yayınlandı ve görev havuzunda görünüyor');
      fetchPendingContent();
    } catch (error) {
      console.error('Tekrar yayınlama hatası:', error);
      toast.error(error.response?.data?.error || 'Görev tekrar yayınlanamadı');
    }
  };

  const handleReject = async (id, type) => {
    const reason = prompt('Red nedeni (isteğe bağlı):');
    if (reason === null) return; // Cancel edildi
    
    try {
      let endpoint = '';
      
      switch(type) {
        case 'event':
          endpoint = `/events/${id}/reject/`;
          break;
        case 'task':
          endpoint = `/tasks/${id}/reject/`;
          break;
        case 'project':
          endpoint = `/projects/${id}/reject/`;
          break;
      }
      
      await api.post(endpoint, { reason });
      toast.success('İçerik reddedildi');
      fetchPendingContent();
    } catch (error) {
      console.error('Reddetme hatası:', error);
      toast.error(error.response?.data?.error || 'İçerik reddedilemedi');
    }
  };

  const getContentType = () => {
    switch(activeTab) {
      case 'events':
        return 'event';
      case 'tasks':
        return 'task';
      case 'projects':
        return 'project';
      default:
        return 'event';
    }
  };

  const fetchItemDetails = async (id, type) => {
    try {
      setDetailLoading(true);
      let endpoint = '';
      
      switch(type) {
        case 'task':
          endpoint = `/tasks/${id}/`;
          break;
        case 'project':
          endpoint = `/projects/${id}/`;
          break;
        case 'event':
          endpoint = `/events/${id}/`;
          break;
        default:
          return;
      }
      
      const response = await api.get(endpoint);
      setSelectedItem(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Detaylar yüklenemedi:', error);
      toast.error('Detaylar yüklenirken hata oluştu');
    } finally {
      setDetailLoading(false);
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

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-2 bg-gray-900 p-2 rounded-xl border border-gray-800">
        <button
          onClick={() => setActiveTab('events')}
          className={`flex-1 py-2 px-4 rounded-lg transition-all ${
            activeTab === 'events'
              ? 'bg-red-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          Etkinlikler
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 py-2 px-4 rounded-lg transition-all ${
            activeTab === 'tasks'
              ? 'bg-red-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          Görevler
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex-1 py-2 px-4 rounded-lg transition-all ${
            activeTab === 'projects'
              ? 'bg-red-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          Projeler
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 py-2 px-4 rounded-lg transition-all ${
            activeTab === 'reports'
              ? 'bg-red-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          Raporlar
        </button>
      </div>

      {/* Content List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      ) : activeTab === 'reports' ? (
        reports.length === 0 ? (
          <div className="bg-gray-900 rounded-xl p-12 border border-gray-800 text-center">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-bold text-gray-300 mb-2">Bekleyen Rapor Yok</h3>
            <p className="text-gray-500">Tüm raporlar incelenmiş durumda</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                        {report.report_type}
                      </span>
                      <span className="text-gray-500 text-sm ml-3">
                        {new Date(report.created_at).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-white mb-2">
                      Raporlayan: {report.reporter?.full_name || report.reporter?.username}
                    </h3>
                    <h4 className="text-md text-gray-300 mb-3">
                      Bildirilen: {report.reported_user?.full_name || report.reported_user?.username}
                    </h4>
                    
                    <p className="text-gray-400 text-sm mb-4">{report.description}</p>
                    
                    <div className="flex gap-3 text-sm text-gray-500">
                      <span>Rapor ID: #{report.id}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedReport(report);
                      setShowReviewModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all ml-4"
                  >
                    İncele
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : pendingContent.length === 0 ? (
        <div className="bg-gray-900 rounded-xl p-12 border border-gray-800 text-center">
          <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-bold text-gray-300 mb-2">Onay Bekleyen İçerik Yok</h3>
          <p className="text-gray-500">Tüm içerikler onaylanmış durumda</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingContent.map((item) => (
            <div 
              key={item.id} 
              className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-red-600/50 transition-all cursor-pointer"
              onClick={() => fetchItemDetails(item.id, getContentType())}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">
                    {item.title || item.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {item.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-4 text-sm">
                    {item.date_time && (
                      <div className="flex items-center text-gray-400">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(item.date_time).toLocaleDateString('tr-TR')}
                      </div>
                    )}
                    
                    {item.points && (
                      <div className="flex items-center text-yellow-500">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {item.points} Puan
                      </div>
                    )}
                    
                    {item.created_by && (
                      <div className="flex items-center text-gray-400">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {item.created_by.full_name || item.created_by.username}
                      </div>
                    )}
                    
                    {/* İptal edilen görevler için iptal bilgileri */}
                    {item.status === 'IPTAL' && (
                      <>
                        {item.cancelled_by_name && (
                          <div className="flex items-center text-red-400">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            İptal Eden: {item.cancelled_by_name}
                          </div>
                        )}
                        {item.cancelled_at && (
                          <div className="flex items-center text-gray-500">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {new Date(item.cancelled_at).toLocaleDateString('tr-TR')}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* İptal sebebi */}
                  {item.status === 'IPTAL' && item.cancellation_reason && (
                    <div className="mt-3 p-3 bg-red-900/20 border border-red-800/50 rounded-lg">
                      <p className="text-red-400 text-sm font-semibold mb-1">İptal Sebebi:</p>
                      <p className="text-gray-300 text-sm">{item.cancellation_reason}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                  {/* İptal edilen görevler için "Tekrar Yayınla" butonu */}
                  {item.status === 'IPTAL' && activeTab === 'tasks' ? (
                    <button
                      onClick={() => handleReactivate(item.id, getContentType())}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all flex items-center gap-2"
                      title="Görevi tekrar yayınla"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Tekrar Yayınla
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleApprove(item.id, getContentType())}
                        className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-all"
                        title="Onayla"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleReject(item.id, getContentType())}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-all"
                        title="Reddet"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedItem && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={() => {
            setShowDetailModal(false);
            setSelectedItem(null);
          }}
        >
          <div 
            className="bg-gray-900 rounded-xl p-6 max-w-4xl w-full border border-gray-800 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {detailLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white">
                    {activeTab === 'tasks' ? 'Görev Detayları' : activeTab === 'projects' ? 'Proje Detayları' : 'Etkinlik Detayları'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedItem(null);
                    }}
                    className="text-gray-400 hover:text-white transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Başlık ve Açıklama */}
                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h4 className="text-xl font-bold text-white mb-2">{selectedItem.title || selectedItem.name}</h4>
                    <p className="text-gray-300 whitespace-pre-wrap">{selectedItem.description}</p>
                  </div>

                  {/* Görev Detayları */}
                  {activeTab === 'tasks' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                        <p className="text-gray-400 text-sm mb-1">Kategori</p>
                        <p className="text-white font-semibold">{selectedItem.category_display || selectedItem.category || 'Belirtilmemiş'}</p>
                      </div>
                      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                        <p className="text-gray-400 text-sm mb-1">Zorluk</p>
                        <p className="text-white font-semibold">{selectedItem.difficulty_display || selectedItem.difficulty || 'Belirtilmemiş'}</p>
                      </div>
                      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                        <p className="text-gray-400 text-sm mb-1">Puan Ödülü</p>
                        <p className="text-yellow-400 font-semibold">+{selectedItem.points || 0} Puan</p>
                      </div>
                      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                        <p className="text-gray-400 text-sm mb-1">Durum</p>
                        <p className="text-white font-semibold">{selectedItem.status_display || selectedItem.status || 'Belirtilmemiş'}</p>
                      </div>
                      {selectedItem.committee_name && (
                        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                          <p className="text-gray-400 text-sm mb-1">Komite</p>
                          <p className="text-white font-semibold">{selectedItem.committee_name}</p>
                        </div>
                      )}
                      {selectedItem.created_by_name && (
                        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                          <p className="text-gray-400 text-sm mb-1">Oluşturan</p>
                          <p className="text-white font-semibold">{selectedItem.created_by_name}</p>
                        </div>
                      )}
                      {selectedItem.deadline && (
                        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                          <p className="text-gray-400 text-sm mb-1">Son Tarih</p>
                          <p className="text-white font-semibold">{formatDate(selectedItem.deadline)}</p>
                        </div>
                      )}
                      {selectedItem.status === 'IPTAL' && selectedItem.cancelled_by_name && (
                        <div className="bg-gray-800 rounded-xl p-4 border border-red-700 md:col-span-2">
                          <p className="text-gray-400 text-sm mb-1">İptal Eden</p>
                          <p className="text-red-400 font-semibold">{selectedItem.cancelled_by_name}</p>
                          {selectedItem.cancelled_at && (
                            <p className="text-gray-500 text-xs mt-1">
                              {new Date(selectedItem.cancelled_at).toLocaleDateString('tr-TR', { 
                                day: 'numeric', 
                                month: 'long', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}
                        </div>
                      )}
                      {selectedItem.status === 'IPTAL' && selectedItem.cancellation_reason && (
                        <div className="bg-red-900/20 rounded-xl p-4 border border-red-800/50 md:col-span-2">
                          <p className="text-red-400 text-sm font-semibold mb-2">İptal Sebebi:</p>
                          <p className="text-gray-300 text-sm whitespace-pre-wrap">{selectedItem.cancellation_reason}</p>
                        </div>
                      )}
                      {selectedItem.tags && selectedItem.tags.trim() !== '' && (
                        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 md:col-span-2">
                          <p className="text-gray-400 text-sm mb-2">Etiketler</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedItem.tags.split(',').map((tag, idx) => (
                              <span key={idx} className="bg-red-600/20 text-red-400 text-sm px-3 py-1 rounded-full border border-red-600/30">
                                #{tag.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedItem.requirements && selectedItem.requirements.trim() !== '' && (
                        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 md:col-span-2">
                          <p className="text-gray-400 text-sm mb-2">Gereksinimler</p>
                          <p className="text-gray-300 whitespace-pre-wrap">{selectedItem.requirements}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Proje Detayları */}
                  {activeTab === 'projects' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                        <p className="text-gray-400 text-sm mb-1">Durum</p>
                        <p className="text-white font-semibold">{selectedItem.status_display || selectedItem.status || 'Belirtilmemiş'}</p>
                      </div>
                      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                        <p className="text-gray-400 text-sm mb-1">Öncelik</p>
                        <p className="text-white font-semibold">{selectedItem.priority_display || selectedItem.priority || 'Belirtilmemiş'}</p>
                      </div>
                      {selectedItem.owner_name && (
                        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                          <p className="text-gray-400 text-sm mb-1">Proje Sahibi</p>
                          <p className="text-white font-semibold">{selectedItem.owner_name}</p>
                        </div>
                      )}
                      {selectedItem.committee_name && (
                        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                          <p className="text-gray-400 text-sm mb-1">Komite</p>
                          <p className="text-white font-semibold">{selectedItem.committee_name}</p>
                        </div>
                      )}
                      {selectedItem.team_member_names && selectedItem.team_member_names.length > 0 && (
                        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 md:col-span-2">
                          <p className="text-gray-400 text-sm mb-2">Takım Üyeleri</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedItem.team_member_names.map((name, idx) => (
                              <span key={idx} className="bg-blue-600/20 text-blue-400 text-sm px-3 py-1 rounded-full border border-blue-600/30">
                                {name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedItem.start_date && (
                        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                          <p className="text-gray-400 text-sm mb-1">Başlangıç Tarihi</p>
                          <p className="text-white font-semibold">{new Date(selectedItem.start_date).toLocaleDateString('tr-TR')}</p>
                        </div>
                      )}
                      {selectedItem.end_date && (
                        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                          <p className="text-gray-400 text-sm mb-1">Bitiş Tarihi</p>
                          <p className="text-white font-semibold">{new Date(selectedItem.end_date).toLocaleDateString('tr-TR')}</p>
                        </div>
                      )}
                      {selectedItem.deadline && (
                        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                          <p className="text-gray-400 text-sm mb-1">Son Tarih</p>
                          <p className="text-white font-semibold">{new Date(selectedItem.deadline).toLocaleDateString('tr-TR')}</p>
                        </div>
                      )}
                      {selectedItem.tags && selectedItem.tags.trim() !== '' && (
                        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 md:col-span-2">
                          <p className="text-gray-400 text-sm mb-2">Etiketler</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedItem.tags.split(',').map((tag, idx) => (
                              <span key={idx} className="bg-purple-600/20 text-purple-400 text-sm px-3 py-1 rounded-full border border-purple-600/30">
                                #{tag.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedItem.repository_url && (
                        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 md:col-span-2">
                          <p className="text-gray-400 text-sm mb-1">Repository URL</p>
                          <a href={selectedItem.repository_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 break-all">
                            {selectedItem.repository_url}
                          </a>
                        </div>
                      )}
                      {selectedItem.documentation_url && (
                        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 md:col-span-2">
                          <p className="text-gray-400 text-sm mb-1">Dokümantasyon URL</p>
                          <a href={selectedItem.documentation_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 break-all">
                            {selectedItem.documentation_url}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Etkinlik Detayları */}
                  {activeTab === 'events' && selectedItem.date_time && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                        <p className="text-gray-400 text-sm mb-1">Tarih ve Saat</p>
                        <p className="text-white font-semibold">{formatDate(selectedItem.date_time)}</p>
                      </div>
                      {selectedItem.location && (
                        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                          <p className="text-gray-400 text-sm mb-1">Konum</p>
                          <p className="text-white font-semibold">{selectedItem.location}</p>
                        </div>
                      )}
                      {selectedItem.attendance_points && (
                        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                          <p className="text-gray-400 text-sm mb-1">Katılım Puanı</p>
                          <p className="text-yellow-400 font-semibold">+{selectedItem.attendance_points} Puan</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Onay/Red Butonları */}
                  <div className="flex gap-3 pt-4 border-t border-gray-700">
                    <button
                      onClick={() => {
                        handleApprove(selectedItem.id, getContentType());
                        setShowDetailModal(false);
                        setSelectedItem(null);
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold transition-all"
                    >
                      ✓ Onayla
                    </button>
                    <button
                      onClick={() => {
                        handleReject(selectedItem.id, getContentType());
                        setShowDetailModal(false);
                        setSelectedItem(null);
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg font-semibold transition-all"
                    >
                      ✕ Reddet
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        setSelectedItem(null);
                      }}
                      className="bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold transition-all"
                    >
                      Kapat
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedReport && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowReviewModal(false)}
        >
          <div 
            className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full mx-4 border border-gray-800"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-4">Rapor İnceleme</h3>
            
            <div className="space-y-4 mb-6">
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Raporlayan</p>
                <p className="text-white font-semibold">
                  {selectedReport.reporter?.full_name || selectedReport.reporter?.username}
                </p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Bildirilen Kullanıcı</p>
                <p className="text-white font-semibold">
                  {selectedReport.reported_user?.full_name || selectedReport.reported_user?.username}
                </p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Rapor Tipi</p>
                <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                  {selectedReport.report_type}
                </span>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Açıklama</p>
                <p className="text-white">{selectedReport.description}</p>
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">Admin Notları</label>
                <textarea
                  id="admin-notes"
                  rows="3"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="İnceleme notlarınızı girin..."
                ></textarea>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const notes = document.getElementById('admin-notes').value;
                  handleReviewReport(selectedReport.id, 'RESOLVED', notes);
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-all"
              >
                Çözüldü
              </button>
              <button
                onClick={() => {
                  const notes = document.getElementById('admin-notes').value;
                  handleReviewReport(selectedReport.id, 'DISMISSED', notes);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-all"
              >
                Reddedildi
              </button>
              <button
                onClick={() => setShowReviewModal(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-all"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
