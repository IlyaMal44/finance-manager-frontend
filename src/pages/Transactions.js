import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import {
  Container,
  Typography,
  Button,
  Box,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Refresh,
  Visibility,
  ArrowUpward,
  ArrowDownward,
  ArrowBack,
} from '@mui/icons-material';

const Transactions = () => {
  const [walletId] = useState(localStorage.getItem('walletId'));
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const navigate = useNavigate();

  const categories = [
    'Продукты', 'Транспорт', 'Развлечения', 'Одежда',
    'Здоровье', 'Образование', 'Жилье', 'Коммунальные',
    'Связь', 'Кредит', 'Подарки', 'Путешествия',
    'Красота', 'Спорт', 'Другое',
    'Зарплата', 'Фриланс', 'Инвестиции', 'Подарок', 'Возврат долга', 'Дивиденды', 'Стипендия', 'Пенсия',
  ];

  useEffect(() => {
    if (walletId) {
      fetchTransactions();
    }
  }, [walletId]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      // Получаем реальные транзакции из backend
      const response = await api.get(`/finance/${walletId}/transactions`);

      // Ожидаемый формат: массив объектов
      // { id, type: 'INCOME' | 'EXPENSE', amount, category, description, date }
      const data = Array.isArray(response.data) ? response.data : [];
      setTransactions(data);
    } catch (error) {
      console.error('Ошибка загрузки транзакций:', error);
      setError(error.response?.data?.message || 'Не удалось загрузить историю транзакций');

      // Если пользователь не авторизован
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('user');
        localStorage.removeItem('walletId');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setViewDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setViewDialogOpen(false);
    setSelectedTransaction(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    try {
      const date = new Date(dateString);
      const dateStr = date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      const timeStr = date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${dateStr} ${timeStr}`;
    } catch (e) {
      return dateString;
    }
  };

  const getFilteredTransactions = () => {
    let filtered = [...transactions];

    if (filterType !== 'ALL') {
      filtered = filtered.filter((t) => t.type === filterType);
    }

    if (filterCategory) {
      filtered = filtered.filter((t) => t.category === filterCategory);
    }

    return filtered.sort(
      (a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt),
    );
  };

  const getTypeIcon = (type) => {
    return type === 'INCOME'
      ? <ArrowUpward sx={{ color: '#4CAF50', fontSize: 18, mr: 0.5 }} />
      : <ArrowDownward sx={{ color: '#F44336', fontSize: 18, mr: 0.5 }} />;
  };

  const getTotalAmount = (type) => {
    return getFilteredTransactions()
      .filter((t) => (type ? t.type === type : true))
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  };

  if (!walletId) {
    return (
      <Container sx={{ py: 10, textAlign: 'center' }}>
        <Typography variant="h5">Пожалуйста, войдите в систему</Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/login')}>
          Войти
        </Button>
      </Container>
    );
  }

  const filteredTransactions = getFilteredTransactions();

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Заголовок и управление */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
            История транзакций
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Просмотр и управление всеми финансовыми операциями
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Обновить">
            <IconButton onClick={fetchTransactions} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/dashboard')}
          >
            Назад к дашборду
          </Button>
        </Box>
      </Box>

      {/* Статистика - показываем только если есть транзакции */}
      {transactions.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
              <Typography variant="subtitle2">Всего транзакций</Typography>
              <Typography variant="h5">{filteredTransactions.length}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, bgcolor: '#4CAF50', color: 'white' }}>
              <Typography variant="subtitle2">Общие доходы</Typography>
              <Typography variant="h5">{formatCurrency(getTotalAmount('INCOME'))}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, bgcolor: '#F44336', color: 'white' }}>
              <Typography variant="subtitle2">Общие расходы</Typography>
              <Typography variant="h5">{formatCurrency(getTotalAmount('EXPENSE'))}</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Фильтры - показываем только если есть транзакции */}
      {transactions.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="flex-start">
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                Тип транзакции
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                label=""
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <MenuItem value="ALL">Все типы</MenuItem>
                <MenuItem value="INCOME">Доходы</MenuItem>
                <MenuItem value="EXPENSE">Расходы</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                Категория
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                label=""
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <MenuItem value="">Все категории</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setFilterType('ALL');
                    setFilterCategory('');
                  }}
                >
                  Сбросить фильтры
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Таблица транзакций */}
      {transactions.length === 0 ? (
        <Box sx={{ py: 10, textAlign: 'center' }}>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            Нет транзакций
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}
          >
            Вы еще не создали ни одной транзакции.
            Перейдите на дашборд и добавьте свою первую транзакцию!
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/dashboard')}
            startIcon={<ArrowBack />}
            sx={{ mt: 2 }}
          >
            Перейти к дашборду
          </Button>
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Дата</TableCell>
                  <TableCell>Тип</TableCell>
                  <TableCell>Категория</TableCell>
                  <TableCell>Описание</TableCell>
                  <TableCell align="right">Сумма</TableCell>
                  <TableCell align="center">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        Нет транзакций, соответствующих выбранным фильтрам
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow
                      key={transaction.id}
                      hover
                      sx={{
                        '&:hover': {
                          backgroundColor:
                            transaction.type === 'INCOME'
                              ? 'rgba(76, 175, 80, 0.04)'
                              : 'rgba(244, 67, 54, 0.04)',
                        },
                      }}
                    >
                      <TableCell>{formatDate(transaction.date || transaction.createdAt)}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getTypeIcon(transaction.type)}
                          label={transaction.type === 'INCOME' ? 'Доход' : 'Расход'}
                          color={transaction.type === 'INCOME' ? 'success' : 'error'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={transaction.category}
                          size="small"
                          sx={{
                            backgroundColor:
                              transaction.type === 'INCOME'
                                ? 'rgba(76, 175, 80, 0.1)'
                                : 'rgba(244, 67, 54, 0.1)',
                            color: transaction.type === 'INCOME' ? '#4CAF50' : '#F44336',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200 }}>
                          {transaction.description || 'Без описания'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 600,
                            color: transaction.type === 'INCOME' ? '#4CAF50' : '#F44336',
                          }}
                        >
                          {transaction.type === 'INCOME' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Просмотреть детали">
                          <IconButton
                            size="small"
                            onClick={() => handleViewTransaction(transaction)}
                            color="primary"
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Диалог просмотра транзакции */}
          <Dialog open={viewDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
            {selectedTransaction && (
              <>
                <DialogTitle>
                  Детали транзакции
                  <Chip
                    label={selectedTransaction.type === 'INCOME' ? 'ДОХОД' : 'РАСХОД'}
                    color={selectedTransaction.type === 'INCOME' ? 'success' : 'error'}
                    size="small"
                    sx={{ ml: 2 }}
                  />
                </DialogTitle>
                <DialogContent>
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Категория
                        </Typography>
                        <Typography variant="body1">{selectedTransaction.category}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Дата
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(selectedTransaction.date || selectedTransaction.createdAt)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Сумма
                        </Typography>
                        <Typography
                          variant="h5"
                          sx={{
                            color: selectedTransaction.type === 'INCOME' ? '#4CAF50' : '#F44336',
                            fontWeight: 600,
                          }}
                        >
                          {selectedTransaction.type === 'INCOME' ? '+' : '-'}
                          {formatCurrency(selectedTransaction.amount)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Описание
                        </Typography>
                        <Typography variant="body1">
                          {selectedTransaction.description || 'Описание отсутствует'}
                        </Typography>
                      </Grid>
                      {/* УБИРАЕМ ID ТРАНЗАКЦИИ И ID КОШЕЛЬКА */}
                    </Grid>
                  </Box>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleCloseDialog}>Закрыть</Button>
                </DialogActions>
              </>
            )}
          </Dialog>
        </>
      )}
    </Container>
  );
};

export default Transactions;