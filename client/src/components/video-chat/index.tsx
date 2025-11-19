import { useCallback, useState } from "react";
import { useSocket } from "../../contexts/SocketContext";
import { useNavigate } from "react-router-dom";

function generateRoomId(): string {
  return `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const VideoChat: React.FC = ({ isInRoom }) => {
  const { socket, isConnected, userId } = useSocket();
  const navigate = useNavigate();
  const [shareableLink, setShareableLink] = useState<string>('');

  

  const handleShareProject = () => {
    const newRoomId = generateRoomId();
    const link = `${window.location.origin}/${userId}/dashboard/${newRoomId}`;
    setShareableLink(link);
    socket?.emit("join-room", { roomId: newRoomId, userId, link });

    // navigate(`/${userId}/dashboard/${newRoomId}`);

    
    navigator.clipboard.writeText(link);
    alert(`Room created! Link copied to clipboard:\n${link}`);
  };

  return (
    <div>
      {!isInRoom ? (
        // ✅ Show "Share" button when NOT in room
        <button
          onClick={handleShareProject}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          📤 Share Project
        </button>
      ) : (
        // ✅ Show room info and "Exit" button when IN room
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: '#aaa' }}>
            🔴 Room: {roomId}
          </span>
          <button
            onClick={handleExitRoom}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🚪 Exit Room
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoChat;

