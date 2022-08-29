import axios from "axios";

const axiosInstance = axios.create({
  baseURL: `http://localhost:3005/api/v1`,
});
axiosInstance.interceptors.request.use((req) => {
  req.headers = {
    ...req.headers,
    "Content-Type": "application/json",
  };
  return req;
});
export default axiosInstance;
