import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000
});

export const fetchMetrics = (month) =>
  apiClient.get('/api/v2/metrics', { params: { month } }).then((res) => res.data);

export const recomputeMetrics = (month) =>
  apiClient.post('/api/v2/metrics/recompute', { month }).then((res) => res.data);

export const fetchAnalysis = (month) =>
  apiClient.get('/api/v2/analysis', { params: { month } }).then((res) => res.data);

export const generateAnalysis = (month) =>
  apiClient.post('/api/v2/analysis/generate', { month }).then((res) => res.data);

export const sendReportEmail = (month) =>
  apiClient.post('/api/v2/email/send', { month }).then((res) => res.data);

