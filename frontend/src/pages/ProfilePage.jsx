import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import AvatarUpload from '../components/AvatarUpload'
import api from '../services/api'
import { toast } from 'react-toastify'

export default function ProfilePage() {
  const { user, setUser, refreshUser } = useAuth()
  const [localUser, setLocalUser] = useState(user)
  const [stats, setStats] = useState(null)
  const [recentActivities, setRecentActivities] = useState([])
  const [monthlyHistory, setMonthlyHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showSkillModal, setShowSkillModal] = useState(false)
  const [showEditSkillModal, setShowEditSkillModal] = useState(false)
  const [editingSkill, setEditingSkill] = useState(null)
  const [showSocialLinkModal, setShowSocialLinkModal] = useState(false)
  const [showEditSocialLinkModal, setShowEditSocialLinkModal] = useState(false)
  const [editingSocialLink, setEditingSocialLink] = useState(null)
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    department: user?.department || '',
    grade: user?.grade || ''
  })
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [skillData, setSkillData] = useState({
    name: '',
    proficiency: 3,
    is_learning: false
  })
  const [socialLinkData, setSocialLinkData] = useState({
    platform: 'linkedin',
    title: '',
    url: '',
    order: 0
  })
  
  useEffect(() => {
    fetchProfileData()
  }, [])
  
  const fetchProfileData = async () => {
    try {
      setLoading(true)
      const [statsRes, userRes, historyRes] = await Promise.all([
        api.get('/activity/my-stats/'),
        api.get('/users/me/'),
        api.get('/activity/monthly-history/')
      ])
      
      setStats(statsRes.data)
      setRecentActivities(statsRes.data.recent_activities || [])
      setLocalUser(userRes.data)
      setUser(userRes.data)
      setMonthlyHistory(historyRes.data)
      
      // Form data'yı güncelle
      setFormData({
        first_name: userRes.data.first_name || '',
        last_name: userRes.data.last_name || '',
        email: userRes.data.email || '',
        department: userRes.data.department || '',
        grade: userRes.data.grade || ''
      })
    } catch (error) {
      console.error('Profil verileri yüklenemedi:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    try {
      const response = await api.patch(`/users/${user.id}/`, formData)
      setLocalUser(response.data)
      setUser(response.data)
      localStorage.setItem('user', JSON.stringify(response.data))
      setEditMode(false)
      toast.success('Profil başarıyla güncellendi')
    } catch (error) {
      toast.error('Profil güncellenemedi')
    }
  }
  
  const handleChangePassword = async (e) => {
    e.preventDefault()
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Yeni şifreler eşleşmiyor')
      return
    }
    
    if (passwordData.new_password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalı')
      return
    }
    
    try {
      await api.post('/users/change-password/', {
        old_password: passwordData.old_password,
        new_password: passwordData.new_password
      })
      setShowPasswordModal(false)
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' })
      toast.success('Şifre başarıyla değiştirildi')
    } catch (error) {
      const errorMsg = error.response?.data?.old_password?.[0] || error.response?.data?.error || 'Şifre değiştirilemedi'
      toast.error(errorMsg)
    }
  }
  
  const handleAddSkill = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/users/${user.id}/add_skill/`, skillData)
      await fetchProfileData()
      await refreshUser()
      setShowSkillModal(false)
      setSkillData({ name: '', proficiency: 3, is_learning: false })
      toast.success('Yetenek eklendi')
    } catch (error) {
      toast.error('Yetenek eklenemedi')
    }
  }
  
  const handleEditSkill = (skill) => {
    setEditingSkill(skill)
    setSkillData({
      name: skill.name,
      proficiency: skill.proficiency,
      is_learning: skill.is_learning
    })
    setShowEditSkillModal(true)
  }

  const handleUpdateSkill = async (e) => {
    e.preventDefault()
    try {
      await api.patch(`/users/${user.id}/update_skill/${editingSkill.id}/`, skillData)
      await fetchProfileData()
      await refreshUser()
      setShowEditSkillModal(false)
      setEditingSkill(null)
      setSkillData({ name: '', proficiency: 3, is_learning: false })
      toast.success('Yetenek güncellendi')
    } catch (error) {
      console.error('Skill güncelleme hatası:', error.response?.data || error)
      toast.error('Yetenek güncellenemedi')
    }
  }
  
  const handleDeleteSkill = async (skillId) => {
    if (!confirm('Bu yeteneği silmek istediğinizden emin misiniz?')) return
    
    try {
      await api.delete(`/users/${user.id}/delete_skill/${skillId}/`)
      await fetchProfileData()
      await refreshUser()
      toast.success('Yetenek silindi')
    } catch (error) {
      console.error('Skill silme hatası:', error.response?.data || error)
      toast.error(error.response?.data?.error || 'Yetenek silinemedi')
    }
  }

  const handleAddSocialLink = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/users/${user.id}/add_social_link/`, socialLinkData)
      await fetchProfileData()
      await refreshUser()
      setShowSocialLinkModal(false)
      setSocialLinkData({ platform: 'linkedin', title: '', url: '', order: 0 })
      toast.success('İletişim linki eklendi')
    } catch (error) {
      toast.error('Link eklenemedi')
    }
  }
  
  const handleEditSocialLink = (link) => {
    setEditingSocialLink(link)
    setSocialLinkData({
      platform: link.platform,
      title: link.title,
      url: link.url,
      order: link.order
    })
    setShowEditSocialLinkModal(true)
  }

  const handleUpdateSocialLink = async (e) => {
    e.preventDefault()
    try {
      await api.patch(`/users/${user.id}/update_social_link/${editingSocialLink.id}/`, socialLinkData)
      await fetchProfileData()
      await refreshUser()
      setShowEditSocialLinkModal(false)
      setEditingSocialLink(null)
      setSocialLinkData({ platform: 'linkedin', title: '', url: '', order: 0 })
      toast.success('Link güncellendi')
    } catch (error) {
      console.error('Link güncelleme hatası:', error.response?.data || error)
      toast.error('Link güncellenemedi')
    }
  }
  
  const handleDeleteSocialLink = async (linkId) => {
    if (!confirm('Bu linki silmek istediğinizden emin misiniz?')) return
    
    try {
      await api.delete(`/users/${user.id}/delete_social_link/${linkId}/`)
      await fetchProfileData()
      await refreshUser()
      toast.success('Link silindi')
    } catch (error) {
      console.error('Link silme hatası:', error.response?.data || error)
      toast.error(error.response?.data?.error || 'Link silinemedi')
    }
  }

  // İkon helper fonksiyonu
  const getSocialIcon = (platform) => {
    const icons = {
      linkedin: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      github: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      ),
      twitter: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      instagram: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
      website: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
        </svg>
      ),
      medium: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/>
        </svg>
      ),
      youtube: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      ),
      behance: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M22 7h-7v-2h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14h-8.027c.13 3.211 3.483 3.312 4.588 2.029h3.168zm-7.686-4h4.965c-.105-1.547-1.136-2.219-2.477-2.219-1.466 0-2.277.768-2.488 2.219zm-9.574 6.988h-6.466v-14.967h6.953c5.476.081 5.58 5.444 2.72 6.906 3.461 1.26 3.577 8.061-3.207 8.061zm-3.466-8.988h3.584c2.508 0 2.906-3-.312-3h-3.272v3zm3.391 3h-3.391v3.016h3.341c3.055 0 2.868-3.016.05-3.016z"/>
        </svg>
      ),
      dribbble: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.04 6.4 1.73 1.358 3.92 2.166 6.29 2.166 1.42 0 2.77-.29 4-.814zm-11.62-2.58c.232-.4 3.045-5.055 8.332-6.765.135-.045.27-.084.405-.12-.26-.585-.54-1.167-.832-1.74C7.17 11.775 2.206 11.71 1.756 11.7l-.004.312c0 2.633.998 5.037 2.634 6.855zm-2.42-8.955c.46.008 4.683.026 9.477-1.248-1.698-3.018-3.53-5.558-3.8-5.928-2.868 1.35-5.01 3.99-5.676 7.17zM9.6 2.052c.282.38 2.145 2.914 3.822 6 3.645-1.365 5.19-3.44 5.373-3.702-1.81-1.61-4.19-2.586-6.795-2.586-.825 0-1.63.1-2.4.285zm10.335 3.483c-.218.29-1.935 2.493-5.724 4.04.24.49.47.985.68 1.486.08.18.15.36.22.53 3.41-.43 6.8.26 7.14.33-.02-2.42-.88-4.64-2.31-6.38z"/>
        </svg>
      ),
      other: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
        </svg>
      ),
    }
    return icons[platform] || icons.other
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6 px-2 sm:px-4 pb-4 sm:pb-6" style={{ animation: 'fadeIn 0.5s ease-out' }}>
        {/* Modern Hero Header */}
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-800 via-gray-900 to-black p-3 sm:p-4 md:p-6 lg:p-8 shadow-2xl border border-gray-700">
          <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-red-600 opacity-10 rounded-full -mr-24 sm:-mr-32 md:-mr-40 lg:-mr-48 -mt-24 sm:-mt-32 md:-mt-40 lg:-mt-48"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 bg-red-700 opacity-10 rounded-full -ml-16 sm:-ml-24 md:-ml-28 lg:-ml-32 -mb-16 sm:-mb-24 md:-mb-28 lg:-mb-32"></div>
          
          <div className="relative flex flex-col md:flex-row items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {/* Avatar with Upload */}
            <div className="relative">
              <AvatarUpload 
                currentUser={localUser} 
                onUpdate={(updatedUser) => {
                  setLocalUser(updatedUser)
                  setUser(updatedUser)
                  localStorage.setItem('user', JSON.stringify(updatedUser))
                }}
              />
              {localUser?.star_count > 0 && (
                <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-gradient-to-r from-yellow-500 to-orange-600 text-black font-bold px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm shadow-lg border border-white/50 sm:border-2">
                  {localUser.star_count >= 10 ? '✨' : 
                   localUser.star_count >= 5 ? '💫' : 
                   localUser.star_count >= 3 ? '🌟' : '⭐'} {localUser.star_count}x
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">{localUser?.full_name}</h1>
              <p className="text-gray-400 text-xs sm:text-sm md:text-base lg:text-lg mb-2 sm:mb-3">@{localUser?.username}</p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center md:justify-start">
                <span className="bg-gradient-to-r from-red-600 to-red-700 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-lg">
                  {localUser?.role}
                </span>
                {localUser?.department && (
                  <span className="bg-white/10 backdrop-blur-sm px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold border border-white/20">
                    {localUser?.department}
                  </span>
                )}
                {localUser?.grade && (
                  <span className="bg-white/10 backdrop-blur-sm px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold border border-white/20">
                    {localUser?.grade}. Sınıf
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <div className="rounded-lg sm:rounded-xl bg-gray-900 border border-gray-800 p-3 sm:p-4 md:p-5 lg:p-6 hover:border-red-600 transition-all duration-300">
            <p className="text-xl sm:text-2xl md:text-3xl font-bold mb-0.5 sm:mb-1 text-white">
              {loading ? '...' : (stats?.points_by_source?.reduce((sum, item) => sum + item.total, 0) || 0)}
            </p>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-400">Son 30 Gün Puan</p>
          </div>

          <div className="rounded-lg sm:rounded-xl bg-gray-900 border border-gray-800 p-3 sm:p-4 md:p-5 lg:p-6 hover:border-red-600 transition-all duration-300">
            <p className="text-xl sm:text-2xl md:text-3xl font-bold mb-0.5 sm:mb-1 text-white">
              {loading ? '...' : (recentActivities.filter(a => a.source === 'TASK').length)}
            </p>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-400">Tamamlanan Görev</p>
          </div>

          <div className="rounded-lg sm:rounded-xl bg-gray-900 border border-gray-800 p-3 sm:p-4 md:p-5 lg:p-6 hover:border-red-600 transition-all duration-300">
            <p className="text-xl sm:text-2xl md:text-3xl font-bold mb-0.5 sm:mb-1 text-white">
              {loading ? '...' : (recentActivities.filter(a => a.source === 'EVENT').length)}
            </p>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-400">Katılınan Etkinlik</p>
          </div>

          <div className="rounded-lg sm:rounded-xl bg-gray-900 border border-gray-800 p-3 sm:p-4 md:p-5 lg:p-6 hover:border-red-600 transition-all duration-300">
            <p className="text-xl sm:text-2xl md:text-3xl font-bold mb-0.5 sm:mb-1 text-white">
              {loading ? '...' : (recentActivities.filter(a => a.source === 'PROJECT').length)}
            </p>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-400">Proje Katkısı</p>
          </div>
        </div>

        {/* Star Badge Section */}
        {localUser?.star_count > 0 && (
          <div className="bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-6xl">
                  {localUser.star_count >= 10 ? '✨' : 
                   localUser.star_count >= 5 ? '💫' : 
                   localUser.star_count >= 3 ? '🌟' : '⭐'}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Ayın Parlayan Yıldızı</h3>
                  <p className="text-gray-800 font-semibold">{localUser.star_count}x Kazanan</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monthly History */}
        {monthlyHistory.length > 0 && (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-lg">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">📊</span>
              Aylık Performans Geçmişi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monthlyHistory.map((month) => (
                <div key={month.id} className="bg-gray-700/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-white">{month.month_name}</p>
                    {month.is_winner && <span className="text-2xl">🏆</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Puan:</span>
                    <span className="text-white font-bold">{month.points_earned}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Sıra:</span>
                    <span className="text-white font-bold">#{month.rank}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {/* Personal Info Card */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300" style={{ animation: 'slideUp 0.5s ease-out 0.5s backwards' }}>
            <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-red-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold">Kişisel Bilgiler</h3>
              </div>
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-colors flex items-center gap-1 sm:gap-2"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className="hidden sm:inline">Düzenle</span>
                </button>
              )}
            </div>
            
            {editMode ? (
              <form onSubmit={handleUpdateProfile} className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-gray-400 text-xs sm:text-sm mb-1.5 sm:mb-2">Ad</label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-sm focus:outline-none focus:border-red-600"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs sm:text-sm mb-1.5 sm:mb-2">Soyad</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-sm focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs sm:text-sm mb-1.5 sm:mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs sm:text-sm mb-1.5 sm:mb-2">Bölüm</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    placeholder="Örn: Bilgisayar Mühendisliği"
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs sm:text-sm mb-1.5 sm:mb-2">Sınıf</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({...formData, grade: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-sm focus:outline-none focus:border-red-600"
                  >
                    <option value="">Seçiniz</option>
                    <option value="1">1. Sınıf</option>
                    <option value="2">2. Sınıf</option>
                    <option value="3">3. Sınıf</option>
                    <option value="4">4. Sınıf</option>
                    <option value="5">Mezun</option>
                  </select>
                </div>
                <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-colors"
                  >
                    Kaydet
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false)
                      setFormData({
                        first_name: localUser?.first_name || '',
                        last_name: localUser?.last_name || '',
                        email: localUser?.email || '',
                        department: localUser?.department || '',
                        grade: localUser?.grade || ''
                      })
                    }}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-colors"
                  >
                    İptal
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2 sm:space-y-3 md:space-y-4">
                <div className="flex items-center justify-between p-2 sm:p-2.5 md:p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500">Ad Soyad</p>
                    <p className="font-semibold text-white text-xs sm:text-sm md:text-base">{localUser?.full_name}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 sm:p-2.5 md:p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500">Email</p>
                    <p className="font-semibold text-white text-xs sm:text-sm md:text-base break-all">{localUser?.email}</p>
                  </div>
                </div>
                {localUser?.department && (
                  <div className="flex items-center justify-between p-2 sm:p-2.5 md:p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-500">Bölüm</p>
                      <p className="font-semibold text-white text-xs sm:text-sm md:text-base">{localUser?.department}</p>
                    </div>
                  </div>
                )}
                {localUser?.grade && (
                  <div className="flex items-center justify-between p-2 sm:p-2.5 md:p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-500">Sınıf</p>
                      <p className="font-semibold text-white text-xs sm:text-sm md:text-base">{localUser?.grade}. Sınıf</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between p-2 sm:p-2.5 md:p-3 rounded-lg bg-red-600/20 border border-red-600/30">
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500">Rol</p>
                    <p className="font-semibold text-white text-xs sm:text-sm md:text-base">{localUser?.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg text-xs sm:text-sm md:text-base font-medium transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Şifre Değiştir
                </button>
              </div>
            )}
          </div>

          {/* Skills Card */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300" style={{ animation: 'slideUp 0.5s ease-out 0.6s backwards' }}>
            <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-red-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold">Yetenekler</h3>
              </div>
              <button
                onClick={() => setShowSkillModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-colors flex items-center gap-1 sm:gap-2"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Ekle</span>
              </button>
            </div>
            {localUser?.skills?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                {localUser.skills.map((skill) => (
                  <div
                    key={skill.id}
                    className="group relative bg-gray-800 hover:bg-gray-700 p-2.5 sm:p-3 md:p-4 rounded-lg shadow-lg transition-all border border-gray-700 hover:border-red-600"
                  >
                    <div className="flex items-start justify-between mb-1.5 sm:mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                          <span className="text-white font-bold text-sm sm:text-base md:text-lg">{skill.name}</span>
                          {skill.is_learning && (
                            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                              Öğreniyor
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-sm">Seviye:</span>
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${
                                  i < skill.proficiency
                                    ? 'bg-red-600'
                                    : 'bg-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-red-500 text-sm font-semibold">
                            {skill.proficiency}/5
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditSkill(skill)}
                          className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                          title="Düzenle"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteSkill(skill.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          title="Sil"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className="text-gray-400 mb-2">Henüz yetenek eklenmemiş</p>
                <p className="text-sm text-gray-500 mb-4">Yeteneklerini ekleyerek profilini zenginleştir</p>
                <button
                  onClick={() => setShowSkillModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg text-sm transition-colors"
                >
                  İlk Yeteneğini Ekle
                </button>
              </div>
            )}
          </div>

          {/* Social Links Card */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300" style={{ animation: 'slideUp 0.5s ease-out 0.6s backwards' }}>
            <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold">İletişim Linkleri</h3>
              </div>
              <button
                onClick={() => setShowSocialLinkModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-colors flex items-center gap-1 sm:gap-2"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Ekle</span>
              </button>
            </div>
            
            {localUser?.social_links && localUser.social_links.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {localUser.social_links.map((link) => (
                  <div
                    key={link.id}
                    className="group relative bg-gray-800 hover:bg-gray-700 p-2.5 sm:p-3 md:p-4 rounded-lg shadow-lg transition-all border border-gray-700 hover:border-blue-600"
                  >
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                          <div className="text-blue-500">
                            {getSocialIcon(link.platform)}
                          </div>
                          <span className="text-white font-bold text-sm sm:text-base truncate">{link.title}</span>
                        </div>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm transition-colors truncate block"
                        >
                          {link.url.replace(/(^\w+:|^)\/\//, '').replace(/\/$/, '')}
                        </a>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => handleEditSocialLink(link)}
                          className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                          title="Düzenle"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteSocialLink(link.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          title="Sil"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <p className="text-gray-400 mb-2">Henüz link eklenmemiş</p>
                <p className="text-sm text-gray-500 mb-4">Sosyal medya ve iletişim linklerini ekleyerek profilini zenginleştir</p>
                <button
                  onClick={() => setShowSocialLinkModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm transition-colors"
                >
                  İlk Linkini Ekle
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 border border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300" style={{ animation: 'slideUp 0.5s ease-out 0.7s backwards' }}>
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <h3 className="text-base sm:text-lg md:text-xl font-bold">Son Aktiviteler</h3>
          </div>
          {loading ? (
            <div className="text-center py-6 sm:py-8 md:py-12">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 border-t-2 border-b-2 border-red-600 mx-auto"></div>
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="text-center py-6 sm:py-8 md:py-12">
              <p className="text-gray-400 mb-2 text-xs sm:text-sm md:text-base">Henüz aktivite yok</p>
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-500">Görevlere, etkinliklere ve projelere katılarak aktivite oluşturabilirsin</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {recentActivities.map((activity, index) => (
                <div key={activity.id} className="flex items-start gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 md:p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-all">
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.source === 'TASK' ? 'bg-blue-600' :
                    activity.source === 'EVENT' ? 'bg-green-600' :
                    activity.source === 'PROJECT' ? 'bg-purple-600' :
                    'bg-gray-600'
                  }`}>
                    <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium mb-0.5 sm:mb-1 text-xs sm:text-sm md:text-base">{activity.description}</p>
                    <p className="text-[10px] sm:text-xs text-gray-400">
                      {new Date(activity.created_at).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="bg-yellow-500/10 text-yellow-400 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-bold flex-shrink-0">
                    +{activity.points}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPasswordModal(false)}>
            <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Şifre Değiştir</h3>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Mevcut Şifre</label>
                  <input
                    type="password"
                    required
                    value={passwordData.old_password}
                    onChange={(e) => setPasswordData({...passwordData, old_password: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600"
                    placeholder="Mevcut şifrenizi girin"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Yeni Şifre</label>
                  <input
                    type="password"
                    required
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600"
                    placeholder="En az 6 karakter"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Yeni Şifre (Tekrar)</label>
                  <input
                    type="password"
                    required
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600"
                    placeholder="Yeni şifrenizi tekrar girin"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    Şifreyi Değiştir
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false)
                      setPasswordData({ old_password: '', new_password: '', confirm_password: '' })
                    }}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Add Skill Modal */}
        {showSkillModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSkillModal(false)}>
            <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Yetenek Ekle</h3>
                <button
                  onClick={() => setShowSkillModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleAddSkill} className="space-y-5">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Yetenek Adı *</label>
                  <input
                    type="text"
                    required
                    value={skillData.name}
                    onChange={(e) => setSkillData({...skillData, name: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-red-600"
                    placeholder="Örn: Python, Photoshop, Video Düzenleme"
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-gray-400 text-sm">Seviye *</label>
                    <span className="text-white font-bold text-lg">{skillData.proficiency}/5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={skillData.proficiency}
                    onChange={(e) => setSkillData({...skillData, proficiency: parseInt(e.target.value)})}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${(skillData.proficiency-1)*25}%, #374151 ${(skillData.proficiency-1)*25}%, #374151 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Başlangıç</span>
                    <span>Temel</span>
                    <span>Orta</span>
                    <span>İyi</span>
                    <span>Uzman</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <input
                    type="checkbox"
                    id="is_learning"
                    checked={skillData.is_learning}
                    onChange={(e) => setSkillData({...skillData, is_learning: e.target.checked})}
                    className="w-5 h-5 rounded border-gray-600 text-red-600 focus:ring-red-600"
                  />
                  <label htmlFor="is_learning" className="text-sm text-gray-300 cursor-pointer flex-1">
                    <span className="font-semibold text-white">🎓 Bu yeteneği öğreniyorum</span>
                    <p className="text-xs text-gray-400 mt-0.5">Henüz öğrenme aşamasındaysan işaretle</p>
                  </label>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    Yetenek Ekle
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSkillModal(false)
                      setSkillData({ name: '', proficiency: 3, is_learning: false })
                    }}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Skill Modal */}
        {showEditSkillModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowEditSkillModal(false)}>
            <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Yetenek Düzenle</h3>
                <button
                  onClick={() => {
                    setShowEditSkillModal(false)
                    setEditingSkill(null)
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleUpdateSkill} className="space-y-5">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Yetenek Adı *</label>
                  <input
                    type="text"
                    required
                    value={skillData.name}
                    onChange={(e) => setSkillData({...skillData, name: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-600"
                    placeholder="Örn: Python, Photoshop, Video Düzenleme"
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-gray-400 text-sm">Seviye *</label>
                    <span className="text-white font-bold text-lg">{skillData.proficiency}/5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={skillData.proficiency}
                    onChange={(e) => setSkillData({...skillData, proficiency: parseInt(e.target.value)})}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #2563eb 0%, #2563eb ${(skillData.proficiency-1)*25}%, #374151 ${(skillData.proficiency-1)*25}%, #374151 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Başlangıç</span>
                    <span>Temel</span>
                    <span>Orta</span>
                    <span>İyi</span>
                    <span>Uzman</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <input
                    type="checkbox"
                    id="is_learning_edit"
                    checked={skillData.is_learning}
                    onChange={(e) => setSkillData({...skillData, is_learning: e.target.checked})}
                    className="w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-blue-600"
                  />
                  <label htmlFor="is_learning_edit" className="text-sm text-gray-300 cursor-pointer flex-1">
                    <span className="font-semibold text-white">🎓 Bu yeteneği öğreniyorum</span>
                    <p className="text-xs text-gray-400 mt-0.5">Henüz öğrenme aşamasındaysan işaretle</p>
                  </label>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    Güncelle
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditSkillModal(false)
                      setEditingSkill(null)
                      setSkillData({ name: '', proficiency: 3, is_learning: false })
                    }}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Social Link Modal */}
        {showSocialLinkModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSocialLinkModal(false)}>
            <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">İletişim Linki Ekle</h3>
                <button
                  onClick={() => setShowSocialLinkModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleAddSocialLink} className="space-y-5">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Platform *</label>
                  <select
                    required
                    value={socialLinkData.platform}
                    onChange={(e) => setSocialLinkData({...socialLinkData, platform: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-600"
                  >
                    <option value="linkedin">LinkedIn</option>
                    <option value="github">GitHub</option>
                    <option value="twitter">Twitter/X</option>
                    <option value="instagram">Instagram</option>
                    <option value="website">Kişisel Website</option>
                    <option value="medium">Medium</option>
                    <option value="youtube">YouTube</option>
                    <option value="behance">Behance</option>
                    <option value="dribbble">Dribbble</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Başlık *</label>
                  <input
                    type="text"
                    required
                    value={socialLinkData.title}
                    onChange={(e) => setSocialLinkData({...socialLinkData, title: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-600"
                    placeholder="Örn: LinkedIn Profilim, GitHub Hesabım"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-2">URL *</label>
                  <input
                    type="url"
                    required
                    value={socialLinkData.url}
                    onChange={(e) => setSocialLinkData({...socialLinkData, url: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-600"
                    placeholder="https://"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    Link Ekle
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSocialLinkModal(false)
                      setSocialLinkData({ platform: 'linkedin', title: '', url: '', order: 0 })
                    }}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Social Link Modal */}
        {showEditSocialLinkModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowEditSocialLinkModal(false)}>
            <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Link Düzenle</h3>
                <button
                  onClick={() => {
                    setShowEditSocialLinkModal(false)
                    setEditingSocialLink(null)
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleUpdateSocialLink} className="space-y-5">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Platform *</label>
                  <select
                    required
                    value={socialLinkData.platform}
                    onChange={(e) => setSocialLinkData({...socialLinkData, platform: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-600"
                  >
                    <option value="linkedin">LinkedIn</option>
                    <option value="github">GitHub</option>
                    <option value="twitter">Twitter/X</option>
                    <option value="instagram">Instagram</option>
                    <option value="website">Kişisel Website</option>
                    <option value="medium">Medium</option>
                    <option value="youtube">YouTube</option>
                    <option value="behance">Behance</option>
                    <option value="dribbble">Dribbble</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Başlık *</label>
                  <input
                    type="text"
                    required
                    value={socialLinkData.title}
                    onChange={(e) => setSocialLinkData({...socialLinkData, title: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-600"
                    placeholder="Örn: LinkedIn Profilim, GitHub Hesabım"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-2">URL *</label>
                  <input
                    type="url"
                    required
                    value={socialLinkData.url}
                    onChange={(e) => setSocialLinkData({...socialLinkData, url: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-600"
                    placeholder="https://"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    Güncelle
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditSocialLinkModal(false)
                      setEditingSocialLink(null)
                      setSocialLinkData({ platform: 'linkedin', title: '', url: '', order: 0 })
                    }}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
