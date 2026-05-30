/**
 * Chat Page - Unified Chat System for HSD Platform
 * WhatsApp-like interface with General, Committee, and Private chats
 */

import React, { useState, useEffect } from 'react';
import { chatAPI } from '../services/chatAPI';
import RoomList from '../components/chat/RoomList';
import ChatWindow from '../components/chat/ChatWindow';
import CreatePrivateChat from '../components/chat/CreatePrivateChat';
import Layout from '../components/Layout';

const ChatPage = () => {
  const [rooms, setRooms] = useState({ general: null, committees: [], private: [] });
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [error, setError] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true); // İlk açılışta sidebar açık

  useEffect(() => {
    loadRooms();

    // Listen for chatRoomRead events to refresh unread counts
    const handleRoomRead = () => {
      loadRooms();
    };

    window.addEventListener('chatRoomRead', handleRoomRead);

    // MobileMenu açıldığında sidebar'ı kapat
    const handleMobileMenuOpen = () => {
      setShowSidebar(false);
    };

    // MobileMenu açıldığında event dinle
    window.addEventListener('mobileMenuOpen', handleMobileMenuOpen);

    return () => {
      window.removeEventListener('chatRoomRead', handleRoomRead);
      window.removeEventListener('mobileMenuOpen', handleMobileMenuOpen);
    };
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await chatAPI.getMyRooms();
      setRooms(data);
      
      // Auto-select General chat sadece desktop'ta ve eğer daha önce bir sohbet seçilmediyse
      // Mobilde ilk açılışta sidebar gösterilsin, sohbet seçilmesin
      if (!selectedRoom && data.general && window.innerWidth >= 640) {
        setSelectedRoom(data.general);
        setShowSidebar(false); // Desktop'ta sohbet seçilince sidebar kapanır
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
      if (error.response?.status === 401) {
        setError('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
      } else {
        setError('Sohbetler yüklenirken hata oluştu: ' + (error.response?.data?.detail || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    setShowNewChat(false);
    setShowSidebar(false); // Mobilde sidebar'ı kapat
  };

  const handleNewPrivateChat = async (userId) => {
    try {
      const room = await chatAPI.createPrivateRoom(userId);
      await loadRooms(); // Refresh room list
      setSelectedRoom(room);
      setShowNewChat(false);
    } catch (error) {
      console.error('Error creating private chat:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Sohbetler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Hata</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/';
            }}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row h-[calc(100vh-8rem)] bg-black rounded-lg sm:rounded-2xl overflow-hidden border border-slate-700">
        {/* Room List Sidebar */}
        <div className={`${showSidebar ? 'flex' : 'hidden'} sm:flex absolute sm:relative z-50 sm:z-auto w-full sm:w-80 bg-black border-r border-slate-800 flex-col h-full sm:h-auto`}>
          {/* Header */}
          <div className="p-2 sm:p-3 md:p-4 border-b border-slate-800 bg-black">
            <div className="flex items-center justify-between">
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-white">💬 Sohbetler</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNewChat(true)}
                  className="p-1.5 sm:p-2 md:p-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg transition-all hover:scale-105 shadow-lg"
                  title="Yeni Sohbet"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                {/* Mobilde kapat butonu */}
                <button
                  onClick={() => setShowSidebar(false)}
                  className="sm:hidden p-1.5 text-white hover:bg-slate-800 rounded-lg transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Room List */}
          <RoomList
            rooms={rooms}
            selectedRoom={selectedRoom}
            onRoomSelect={handleRoomSelect}
          />
        </div>

        {/* Overlay - Mobilde sidebar açıkken */}
        {showSidebar && (
          <div 
            className="sm:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Chat Window */}
        <div className="flex-1 flex flex-col min-w-0">
          {showNewChat ? (
            <CreatePrivateChat
              onClose={() => setShowNewChat(false)}
              onCreateChat={handleNewPrivateChat}
            />
          ) : selectedRoom ? (
            <ChatWindow
              room={selectedRoom}
              onBack={() => {
                setSelectedRoom(null);
                setShowSidebar(true); // Mobilde geri dönünce sidebar'ı göster
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-[#0f172a]">
              <div className="text-center text-slate-400 px-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 bg-gradient-to-br from-red-600 to-red-700 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-2xl shadow-red-500/20">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-base sm:text-lg text-white font-semibold">Bir sohbet seçin</p>
                <p className="text-xs sm:text-sm mt-2 text-slate-400">Mesajlaşmaya başlamak için bir sohbet seçin</p>
                {/* Mobilde sidebar açma butonu */}
                <button
                  onClick={() => setShowSidebar(true)}
                  className="mt-4 sm:hidden bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all text-sm font-semibold"
                >
                  Sohbetleri Göster
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ChatPage;
