import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import SkeletonLoader from '../components/SkeletonLoader';

export default function CalendarPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
      
      const response = await api.get(`/calendar/?year=${year}&month=${month}`);
      setCalendarEvents(response.data.events || []);
    } catch (error) {
      console.error('Takvim verileri yüklenemedi:', error);
      toast.error('Takvim verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Adjust for Monday as first day (0 = Monday)
    const adjustedStartingDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
    
    const days = [];
    
    // Previous month's days (to fill the first week)
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = adjustedStartingDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
        isToday: false
      });
    }
    
    // Current month's days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString()
      });
    }
    
    // Next month's days (to fill the last week)
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
        isToday: false
      });
    }
    
    return days;
  };

  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return calendarEvents.filter(event => {
      const eventDate = new Date(event.start).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  const handleEventClick = (event) => {
    if (event.type === 'event') {
      navigate(`/events/${event.id.replace('event_', '')}`);
    } else if (event.type === 'meeting') {
      navigate(`/meetings/${event.id.replace('meeting_', '')}`);
    } else if (event.type === 'task') {
      navigate(`/tasks/${event.id.replace('task_', '')}`);
    }
  };

  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  const days = getDaysInMonth(currentDate);
  const monthName = monthNames[currentDate.getMonth()];
  const year = currentDate.getFullYear();

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6 px-2 sm:px-4 pb-4 sm:pb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 md:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-0.5 sm:mb-1 md:mb-2 text-white">
              Takvim
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-400">Etkinlikler, toplantılar ve görev deadline'ları</p>
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="bg-gray-900 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border border-gray-800">
          <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-1.5 sm:p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-all flex-shrink-0"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 justify-center min-w-0">
              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white truncate">
                {monthName} {year}
              </h2>
              <button
                onClick={goToToday}
                className="px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] sm:text-xs md:text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0"
              >
                Bugün
              </button>
            </div>
            
            <button
              onClick={() => navigateMonth(1)}
              className="p-1.5 sm:p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-all flex-shrink-0"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 md:gap-6 bg-gray-900 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border border-gray-800">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-600 rounded flex-shrink-0"></div>
            <span className="text-[10px] sm:text-xs md:text-sm text-gray-300">Etkinlik</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-600 rounded flex-shrink-0"></div>
            <span className="text-[10px] sm:text-xs md:text-sm text-gray-300">Toplantı</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded flex-shrink-0"></div>
            <span className="text-[10px] sm:text-xs md:text-sm text-gray-300">Görev Deadline</span>
          </div>
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="bg-gray-900 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 border border-gray-800">
            <SkeletonLoader type="card" count={1} />
          </div>
        ) : (
          <div className="bg-gray-900 rounded-lg sm:rounded-xl p-1 sm:p-2 md:p-3 lg:p-4 border border-gray-800">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1 md:gap-1.5 lg:gap-2 mb-0.5 sm:mb-1 md:mb-2">
              {dayNames.map((day, index) => (
                <div
                  key={index}
                  className="text-center text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-semibold text-gray-400 py-0.5 sm:py-1 md:py-1.5 lg:py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1 md:gap-1.5 lg:gap-2">
              {days.map((day, index) => {
                const dayEvents = getEventsForDate(day.date);
                const isSelected = selectedDate && day.date.toDateString() === selectedDate.toDateString();
                
                return (
                  <div
                    key={index}
                    onClick={() => setSelectedDate(day.date)}
                    className={`
                      min-h-[50px] sm:min-h-[65px] md:min-h-[80px] lg:min-h-[100px] p-0.5 sm:p-1 md:p-1.5 lg:p-2 rounded border transition-all cursor-pointer
                      ${day.isCurrentMonth ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-gray-900/50 border-gray-800 opacity-50'}
                      ${day.isToday ? 'ring-1 ring-blue-600' : ''}
                      ${isSelected ? 'ring-1 ring-blue-500' : ''}
                    `}
                  >
                    <div className={`text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-semibold mb-0.5 ${day.isCurrentMonth ? 'text-white' : 'text-gray-600'} ${day.isToday ? 'text-blue-400' : ''}`}>
                      {day.date.getDate()}
                    </div>
                    
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 1).map((event, eventIndex) => (
                        <div
                          key={eventIndex}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                          className={`
                            text-[7px] sm:text-[8px] md:text-[10px] lg:text-xs px-0.5 sm:px-1 md:px-1.5 lg:px-2 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-all
                            ${event.type === 'event' ? 'bg-red-600 text-white' : ''}
                            ${event.type === 'meeting' ? 'bg-blue-600 text-white' : ''}
                            ${event.type === 'task' ? 'bg-yellow-500 text-gray-900' : ''}
                          `}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 1 && (
                        <div className="text-[7px] sm:text-[8px] md:text-[10px] lg:text-xs text-gray-400 px-0.5 sm:px-1">
                          +{dayEvents.length - 1} daha
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Date Events Modal */}
        {selectedDate && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
            onClick={() => setSelectedDate(null)}
          >
            <div 
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 lg:p-6 max-w-md sm:max-w-lg md:max-w-2xl w-full border border-gray-700 shadow-2xl max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4 lg:mb-6 gap-2">
                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-white truncate">
                  {selectedDate.toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </h3>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-gray-400 hover:text-white p-0.5 sm:p-1 flex-shrink-0"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
                {getEventsForDate(selectedDate).length === 0 ? (
                  <p className="text-gray-400 text-center py-4 sm:py-6 md:py-8 text-xs sm:text-sm md:text-base">Bu tarihte etkinlik yok</p>
                ) : (
                  getEventsForDate(selectedDate).map((event) => (
                    <div
                      key={event.id}
                      onClick={() => {
                        handleEventClick(event);
                        setSelectedDate(null);
                      }}
                      className={`
                        p-2 sm:p-2.5 md:p-3 lg:p-4 rounded-lg border cursor-pointer hover:scale-[1.02] transition-all
                        ${event.type === 'event' ? 'bg-red-900/30 border-red-600 hover:border-red-500' : ''}
                        ${event.type === 'meeting' ? 'bg-blue-900/30 border-blue-600 hover:border-blue-500' : ''}
                        ${event.type === 'task' ? 'bg-yellow-900/30 border-yellow-500 hover:border-yellow-400' : ''}
                      `}
                    >
                      <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold mb-0.5 sm:mb-1 text-xs sm:text-sm md:text-base truncate">{event.title}</h4>
                          {event.description && (
                            <p className="text-gray-400 text-[9px] sm:text-[10px] md:text-xs lg:text-sm line-clamp-2">{event.description}</p>
                          )}
                          <p className="text-gray-500 text-[9px] sm:text-[10px] md:text-xs mt-0.5 sm:mt-1 md:mt-2">
                            {new Date(event.start).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                            {event.end && event.end !== event.start && (
                              <> - {new Date(event.end).toLocaleTimeString('tr-TR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</>
                            )}
                          </p>
                          {event.committee && (
                            <p className="text-gray-500 text-[9px] sm:text-[10px] md:text-xs mt-0.5 sm:mt-1 truncate">Komite: {event.committee}</p>
                          )}
                        </div>
                        <div className={`
                          w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full ml-1.5 sm:ml-2 md:ml-4 flex-shrink-0 mt-0.5 sm:mt-1
                          ${event.type === 'event' ? 'bg-red-600' : ''}
                          ${event.type === 'meeting' ? 'bg-blue-600' : ''}
                          ${event.type === 'task' ? 'bg-yellow-500' : ''}
                        `}></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

