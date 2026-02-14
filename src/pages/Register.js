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

const Register = () => {
  const [formData, setFormData] = useState({
    mail: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const usernameLength = (formData.username || '').trim().length;
    if (usernameLength < MIN_USERNAME_LENGTH) {
      setError(`Имя пользователя должно быть минимум ${MIN_USERNAME_LENGTH} символов`);
      return;
    }
    if (usernameLength > MAX_USERNAME_LENGTH) {
      setError(`Имя пользователя должно быть не более ${MAX_USERNAME_LENGTH} символов`);
      return;
    }
    
    if ((formData.password || '').length < MIN_PASSWORD_LENGTH) {
      setError(`Пароль должен быть минимум ${MIN_PASSWORD_LENGTH} символов`);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    
    try {
      await api.post('/auth/register', {
        mail: formData.mail,
        username: formData.username,
        password: formData.password,
      });
      // Покажем помощь при первом заходе в приложение после регистрации
      localStorage.setItem('helpAutoOpen', '1');
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const errorResponse = err.response?.data;
      const status = err.response?.status;
      
      // Обработка различных типов ошибок
      let errorMessage = 'Ошибка регистрации';
      
      // Статус 409 - конфликт (почта уже существует)
      if (status === 409) {
        const responseMessage = errorResponse?.message || errorResponse?.error || '';
        
        // Проверяем различные варианты сообщений от бэкенда
        if (responseMessage.toLowerCase().includes('mail') || 
            responseMessage.toLowerCase().includes('почт') ||
            responseMessage.toLowerCase().includes('email') ||
            responseMessage.toLowerCase().includes('exists') ||
            responseMessage.toLowerCase().includes('уже') ||
            responseMessage.toLowerCase().includes('зарегистрирован')) {
          errorMessage = 'Такая почта уже зарегистрирована. Используйте другую почту или войдите в систему.';
        } else {
          // Если сообщение не содержит ключевых слов, но статус 409 - скорее всего конфликт с почтой
          errorMessage = 'Такая почта уже зарегистрирована. Используйте другую почту или войдите в систему.';
        }
      } else if (status === 400) {
        // Ошибка валидации
        errorMessage = errorResponse?.message || 
                      errorResponse?.error || 
                      'Проверьте правильность введенных данных';
      } else if (status === 500) {
        // Серверная ошибка - проверяем сообщение
        const serverMessage = errorResponse?.message || errorResponse?.error || '';
        if (serverMessage.toLowerCase().includes('mail') || 
            serverMessage.toLowerCase().includes('почт') ||
            serverMessage.toLowerCase().includes('email') ||
            serverMessage.toLowerCase().includes('exists')) {
          errorMessage = 'Такая почта уже зарегистрирована. Используйте другую почту или войдите в систему.';
        } else {
          errorMessage = serverMessage || 'Внутренняя ошибка сервера. Попробуйте позже.';
        }
      } else if (errorResponse?.message) {
        errorMessage = errorResponse.message;
      } else if (errorResponse?.error) {
        // Если пришло просто "Conflict" или другое техническое сообщение
        if (errorResponse.error === 'Conflict' || errorResponse.error === 'CONFLICT') {
          errorMessage = 'Такая почта уже зарегистрирована. Используйте другую почту или войдите в систему.';
        } else {
          errorMessage = errorResponse.error;
        }
      }
      
      setError(errorMessage);
    }
  };

  const usernameLength = (formData.username || '').trim().length;
  const usernameTooShort = usernameLength > 0 && usernameLength < MIN_USERNAME_LENGTH;
  const usernameTooLong = usernameLength > MAX_USERNAME_LENGTH;
  const passwordTooShort =
    (formData.password || '').length > 0 && (formData.password || '').length < MIN_PASSWORD_LENGTH;
  const confirmPasswordMismatch =
    (formData.confirmPassword || '').length > 0 && formData.password !== formData.confirmPassword;

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, p: 4, boxShadow: 3, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom align="center">
          Регистрация
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>Регистрация успешна! Перенаправление на вход...</Alert>}
        
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
            disabled={success}
          />
          <TextField
            fullWidth
            label="Имя пользователя"
            margin="normal"
            value={formData.username}
            onChange={(e) => {
              setError('');
              setFormData({ ...formData, username: e.target.value });
            }}
            inputProps={{ 
              minLength: MIN_USERNAME_LENGTH, 
              maxLength: MAX_USERNAME_LENGTH 
            }}
            error={usernameTooShort || usernameTooLong}
            helperText={
              usernameTooShort 
                ? `Минимум ${MIN_USERNAME_LENGTH} символа` 
                : usernameTooLong 
                  ? `Максимум ${MAX_USERNAME_LENGTH} символов`
                  : `От ${MIN_USERNAME_LENGTH} до ${MAX_USERNAME_LENGTH} символов`
            }
            required
            disabled={success}
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
            disabled={success}
          />
          
          <TextField
            fullWidth
            label="Подтвердите пароль"
            type="password"
            margin="normal"
            value={formData.confirmPassword}
            onChange={(e) => {
              setError('');
              setFormData({ ...formData, confirmPassword: e.target.value });
            }}
            error={confirmPasswordMismatch}
            helperText={confirmPasswordMismatch ? 'Пароли не совпадают' : 'Повторите пароль'}
            required
            disabled={success}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={success}
          >
            Зарегистрироваться
          </Button>
          
          <Button
            fullWidth
            variant="outlined"
            onClick={() => navigate('/login')}
            disabled={success}
          >
            Назад ко входу
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default Register;