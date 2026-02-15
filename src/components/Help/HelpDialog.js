import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';

const HELP_STEPS = [
  {
    label: 'Главная (главный экран)',
    content: (
      <>
        <Typography variant="body1" sx={{ mb: 1 }}>
          Это главный экран, где видно “что происходит с деньгами”.
        </Typography>
        <Box component="ul" sx={{ mt: 1, mb: 0, pl: 3 }}>
          <li>
            <Typography variant="body2" color="text.secondary">
              В карточках сверху: баланс, сумма доходов и расходов.
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary">
              Ниже — добавление операции: выберите “Доход” или “Расход”, введите сумму и категорию.
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary">
              Категорию можно выбрать из списка или просто написать свою.
            </Typography>
          </li>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            Примеры
          </Typography>
          <Typography variant="body2" color="text.secondary">
            - Доход: “Зарплата”, 120&nbsp;000 ₽
            <br />
            - Расход: “Продукты”, 2&nbsp;350 ₽ (описание: “Пятёрочка”)
          </Typography>
        </Box>
      </>
    ),
  },
  {
    label: 'Транзакции (история)',
    content: (
      <>
        <Typography variant="body1" sx={{ mb: 1 }}>
          Здесь хранится история всех операций — как “выписка”.
        </Typography>
        <Box component="ul" sx={{ mt: 1, mb: 0, pl: 3 }}>
          <li>
            <Typography variant="body2" color="text.secondary">
              Можно отфильтровать по типу (доход/расход) и по категории.
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary">
              У каждой операции есть действия: посмотреть, изменить или удалить.
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary">
              Свои категории тоже работают: они сохраняются и попадают в фильтры.
            </Typography>
          </li>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            Примеры
          </Typography>
          <Typography variant="body2" color="text.secondary">
            - Хотите посмотреть траты на еду: выберите тип “Расход” и категорию “Продукты”
            <br />
            - Ошиблись в сумме: нажмите “Изменить”, поправьте сумму и сохраните
          </Typography>
        </Box>
      </>
    ),
  },
  {
    label: 'Бюджеты (лимиты)',
    content: (
      <>
        <Typography variant="body1" sx={{ mb: 1 }}>
          Бюджеты — это лимиты на траты по категориям (например, “Продукты — 20 000 ₽ в месяц”).
        </Typography>
        <Box component="ul" sx={{ mt: 1, mb: 0, pl: 3 }}>
          <li>
            <Typography variant="body2" color="text.secondary">
              Можно создать бюджет вручную или выбрать готовый шаблон.
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary">
              В таблице видно: лимит, сколько потрачено и сколько осталось.
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary">
              Если вы близко к лимиту или превысили его — на главной появится предупреждение.
            </Typography>
          </li>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            Примеры
          </Typography>
          <Typography variant="body2" color="text.secondary">
            - Поставьте “Продукты” = 20&nbsp;000 ₽. Потратили 16&nbsp;500 ₽ → осталось 3&nbsp;500 ₽
            <br />
            - Если потратили больше лимита — в таблице увидите “Превышен”, а на главной появится предупреждение
          </Typography>
        </Box>
      </>
    ),
  },
];

export default function HelpDialog({ open, onClose }) {
  const [activeStep, setActiveStep] = useState(0);

  const maxStep = HELP_STEPS.length - 1;
  const isLast = activeStep >= maxStep;
  const isFirst = activeStep <= 0;

  const step = useMemo(() => HELP_STEPS[Math.min(Math.max(activeStep, 0), maxStep)], [activeStep, maxStep]);

  const handleClose = () => {
    setActiveStep(0);
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Как пользоваться</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Короткая инструкция. Открыть её можно в любой момент через кнопку “Помощь” сверху.
        </Typography>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mt: 1, mb: 2 }}>
          {HELP_STEPS.map((s) => (
            <Step key={s.label}>
              <StepLabel>{s.label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Divider sx={{ mb: 2 }} />

        <Typography variant="h6" sx={{ mb: 1 }}>
          {step.label}
        </Typography>
        <Box sx={{ mb: 1 }}>{step.content}</Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between' }}>
        <Button onClick={handleClose}>Закрыть</Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
            disabled={isFirst}
          >
            Назад
          </Button>
          <Button
            variant="contained"
            onClick={() => setActiveStep((s) => Math.min(maxStep, s + 1))}
            disabled={isLast}
          >
            Дальше
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

