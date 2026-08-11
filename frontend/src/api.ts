// API helper for DoctorVovô
const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

async function request(path: string, options: RequestInit = {}) {
  const url = `${BASE}/api${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Profile
  getProfile: () => request('/profile'),
  saveProfile: (data: any) =>
    request('/profile', { method: 'PUT', body: JSON.stringify(data) }),
  resetAll: () => request('/profile', { method: 'DELETE' }),

  // Medications
  listMedications: () => request('/medications'),
  addMedication: (data: any) =>
    request('/medications', { method: 'POST', body: JSON.stringify(data) }),
  deleteMedication: (id: string) =>
    request(`/medications/${id}`, { method: 'DELETE' }),
  identifyMedication: (image_base64: string) =>
    request('/medications/identify', {
      method: 'POST',
      body: JSON.stringify({ image_base64 }),
    }),

  // Appointments
  listAppointments: () => request('/appointments'),
  addAppointment: (data: any) =>
    request('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  deleteAppointment: (id: string) =>
    request(`/appointments/${id}`, { method: 'DELETE' }),
  completeAppointment: (id: string) =>
    request(`/appointments/${id}/complete`, { method: 'PUT' }),

  // Family messages
  listFamilyMessages: () => request('/family-messages'),
  addFamilyMessage: (data: any) =>
    request('/family-messages', { method: 'POST', body: JSON.stringify(data) }),
  deleteFamilyMessage: (id: string) =>
    request(`/family-messages/${id}`, { method: 'DELETE' }),
};
