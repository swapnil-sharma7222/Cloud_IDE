
interface VideoChatProps {
  roomId: string
}

const VideoChat: React.FC<VideoChatProps> = ({ roomId }) => {
  return (
    <div>
      {/* Video chat UI goes here */}
      <h2>Video Chat Component</h2>
    </div>
  );
};

export default VideoChat;

