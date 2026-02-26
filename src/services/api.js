import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const createMeeting = async () => {
  const response = await axios.post(`${API_URL}/api/meetings/create`);
  return response.data;
};

export const getMeeting = async (meetId) => {
  const response = await axios.get(`${API_URL}/api/meetings/${meetId}`);
  return response.data;
};

export const endMeeting = async (meetId) => {
  const response = await axios.post(`${API_URL}/api/meetings/${meetId}/end`);
  return response.data;
};

export const saveRecording = async (meetId, userId, userName, recordingType, blob) => {
  const formData = new FormData();
  formData.append('meetId', meetId);
  formData.append('userId', userId);
  formData.append('userName', userName);
  formData.append('recordingType', recordingType);
  formData.append('recording', blob, `${recordingType}-${Date.now()}.webm`);

  const response = await axios.post(`${API_URL}/api/recordings/save`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const getRecordingsByMeet = async (meetId) => {
  const response = await axios.get(`${API_URL}/api/recordings/meet/${meetId}`);
  return response.data;
};

export const getFileUrl = (filename) => {
  return `${API_URL}/api/files/file/${filename}`;
};
