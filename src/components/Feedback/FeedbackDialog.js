import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Send, BugReport, Lightbulb, Help, Chat } from '@mui/icons-material';
import api from '../../api/axiosConfig';

const FEEDBACK_CATEGORIES = [
  { value: 'BUG', label: 'Сообщить об ошибке', icon: <BugReport />, color: '#f44336' },
  { value: 'FEATURE', label: 'Предложить функцию', icon: <Lightbulb />, color: '#ff9800' },
  { value: 'QUESTION', label: 'Задать вопрос', icon: <Help />, color: '#2196f3' },
  { value: 'OTHER', label: 'Другое', icon: <Chat />, color: '#9e9e9e' },
];

const FeedbackDialog = ({ open, onClose }) => {
  const [category, setCategory] = useState('BUG');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError('Пожалуйста, опишите вашу проблему или предложение');
      return;
    }

    if (message.trim().length < 10) {
      setError('Сообщение должно содержать минимум 10 символов');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/feedback', {
        category,
        message: message.trim(),
        username: user.username || 'Неизвестный',
        userMail: user.mail || '',
      });

      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      console.error('Ошибка отправки обратной связи:', err);
      setError(
        err.response?.data?.message || 'Не удалось отправить сообщение. Попробуйте позже или напишите напрямую на почту.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCategory('BUG');
    setMessage('');
    setError('');
    setSuccess(false);
    onClose();
  };

  const selectedCategory = FEEDBACK_CATEGORIES.find((cat) => cat.value === category);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {selectedCategory?.icon}
          <Typography variant="h6">Обратная связь</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Помогите улучшить приложение! Сообщите об ошибке, предложите новую функцию или задайте вопрос.
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Спасибо! Ваше сообщение отправлено. Мы постараемся ответить в ближайшее время.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          select
          fullWidth
          label="Тип обращения"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          sx={{ mb: 2 }}
          disabled={loading || success}
        >
          {FEEDBACK_CATEGORIES.map((cat) => (
            <MenuItem key={cat.value} value={cat.value}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ color: cat.color }}>{cat.icon}</Box>
                {cat.label}
              </Box>
            </MenuItem>
          ))}
        </TextField>

        <TextField
          fullWidth
          multiline
          rows={6}
          label="Ваше сообщение"
          placeholder="Опишите проблему, предложение или вопрос подробно..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={loading || success}
          helperText={`${message.length} символов (минимум 10)`}
          error={message.length > 0 && message.length < 10}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Отмена
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} /> : <Send />}
          disabled={loading || success || !message.trim() || message.trim().length < 10}
        >
          {loading ? 'Отправка...' : 'Отправить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FeedbackDialog;
