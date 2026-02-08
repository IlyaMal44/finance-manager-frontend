import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import {
  Alert,
  Box,
  Button,
  Container,
  TextField,
  Typography,
} from '@mui/material';

const ForgotPassword = () => {
  const [mail, setMail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      await api.post('/auth/password-reset/desire', { mail });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось отправить письмо. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, p: 4, boxShadow: 3, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom align="center">
          Восстановление пароля
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Введите почту, которую вы указывали при регистрации. Мы отправим ссылку для сброса пароля.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Если такая почта зарегистрирована — мы отправили письмо со ссылкой для сброса пароля.
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Почта"
            type="email"
            margin="normal"
            value={mail}
            onChange={(e) => setMail(e.target.value)}
            required
            disabled={loading}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 2, mb: 1 }}
            disabled={loading}
          >
            {loading ? 'Отправляем...' : 'Отправить ссылку'}
          </Button>

          <Button
            fullWidth
            variant="outlined"
            onClick={() => navigate('/login')}
            disabled={loading}
          >
            Назад ко входу
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default ForgotPassword;

