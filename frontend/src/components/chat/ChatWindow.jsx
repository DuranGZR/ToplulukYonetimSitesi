/**
 * ChatWindow Component - Main chat interface
 * Handles: Message display, real-time updates, typing indicators
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { chatService } from '../../services/chat';
import { chatAPI } from '../../services/chatAPI';
import { BACKEND_URL } from '../../config';

const ChatWindow = ({ room, onBack }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const callbacksRef = useRef(null);
  const previousUserIdRef = useRef(null);

  useEffect(() => {
    loadMessages();
    connectWebSocket();
    
    return () => {
      if (callbacksRef.current) {
        chatService.disconnectRoom(room.id, callbacksRef.current);
      }
    };
  }, [room.id]);

  // Kullanıcı değiştiğinde WebSocket'i yeniden bağla ve mesajları yeniden yükle
  useEffect(() => {
    if (user && user.id) {
      if (previousUserIdRef.current !== null && previousUserIdRef.current !== user.id) {
        // Kullanıcı değişti, WebSocket'i yeniden bağla
        console.log('👤 User changed, reconnecting WebSocket...');
        if (callbacksRef.current) {
          chatService.disconnectRoom(room.id, callbacksRef.current);
        }
        // Kısa bir gecikme ile yeniden bağlan (eski bağlantının kapanması için)
        setTimeout(() => {
          loadMessages(); // Mesajları yeniden yükle
          connectWebSocket();
        }, 100);
      }
      previousUserIdRef.current = user.id;
    }
  }, [user?.id, room.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await chatAPI.getRoomMessages(room.id);
      setMessages(data.results || []);
      
      // Mark room as read
      await chatAPI.markRoomRead(room.id);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = useCallback(() => {
    console.log('🔌 Connecting to WebSocket for room:', room.id);
    
    const callbacks = {
      onMessage: (message) => {
        console.log('📨 New message received:', message);
        
        setMessages(prev => {
          // Duplicate detection: ID + Timestamp + Sender kombinasyonu
          const isDuplicate = prev.find(m => {
            // Aynı ID varsa kesinlikle duplicate
            if (m.id === message.id) return true;
            
            // ID yoksa timestamp + sender + message ile kontrol et
            if (!m.id || !message.id) {
              const sameTime = Math.abs(new Date(m.timestamp) - new Date(message.timestamp)) < 1000;
              const sameSender = m.sender_id === message.sender_id;
              const sameMessage = m.message === message.message;
              return sameTime && sameSender && sameMessage;
            }
            
            return false;
          });
          
          if (isDuplicate) {
            console.log('⚠️ Duplicate message detected, skipping');
            return prev;
          }
          
          // Geçici mesajı bul (aynı içerik ve _temp flag'i olan)
          // Sender ID kontrolünü kaldırdık çünkü WebSocket'ten gelen mesajda sender doğru olmalı
          const tempIndex = prev.findIndex(m => 
            m._temp && 
            m.message === message.message &&
            Math.abs(new Date(m.timestamp) - new Date(message.timestamp)) < 5000 // 5 saniye içinde
          );
          
          if (tempIndex !== -1) {
            // Geçici mesajı gerçek mesajla değiştir
            console.log('🔄 Replacing temp message with real message', {
              temp: prev[tempIndex],
              real: message
            });
            const updated = [...prev];
            updated[tempIndex] = message;
            return updated;
          }
          
          // Yeni mesaj, ekle
          console.log('✅ Adding new message');
          return [...prev, message];
        });
        
        // Mesajı okundu olarak işaretle (başka kullanıcının mesajıysa)
        if (user && Number(message.sender_id) !== Number(user.id)) {
          chatAPI.markRoomRead(room.id).then(() => {
            // Trigger room list refresh to update unread count
            window.dispatchEvent(new CustomEvent('chatRoomRead', { detail: { roomId: room.id } }));
          }).catch(err => 
            console.error('Error marking room as read:', err)
          );
        }
      },
      onTyping: (userId, username, isTyping) => {
        console.log('⌨️ Typing indicator:', username, isTyping);
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (isTyping) {
            newSet.add(username);
          } else {
            newSet.delete(username);
          }
          return newSet;
        });
      },
      onUserJoined: (user) => {
        console.log('👋 User joined:', user);
        setOnlineUsers(prev => {
          if (!prev.find(u => u.id === user.id)) {
            return [...prev, user];
          }
          return prev;
        });
      },
      onUserLeft: (userId) => {
        console.log('👋 User left:', userId);
        setOnlineUsers(prev => prev.filter(u => u.id !== userId));
      }
    };
    
    callbacksRef.current = callbacks;
    chatService.connectRoom(room.id, callbacks);
    
    // Get initial online users
    setTimeout(() => {
      chatService.getOnlineMembers(room.id);
    }, 500);
  }, [room.id]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    console.log('📤 Sending message:', newMessage.trim());
    const sent = chatService.sendMessage(room.id, newMessage.trim());
    
    if (!sent) {
      console.error('❌ WebSocket not connected! Cannot send message.');
      alert('Bağlantı sorunu! Sayfayı yenileyin.');
      return;
    }
    
    // Mesajı hemen göster (optimistic update)
    if (!user) return;
    const tempMessage = {
      id: Date.now(), // Geçici ID
      sender_id: user.id,
      sender_username: user.username,
      sender_full_name: user.full_name || user.username,
      sender_profile_image: user.profile_image,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      _temp: true // Geçici mesaj işareti
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    
    // Stop typing indicator
    chatService.sendTyping(room.id, false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    // Send typing indicator
    chatService.sendTyping(room.id, true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      chatService.sendTyping(room.id, false);
    }, 3000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getRoomTitle = () => {
    if (room.room_type === 'PRIVATE' && room.other_user) {
      return room.other_user.full_name || room.other_user.username;
    }
    return room.name;
  };

  const getRoomSubtitle = () => {
    if (room.room_type === 'GENERAL') {
      return `${onlineUsers.length} kişi aktif`;
    }
    if (room.room_type === 'COMMITTEE') {
      return `${onlineUsers.length} üye aktif`;
    }
    if (room.room_type === 'PRIVATE' && room.other_user) {
      const isOnline = onlineUsers.find(u => u.id === room.other_user.id);
      return isOnline ? 'Çevrimiçi' : 'Çevrimdışı';
    }
    return '';
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    
    messages.forEach(msg => {
      if (!msg.timestamp) return;
      const date = new Date(msg.timestamp);
      if (isNaN(date.getTime())) return;
      
      const dateStr = date.toLocaleDateString('tr-TR');
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(msg);
    });
    
    return groups;
  };

  const renderMessages = () => {
    const grouped = groupMessagesByDate(messages);
    
    if (!user) return null;
    
    console.log('🔍 Current user ID:', user.id, 'Type:', typeof user.id);
    
    return Object.entries(grouped).map(([date, msgs]) => (
      <div key={date}>
        {/* Date Separator */}
        <div className="flex items-center justify-center my-2 sm:my-3 md:my-4">
          <div className="bg-slate-900 text-slate-400 text-[10px] sm:text-xs px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 rounded-lg sm:rounded-xl shadow-lg border border-slate-800">
            {date}
          </div>
        </div>
        
        {/* Messages */}
        {msgs.map((msg, idx) => {
          console.log('💬 Message:', msg.id, 'Sender ID:', msg.sender_id, 'Type:', typeof msg.sender_id);
          const isOwnMessage = Number(msg.sender_id) === Number(user.id);
          const showAvatar = idx === 0 || msgs[idx - 1].sender_id !== msg.sender_id;
          
          return (
            <div
              key={msg.id}
              className={`flex items-end mb-1.5 sm:mb-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              {!isOwnMessage && showAvatar && (
                <img
                  src={msg.sender_profile_image ? `${BACKEND_URL}${msg.sender_profile_image}` : '/default-avatar.png'}
                  alt={msg.sender_full_name}
                  className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full mr-1.5 sm:mr-2"
                />
              )}
              {!isOwnMessage && !showAvatar && <div className="w-6 sm:w-7 md:w-8 mr-1.5 sm:mr-2" />}
              
              <div className={`max-w-[75%] sm:max-w-xs md:max-w-sm lg:max-w-md ${isOwnMessage ? 'ml-auto' : ''}`}>
                {!isOwnMessage && showAvatar && (
                  <div className="text-[10px] sm:text-xs text-slate-400 mb-0.5 sm:mb-1 ml-1">
                    {msg.sender_full_name}
                  </div>
                )}
                
                <div
                  className={`rounded-xl sm:rounded-2xl px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 shadow-lg ${
                    isOwnMessage
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-red-500/20'
                      : 'bg-slate-800 text-slate-100 border border-slate-700'
                  }`}
                >
                  <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                  <div className={`text-[10px] sm:text-xs mt-0.5 sm:mt-1 ${isOwnMessage ? 'text-red-100' : 'text-slate-400'}`}>
                    {formatMessageTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    ));
  };

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <div className="bg-black border-b border-slate-800 p-2 sm:p-3 md:p-4">
        <div className="flex items-center">
          {/* Back Button (Mobile) */}
          <button
            onClick={onBack}
            className="mr-2 sm:mr-3 p-1.5 sm:p-2 hover:bg-slate-700 rounded-lg lg:hidden transition-all"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* Room Info */}
          <div className="flex-1">
            <h2 className="text-sm sm:text-base md:text-lg font-semibold text-white">{getRoomTitle()}</h2>
            <p className="text-[10px] sm:text-xs md:text-sm text-slate-400">{getRoomSubtitle()}</p>
          </div>
          
          {/* Room Actions */}
          <button className="p-1.5 sm:p-2 hover:bg-slate-700 rounded-lg transition-all">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 bg-black">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-white">Henüz mesaj yok</p>
              <p className="text-sm mt-1">İlk mesajı sen gönder!</p>
            </div>
          </div>
        ) : (
          <>
            {renderMessages()}
            <div ref={messagesEndRef} />
          </>
        )}
        
        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <div className="flex items-center text-gray-400 text-[10px] sm:text-xs md:text-sm mt-1.5 sm:mt-2">
            <div className="flex space-x-0.5 sm:space-x-1 mr-1.5 sm:mr-2">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span>{Array.from(typingUsers).join(', ')} yazıyor...</span>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="bg-black border-t border-slate-800 p-2 sm:p-3 md:p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2 sm:space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Mesaj yaz..."
            className="flex-1 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 bg-slate-900 border border-slate-800 rounded-lg sm:rounded-xl focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 text-white text-xs sm:text-sm md:text-base placeholder-slate-400 transition-all"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-2 sm:p-2.5 md:p-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg sm:rounded-xl disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed transition-all hover:scale-105 disabled:hover:scale-100 shadow-lg"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
