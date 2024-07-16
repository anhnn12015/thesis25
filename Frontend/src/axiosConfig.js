// axiosConfig.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080', // URL của server API
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để thêm access token vào header của mỗi request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor để xử lý khi access token hết hạn
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post('http://localhost:8080/user/refresh', {}, {
            headers: {
              'Authorization': `Bearer ${refreshToken}`
            }
          });

          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);

          // Thêm token mới vào header của yêu cầu ban đầu
          originalRequest.headers.Authorization = `Bearer ${access_token}`;

          return axios(originalRequest);
        } catch (err) {
          console.error('Failed to refresh token:', err);
          // Xử lý lỗi khi làm mới token thất bại (ví dụ: chuyển hướng đến trang đăng nhập)
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      } else {
        // Nếu không có refresh token, chuyển hướng đến trang đăng nhập
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
