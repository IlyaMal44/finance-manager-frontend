import React from 'react';
import {
  Box,
  Container,
  IconButton,
  Paper,
  Typography,
} from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';

const DEFAULT_HIGHLIGHTS = [
  'Доходы и расходы в одном месте',
  'Контроль бюджетов по категориям',
  'Экспорт отчётов в CSV',
];

const AuthLayout = ({
  mode,
  toggleMode,
  title,
  subtitle,
  children,
  highlights = DEFAULT_HIGHLIGHTS,
  accent = 'primary',
}) => {
  const accentStyles =
    accent === 'success'
      ? {
          titleColor: 'success.main',
          gradientLight: 'linear-gradient(135deg, rgba(76,175,80,0.16), rgba(255,255,255,0.92))',
          gradientDark: 'linear-gradient(135deg, rgba(76,175,80,0.28), rgba(18,18,18,0.92))',
          badgeBg: 'rgba(76,175,80,0.12)',
          badgeColor: 'success.dark',
        }
      : {
          titleColor: 'primary.main',
          gradientLight: 'linear-gradient(135deg, rgba(25,118,210,0.16), rgba(255,255,255,0.92))',
          gradientDark: 'linear-gradient(135deg, rgba(25,118,210,0.28), rgba(18,18,18,0.92))',
          badgeBg: 'rgba(25,118,210,0.12)',
          badgeColor: 'primary.dark',
        };

  return (
    <Box
      sx={(theme) => ({
        minHeight: '100vh',
        background:
          theme.palette.mode === 'dark'
            ? 'radial-gradient(circle at top left, rgba(25,118,210,0.18), transparent 36%), radial-gradient(circle at bottom right, rgba(76,175,80,0.14), transparent 34%), #0b1220'
            : 'radial-gradient(circle at top left, rgba(25,118,210,0.12), transparent 34%), radial-gradient(circle at bottom right, rgba(76,175,80,0.10), transparent 30%), #f5f8fc',
        display: 'flex',
        alignItems: 'center',
      })}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <IconButton
            onClick={toggleMode}
            aria-label="Переключить тему"
            sx={(theme) => ({
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.85)',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 1,
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,1)',
              },
            })}
          >
            {mode === 'dark' ? <LightMode /> : <DarkMode />}
          </IconButton>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
            gap: { xs: 2, md: 3 },
            alignItems: 'stretch',
          }}
        >
          <Paper
            elevation={0}
            sx={(theme) => ({
              p: { xs: 3, sm: 4 },
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              background: theme.palette.mode === 'dark' ? accentStyles.gradientDark : accentStyles.gradientLight,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: { md: 520 },
            })}
          >
            <Box>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 999,
                  bgcolor: accentStyles.badgeBg,
                  color: accentStyles.badgeColor,
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  mb: 2,
                }}
              >
                Мои финансы
              </Box>

              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  lineHeight: 1.1,
                  fontSize: { xs: '2rem', sm: '2.6rem' },
                  mb: 1.5,
                }}
              >
                Управляйте деньгами спокойно и понятно
              </Typography>

              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 520, mb: 3 }}>
                Приложение помогает вести учёт финансов без лишней сложности: быстро добавлять
                операции, следить за бюджетами и понимать, куда уходят деньги.
              </Typography>
            </Box>

            <Box sx={{ display: 'grid', gap: 1.25 }}>
              {highlights.map((item) => (
                <Box
                  key={item}
                  sx={(theme) => ({
                    px: 1.5,
                    py: 1.25,
                    borderRadius: 2.5,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)',
                    border: '1px solid',
                    borderColor: 'divider',
                    backdropFilter: 'blur(8px)',
                  })}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {item}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={(theme) => ({
              p: { xs: 3, sm: 4 },
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(18,18,18,0.88)' : 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(10px)',
              boxShadow: theme.palette.mode === 'dark' ? 6 : 3,
            })}
          >
            <Typography variant="h4" sx={{ fontWeight: 800, color: accentStyles.titleColor, mb: 1 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {subtitle}
              </Typography>
            )}
            {children}
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default AuthLayout;
