'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { io } from 'socket.io-client';
import WebRTCService from '@/services/webrtc';
import { saveRecording, endMeeting } from '@/services/api';
import styles from './meet.module.css';

export default function MeetPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const meetId = params.meetId;
  const userName = searchParams.get('name');
  const isCreator = searchParams.get('creator') === 'true';

  const [socket, setSocket] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [remoteUser, setRemoteUser] = useState(null);
  const [userId] = useState(`user-${Date.now()}`);
  const [isRemoteConnected, setIsRemoteConnected] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const webrtcRef = useRef(null);

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL);
    setSocket(socketInstance);
    webrtcRef.current = new WebRTCService();

    const init = async () => {
      try {
        const stream = await webrtcRef.current.initializeMedia();
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        socketInstance.emit('join-meeting', { meetId, userId, userName });

        socketInstance.on('user-joined', async ({ userId: remoteUserId, userName: remoteUserName, socketId }) => {
          console.log('User joined:', remoteUserName);
          setRemoteUser({ userId: remoteUserId, userName: remoteUserName });
          webrtcRef.current.createPeerConnection(socketInstance, meetId, true, (stream) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = stream;
              setIsRemoteConnected(true);
            }
          });
          await webrtcRef.current.createOffer(socketInstance, meetId, socketId);
        });

        socketInstance.on('offer', async ({ offer, from }) => {
          console.log('Received offer');
          webrtcRef.current.createPeerConnection(socketInstance, meetId, false, (stream) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = stream;
              setIsRemoteConnected(true);
            }
          });
          await webrtcRef.current.handleOffer(offer, socketInstance, meetId, from);
        });

        socketInstance.on('answer', async ({ answer }) => {
          console.log('Received answer');
          await webrtcRef.current.handleAnswer(answer);
        });

        socketInstance.on('ice-candidate', async ({ candidate }) => {
          await webrtcRef.current.handleIceCandidate(candidate);
        });

        socketInstance.on('user-left', () => {
          console.log('User left');
          if (isRecording) {
            alert('Remote user left. Stopping recording...');
            stopRecording();
          }
          setRemoteUser(null);
          setIsRemoteConnected(false);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
        });
      } catch (error) {
        console.error('Error initializing media:', error);
        alert('Camera/Microphone access denied');
      }
    };

    init();

    return () => {
      socketInstance.disconnect();
      webrtcRef.current?.cleanup();
    };
  }, [meetId, userId, userName]);

  useEffect(() => {
    if (webrtcRef.current?.remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = webrtcRef.current.remoteStream;
      setIsRemoteConnected(true);
    }
  }, [remoteUser]);

  const startRecording = () => {
    const webrtc = webrtcRef.current;
    
    if (!webrtc.localStream) {
      alert('Local stream not available');
      return;
    }

    webrtc.startRecording('A', webrtc.localStream);
    webrtc.startAudioRecording('A_audio', webrtc.localStream);
    
    if (webrtc.remoteStream) {
      webrtc.startRecording('B', webrtc.remoteStream);
      webrtc.startAudioRecording('B_audio', webrtc.remoteStream);
      
      const combinedStream = webrtc.createCombinedStream(webrtc.localStream, webrtc.remoteStream);
      webrtc.startRecording('AB', combinedStream);
      webrtc.startAudioRecording('AB_audio', combinedStream);
    } else {
      alert('Remote user not connected. Only recording your stream.');
    }
    
    setIsRecording(true);
  };

  const stopRecording = async () => {
    const webrtc = webrtcRef.current;
    
    const blobA = await webrtc.stopRecording('A');
    const blobA_audio = await webrtc.stopRecording('A_audio');
    const blobB = await webrtc.stopRecording('B');
    const blobB_audio = await webrtc.stopRecording('B_audio');
    const blobAB = await webrtc.stopRecording('AB');
    const blobAB_audio = await webrtc.stopRecording('AB_audio');

    if (blobA) await saveRecording(meetId, userId, userName, 'A', blobA);
    if (blobA_audio) await saveRecording(meetId, userId, userName, 'A_audio', blobA_audio);
    if (blobB && remoteUser) await saveRecording(meetId, remoteUser.userId, remoteUser.userName, 'B', blobB);
    if (blobB_audio && remoteUser) await saveRecording(meetId, remoteUser.userId, remoteUser.userName, 'B_audio', blobB_audio);
    if (blobAB) await saveRecording(meetId, userId, userName, 'AB', blobAB);
    if (blobAB_audio) await saveRecording(meetId, userId, userName, 'AB_audio', blobAB_audio);

    setIsRecording(false);
  };

  const handleEndMeeting = async () => {
    if (isRecording) {
      await stopRecording();
      alert('Recordings saved successfully!');
    }
    if (isCreator) {
      await endMeeting(meetId);
    }
    socket?.emit('leave-meeting', { meetId, userId });
    window.location.href = '/';
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <h2>Meeting: {meetId}</h2>
            <p>{userName} {isCreator && '(Host)'}</p>
          </div>
          <div className={styles.headerActions}>
            {isCreator && (
              !isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={!isRemoteConnected}
                  className={styles.btnRecord}
                >
                  Start Recording
                </button>
              ) : (
                <button
                  onClick={async () => {
                    await stopRecording();
                    alert('Recordings saved successfully!');
                  }}
                  className={styles.btnStop}
                >
                  Stop Recording
                </button>
              )
            )}
            <button
              onClick={handleEndMeeting}
              className={styles.btnLeave}
            >
              Leave Meeting
            </button>
          </div>
        </div>

        <div className={styles.videoGrid}>
          <div className={styles.videoCard}>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={styles.video}
            />
            <p className={styles.videoLabel}>You ({userName})</p>
          </div>

          <div className={styles.videoCard}>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={styles.video}
            />
            <p className={styles.videoLabel}>
              {remoteUser ? remoteUser.userName : 'Waiting for participant...'}
            </p>
          </div>
        </div>

        {isRecording && (
          <div className={styles.recordingBanner}>
            🔴 Recording in progress (6 files: A video+audio, A audio, B video+audio, B audio, AB video+audio, AB audio)
          </div>
        )}

        {!isRemoteConnected && isCreator && (
          <div className={styles.warningBanner}>
            ⚠️ Waiting for second participant to start recording
          </div>
        )}
      </div>
    </div>
  );
}
