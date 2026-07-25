import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({ baseURL: BASE_URL });

export async function fetchIssues() {
  const { data } = await api.get("/issues/");
  return data.issues;
}

export async function fetchIssue(id) {
  const { data } = await api.get(`/issues/${id}`);
  return data;
}

export async function reportIssue(formData) {
  const { data } = await api.post("/issues/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function upvoteIssue(id) {
  const { data } = await api.post(`/issues/${id}/upvote`);
  return data;
}

export async function fetchDashboard() {
  const { data } = await api.get("/issues/dashboard");
  return data;
}
