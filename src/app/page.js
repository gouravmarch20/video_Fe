'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createMeeting } from '@/services/api';
import styles from './home.module.css';

export default function Home() {
  const [userName, setUserName] = useState('');
  const [meetId, setMeetId] = useState('');
  const [reviewMeetId, setReviewMeetId] = useState('');
  const router = useRouter();

  const handleCreateMeeting = async () => {
    if (!userName) return alert('Enter your name');
    try {
      const data = await createMeeting();
      router.push(`/meet/${data.meetId}?name=${userName}&creator=true`);
    } catch (error) {
      console.error('Error creating meeting:', error);
      alert('Failed to create meeting. Backend server is not reachable. Please check if the backend is running.');
    }
  };

  const handleJoinMeeting = () => {
    if (!userName || !meetId) return alert('Enter name and meeting ID');
    router.push(`/meet/${meetId}?name=${userName}&creator=false`);
  };

  const handleReviewMeeting = () => {
    if (!reviewMeetId) return alert('Enter meeting ID to review');
    router.push(`/review/${reviewMeetId}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>MeetFlow</h1>
        
        <input
          type="text"
          placeholder="Your Name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className={styles.input}
        />

        <button
          onClick={handleCreateMeeting}
          className={styles.btnPrimary}
        >
          Create Meeting
        </button>

        <div className={styles.inputGroup}>
          <input
            type="text"
            placeholder="Meeting ID"
            value={meetId}
            onChange={(e) => setMeetId(e.target.value)}
            className={styles.inputFlex}
          />
          <button
            onClick={handleJoinMeeting}
            className={styles.btnJoin}
          >
            Join
          </button>
        </div>

        <div className={styles.inputGroup}>
          <input
            type="text"
            placeholder="Review Meeting ID"
            value={reviewMeetId}
            onChange={(e) => setReviewMeetId(e.target.value)}
            className={styles.inputFlex}
          />
          <button
            onClick={handleReviewMeeting}
            className={styles.btnReview}
          >
            Review
          </button>
        </div>
      </div>
    </div>
  );
}
