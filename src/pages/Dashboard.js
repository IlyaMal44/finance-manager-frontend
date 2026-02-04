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
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
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
} from '@mui/icons-material';

const Dashboard = () => {
  const [walletId] = useState(localStorage.getItem('walletId'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
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
    
    try {
      await api.post(`/finance/${walletId}/transaction`, {
        ...transaction,
        amount: parseFloat(transaction.amount),
      });
      
      showSnackbar('Транзакция успешно добавлена!', 'success');
      setTransaction({ type: 'EXPENSE', amount: '', category: '', description: '' });
      
      fetchStatistics();
      
    } catch (error) {
      console.error('Ошибка добавления транзакции:', error);
      
      if (error.response?.status === 400) {
        showSnackbar(error.response.data.message || 'Ошибка валидации', 'error');
      } else if (error.response?.status === 403) {
        showSnackbar('Недостаточно средств', 'error');
      } else {
        showSnackbar('Ошибка при добавлении транзакции', 'error');
      }
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getCategoryIcon = (category) => {
    const allCategories = [...incomeCategories, ...expenseCategories];
    const cat = allCategories.find(c => c.value === category);
    return cat ? cat.icon : '📦';
  };

  const getCategoryColor = (category) => {
    const allCategories = [...incomeCategories, ...expenseCategories];
    const cat = allCategories.find(c => c.value === category);
    return cat ? cat.color : '#795548';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const getMonthlyGrowth = () => {
    if (!statistics) return 0;
    const income = statistics.totalIncome || 0;
    const expense = statistics.totalExpense || 0;
    const previousMonth = (income - expense) * 0.9;
    const currentMonth = income - expense;
    
    if (previousMonth === 0) return 0;
    return ((currentMonth - previousMonth) / previousMonth * 100).toFixed(1);
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
    <Container maxWidth="xl" sx={{ py: 3 }}>
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
            Добро пожаловать, {user.username}!
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Управляйте вашими финансами эффективно
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {checkBudgetExceeded() && (
            <Chip
              icon={<Warning />}
              label="Превышен бюджет"
              color="error"
              variant="outlined"
            />
          )}
          <Tooltip title="Обновить данные">
            <IconButton onClick={fetchStatistics} disabled={loading} sx={{ bgcolor: 'primary.light', color: 'white' }}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            height: '100%', 
            bgcolor: 'primary.main',
            color: 'white',
            borderRadius: 2,
            boxShadow: 3,
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountBalanceWallet sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                    Общий баланс
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '1.8rem' }}>
                    {statistics ? formatCurrency(statistics.balance) : '0 ₽'}
                  </Typography>
                </Box>
              </Box>
              <Chip 
                icon={<TrendingUp />} 
                label={`${getMonthlyGrowth()}% за месяц`}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ 
            height: '100%',
            borderLeft: '4px solid #4CAF50',
            borderRadius: 2,
            boxShadow: 2,
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ArrowUpward sx={{ fontSize: 30, color: '#4CAF50', mr: 2 }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Общие доходы
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: '#4CAF50', fontSize: '1.5rem' }}>
                    {statistics ? formatCurrency(statistics.totalIncome) : '0 ₽'}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                <AttachMoney sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                Все поступления
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ 
            height: '100%',
            borderLeft: '4px solid #F44336',
            borderRadius: 2,
            boxShadow: 2,
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ArrowDownward sx={{ fontSize: 30, color: '#F44336', mr: 2 }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Общие расходы
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: '#F44336', fontSize: '1.5rem' }}>
                    {statistics ? formatCurrency(statistics.totalExpense) : '0 ₽'}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                <MoneyOff sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                Все траты
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ 
            height: '100%',
            borderLeft: '4px solid #9C27B0',
            borderRadius: 2,
            boxShadow: 2,
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Category sx={{ fontSize: 30, color: '#9C27B0', mr: 2 }} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Активные категории
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: '#9C27B0', fontSize: '1.5rem' }}>
                    {statistics?.expenseByCategory ? Object.keys(statistics.expenseByCategory).length : 0}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
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
                    <TextField
                      select
                      fullWidth
                      label=""
                      value={transaction.category}
                      onChange={(e) => setTransaction({...transaction, category: e.target.value})}
                      size="medium"
                      required
                    >
                      <MenuItem value="">
                        <em>Выберите категорию</em>
                      </MenuItem>
                      {getCurrentCategories().map((cat) => (
                        <MenuItem key={cat.value} value={cat.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography sx={{ mr: 1, fontSize: '1.2rem' }}>
                              {cat.icon}
                            </Typography>
                            {cat.value}
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
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