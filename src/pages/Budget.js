import React, { useCallback, useEffect, useState } from 'react';
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
  Autocomplete,
  Tooltip,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Warning,
  Savings,
  Category,
  Refresh,
  ArrowBack,
  ExpandMore,
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
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const [budgetQuery, setBudgetQuery] = useState('');
  const [budgetFilter, setBudgetFilter] = useState('all'); // all | exceeded | near
  const [categories] = useState([
    'Продукты', 'Транспорт', 'Развлечения', 'Одежда',
    'Здоровье', 'Образование', 'Жилье', 'Коммунальные',
    'Связь', 'Кредит', 'Подарки', 'Путешествия',
    'Красота', 'Спорт', 'Другое'
  ]);
  
  const navigate = useNavigate();

  const showSnackbar = useCallback((message, severity) => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Загрузка данных
  const fetchData = useCallback(async () => {
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
  }, [walletId, showSnackbar]);

  useEffect(() => {
    if (!user || !user.username) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user, navigate, fetchData]);

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
      name: 'Шаблон',
      description: 'Быстрая настройка бюджетов по базовым категориям.',
      budgets: [
        { category: 'Продукты', amount: 22000 },
        { category: 'Транспорт', amount: 8000 },
        { category: 'Жилье', amount: 18000 },
        { category: 'Развлечения', amount: 6000 },
        { category: 'Связь', amount: 1500 },
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

  const exceededCount = budgets.filter((b) => b.exceeded).length;
  const totalLimitAmount = budgets.reduce((sum, b) => sum + (Number(b.limitAmount) || 0), 0);
  const totalSpentAmount = budgets.reduce((sum, b) => sum + (Number(b.currentSpent) || 0), 0);
  const totalRemainingAmount = totalLimitAmount - totalSpentAmount;
  const overallUsagePct = totalLimitAmount > 0 ? (totalSpentAmount / totalLimitAmount) * 100 : 0;
  const overallStatusColor = exceededCount > 0 ? '#F44336' : overallUsagePct > 80 ? '#FF9800' : '#4CAF50';

  const normalizedBudgetQuery = (budgetQuery || '').trim().toLowerCase();
  const budgetsSorted = [...budgets].sort((a, b) => {
    // Сначала превышенные, затем по % использования, затем по алфавиту
    if (!!a.exceeded !== !!b.exceeded) return a.exceeded ? -1 : 1;
    const ap = Number(a.usagePercentage) || 0;
    const bp = Number(b.usagePercentage) || 0;
    if (bp !== ap) return bp - ap;
    return String(a.category || '').localeCompare(String(b.category || ''), 'ru');
  });

  const budgetsFiltered = budgetsSorted.filter((b) => {
    const cat = String(b.category || '').toLowerCase();
    const matchesQuery = !normalizedBudgetQuery || cat.includes(normalizedBudgetQuery);
    const pct = Number(b.usagePercentage) || 0;
    const matchesFilter =
      budgetFilter === 'all' ||
      (budgetFilter === 'exceeded' && !!b.exceeded) ||
      (budgetFilter === 'near' && !b.exceeded && pct >= 80);
    return matchesQuery && matchesFilter;
  });

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

      {/* Заголовок и управление */}
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
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
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
              Управление бюджетами
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5, maxWidth: 700 }}>
              Установите лимиты расходов по категориям для контроля финансов
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            mt: 2,
            width: '100%',
          }}
        >
          {isMobile ? (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<ArrowBack />}
                  onClick={() => navigate('/dashboard')}
                  size="medium"
                  sx={{ minHeight: 44, justifyContent: 'center' }}
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
                  size="medium"
                  sx={{ minHeight: 44, justifyContent: 'center' }}
                >
                  Новый бюджет
                </Button>
              </Box>

              <Tooltip title="Обновить">
                <IconButton
                  onClick={fetchData}
                  disabled={loading}
                  sx={{ mt: 0.25 }}
                  aria-label="Обновить"
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
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
              <Tooltip title="Обновить">
                <IconButton onClick={fetchData} disabled={loading} aria-label="Обновить">
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Левая колонка: Обзор и быстрые действия */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, boxShadow: 3, mb: 3 }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'stretch', sm: 'center' },
                  justifyContent: 'space-between',
                  gap: 1.25,
                  mb: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                  <Box
                    sx={(theme) => ({
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      display: 'grid',
                      placeItems: 'center',
                      background:
                        theme.palette.mode === 'dark'
                          ? 'linear-gradient(135deg, rgba(25,118,210,0.35), rgba(0,0,0,0))'
                          : 'linear-gradient(135deg, rgba(25,118,210,0.18), rgba(255,255,255,0))',
                      border: '1px solid',
                      borderColor: 'divider',
                    })}
                  >
                    <Savings color="primary" />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1 }} noWrap>
                      Обзор бюджетов
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
                      Суммарно по лимитам и статусам
                    </Typography>
                  </Box>
                </Box>

                <Chip
                  size="small"
                  variant="outlined"
                  color={exceededCount > 0 ? 'error' : 'success'}
                  label={exceededCount > 0 ? `⚠️ Превышено: ${exceededCount}` : 'В норме'}
                  sx={{ fontWeight: 700, alignSelf: { xs: 'flex-start', sm: 'auto' } }}
                />
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 1.5,
                  mb: 2,
                }}
              >
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Всего бюджетов
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                    {budgets.length}
                  </Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Превышено
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 900, lineHeight: 1.1, color: exceededCount > 0 ? '#F44336' : 'text.primary' }}
                  >
                    {exceededCount}
                  </Typography>
                </Paper>
              </Box>

              {budgets.length > 0 && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Потрачено / лимит
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>
                      {formatCurrency(totalSpentAmount)} / {formatCurrency(totalLimitAmount)}
                    </Typography>
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={Math.min(overallUsagePct, 100)}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: 'rgba(0,0,0,0.08)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: overallStatusColor,
                        borderRadius: 5,
                      },
                    }}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Использовано: {Number.isFinite(overallUsagePct) ? overallUsagePct.toFixed(1) : '0.0'}%
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 800, color: totalRemainingAmount >= 0 ? '#4CAF50' : '#F44336', whiteSpace: 'nowrap' }}
                    >
                      Осталось: {formatCurrency(totalRemainingAmount)}
                    </Typography>
                  </Box>
                </Paper>
              )}
            </CardContent>
          </Card>

          {/* Быстрые шаблоны */}
          <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Быстрый шаблон
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Один пресет для быстрой настройки бюджетов по базовым категориям.
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  flexDirection: { xs: 'column', md: 'row' },
                  overflowX: 'visible',
                  pb: 0,
                  scrollSnapType: 'none',
                }}
              >
                {quickBudgetTemplates.map((template, index) => {
                  const total = template.budgets.reduce((sum, b) => sum + (b.amount || 0), 0);
                  return (
                    <Paper
                      key={index}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        width: { xs: '100%', md: 'auto' },
                        minWidth: 0,
                        flex: { xs: '1 1 auto', md: 1 },
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                            {template.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            {template.description}
                          </Typography>
                        </Box>
                        <Chip
                          label={`Всего: ${formatCurrency(total)}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 600, flexShrink: 0 }}
                        />
                      </Box>

                      <Box sx={{ mt: 1.5 }}>
                        {template.budgets.map((b) => (
                          <Box
                            key={b.category}
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: 1,
                              mb: 0.5,
                            }}
                          >
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap
                              sx={{ minWidth: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}
                            >
                              {b.category}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                              {formatCurrency(b.amount)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>

                      <Button
                        fullWidth
                        size="small"
                        variant="contained"
                        sx={{ mt: 1.5, minHeight: 40 }}
                        onClick={() => handleQuickSetBudgets(template.budgets)}
                      >
                        Применить
                      </Button>
                    </Paper>
                  );
                })}
              </Box>
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
              ) : isMobile ? (
                <Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1, mb: 2 }}>
                    <TextField
                      value={budgetQuery}
                      onChange={(e) => setBudgetQuery(e.target.value)}
                      size="small"
                      placeholder="Поиск по категории…"
                      fullWidth
                    />
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={`Все (${budgets.length})`}
                        variant={budgetFilter === 'all' ? 'filled' : 'outlined'}
                        color={budgetFilter === 'all' ? 'primary' : 'default'}
                        size="small"
                        onClick={() => setBudgetFilter('all')}
                      />
                      <Chip
                        label={`Превышено (${exceededCount})`}
                        variant={budgetFilter === 'exceeded' ? 'filled' : 'outlined'}
                        color={budgetFilter === 'exceeded' ? 'error' : 'default'}
                        size="small"
                        onClick={() => setBudgetFilter('exceeded')}
                      />
                      <Chip
                        label="Почти (80%+)"
                        variant={budgetFilter === 'near' ? 'filled' : 'outlined'}
                        color={budgetFilter === 'near' ? 'warning' : 'default'}
                        size="small"
                        onClick={() => setBudgetFilter('near')}
                      />
                    </Box>
                  </Box>

                  {budgetsFiltered.length === 0 ? (
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Typography color="text.secondary">
                        Ничего не найдено.
                      </Typography>
                    </Paper>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {budgetsFiltered.map((budget) => {
                        const statusColor = getStatusColor(budget.usagePercentage, budget.exceeded);
                        return (
                          <Accordion
                            key={budget.category}
                            disableGutters
                            elevation={0}
                            sx={{
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 2,
                              overflow: 'hidden',
                              '&:before': { display: 'none' },
                            }}
                          >
                            <AccordionSummary expandIcon={<ExpandMore />}>
                              <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box
                                  sx={{
                                    width: 6,
                                    alignSelf: 'stretch',
                                    borderRadius: 1,
                                    bgcolor: statusColor,
                                  }}
                                />
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                  <Typography sx={{ fontWeight: 900 }} noWrap>
                                    {budget.category}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Осталось: {formatCurrency(budget.remaining)} • {budget.usagePercentage.toFixed(0)}%
                                  </Typography>
                                </Box>
                                <Chip
                                  label={getStatusText(budget.usagePercentage, budget.exceeded)}
                                  size="small"
                                  sx={{
                                    backgroundColor: budget.exceeded
                                      ? 'rgba(244, 67, 54, 0.1)'
                                      : budget.usagePercentage > 80
                                        ? 'rgba(255, 152, 0, 0.1)'
                                        : 'rgba(76, 175, 80, 0.1)',
                                    color: statusColor,
                                    fontWeight: 800,
                                  }}
                                />
                              </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ pt: 0 }}>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(budget.usagePercentage, 100)}
                                sx={{
                                  height: 8,
                                  borderRadius: 4,
                                  mb: 1.25,
                                  backgroundColor: 'rgba(0,0,0,0.08)',
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: statusColor,
                                    borderRadius: 4,
                                  },
                                }}
                              />

                              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Лимит
                                  </Typography>
                                  <Typography sx={{ fontWeight: 900 }}>
                                    {formatCurrency(budget.limitAmount)}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Потрачено
                                  </Typography>
                                  <Typography sx={{ fontWeight: 900, color: '#F44336' }}>
                                    {formatCurrency(budget.currentSpent)}
                                  </Typography>
                                </Box>
                              </Box>

                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 1.25, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                                <Button size="small" variant="outlined" onClick={() => handleEditBudget(budget)}>
                                  Изменить
                                </Button>
                                <Button size="small" color="error" variant="outlined" onClick={() => handleDeleteBudget(budget.category)}>
                                  Удалить
                                </Button>
                              </Box>
                            </AccordionDetails>
                          </Accordion>
                        );
                      })}
                    </Box>
                  )}
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
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
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
              inputValue={newBudget.category || ''}
              onChange={(e, newValue) =>
                setNewBudget({ ...newBudget, category: newValue || '' })
              }
              onInputChange={(e, inputValue, reason) => {
                if (reason === 'input') {
                  setNewBudget((prev) => ({ ...prev, category: inputValue || '' }));
                }
                if (reason === 'clear') {
                  setNewBudget((prev) => ({ ...prev, category: '' }));
                }
              }}
              clearText=""
              slotProps={{ clearIndicator: { title: '' } }}
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
            расходы в этой категории. При достижении 80% лимита отображается предупреждение, а при превышении лимита - красная индикация.
          </Typography>
        </Alert>
      </Box>
    </Container>
  );
};

export default Budget;