import http from './http';

export async function listMcqs(params = {}) {
  const { data } = await http.get('/api/mcqs', { params });
  return data; // { page, limit, total, items }
}

export async function getMcq(id) {
  const { data } = await http.get(`/api/mcqs/${id}`);
  return data.mcq;
}

export async function createMcq(payload) {
  const { data } = await http.post('/api/mcqs', payload);
  return data.mcq;
}

export async function updateMcq(id, payload) {
  const { data } = await http.put(`/api/mcqs/${id}`, payload);
  return data.mcq;
}

export async function deleteMcq(id) {
  await http.delete(`/api/mcqs/${id}`);
}