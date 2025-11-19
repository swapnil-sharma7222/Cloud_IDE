import VideoChat from "../video-chat";

const VideoView: React.FC = () => {
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