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

const ForgotPassword = ({ mode, toggleMode }) => {
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
    <AuthLayout
      mode={mode}
      toggleMode={toggleMode}
      title='Восстановление пароля'
      subtitle='Введите почту, и мы отправим ссылку для сброса пароля.'
      highlights={[
        'Быстрое восстановление доступа',
        'Ссылка придёт на почту из аккаунта',
        'После смены пароля можно сразу войти',
      ]}
    >
      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity='success' sx={{ mb: 2 }}>
          Если такая почта зарегистрирована — мы отправили письмо со ссылкой для сброса пароля.
        </Alert>
      )}

      <Box component='form' onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
        <TextField
          fullWidth
          label='Почта'
          type='email'
          value={mail}
          onChange={(e) => setMail(e.target.value)}
          required
          disabled={loading}
        />

        <Button
          type='submit'
          fullWidth
          variant='contained'
          size='large'
          sx={{ mt: 1, py: 1.35, fontWeight: 700, borderRadius: 2.5 }}
          disabled={loading}
        >
          {loading ? 'Отправляем...' : 'Отправить ссылку'}
        </Button>

        <Button
          fullWidth
          variant='outlined'
          size='large'
          onClick={() => navigate('/login')}
          disabled={loading}
          sx={{ py: 1.2, borderRadius: 2.5 }}
        >
          Назад ко входу
        </Button>
      </Box>
    </AuthLayout>
  );
};

export default ForgotPassword;
