import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import GlobalSearch from './GlobalSearch'
import NotificationDropdown from './NotificationDropdown'
import hsdLogo from '../public/hsd-logo.png'

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <nav className="bg-black border-b border-gray-800 fixed top-0 left-0 right-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Menu Button */}
          <div className="flex items-center space-x-3">
            {/* Mobile Menu Button */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <Link to="/dashboard" className="flex items-center">
              <img src={hsdLogo} alt="HSD İnönü Logo" className="h-8 w-auto object-contain" />
            </Link>
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <GlobalSearch />

            {/* Chat */}
            <Link 
              to="/chat" 
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              title="Sohbetler"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </Link>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <NotificationDropdown 
                isOpen={showNotifications} 
                onClose={() => setShowNotifications(false)} 
              />
            </div>

            {/* Star Badge */}
            {user?.star_count > 0 && (
              <div className="hidden md:flex items-center space-x-3 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 px-4 py-2 rounded-lg border border-yellow-600/30">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">
                    {user.star_count >= 10 ? '✨' : 
                     user.star_count >= 5 ? '💫' : 
                     user.star_count >= 3 ? '🌟' : '⭐'}
                  </span>
                  <span className="text-sm font-bold text-yellow-500">{user.star_count}x</span>
                </div>
              </div>
            )}

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-white">{user?.full_name}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
              
              <button
                onClick={handleLogout}
                className="bg-gray-900 hover:bg-red-600 text-white border border-gray-800 hover:border-red-600 text-sm py-2 px-4 rounded-lg transition-all"
              >
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
