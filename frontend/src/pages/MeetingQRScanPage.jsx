import { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';

export default function MeetingQRScanPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);

  const handleScan = async (result) => {
    if (!result || processing) return;

    try {
      setProcessing(true);
      setScanning(false);

      const scannedData = result[0]?.rawValue;
      if (!scannedData) {
        throw new Error('QR kod okunamadı');
      }

      // Toplantı QR kodunu tarama
      const response = await api.post(`/meetings/${id}/scan_qr/`, {
        qr_data: scannedData
      });

      toast.success(response.data.message);
      
      // Kullanıcı bilgilerini güncelle (puan güncellemesi için)
      try {
        const userRes = await api.get('/users/me/');
        setUser(userRes.data);
        localStorage.setItem('user', JSON.stringify(userRes.data));
      } catch (err) {
        console.error('Kullanıcı bilgileri güncellenemedi:', err);
      }
      
      // 2 saniye bekle ve toplantıya yönlendir
      setTimeout(() => {
        navigate(`/meetings/${id}`);
      }, 2000);

    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'QR kod tarama başarısız';
      toast.error(errorMsg);
      setProcessing(false);
      setScanning(true);
    }
  };

  const handleError = (error) => {
    console.error('QR Scanner error:', error);
    toast.error('Kamera erişimi başarısız');
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">QR Kod Okut</h1>
          <p className="text-gray-400">Toplantı yoklaması için QR kodu okutun</p>
        </div>

        {/* Scanner */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden relative">
          {processing ? (
            <div className="aspect-square flex flex-col items-center justify-center p-8">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-red-400 border-t-transparent rounded-full animate-ping opacity-20"></div>
              </div>
              <p className="text-white font-semibold mt-4">İşleniyor...</p>
              <p className="text-gray-400 text-sm mt-2">Yoklama kaydediliyor</p>
            </div>
          ) : scanning ? (
            <div className="relative aspect-square">
              <Scanner
                onScan={handleScan}
                onError={handleError}
                constraints={{
                  facingMode: 'environment'
                }}
                styles={{
                  container: {
                    width: '100%',
                    height: '100%',
                    position: 'relative'
                  },
                  video: {
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }
                }}
              />
              
              {/* Scanning Overlay - Düzgün merkezi tarama alanı */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* Dışarıdaki koyu overlay */}
                <div className="absolute inset-0 bg-black/60"></div>
                
                {/* Merkezi tarama kutusu */}
                <div className="relative w-64 h-64">
                  {/* Üst sol köşe */}
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-red-600 rounded-tl-lg"></div>
                  {/* Üst sağ köşe */}
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-red-600 rounded-tr-lg"></div>
                  {/* Alt sol köşe */}
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-red-600 rounded-bl-lg"></div>
                  {/* Alt sağ köşe */}
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-red-600 rounded-br-lg"></div>
                  
                  {/* İç kare - şeffaf alan */}
                  <div className="w-full h-full border-2 border-red-600 rounded-lg"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="aspect-square flex items-center justify-center p-8">
              <div className="text-center">
                <svg className="w-20 h-20 text-green-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-white font-semibold">QR Kod Okundu!</p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-bold text-white mb-3">Nasıl Kullanılır?</h3>
          <ol className="space-y-2 text-gray-400 text-sm">
            <li className="flex items-start">
              <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">1</span>
              <span>Kamera izni verin</span>
            </li>
            <li className="flex items-start">
              <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">2</span>
              <span>Toplantı QR kodunu ekranın ortasına hizalayın</span>
            </li>
            <li className="flex items-start">
              <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">3</span>
              <span>QR kod otomatik olarak okunacak ve yoklama kaydedilecek</span>
            </li>
          </ol>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate(`/meetings/${id}`)}
          className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 px-6 rounded-xl transition-all"
        >
          Toplantıya Dön
        </button>
      </div>
    </Layout>
  );
}

