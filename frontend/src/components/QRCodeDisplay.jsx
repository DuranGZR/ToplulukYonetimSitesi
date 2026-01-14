import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function QRCodeDisplay({ eventId }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchEvent();
    
    // Her 30 saniyede bir otomatik güncelle (QR süre kontrolü için)
    const interval = setInterval(() => {
      fetchEvent();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/events/${eventId}/`);
      setEvent(response.data);
    } catch (error) {
      console.error('Etkinlik yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async () => {
    try {
      setGenerating(true);
      const response = await api.post(`/events/${eventId}/generate_qr/`);
      toast.success(response.data.message || 'QR kod oluşturuldu');
      setEvent(response.data.event);
    } catch (error) {
      toast.error(error.response?.data?.error || 'QR kod oluşturulamadı');
    } finally {
      setGenerating(false);
    }
  };

  const isQRValid = () => {
    if (!event || !event.qr_expires_at) return false;
    return new Date(event.qr_expires_at) > new Date();
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
        <p className="text-gray-400 mt-4">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <h3 className="text-xl font-bold text-white mb-4">QR Kod Yoklama</h3>
      
      {event && event.qr_code && isQRValid() ? (
        <div className="space-y-4">
          {/* QR Code Display */}
          <div className="bg-white p-4 rounded-xl mx-auto w-fit">
            <img 
              src={event.qr_code} 
              alt="Event QR Code"
              className="w-64 h-64 object-contain"
            />
          </div>
          
          {/* Info */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Geçerlilik Süresi:</span>
              <span className="text-white">
                {new Date(event.qr_expires_at).toLocaleString('tr-TR', {
                  day: '2-digit',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Durum:</span>
              <span className="text-green-500 font-semibold">✓ Aktif</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-all"
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Yazdır
            </button>
            <button
              onClick={generateQRCode}
              disabled={generating}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-all"
            >
              🔄 Yenile
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-gray-800 rounded-full mx-auto flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          
          {event && event.qr_expires_at && !isQRValid() ? (
            <>
              <p className="text-gray-400">QR kod süresi dolmuş</p>
              <p className="text-sm text-gray-500">
                Son geçerlilik: {new Date(event.qr_expires_at).toLocaleString('tr-TR')}
              </p>
            </>
          ) : (
            <p className="text-gray-400">Henüz QR kod oluşturulmamış</p>
          )}
          
          <p className="text-sm text-gray-500">
            QR kod oluşturmak için butona tıklayın
          </p>

          <button
            onClick={generateQRCode}
            disabled={generating}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-gray-700 disabled:to-gray-700 text-white py-3 px-6 rounded-lg font-semibold transition-all shadow-lg"
          >
            {generating ? (
              <>
                <div className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Oluşturuluyor...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                QR Kod Oluştur
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
