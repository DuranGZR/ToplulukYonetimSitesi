import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import ModerationPanel from '../components/ModerationPanel';

export default function AdminPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCommitteeModal, setShowCommitteeModal] = useState(false);
  const [showEditCommitteeModal, setShowEditCommitteeModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showEditMeetingModal, setShowEditMeetingModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedCommittee, setSelectedCommittee] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  
  // Determine active tab from URL
  const getActiveTab = () => {
    if (location.pathname === '/admin/moderation') return 'moderation';
    if (location.pathname === '/admin/committees') return 'committees';
    if (location.pathname === '/admin/events') return 'events';
    if (location.pathname === '/admin/tasks') return 'tasks';
    if (location.pathname === '/admin/projects') return 'projects';
    if (location.pathname === '/admin/meetings') return 'meetings';
    return 'users';
  };
  const activeTab = getActiveTab();
  
  // Safe array to prevent TypeError
  const safeUsers = Array.isArray(users) ? users : [];
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'UYE',
    committee_id: '',
    committee_role: 'member' // 'leader', 'vice_leader', 'member'
  });
  
  const [committeeForm, setCommitteeForm] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchCommittees();
    if (activeTab === 'events') {
      fetchEvents();
    }
    if (activeTab === 'tasks') {
      fetchTasks();
    }
    if (activeTab === 'projects') {
      fetchProjects();
    }
    if (activeTab === 'meetings') {
      fetchMeetings();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/');
      // API response'u array veya {results: []} formatında olabilir
      const usersData = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setUsers(usersData);
    } catch (error) {
      console.error('Kullanıcılar yüklenemedi:', error);
      toast.error('Kullanıcılar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCommittees = async () => {
    try {
      const response = await api.get('/committees/');
      setCommittees(Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (error) {
      console.error('Komiteler yüklenemedi:', error);
      toast.error('Komiteler yüklenirken hata oluştu');
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // Admin panelinde sadece onaylı etkinlikleri göster
      const response = await api.get('/events/?approval_status=APPROVED');
      const eventsData = Array.isArray(response.data) ? response.data : (response.data.results || []);
      // Sadece onaylı etkinlikleri filtrele (null/undefined olanlar da onaylı sayılır)
      const approvedEvents = eventsData.filter(event => 
        !event.approval_status || event.approval_status === 'APPROVED'
      );
      setEvents(approvedEvents);
    } catch (error) {
      console.error('Etkinlikler yüklenemedi:', error);
      toast.error('Etkinlikler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      // Admin panelinde sadece onaylı görevleri göster
      const response = await api.get('/tasks/?approval_status=APPROVED');
      const tasksData = Array.isArray(response.data) ? response.data : (response.data.results || []);
      // Sadece onaylı görevleri filtrele (null/undefined olanlar da onaylı sayılır)
      const approvedTasks = tasksData.filter(task => 
        !task.approval_status || task.approval_status === 'APPROVED'
      );
      setTasks(approvedTasks);
    } catch (error) {
      console.error('Görevler yüklenemedi:', error);
      toast.error('Görevler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      // Admin panelinde sadece onaylı projeleri göster
      const response = await api.get('/projects/?approval_status=APPROVED');
      const projectsData = Array.isArray(response.data) ? response.data : (response.data.results || []);
      // Sadece onaylı projeleri filtrele (null/undefined olanlar da onaylı sayılır)
      const approvedProjects = projectsData.filter(project => 
        !project.approval_status || project.approval_status === 'APPROVED'
      );
      setProjects(approvedProjects);
    } catch (error) {
      console.error('Projeler yüklenemedi:', error);
      toast.error('Projeler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/meetings/');
      const meetingsData = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setMeetings(meetingsData);
    } catch (error) {
      console.error('Toplantılar yüklenemedi:', error);
      toast.error('Toplantılar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const toggleEventActive = async (eventId, currentStatus) => {
    try {
      await api.patch(`/events/${eventId}/`, { is_active: !currentStatus });
      toast.success(`Etkinlik ${!currentStatus ? 'aktif edildi' : 'pasif edildi'}`);
      fetchEvents(); // Listeyi yenile
    } catch (error) {
      console.error('Etkinlik durumu değiştirilemedi:', error);
      toast.error('İşlem başarısız oldu');
    }
  };

  const handleDeleteEvent = async (eventId, eventTitle) => {
    if (!window.confirm(`"${eventTitle}" etkinliğini silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) {
      return;
    }
    
    try {
      await api.delete(`/events/${eventId}/`);
      toast.success('Etkinlik başarıyla silindi');
      fetchEvents(); // Listeyi yenile
    } catch (error) {
      console.error('Etkinlik silinemedi:', error);
      toast.error('Etkinlik silinirken hata oluştu');
    }
  };

  const toggleTaskActive = async (taskId, currentStatus) => {
    try {
      await api.patch(`/tasks/${taskId}/`, { is_active: !currentStatus });
      toast.success(`Görev ${!currentStatus ? 'aktif edildi' : 'pasif edildi'}`);
      fetchTasks(); // Listeyi yenile
    } catch (error) {
      console.error('Görev durumu değiştirilemedi:', error);
      toast.error('İşlem başarısız oldu');
    }
  };

  const handleDeleteTask = async (taskId, taskTitle) => {
    if (!window.confirm(`"${taskTitle}" görevini silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) {
      return;
    }
    
    try {
      await api.delete(`/tasks/${taskId}/`);
      toast.success('Görev başarıyla silindi');
      fetchTasks(); // Listeyi yenile
    } catch (error) {
      console.error('Görev silinemedi:', error);
      toast.error('Görev silinirken hata oluştu');
    }
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setShowEditEventModal(true);
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;

    try {
      const submitData = new FormData();
      submitData.append('title', selectedEvent.title);
      submitData.append('description', selectedEvent.description);
      submitData.append('event_type', selectedEvent.event_type);
      submitData.append('date_time', selectedEvent.date_time);
      submitData.append('location', selectedEvent.location);
      submitData.append('duration', selectedEvent.duration);
      submitData.append('attendance_points', selectedEvent.attendance_points);
      
      if (selectedEvent.poster_image && selectedEvent.poster_image instanceof File) {
        submitData.append('poster_image', selectedEvent.poster_image);
      }

      await api.patch(`/events/${selectedEvent.id}/`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      toast.success('Etkinlik başarıyla güncellendi!');
      setShowEditEventModal(false);
      setSelectedEvent(null);
      fetchEvents();
    } catch (error) {
      console.error('Etkinlik güncellenemedi:', error);
      toast.error('Etkinlik güncellenirken hata oluştu');
    }
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setShowEditTaskModal(true);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      const submitData = {
        title: selectedTask.title,
        description: selectedTask.description,
        category: selectedTask.category,
        difficulty: selectedTask.difficulty,
        points: parseInt(selectedTask.points),
        committee: selectedTask.committee || null,
        deadline: selectedTask.deadline || null,
        tags: selectedTask.tags || '',
        requirements: selectedTask.requirements || '',
        status: selectedTask.status,
        assigned_users: selectedTask.assigned_users || []
      };

      await api.patch(`/tasks/${selectedTask.id}/`, submitData);
      
      toast.success('Görev başarıyla güncellendi!');
      setShowEditTaskModal(false);
      setSelectedTask(null);
      fetchTasks();
    } catch (error) {
      console.error('Görev güncellenemedi:', error);
      toast.error('Görev güncellenirken hata oluştu');
    }
  };

  const toggleProjectActive = async (projectId, currentStatus) => {
    try {
      await api.patch(`/projects/${projectId}/`, { is_active: !currentStatus });
      toast.success(`Proje ${!currentStatus ? 'aktif edildi' : 'pasif edildi'}`);
      fetchProjects(); // Listeyi yenile
    } catch (error) {
      console.error('Proje durumu değiştirilemedi:', error);
      toast.error('İşlem başarısız oldu');
    }
  };

  const handleDeleteProject = async (projectId, projectTitle) => {
    if (!window.confirm(`"${projectTitle}" projesini silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) {
      return;
    }
    
    try {
      await api.delete(`/projects/${projectId}/`);
      toast.success('Proje başarıyla silindi');
      fetchProjects(); // Listeyi yenile
    } catch (error) {
      console.error('Proje silinemedi:', error);
      toast.error('Proje silinirken hata oluştu');
    }
  };

  const handleEditProject = (project) => {
    setSelectedProject(project);
    setShowEditProjectModal(true);
  };

  const handleDeleteMeeting = async (meetingId, meetingTitle) => {
    if (!window.confirm(`"${meetingTitle}" toplantısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) {
      return;
    }
    
    try {
      await api.delete(`/meetings/${meetingId}/`);
      toast.success('Toplantı başarıyla silindi');
      fetchMeetings();
    } catch (error) {
      console.error('Toplantı silinemedi:', error);
      toast.error('Toplantı silinirken hata oluştu');
    }
  };

  const handleEditMeeting = (meeting) => {
    setSelectedMeeting(meeting);
    setShowEditMeetingModal(true);
  };

  const handleUpdateMeeting = async (e) => {
    e.preventDefault();
    if (!selectedMeeting) return;

    try {
      const submitData = {
        title: selectedMeeting.title,
        description: selectedMeeting.description,
        date_time: selectedMeeting.date_time,
        location: selectedMeeting.location,
        committee: selectedMeeting.committee || null,
        agenda: selectedMeeting.agenda || '',
        attendance_points: parseInt(selectedMeeting.attendance_points) || 0,
      };

      await api.patch(`/meetings/${selectedMeeting.id}/`, submitData);
      
      toast.success('Toplantı başarıyla güncellendi!');
      setShowEditMeetingModal(false);
      setSelectedMeeting(null);
      fetchMeetings();
    } catch (error) {
      console.error('Toplantı güncellenemedi:', error);
      toast.error('Toplantı güncellenirken hata oluştu');
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;

    try {
      const submitData = {
        title: selectedProject.title,
        description: selectedProject.description,
        status: selectedProject.status,
        priority: selectedProject.priority,
        committee: selectedProject.committee || null,
        start_date: selectedProject.start_date || null,
        end_date: selectedProject.end_date || null,
        deadline: selectedProject.deadline || null,
        tags: selectedProject.tags || '',
        repository_url: selectedProject.repository_url || '',
        documentation_url: selectedProject.documentation_url || '',
        team_members: selectedProject.team_members || []
      };

      await api.patch(`/projects/${selectedProject.id}/`, submitData);
      
      toast.success('Proje başarıyla güncellendi!');
      setShowEditProjectModal(false);
      setSelectedProject(null);
      fetchProjects();
    } catch (error) {
      console.error('Proje güncellenemedi:', error);
      toast.error('Proje güncellenirken hata oluştu');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      // Kullanıcıyı oluştur
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role
      };
      const userResponse = await api.post('/users/', userData);
      
      // Eğer komite seçildiyse, komiteye ekle
      if (formData.committee_id) {
        const committee = committees.find(c => c.id === parseInt(formData.committee_id));
        if (committee) {
          if (formData.committee_role === 'leader') {
            await api.patch(`/committees/${committee.id}/`, { leader: userResponse.data.id });
          } else if (formData.committee_role === 'vice_leader') {
            await api.patch(`/committees/${committee.id}/`, { vice_leader: userResponse.data.id });
          } else {
            await api.post(`/committees/${committee.id}/add_member/`, { user_id: userResponse.data.id });
          }
        }
      }
      
      toast.success('Kullanıcı başarıyla oluşturuldu');
      setShowCreateModal(false);
      setFormData({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'UYE',
        committee_id: '',
        committee_role: 'member'
      });
      fetchUsers();
      fetchCommittees();
    } catch (error) {
      const errorMsg = error.response?.data?.username?.[0] || 'Kullanıcı oluşturulamadı';
      toast.error(errorMsg);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role
      };
      if (formData.password) {
        updateData.password = formData.password;
      }
      await api.patch(`/users/${selectedUser.id}/`, updateData);
      
      // Önce kullanıcıyı tüm komitelerden çıkar
      for (const committee of committees) {
        if (committee.leader === selectedUser.id) {
          await api.patch(`/committees/${committee.id}/`, { leader: null });
        }
        if (committee.vice_leader === selectedUser.id) {
          await api.patch(`/committees/${committee.id}/`, { vice_leader: null });
        }
        if (committee.members?.includes(selectedUser.id)) {
          await api.post(`/committees/${committee.id}/remove_member/`, { user_id: selectedUser.id });
        }
      }
      
      // Eğer yeni komite seçildiyse, yeni komiteye ekle
      if (formData.committee_id) {
        const committee = committees.find(c => c.id === parseInt(formData.committee_id));
        if (committee) {
          if (formData.committee_role === 'leader') {
            await api.patch(`/committees/${committee.id}/`, { leader: selectedUser.id });
          } else if (formData.committee_role === 'vice_leader') {
            await api.patch(`/committees/${committee.id}/`, { vice_leader: selectedUser.id });
          } else {
            await api.post(`/committees/${committee.id}/add_member/`, { user_id: selectedUser.id });
          }
        }
      }
      
      toast.success('Kullanıcı başarıyla güncellendi');
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
      fetchCommittees();
    } catch (error) {
      console.error('Edit error:', error);
      toast.error('Kullanıcı güncellenemedi');
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) return;
    
    try {
      await api.delete(`/users/${userId}/`);
      toast.success('Kullanıcı silindi');
      fetchUsers();
    } catch (error) {
      toast.error('Kullanıcı silinemedi');
    }
  };
  
  const handleCreateCommittee = async (e) => {
    e.preventDefault();
    try {
      await api.post('/committees/', committeeForm);
      toast.success('Komite başarıyla oluşturuldu');
      setShowCommitteeModal(false);
      setCommitteeForm({ name: '', description: '' });
      fetchCommittees();
    } catch (error) {
      toast.error('Komite oluşturulamadı');
    }
  };
  
  const handleEditCommittee = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/committees/${selectedCommittee.id}/`, committeeForm);
      toast.success('Komite başarıyla güncellendi');
      setShowEditCommitteeModal(false);
      setSelectedCommittee(null);
      fetchCommittees();
    } catch (error) {
      toast.error('Komite güncellenemedi');
    }
  };
  
  const handleDeleteCommittee = async (committeeId) => {
    if (!confirm('Bu komiteyi silmek istediğinizden emin misiniz?')) return;
    
    try {
      await api.delete(`/committees/${committeeId}/`);
      toast.success('Komite silindi');
      fetchCommittees();
    } catch (error) {
      toast.error('Komite silinemedi');
    }
  };
  
  const openEditCommitteeModal = (committee) => {
    setSelectedCommittee(committee);
    setCommitteeForm({
      name: committee.name,
      description: committee.description
    });
    setShowEditCommitteeModal(true);
  };

  const openEditModal = async (user) => {
    setSelectedUser(user);
    
    // Kullanıcının mevcut komitesini bul
    let userCommittee = null;
    let userCommitteeRole = 'member';
    
    for (const committee of committees) {
      if (committee.leader === user.id) {
        userCommittee = committee.id;
        userCommitteeRole = 'leader';
        break;
      } else if (committee.vice_leader === user.id) {
        userCommittee = committee.id;
        userCommitteeRole = 'vice_leader';
        break;
      } else if (committee.members?.includes(user.id)) {
        userCommittee = committee.id;
        userCommitteeRole = 'member';
        break;
      }
    }
    
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      committee_id: userCommittee ? String(userCommittee) : '',
      committee_role: userCommitteeRole
    });
    setShowEditModal(true);
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      BASKAN: 'bg-purple-600',
      BASKAN_YARDIMCISI: 'bg-blue-600',
      KOMITE_LIDERI: 'bg-orange-600',
      KOMITE_YARDIMCISI: 'bg-yellow-600',
      UYE: 'bg-gray-600'
    };
    return colors[role] || 'bg-gray-600';
  };

  const getRoleDisplay = (role) => {
    const roles = {
      BASKAN: 'Başkan',
      BASKAN_YARDIMCISI: 'Başkan Yardımcısı',
      KOMITE_LIDERI: 'Komite Lideri',
      KOMITE_YARDIMCISI: 'Komite Yardımcısı',
      UYE: 'Üye'
    };
    return roles[role] || role;
  };

  if (!user?.is_admin) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-gray-300">Yetkiniz Yok</h3>
        <p className="mt-1 text-sm text-gray-500">Bu sayfaya erişim yetkiniz bulunmuyor.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6 px-2 sm:px-4 pb-4 sm:pb-6 overflow-x-hidden w-full">
        {/* Header with Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 md:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Admin Panel</h1>
            <p className="text-gray-400 mt-0.5 sm:mt-1 text-xs sm:text-sm md:text-base">Sistem yönetimi ve moderasyon</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-0.5 sm:space-x-1 md:space-x-2 bg-gray-900 p-0.5 sm:p-1 md:p-2 rounded-lg sm:rounded-xl border border-gray-800 overflow-x-auto scrollbar-hide -mx-2 sm:-mx-4 md:mx-0 w-[calc(100%+1rem)] sm:w-[calc(100%+2rem)] md:w-full">
          <Link
            to="/admin/users"
            className={`flex-shrink-0 py-1 sm:py-1.5 md:py-2 lg:py-3 px-1.5 sm:px-2 md:px-3 lg:px-4 font-medium transition-all rounded text-center text-[9px] sm:text-[10px] md:text-xs lg:text-sm ${
              activeTab === 'users'
                ? 'bg-red-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span className="whitespace-nowrap">Kullanıcı</span>
            <span className="hidden sm:inline"> Yönetimi</span>
          </Link>
          <Link
            to="/admin/committees"
            className={`flex-shrink-0 py-1 sm:py-1.5 md:py-2 lg:py-3 px-1.5 sm:px-2 md:px-3 lg:px-4 font-medium transition-all rounded text-center text-[9px] sm:text-[10px] md:text-xs lg:text-sm ${
              activeTab === 'committees'
                ? 'bg-red-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span className="whitespace-nowrap">Komite</span>
            <span className="hidden sm:inline"> Yönetimi</span>
          </Link>
          <Link
            to="/admin/events"
            className={`flex-shrink-0 py-1 sm:py-1.5 md:py-2 lg:py-3 px-1.5 sm:px-2 md:px-3 lg:px-4 font-medium transition-all rounded text-center text-[9px] sm:text-[10px] md:text-xs lg:text-sm ${
              activeTab === 'events'
                ? 'bg-red-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span className="whitespace-nowrap">Etkinlikler</span>
          </Link>
          <Link
            to="/admin/tasks"
            className={`flex-shrink-0 py-1 sm:py-1.5 md:py-2 lg:py-3 px-1.5 sm:px-2 md:px-3 lg:px-4 font-medium transition-all rounded text-center text-[9px] sm:text-[10px] md:text-xs lg:text-sm ${
              activeTab === 'tasks'
                ? 'bg-red-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span className="whitespace-nowrap">Görevler</span>
          </Link>
          <Link
            to="/admin/projects"
            className={`flex-shrink-0 py-1 sm:py-1.5 md:py-2 lg:py-3 px-1.5 sm:px-2 md:px-3 lg:px-4 font-medium transition-all rounded text-center text-[9px] sm:text-[10px] md:text-xs lg:text-sm ${
              activeTab === 'projects'
                ? 'bg-red-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span className="whitespace-nowrap">Projeler</span>
          </Link>
          <Link
            to="/admin/meetings"
            className={`flex-shrink-0 py-1 sm:py-1.5 md:py-2 lg:py-3 px-1.5 sm:px-2 md:px-3 lg:px-4 font-medium transition-all rounded text-center text-[9px] sm:text-[10px] md:text-xs lg:text-sm ${
              activeTab === 'meetings'
                ? 'bg-red-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span className="whitespace-nowrap">Toplantılar</span>
          </Link>
          <Link
            to="/admin/moderation"
            className={`flex-shrink-0 py-1 sm:py-1.5 md:py-2 lg:py-3 px-1.5 sm:px-2 md:px-3 lg:px-4 font-medium transition-all rounded text-center text-[9px] sm:text-[10px] md:text-xs lg:text-sm ${
              activeTab === 'moderation'
                ? 'bg-red-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <span className="whitespace-nowrap">Moderasyon</span>
          </Link>
        </div>

        {activeTab === 'users' ? (
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 md:gap-4">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Kullanıcı Yönetimi</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm md:text-base"
              >
                + Yeni Kullanıcı
              </button>
            </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <div className="bg-gray-900 rounded-lg p-3 sm:p-4">
          <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm">Toplam Kullanıcı</p>
          <p className="text-xl sm:text-2xl font-bold text-white mt-1 sm:mt-2">{safeUsers.length}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-3 sm:p-4">
          <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm">Başkan & Yardımcılar</p>
          <p className="text-xl sm:text-2xl font-bold text-purple-500 mt-1 sm:mt-2">
            {safeUsers.filter(u => u.role === 'BASKAN' || u.role === 'BASKAN_YARDIMCISI').length}
          </p>
        </div>
        <div className="bg-gray-900 rounded-lg p-3 sm:p-4">
          <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm">Komite Liderleri</p>
          <p className="text-xl sm:text-2xl font-bold text-orange-500 mt-1 sm:mt-2">
            {safeUsers.filter(u => u.role === 'KOMITE_LIDERI').length}
          </p>
        </div>
        <div className="bg-gray-900 rounded-lg p-3 sm:p-4">
          <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm">Üyeler</p>
          <p className="text-xl sm:text-2xl font-bold text-blue-500 mt-1 sm:mt-2">
            {safeUsers.filter(u => u.role === 'UYE').length}
          </p>
        </div>
      </div>

      {/* Users Table - Desktop */}
      <div className="bg-gray-900 rounded-lg overflow-hidden hidden md:block">
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Kullanıcı</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Komite</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Puan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {safeUsers.map((usr) => (
              <tr key={usr.id} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">
                      {usr.first_name[0]}{usr.last_name[0]}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-white">{usr.full_name}</div>
                      <div className="text-sm text-gray-400">@{usr.username}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{usr.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`${getRoleBadgeColor(usr.role)} text-white text-xs px-3 py-1 rounded-full`}>
                    {getRoleDisplay(usr.role)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {(() => {
                    const userCommittee = committees.find(c => 
                      c.leader === usr.id || 
                      c.vice_leader === usr.id || 
                      c.members?.includes(usr.id)
                    );
                    
                    if (!userCommittee) {
                      return <span className="text-gray-500 text-xs">-</span>;
                    }
                    
                    let role = '';
                    if (userCommittee.leader === usr.id) role = 'Lider';
                    else if (userCommittee.vice_leader === usr.id) role = 'Yardımcı';
                    else role = 'Üye';
                    
                    return (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-white font-medium">{userCommittee.name}</span>
                        <span className="text-xs text-gray-400">({role})</span>
                      </div>
                    );
                  })()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">Level {usr.level}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-500 font-semibold">{usr.total_points}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => openEditModal(usr)}
                    className="text-blue-500 hover:text-blue-400 mr-3"
                  >
                    Düzenle
                  </button>
                  {usr.id !== user.id && (
                    <button
                      onClick={() => handleDelete(usr.id)}
                      className="text-red-500 hover:text-red-400"
                    >
                      Sil
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Users Cards - Mobile */}
      <div className="space-y-3 md:hidden w-full">
        {safeUsers.map((usr) => {
          const userCommittee = committees.find(c => 
            c.leader === usr.id || 
            c.vice_leader === usr.id || 
            c.members?.includes(usr.id)
          );
          let committeeRole = '';
          if (userCommittee) {
            if (userCommittee.leader === usr.id) committeeRole = 'Lider';
            else if (userCommittee.vice_leader === usr.id) committeeRole = 'Yardımcı';
            else committeeRole = 'Üye';
          }
          
          return (
            <div key={usr.id} className="bg-gray-900 rounded-lg p-4 border border-gray-800 w-full max-w-full overflow-hidden">
              <div className="flex items-center gap-3 mb-3 min-w-0">
                <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {usr.first_name[0]}{usr.last_name[0]}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="text-sm font-medium text-white truncate">{usr.full_name}</div>
                  <div className="text-xs text-gray-400 truncate">@{usr.username}</div>
                </div>
                <span className={`${getRoleBadgeColor(usr.role)} text-white text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap`}>
                  {getRoleDisplay(usr.role)}
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="text-gray-400 flex-shrink-0">Email:</span>
                  <span className="text-gray-300 truncate text-right min-w-0">{usr.email}</span>
                </div>
                {userCommittee && (
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-gray-400 flex-shrink-0">Komite:</span>
                    <div className="text-right min-w-0 overflow-hidden">
                      <span className="text-white font-medium truncate block">{userCommittee.name}</span>
                      <span className="text-gray-400 text-[10px]">({committeeRole})</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-400">Level:</span>
                  <span className="text-white">Level {usr.level}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-400">Puan:</span>
                  <span className="text-yellow-500 font-semibold">{usr.total_points}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-800">
                <button
                  onClick={() => openEditModal(usr)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  Düzenle
                </button>
                {usr.id !== user.id && (
                  <button
                    onClick={() => handleDelete(usr.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    Sil
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-gray-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Yeni Kullanıcı Oluştur</h3>
            <form onSubmit={handleCreate} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Kullanıcı Adı</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Ad</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Soyad</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Şifre</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                >
                  <option value="UYE">Üye</option>
                  <option value="KOMITE_LIDERI">Komite Lideri</option>
                  <option value="KOMITE_YARDIMCISI">Komite Yardımcısı</option>
                  <option value="BASKAN_YARDIMCISI">Başkan Yardımcısı</option>
                  <option value="BASKAN">Başkan</option>
                </select>
              </div>
              
              {/* Komite Seçimi */}
              <div className="border-t border-gray-700 pt-3 sm:pt-4">
                <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Komite (Opsiyonel)</label>
                <select
                  value={formData.committee_id}
                  onChange={(e) => setFormData({...formData, committee_id: e.target.value})}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                >
                  <option value="">Komite Seçilmedi</option>
                  {committees.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              {formData.committee_id && (
                <div>
                  <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Komitedeki Rolü</label>
                  <select
                    value={formData.committee_role}
                    onChange={(e) => setFormData({...formData, committee_role: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                  >
                    <option value="member">Üye</option>
                    <option value="vice_leader">Başkan Yardımcısı</option>
                    <option value="leader">Komite Lideri</option>
                  </select>
                </div>
              )}
              
              <div className="flex space-x-2 sm:space-x-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                >
                  Oluştur
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-gray-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Kullanıcıyı Düzenle</h3>
            <form onSubmit={handleEdit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Kullanıcı Adı</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Ad</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Soyad</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Yeni Şifre (opsiyonel)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Değiştirmek istemiyorsanız boş bırakın"
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                >
                  <option value="UYE">Üye</option>
                  <option value="KOMITE_LIDERI">Komite Lideri</option>
                  <option value="KOMITE_YARDIMCISI">Komite Yardımcısı</option>
                  <option value="BASKAN_YARDIMCISI">Başkan Yardımcısı</option>
                  <option value="BASKAN">Başkan</option>
                </select>
              </div>
              
              {/* Komite Seçimi */}
              <div className="border-t border-gray-700 pt-3 sm:pt-4">
                <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Komite (Opsiyonel)</label>
                <select
                  value={formData.committee_id}
                  onChange={(e) => setFormData({...formData, committee_id: e.target.value})}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                >
                  <option value="">Komite Seçilmedi</option>
                  {committees.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              {formData.committee_id && (
                <div>
                  <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Komitedeki Rolü</label>
                  <select
                    value={formData.committee_role}
                    onChange={(e) => setFormData({...formData, committee_role: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                  >
                    <option value="member">Üye</option>
                    <option value="vice_leader">Başkan Yardımcısı</option>
                    <option value="leader">Komite Lideri</option>
                  </select>
                </div>
              )}
              
              <div className="flex space-x-2 sm:space-x-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                >
                  Güncelle
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
          </div>
        ) : activeTab === 'committees' ? (
          /* Committees Tab */
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 md:gap-4">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Komite Yönetimi</h2>
              <button
                onClick={() => setShowCommitteeModal(true)}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm md:text-base"
              >
                + Yeni Komite
              </button>
            </div>

            {/* Committees Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {committees.map((committee) => {
                const leaderUser = users.find(u => u.id === committee.leader);
                const viceLeaderUser = users.find(u => u.id === committee.vice_leader);
                const memberCount = committee.members?.length || 0;
                
                return (
                  <div key={committee.id} className="bg-gray-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-gray-800 hover:border-red-600/50 transition-all">
                    <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base sm:text-lg md:text-xl font-bold text-white truncate">{committee.name}</h3>
                          <p className="text-gray-400 text-xs sm:text-sm">{memberCount} üye</p>
                        </div>
                      </div>
                      <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                        <button
                          onClick={() => openEditCommitteeModal(committee)}
                          className="text-blue-500 hover:text-blue-400 text-xs sm:text-sm px-2 py-1"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => handleDeleteCommittee(committee.id)}
                          className="text-red-500 hover:text-red-400 text-xs sm:text-sm px-2 py-1"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">{committee.description}</p>
                    
                    <div className="space-y-1.5 sm:space-y-2 pt-3 sm:pt-4 border-t border-gray-800">
                      {leaderUser && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] sm:text-xs text-gray-500">Lider:</span>
                          <span className="text-xs sm:text-sm text-white truncate">{leaderUser.full_name}</span>
                        </div>
                      )}
                      {viceLeaderUser && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] sm:text-xs text-gray-500">Yardımcı:</span>
                          <span className="text-xs sm:text-sm text-white truncate">{viceLeaderUser.full_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Create Committee Modal */}
            {showCommitteeModal && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={() => setShowCommitteeModal(false)}>
                <div className="bg-gray-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Yeni Komite Oluştur</h3>
                  <form onSubmit={handleCreateCommittee} className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Komite Adı</label>
                      <input
                        type="text"
                        required
                        value={committeeForm.name}
                        onChange={(e) => setCommitteeForm({...committeeForm, name: e.target.value})}
                        className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Açıklama</label>
                      <textarea
                        value={committeeForm.description}
                        onChange={(e) => setCommitteeForm({...committeeForm, description: e.target.value})}
                        rows={3}
                        className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600 resize-none"
                      />
                    </div>
                    <div className="flex space-x-2 sm:space-x-3 pt-2">
                      <button
                        type="submit"
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                      >
                        Oluştur
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCommitteeModal(false)}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                      >
                        İptal
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Edit Committee Modal */}
            {showEditCommitteeModal && selectedCommittee && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={() => setShowEditCommitteeModal(false)}>
                <div className="bg-gray-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Komiteyi Düzenle</h3>
                  <form onSubmit={handleEditCommittee} className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Komite Adı</label>
                      <input
                        type="text"
                        required
                        value={committeeForm.name}
                        onChange={(e) => setCommitteeForm({...committeeForm, name: e.target.value})}
                        className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Açıklama</label>
                      <textarea
                        value={committeeForm.description}
                        onChange={(e) => setCommitteeForm({...committeeForm, description: e.target.value})}
                        rows={3}
                        className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600 resize-none"
                      />
                    </div>
                    <div className="flex space-x-2 sm:space-x-3 pt-2">
                      <button
                        type="submit"
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                      >
                        Güncelle
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowEditCommitteeModal(false)}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                      >
                        İptal
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'events' ? (
          /* Events Tab */
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Etkinlik Yönetimi</h2>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {events.map((event) => (
                  <div 
                    key={event.id} 
                    onClick={() => handleEditEvent(event)}
                    className="bg-gray-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-gray-800 hover:border-red-600/50 transition-all cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1 w-full sm:w-auto">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                          <h3 className="text-base sm:text-lg md:text-xl font-bold text-white">{event.title}</h3>
                          <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${
                            event.is_active 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {event.is_active ? '✓ Aktif' : '✕ Pasif'}
                          </span>
                          <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${
                            !event.approval_status || event.approval_status === 'APPROVED'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : event.approval_status === 'PENDING'
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {!event.approval_status || event.approval_status === 'APPROVED' ? '✓ Onaylı' : event.approval_status === 'PENDING' ? '⏳ Onay Bekliyor' : '✕ Reddedildi'}
                          </span>
                          <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            {event.event_type_display}
                          </span>
                        </div>
                        
                        <p className="text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">{event.description}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm">
                          <div className="flex items-center gap-2 text-gray-300">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(event.date_time).toLocaleDateString('tr-TR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {event.location}
                          </div>
                          <div className="flex items-center gap-2 text-yellow-400">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {event.attendance_points} puan
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {event.attendee_count || 0} katılımcı
                          </div>
                        </div>
                      </div>
                      
                      <div className="w-full sm:w-auto sm:ml-4 flex flex-row sm:flex-col gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleEventActive(event.id, event.is_active);
                          }}
                          className={`flex-1 sm:flex-none px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg text-xs sm:text-sm ${
                            event.is_active
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          {event.is_active ? 'Pasif Et' : 'Aktif Et'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEvent(event.id, event.title);
                          }}
                          className="flex-1 sm:flex-none px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg bg-gray-700 hover:bg-red-600 text-white text-xs sm:text-sm"
                        >
                          🗑️ Sil
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {events.length === 0 && (
                  <div className="text-center py-20">
                    <svg className="w-20 h-20 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-400 text-lg">Henüz etkinlik yok</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : activeTab === 'tasks' ? (
          /* Tasks Tab */
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Görev Yönetimi</h2>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {tasks.map((task) => (
                  <div 
                    key={task.id} 
                    onClick={() => handleEditTask(task)}
                    className="bg-gray-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-gray-800 hover:border-red-600/50 transition-all cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1 w-full sm:w-auto">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                          <h3 className="text-base sm:text-lg md:text-xl font-bold text-white">{task.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            task.is_active 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {task.is_active ? '✓ Aktif' : '✕ Pasif'}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            !task.approval_status || task.approval_status === 'APPROVED'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : task.approval_status === 'PENDING'
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {!task.approval_status || task.approval_status === 'APPROVED' ? '✓ Onaylı' : task.approval_status === 'PENDING' ? '⏳ Onay Bekliyor' : '✕ Reddedildi'}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            task.status === 'TAMAMLANDI' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                            task.status === 'DEVAM_EDIYOR' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                            task.status === 'BEKLEMEDE' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                          }`}>
                            {task.status_display}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            task.difficulty === 'KOLAY' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                            task.difficulty === 'ORTA' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            task.difficulty === 'ZOR' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                            'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {task.difficulty_display}
                          </span>
                        </div>
                        
                        <p className="text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">{task.description || 'Açıklama yok'}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm">
                          <div className="flex items-center gap-2 text-gray-300">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {task.created_by_name || 'Bilinmiyor'}
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {task.assigned_users_detail?.length > 0 
                              ? `${task.assigned_users_detail.length} kişi` 
                              : task.assigned_to_name || 'Atanmamış'}
                          </div>
                          <div className="flex items-center gap-2 text-yellow-400">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {task.points} puan
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            {task.category_display || 'Kategori yok'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="w-full sm:w-auto sm:ml-4 flex flex-row sm:flex-col gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTaskActive(task.id, task.is_active);
                          }}
                          className={`flex-1 sm:flex-none px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg text-xs sm:text-sm ${
                            task.is_active
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          {task.is_active ? 'Pasif Et' : 'Aktif Et'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task.id, task.title);
                          }}
                          className="flex-1 sm:flex-none px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg bg-gray-700 hover:bg-red-600 text-white text-xs sm:text-sm"
                        >
                          🗑️ Sil
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {tasks.length === 0 && (
                  <div className="text-center py-20">
                    <svg className="w-20 h-20 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-gray-400 text-lg">Henüz görev yok</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : activeTab === 'projects' ? (
          /* Projects Tab */
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Proje Yönetimi</h2>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {projects.map((project) => (
                  <div 
                    key={project.id} 
                    onClick={() => handleEditProject(project)}
                    className="bg-gray-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-gray-800 hover:border-red-600/50 transition-all cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1 w-full sm:w-auto">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                          <h3 className="text-base sm:text-lg md:text-xl font-bold text-white">{project.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            project.is_active 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {project.is_active ? '✓ Aktif' : '✕ Pasif'}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            !project.approval_status || project.approval_status === 'APPROVED'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : project.approval_status === 'PENDING'
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {!project.approval_status || project.approval_status === 'APPROVED' ? '✓ Onaylı' : project.approval_status === 'PENDING' ? '⏳ Onay Bekliyor' : '✕ Reddedildi'}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            project.status === 'TAMAMLANDI' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                            project.status === 'AKTIF' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                            project.status === 'PLANLAMA' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            project.status === 'BEKLEMEDE' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' :
                            'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {project.status_display}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            project.priority === 'DUSUK' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                            project.priority === 'ORTA' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            project.priority === 'YUKSEK' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                            'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {project.priority_display}
                          </span>
                        </div>
                        
                        <p className="text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">{project.description || 'Açıklama yok'}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm">
                          <div className="flex items-center gap-2 text-gray-300">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {project.owner_name || 'Bilinmiyor'}
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {project.team_member_names?.length > 0 
                              ? `${project.team_member_names.length} kişi` 
                              : 'Takım yok'}
                          </div>
                          <div className="flex items-center gap-2 text-yellow-400">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {project.total_points || 0} puan
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            %{project.completion_percentage || 0} tamamlandı
                          </div>
                        </div>
                      </div>
                      
                      <div className="w-full sm:w-auto sm:ml-4 flex flex-row sm:flex-col gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleProjectActive(project.id, project.is_active);
                          }}
                          className={`flex-1 sm:flex-none px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg text-xs sm:text-sm ${
                            project.is_active
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          {project.is_active ? 'Pasif Et' : 'Aktif Et'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id, project.title);
                          }}
                          className="flex-1 sm:flex-none px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg bg-gray-700 hover:bg-red-600 text-white text-xs sm:text-sm"
                        >
                          🗑️ Sil
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {projects.length === 0 && (
                  <div className="text-center py-20">
                    <svg className="w-20 h-20 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="text-gray-400 text-lg">Henüz proje yok</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : activeTab === 'meetings' ? (
          /* Meetings Tab */
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Toplantı Yönetimi</h2>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {meetings.map((meeting) => (
                  <div 
                    key={meeting.id} 
                    onClick={() => handleEditMeeting(meeting)}
                    className="bg-gray-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-gray-800 hover:border-red-600/50 transition-all cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1 w-full sm:w-auto">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                          <h3 className="text-base sm:text-lg md:text-xl font-bold text-white">{meeting.title}</h3>
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            📅 {new Date(meeting.date_time).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            🕐 {new Date(meeting.date_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        <p className="text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">{meeting.description || 'Açıklama yok'}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
                          <div className="flex items-center gap-2 text-gray-300">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {meeting.location || 'Konum belirtilmedi'}
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {meeting.committee_name || 'Genel'}
                          </div>
                          <div className="flex items-center gap-2 text-yellow-400">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {meeting.attendance_points || 0} puan
                          </div>
                        </div>
                      </div>
                      
                      <div className="w-full sm:w-auto sm:ml-4 flex flex-row sm:flex-col gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMeeting(meeting.id, meeting.title);
                          }}
                          className="flex-1 sm:flex-none px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg bg-gray-700 hover:bg-red-600 text-white text-xs sm:text-sm"
                        >
                          🗑️ Sil
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {meetings.length === 0 && (
                  <div className="text-center py-20">
                    <svg className="w-20 h-20 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-400 text-lg">Henüz toplantı yok</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Moderation Tab */
          <ModerationPanel />
        )}
      </div>

      {/* Edit Event Modal */}
      {showEditEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={() => setShowEditEventModal(false)}>
          <div className="bg-gray-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Etkinliği Düzenle</h3>
            <form onSubmit={handleUpdateEvent} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Etkinlik Adı</label>
                <input
                  type="text"
                  required
                  value={selectedEvent.title || ''}
                  onChange={(e) => setSelectedEvent({...selectedEvent, title: e.target.value})}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Açıklama</label>
                <textarea
                  required
                  value={selectedEvent.description || ''}
                  onChange={(e) => setSelectedEvent({...selectedEvent, description: e.target.value})}
                  rows={4}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600 resize-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Etkinlik Türü</label>
                <select
                  value={selectedEvent.event_type || 'EGITIM'}
                  onChange={(e) => setSelectedEvent({...selectedEvent, event_type: e.target.value})}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                >
                  <option value="EGITIM">Eğitim</option>
                  <option value="TEKNIK">Teknik Çalışma</option>
                  <option value="SOSYAL">Sosyal Etkinlik</option>
                  <option value="PROJE">Proje Toplantısı</option>
                  <option value="DIGER">Diğer</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Tarih ve Saat</label>
                  <input
                    type="datetime-local"
                    required
                    value={selectedEvent.date_time ? (() => {
                      const date = new Date(selectedEvent.date_time);
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      const hours = String(date.getHours()).padStart(2, '0');
                      const minutes = String(date.getMinutes()).padStart(2, '0');
                      return `${year}-${month}-${day}T${hours}:${minutes}`;
                    })() : ''}
                    onChange={(e) => setSelectedEvent({...selectedEvent, date_time: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Konum</label>
                  <input
                    type="text"
                    required
                    value={selectedEvent.location || ''}
                    onChange={(e) => setSelectedEvent({...selectedEvent, location: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Süre (dakika)</label>
                  <input
                    type="number"
                    required
                    value={selectedEvent.duration || 60}
                    onChange={(e) => setSelectedEvent({...selectedEvent, duration: parseInt(e.target.value)})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Puan</label>
                  <input
                    type="number"
                    required
                    value={selectedEvent.attendance_points || 10}
                    onChange={(e) => setSelectedEvent({...selectedEvent, attendance_points: parseInt(e.target.value)})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>
              <div className="flex space-x-2 sm:space-x-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                >
                  Güncelle
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditEventModal(false);
                    setSelectedEvent(null);
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditTaskModal && selectedTask && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={() => setShowEditTaskModal(false)}>
          <div className="bg-gray-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Görevi Düzenle</h3>
            <form onSubmit={handleUpdateTask} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Görev Başlığı</label>
                <input
                  type="text"
                  required
                  value={selectedTask.title || ''}
                  onChange={(e) => setSelectedTask({...selectedTask, title: e.target.value})}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Açıklama</label>
                <textarea
                  value={selectedTask.description || ''}
                  onChange={(e) => setSelectedTask({...selectedTask, description: e.target.value})}
                  rows={4}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600 resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Kategori</label>
                  <select
                    value={selectedTask.category || 'GELISTIRME'}
                    onChange={(e) => setSelectedTask({...selectedTask, category: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                  >
                    <option value="GELISTIRME">Geliştirme</option>
                    <option value="TASARIM">Tasarım</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="DIGER">Diğer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Zorluk</label>
                  <select
                    value={selectedTask.difficulty || 'ORTA'}
                    onChange={(e) => setSelectedTask({...selectedTask, difficulty: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                  >
                    <option value="KOLAY">Kolay</option>
                    <option value="ORTA">Orta</option>
                    <option value="ZOR">Zor</option>
                    <option value="COK_ZOR">Çok Zor</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Puan</label>
                  <input
                    type="number"
                    required
                    value={selectedTask.points || 10}
                    onChange={(e) => setSelectedTask({...selectedTask, points: parseInt(e.target.value)})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Durum</label>
                  <select
                    value={selectedTask.status || 'BEKLEMEDE'}
                    onChange={(e) => setSelectedTask({...selectedTask, status: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                  >
                    <option value="BEKLEMEDE">Beklemede</option>
                    <option value="DEVAM_EDIYOR">Devam Ediyor</option>
                    <option value="TAMAMLANDI">Tamamlandı</option>
                    <option value="IPTAL">İptal</option>
                  </select>
                </div>
              </div>
                <div>
                  <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Son Tarih</label>
                  <input
                    type="datetime-local"
                    value={selectedTask.deadline ? (() => {
                      const date = new Date(selectedTask.deadline);
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      const hours = String(date.getHours()).padStart(2, '0');
                      const minutes = String(date.getMinutes()).padStart(2, '0');
                      return `${year}-${month}-${day}T${hours}:${minutes}`;
                    })() : ''}
                    onChange={(e) => setSelectedTask({...selectedTask, deadline: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
              <div>
                <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Etiketler</label>
                <input
                  type="text"
                  value={selectedTask.tags || ''}
                  onChange={(e) => setSelectedTask({...selectedTask, tags: e.target.value})}
                  placeholder="virgülle ayırın (örn: python, django, api)"
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Gereksinimler</label>
                <textarea
                  value={selectedTask.requirements || ''}
                  onChange={(e) => setSelectedTask({...selectedTask, requirements: e.target.value})}
                  rows={3}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600 resize-none"
                />
              </div>
              <div className="flex space-x-2 sm:space-x-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                >
                  Güncelle
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditTaskModal(false);
                    setSelectedTask(null);
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditProjectModal && selectedProject && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={() => setShowEditProjectModal(false)}>
          <div className="bg-gray-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Projeyi Düzenle</h3>
            <form onSubmit={handleUpdateProject} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Proje Başlığı</label>
                <input
                  type="text"
                  required
                  value={selectedProject.title || ''}
                  onChange={(e) => setSelectedProject({...selectedProject, title: e.target.value})}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Açıklama</label>
                <textarea
                  value={selectedProject.description || ''}
                  onChange={(e) => setSelectedProject({...selectedProject, description: e.target.value})}
                  rows={4}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600 resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Durum</label>
                  <select
                    value={selectedProject.status || 'PLANLAMA'}
                    onChange={(e) => setSelectedProject({...selectedProject, status: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                  >
                    <option value="PLANLAMA">Planlama</option>
                    <option value="AKTIF">Aktif</option>
                    <option value="BEKLEMEDE">Beklemede</option>
                    <option value="TAMAMLANDI">Tamamlandı</option>
                    <option value="IPTAL">İptal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Öncelik</label>
                  <select
                    value={selectedProject.priority || 'ORTA'}
                    onChange={(e) => setSelectedProject({...selectedProject, priority: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                  >
                    <option value="DUSUK">Düşük</option>
                    <option value="ORTA">Orta</option>
                    <option value="YUKSEK">Yüksek</option>
                    <option value="KRITIK">Kritik</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    value={selectedProject.start_date ? new Date(selectedProject.start_date).toISOString().split('T')[0] : ''}
                    onChange={(e) => setSelectedProject({...selectedProject, start_date: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Bitiş Tarihi</label>
                  <input
                    type="date"
                    value={selectedProject.end_date ? new Date(selectedProject.end_date).toISOString().split('T')[0] : ''}
                    onChange={(e) => setSelectedProject({...selectedProject, end_date: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Son Tarih</label>
                  <input
                    type="date"
                    value={selectedProject.deadline ? new Date(selectedProject.deadline).toISOString().split('T')[0] : ''}
                    onChange={(e) => setSelectedProject({...selectedProject, deadline: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Etiketler</label>
                <input
                  type="text"
                  value={selectedProject.tags || ''}
                  onChange={(e) => setSelectedProject({...selectedProject, tags: e.target.value})}
                  placeholder="virgülle ayırın (örn: python, django, api)"
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Repository URL</label>
                  <input
                    type="url"
                    value={selectedProject.repository_url || ''}
                    onChange={(e) => setSelectedProject({...selectedProject, repository_url: e.target.value})}
                    placeholder="https://github.com/..."
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Dokümantasyon URL</label>
                  <input
                    type="url"
                    value={selectedProject.documentation_url || ''}
                    onChange={(e) => setSelectedProject({...selectedProject, documentation_url: e.target.value})}
                    placeholder="https://docs.example.com/..."
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>
              <div className="flex space-x-2 sm:space-x-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                >
                  Güncelle
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditProjectModal(false);
                    setSelectedProject(null);
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Meeting Modal */}
      {showEditMeetingModal && selectedMeeting && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={() => setShowEditMeetingModal(false)}>
          <div className="bg-gray-900 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Toplantıyı Düzenle</h3>
            <form onSubmit={handleUpdateMeeting} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Toplantı Başlığı</label>
                <input
                  type="text"
                  required
                  value={selectedMeeting.title || ''}
                  onChange={(e) => setSelectedMeeting({...selectedMeeting, title: e.target.value})}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Açıklama</label>
                <textarea
                  required
                  value={selectedMeeting.description || ''}
                  onChange={(e) => setSelectedMeeting({...selectedMeeting, description: e.target.value})}
                  rows={3}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600 resize-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Gündem</label>
                <textarea
                  value={selectedMeeting.agenda || ''}
                  onChange={(e) => setSelectedMeeting({...selectedMeeting, agenda: e.target.value})}
                  rows={4}
                  placeholder="Toplantı gündemi..."
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600 resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Tarih ve Saat</label>
                  <input
                    type="datetime-local"
                    required
                    value={selectedMeeting.date_time ? new Date(selectedMeeting.date_time).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setSelectedMeeting({...selectedMeeting, date_time: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Konum</label>
                  <input
                    type="text"
                    required
                    value={selectedMeeting.location || ''}
                    onChange={(e) => setSelectedMeeting({...selectedMeeting, location: e.target.value})}
                    placeholder="Toplantı konumu"
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Komite</label>
                  <select
                    value={selectedMeeting.committee || ''}
                    onChange={(e) => setSelectedMeeting({...selectedMeeting, committee: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                  >
                    <option value="">Genel Toplantı</option>
                    {committees.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Katılım Puanı</label>
                  <input
                    type="number"
                    min="0"
                    value={selectedMeeting.attendance_points || 0}
                    onChange={(e) => setSelectedMeeting({...selectedMeeting, attendance_points: e.target.value})}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>
              <div className="flex space-x-2 sm:space-x-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                >
                  Güncelle
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditMeetingModal(false);
                    setSelectedMeeting(null);
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
