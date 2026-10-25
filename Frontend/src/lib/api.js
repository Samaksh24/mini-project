// In dev, Vite proxies /api to the Express server (see vite.config.js).
// To call a deployed backend instead, set VITE_API_URL=https://your-api.example.com/api
const BASE = import.meta.env?.VITE_API_URL || "/api";
const TOKEN_KEY = "cr_token";

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token) => {
    try {
      token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage can be unavailable in private windows */
    }
  },
};

async function request(path, { method = "GET", json, form } = {}) {
  const headers = {};
  const token = tokenStore.get();
  // The cookie is the primary login; the Bearer header is the backend's fallback.
  if (token) headers.Authorization = `Bearer ${token}`;

  let body;
  if (json) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  } else if (form) {
    body = form; // the browser sets the multipart boundary itself
  }

  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body, credentials: "include" });
  } catch {
    throw Object.assign(new Error("Can't reach the server. Check that the backend is running."), { status: 0 });
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty or non-JSON body */
  }

  if (!res.ok) {
    throw Object.assign(new Error(data?.message || `Request failed (${res.status})`), {
      status: res.status,
    });
  }
  return { ...data, _status: res.status };
}

export const api = {
  register: (name, email, password) => request("/auth/register", { method: "POST", json: { name, email, password } }),

  login: async (email, password) => {
    const data = await request("/auth/login", { method: "POST", json: { email, password } });
    tokenStore.set(data.token);
    return data;
  },

  logout: async () => {
    tokenStore.set(null);
    return request("/auth/logout", { method: "POST" });
  },

  getComplaints: ({ category = "All", status = "Open" } = {}) => {
    const params = new URLSearchParams({ category, status });
    return request(`/complaints?${params}`);
  },
  
  getMyComplaints: () => request("/complaints/mine"),
  submitComplaint: (formData) => request("/complaints/submitcomplaint", { method: "POST", form: formData }),
  updateStatus: (id, status) => request(`/complaints/${id}/status`, { method: "PATCH", json: { status } }),
};
