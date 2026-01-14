/**
 * Chat Service for HSD Platform
 * Handles WebSocket connections for unified chat system
 * Supports: General chat, Committee chats, Private messages
 */

class ChatService {
  constructor() {
    this.connections = new Map(); // room_id -> connection
    this.listeners = new Map(); // room_id -> Set of callbacks
  }

  /**
   * Connect to a chat room
   * @param {number} roomId - Chat room ID
   * @param {Function} onMessage - Callback for incoming messages
   * @param {Function} onTyping - Callback for typing indicators
   * @param {Function} onUserJoined - Callback when user joins
   * @param {Function} onUserLeft - Callback when user leaves
   */
  connectRoom(roomId, { onMessage, onTyping, onUserJoined, onUserLeft } = {}) {
    const token = localStorage.getItem('accessToken');
    const currentUserId = JSON.parse(localStorage.getItem('user') || '{}').id;
    
    // Eğer zaten bağlıysa ve token/user değişmemişse, sadece listener ekle
    if (this.connections.has(roomId)) {
      const existingConnection = this.connections.get(roomId);
      const existingToken = existingConnection._token;
      const existingUserId = existingConnection._userId;
      
      // Token veya user değişmişse, bağlantıyı kapat ve yeniden kur
      if (existingToken !== token || existingUserId !== currentUserId) {
        console.log('🔄 Token or user changed, reconnecting WebSocket...');
        existingConnection.close();
        this.connections.delete(roomId);
        this.listeners.delete(roomId);
      } else {
        // Aynı token ve user, sadece listener ekle
        const callbacks = { onMessage, onTyping, onUserJoined, onUserLeft };
        if (!this.listeners.has(roomId)) {
          this.listeners.set(roomId, new Set());
        }
        this.listeners.get(roomId).add(callbacks);
        return;
      }
    }

    const wsUrl = `ws://localhost:8000/ws/chat/${roomId}/?token=${token}`;
    const ws = new WebSocket(wsUrl);
    
    // Token ve user bilgisini bağlantıya ekle
    ws._token = token;
    ws._userId = currentUserId;
    
    ws.onopen = () => {
      console.log(`✅ Chat connected: Room ${roomId}`);
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Broadcast to all listeners for this room
      const roomListeners = this.listeners.get(roomId) || new Set();
      
      switch (data.type) {
        case 'chat_message':
          roomListeners.forEach(listener => {
            if (listener.onMessage) listener.onMessage(data.message);
          });
          break;
          
        case 'typing':
          roomListeners.forEach(listener => {
            if (listener.onTyping) {
              listener.onTyping(data.user_id, data.username, data.is_typing);
            }
          });
          break;
          
        case 'user_joined':
          roomListeners.forEach(listener => {
            if (listener.onUserJoined) {
              listener.onUserJoined({
                id: data.user_id,
                username: data.username,
                full_name: data.full_name,
                profile_image: data.profile_image
              });
            }
          });
          break;
          
        case 'user_left':
          roomListeners.forEach(listener => {
            if (listener.onUserLeft) {
              listener.onUserLeft(data.user_id, data.username);
            }
          });
          break;
          
        case 'online_members':
          roomListeners.forEach(listener => {
            if (listener.onOnlineMembers) {
              listener.onOnlineMembers(data.members);
            }
          });
          break;
          
        case 'error':
          console.error('Chat WebSocket error:', data.message);
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('Chat WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log(`❌ Chat disconnected: Room ${roomId}`);
      this.connections.delete(roomId);
      this.listeners.delete(roomId);
      
      // Auto-reconnect after 3 seconds if listeners still exist
      const roomListeners = this.listeners.get(roomId);
      if (roomListeners && roomListeners.size > 0) {
        setTimeout(() => {
          console.log(`🔄 Auto-reconnecting to Room ${roomId}`);
          // Re-establish connection with existing listeners
          roomListeners.forEach(listener => {
            this.connectRoom(roomId, listener);
          });
        }, 3000);
      }
    };

    this.connections.set(roomId, ws);
    
    // Add initial listener
    const callbacks = { onMessage, onTyping, onUserJoined, onUserLeft };
    if (!this.listeners.has(roomId)) {
      this.listeners.set(roomId, new Set());
    }
    this.listeners.get(roomId).add(callbacks);
  }

  /**
   * Send a message to a chat room
   * @param {number} roomId - Chat room ID
   * @param {string} message - Message text
   * @returns {boolean} Whether the message was sent successfully
   */
  sendMessage(roomId, message) {
    const ws = this.connections.get(roomId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log('📤 Sending via WebSocket:', { roomId, message });
      ws.send(JSON.stringify({
        type: 'chat_message',
        message: message
      }));
      return true;
    } else {
      console.error('❌ WebSocket not connected for room', roomId, 'State:', ws?.readyState);
      return false;
    }
  }

  /**
   * Send typing indicator
   * @param {number} roomId - Chat room ID
   * @param {boolean} isTyping - Whether user is typing
   */
  sendTyping(roomId, isTyping = true) {
    const ws = this.connections.get(roomId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'typing',
        is_typing: isTyping
      }));
    }
  }

  /**
   * Request online members in room
   * @param {number} roomId - Chat room ID
   */
  getOnlineMembers(roomId) {
    const ws = this.connections.get(roomId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'get_online_members'
      }));
    }
  }

  /**
   * Disconnect from a chat room - Memory leak safe
   * @param {number} roomId - Chat room ID
   * @param {Object} callbacks - The specific listener to remove
   */
  disconnectRoom(roomId, callbacks = null) {
    if (callbacks) {
      // Remove specific listener
      const listeners = this.listeners.get(roomId);
      if (listeners) {
        listeners.delete(callbacks);
        
        // If no more listeners, close connection and cleanup
        if (listeners.size === 0) {
          const ws = this.connections.get(roomId);
          if (ws) {
            // Prevent onclose from triggering auto-reconnect
            ws.onclose = null;
            ws.close();
          }
          this.connections.delete(roomId);
          this.listeners.delete(roomId);
          console.log(`🧹 Cleaned up Room ${roomId} - no more listeners`);
        }
      }
    } else {
      // Close connection entirely
      const ws = this.connections.get(roomId);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
      this.connections.delete(roomId);
      this.listeners.delete(roomId);
      console.log(`🧹 Force disconnected Room ${roomId}`);
    }
  }

  /**
   * Disconnect from all rooms
   */
  disconnectAll() {
    this.connections.forEach((ws, roomId) => {
      ws.close();
    });
    this.connections.clear();
    this.listeners.clear();
  }

  /**
   * Check if connected to a room
   * @param {number} roomId - Chat room ID
   */
  isConnected(roomId) {
    const ws = this.connections.get(roomId);
    return ws && ws.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const chatService = new ChatService();
