import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  Snackbar,
  LinearProgress,
} from '@mui/material';
import { Download } from '@mui/icons-material';

const Export = () => {
  const navigate = useNavigate();
  const walletId = localStorage.getItem('walletId');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const exportData = async () => {
    if (!walletId) {
      setSnackbar({ open: true, message: 'Нет доступа к данным. Войдите в систему.', severity: 'warning' });
      return;
    }
    try {
      setLoading(true);
      const [transactionsRes, statsRes] = await Promise.all([
        api.get(`/finance/${walletId}/transactions`),
        api.get(`/finance/${walletId}/statistics`).catch(() => ({ data: null })),
      ]);
      const transactionsData = transactionsRes.data || [];
      const statistics = statsRes?.data || null;

      const csvRows = [];
      csvRows.push('Финансовый отчет');
      csvRows.push(`Пользователь: ${user.username}`);
      csvRows.push(`Дата экспорта: ${new Date().toLocaleString('ru-RU')}`);
      csvRows.push('');

      if (statistics) {
        csvRows.push('Общая статистика');
        csvRows.push(`Общий баланс,${(statistics.balance ?? 0).toFixed(2)} ₽`);
        csvRows.push(`Общие доходы,${(statistics.totalIncome ?? 0).toFixed(2)} ₽`);
        csvRows.push(`Общие расходы,${(statistics.totalExpense ?? 0).toFixed(2)} ₽`);
        csvRows.push('');
      }

      if (statistics?.budgetStatus && Object.keys(statistics.budgetStatus).length > 0) {
        csvRows.push('Бюджеты');
        csvRows.push('Категория,Лимит,Потрачено,Осталось,Использовано (%),Статус');
        Object.entries(statistics.budgetStatus).forEach(([category, budget]) => {
          const status = budget.exceeded ? 'Превышен' : budget.usagePercentage > 80 ? 'Внимание' : 'В норме';
          csvRows.push(
            `${category},${(budget.limitAmount ?? 0).toFixed(2)} ₽,${(budget.currentSpent ?? 0).toFixed(2)} ₽,${(budget.remaining ?? 0).toFixed(2)} ₽,${(budget.usagePercentage ?? 0).toFixed(1)}%,${status}`
          );
        });
        csvRows.push('');
      }

      csvRows.push('Транзакции');
      csvRows.push(['Дата', 'Тип', 'Категория', 'Сумма', 'Описание'].map((s) => `"${s}"`).join(','));
      const escapeCsv = (s) => `"${String(s).replace(/"/g, '""')}"`;
      transactionsData.forEach((transaction) => {
        const date = transaction.date || transaction.createdAt || '';
        const formattedDate = date ? new Date(date).toLocaleString('ru-RU') : '';
        const type = transaction.type === 'INCOME' ? 'Доход' : 'Расход';
        const amount = (transaction.amount ?? 0).toFixed(2);
        const category = transaction.category ?? '';
        const description = (transaction.description ?? '').replace(/"/g, '""');
        csvRows.push([formattedDate, type, category, `${amount} ₽`, description].map(escapeCsv).join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Мои_финансы_${new Date().toISOString().split('T')[0]}.csv`;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      setSnackbar({ open: true, message: 'Данные успешно экспортированы!', severity: 'success' });
    } catch (error) {
      console.error('Ошибка экспорта данных:', error);
      setSnackbar({ open: true, message: 'Ошибка при экспорте данных', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!walletId || !user?.username) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>Войдите в систему, чтобы экспортировать данные</Typography>
        <Button variant="contained" onClick={() => navigate('/login')}>Войти</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1.5, sm: 3 } }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Paper
        variant="outlined"
        sx={(theme) => ({
          mb: 3,
          p: { xs: 2, sm: 3 },
          borderRadius: 3,
          borderColor: 'divider',
          background:
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(76,175,80,0.15), rgba(0,0,0,0) 55%)'
              : 'linear-gradient(135deg, rgba(76,175,80,0.08), rgba(255,255,255,0) 55%)',
        })}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.dark', mb: 1 }}>
          Экспорт данных
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Скачайте все ваши финансовые данные одним файлом для хранения или анализа в таблицах.
        </Typography>

        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Что такое экспорт?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Экспорт — это выгрузка ваших данных из приложения в файл на устройство. Вы получаете один файл в формате CSV (таблица с разделителями), который можно открыть в Excel, Google Таблицах или любом редакторе.
        </Typography>

        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Что будет в файле?
        </Typography>
        <Typography variant="body2" color="text.secondary" component="div" sx={{ mb: 2 }}>
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
            <li>Общая статистика: баланс, сумма доходов и расходов</li>
            <li>Состояние бюджетов по категориям (лимит, потрачено, остаток)</li>
            <li>Полный список транзакций: дата и время, тип (доход/расход), категория, сумма, описание</li>
          </Box>
        </Typography>

        <Button
          variant="contained"
          size="medium"
          onClick={exportData}
          disabled={loading}
          startIcon={<Download sx={{ fontSize: 18 }} />}
          sx={{
            mt: 1,
            py: 1,
            px: 2,
            fontSize: '0.9rem',
            fontWeight: 600,
            borderRadius: 2,
            bgcolor: 'success.main',
            color: 'white',
            boxShadow: (t) => (t.palette.mode === 'dark' ? '0 4px 20px rgba(76, 175, 80, 0.35)' : '0 4px 20px rgba(76, 175, 80, 0.4)'),
            '&:hover': {
              bgcolor: 'success.dark',
              boxShadow: (t) => (t.palette.mode === 'dark' ? '0 6px 24px rgba(76, 175, 80, 0.45)' : '0 6px 24px rgba(76, 175, 80, 0.5)'),
              transform: 'translateY(-1px)',
            },
            '&:active': { transform: 'translateY(0)' },
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
        >
          {loading ? 'Формирую файл…' : 'Скачать отчёт в CSV'}
        </Button>
      </Paper>

      {loading && <LinearProgress sx={{ mt: -2, mb: 2 }} />}
    </Container>
  );
};

export default Export;
