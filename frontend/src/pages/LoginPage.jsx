import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import kulupLogo from '../public/kulüp360.png'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const result = await login(username, password)
    
    if (result.success) {
      navigate('/dashboard')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden flex items-center justify-center px-4 font-inter">
      {/* Background Floating Orbs */}
      <div className="orb orb-red-1 top-[10%] left-[-10%] opacity-60" />
      <div className="orb orb-red-2 bottom-[10%] right-[-10%] opacity-50" />

      {/* Form Container */}
      <div className="relative z-10 w-full max-w-md">
        <div className="premium-glass-card p-8 md:p-10 rounded-3xl border border-white/5 shadow-2xl">
          
          {/* Logo / Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img 
                src={kulupLogo} 
                alt="Kulüp360 Logo" 
                className="h-12 w-auto object-contain brightness-0 invert" 
              />
            </div>
            <p className="text-xs text-red-500 uppercase tracking-widest font-semibold font-clash">
              Topluluk Yönetim Platformu
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Username Input */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider font-clash">
                Kullanıcı Adı
              </label>
              <input
                type="text"
                className="w-full bg-black/40 border border-white/5 focus:border-red-500/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-all duration-300 focus:ring-2 focus:ring-red-500/10 placeholder-gray-600"
                placeholder="Kullanıcı adınızı girin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider font-clash">
                Şifre
              </label>
              <input
                type="password"
                className="w-full bg-black/40 border border-white/5 focus:border-red-500/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-all duration-300 focus:ring-2 focus:ring-red-500/10 placeholder-gray-600"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-red-900/10 transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Giriş yapılıyor...
                </span>
              ) : (
                'Giriş Yap'
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}
