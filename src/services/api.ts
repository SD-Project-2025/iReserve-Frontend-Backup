import axios from "axios";

// In Vite, you need to use import.meta.env instead of process.env
//@ts-ignore
const APIUrl = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: APIUrl
});

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Set the token if it exists in localStorage
const token = localStorage.getItem("token");
if (token) {
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}