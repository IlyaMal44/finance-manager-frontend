import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import {
  Alert,
  Box,
  Button,
  TextField,
} from '@mui/material';
import AuthLayout from '../components/Auth/AuthLayout';

const MIN_PASSWORD_LENGTH = 6;

const Login = ({ mode, toggleMode }) => {
  const [formData, setFormData] = useState({
    mail: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((formData.password || '').length < MIN_PASSWORD_LENGTH) {
      setError(`Пароль должен быть минимум ${MIN_PASSWORD_LENGTH} символов`);
      return;
    }

    setLoading(true);
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

      if (status === 404) {
        if (
          responseMessage.includes('user') ||
          responseMessage.includes('пользователь') ||
          responseMessage.includes('not found')
        ) {
          errorMessage = 'Пользователь с такой почтой не найден. Проверьте почту или зарегистрируйтесь.';
        } else {
          errorMessage = 'Пользователь не найден. Проверьте данные или зарегистрируйтесь.';
        }
      } else if (status === 401) {
        errorMessage = 'Неверный пароль. Проверьте правильность ввода.';
      } else if (status === 400 || status === 403) {
        if (
          responseMessage.includes('password') ||
          responseMessage.includes('пароль') ||
          responseMessage.includes('invalid') ||
          responseMessage.includes('неверный')
        ) {
          errorMessage = 'Неверный пароль. Проверьте правильность ввода.';
        } else {
          errorMessage = errorResponse?.message || 'Неверные учетные данные. Проверьте почту и пароль.';
        }
      } else if (status === 500) {
        const serverMessage = errorResponse?.message || errorResponse?.error || '';
        if (
          serverMessage.toLowerCase().includes('user') &&
          serverMessage.toLowerCase().includes('not found')
        ) {
          errorMessage = 'Пользователь с такой почтой не найден. Проверьте почту или зарегистрируйтесь.';
        } else {
          errorMessage = serverMessage || 'Внутренняя ошибка сервера. Попробуйте позже.';
        }
      } else if (errorResponse?.message) {
        errorMessage = errorResponse.message;
      } else if (errorResponse?.error) {
        errorMessage = errorResponse.error;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const passwordTooShort =
    (formData.password || '').length > 0 && (formData.password || '').length < MIN_PASSWORD_LENGTH;

  return (
    <AuthLayout
      mode={mode}
      toggleMode={toggleMode}
      title='Вход'
      subtitle='Войдите, чтобы продолжить работу с финансами, бюджетами и отчётами.'
      highlights={[
        'Быстрый вход к вашему кошельку',
        'История транзакций и бюджеты под рукой',
        'Светлая и тёмная тема уже на старте',
      ]}
    >
      {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}

      <Box component='form' onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
        <TextField
          fullWidth
          label='Почта'
          type='email'
          value={formData.mail}
          onChange={(e) => {
            setError('');
            setFormData({ ...formData, mail: e.target.value });
          }}
          required
          disabled={loading}
        />

        <TextField
          fullWidth
          label='Пароль'
          type='password'
          value={formData.password}
          onChange={(e) => {
            setError('');
            setFormData({ ...formData, password: e.target.value });
          }}
          inputProps={{ minLength: MIN_PASSWORD_LENGTH }}
          error={passwordTooShort}
          helperText={`Минимум ${MIN_PASSWORD_LENGTH} символов`}
          required
          disabled={loading}
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -0.5 }}>
          <Button
            variant='text'
            size='small'
            onClick={() => navigate('/forgot-password')}
            sx={{ textTransform: 'none' }}
            disabled={loading}
          >
            Забыли пароль?
          </Button>
        </Box>

        <Button
          type='submit'
          fullWidth
          variant='contained'
          size='large'
          disabled={loading}
          sx={{ mt: 1, py: 1.35, fontWeight: 700, borderRadius: 2.5 }}
        >
          {loading ? 'Входим...' : 'Войти'}
        </Button>

        <Button
          fullWidth
          variant='outlined'
          size='large'
          onClick={() => navigate('/register')}
          disabled={loading}
          sx={{ py: 1.2, borderRadius: 2.5 }}
        >
          Создать аккаунт
        </Button>
      </Box>
    </AuthLayout>
  );
};

export default Login;
