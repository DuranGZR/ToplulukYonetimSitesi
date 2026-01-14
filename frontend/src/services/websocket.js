/**
 * WebSocket Service for HSD Platform
 * Handles real-time connections for notifications, project boards, and committee chats
 */

class WebSocketService {
  constructor() {
    this.connections = new Map(); // Store multiple WebSocket connections
    this.reconnectAttempts = new Map();
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000; // 3 seconds
  }

  /**
   * Connect to a WebSocket endpoint
   * @param {string} endpoint - WebSocket endpoint path
   * @param {object} handlers - Event handlers {onMessage, onOpen, onClose, onError}
   * @returns {WebSocket} WebSocket connection instance
   */
  connect(endpoint, handlers = {}) {
    // Close existing connection if any
    if (this.connections.has(endpoint)) {
      this.disconnect(endpoint);
    }

    const token = localStorage.getItem('access_token');
    const wsUrl = `ws://localhost:8000/ws/${endpoint}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = (event) => {
      console.log(`✅ WebSocket connected: ${endpoint}`);
      this.reconnectAttempts.set(endpoint, 0);
      
      if (handlers.onOpen) {
        handlers.onOpen(event);
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (handlers.onMessage) {
          handlers.onMessage(data);
        }
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error(`❌ WebSocket error on ${endpoint}:`, error);
      
      if (handlers.onError) {
        handlers.onError(error);
      }
    };

    ws.onclose = (event) => {
      console.log(`🔌 WebSocket closed: ${endpoint}`, event.code, event.reason);
      this.connections.delete(endpoint);
      
      if (handlers.onClose) {
        handlers.onClose(event);
      }

      // Auto-reconnect logic
      if (event.code !== 1000) { // 1000 = normal closure
        this.attemptReconnect(endpoint, handlers);
      }
    };

    this.connections.set(endpoint, ws);
    return ws;
  }

  /**
   * Attempt to reconnect to WebSocket
   */
  attemptReconnect(endpoint, handlers) {
    const attempts = this.reconnectAttempts.get(endpoint) || 0;
    
    if (attempts < this.maxReconnectAttempts) {
      this.reconnectAttempts.set(endpoint, attempts + 1);
      
      console.log(`🔄 Reconnecting to ${endpoint}... (Attempt ${attempts + 1}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(endpoint, handlers);
      }, this.reconnectDelay);
    } else {
      console.error(`❌ Max reconnect attempts reached for ${endpoint}`);
    }
  }

  /**
   * Send message through WebSocket
   */
  send(endpoint, data) {
    const ws = this.connections.get(endpoint);
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
      return true;
    } else {
      console.warn(`WebSocket not ready for ${endpoint}`);
      return false;
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(endpoint) {
    const ws = this.connections.get(endpoint);
    
    if (ws) {
      ws.close(1000, 'Client disconnecting');
      this.connections.delete(endpoint);
      this.reconnectAttempts.delete(endpoint);
    }
  }

  /**
   * Disconnect all WebSocket connections
   */
  disconnectAll() {
    this.connections.forEach((ws, endpoint) => {
      this.disconnect(endpoint);
    });
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(endpoint) {
    const ws = this.connections.get(endpoint);
    return ws && ws.readyState === WebSocket.OPEN;
  }
}

// Create singleton instance
const wsService = new WebSocketService();

export default wsService;


/**
 * Notification WebSocket Hook
 * Usage: const { notifications, markAsRead } = useNotificationWebSocket();
 */
export const connectNotifications = (onNotification, onStatusUpdate) => {
  return wsService.connect('notifications/', {
    onMessage: (data) => {
      if (data.type === 'notification' && onNotification) {
        onNotification(data.notification);
      } else if (data.type === 'user_status' && onStatusUpdate) {
        onStatusUpdate(data);
      }
    },
    onOpen: () => {
      console.log('🔔 Notification service connected');
    }
  });
};

export const markNotificationRead = (notificationId) => {
  wsService.send('notifications/', {
    type: 'mark_read',
    notification_id: notificationId
  });
};


/**
 * Project Board WebSocket Functions
 */
export const connectProjectBoard = (projectId, handlers) => {
  return wsService.connect(`project/${projectId}/`, {
    onMessage: (data) => {
      switch (data.type) {
        case 'user_joined':
          handlers.onUserJoined?.(data);
          break;
        case 'user_left':
          handlers.onUserLeft?.(data);
          break;
        case 'task_updated':
          handlers.onTaskUpdated?.(data);
          break;
        case 'task_moved':
          handlers.onTaskMoved?.(data);
          break;
        case 'task_assigned':
          handlers.onTaskAssigned?.(data);
          break;
        case 'typing':
          handlers.onTyping?.(data);
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    },
    onOpen: () => {
      console.log(`📋 Connected to project board ${projectId}`);
    }
  });
};

export const sendTaskUpdate = (projectId, task) => {
  wsService.send(`project/${projectId}/`, {
    type: 'task_update',
    task
  });
};

export const sendTaskMove = (projectId, taskId, fromStatus, toStatus) => {
  wsService.send(`project/${projectId}/`, {
    type: 'task_move',
    task_id: taskId,
    from_status: fromStatus,
    to_status: toStatus
  });
};

export const sendTaskAssignment = (projectId, taskId, assignedTo) => {
  wsService.send(`project/${projectId}/`, {
    type: 'task_assigned',
    task_id: taskId,
    assigned_to: assignedTo
  });
};

export const sendTypingIndicator = (projectId, isTyping) => {
  wsService.send(`project/${projectId}/`, {
    type: 'typing',
    is_typing: isTyping
  });
};


/**
 * Committee Chat WebSocket Functions
 */
export const connectCommitteeChat = (committeeId, handlers) => {
  return wsService.connect(`committee/${committeeId}/`, {
    onMessage: (data) => {
      switch (data.type) {
        case 'chat_message':
          handlers.onMessage?.(data.message);
          break;
        case 'user_online':
          handlers.onUserOnline?.(data);
          break;
        case 'user_offline':
          handlers.onUserOffline?.(data);
          break;
        case 'typing':
          handlers.onTyping?.(data);
          break;
        case 'online_members':
          handlers.onOnlineMembers?.(data.members);
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    },
    onOpen: () => {
      console.log(`💬 Connected to committee chat ${committeeId}`);
      // Request online members list
      wsService.send(`committee/${committeeId}/`, {
        type: 'get_online_members'
      });
    }
  });
};

export const sendChatMessage = (committeeId, message) => {
  wsService.send(`committee/${committeeId}/`, {
    type: 'chat_message',
    message
  });
};

export const sendChatTyping = (committeeId, isTyping) => {
  wsService.send(`committee/${committeeId}/`, {
    type: 'typing',
    is_typing: isTyping
  });
};

export const disconnectProjectBoard = (projectId) => {
  wsService.disconnect(`project/${projectId}/`);
};

export const disconnectCommitteeChat = (committeeId) => {
  wsService.disconnect(`committee/${committeeId}/`);
};

export const disconnectNotifications = () => {
  wsService.disconnect('notifications/');
};
