import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Keyboard shortcut (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Search function with debounce
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults(null);
      return;
    }

    const debounce = setTimeout(async () => {
      try {
        setLoading(true);
        const response = await api.get(`/search/?q=${encodeURIComponent(query)}`);
        setResults(response.data);
      } catch (error) {
        console.error('Arama hatası:', error);
        toast.error('Arama yapılırken hata oluştu');
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  const handleResultClick = (path) => {
    setIsOpen(false);
    setQuery('');
    setResults(null);
    navigate(path);
  };

  const getResultIcon = (type) => {
    switch (type) {
      case 'user':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'event':
        return (
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'task':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'project':
        return (
          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Search Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-all"
      >
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="text-gray-400 text-sm hidden md:inline">Ara...</span>
        <kbd className="hidden md:inline px-2 py-0.5 text-xs bg-gray-700 rounded border border-gray-600 text-gray-400">
          Ctrl K
        </kbd>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-10 sm:pt-20 z-50 p-4">
          <div 
            ref={searchRef}
            className="bg-gray-900 rounded-xl w-full max-w-2xl border border-gray-800 shadow-2xl max-h-[calc(100vh-5rem)] sm:max-h-[calc(100vh-10rem)] overflow-hidden flex flex-col"
          >
            {/* Search Input */}
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Kullanıcı, etkinlik, görev veya proje ara..."
                  className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none"
                />
                {loading && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto">
              {!query && (
                <div className="p-8 text-center">
                  <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-gray-400 text-sm">Aramaya başlamak için yazmaya başlayın</p>
                  <p className="text-gray-600 text-xs mt-2">En az 2 karakter gerekli</p>
                </div>
              )}

              {query && query.length < 2 && (
                <div className="p-8 text-center">
                  <p className="text-gray-400 text-sm">En az 2 karakter girin</p>
                </div>
              )}

              {results && results.total === 0 && (
                <div className="p-8 text-center">
                  <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-400">Sonuç bulunamadı</p>
                  <p className="text-gray-600 text-sm mt-2">"{query}" için eşleşme yok</p>
                </div>
              )}

              {results && results.total > 0 && (
                <div className="p-2">
                  {/* Users */}
                  {results.users.length > 0 && (
                    <div className="mb-4">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Kullanıcılar</div>
                      {results.users.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleResultClick(`/team`)}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-800 rounded-lg transition-all text-left"
                        >
                          {getResultIcon('user')}
                          {user.profile_image ? (
                            <img 
                              src={`http://127.0.0.1:8000${user.profile_image}`}
                              alt={user.full_name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{user.full_name}</p>
                            <p className="text-xs text-gray-500">@{user.username}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Events */}
                  {results.events.length > 0 && (
                    <div className="mb-4">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Etkinlikler</div>
                      {results.events.map((event) => (
                        <button
                          key={event.id}
                          onClick={() => handleResultClick(`/events/${event.id}`)}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-800 rounded-lg transition-all text-left"
                        >
                          {getResultIcon('event')}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{event.title}</p>
                            <p className="text-xs text-gray-500 truncate">{event.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Tasks */}
                  {results.tasks.length > 0 && (
                    <div className="mb-4">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Görevler</div>
                      {results.tasks.map((task) => (
                        <button
                          key={task.id}
                          onClick={() => handleResultClick(`/tasks`)}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-800 rounded-lg transition-all text-left"
                        >
                          {getResultIcon('task')}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{task.title}</p>
                            <p className="text-xs text-gray-500 truncate">{task.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Projects */}
                  {results.projects.length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Projeler</div>
                      {results.projects.map((project) => (
                        <button
                          key={project.id}
                          onClick={() => handleResultClick(`/projects`)}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-800 rounded-lg transition-all text-left"
                        >
                          {getResultIcon('project')}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{project.title}</p>
                            <p className="text-xs text-gray-500 truncate">{project.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-0.5 bg-gray-800 rounded border border-gray-700">↑↓</kbd>
                  Gezin
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-0.5 bg-gray-800 rounded border border-gray-700">Enter</kbd>
                  Seç
                </span>
              </div>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-0.5 bg-gray-800 rounded border border-gray-700">Esc</kbd>
                Kapat
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
