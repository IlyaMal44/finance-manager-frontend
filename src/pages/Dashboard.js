import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  TextField,
  MenuItem,
  Paper,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  Autocomplete,
  useMediaQuery,
} from '@mui/material';
import {
  AccountBalanceWallet,
  AddCircle,
  AttachMoney,
  MoneyOff,
  PieChart,
  Category,
  Refresh,
  ArrowUpward,
  ArrowDownward,
  Warning,
  Settings,
  Download,
} from '@mui/icons-material';

const Dashboard = () => {
  const [walletId] = useState(localStorage.getItem('walletId'));
  const [user] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const [transaction, setTransaction] = useState({
    type: 'EXPENSE',
    amount: '',
    category: '',
    description: '',
  });
  
  const navigate = useNavigate();
  
  // Раздельные категории для доходов и расходов
  const incomeCategories = [
    { value: 'Зарплата', icon: '💰', color: '#4CAF50' },
    { value: 'Фриланс', icon: '💼', color: '#2196F3' },
    { value: 'Инвестиции', icon: '📈', color: '#FF9800' },
    { value: 'Подарок', icon: '🎁', color: '#9C27B0' },
    { value: 'Возврат долга', icon: '💸', color: '#3F51B5' },
    { value: 'Дивиденды', icon: '📊', color: '#00BCD4' },
    { value: 'Стипендия', icon: '🎓', color: '#8BC34A' },
    { value: 'Пенсия', icon: '👴', color: '#607D8B' },
    { value: 'Другое (доход)', icon: '📦', color: '#795548' },
  ];

  const expenseCategories = [
    { value: 'Продукты', icon: '🛒', color: '#4CAF50' },
    { value: 'Транспорт', icon: '🚗', color: '#2196F3' },
    { value: 'Развлечения', icon: '🎬', color: '#9C27B0' },
    { value: 'Одежда', icon: '👕', color: '#FF9800' },
    { value: 'Здоровье', icon: '🏥', color: '#F44336' },
    { value: 'Образование', icon: '📚', color: '#3F51B5' },
    { value: 'Жилье', icon: '🏠', color: '#795548' },
    { value: 'Коммунальные', icon: '💡', color: '#FFC107' },
    { value: 'Связь', icon: '📱', color: '#E91E63' },
    { value: 'Кредит', icon: '🏦', color: '#F44336' },
    { value: 'Подарки', icon: '🎁', color: '#9C27B0' },
    { value: 'Путешествия', icon: '✈️', color: '#00BCD4' },
    { value: 'Красота', icon: '💄', color: '#E91E63' },
    { value: 'Спорт', icon: '🏋️', color: '#4CAF50' },
    { value: 'Другое (расход)', icon: '📦', color: '#9E9E9E' },
  ];

  // Получаем текущие категории в зависимости от типа транзакции
  const getCurrentCategories = () => {
    return transaction.type === 'INCOME' ? incomeCategories : expenseCategories;
  };

  const fetchStatistics = useCallback(async () => {
    if (!walletId) {
      navigate('/login');
      return;
    }
    
    setLoading(true);
    try {
      const statsResponse = await api.get(`/finance/${walletId}/statistics`);
      setStatistics(statsResponse.data);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
      showSnackbar('Ошибка загрузки данных', 'error');
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('user');
        localStorage.removeItem('walletId');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [walletId, navigate]);

  useEffect(() => {
    if (!user || !user.username) {
      navigate('/login');
      return;
    }
    fetchStatistics();
  }, [fetchStatistics, user, navigate]);

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    
    if (!transaction.amount || !transaction.category) {
      showSnackbar('Заполните все обязательные поля', 'warning');
      return;
    }

    const amountValue = parseFloat(transaction.amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      showSnackbar('Сумма должна быть больше 0', 'warning');
      return;
    }

    // Предпроверка: если это расход и денег меньше, чем сумма — покажем понятную ошибку сразу.
    // (Бэкенд сейчас может вернуть 500 без message, и фронт не сможет понять причину.)
    if (transaction.type === 'EXPENSE' && typeof statistics?.balance === 'number') {
      const balance = statistics.balance;
      if (amountValue > balance) {
        const missing = amountValue - balance;
        showSnackbar(
          `Недостаточно средств. Баланс: ${formatCurrency(balance)}. Расход: ${formatCurrency(amountValue)}. Не хватает: ${formatCurrency(missing)}. Добавьте доход (пополнение).`,
          'error',
        );
        return;
      }
    }
    
    try {
      await api.post(`/finance/${walletId}/transaction`, {
        ...transaction,
        amount: amountValue,
      });
      
      showSnackbar('Транзакция успешно добавлена!', 'success');
      setTransaction({ type: 'EXPENSE', amount: '', category: '', description: '' });
      
      fetchStatistics();
      
    } catch (error) {
      console.error('Ошибка добавления транзакции:', error);

      const backendMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        '';
      const isInsufficientFunds =
        /Недостаточно средств/i.test(backendMessage) ||
        /InsufficientFunds/i.test(backendMessage);

      if (error.response?.status === 400) {
        showSnackbar(error.response.data.message || 'Ошибка валидации', 'error');
      } else if (error.response?.status === 403 || isInsufficientFunds) {
        if (transaction.type === 'EXPENSE') {
          showSnackbar(
            'Недостаточно средств. Сначала добавьте доход (пополнение), а потом расход. Для контроля расходов можно настроить бюджеты.',
            'error',
          );
        } else {
          showSnackbar('Операция отклонена', 'error');
        }
      } else if (!error.response) {
        showSnackbar('Сервер недоступен. Попробуйте позже.', 'error');
      } else {
        showSnackbar(backendMessage || 'Ошибка при добавлении транзакции', 'error');
      }
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const exportData = async () => {
    try {
      setLoading(true);
      
      // Получаем транзакции
      const transactionsResponse = await api.get(`/finance/${walletId}/transactions`);
      const transactionsData = transactionsResponse.data || [];
      
      // Формируем CSV
      const csvRows = [];
      
      // Заголовок с общей информацией
      csvRows.push('Финансовый отчет');
      csvRows.push(`Пользователь: ${user.username}`);
      csvRows.push(`Дата экспорта: ${new Date().toLocaleString('ru-RU')}`);
      csvRows.push('');
      
      // Статистика
      if (statistics) {
        csvRows.push('Общая статистика');
        csvRows.push(`Общий баланс,${statistics.balance?.toFixed(2) || 0} ₽`);
        csvRows.push(`Общие доходы,${statistics.totalIncome?.toFixed(2) || 0} ₽`);
        csvRows.push(`Общие расходы,${statistics.totalExpense?.toFixed(2) || 0} ₽`);
        csvRows.push('');
      }
      
      // Бюджеты
      if (statistics?.budgetStatus && Object.keys(statistics.budgetStatus).length > 0) {
        csvRows.push('Бюджеты');
        csvRows.push('Категория,Лимит,Потрачено,Осталось,Использовано (%),Статус');
        
        Object.entries(statistics.budgetStatus).forEach(([category, budget]) => {
          const status = budget.exceeded 
            ? 'Превышен' 
            : budget.usagePercentage > 80 
              ? 'Внимание' 
              : 'В норме';
          
          csvRows.push(
            `${category},${budget.limitAmount.toFixed(2)} ₽,${budget.currentSpent.toFixed(2)} ₽,${budget.remaining.toFixed(2)} ₽,${budget.usagePercentage.toFixed(1)}%,${status}`
          );
        });
        csvRows.push('');
      }
      
      // Транзакции
      csvRows.push('Транзакции');
      csvRows.push(['Дата', 'Тип', 'Категория', 'Сумма', 'Описание'].map((s) => `"${s}"`).join(','));
      const escapeCsv = (s) => `"${String(s).replace(/"/g, '""')}"`;
      transactionsData.forEach((transaction) => {
        const date = transaction.date || transaction.createdAt || '';
        const formattedDate = date ? new Date(date).toLocaleString('ru-RU') : '';
        const type = transaction.type === 'INCOME' ? 'Доход' : 'Расход';
        const amount = (transaction.amount || 0).toFixed(2);
        const category = transaction.category || '';
        const description = (transaction.description || '').replace(/"/g, '""');
        csvRows.push([formattedDate, type, category, `${amount} ₽`, description].map(escapeCsv).join(','));
      });
      
      // Создаем и скачиваем файл
      const csvContent = csvRows.join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM для корректного отображения кириллицы в Excel
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `Мои_финансы_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showSnackbar('Данные успешно экспортированы!', 'success');
    } catch (error) {
      console.error('Ошибка экспорта данных:', error);
      showSnackbar('Ошибка при экспорте данных', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Форматирование суммы в инпуте: "200000" -> "200 000", поддержка "." / "," для копеек.
  const sanitizeAmountInput = (input) => {
    const s = String(input ?? '')
      .replace(/\s+/g, '')
      .replace(/,/g, '.');

    let out = '';
    let dotUsed = false;
    for (const ch of s) {
      if (ch >= '0' && ch <= '9') out += ch;
      else if (ch === '.' && !dotUsed) {
        out += '.';
        dotUsed = true;
      }
    }

    if (out.includes('.')) {
      const [i, d = ''] = out.split('.');
      // максимум 2 знака после точки
      return `${i}.${d.slice(0, 2)}`;
    }
    return out;
  };

  const formatAmountForInput = (raw) => {
    if (!raw) return '';
    const cleaned = sanitizeAmountInput(raw);
    const endsWithDot = String(raw).trim().endsWith('.') || cleaned.endsWith('.');
    const [intPart = '', decPart] = cleaned.split('.');
    const spacedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    if (endsWithDot) return `${spacedInt}.`;
    if (typeof decPart === 'string' && decPart.length > 0) return `${spacedInt}.${decPart}`;
    return spacedInt;
  };

  const formatCurrencyForTile = (amount) => {
    const value = typeof amount === 'number' ? amount : Number(amount);
    if (!Number.isFinite(value)) return '0 ₽';
    // Для плиток показываем полное число, но без копеек — так короче и лучше помещается.
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getTopCategoryName = (categoryMap) => {
    if (!categoryMap || typeof categoryMap !== 'object') return '';
    let topName = '';
    let topValue = -Infinity;
    for (const [name, value] of Object.entries(categoryMap)) {
      const v = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(v)) continue;
      if (v > topValue) {
        topValue = v;
        topName = name;
      }
    }
    return topName;
  };

  const topExpenseCategory = getTopCategoryName(statistics?.expenseByCategory);
  const topIncomeCategory = getTopCategoryName(statistics?.incomeByCategory);

  const checkBudgetExceeded = () => {
    if (!statistics?.budgetStatus) return false;
    return Object.values(statistics.budgetStatus).some(budget => budget.exceeded);
  };

  // При изменении типа транзакции сбрасываем категорию
  const handleTypeChange = (type) => {
    setTransaction({
      ...transaction,
      type: type,
      category: '' // Сбрасываем категорию при смене типа
    });
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

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1.5, sm: 3 } }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Заголовок с информацией о пользователе - БЕЗ ID кошелька */}
      <Paper
        variant="outlined"
        sx={(theme) => ({
          mb: { xs: 3, sm: 4 },
          p: { xs: 2, sm: 2.5 },
          borderRadius: 3,
          borderColor: 'divider',
          background:
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(25,118,210,0.22), rgba(0,0,0,0) 55%)'
              : 'linear-gradient(135deg, rgba(25,118,210,0.10), rgba(255,255,255,0) 55%)',
        })}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: 'primary.main',
                fontSize: { xs: '1.6rem', sm: undefined },
                lineHeight: 1.15,
              }}
            >
              Добро пожаловать, {user.username}!
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ maxWidth: 560, mt: 0.5 }}>
              Управляйте вашими финансами эффективно
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            mt: 2,
            pt: 1.75,
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
            {checkBudgetExceeded() && (
              <Chip
                icon={<Warning />}
                label="Превышен бюджет"
                color="error"
                variant="outlined"
                size="small"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
            <Tooltip title="Экспортировать данные">
              <IconButton 
                onClick={exportData} 
                disabled={loading} 
                size="small"
                sx={{ p: 0.75, bgcolor: 'success.light', color: 'white', '&:hover': { bgcolor: 'success.main' } }}
              >
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Обновить данные">
              <IconButton onClick={fetchStatistics} disabled={loading} size="small" sx={{ p: 0.75, bgcolor: 'primary.light', color: 'white' }}>
                <Refresh fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
          gap: { xs: 1.5, sm: 3 },
          mb: { xs: 3, sm: 4 },
        }}
      >
          <Card
            sx={(theme) => ({
              height: '100%',
              borderRadius: 2.5,
              boxShadow: 3,
              color: 'common.white',
              overflow: 'hidden',
              background:
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #1565c0 0%, #1976d2 45%, #0d47a1 100%)'
                  : 'linear-gradient(135deg, #1976d2 0%, #1e88e5 45%, #1565c0 100%)',
              position: 'relative',
              '&:before': {
                content: '""',
                position: 'absolute',
                right: -22,
                top: -22,
                width: 90,
                height: 90,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.18)',
              },
            })}
          >
            <CardContent sx={{ p: { xs: 2, sm: 2.5 }, position: 'relative' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                    Общий баланс
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 900,
                      fontSize: { xs: '1.15rem', sm: '1.8rem' },
                      lineHeight: 1.15,
                      mt: 0.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                    title={statistics ? formatCurrency(statistics.balance) : '0 ₽'}
                  >
                    {statistics ? formatCurrencyForTile(statistics.balance) : '0 ₽'}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9, display: 'block', mt: 0.5 }}>
                    Доступно сейчас
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: { xs: 34, sm: 40 },
                    height: { xs: 34, sm: 40 },
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.18)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <AccountBalanceWallet sx={{ fontSize: { xs: 22, sm: 26 } }} />
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card
            sx={(theme) => ({
              height: '100%',
              borderRadius: 2.5,
              boxShadow: 2,
              border: '1px solid',
              borderColor: 'divider',
              background:
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(76,175,80,0.18), rgba(0,0,0,0) 60%)'
                  : 'linear-gradient(135deg, rgba(76,175,80,0.14), rgba(255,255,255,0) 60%)',
            })}
          >
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Общие доходы
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 900,
                      color: '#4CAF50',
                      fontSize: { xs: '1.05rem', sm: '1.5rem' },
                      lineHeight: 1.15,
                      mt: 0.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                    title={statistics ? formatCurrency(statistics.totalIncome) : '0 ₽'}
                  >
                    {statistics ? formatCurrencyForTile(statistics.totalIncome) : '0 ₽'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }} noWrap>
                    {topIncomeCategory ? `Топ: ${topIncomeCategory}` : 'Все поступления'}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: { xs: 34, sm: 40 },
                    height: { xs: 34, sm: 40 },
                    borderRadius: 2,
                    bgcolor: 'rgba(76,175,80,0.18)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <ArrowUpward sx={{ fontSize: { xs: 22, sm: 26 }, color: '#4CAF50' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card
            sx={(theme) => ({
              height: '100%',
              borderRadius: 2.5,
              boxShadow: 2,
              border: '1px solid',
              borderColor: 'divider',
              background:
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(244,67,54,0.18), rgba(0,0,0,0) 60%)'
                  : 'linear-gradient(135deg, rgba(244,67,54,0.14), rgba(255,255,255,0) 60%)',
            })}
          >
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Общие расходы
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 900,
                      color: '#F44336',
                      fontSize: { xs: '1.05rem', sm: '1.5rem' },
                      lineHeight: 1.15,
                      mt: 0.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                    title={statistics ? formatCurrency(statistics.totalExpense) : '0 ₽'}
                  >
                    {statistics ? formatCurrencyForTile(statistics.totalExpense) : '0 ₽'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }} noWrap>
                    {topExpenseCategory ? `Топ: ${topExpenseCategory}` : 'Все траты'}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: { xs: 34, sm: 40 },
                    height: { xs: 34, sm: 40 },
                    borderRadius: 2,
                    bgcolor: 'rgba(244,67,54,0.18)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <ArrowDownward sx={{ fontSize: { xs: 22, sm: 26 }, color: '#F44336' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card
            sx={(theme) => ({
              height: '100%',
              borderRadius: 2.5,
              boxShadow: 2,
              border: '1px solid',
              borderColor: 'divider',
              background:
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(156,39,176,0.20), rgba(0,0,0,0) 60%)'
                  : 'linear-gradient(135deg, rgba(156,39,176,0.14), rgba(255,255,255,0) 60%)',
            })}
          >
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    noWrap
                    sx={{ fontSize: { xs: '1.05rem', sm: undefined }, lineHeight: 1.1 }}
                  >
                    <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                      Активные категории
                    </Box>
                    <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                      Категории
                    </Box>
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 900,
                      color: '#9C27B0',
                      fontSize: { xs: '1.05rem', sm: '1.5rem' },
                      lineHeight: 1.15,
                      mt: 0.5,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {statistics?.expenseByCategory ? Object.keys(statistics.expenseByCategory).length : 0}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: { xs: 34, sm: 40 },
                    height: { xs: 34, sm: 40 },
                    borderRadius: 2,
                    bgcolor: 'rgba(156,39,176,0.18)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Category sx={{ fontSize: { xs: 22, sm: 26 }, color: '#9C27B0' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
      </Box>

      <Grid container spacing={3}>
        {/* Левая колонка: Новая транзакция */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, boxShadow: 3, overflow: 'visible' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AddCircle color="primary" sx={{ fontSize: 30, mr: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Новая транзакция
                </Typography>
              </Box>
              
              <form onSubmit={handleTransactionSubmit}>
                <Grid container spacing={2} sx={{ mt: -0.5 }}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Тип транзакции
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      label=""
                      value={transaction.type}
                      onChange={(e) => handleTypeChange(e.target.value)}
                      size="small"
                      required
                    >
                      <MenuItem value="INCOME">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ArrowUpward sx={{ color: '#4CAF50', mr: 1 }} />
                          Доход
                        </Box>
                      </MenuItem>
                      <MenuItem value="EXPENSE">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ArrowDownward sx={{ color: '#F44336', mr: 1 }} />
                          Расход
                        </Box>
                      </MenuItem>
                    </TextField>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Сумма
                    </Typography>
                    <TextField
                      fullWidth
                      label=""
                      type="text"
                      inputMode="decimal"
                      placeholder=""
                      value={formatAmountForInput(transaction.amount)}
                      onChange={(e) => {
                        const next = sanitizeAmountInput(e.target.value);
                        setTransaction({ ...transaction, amount: next });
                      }}
                      size="small"
                      required
                      InputProps={{
                        startAdornment: <Typography sx={{ mr: 1 }}>₽</Typography>,
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Категория
                    </Typography>
                    <Autocomplete
                      freeSolo
                      options={getCurrentCategories().map((cat) => cat.value)}
                      value={transaction.category || null}
                      inputValue={transaction.category || ''}
                      onChange={(e, newValue) =>
                        setTransaction({ ...transaction, category: newValue || '' })
                      }
                      onInputChange={(e, inputValue, reason) => {
                        // Важно: синхронизируем state только когда пользователь реально вводит/очищает.
                        // Иначе Autocomplete может показывать старый inputValue при пустом value.
                        if (reason === 'input') {
                          setTransaction((prev) => ({ ...prev, category: inputValue || '' }));
                        }
                        if (reason === 'clear') {
                          setTransaction((prev) => ({ ...prev, category: '' }));
                        }
                      }}
                      clearText=""
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="medium"
                          placeholder="Выберите или введите свою категорию"
                          helperText="Нет нужной категории? Просто начните вводить — она сохранится."
                          required
                        />
                      )}
                      noOptionsText="Нет в списке — продолжайте вводить свою категорию"
                      slotProps={{
                        clearIndicator: { title: '' },
                        paper: {
                          sx: {
                            minWidth: { xs: 0, sm: 340 },
                            maxWidth: 'calc(100vw - 32px)',
                            '& .MuiAutocomplete-listbox': {
                              '& .MuiAutocomplete-option': {
                                fontSize: '1rem',
                                padding: '10px 14px',
                              },
                            },
                          },
                        },
                      }}
                      renderOption={(props, option) => {
                        const cat = getCurrentCategories().find((c) => c.value === option);
                        return (
                          <li {...props} key={option}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography component="span" sx={{ fontSize: 18 }}>
                                {cat?.icon || '📦'}
                              </Typography>
                              <Typography
                                component="span"
                                sx={{ fontSize: 16, fontWeight: 500, color: 'text.primary' }}
                              >
                                {option}
                              </Typography>
                            </Box>
                          </li>
                        );
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Описание (необязательно)
                    </Typography>
                    <TextField
                      fullWidth
                      label=""
                      value={transaction.description}
                      onChange={(e) => setTransaction({...transaction, description: e.target.value})}
                      size="small"
                      multiline
                      rows={2}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Button 
                      type="submit" 
                      variant="contained" 
                      fullWidth 
                      size="large"
                      startIcon={<AddCircle />}
                      sx={{ mt: 1 }}
                      disabled={loading}
                    >
                      {loading ? 'Добавление...' : 'Добавить транзакцию'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>

          {/* Бюджеты (если есть) - ОБНОВЛЕННЫЙ КОД */}
          {statistics?.budgetStatus && Object.keys(statistics.budgetStatus).length > 0 && (
            <Card sx={{ mt: 3, borderRadius: 2, boxShadow: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Warning color="primary" sx={{ fontSize: 30, mr: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Статус бюджетов
                    </Typography>
                  </Box>
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={() => navigate('/budgets')}
                    startIcon={<Settings />}
                  >
                    Управление
                  </Button>
                </Box>
                
                {Object.entries(statistics.budgetStatus).map(([category, budget]) => (
                  <Box key={category} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {category}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 600,
                          color: budget.exceeded ? '#F44336' : budget.usagePercentage > 80 ? '#FF9800' : '#4CAF50'
                        }}
                      >
                        {budget.currentSpent.toFixed(2)} / {budget.limitAmount.toFixed(2)} ₽
                        {budget.exceeded && ' ⚠️'}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(budget.usagePercentage, 100)} 
                      sx={{ 
                        height: 6, 
                        borderRadius: 3,
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: budget.exceeded ? '#F44336' : budget.usagePercentage > 80 ? '#FF9800' : '#4CAF50',
                          borderRadius: 3,
                        }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Использовано: {budget.usagePercentage.toFixed(1)}%
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Правая колонка: Статистика */}
        <Grid item xs={12} md={6}>
          <Grid container spacing={3}>
            {/* Распределение расходов */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 2, boxShadow: 3, height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <PieChart color="primary" sx={{ fontSize: 30, mr: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Распределение расходов
                    </Typography>
                  </Box>
                  
                  {statistics?.expenseByCategory && Object.keys(statistics.expenseByCategory).length > 0 ? (
                    <Box sx={{ maxHeight: '300px', overflowY: 'auto', pr: 1 }}>
                      {Object.entries(statistics.expenseByCategory).map(([category, amount]) => {
                        const percentage = statistics.totalExpense > 0 ? 
                          (amount / statistics.totalExpense * 100).toFixed(1) : 0;
                        const categoryInfo = expenseCategories.find(c => c.value === category);
                        
                        return (
                          <Box key={category} sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography sx={{ mr: 1, fontSize: 18 }}>
                                  {categoryInfo?.icon || '📦'}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {category}
                                </Typography>
                              </Box>
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {formatCurrency(amount)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {percentage}% от расходов
                                </Typography>
                              </Box>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={percentage} 
                              sx={{ 
                                height: 6, 
                                borderRadius: 3,
                                backgroundColor: 'rgba(0,0,0,0.1)',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: categoryInfo?.color || '#795548',
                                  borderRadius: 3,
                                }
                              }}
                            />
                          </Box>
                        );
                      })}
                    </Box>
                  ) : (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <Typography variant="body1" color="text.secondary">
                        Нет данных о расходах. Добавьте первую транзакцию!
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Распределение доходов */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 2, boxShadow: 3, height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <PieChart color="success" sx={{ fontSize: 30, mr: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Распределение доходов
                    </Typography>
                  </Box>
                  
                  {statistics?.incomeByCategory && Object.keys(statistics.incomeByCategory).length > 0 ? (
                    <Box sx={{ maxHeight: '300px', overflowY: 'auto', pr: 1 }}>
                      {Object.entries(statistics.incomeByCategory).map(([category, amount]) => {
                        const percentage = statistics.totalIncome > 0 ? 
                          (amount / statistics.totalIncome * 100).toFixed(1) : 0;
                        const categoryInfo = incomeCategories.find(c => c.value === category);
                        
                        return (
                          <Box key={category} sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography sx={{ mr: 1, fontSize: 18 }}>
                                  {categoryInfo?.icon || '📦'}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {category}
                                </Typography>
                              </Box>
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {formatCurrency(amount)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {percentage}% от доходов
                                </Typography>
                              </Box>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={percentage} 
                              sx={{ 
                                height: 6, 
                                borderRadius: 3,
                                backgroundColor: 'rgba(0,0,0,0.1)',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: categoryInfo?.color || '#4CAF50',
                                  borderRadius: 3,
                                }
                              }}
                            />
                          </Box>
                        );
                      })}
                    </Box>
                  ) : (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <Typography variant="body1" color="text.secondary">
                        Нет данных о доходах. Добавьте первую транзакцию!
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Итоговая статистика по накоплениям — отдельная строка под обеими карточками */}
            {statistics && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'white' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.8rem' }}>
                        Самые большие расходы:
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                        {statistics.expenseByCategory && Object.keys(statistics.expenseByCategory).length > 0
                          ? Object.entries(statistics.expenseByCategory)
                              .sort(([,a], [,b]) => b - a)[0]?.[0]
                          : 'Нет данных'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.8rem' }}>
                        Коэффициент сбережений:
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                        {statistics.totalIncome > 0 ? 
                          `${((statistics.balance / statistics.totalIncome) * 100).toFixed(1)}%` : 
                          '0%'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;