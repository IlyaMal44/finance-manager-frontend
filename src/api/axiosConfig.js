import axios from 'axios';

// CRA: локально берем из .env.development, в проде по умолчанию '/api'
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Для отладки
  timeout: 10000,
});

// Интерцептор для логирования запросов
api.interceptors.request.use(
  (config) => {
    console.log(`Отправка ${config.method.toUpperCase()} запроса на: ${config.url}`);
    console.log('Данные:', config.data);
    return config;
  },
  (error) => {
    console.error('Ошибка запроса:', error);
    return Promise.reject(error);
  }
);

// Интерцептор для логирования ответов
api.interceptors.response.use(
  (response) => {
    console.log(`Ответ от ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error('Ошибка ответа:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    return Promise.reject(error);
  }
);

export default api;