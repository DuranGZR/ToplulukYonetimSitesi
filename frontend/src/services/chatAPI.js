/**
 * Chat API Service for HSD Platform
 * Handles REST API calls for chat functionality
 */

import axios from 'axios';
import { BACKEND_URL } from '../config';

const API_BASE_URL = `${BACKEND_URL}/api/v1/chats`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const chatAPI = {
  /**
   * Get user's chat rooms (categorized)
   */
  getMyRooms: async () => {
    const response = await api.get('/rooms/my_rooms/');
    return response.data;
  },

  /**
   * Get messages for a specific room
   * @param {number} roomId - Chat room ID
   * @param {number} page - Page number (default: 1)
   */
  getRoomMessages: async (roomId, page = 1) => {
    const response = await api.get('/messages/', {
      params: { room: roomId, page }
    });
    return response.data;
  },

  /**
   * Create a private chat room with another user
   * @param {number} userId - Other user's ID
   */
  createPrivateRoom: async (userId) => {
    const response = await api.post('/rooms/create_private_room/', {
      user_id: userId
    });
    return response.data;
  },

  /**
   * Mark a specific message as read
   * @param {number} messageId - Message ID
   */
  markMessageRead: async (messageId) => {
    const response = await api.post(`/messages/${messageId}/mark_read/`);
    return response.data;
  },

  /**
   * Mark all messages in a room as read
   * @param {number} roomId - Chat room ID
   */
  markRoomRead: async (roomId) => {
    const response = await api.post('/messages/mark_room_read/', {
      room_id: roomId
    });
    return response.data;
  },

  /**
   * Search users for private chat
   * @param {string} query - Search query
   */
  searchUsers: async (query) => {
    const response = await axios.get(`${BACKEND_URL}/api/v1/users/search/`, {
      params: { q: query },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
      }
    });
    return response.data;
  },

  /**
   * Get or create project chat room
   * @param {number} projectId - Project ID
   */
  getProjectRoom: async (projectId) => {
    const response = await api.get('/rooms/get_project_room/', {
      params: { project_id: projectId }
    });
    return response.data;
  },
};
