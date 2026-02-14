import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';

const MIN_PASSWORD_LENGTH = 6;
const MIN_USERNAME_LENGTH = 2;
const MAX_USERNAME_LENGTH = 50;

const Login = () => {
  const [formData, setFormData] = useState({
    mail: '',
    password: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((formData.password || '').length < MIN_PASSWORD_LENGTH) {
      setError(`Пароль должен быть минимум ${MIN_PASSWORD_LENGTH} символов`);
      return;
    }
    try {
      const response = await api.post('/auth/login', formData);
      localStorage.setItem('user', JSON.stringify(response.data));
      localStorage.setItem('walletId', response.data.walletId);
      navigate('/dashboard');
    } catch (err) {
      const errorResponse = err.response?.data;
      const status = err.response?.status;
      const responseMessage = (errorResponse?.message || errorResponse?.error || '').toLowerCase();
      
      let errorMessage = 'Ошибка входа';
      
      // Пользователь не найден (404)
      if (status === 404) {
        if (responseMessage.includes('user') || 
            responseMessage.includes('пользователь') ||
            responseMessage.includes('not found')) {
          errorMessage = 'Пользователь с такой почтой не найден. Проверьте почту или зарегистрируйтесь.';
        } else {
          errorMessage = 'Пользователь не найден. Проверьте данные или зарегистрируйтесь.';
        }
      }
      // Неверный пароль или неавторизован (401)
      else if (status === 401) {
        errorMessage = 'Неверный пароль. Проверьте правильность ввода.';
      }
      // Неверные учетные данные (обычно 400 или 403)
      else if (status === 400 || status === 403) {
        if (responseMessage.includes('password') || 
            responseMessage.includes('пароль') ||
            responseMessage.includes('invalid') ||
            responseMessage.includes('неверный')) {
          errorMessage = 'Неверный пароль. Проверьте правильность ввода.';
        } else {
          errorMessage = errorResponse?.message || 'Неверные учетные данные. Проверьте почту и пароль.';
        }
      }
      // Серверная ошибка
      else if (status === 500) {
        const serverMessage = errorResponse?.message || errorResponse?.error || '';
        if (serverMessage.toLowerCase().includes('user') && serverMessage.toLowerCase().includes('not found')) {
          errorMessage = 'Пользователь с такой почтой не найден. Проверьте почту или зарегистрируйтесь.';
        } else {
          errorMessage = serverMessage || 'Внутренняя ошибка сервера. Попробуйте позже.';
        }
      }
      // Другие ошибки
      else if (errorResponse?.message) {
        errorMessage = errorResponse.message;
      } else if (errorResponse?.error) {
        errorMessage = errorResponse.error;
      }
      
      setError(errorMessage);
    }
  };

  const passwordTooShort =
    (formData.password || '').length > 0 && (formData.password || '').length < MIN_PASSWORD_LENGTH;

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, p: 4, boxShadow: 3, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom align="center">
          Вход в «Мои финансы»
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Почта"
            type="email"
            margin="normal"
            value={formData.mail}
            onChange={(e) => {
              setError('');
              setFormData({ ...formData, mail: e.target.value });
            }}
            required
          />
          
          <TextField
            fullWidth
            label="Пароль"
            type="password"
            margin="normal"
            value={formData.password}
            onChange={(e) => {
              setError('');
              setFormData({ ...formData, password: e.target.value });
            }}
            inputProps={{ minLength: MIN_PASSWORD_LENGTH }}
            error={passwordTooShort}
            helperText={`Минимум ${MIN_PASSWORD_LENGTH} символов`}
            required
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button
              variant="text"
              size="small"
              onClick={() => navigate('/forgot-password')}
              sx={{ textTransform: 'none' }}
            >
              Забыли пароль?
            </Button>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Войти
          </Button>
          
          <Button
            fullWidth
            variant="outlined"
            onClick={() => navigate('/register')}
          >
            Регистрация
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default Login;