/**
 * CreatePrivateChat Component - Search and create private chats
 */

import React, { useState } from 'react';
import { chatAPI } from '../../services/chatAPI';
import { BACKEND_URL } from '../../config';

const CreatePrivateChat = ({ onClose, onCreateChat }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Otomatik tüm kullanıcıları yükle
  React.useEffect(() => {
    loadAllUsers();
  }, []);

  const loadAllUsers = async () => {
    try {
      setLoading(true);
      const results = await chatAPI.searchUsers(''); // Boş arama = tüm kullanıcılar
      setAllUsers(results);
      setFilteredUsers(results);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Arama yap (local filtering)
  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredUsers(allUsers);
      return;
    }
    
    const lowerQuery = query.toLowerCase();
    const filtered = allUsers.filter(user => 
      user.username.toLowerCase().includes(lowerQuery) ||
      (user.full_name && user.full_name.toLowerCase().includes(lowerQuery)) ||
      (user.email && user.email.toLowerCase().includes(lowerQuery))
    );
    
    setFilteredUsers(filtered);
  };

  const handleSelectUser = (userId) => {
    onCreateChat(userId);
  };

  return (
    <div className="flex flex-col h-full bg-[#0f172a]">
      {/* Header */}
      <div className="border-b border-slate-800 bg-black p-4">
        <div className="flex items-center">
          <button
            onClick={onClose}
            className="mr-3 p-2 hover:bg-slate-700 rounded-lg transition-all"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-white">👤 Yeni Sohbet</h2>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 bg-black">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="İsim veya kullanıcı adı ara..."
            className="w-full px-4 py-3 pl-10 text-white bg-[#0f172a] border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 placeholder-slate-400 transition-all"
            autoFocus
          />
          <svg 
            className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-3.5 text-slate-400 hover:text-red-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <p className="text-sm text-slate-400 mt-2">
          {filteredUsers.length} kullanıcı
        </p>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="ml-3 text-gray-600">Kullanıcılar yükleniyor...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-gray-900">Kullanıcı bulunamadı</p>
              <p className="text-sm mt-1">"{searchQuery}" için sonuç yok</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {filteredUsers.map(user => (
              <div
                key={user.id}
                onClick={() => handleSelectUser(user.id)}
                className="flex items-center p-3 bg-slate-900 hover:bg-gradient-to-r hover:from-red-600/20 hover:to-red-700/20 cursor-pointer transition-all rounded-xl border border-slate-800 hover:border-red-600/50"
              >
                {/* Avatar */}
                <img
                  src={user.profile_image ? `${BACKEND_URL}${user.profile_image}` : '/default-avatar.png'}
                  alt={user.full_name || user.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
                
                {/* User Info */}
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-semibold text-white">
                    {user.full_name || user.username}
                  </h3>
                  <p className="text-sm text-slate-400">@{user.username}</p>
                  {user.committees && user.committees.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {user.committees.slice(0, 2).map(committee => (
                        <span
                          key={committee.id}
                          className="text-xs bg-purple-600/20 text-purple-300 px-2 py-0.5 rounded-lg border border-purple-600/30"
                        >
                          {committee.name}
                        </span>
                      ))}
                      {user.committees.length > 2 && (
                        <span className="text-xs text-slate-400">
                          +{user.committees.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Arrow */}
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePrivateChat;
