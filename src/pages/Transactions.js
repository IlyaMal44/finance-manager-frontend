import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  Autocomplete,
  Card,
  CardContent,
  useMediaQuery,
  Pagination,
} from '@mui/material';
import {
  Visibility,
  ArrowUpward,
  ArrowDownward,
  ArrowBack,
  Edit,
  Delete,
  ReceiptLong,
  FilterList,
} from '@mui/icons-material';

const Transactions = () => {
  const [walletId] = useState(localStorage.getItem('walletId'));
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState(null);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const dateFromInputRef = useRef(null);
  const dateToInputRef = useRef(null);
  const navigate = useNavigate();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));

  const ROWS_PER_PAGE = 10;

  const incomeCategories = [
    'Зарплата', 'Фриланс', 'Инвестиции', 'Подарок', 'Возврат долга', 'Дивиденды', 'Стипендия', 'Пенсия', 'Другое (доход)',
  ];

  const expenseCategories = [
    'Продукты', 'Транспорт', 'Развлечения', 'Одежда',
    'Здоровье', 'Образование', 'Жилье', 'Коммунальные',
    'Связь', 'Кредит', 'Подарки', 'Путешествия',
    'Красота', 'Спорт', 'Другое (расход)',
  ];

  const categoriesForFilter = [
    ...new Set([
      ...incomeCategories,
      ...expenseCategories,
      ...transactions.map((t) => t.category).filter(Boolean),
    ]),
  ].sort((a, b) => a.localeCompare(b));

  const getCurrentCategoriesForEdit = () => {
    if (!editTransaction) return [];
    return editTransaction.type === 'INCOME' ? incomeCategories : expenseCategories;
  };

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/finance/${walletId}/transactions`);
      const data = Array.isArray(response.data) ? response.data : [];
      setTransactions(data);
    } catch (error) {
      console.error('Ошибка загрузки транзакций:', error);
      setError(error.response?.data?.message || 'Не удалось загрузить историю транзакций');

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
    if (walletId) {
      fetchTransactions();
    }
  }, [walletId, fetchTransactions]);

  useEffect(() => {
    setTransactionsPage(1);
  }, [filterType, filterCategory, filterDateFrom, filterDateTo]);

  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setViewDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setViewDialogOpen(false);
    setSelectedTransaction(null);
  };

  const handleOpenEditDialog = (transaction) => {
    setEditTransaction({
      ...transaction,
      amount: transaction.amount != null ? String(transaction.amount) : '',
    });
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditTransaction(null);
  };

  const handleDeleteTransaction = async (transaction) => {
    if (!window.confirm('Удалить эту транзакцию?')) return;
    try {
      await api.delete(`/finance/${walletId}/transactions/${transaction.id}`);
      setTransactions((prev) => prev.filter((t) => t.id !== transaction.id));
    } catch (error) {
      console.error('Ошибка удаления транзакции:', error);
      setError(error.response?.data?.message || 'Не удалось удалить транзакцию');
    }
  };

  const handleSaveEditTransaction = async () => {
    if (!editTransaction) return;
    try {
      await api.put(`/finance/${walletId}/transactions/${editTransaction.id}`, {
        type: editTransaction.type,
        amount: parseFloat(editTransaction.amount),
        category: editTransaction.category,
        description: editTransaction.description,
        date: editTransaction.date,
      });
      await fetchTransactions();
      handleCloseEditDialog();
    } catch (error) {
      console.error('Ошибка обновления транзакции:', error);
      const backendMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        '';
      const isInsufficientFunds =
        /Недостаточно средств/i.test(backendMessage) ||
        /InsufficientFunds/i.test(backendMessage);

      if ((error.response?.status === 403 || isInsufficientFunds) && editTransaction?.type === 'EXPENSE') {
        setError(
          'Недостаточно средств. Уменьшите сумму расхода или сначала добавьте доход (пополнение).',
        );
      } else {
        setError(backendMessage || 'Не удалось обновить транзакцию');
      }
    }
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
      if (Number.isNaN(date.getTime())) return dateString;

      const tz = 'Europe/Moscow';
      const parts = new Intl.DateTimeFormat('ru-RU', {
        timeZone: tz,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).formatToParts(date);

      const get = (type) => parts.find((p) => p.type === type)?.value || '';
      const dateStr = `${get('day')}.${get('month')}.${get('year')}`;
      const timeStr = `${get('hour')}:${get('minute')}`;
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

    if (filterDateFrom || filterDateTo) {
      filtered = filtered.filter((t) => {
        const raw = t.date || t.createdAt;
        if (!raw) return false;
        const d = new Date(raw);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${day}`;
        if (filterDateFrom && dateStr < filterDateFrom) return false;
        if (filterDateTo && dateStr > filterDateTo) return false;
        return true;
      });
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
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / ROWS_PER_PAGE));
  const currentPage = Math.min(transactionsPage, totalPages);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE,
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Заголовок в формочке — как на главной и в бюджетах */}
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
            История транзакций
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5, maxWidth: 560 }}>
            Просмотр и управление всеми финансовыми операциями
          </Typography>
        </Box>
      </Paper>

      {/* Показано транзакций — карточка с блоками доходов/расходов */}
      {transactions.length > 0 && (
        <Card
          sx={(theme) => ({
            mb: 3,
            borderRadius: 2.5,
            boxShadow: 2,
            overflow: 'hidden',
            height: { xs: 172, sm: 'auto' },
            minHeight: { xs: 172, sm: 'auto' },
            background:
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(25,118,210,0.25), rgba(0,0,0,0) 70%)'
                : 'linear-gradient(135deg, rgba(25,118,210,0.12), rgba(255,255,255,0) 70%)',
            border: '1px solid',
            borderColor: 'divider',
          })}
        >
          <CardContent sx={{ py: 2, px: { xs: 2, sm: 2.5 }, height: '100%', overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box
                sx={{
                  width: { xs: 40, sm: 44 },
                  height: { xs: 40, sm: 44 },
                  borderRadius: 2,
                  bgcolor: 'rgba(25,118,210,0.18)',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <ReceiptLong sx={{ fontSize: { xs: 22, sm: 24 }, color: 'primary.main' }} />
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  По текущим фильтрам
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: 'primary.main',
                    fontSize: { xs: '1.25rem', sm: '1.4rem' },
                    lineHeight: 1.2,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {filteredTransactions.length} {filteredTransactions.length === 1 ? 'транзакция' : filteredTransactions.length < 5 ? 'транзакции' : 'транзакций'}
                </Typography>
              </Box>
            </Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 1.5,
                mt: 1.5,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1.25,
                  borderRadius: 2,
                  bgcolor: 'rgba(76, 175, 80, 0.12)',
                  border: '1px solid',
                  borderColor: 'rgba(76, 175, 80, 0.3)',
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1.5,
                    bgcolor: 'rgba(76, 175, 80, 0.2)',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ArrowUpward sx={{ fontSize: 20, color: '#2E7D32' }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" sx={{ color: '#2E7D32', fontWeight: 600, display: 'block' }}>
                    Доходы
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '0.95rem', sm: '1rem' },
                      color: '#1B5E20',
                      fontVariantNumeric: 'tabular-nums',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatCurrency(getTotalAmount('INCOME'))}
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1.25,
                  borderRadius: 2,
                  bgcolor: 'rgba(244, 67, 54, 0.12)',
                  border: '1px solid',
                  borderColor: 'rgba(244, 67, 54, 0.3)',
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1.5,
                    bgcolor: 'rgba(244, 67, 54, 0.2)',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ArrowDownward sx={{ fontSize: 20, color: '#C62828' }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" sx={{ color: '#C62828', fontWeight: 600, display: 'block' }}>
                    Расходы
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '0.95rem', sm: '1rem' },
                      color: '#B71C1C',
                      fontVariantNumeric: 'tabular-nums',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatCurrency(getTotalAmount('EXPENSE'))}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Фильтры - показываем только если есть транзакции */}
      {transactions.length > 0 && (() => {
        const formatDateForDisplay = (ymd) => {
          if (!ymd) return '';
          const [y, m, d] = ymd.split('-');
          return d && m && y ? `${d}.${m}.${y}` : '';
        };
        return (
          <Paper
            variant="outlined"
            sx={(theme) => ({
              p: { xs: 1, sm: 2.5 },
              mb: { xs: 2, sm: 3 },
              borderRadius: 2.5,
              borderColor: 'divider',
              background:
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(25,118,210,0.08), rgba(0,0,0,0) 60%)'
                  : 'linear-gradient(135deg, rgba(25,118,210,0.05), rgba(255,255,255,0) 60%)',
            })}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: { xs: 0.75, sm: 2 } }}>
              <FilterList color="primary" sx={{ fontSize: { xs: 20, sm: 28 } }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', fontSize: { xs: '0.875rem', sm: 'inherit' } }}>
                Фильтры
              </Typography>
            </Box>
            {isMobile ? (
              <>
                <Grid container spacing={1} alignItems="flex-end" sx={{ mb: 1 }}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.25, fontSize: '0.7rem' }}>
                      Тип
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      variant="outlined"
                      sx={(theme) => ({
                        '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', minHeight: 42, fontSize: '14px', color: theme.palette.text.primary },
                        '& .MuiSelect-select': { fontSize: '14px' },
                      })}
                      SelectProps={{
                        displayEmpty: true,
                        renderValue: (s) => (s === 'ALL' ? 'Все типы' : s === 'INCOME' ? 'Доходы' : 'Расходы'),
                      }}
                    >
                      <MenuItem value="ALL">Все типы</MenuItem>
                      <MenuItem value="INCOME">Доходы</MenuItem>
                      <MenuItem value="EXPENSE">Расходы</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.25, fontSize: '0.7rem' }}>
                      Категория
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      variant="outlined"
                      sx={(theme) => ({
                        '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', minHeight: 42, fontSize: '14px', color: theme.palette.text.primary },
                        '& .MuiSelect-select': { fontSize: '14px' },
                      })}
                      SelectProps={{ displayEmpty: true, renderValue: (s) => s || 'Все категории' }}
                    >
                      <MenuItem value="">Все категории</MenuItem>
                      {categoriesForFilter.map((category) => (
                        <MenuItem key={category} value={category}>{category}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
                <Grid container spacing={1} alignItems="flex-end">
                  <Grid item xs={4} sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.25, fontSize: '0.75rem' }}>
                      Дата с
                    </Typography>
                    <Box
                      sx={(theme) => ({
                        position: 'relative',
                        height: 48,
                        minHeight: 48,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: theme.palette.divider,
                        bgcolor: 'background.paper',
                        display: 'flex',
                        alignItems: 'center',
                        px: 1.25,
                      })}
                    >
                      <input
                        ref={dateFromInputRef}
                        type="date"
                        value={filterDateFrom}
                        onChange={(e) => setFilterDateFrom(e.target.value)}
                        max={filterDateTo || undefined}
                        aria-label="Дата с"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', fontSize: 16, zIndex: 1 }}
                      />
                      <Typography variant="body1" noWrap sx={{ fontWeight: 400, fontSize: '1rem', color: filterDateFrom ? 'text.primary' : 'text.secondary', pointerEvents: 'none', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {filterDateFrom ? formatDateForDisplay(filterDateFrom) : 'дд.мм.гггг'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4} sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.25, fontSize: '0.75rem' }}>
                      Дата по
                    </Typography>
                    <Box
                      sx={(theme) => ({
                        position: 'relative',
                        height: 48,
                        minHeight: 48,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: theme.palette.divider,
                        bgcolor: 'background.paper',
                        display: 'flex',
                        alignItems: 'center',
                        px: 1.25,
                      })}
                    >
                      <input
                        ref={dateToInputRef}
                        type="date"
                        value={filterDateTo}
                        onChange={(e) => setFilterDateTo(e.target.value)}
                        min={filterDateFrom || undefined}
                        aria-label="Дата по"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', fontSize: 16, zIndex: 1 }}
                      />
                      <Typography variant="body1" noWrap sx={{ fontWeight: 400, fontSize: '1rem', color: filterDateTo ? 'text.primary' : 'text.secondary', pointerEvents: 'none', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {filterDateTo ? formatDateForDisplay(filterDateTo) : 'дд.мм.гггг'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4} sx={{ minWidth: 0 }}>
                    <Button
                      variant="outlined"
                      onClick={() => { setFilterType('ALL'); setFilterCategory(''); setFilterDateFrom(''); setFilterDateTo(''); }}
                      fullWidth
                      sx={{ minHeight: 48, fontSize: '0.875rem', py: 0.75, whiteSpace: 'nowrap' }}
                    >
                      Сбросить
                    </Button>
                  </Grid>
                </Grid>
              </>
            ) : (
            <Grid container spacing={2} alignItems="flex-end">
              <Grid item xs={6} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.25, fontSize: { xs: '0.7rem', sm: 'inherit' } }}>
                  Тип
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  variant="outlined"
                  sx={(theme) => ({
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'background.paper',
                      minHeight: { xs: 42, sm: 40 },
                      fontSize: { xs: '14px', sm: 'inherit' },
                      color: theme.palette.text.primary,
                    },
                    '& .MuiSelect-select': { fontSize: { xs: '14px', sm: 'inherit' } },
                  })}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (selected) => {
                    if (selected === 'ALL') return 'Все типы';
                      return selected === 'INCOME' ? 'Доходы' : 'Расходы';
                    },
                  }}
                >
                  <MenuItem value="ALL">Все типы</MenuItem>
                  <MenuItem value="INCOME">Доходы</MenuItem>
                  <MenuItem value="EXPENSE">Расходы</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.25, fontSize: { xs: '0.7rem', sm: 'inherit' } }}>
                  Категория
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  variant="outlined"
                  sx={(theme) => ({
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'background.paper',
                      minHeight: { xs: 42, sm: 40 },
                      fontSize: { xs: '14px', sm: 'inherit' },
                      color: theme.palette.text.primary,
                    },
                    '& .MuiSelect-select': { fontSize: { xs: '14px', sm: 'inherit' } },
                  })}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (selected) => selected || 'Все категории',
                  }}
                >
                  <MenuItem value="">Все категории</MenuItem>
                  {categoriesForFilter.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={4} sm={6} md={2} sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.25, fontSize: { xs: '0.7rem', sm: 'inherit' } }}>
                  Дата с
                </Typography>
                {isMobile ? (
                  <Box
                    sx={(theme) => ({
                      position: 'relative',
                      height: 42,
                      minHeight: 42,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: theme.palette.divider,
                      bgcolor: 'background.paper',
                      display: 'flex',
                      alignItems: 'center',
                      px: 1,
                    })}
                  >
                    <input
                      ref={dateFromInputRef}
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                      max={filterDateTo || undefined}
                      aria-label="Дата с"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer',
                        fontSize: 16,
                        zIndex: 1,
                      }}
                    />
                    <Typography
                      variant="body1"
                      noWrap
                      sx={{
                        fontWeight: 400,
                        fontSize: { xs: '0.8125rem', sm: '1rem' },
                        color: filterDateFrom ? 'text.primary' : 'text.secondary',
                        pointerEvents: 'none',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {filterDateFrom ? formatDateForDisplay(filterDateFrom) : 'дд.мм.гггг'}
                    </Typography>
                  </Box>
                ) : (
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', minHeight: 40 } }}
                    inputProps={{ max: filterDateTo || undefined }}
                  />
                )}
              </Grid>
              <Grid item xs={4} sm={6} md={2} sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.25, fontSize: { xs: '0.7rem', sm: 'inherit' } }}>
                  Дата по
                </Typography>
                {isMobile ? (
                  <Box
                    sx={(theme) => ({
                      position: 'relative',
                      height: 42,
                      minHeight: 42,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: theme.palette.divider,
                      bgcolor: 'background.paper',
                      display: 'flex',
                      alignItems: 'center',
                      px: 1,
                    })}
                  >
                    <input
                      ref={dateToInputRef}
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                      min={filterDateFrom || undefined}
                      aria-label="Дата по"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer',
                        fontSize: 16,
                        zIndex: 1,
                      }}
                    />
                    <Typography
                      variant="body1"
                      noWrap
                      sx={{
                        fontWeight: 400,
                        fontSize: { xs: '0.8125rem', sm: '1rem' },
                        color: filterDateTo ? 'text.primary' : 'text.secondary',
                        pointerEvents: 'none',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {filterDateTo ? formatDateForDisplay(filterDateTo) : 'дд.мм.гггг'}
                    </Typography>
                  </Box>
                ) : (
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', minHeight: 40 } }}
                    inputProps={{ min: filterDateFrom || undefined }}
                  />
                )}
              </Grid>
              <Grid item xs={4} sm={12} md={2} sx={{ minWidth: 0 }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setFilterType('ALL');
                    setFilterCategory('');
                    setFilterDateFrom('');
                    setFilterDateTo('');
                  }}
                  fullWidth
                  sx={{ minHeight: { xs: 42, sm: 40 }, fontSize: { xs: '0.8125rem', sm: 'inherit' }, py: { xs: 0.75, sm: 1 }, whiteSpace: 'nowrap' }}
                >
                  Сбросить
                </Button>
              </Grid>
            </Grid>
            )}
          </Paper>
        );
      })()}

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
            Перейдите в раздел «Главная» и добавьте свою первую транзакцию!
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/dashboard')}
            startIcon={<ArrowBack />}
            sx={{ mt: 2 }}
          >
            Главная
          </Button>
        </Box>
      ) : (
        <>
          {filteredTransactions.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Нет транзакций, соответствующих выбранным фильтрам
              </Typography>
            </Paper>
          ) : isMobile ? (
            <>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                {paginatedTransactions.map((transaction) => (
                  <Paper
                    key={transaction.id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderLeft: '4px solid',
                      borderLeftColor: transaction.type === 'INCOME' ? '#4CAF50' : '#F44336',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(transaction.date || transaction.createdAt)}
                      </Typography>
                      <Chip
                        icon={getTypeIcon(transaction.type)}
                        label={transaction.type === 'INCOME' ? 'Доход' : 'Расход'}
                        color={transaction.type === 'INCOME' ? 'success' : 'error'}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                      {transaction.category}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }} noWrap>
                      {transaction.description || 'Без описания'}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 700,
                          color: transaction.type === 'INCOME' ? '#4CAF50' : '#F44336',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {transaction.type === 'INCOME' ? '+' : '−'}
                        {formatCurrency(transaction.amount)}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton size="small" onClick={() => handleViewTransaction(transaction)} color="primary" aria-label="Просмотреть">
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleOpenEditDialog(transaction)} color="primary" aria-label="Изменить">
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteTransaction(transaction)} color="error" aria-label="Удалить">
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 2 }}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={(_, p) => setTransactionsPage(p)}
                    color="primary"
                    size="large"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </>
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
                    {paginatedTransactions.map((transaction) => (
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
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                            <Tooltip title="Просмотреть детали">
                              <IconButton
                                size="small"
                                onClick={() => handleViewTransaction(transaction)}
                                color="primary"
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Изменить">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenEditDialog(transaction)}
                                color="primary"
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Удалить">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteTransaction(transaction)}
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
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 2 }}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={(_, p) => setTransactionsPage(p)}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </>
          )}

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

          {/* Диалог редактирования транзакции */}
          <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
            {editTransaction && (
              <>
                <DialogTitle>Редактирование транзакции</DialogTitle>
                <DialogContent>
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Тип транзакции
                        </Typography>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label=""
                          value={editTransaction.type}
                          onChange={(e) => {
                            const newType = e.target.value;
                            const newCategories = newType === 'INCOME' ? incomeCategories : expenseCategories;
                            const shouldResetCategory = !newCategories.includes(editTransaction.category);
                            setEditTransaction({
                              ...editTransaction,
                              type: newType,
                              category: shouldResetCategory ? '' : editTransaction.category,
                            });
                          }}
                        >
                          <MenuItem value="INCOME">Доход</MenuItem>
                          <MenuItem value="EXPENSE">Расход</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Сумма
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          label=""
                          type="number"
                          value={editTransaction.amount}
                          onChange={(e) =>
                            setEditTransaction({ ...editTransaction, amount: e.target.value })
                          }
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Категория
                        </Typography>
                        <Autocomplete
                          freeSolo
                          options={getCurrentCategoriesForEdit()}
                          value={editTransaction.category || null}
                          inputValue={editTransaction.category || ''}
                          onChange={(e, newValue) =>
                            setEditTransaction({ ...editTransaction, category: newValue || '' })
                          }
                          onInputChange={(e, inputValue, reason) => {
                            if (reason === 'input') {
                              setEditTransaction((prev) => ({ ...prev, category: inputValue || '' }));
                            }
                            if (reason === 'clear') {
                              setEditTransaction((prev) => ({ ...prev, category: '' }));
                            }
                          }}
                          clearText=""
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
                          renderOption={(props, option) => (
                            <li {...props} key={option}>
                              <span style={{ fontSize: 16, color: '#1a1a1a', fontWeight: 500 }}>
                                {option}
                              </span>
                            </li>
                          )}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              size="small"
                              placeholder="Выберите или введите свою категорию"
                              helperText="Нет нужной категории? Просто начните вводить — она сохранится."
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Описание (необязательно)
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          label=""
                          multiline
                          rows={2}
                          value={editTransaction.description || ''}
                          onChange={(e) =>
                            setEditTransaction({ ...editTransaction, description: e.target.value })
                          }
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleCloseEditDialog}>Отмена</Button>
                  <Button onClick={handleSaveEditTransaction} variant="contained">
                    Сохранить
                  </Button>
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