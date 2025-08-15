import http from './http';

export const createGame = async (payload = {}) =>
  (await http.post('/api/games', payload)).data.game;

export const listWaiting = async () =>
  (await http.get('/api/games/waiting')).data.items;

export const requestJoin = async (id) =>
  (await http.post(`/api/games/${id}/request-join`)).data;

export const acceptJoin = async (id, userId) =>
  (await http.post(`/api/games/${id}/accept`, { userId })).data;

export const submitAnswer = async (id, questionId, selectedIndex) =>
  (await http.post(`/api/games/${id}/submit-answer`, { questionId, selectedIndex })).data;

export const forceEnd = async (id) =>
  (await http.post(`/api/games/${id}/force-end`)).data;

export const getState = async (id) =>
  (await http.get(`/api/games/${id}/state`)).data.game;

export const getResults = async (id) =>
  (await http.get(`/api/games/${id}/results`)).data;

export const getLeaderboardTop = async () =>
  (await http.get('/api/leaderboard/top')).data.items;

export const getMyStats = async () =>
  (await http.get('/api/leaderboard/me')).data.stats;