'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getRecordingsByMeet, getFileUrl } from '@/services/api';
import styles from './review.module.css';

export default function ReviewPage() {
  const params = useParams();
  const meetId = params.meetId;
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  console.log("debug___98", recordings)

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        const data = await getRecordingsByMeet(meetId);
    
        setRecordings(data);
      } catch (error) {
        console.error('Error fetching recordings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecordings();
  }, [meetId]);



  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingContent}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Loading recordings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <h1>Meeting Recordings</h1>
            <div className={styles.meetingInfo}>
              <span>Meeting ID:</span>
              <code className={styles.meetingId}>{meetId}</code>
              <span className={styles.fileCount}>{recordings.length} / 6 files</span>
            </div>
          </div>
          <a href="/" className={styles.backBtn}>← Back</a>
        </div>

        {recordings.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📹</div>
            <p className={styles.emptyTitle}>No recordings found</p>
            <p className={styles.emptySubtitle}>Start recording to see files here</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {recordings.map((rec) => (
              <div key={rec._id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.userName}>{rec.userName}</h3>
                  <span className={styles.badge}>{rec.recordingType}</span>
                </div>

                <div className={styles.mediaContainer}>
                  {rec.recordingType.includes('audio') ? (
                    <div className={styles.audioWrapper}>
                      <div className={styles.mediaLabel}>
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
                        </svg>
                        <span>Audio Recording</span>
                      </div>
                      <audio
                        controls
                        className={styles.audioPlayer}
                        src={getFileUrl(rec.filepath.split('/').pop())}
                      />
                    </div>
                  ) : (
                    <video
                      controls
                      className={styles.videoPlayer}
                      src={getFileUrl(rec.filepath.split('/').pop())}
                    />
                  )}
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>File Size</span>
                    <span className={styles.infoValue}>{(rec.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Created</span>
                    <span className={styles.infoValue}>{new Date(rec.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
