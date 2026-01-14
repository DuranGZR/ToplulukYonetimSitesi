/**
 * RoomList Component - Sidebar with chat rooms
 * Shows: General chat, Committee chats, Private chats
 */

import React from 'react';

const RoomList = ({ rooms, selectedRoom, onRoomSelect }) => {
  const getRoomIcon = (room) => {
    switch (room.room_type) {
      case 'GENERAL':
        return (
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      case 'COMMITTEE':
        return (
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        );
      case 'PRIVATE':
        // Show other user's profile image
        if (room.other_user?.profile_image) {
          return (
            <img
              src={`http://localhost:8000${room.other_user.profile_image}`}
              alt={room.other_user.full_name}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
            />
          );
        }
        return (
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getRoomName = (room) => {
    if (room.room_type === 'PRIVATE' && room.other_user) {
      return room.other_user.full_name || room.other_user.username;
    }
    return room.name;
  };

  const formatLastMessage = (room) => {
    if (!room.last_message) return 'Henüz mesaj yok';
    
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const message = room.last_message;
    
    // Mesajı gönderen kişinin username'ini al
    const senderUsername = message.sender?.username || message.sender_username || message.sender;
    
    // Kendi mesajımız mı kontrol et
    const isOwnMessage = currentUser.username === senderUsername;
    
    const prefix = isOwnMessage ? 'Sen: ' : `${senderUsername}: `;
    const text = message.message.length > 30 ? message.message.substring(0, 30) + '...' : message.message;
    
    return prefix + text;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins}dk`;
    if (diffHours < 24) return `${diffHours}sa`;
    if (diffDays < 7) return `${diffDays}g`;
    
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const renderRoom = (room) => {
    const isSelected = selectedRoom?.id === room.id;
    const hasUnread = room.unread_count > 0;
    
    return (
      <div
        key={room.id}
        onClick={() => onRoomSelect(room)}
        className={`flex items-center p-2 sm:p-3 mx-1 sm:mx-2 my-0.5 sm:my-1 rounded-lg sm:rounded-xl cursor-pointer transition-all ${
          isSelected ? 'bg-red-600' : 'hover:bg-slate-900'
        }`}
      >
        {/* Room Icon/Avatar */}
        <div className="relative flex-shrink-0">
          {getRoomIcon(room)}
          {hasUnread && (
            <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-[10px] sm:text-xs font-bold">
                {room.unread_count > 9 ? '9+' : room.unread_count}
              </span>
            </div>
          )}
        </div>

        {/* Room Info */}
        <div className="ml-2 sm:ml-3 flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            <h3 className={`text-xs sm:text-sm font-semibold truncate ${isSelected ? 'text-white' : hasUnread ? 'text-white' : 'text-gray-300'}`}>
              {getRoomName(room)}
            </h3>
            {room.last_message && (
              <span className={`text-[10px] sm:text-xs ml-1 sm:ml-2 flex-shrink-0 ${isSelected ? 'text-red-100' : 'text-gray-500'}`}>
                {formatTime(room.last_message.created_at || room.last_message.timestamp)}
              </span>
            )}
          </div>
          <p className={`text-[10px] sm:text-xs md:text-sm truncate ${isSelected ? 'text-red-50' : hasUnread ? 'text-gray-300 font-medium' : 'text-gray-500'}`}>
            {formatLastMessage(room)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* General Chat */}
      {rooms.general && (
        <div className="mb-2 sm:mb-3 md:mb-4">
          <div className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2">
            <h2 className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">🌍 Genel</h2>
          </div>
          {renderRoom(rooms.general)}
        </div>
      )}

      {/* Committee Chats */}
      {rooms.committees && rooms.committees.length > 0 && (
        <div className="mb-2 sm:mb-3 md:mb-4">
          <div className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2">
            <h2 className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">🎯 Komiteler</h2>
          </div>
          {rooms.committees.map(room => renderRoom(room))}
        </div>
      )}

      {/* Private Chats */}
      {rooms.private && rooms.private.length > 0 && (
        <div className="mb-2 sm:mb-3 md:mb-4">
          <div className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2">
            <h2 className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">💬 Özel Mesajlar</h2>
          </div>
          {rooms.private.map(room => renderRoom(room))}
        </div>
      )}

      {/* Empty State */}
      {!rooms.general && rooms.committees.length === 0 && rooms.private.length === 0 && (
        <div className="p-4 sm:p-6 md:p-8 text-center text-slate-400">
          <p className="text-xs sm:text-sm">Henüz sohbetiniz yok</p>
          <p className="text-[10px] sm:text-xs md:text-sm mt-1 sm:mt-2">Yeni sohbet başlatmak için + butonuna tıklayın</p>
        </div>
      )}
    </div>
  );
};

export default RoomList;
