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
} from '@mui/material';

const Transactions = () => {
  const [walletId] = useState(localStorage.getItem('walletId'));
  const [transactions, setTransactions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Временные моковые данные
    const mockTransactions = [
      { id: 1, type: 'INCOME', amount: 50000, category: 'Зарплата', description: 'Январь', date: '2024-01-10' },
      { id: 2, type: 'EXPENSE', amount: 1500, category: 'Продукты', description: 'Супермаркет', date: '2024-01-15' },
      { id: 3, type: 'EXPENSE', amount: 3000, category: 'Транспорт', description: 'Бензин', date: '2024-01-12' },
    ];
    setTransactions(mockTransactions);
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 3 }}>
      <Typography variant="h4" gutterBottom>
        История транзакций
      </Typography>

      <Button 
        variant="outlined" 
        onClick={() => navigate('/dashboard')}
        sx={{ mb: 3 }}
      >
        Назад к дашборду
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Дата</TableCell>
              <TableCell>Тип</TableCell>
              <TableCell>Категория</TableCell>
              <TableCell>Описание</TableCell>
              <TableCell align="right">Сумма</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{transaction.date}</TableCell>
                <TableCell>
                  <Chip
                    label={transaction.type === 'INCOME' ? 'Доход' : 'Расход'}
                    color={transaction.type === 'INCOME' ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{transaction.category}</TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell align="right" sx={{ 
                  color: transaction.type === 'INCOME' ? 'success.main' : 'error.main',
                  fontWeight: 'bold'
                }}>
                  {transaction.type === 'INCOME' ? '+' : '-'}{transaction.amount.toFixed(2)} ₽
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Alert severity="info" sx={{ mt: 3 }}>
        Это демо-данные. Для реальных данных нужно добавить endpoint в бэкенд.
      </Alert>
    </Container>
  );
};

export default Transactions;