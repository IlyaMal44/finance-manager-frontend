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
      csvRows.push('Дата,Тип,Категория,Сумма,Описание');
      
      transactionsData.forEach((transaction) => {
        const date = transaction.date || transaction.createdAt || '';
        const formattedDate = date ? new Date(date).toLocaleString('ru-RU') : '';
        const type = transaction.type === 'INCOME' ? 'Доход' : 'Расход';
        const amount = (transaction.amount || 0).toFixed(2);
        const category = transaction.category || '';
        const description = (transaction.description || '').replace(/,/g, ';'); // Заменяем запятые в описании
        
        csvRows.push(`${formattedDate},${type},${category},${amount} ₽,"${description}"`);
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
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexWrap: 'wrap',
          gap: { xs: 1.5, sm: 2 },
          mb: { xs: 2.5, sm: 4 },
        }}
      >
        <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontWeight: 700,
              color: 'primary.main',
              fontSize: { xs: '1.6rem', sm: undefined },
              lineHeight: 1.15,
              mb: { xs: 0.5, sm: 0.5 },
            }}
          >
            Добро пожаловать, {user.username}!
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ maxWidth: 560 }}>
            Управляйте вашими финансами эффективно
          </Typography>
        </Box>
        {/* На мобилке отделяем действия в отдельную "панель" — так визуально чище */}
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
            mt: { xs: 0.5, sm: 0 },
            px: { xs: 1, sm: 0 },
            py: { xs: 0.75, sm: 0 },
            borderRadius: { xs: 2, sm: 0 },
            bgcolor: { xs: 'action.hover', sm: 'transparent' },
            border: { xs: '1px solid', sm: 'none' },
            borderColor: { xs: 'divider', sm: 'transparent' },
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
      </Box>

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      <Grid container spacing={{ xs: 1.5, sm: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ 
            height: '100%', 
            bgcolor: 'primary.main',
            color: 'white',
            borderRadius: 2,
            boxShadow: 3,
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, sm: 2 } }}>
                <AccountBalanceWallet sx={{ fontSize: { xs: 32, sm: 40 }, mr: { xs: 1.25, sm: 2 } }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                    Общий баланс
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '1.15rem', sm: '1.8rem' }, lineHeight: 1.2 }}>
                    {statistics ? formatCurrency(statistics.balance) : '0 ₽'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            borderLeft: '4px solid #4CAF50',
            borderRadius: 2,
            boxShadow: 2,
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, sm: 2 } }}>
                <ArrowUpward sx={{ fontSize: { xs: 26, sm: 30 }, color: '#4CAF50', mr: { xs: 1.25, sm: 2 } }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Общие доходы
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#4CAF50', fontSize: { xs: '1.1rem', sm: '1.5rem' }, lineHeight: 1.2 }}>
                    {statistics ? formatCurrency(statistics.totalIncome) : '0 ₽'}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                <AttachMoney sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                Все поступления
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            borderLeft: '4px solid #F44336',
            borderRadius: 2,
            boxShadow: 2,
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, sm: 2 } }}>
                <ArrowDownward sx={{ fontSize: { xs: 26, sm: 30 }, color: '#F44336', mr: { xs: 1.25, sm: 2 } }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Общие расходы
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#F44336', fontSize: { xs: '1.1rem', sm: '1.5rem' }, lineHeight: 1.2 }}>
                    {statistics ? formatCurrency(statistics.totalExpense) : '0 ₽'}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                <MoneyOff sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                Все траты
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            borderLeft: '4px solid #9C27B0',
            borderRadius: 2,
            boxShadow: 2,
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, sm: 2 } }}>
                <Category sx={{ fontSize: { xs: 30, sm: 30 }, color: '#9C27B0', mr: { xs: 1.1, sm: 2 } }} />
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
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#9C27B0', fontSize: { xs: '1.1rem', sm: '1.5rem' }, lineHeight: 1.2 }}>
                    {statistics?.expenseByCategory ? Object.keys(statistics.expenseByCategory).length : 0}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                Категории с тратами
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Левая колонка: Новая транзакция */}
        <Grid item xs={12} md={5}>
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
                      type="number"
                      value={transaction.amount}
                      onChange={(e) => setTransaction({...transaction, amount: e.target.value})}
                      size="small"
                      required
                      inputProps={{ min: "0.01", step: "0.01" }}
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
        <Grid item xs={12} md={7}>
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