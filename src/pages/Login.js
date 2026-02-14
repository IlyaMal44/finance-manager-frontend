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
      setError(err.response?.data?.message || 'Ошибка входа');
    }
  };

  const passwordTooShort =
    (formData.password || '').length > 0 && (formData.password || '').length < MIN_PASSWORD_LENGTH;

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, p: 4, boxShadow: 3, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom align="center">
          Вход в Finance Manager
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