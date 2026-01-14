/**
 * Real-time Active Users Component
 * Shows who is currently viewing the project board
 */

import { useProjectBoardWebSocket } from '../../hooks/useWebSocket';

const ActiveUsers = ({ projectId }) => {
  const { activeUsers, typingUsers } = useProjectBoardWebSocket(projectId);

  return (
    <div className="flex items-center space-x-2">
      {/* Active Users Avatars */}
      <div className="flex -space-x-2">
        {activeUsers.slice(0, 5).map((user) => (
          <div
            key={user.user_id}
            className="relative group"
            title={user.full_name}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-xs font-medium border-2 border-gray-900">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            {/* Online indicator */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-gray-900 rounded-full"></span>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {user.full_name}
            </div>
          </div>
        ))}
        {activeUsers.length > 5 && (
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-medium border-2 border-gray-900">
            +{activeUsers.length - 5}
          </div>
        )}
      </div>

      {/* Active Users Count */}
      <span className="text-sm text-gray-400">
        {activeUsers.length} {activeUsers.length === 1 ? 'kişi' : 'kişi'} aktif
      </span>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="flex items-center space-x-1 text-sm text-gray-400 ml-4">
          <div className="flex space-x-1">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
          </div>
          <span>
            {typingUsers.length === 1
              ? `${typingUsers[0]} yazıyor...`
              : `${typingUsers.length} kişi yazıyor...`}
          </span>
        </div>
      )}
    </div>
  );
};

export default ActiveUsers;
