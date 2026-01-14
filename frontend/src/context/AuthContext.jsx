import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import { toast } from 'react-toastify'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Sayfa yüklendiğinde localStorage'dan kullanıcıyı al ve API'den güncelle
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('accessToken')
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser))
      // API'den güncel kullanıcı bilgilerini çek
      fetchCurrentUser()
    } else {
      setLoading(false)
    }

    // Multi-tab synchronization - storage event listener
    const handleStorageChange = (e) => {
      // Sadece localStorage değişikliklerini dinle
      if (e.storageArea !== localStorage) return;

      // Token silinmiş - logout
      if (e.key === 'accessToken' && !e.newValue) {
        console.log('🔄 Token removed in another tab - logging out');
        setUser(null);
        setLoading(false);
        toast.info('Başka bir sekmede çıkış yapıldı');
      }

      // Token değişmiş - yeni login
      if (e.key === 'accessToken' && e.newValue && !e.oldValue) {
        console.log('🔄 New token in another tab - logging in');
        const newUser = localStorage.getItem('user');
        if (newUser) {
          setUser(JSON.parse(newUser));
          toast.success('Başka bir sekmede giriş yapıldı');
        }
      }

      // User data güncellenmiş
      if (e.key === 'user' && e.newValue) {
        console.log('🔄 User data updated in another tab');
        setUser(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [])
  
  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/users/me/')
      const updatedUser = response.data
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
    } catch (error) {
      console.error('Kullanıcı bilgileri yüklenemedi:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login/', { username, password })
      const { user, tokens } = response.data

      localStorage.setItem('accessToken', tokens.access)
      localStorage.setItem('refreshToken', tokens.refresh)
      localStorage.setItem('user', JSON.stringify(user))

      setUser(user)
      toast.success(`Hoş geldin, ${user.full_name}!`)
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.non_field_errors?.[0] || 'Giriş başarısız'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      await api.post('/auth/logout/', { refresh: refreshToken })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      setUser(null)
      toast.info('Çıkış yapıldı')
    }
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }
  
  const refreshUser = async () => {
    try {
      const response = await api.get('/users/me/')
      const updatedUser = response.data
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      return updatedUser
    } catch (error) {
      console.error('Kullanıcı bilgileri yenilenemedi:', error)
      return null
    }
  }

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    refreshUser,
    setUser,
    isAuthenticated: !!user,
    isAdmin: user?.is_admin || false,
    isModerator: user?.is_moderator || false,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
