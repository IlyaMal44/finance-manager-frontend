import React, { useEffect, useState } from 'react';
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
import { DarkMode, HelpOutline, LightMode } from '@mui/icons-material';
import MenuIcon from '@mui/icons-material/Menu';

import HelpDialog from '../Help/HelpDialog';

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
  const [helpOpen, setHelpOpen] = useState(false);

  const isMenuOpen = Boolean(menuAnchorEl);
  const handleOpenMenu = (event) => setMenuAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setMenuAnchorEl(null);

  useEffect(() => {
    // Автопоказ помощи после регистрации (один раз)
    const shouldAutoOpenHelp = localStorage.getItem('helpAutoOpen') === '1';
    if (!shouldAutoOpenHelp) return;
    localStorage.removeItem('helpAutoOpen');
    setHelpOpen(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('walletId');
    localStorage.removeItem('helpAutoOpen');
    handleCloseMenu();
    navigate('/login');
  };

  if (!user) return null;

  const handleOpenHelp = () => {
    handleCloseMenu();
    setHelpOpen(true);
  };

  const handleNavigate = (to) => {
    handleCloseMenu();
    navigate(to);
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
        {isMobile && (
          <IconButton color="inherit" edge="start" onClick={handleOpenMenu} aria-label="Открыть меню">
            <MenuIcon />
          </IconButton>
        )}

        <Typography variant="h6" sx={{ flexGrow: 1 }} noWrap>
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            Мои финансы |{' '}
          </Box>
          <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
            Финансы |{' '}
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
              <Tooltip title="Как пользоваться приложением">
                <Button
                  color="inherit"
                  onClick={() => setHelpOpen(true)}
                  startIcon={<HelpOutline />}
                  aria-label="Открыть помощь"
                >
                  Помощь
                </Button>
              </Tooltip>
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
            <MenuItem onClick={handleOpenHelp}>Помощь</MenuItem>
            <MenuItem onClick={handleLogout}>Выйти</MenuItem>
          </Menu>
        )}
        </Toolbar>
      </AppBar>

      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
};

export default Header;