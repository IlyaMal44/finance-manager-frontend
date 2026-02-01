import React, { useState, useEffect } from 'react';
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
} from '@mui/material';

const Dashboard = () => {
  const [walletId] = useState(localStorage.getItem('walletId'));
  const [statistics, setStatistics] = useState(null);
  const [transaction, setTransaction] = useState({
    type: 'EXPENSE',
    amount: '',
    category: '',
    description: '',
  });
  const [categories] = useState([
    'Продукты', 'Транспорт', 'Развлечения', 'Одежда', 
    'Здоровье', 'Образование', 'Другое'
  ]);

  useEffect(() => {
    fetchStatistics();
  }, [walletId]);

  const fetchStatistics = async () => {
    try {
      const response = await api.get(`/finance/${walletId}/statistics`);
      setStatistics(response.data);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/finance/${walletId}/transaction`, {
        ...transaction,
        amount: parseFloat(transaction.amount),
      });
      setTransaction({ type: 'EXPENSE', amount: '', category: '', description: '' });
      fetchStatistics();
      alert('Транзакция добавлена!');
    } catch (error) {
      alert(error.response?.data?.message || 'Ошибка');
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom sx={{ mt: 3 }}>
        Финансовый менеджер
      </Typography>

      {statistics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Баланс
                </Typography>
                <Typography variant="h5" color={statistics.balance >= 0 ? 'success.main' : 'error.main'}>
                  {statistics.balance.toFixed(2)} ₽
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Доходы
                </Typography>
                <Typography variant="h5" color="success.main">
                  {statistics.totalIncome.toFixed(2)} ₽
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Расходы
                </Typography>
                <Typography variant="h5" color="error.main">
                  {statistics.totalExpense.toFixed(2)} ₽
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Новая транзакция
              </Typography>
              <form onSubmit={handleTransactionSubmit}>
                <TextField
                  select
                  fullWidth
                  label="Тип"
                  value={transaction.type}
                  onChange={(e) => setTransaction({...transaction, type: e.target.value})}
                  margin="normal"
                >
                  <MenuItem value="INCOME">Доход</MenuItem>
                  <MenuItem value="EXPENSE">Расход</MenuItem>
                </TextField>
                
                <TextField
                  fullWidth
                  label="Сумма"
                  type="number"
                  value={transaction.amount}
                  onChange={(e) => setTransaction({...transaction, amount: e.target.value})}
                  margin="normal"
                  required
                />
                
                <TextField
                  select
                  fullWidth
                  label="Категория"
                  value={transaction.category}
                  onChange={(e) => setTransaction({...transaction, category: e.target.value})}
                  margin="normal"
                  required
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </TextField>
                
                <TextField
                  fullWidth
                  label="Описание"
                  value={transaction.description}
                  onChange={(e) => setTransaction({...transaction, description: e.target.value})}
                  margin="normal"
                />
                
                <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
                  Добавить транзакцию
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Статистика по категориям
              </Typography>
              {statistics?.expenseByCategory && Object.entries(statistics.expenseByCategory).map(([category, amount]) => (
                <Box key={category} sx={{ mb: 1 }}>
                  <Typography>{category}: {amount.toFixed(2)} ₽</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;