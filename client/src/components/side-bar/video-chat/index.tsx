import { useCallback, useState, useRef, useEffect } from "react";
import { peerService } from "../../../service/peerService";
import { useSocket } from "../../../contexts/SocketContext";
import { useParams } from "react-router-dom";

const VideoChat: React.FC<{ isInRoom?: boolean }> = ({ isInRoom }) => {
  const { socket } = useSocket();
  const { roomId } = useParams<{ roomId: string }>();

  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const isNegotiatingRef = useRef(false);
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);

  // Update setupPeerHandlers
  const setupPeerHandlers = useCallback((pc: RTCPeerConnection) => {
    pc.ontrack = (event) => {
      console.log('[TRACK] received remote track');
      const [stream] = event.streams;
      setRemoteStream(stream);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socket && roomId && isInRoom) {
        socket.emit('webrtc:ice-candidate', { roomId, candidate: event.candidate });
        console.log('[ICE] sent candidate');
      }
    };

    pc.onnegotiationneeded = async () => {
      if (isNegotiatingRef.current || pc.signalingState !== 'stable') {
        console.log('[NEGOTIATION] skipping - busy or unstable');
        return;
      }

      try {
        isNegotiatingRef.current = true;
        console.log('[NEGOTIATION] creating offer');
        const offer = await peerService.getOffer();
        console.log('[OFFER] created', offer.type);
        if (socket && isInRoom && roomId) {
          socket.emit('webRTC-offer', { roomId, offer });
          console.log('[OFFER] emitted');
        }
      } catch (err) {
        console.error('[NEGOTIATION] failed', err);
      } finally {
        isNegotiatingRef.current = false;
      }
    };

    pc.onsignalingstatechange = () => {
      console.log('[SIGNALING]', pc.signalingState);
      if (pc.signalingState === 'stable') {
        isNegotiatingRef.current = false;
      }
    };
  }, [socket, roomId, isInRoom]);

  const handleVideo = useCallback(async () => {
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
        setMediaStream(null);
      }

      const pc = peerService.ensurePeer();
      setupPeerHandlers(pc);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      mediaStreamRef.current = stream; 
      setMediaStream(stream);
      setIsStreaming(true);

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
        console.log('[TRACK] added', track.kind);
      });
      console.log('[MEDIA] tracks added, negotiationneeded should fire...');
    } catch (error) {
      console.error('[ERROR] Failed to get media stream:', error);
      alert('Failed to access camera/microphone. Please grant permissions.');
      setIsStreaming(false);
      setMediaStream(null);
      mediaStreamRef.current = null;
    }
  }, [setupPeerHandlers]); 

  const handleIncomingOffer = useCallback(async (data: { from: string; offer: RTCSessionDescriptionInit }) => {
    const { from, offer } = data;
    console.log('[OFFER] received from', from);

    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
        setMediaStream(null);
      }

      const pc = peerService.ensurePeer();
      await peerService.setRemoteDescription(offer);
      console.log('[OFFER] set remote description');

      // Process queued ICE candidates
      for (const candidate of iceCandidateQueue.current) {
        await peerService.addIceCandidate(candidate);
      }
      iceCandidateQueue.current = [];
      setupPeerHandlers(pc);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });

      mediaStreamRef.current = stream;
      setMediaStream(stream);
      setIsStreaming(true);

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
        console.log('[TRACK] added', track.kind);
      });

      const answer = await peerService.getAnswer();
      console.log('[ANSWER] created');

      if (socket && isInRoom && roomId) {
        socket.emit("webRTC-answer", {
          roomId,
          answer,
          to: from
        });
        console.log('[ANSWER] sent to', from);
      }
    } catch (error) {
      console.error('[ERROR] Failed to handle incoming offer:', error);
    }
  }, [socket, roomId, isInRoom, setupPeerHandlers]); 

  const handleIncomingAnswer = useCallback(async ({ answer, from }: { answer: RTCSessionDescriptionInit; from?: string }) => {
    console.log('[ANSWER] received from', from);

    try {
      await peerService.setRemoteDescription(answer);
      isNegotiatingRef.current = false;
      console.log('[ANSWER] set remote description - connection established');
      for (const candidate of iceCandidateQueue.current) {
        await peerService.addIceCandidate(candidate);
      }
      iceCandidateQueue.current = [];
      console.log('[ANSWER] set - connected');
    } catch (error) {
      console.error('[ERROR] Failed to handle incoming answer', error);
    }
  }, []);

  const handleIncomingIceCandidate = useCallback(async ({ candidate, from }: { candidate: RTCIceCandidateInit; from?: string }) => {
    console.log('[ICE] received candidate from', from);

    const pc = peerService.peer;
    if (!pc) return;
    if (!pc.remoteDescription) {
      console.log('[ICE] queuing - no remote description');
      iceCandidateQueue.current.push(candidate);
      return;
    }

    for (const queued of iceCandidateQueue.current) {
      await peerService.addIceCandidate(queued);
    }
    iceCandidateQueue.current = [];

    try {
      if (pc.remoteDescription) {
        await peerService.addIceCandidate(candidate);
        console.log('[ICE] added candidate');
      } else {
        console.warn('[ICE] cannot add candidate - no remote description yet');
      }
    } catch (error) {
      console.error('[ERROR] Failed to add ICE candidate:', error);
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("webRTC-offer", handleIncomingOffer);
    socket.on("webRTC-answer", handleIncomingAnswer);
    socket.on("webrtc:ice-candidate", handleIncomingIceCandidate);

    return () => {
      socket.off("webRTC-offer", handleIncomingOffer);
      socket.off("webRTC-answer", handleIncomingAnswer);
      socket.off("webrtc:ice-candidate", handleIncomingIceCandidate);
    };
  }, [socket, handleIncomingOffer, handleIncomingAnswer, handleIncomingIceCandidate]);

  const toggleVideo = useCallback(() => {
    if (mediaStreamRef.current) { // ✅ Use ref
      const videoTracks = mediaStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(prev => !prev);
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (mediaStreamRef.current) { // ✅ Use ref
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled(prev => !prev);
    }
  }, []);

  const handleStopVideo = useCallback(() => {
    console.log('[STOP] stopping video...');

    if (mediaStreamRef.current) { // ✅ Use ref
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('[STOP] stopped', track.kind, 'track');
      });
      mediaStreamRef.current = null;
      setMediaStream(null);
    }

    if (peerService.peer) {
      peerService.peer.close();
      peerService.peer = null;
      console.log('[STOP] closed peer connection');
    }

    setRemoteStream(null);
    setIsStreaming(false);
    setIsVideoEnabled(true);
    setIsAudioEnabled(true);
  }, []);

  useEffect(() => {
    if (localVideoRef.current && mediaStream) {
      localVideoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    return () => {
      console.log('[CLEANUP] component unmounting...');

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }

      if (peerService.peer) {
        peerService.peer.close();
        peerService.peer = null;
      }
    };
  }, []);

  return (
    <div style={{
      backgroundColor: "#000",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      position: "relative"
    }}>
      {!isStreaming ? (
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          backgroundColor: "#222"
        }}>
          <button
            onClick={handleVideo}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem"
            }}
          >
            📹 Start Video
          </button>
        </div>
      ) : (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: remoteStream ? "1fr 1fr" : "1fr",
            gap: "0.5rem",
            height: "100%",
            padding: "0.5rem"
          }}>
            {/* Local video */}
            <div style={{ position: "relative" }}>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  backgroundColor: "#000",
                  borderRadius: "8px"
                }}
              />
              <div style={{
                position: "absolute",
                bottom: "8px",
                left: "8px",
                backgroundColor: "rgba(0,0,0,0.7)",
                color: "white",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "0.8rem"
              }}>
                You {isVideoEnabled ? '📹' : '🚫'}
              </div>
            </div>

            {/* Remote video */}
            {remoteStream && (
              <div style={{ position: "relative" }}>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    backgroundColor: "#000",
                    borderRadius: "8px"
                  }}
                />
                <div style={{
                  position: "absolute",
                  bottom: "8px",
                  left: "8px",
                  backgroundColor: "rgba(0,0,0,0.7)",
                  color: "white",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "0.8rem"
                }}>
                  Remote 📹
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={{
            position: "absolute",
            bottom: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "0.5rem",
            backgroundColor: "rgba(0,0,0,0.8)",
            padding: "0.5rem",
            borderRadius: "8px"
          }}>
            <button
              onClick={toggleVideo}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: isVideoEnabled ? "#28a745" : "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              {isVideoEnabled ? "📹" : "🚫"}
            </button>

            <button
              onClick={toggleAudio}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: isAudioEnabled ? "#28a745" : "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              {isAudioEnabled ? "🎤" : "🔇"}
            </button>

            <button
              onClick={handleStopVideo}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              ⏹️
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default VideoChat;

