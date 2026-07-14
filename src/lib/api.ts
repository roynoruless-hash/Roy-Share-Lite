
import { API_BASE } from '../config/api';

export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("admin_token");
  console.log("Token from localStorage:", token);
  if (!token) {
    window.location.href = "/admin/login";
    throw new Error("Session expired. Please login again.");
  }

  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem("admin_token");
    window.location.href = "/admin/login";
    throw new Error("Session expired. Please login again.");
  }

  return response;
};
