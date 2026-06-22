import { supabase } from './supabase';
const BASE = import.meta.env.VITE_API_URL || '';
async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}
async function req(method, path, body) {
  const token = await getToken();
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

/**
 * Upload a score proof image to Supabase Storage.
 * Returns the public/signed URL of the uploaded file.
 */
export async function uploadScoreProof(file) {
  const ext = file.name.split('.').pop();
  const path = `proofs/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('score-proofs').upload(path, file, { upsert: false });
  if (error) throw new Error(error.message);
  // Get a signed URL valid for 1 year (for viewing)
  const { data: signed } = await supabase.storage.from('score-proofs').createSignedUrl(path, 60 * 60 * 24 * 365);
  return signed?.signedUrl || path;
}

export const api = {
  getSchools: () => req('GET', '/schools'),
  createSchool: (b) => req('POST', '/schools', b),
  updateSchool: (id, b) => req('PUT', `/schools/${id}`, b),
  deleteSchool: (id) => req('DELETE', `/schools/${id}`),
  getStudents: (p = {}) => req('GET', `/students?${new URLSearchParams(p)}`),
  getStudent: (id) => req('GET', `/students/${id}`),
  createStudent: (b) => req('POST', '/students', b),
  updateStudent: (id, b) => req('PUT', `/students/${id}`, b),
  deleteStudent: (id) => req('DELETE', `/students/${id}`),
  getResults: (p = {}) => req('GET', `/results?${new URLSearchParams(p)}`),
  createResult: (b) => req('POST', '/results', b),
  updateResult: (id, b) => req('PUT', `/results/${id}`, b),
  deleteResult: (id) => req('DELETE', `/results/${id}`),
  getAdmins: () => req('GET', '/admins'),
  inviteAdmin: (b) => req('POST', '/admins/invite', b),
  deleteAdmin: (id) => req('DELETE', `/admins/${id}`),
  linkAdmin: () => req('POST', '/admins/link', {}),
  getMe: () => req('GET', '/admins/me'),
  getOverview: () => req('GET', '/reports/overview'),
  getSchoolReport: () => req('GET', '/reports/schools'),
  getSettings: () => req('GET', '/settings'),
  updateSettings: (b) => req('PUT', '/settings', b),
};
