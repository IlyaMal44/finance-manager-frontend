import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DarkMode, LightMode } from '@mui/icons-material';
import MenuIcon from '@mui/icons-material/Menu';

const NAV_ITEMS = [
  { label: 'Бюджеты', to: '/budgets' },
  { label: 'Дашборд', to: '/dashboard' },
  { label: 'Транзакции', to: '/transactions' },
];

const Header = ({ mode, toggleMode }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  const isMenuOpen = Boolean(menuAnchorEl);
  const handleOpenMenu = (event) => setMenuAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setMenuAnchorEl(null);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('walletId');
    handleCloseMenu();
    navigate('/login');
  };

  if (!user) return null;

  const handleNavigate = (to) => {
    handleCloseMenu();
    navigate(to);
  };

  return (
    <AppBar position="static">
      <Toolbar>
        {isMobile && (
          <IconButton color="inherit" edge="start" onClick={handleOpenMenu} aria-label="Открыть меню">
            <MenuIcon />
          </IconButton>
        )}

        <Typography variant="h6" sx={{ flexGrow: 1 }} noWrap>
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            Finance Manager |{' '}
          </Box>
          <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
            Finance |{' '}
          </Box>
          {user.username}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={mode === 'dark' ? 'Светлая тема' : 'Тёмная тема'}>
            <IconButton color="inherit" onClick={toggleMode} aria-label="Переключить тему">
              {mode === 'dark' ? <LightMode /> : <DarkMode />}
            </IconButton>
          </Tooltip>

          {!isMobile && (
            <>
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
            </>
          )}
        </Box>

        {isMobile && (
          <Menu
            anchorEl={menuAnchorEl}
            open={isMenuOpen}
            onClose={handleCloseMenu}
            keepMounted
          >
            {NAV_ITEMS.map((item) => (
              <MenuItem key={item.to} onClick={() => handleNavigate(item.to)}>
                {item.label}
              </MenuItem>
            ))}
            <Divider />
            <MenuItem onClick={handleLogout}>Выйти</MenuItem>
          </Menu>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;