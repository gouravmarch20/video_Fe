class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.mediaRecorders = { A: null, B: null, AB: null, A_audio: null, B_audio: null, AB_audio: null };
    this.recordedChunks = { A: [], B: [], AB: [], A_audio: [], B_audio: [], AB_audio: [] };
  }

  async initializeMedia() {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    return this.localStream;
  }

  createPeerConnection(socket, meetId, isInitiator, onRemoteStream) {
    const config = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };

    this.peerConnection = new RTCPeerConnection(config);

    this.localStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, this.localStream);
    });

    this.peerConnection.ontrack = (event) => {
      console.log('Remote track received:', event.streams[0]);
      this.remoteStream = event.streams[0];
      if (onRemoteStream) {
        onRemoteStream(event.streams[0]);
      }
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          meetId,
          candidate: event.candidate,
          to: this.remoteSocketId
        });
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection.connectionState);
    };

    return this.peerConnection;
  }

  async createOffer(socket, meetId, to) {
    this.remoteSocketId = to;
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    socket.emit('offer', { meetId, offer, to });
  }

  async handleOffer(offer, socket, meetId, from) {
    this.remoteSocketId = from;
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    socket.emit('answer', { meetId, answer, to: from });
  }

  async handleAnswer(answer) {
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async handleIceCandidate(candidate) {
    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  startRecording(type, stream) {
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp8,opus'
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks[type].push(event.data);
      }
    };

    mediaRecorder.start(1000);
    this.mediaRecorders[type] = mediaRecorder;
  }

  startAudioRecording(type, stream) {
    const audioStream = new MediaStream(stream.getAudioTracks());
    const mediaRecorder = new MediaRecorder(audioStream, {
      mimeType: 'audio/webm;codecs=opus'
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks[type].push(event.data);
      }
    };

    mediaRecorder.start(1000);
    this.mediaRecorders[type] = mediaRecorder;
  }

  stopRecording(type) {
    return new Promise((resolve) => {
      if (this.mediaRecorders[type]) {
        this.mediaRecorders[type].onstop = () => {
          const mimeType = type.includes('audio') ? 'audio/webm' : 'video/webm';
          const blob = new Blob(this.recordedChunks[type], { type: mimeType });
          resolve(blob);
        };
        this.mediaRecorders[type].stop();
      } else {
        resolve(null);
      }
    });
  }

  createCombinedStream(localStream, remoteStream) {
    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();

    const localAudio = audioContext.createMediaStreamSource(localStream);
    const remoteAudio = audioContext.createMediaStreamSource(remoteStream);

    localAudio.connect(destination);
    remoteAudio.connect(destination);

    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    const localVideo = document.createElement('video');
    localVideo.srcObject = localStream;
    localVideo.play();

    const remoteVideo = document.createElement('video');
    remoteVideo.srcObject = remoteStream;
    remoteVideo.play();

    const drawFrame = () => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(remoteVideo, 0, 0, 640, 720);
      ctx.drawImage(localVideo, 640, 0, 640, 720);
      requestAnimationFrame(drawFrame);
    };
    drawFrame();

    const videoStream = canvas.captureStream(30);
    const combinedStream = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...destination.stream.getAudioTracks()
    ]);

    return combinedStream;
  }

  cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    Object.values(this.mediaRecorders).forEach(recorder => {
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop();
      }
    });
  }
}

export default WebRTCService;
