'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getRecordingsByMeet, getFileUrl } from '@/services/api';

export default function ReviewPage() {
  const params = useParams();
  const meetId = params.meetId;
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const groupedRecordings = recordings.reduce((acc, rec) => {
    const key = `${rec.userId}-${rec.recordingType.replace('_audio', '')}`;
    if (!acc[key]) acc[key] = {};
    if (rec.recordingType.includes('audio')) {
      acc[key].audio = rec;
    } else {
      acc[key].video = rec;
    }
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading recordings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-xl mb-6 shadow-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-white text-3xl font-bold mb-2">📹 Meeting Recordings</h1>
              <p className="text-blue-100">Meeting ID: <span className="font-mono bg-white/20 px-2 py-1 rounded">{meetId}</span></p>
              <p className="text-blue-100 mt-1">Total Files: {recordings.length}</p>
            </div>
            <a
              href="/"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 font-semibold transition-all shadow-lg"
            >
              ← Back Home
            </a>
          </div>
        </div>

        {recordings.length === 0 ? (
          <div className="bg-gray-800 p-12 rounded-xl text-center shadow-xl">
            <div className="text-6xl mb-4">🎥</div>
            <p className="text-gray-400 text-xl">No recordings found for this meeting</p>
            <p className="text-gray-500 mt-2">Start a meeting and record to see files here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(groupedRecordings).map(([key, { video, audio }]) => (
              <div key={key} className="bg-gray-800 rounded-xl p-5 shadow-xl hover:shadow-2xl transition-all border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white text-lg font-semibold">
                    {video?.userName || audio?.userName}
                  </h3>
                  <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-bold">
                    {video?.recordingType || audio?.recordingType.replace('_audio', '')}
                  </span>
                </div>
                
                {video && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🎬</span>
                      <p className="text-gray-300 text-sm font-medium">Video + Audio</p>
                    </div>
                    <video
                      controls
                      className="w-full h-48 rounded-lg bg-black shadow-lg"
                      src={getFileUrl(video.filepath.split('/').pop())}
                    />
                    <p className="text-gray-400 text-xs mt-2 flex items-center gap-1">
                      <span>💾</span> {(video.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}

                {audio && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🎵</span>
                      <p className="text-gray-300 text-sm font-medium">Audio Only</p>
                    </div>
                    <audio
                      controls
                      className="w-full h-10 rounded-lg"
                      src={getFileUrl(audio.filepath.split('/').pop())}
                    />
                    <p className="text-gray-400 text-xs mt-2 flex items-center gap-1">
                      <span>💾</span> {(audio.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-gray-500 text-xs flex items-center gap-1">
                    <span>🕒</span> {new Date(video?.createdAt || audio?.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
