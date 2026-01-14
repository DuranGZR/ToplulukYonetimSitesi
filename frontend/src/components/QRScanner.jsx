import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRScanner({ onScanSuccess }) {
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      setIsScanning(true);
      setError(null);

      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          stopScanner();
          onScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Scanning errors are normal, ignore them
        }
      );
    } catch (err) {
      console.error('QR Scanner başlatılamadı:', err);
      setError('Kamera erişimi reddedildi veya kamera bulunamadı');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error('Scanner durdurulamadı:', err);
      }
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-4">
      {error ? (
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={startScanner}
            className="mt-2 text-red-500 hover:text-red-400 text-sm font-medium"
          >
            Tekrar Dene
          </button>
        </div>
      ) : (
        <>
          <div id="qr-reader" className="rounded-lg overflow-hidden"></div>
          <p className="text-gray-400 text-sm text-center">
            QR kodu kameranın önüne tutun
          </p>
        </>
      )}
    </div>
  );
}
