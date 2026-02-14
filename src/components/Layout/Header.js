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
import { useNavigate, useLocation } from 'react-router-dom';
import { DarkMode, HelpOutline, LightMode, Feedback } from '@mui/icons-material';
import MenuIcon from '@mui/icons-material/Menu';

import HelpDialog from '../Help/HelpDialog';
import FeedbackDialog from '../Feedback/FeedbackDialog';

const NAV_ITEMS = [
  { label: 'Бюджеты', to: '/budgets' },
  { label: 'Дашборд', to: '/dashboard' },
  { label: 'Транзакции', to: '/transactions' },
];

const Header = ({ mode, toggleMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  
  // Определяем активный раздел
  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname === path;
  };

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

  const handleOpenFeedback = () => {
    handleCloseMenu();
    setFeedbackOpen(true);
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
              <Button 
                color="inherit" 
                onClick={() => navigate('/budgets')}
                sx={{
                  backgroundColor: isActive('/budgets') ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                  '&:hover': {
                    backgroundColor: isActive('/budgets') ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                  },
                  fontWeight: isActive('/budgets') ? 600 : 400,
                  borderBottom: isActive('/budgets') ? '2px solid white' : '2px solid transparent',
                }}
              >
                Бюджеты
              </Button>
              <Button 
                color="inherit" 
                onClick={() => navigate('/dashboard')}
                sx={{
                  backgroundColor: isActive('/dashboard') ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                  '&:hover': {
                    backgroundColor: isActive('/dashboard') ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                  },
                  fontWeight: isActive('/dashboard') ? 600 : 400,
                  borderBottom: isActive('/dashboard') ? '2px solid white' : '2px solid transparent',
                }}
              >
                Дашборд
              </Button>
              <Button 
                color="inherit" 
                onClick={() => navigate('/transactions')}
                sx={{
                  backgroundColor: isActive('/transactions') ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                  '&:hover': {
                    backgroundColor: isActive('/transactions') ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                  },
                  fontWeight: isActive('/transactions') ? 600 : 400,
                  borderBottom: isActive('/transactions') ? '2px solid white' : '2px solid transparent',
                }}
              >
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
              <Tooltip title="Обратная связь">
                <Button
                  color="inherit"
                  onClick={handleOpenFeedback}
                  startIcon={<Feedback />}
                  aria-label="Обратная связь"
                >
                  Обратная связь
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
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.to);
              return (
                <MenuItem 
                  key={item.to} 
                  onClick={() => handleNavigate(item.to)}
                  selected={active}
                  sx={{
                    backgroundColor: active ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                    fontWeight: active ? 600 : 400,
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(25, 118, 210, 0.15)',
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.2)',
                      },
                    },
                  }}
                >
                  {item.label}
                </MenuItem>
              );
            })}
            <Divider />
            <MenuItem onClick={handleOpenHelp}>Помощь</MenuItem>
            <MenuItem onClick={handleOpenFeedback}>Обратная связь</MenuItem>
            <MenuItem onClick={handleLogout}>Выйти</MenuItem>
          </Menu>
        )}
        </Toolbar>
      </AppBar>

      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
      <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  );
};

export default Header;