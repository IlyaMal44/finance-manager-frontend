import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import {
  Alert,
  Box,
  Button,
  Container,
  TextField,
  Typography,
} from '@mui/material';

const MIN_PASSWORD_LENGTH = 6;

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordTooShort =
    newPassword.length > 0 && newPassword.length < MIN_PASSWORD_LENGTH;
  const passwordsMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Ссылка для сброса пароля некорректна: отсутствует токен.');
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Пароль должен быть минимум ${MIN_PASSWORD_LENGTH} символов`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/password-reset/confirm', {
        token,
        newPassword,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось сбросить пароль. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, p: 4, boxShadow: 3, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom align="center">
          Новый пароль
        </Typography>

        {!token && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            В ссылке отсутствует токен. Откройте ссылку из письма ещё раз или запросите новую.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Пароль успешно обновлён. Перенаправляем на вход...
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Новый пароль"
            type="password"
            margin="normal"
            value={newPassword}
            onChange={(e) => {
              setError('');
              setNewPassword(e.target.value);
            }}
            inputProps={{ minLength: MIN_PASSWORD_LENGTH }}
            error={passwordTooShort}
            helperText={`Минимум ${MIN_PASSWORD_LENGTH} символов`}
            required
            disabled={loading || success}
          />

          <TextField
            fullWidth
            label="Повторите пароль"
            type="password"
            margin="normal"
            value={confirmPassword}
            onChange={(e) => {
              setError('');
              setConfirmPassword(e.target.value);
            }}
            error={passwordsMismatch}
            helperText={passwordsMismatch ? 'Пароли не совпадают' : ' '}
            required
            disabled={loading || success}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 2, mb: 1 }}
            disabled={loading || success}
          >
            {loading ? 'Сохраняем...' : 'Сменить пароль'}
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

export default ResetPassword;

