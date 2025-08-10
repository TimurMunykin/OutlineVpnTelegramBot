# Тестирование биллинговой системы

Это руководство описывает, как тестировать автоматическую биллинговую систему VPN-приложения.

## Предварительные требования

1. Запущенный backend сервер на `localhost:3001`
2. База данных с тестовыми пользователями
3. Администраторский доступ

## Получение админ токена

Сначала получите действующий админ токен:

```bash
curl -X POST "http://localhost:3001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

Сохраните токен из ответа для использования в последующих запросах.

## Настройки биллинга

Проверьте текущие настройки биллинга:

```bash
curl -X GET "http://localhost:3001/api/billing/admin/users" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Обратите внимание на:
- `monthlyCost` - стоимость месячной подписки
- `currencyName` - название валюты

## Тестовые сценарии

### 1. Проверка текущего состояния пользователя

Получите информацию о тестовом пользователе:

```bash
curl -X GET "http://localhost:3001/api/users/USER_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 2. Тестирование успешного списания

Списание средств при достаточном балансе:

```bash
curl -X POST "http://localhost:3001/api/billing/admin/users/USER_ID/balance/deduct" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":100,"description":"Тестовое месячное списание"}'
```

**Ожидаемый результат:**
- Баланс уменьшился на указанную сумму
- Статус остается `ACTIVE` (если баланса достаточно)
- `canAffordNextMonth: true` (если баланс >= месячной стоимости)

### 3. Тестирование блокировки при недостаточном балансе

Доведите баланс пользователя до суммы меньше месячной стоимости:

```bash
curl -X POST "http://localhost:3001/api/billing/admin/users/USER_ID/balance/deduct" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":AMOUNT,"description":"Тест недостаточного баланса"}'
```

**Ожидаемый результат:**
- Баланс < месячной стоимости
- Статус меняется на `INSUFFICIENT_BALANCE`
- `canAffordNextMonth: false`
- VPN ключи пользователя блокируются (трафик-лимит = 0)

### 4. Проверка истории транзакций

Просмотр последних транзакций:

```bash
curl -X GET "http://localhost:3001/api/billing/admin/transactions?limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Что проверить:**
- Все операции записаны
- Правильные суммы и описания
- Указан исполнитель операции

### 5. Тестирование разблокировки

Пополните баланс заблокированного пользователя:

```bash
curl -X POST "http://localhost:3001/api/billing/admin/users/USER_ID/balance" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":200,"description":"Пополнение для разблокировки"}'
```

**Ожидаемый результат:**
- Статус меняется обратно на `ACTIVE`
- `canAffordNextMonth: true`
- VPN ключи разблокируются (восстанавливаются лимиты)

### 6. Мануальный запуск биллинга

Тест автоматического процесса биллинга:

```bash
curl -X POST "http://localhost:3001/api/billing/admin/process" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Ожидаемый результат:**
- Обрабатываются только пользователи с `subscriptionType: "PAID"`
- Списание происходит только если `nextBillingDate` <= текущая дата
- Обновляется `nextBillingDate` на +30 дней

### 7. Проверка статистики

Получите общую статистику биллинга:

```bash
curl -X GET "http://localhost:3001/api/billing/admin/stats" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Автоматические процессы

### Cron задача

Проверьте статус автоматической задачи:

```bash
curl -X GET "http://localhost:3001/api/billing/admin/cron/status" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Мануальный запуск cron задачи:

```bash
curl -X POST "http://localhost:3001/api/billing/admin/cron/trigger" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Расписание

Cron задача запускается ежедневно в 02:00 по московскому времени.

## Проверочный список

- [ ] Пользователь с достаточным балансом остается активным
- [ ] Пользователь с недостаточным балансом блокируется
- [ ] VPN ключи блокируются/разблокируются корректно  
- [ ] История транзакций ведется правильно
- [ ] Даты следующего списания обновляются
- [ ] Cron задача работает по расписанию
- [ ] Статистика отображается корректно
- [ ] Все изменения логируются в консоль

## Важные состояния пользователей

### Активный пользователь
```json
{
  "subscriptionType": "PAID",
  "subscriptionStatus": "ACTIVE", 
  "balance": 200,
  "canAffordNextMonth": true
}
```

### Заблокированный пользователь  
```json
{
  "subscriptionType": "PAID",
  "subscriptionStatus": "INSUFFICIENT_BALANCE",
  "balance": 50,
  "canAffordNextMonth": false
}
```

### Бесплатный пользователь
```json
{
  "subscriptionType": "FREE",
  "subscriptionStatus": "ACTIVE",
  "balance": 0
}
```

## Решение проблем

1. **Токен недействителен** - получите новый админ токен
2. **Биллинг не запускается** - проверьте `nextBillingDate` пользователей
3. **VPN ключи не блокируются** - проверьте подключение к Outline серверу
4. **Cron не работает** - перезапустите сервер

## Примечания

- Все суммы указываются в баллах (или настроенной валюте)
- Месячный цикл = 30 дней
- Время указывается в UTC
- Блокировка VPN происходит через установку лимита трафика = 0