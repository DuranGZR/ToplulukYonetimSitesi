/**
 * Custom React Hooks for WebSocket connections
 * Provides easy-to-use hooks for real-time features
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  connectNotifications,
  connectProjectBoard,
  connectCommitteeChat,
  markNotificationRead,
  sendTaskUpdate,
  sendTaskMove,
  sendTaskAssignment,
  sendTypingIndicator,
  sendChatMessage,
  sendChatTyping,
  disconnectProjectBoard,
  disconnectCommitteeChat,
  disconnectNotifications
} from '../services/websocket';

/**
 * Hook for real-time notifications
 */
export const useNotificationWebSocket = () => {
  const [notifications, setNotifications] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Map());

  useEffect(() => {
    connectNotifications(
      // On new notification
      (notification) => {
        setNotifications(prev => [notification, ...prev]);
        
        // Show browser notification if permitted
        if (Notification.permission === 'granted') {
          new Notification('HSD Platform', {
            body: notification.message,
            icon: '/logo.png'
          });
        }
      },
      // On user status update
      (statusData) => {
        setOnlineUsers(prev => {
          const newMap = new Map(prev);
          newMap.set(statusData.user_id, {
            username: statusData.username,
            is_online: statusData.is_online
          });
          return newMap;
        });
      }
    );

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      disconnectNotifications();
    };
  }, []);

  const markAsRead = useCallback((notificationId) => {
    markNotificationRead(notificationId);
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
  }, []);

  return {
    notifications,
    onlineUsers,
    markAsRead
  };
};

/**
 * Hook for real-time project board updates
 */
export const useProjectBoardWebSocket = (projectId) => {
  const [activeUsers, setActiveUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [taskUpdates, setTaskUpdates] = useState([]);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!projectId) return;

    connectProjectBoard(projectId, {
      onUserJoined: (data) => {
        setActiveUsers(prev => {
          if (!prev.find(u => u.user_id === data.user_id)) {
            return [...prev, data];
          }
          return prev;
        });
      },
      onUserLeft: (data) => {
        setActiveUsers(prev => prev.filter(u => u.user_id !== data.user_id));
      },
      onTaskUpdated: (data) => {
        setTaskUpdates(prev => [...prev, data]);
      },
      onTaskMoved: (data) => {
        setTaskUpdates(prev => [...prev, data]);
      },
      onTaskAssigned: (data) => {
        setTaskUpdates(prev => [...prev, data]);
      },
      onTyping: (data) => {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (data.is_typing) {
            newSet.add(data.username);
          } else {
            newSet.delete(data.username);
          }
          return newSet;
        });

        // Auto-clear typing indicator after 3 seconds
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.username);
            return newSet;
          });
        }, 3000);
      }
    });

    return () => {
      disconnectProjectBoard(projectId);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [projectId]);

  const broadcastTaskUpdate = useCallback((task) => {
    sendTaskUpdate(projectId, task);
  }, [projectId]);

  const broadcastTaskMove = useCallback((taskId, fromStatus, toStatus) => {
    sendTaskMove(projectId, taskId, fromStatus, toStatus);
  }, [projectId]);

  const broadcastTaskAssignment = useCallback((taskId, assignedTo) => {
    sendTaskAssignment(projectId, taskId, assignedTo);
  }, [projectId]);

  const setTyping = useCallback((isTyping) => {
    sendTypingIndicator(projectId, isTyping);
  }, [projectId]);

  return {
    activeUsers,
    typingUsers: Array.from(typingUsers),
    taskUpdates,
    broadcastTaskUpdate,
    broadcastTaskMove,
    broadcastTaskAssignment,
    setTyping
  };
};

/**
 * Hook for committee chat
 */
export const useCommitteeChatWebSocket = (committeeId) => {
  const [messages, setMessages] = useState([]);
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!committeeId) return;

    connectCommitteeChat(committeeId, {
      onMessage: (message) => {
        setMessages(prev => [...prev, message]);
      },
      onUserOnline: (data) => {
        setOnlineMembers(prev => {
          if (!prev.find(m => m.user_id === data.user_id)) {
            return [...prev, data];
          }
          return prev;
        });
      },
      onUserOffline: (data) => {
        setOnlineMembers(prev => prev.filter(m => m.user_id !== data.user_id));
      },
      onTyping: (data) => {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (data.is_typing) {
            newSet.add(data.username);
          } else {
            newSet.delete(data.username);
          }
          return newSet;
        });

        // Auto-clear typing after 3 seconds
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.username);
            return newSet;
          });
        }, 3000);
      },
      onOnlineMembers: (members) => {
        setOnlineMembers(members);
      }
    });

    return () => {
      disconnectCommitteeChat(committeeId);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [committeeId]);

  const sendMessage = useCallback((message) => {
    sendChatMessage(committeeId, message);
  }, [committeeId]);

  const setTyping = useCallback((isTyping) => {
    sendChatTyping(committeeId, isTyping);
  }, [committeeId]);

  return {
    messages,
    onlineMembers,
    typingUsers: Array.from(typingUsers),
    sendMessage,
    setTyping
  };
};
