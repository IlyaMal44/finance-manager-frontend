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
const MIN_USERNAME_LENGTH = 2;
const MAX_USERNAME_LENGTH = 50;

const Register = ({ mode, toggleMode }) => {
  const [formData, setFormData] = useState({
    mail: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
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

    setLoading(true);
    try {
      await api.post('/auth/register', {
        mail: formData.mail,
        username: formData.username,
        password: formData.password,
      });
      localStorage.setItem('helpAutoOpen', '1');
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const errorResponse = err.response?.data;
      const status = err.response?.status;
      const responseMessage = (errorResponse?.message || errorResponse?.error || '').toLowerCase();

      let errorMessage = 'Ошибка регистрации';

      if (status === 409) {
        errorMessage = 'Такая почта уже зарегистрирована. Используйте другую почту или войдите в систему.';
      } else if (
        responseMessage.includes('mail') ||
        responseMessage.includes('почт') ||
        responseMessage.includes('email') ||
        responseMessage.includes('exists')
      ) {
        errorMessage = 'Такая почта уже зарегистрирована. Используйте другую почту или войдите в систему.';
      } else if (status === 400) {
        errorMessage =
          errorResponse?.message || errorResponse?.error || 'Проверьте правильность введенных данных';
      } else if (status === 500) {
        const serverMessage = errorResponse?.message || errorResponse?.error || '';
        errorMessage = serverMessage || 'Внутренняя ошибка сервера. Попробуйте позже.';
      } else if (errorResponse?.message) {
        errorMessage = errorResponse.message;
      } else if (errorResponse?.error) {
        if (errorResponse.error === 'Conflict' || errorResponse.error === 'CONFLICT') {
          errorMessage = 'Такая почта уже зарегистрирована. Используйте другую почту или войдите в систему.';
        } else {
          errorMessage = errorResponse.error;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
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
    <AuthLayout
      mode={mode}
      toggleMode={toggleMode}
      title='Регистрация'
      subtitle='Создайте аккаунт и начните вести доходы, расходы и бюджеты в одном месте.'
      accent='success'
      highlights={[
        'Простой старт без сложной настройки',
        'Учёт бюджета по понятным категориям',
        'Экспорт данных и контроль финансовой истории',
      ]}
    >
      {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}
      {success && (
        <Alert severity='success' sx={{ mb: 2 }}>
          Регистрация успешна! Перенаправляем на вход...
        </Alert>
      )}

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
          disabled={loading || success}
        />

        <TextField
          fullWidth
          label='Имя пользователя'
          value={formData.username}
          onChange={(e) => {
            setError('');
            setFormData({ ...formData, username: e.target.value });
          }}
          inputProps={{ minLength: MIN_USERNAME_LENGTH, maxLength: MAX_USERNAME_LENGTH }}
          error={usernameTooShort || usernameTooLong}
          helperText={
            usernameTooShort
              ? `Минимум ${MIN_USERNAME_LENGTH} символа`
              : usernameTooLong
                ? `Максимум ${MAX_USERNAME_LENGTH} символов`
                : `От ${MIN_USERNAME_LENGTH} до ${MAX_USERNAME_LENGTH} символов`
          }
          required
          disabled={loading || success}
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
          disabled={loading || success}
        />

        <TextField
          fullWidth
          label='Подтвердите пароль'
          type='password'
          value={formData.confirmPassword}
          onChange={(e) => {
            setError('');
            setFormData({ ...formData, confirmPassword: e.target.value });
          }}
          error={confirmPasswordMismatch}
          helperText={confirmPasswordMismatch ? 'Пароли не совпадают' : 'Повторите пароль'}
          required
          disabled={loading || success}
        />

        <Button
          type='submit'
          fullWidth
          variant='contained'
          size='large'
          sx={{ mt: 1, py: 1.35, fontWeight: 700, borderRadius: 2.5 }}
          disabled={loading || success}
        >
          {loading ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
        </Button>

        <Button
          fullWidth
          variant='outlined'
          size='large'
          onClick={() => navigate('/login')}
          disabled={loading || success}
          sx={{ py: 1.2, borderRadius: 2.5 }}
        >
          Назад ко входу
        </Button>
      </Box>
    </AuthLayout>
  );
};

export default Register;
