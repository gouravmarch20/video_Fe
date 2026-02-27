'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createMeeting } from '@/services/api';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="bg-gray-800 p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">MeetFlow</h1>
        
        <input
          type="text"
          placeholder="Your Name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-gray-700 text-white text-base"
        />

        <button
          onClick={handleCreateMeeting}
          className="w-full bg-blue-600 text-white p-3 rounded mb-4 hover:bg-blue-700 active:bg-blue-800 text-base font-medium"
        >
          Create Meeting
        </button>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Meeting ID"
            value={meetId}
            onChange={(e) => setMeetId(e.target.value)}
            className="flex-1 p-3 rounded bg-gray-700 text-white text-base"
          />
          <button
            onClick={handleJoinMeeting}
            className="bg-green-600 text-white px-4 sm:px-6 py-3 rounded hover:bg-green-700 active:bg-green-800 text-base font-medium whitespace-nowrap"
          >
            Join
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Review Meeting ID"
            value={reviewMeetId}
            onChange={(e) => setReviewMeetId(e.target.value)}
            className="flex-1 p-3 rounded bg-gray-700 text-white text-base"
          />
          <button
            onClick={handleReviewMeeting}
            className="bg-purple-600 text-white px-4 sm:px-6 py-3 rounded hover:bg-purple-700 active:bg-purple-800 text-base font-medium whitespace-nowrap"
          >
            Review
          </button>
        </div>
      </div>
    </div>
  );
}
