class PeerService {
  public peer: RTCPeerConnection | null = null;

  ensurePeer(): RTCPeerConnection {
    if (this.peer && this.peer.signalingState !== 'closed') return this.peer;
    this.peer = new RTCPeerConnection({
      iceServers: [
        { urls: ["stun:stun.l.google.com:19302", "stun:global.stun.twilio.com:3478"] },
      ],
    });
    return this.peer;
  }

  async getOffer(): Promise<RTCSessionDescriptionInit> {
    const pc = this.ensurePeer();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer;
  }

  async getAnswer(): Promise<RTCSessionDescriptionInit> {
    const pc = this.ensurePeer();
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  }

  async setRemoteDescription(desc: RTCSessionDescriptionInit) {
    const pc = this.ensurePeer();
    await pc.setRemoteDescription(new RTCSessionDescription(desc));
  }

  async addIceCandidate(candidate: RTCIceCandidateInit) {
    const pc = this.ensurePeer();
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }
}

export const peerService = new PeerService();