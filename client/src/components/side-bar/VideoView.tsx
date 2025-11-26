import { useParams } from "react-router-dom";
import VideoChat from "./video-chat";
interface VideoViewProps {
  isInRoom: boolean
}

const VideoView: React.FC<VideoViewProps> = ({ isInRoom }) => {
  const { roomId } = useParams<{ roomId?: string }>()
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* ✅ Conditionally render video chat only when in room */}
      {isInRoom && (
        <div style={{
          height: '200px',
          borderBottom: '1px solid #ccc',
          backgroundColor: '#000'
        }}>
          <VideoChat roomId={roomId} />
        </div>
      )}
    </div>
  );
};

export default VideoView;