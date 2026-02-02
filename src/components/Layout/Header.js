import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('walletId');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Finance Manager | {user.username}
        </Typography>
        <Box>
           <Button color="inherit" onClick={() => navigate('/budgets')}>
            Бюджеты
          </Button>
          <Button color="inherit" onClick={() => navigate('/dashboard')}>
            Дашборд
          </Button>
          <Button color="inherit" onClick={() => navigate('/transactions')}>
            Транзакции
          </Button>
          <Button color="inherit" onClick={handleLogout}>
            Выйти
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;