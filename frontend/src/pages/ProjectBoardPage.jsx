import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import ChatWindow from '../components/chat/ChatWindow';
import { chatAPI } from '../services/chatAPI';

export default function ProjectBoardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [columns, setColumns] = useState({
    YAPILACAK: [],
    DEVAM_EDIYOR: [],
    TAMAMLANDI: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('board'); // 'board' or 'chat'
  const [chatRoom, setChatRoom] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'ORTA',
    points: 10,
    deadline: ''
  });

  useEffect(() => {
    fetchBoard();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'chat' && !chatRoom) {
      loadChatRoom();
    }
  }, [activeTab, id]);

  const fetchBoard = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/projects/${id}/board/`);
      setProject(response.data.project);
      setColumns(response.data.columns);
    } catch (error) {
      console.error('Kanban board yüklenemedi:', error);
      toast.error('Proje bulunamadı');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const loadChatRoom = async () => {
    try {
      setChatLoading(true);
      const room = await chatAPI.getProjectRoom(parseInt(id));
      setChatRoom(room);
    } catch (error) {
      console.error('Chat odası yüklenemedi:', error);
      toast.error('Chat odası yüklenirken hata oluştu');
    } finally {
      setChatLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        project: parseInt(id),
        title: taskForm.title,
        description: taskForm.description || '',
        priority: taskForm.priority,
        points: parseInt(taskForm.points) || 10,
        deadline: taskForm.deadline || null
      };
      
      await api.post('/project-tasks/', submitData);
      toast.success('Görev oluşturuldu!');
      setShowTaskModal(false);
      setTaskForm({
        title: '',
        description: '',
        priority: 'ORTA',
        points: 10,
        deadline: ''
      });
      fetchBoard();
    } catch (error) {
      console.error('Görev oluşturulamadı:', error);
      const errorMsg = error.response?.data?.detail || 
                      error.response?.data?.error || 
                      JSON.stringify(error.response?.data) ||
                      'Görev oluşturulamadı';
      toast.error(errorMsg);
    }
  };

  const handleAssignToMe = async (taskId) => {
    try {
      await api.patch(`/project-tasks/${taskId}/`, {
        assigned_to: user.id
      });
      toast.success('Görev size atandı!');
      fetchBoard();
    } catch (error) {
      console.error('Görev atanamadı:', error);
      toast.error('Görev atanamadı');
    }
  };

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];
    const taskId = parseInt(draggableId);
    const task = sourceColumn.find(t => t.id === taskId);

    // DEVAM_EDIYOR'a taşırken atanmış kişi yoksa uyar
    if (destination.droppableId === 'DEVAM_EDIYOR' && !task.assigned_to) {
      toast.warning('Önce bir kullanıcıya atayın!');
      return;
    }

    // API call - Optimistic update yapmıyoruz, sadece backend response'unu kullanıyoruz
    try {
      const response = await api.post(`/project-tasks/${taskId}/change_status/`, {
        status: destination.droppableId,
        order: destination.index
      });
      
      // Tamamlandı durumuna geçişte puan mesajı göster
      if (destination.droppableId === 'TAMAMLANDI') {
        toast.success(`🎉 Görev tamamlandı! +${task.points} puan kazandınız!`);
      }
      
      // Response'tan gelen proje verisini kullan (istatistikler güncellenmiş olabilir)
      if (response.data.project) {
        setProject(response.data.project);
      }
      
      // Response'tan gelen görev verisini kullan ve columns'u güncelle
      if (response.data.task) {
        const updatedTask = response.data.task;
        
        console.log('Updated task from backend:', updatedTask);
        console.log('Task status:', updatedTask.status);
        
        // setColumns için callback kullan (güncel state'i al)
        setColumns(prevColumns => {
          const newColumns = {
            YAPILACAK: [...prevColumns.YAPILACAK],
            DEVAM_EDIYOR: [...prevColumns.DEVAM_EDIYOR],
            TAMAMLANDI: [...prevColumns.TAMAMLANDI]
          };
          
          // Eski görevi bul ve kaldır (tüm sütunlardan)
          Object.keys(newColumns).forEach(colKey => {
            newColumns[colKey] = newColumns[colKey].filter(t => t.id !== taskId);
          });
          
          // Yeni duruma göre görevi ekle
          if (updatedTask.status && newColumns[updatedTask.status]) {
            newColumns[updatedTask.status].push(updatedTask);
            
            // Sıralamayı koru
            newColumns[updatedTask.status].sort((a, b) => {
              if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
              }
              return 0;
            });
          } else {
            console.error('Invalid task status:', updatedTask.status);
          }
          
          return newColumns;
        });
      } else {
        // Eğer task verisi yoksa, board'u yeniden yükle
        fetchBoard();
      }
    } catch (error) {
      console.error('Durum değiştirilemedi:', error);
      toast.error('Görev güncellenemedi');
      // Revert
      setColumns(columns);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      DUSUK: 'border-green-500',
      ORTA: 'border-yellow-500',
      YUKSEK: 'border-orange-500'
    };
    return colors[priority] || 'border-gray-500';
  };

  // team_members bir array of IDs
  const isTeamMember = project?.team_members && Array.isArray(project.team_members) 
    ? project.team_members.includes(user?.id)
    : false;
  const isOwner = project?.owner === user?.id;
  const isAdmin = user?.role === 'BASKAN' || user?.role === 'BASKAN_YARDIMCISI';
  const canCreateTask = isOwner || isTeamMember || isAdmin;

  const TaskCard = ({ task, index }) => (
    <Draggable draggableId={task.id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-gray-800 rounded-lg p-2 sm:p-3 md:p-4 mb-2 sm:mb-3 border-l-4 ${getPriorityColor(task.priority)} ${
            snapshot.isDragging ? 'shadow-lg opacity-80' : ''
          } hover:bg-gray-750 transition-all`}
        >
          <div className="flex items-start justify-between mb-1 sm:mb-2">
            <h4 className="text-white font-semibold flex-1 text-xs sm:text-sm md:text-base">{task.title}</h4>
            <span className="text-yellow-500 text-[10px] sm:text-xs font-semibold whitespace-nowrap ml-1 sm:ml-2">
              +{task.points}p
            </span>
          </div>

          {task.description && (
            <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm mb-2 sm:mb-3 line-clamp-2">{task.description}</p>
          )}
          
          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            {task.assigned_to_name ? (
              <div className="flex items-center gap-1 sm:gap-2 bg-blue-900/30 border border-blue-700/50 rounded px-1.5 sm:px-2 py-0.5 sm:py-1">
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <span className="text-blue-300 text-[10px] sm:text-xs font-medium">{task.assigned_to_name}</span>
              </div>
            ) : isTeamMember ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAssignToMe(task.id);
                }}
                className="flex items-center gap-0.5 sm:gap-1 bg-green-900/30 hover:bg-green-800/50 border border-green-700/50 hover:border-green-600 rounded px-1.5 sm:px-2 py-0.5 sm:py-1 transition-all text-[10px] sm:text-xs text-green-400 hover:text-green-300"
              >
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Üzerime Al</span>
                <span className="sm:hidden">Al</span>
              </button>
            ) : (
              <span className="text-gray-500 text-[10px] sm:text-xs">Atanmadı</span>
            )}

            {task.deadline && (
              <span className="text-gray-500 text-[10px] sm:text-xs">
                📅 {new Date(task.deadline).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
              </span>
            )}
          </div>

          {task.is_overdue && (
            <div className="mt-1.5 sm:mt-2 bg-red-900/30 border border-red-600/50 rounded px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs text-red-400">
              ⚠️ Gecikmiş
            </div>
          )}
        </div>
      )}
    </Draggable>
  );

  const getColumnColor = (columnId) => {
    const colors = {
      YAPILACAK: 'from-gray-800 to-gray-900 border-gray-700',
      DEVAM_EDIYOR: 'from-blue-900/50 to-blue-800/50 border-blue-700',
      TAMAMLANDI: 'from-green-900/50 to-green-800/50 border-green-700'
    };
    return colors[columnId] || 'from-gray-800 to-gray-900 border-gray-700';
  };

  const Column = ({ columnId, columnTitle, tasks }) => (
    <div className={`bg-gradient-to-br ${getColumnColor(columnId)} rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 w-full sm:flex-1 sm:min-w-[320px] border shadow-xl`}>
      <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
        <h3 className="text-white font-bold text-sm sm:text-base md:text-lg">{columnTitle}</h3>
        <span className="bg-white/10 text-white text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-semibold">
          {tasks.length}
        </span>
      </div>

      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[200px] sm:min-h-[400px] md:min-h-[500px] transition-colors ${
              snapshot.isDraggingOver ? 'bg-white/5 rounded-lg p-1 sm:p-2' : ''
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))}
            {provided.placeholder}
            {tasks.length === 0 && (
              <div className="flex items-center justify-center h-24 sm:h-32 text-gray-500 text-[10px] sm:text-xs md:text-sm">
                Henüz görev yok
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        </div>
      </Layout>
    );
  }

  if (!project) return null;

  return (
    <Layout>
      <div className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6 px-2 sm:px-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-gray-700">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center text-gray-400 hover:text-white transition-colors mb-2 sm:mb-3 md:mb-4"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-xs sm:text-sm md:text-base">Projelere Dön</span>
        </button>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-4">
          <div className="flex-1 w-full sm:w-auto">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">{project.title}</h1>
              <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs md:text-sm font-semibold ${
                project.status === 'AKTIF' ? 'bg-green-500/20 text-green-400' :
                project.status === 'PLANLAMA' ? 'bg-gray-500/20 text-gray-400' :
                project.status === 'TAMAMLANDI' ? 'bg-blue-500/20 text-blue-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {project.status_display}
              </span>
            </div>
            
            <p className="text-gray-400 text-xs sm:text-sm md:text-base lg:text-lg mb-3 sm:mb-4">{project.description}</p>
            
            <div className="flex items-center gap-2 sm:gap-3 md:gap-6 flex-wrap">
              {project.committee_name && (
                <div className="flex items-center gap-1.5 sm:gap-2 bg-blue-900/30 border border-blue-700/50 rounded-lg px-2 sm:px-3 py-1 sm:py-2">
                  <span className="text-sm sm:text-base md:text-lg">🎯</span>
                  <span className="text-blue-300 font-semibold text-[10px] sm:text-xs md:text-sm">{project.committee_name}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1.5 sm:gap-2 bg-gray-800 rounded-lg px-2 sm:px-3 py-1 sm:py-2">
                <span className="text-sm sm:text-base md:text-lg">👤</span>
                <span className="text-gray-300 text-[10px] sm:text-xs md:text-sm">{project.owner_name}</span>
              </div>
              
              {project.deadline && (
                <div className="flex items-center gap-1.5 sm:gap-2 bg-gray-800 rounded-lg px-2 sm:px-3 py-1 sm:py-2">
                  <span className="text-sm sm:text-base md:text-lg">📅</span>
                  <span className="text-gray-300 text-[10px] sm:text-xs md:text-sm">{new Date(project.deadline).toLocaleDateString('tr-TR')}</span>
                </div>
              )}
            </div>
            
            {/* Team Members */}
            {(project.team_member_names && project.team_member_names.length > 0) && (
              <div className="mt-3 sm:mt-4">
                <h3 className="text-gray-400 text-[10px] sm:text-xs md:text-sm font-semibold mb-1.5 sm:mb-2">Projede Çalışanlar</h3>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {project.team_member_names.map((memberName, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 sm:gap-2 bg-purple-900/30 border border-purple-700/50 rounded-lg px-2 sm:px-3 py-1 sm:py-2"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      <span className="text-purple-300 text-[10px] sm:text-xs md:text-sm font-medium">{memberName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {canCreateTask && (
            <button 
              onClick={() => setShowTaskModal(true)}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 rounded-lg sm:rounded-xl font-semibold transition-all shadow-lg hover:shadow-red-600/50 text-xs sm:text-sm md:text-base"
            >
              + Yeni Görev
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 sm:space-x-1.5 md:space-x-2 bg-gray-900 p-0.5 sm:p-1 md:p-2 rounded-lg sm:rounded-xl border border-gray-800">
        <button
          onClick={() => setActiveTab('board')}
          className={`flex-1 py-1.5 sm:py-2 md:py-2 px-2 sm:px-3 md:px-4 rounded-lg transition-all font-semibold text-[10px] sm:text-xs md:text-sm ${
            activeTab === 'board'
              ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          Kanban Board
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-1.5 sm:py-2 md:py-2 px-2 sm:px-3 md:px-4 rounded-lg transition-all font-semibold text-[10px] sm:text-xs md:text-sm ${
            activeTab === 'chat'
              ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          Proje Sohbeti
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'board' ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <div className="bg-gradient-to-br from-red-900 to-red-800 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-red-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-200 text-[10px] sm:text-xs md:text-sm font-semibold mb-1 sm:mb-2">İlerleme</p>
              <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">{project.completion_percentage}%</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16">
              <svg viewBox="0 0 36 36" className="circular-chart">
                <path
                  className="circle-bg"
                  fill="none"
                  stroke="#7f1d1d"
                  strokeWidth="3"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="circle"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${project.completion_percentage}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-blue-700">
          <p className="text-blue-200 text-[10px] sm:text-xs md:text-sm font-semibold mb-1 sm:mb-2">Toplam Görev</p>
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">{project.task_count}</p>
        </div>

        <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-green-700">
          <p className="text-green-200 text-[10px] sm:text-xs md:text-sm font-semibold mb-1 sm:mb-2">Tamamlanan</p>
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">{project.completed_task_count}</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-900 to-yellow-800 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-yellow-700">
          <p className="text-yellow-200 text-[10px] sm:text-xs md:text-sm font-semibold mb-1 sm:mb-2">Toplam Puan</p>
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">{project.total_points}</p>
        </div>
      </div>

          {/* Kanban Board */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 sm:overflow-x-auto pb-2 sm:pb-3 md:pb-4">
              <Column 
                columnId="YAPILACAK" 
                columnTitle="Yapılacak" 
                tasks={columns.YAPILACAK || []} 
              />
              <Column 
                columnId="DEVAM_EDIYOR" 
                columnTitle="Devam Ediyor" 
                tasks={columns.DEVAM_EDIYOR || []} 
              />
              <Column 
                columnId="TAMAMLANDI" 
                columnTitle="Tamamlandı" 
                tasks={columns.TAMAMLANDI || []} 
              />
            </div>
          </DragDropContext>
        </>
      ) : (
        <>
          {/* Chat Section */}
          <div className="bg-gray-900 rounded-lg sm:rounded-xl border border-gray-800 overflow-hidden" style={{ height: 'calc(100vh - 20rem)' }}>
            {chatLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-red-600 mx-auto"></div>
                  <p className="mt-3 sm:mt-4 text-gray-400 text-xs sm:text-sm">Chat yükleniyor...</p>
                </div>
              </div>
            ) : chatRoom ? (
              <ChatWindow 
                room={chatRoom}
                onBack={() => setActiveTab('board')}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-400 text-xs sm:text-sm">
                  <p>Chat odası yüklenemedi</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
      </div>

      {/* Task Creation Modal */}
      {showTaskModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={() => setShowTaskModal(false)}
        >
          <div 
            className="bg-gray-900 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 max-w-2xl w-full border border-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Yeni Görev Oluştur</h2>
              <button
                onClick={() => setShowTaskModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Görev Başlığı *</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-white text-xs sm:text-sm md:text-base focus:outline-none focus:border-red-600"
                  placeholder="Görev başlığını girin"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Açıklama</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                  rows="4"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-white text-xs sm:text-sm md:text-base focus:outline-none focus:border-red-600"
                  placeholder="Görev detaylarını açıklayın"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                <div>
                  <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Öncelik</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-white text-xs sm:text-sm md:text-base focus:outline-none focus:border-red-600"
                  >
                    <option value="DUSUK">Düşük</option>
                    <option value="ORTA">Orta</option>
                    <option value="YUKSEK">Yüksek</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Puan</label>
                  <input
                    type="number"
                    value={taskForm.points}
                    onChange={(e) => setTaskForm({...taskForm, points: parseInt(e.target.value)})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-white text-xs sm:text-sm md:text-base focus:outline-none focus:border-red-600"
                    min="1"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">Son Tarih</label>
                  <input
                    type="date"
                    value={taskForm.deadline}
                    onChange={(e) => setTaskForm({...taskForm, deadline: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-white text-xs sm:text-sm md:text-base focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-2 sm:p-3 md:p-4">
                <div className="flex items-start gap-1.5 sm:gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-[10px] sm:text-xs md:text-sm text-blue-300">
                    <p className="font-semibold mb-0.5 sm:mb-1">Görev Akışı:</p>
                    <ul className="space-y-0.5 sm:space-y-1 text-blue-200">
                      <li>• Görev oluşturulunca <strong>Yapılacak</strong> sütununa eklenir</li>
                      <li>• Proje üyeleri <strong>"Üzerime Al"</strong> butonuyla görevi kendine atayabilir</li>
                      <li>• Atanan kişi görevi <strong>Devam Ediyor</strong>'ya sürükleyebilir</li>
                      <li>• Bitince <strong>Tamamlandı</strong>'ya taşıyarak puanı kazanır</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-3 md:pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 sm:py-2.5 md:py-3 px-4 sm:px-5 md:px-6 rounded-lg font-semibold transition-all text-xs sm:text-sm md:text-base"
                >
                  Görev Oluştur
                </button>
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-white py-2 sm:py-2.5 md:py-3 px-4 sm:px-5 md:px-6 rounded-lg font-semibold transition-all text-xs sm:text-sm md:text-base"
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
