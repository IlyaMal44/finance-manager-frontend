import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  MenuItem,
  Autocomplete,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  TrendingUp,
  TrendingDown,
  Warning,
  Savings,
  Category,
  Refresh,
  AttachMoney,
  MoneyOff,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const Budget = () => {
  const [walletId] = useState(localStorage.getItem('walletId'));
  const [user] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [budgets, setBudgets] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [newBudget, setNewBudget] = useState({
    category: '',
    limitAmount: '',
  });
  const [categories] = useState([
    'Продукты', 'Транспорт', 'Развлечения', 'Одежда',
    'Здоровье', 'Образование', 'Жилье', 'Коммунальные',
    'Связь', 'Кредит', 'Подарки', 'Путешествия',
    'Красота', 'Спорт', 'Другое'
  ]);
  
  const navigate = useNavigate();

  // Загрузка данных
  const fetchData = async () => {
    if (!walletId) return;
    
    setLoading(true);
    try {
      // Получаем статистику, которая содержит информацию о бюджетах
      const statsResponse = await api.get(`/finance/${walletId}/statistics`);
      setStatistics(statsResponse.data);
      
      // Преобразуем статусы бюджетов в массив
      if (statsResponse.data.budgetStatus) {
        const budgetsArray = Object.entries(statsResponse.data.budgetStatus).map(([category, status]) => ({
          category,
          limitAmount: status.limitAmount,
          currentSpent: status.currentSpent,
          remaining: status.remaining,
          exceeded: status.exceeded,
          usagePercentage: status.usagePercentage,
        }));
        setBudgets(budgetsArray);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      showSnackbar('Ошибка загрузки данных', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !user.username) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user, navigate]);

  // Установка нового бюджета
  const handleSetBudget = async () => {
    if (!newBudget.category || !newBudget.limitAmount || newBudget.limitAmount <= 0) {
      showSnackbar('Заполните все поля корректно', 'warning');
      return;
    }

    try {
      const budgetData = {
        category: newBudget.category,
        limitAmount: parseFloat(newBudget.limitAmount),
      };

      if (editingBudget) {
        // Обновление существующего бюджета
        // Если категория изменилась — "переименовываем": удаляем старый бюджет и создаём новый
        if (editingBudget.category && editingBudget.category !== newBudget.category) {
          await api.delete(`/finance/${walletId}/budget`, {
            params: { category: editingBudget.category }
          });
          await api.post(`/finance/${walletId}/budget`, budgetData);
          showSnackbar(
            `Бюджет изменен: "${editingBudget.category}" → "${newBudget.category}"`,
            'success',
          );
        } else {
          await api.post(`/finance/${walletId}/budget`, budgetData);
          showSnackbar(`Бюджет для "${newBudget.category}" обновлен!`, 'success');
        }
      } else {
        // Создание нового бюджета
        await api.post(`/finance/${walletId}/budget`, budgetData);
        showSnackbar(`Бюджет для "${newBudget.category}" установлен!`, 'success');
      }

      setNewBudget({ category: '', limitAmount: '' });
      setEditingBudget(null);
      setOpenDialog(false);
      fetchData(); // Обновляем данные
      
    } catch (error) {
      console.error('Ошибка установки бюджета:', error);
      showSnackbar(error.response?.data?.message || 'Ошибка при установке бюджета', 'error');
    }
  };

  // Удаление бюджета
  const handleDeleteBudget = async (category) => {
    if (!window.confirm(`Удалить бюджет для категории "${category}"?`)) return;

    try {
      await api.delete(`/finance/${walletId}/budget`, {
        params: { category }
      });
      
      showSnackbar(`Бюджет для "${category}" удален`, 'success');
      fetchData(); // Обновляем данные
      
    } catch (error) {
      console.error('Ошибка удаления бюджета:', error);
      showSnackbar('Ошибка при удалении бюджета', 'error');
    }
  };

  // Редактирование бюджета
  const handleEditBudget = (budget) => {
    setEditingBudget(budget);
    setNewBudget({
      category: budget.category,
      limitAmount: budget.limitAmount.toString(),
    });
    setOpenDialog(true);
  };

  // Установка нескольких бюджетов (быстрый выбор)
  const handleQuickSetBudgets = async (quickBudgets) => {
    try {
      const budgetsArray = quickBudgets.map(budget => ({
        category: budget.category,
        limitAmount: budget.amount,
      }));

      await api.post(`/finance/${walletId}/budgets`, budgetsArray);
      showSnackbar('Бюджеты успешно установлены!', 'success');
      fetchData(); // Обновляем данные
      
    } catch (error) {
      console.error('Ошибка установки бюджетов:', error);
      showSnackbar('Ошибка при установке бюджетов', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const getStatusColor = (usagePercentage, exceeded) => {
    if (exceeded) return '#F44336';
    if (usagePercentage > 80) return '#FF9800';
    if (usagePercentage > 50) return '#FFC107';
    return '#4CAF50';
  };

  const getStatusText = (usagePercentage, exceeded) => {
    if (exceeded) return 'Превышен';
    if (usagePercentage > 80) return 'Внимание';
    if (usagePercentage > 50) return 'Норма';
    return 'В норме';
  };

  // Быстрые шаблоны бюджетов
  const quickBudgetTemplates = [
    {
      name: 'Базовый',
      budgets: [
        { category: 'Продукты', amount: 20000 },
        { category: 'Транспорт', amount: 8000 },
        { category: 'Жилье', amount: 15000 },
        { category: 'Развлечения', amount: 5000 },
      ]
    },
    {
      name: 'Экономный',
      budgets: [
        { category: 'Продукты', amount: 15000 },
        { category: 'Транспорт', amount: 5000 },
        { category: 'Жилье', amount: 12000 },
        { category: 'Развлечения', amount: 3000 },
      ]
    },
    {
      name: 'Премиум',
      budgets: [
        { category: 'Продукты', amount: 30000 },
        { category: 'Транспорт', amount: 15000 },
        { category: 'Жилье', amount: 25000 },
        { category: 'Развлечения', amount: 10000 },
      ]
    }
  ];

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

  const availableCategories = categories.filter(cat => 
    !budgets.some(b => b.category === cat)
  );
  const categoryAlreadyExists =
    !!newBudget.category &&
    budgets.some((b) => b.category === newBudget.category) &&
    (!editingBudget || newBudget.category !== editingBudget.category);

  const categoryOptions = editingBudget
    ? [editingBudget.category, ...availableCategories]
    : availableCategories;

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

      {/* Заголовок и управление */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
            Управление бюджетами
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Установите лимиты расходов по категориям для контроля финансов
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Обновить">
            <IconButton onClick={fetchData} disabled={loading}>
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
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setEditingBudget(null);
              setNewBudget({ category: '', limitAmount: '' });
              setOpenDialog(true);
            }}
          >
            Новый бюджет
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      <Grid container spacing={3}>
        {/* Левая колонка: Обзор и быстрые действия */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, boxShadow: 3, mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Savings color="primary" sx={{ fontSize: 30, mr: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Обзор бюджетов
                </Typography>
              </Box>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Всего бюджетов
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {budgets.length}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Превышено
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: '#F44336' }}>
                    {budgets.filter(b => b.exceeded).length}
                  </Typography>
                </Grid>
              </Grid>
              
              {statistics && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Общие расходы: {formatCurrency(statistics.totalExpense || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Общий лимит: {formatCurrency(budgets.reduce((sum, b) => sum + b.limitAmount, 0))}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Быстрые шаблоны */}
          <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Быстрые шаблоны
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Выберите готовый шаблон для быстрой настройки бюджетов
              </Typography>
              
              {quickBudgetTemplates.map((template, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                      {template.name}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleQuickSetBudgets(template.budgets)}
                    >
                      Применить
                    </Button>
                  </Box>
                  <Box sx={{ pl: 1 }}>
                    {template.budgets.map((budget, idx) => (
                      <Typography key={idx} variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {budget.category}: {formatCurrency(budget.amount)}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Правая колонка: Список бюджетов */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 2, boxShadow: 3, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Category color="primary" sx={{ fontSize: 30, mr: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Мои бюджеты
                </Typography>
              </Box>

              {budgets.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Savings sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Бюджеты не установлены
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Установите бюджеты для контроля расходов по категориям
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setOpenDialog(true)}
                  >
                    Создать первый бюджет
                  </Button>
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Категория</TableCell>
                        <TableCell align="right">Лимит</TableCell>
                        <TableCell align="right">Потрачено</TableCell>
                        <TableCell align="right">Осталось</TableCell>
                        <TableCell align="center">Использовано</TableCell>
                        <TableCell align="center">Статус</TableCell>
                        <TableCell align="center">Действия</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {budgets.map((budget) => (
                        <TableRow key={budget.category} hover>
                          <TableCell>
                            <Typography sx={{ fontWeight: 500 }}>
                              {budget.category}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography sx={{ fontWeight: 600 }}>
                              {formatCurrency(budget.limitAmount)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography sx={{ color: '#F44336', fontWeight: 500 }}>
                              {formatCurrency(budget.currentSpent)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              sx={{
                                fontWeight: 600,
                                color: budget.remaining >= 0 ? '#4CAF50' : '#F44336'
                              }}
                            >
                              {formatCurrency(budget.remaining)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ flexGrow: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min(budget.usagePercentage, 100)}
                                  sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: 'rgba(0,0,0,0.1)',
                                    '& .MuiLinearProgress-bar': {
                                      backgroundColor: getStatusColor(budget.usagePercentage, budget.exceeded),
                                      borderRadius: 4,
                                    }
                                  }}
                                />
                              </Box>
                              <Typography variant="body2" sx={{ minWidth: 40 }}>
                                {budget.usagePercentage.toFixed(1)}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={getStatusText(budget.usagePercentage, budget.exceeded)}
                              size="small"
                              sx={{
                                backgroundColor: budget.exceeded 
                                  ? 'rgba(244, 67, 54, 0.1)' 
                                  : budget.usagePercentage > 80 
                                    ? 'rgba(255, 152, 0, 0.1)' 
                                    : 'rgba(76, 175, 80, 0.1)',
                                color: getStatusColor(budget.usagePercentage, budget.exceeded),
                                fontWeight: 500,
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                              <Tooltip title="Редактировать">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditBudget(budget)}
                                  color="primary"
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Удалить">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteBudget(budget.category)}
                                  color="error"
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              
              {/* Подсказки по управлению */}
              {budgets.length > 0 && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning fontSize="small" />
                    <strong>Совет:</strong> Регулярно проверяйте статус бюджетов и корректируйте их в соответствии с вашими финансовыми целями
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Диалог создания/редактирования бюджета */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingBudget ? 'Редактировать бюджет' : 'Новый бюджет'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
              Категория
            </Typography>
            <Autocomplete
              freeSolo
              options={categoryOptions}
              value={newBudget.category || null}
              onChange={(e, newValue) =>
                setNewBudget({ ...newBudget, category: newValue || '' })
              }
              onInputChange={(e, inputValue) =>
                setNewBudget((prev) => ({ ...prev, category: inputValue || '' }))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Выберите или введите свою категорию"
                  sx={{ mb: 3 }}
                  error={categoryAlreadyExists}
                  helperText={
                    categoryAlreadyExists
                      ? 'Бюджет для этой категории уже существует'
                      : 'Нет нужной категории? Просто начните вводить — она сохранится.'
                  }
                />
              )}
            />

            <TextField
              fullWidth
              label="Лимит бюджета (₽)"
              type="number"
              value={newBudget.limitAmount}
              onChange={(e) => setNewBudget({ ...newBudget, limitAmount: e.target.value })}
              inputProps={{ min: "0.01", step: "0.01" }}
              helperText="Максимальная сумма расходов для этой категории"
            />
            
            {statistics?.expenseByCategory?.[newBudget.category] && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Текущие расходы:</strong> {formatCurrency(statistics.expenseByCategory[newBudget.category])}
                </Typography>
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Отмена</Button>
          <Button 
            onClick={handleSetBudget} 
            variant="contained"
            disabled={!newBudget.category || !newBudget.limitAmount || categoryAlreadyExists}
          >
            {editingBudget ? 'Обновить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Информация о бюджетах */}
      <Box sx={{ mt: 4 }}>
        <Alert severity="info">
          <Typography variant="body2">
            <strong>Как работают бюджеты:</strong> Когда вы устанавливаете бюджет для категории, система отслеживает все 
            расходы в этой категории. При достижении 80% лимита вы получите предупреждение, а при превышении - уведомление.
          </Typography>
        </Alert>
      </Box>
    </Container>
  );
};

export default Budget;