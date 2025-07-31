# План переработки приложения OutlineVPN Manager

## Общая идея

Переработать текущий Telegram-бот в полноценное веб-приложение с разделением на бэкенд и фронтенд. Telegram-бот останется как опциональный интерфейс для будущих версий.

## Архитектура системы

### 1. Бэкенд (REST API)
- **Фреймворк**: Express.js + TypeScript
- **Документация**: Swagger/OpenAPI
- **База данных**: PostgreSQL
- **Аутентификация**: Локальная система + OAuth 2.0 Server (приложение как провайдер) + JWT токены
- **Структура**:
  ```
  backend/
  ├── src/
  │   ├── controllers/     # API контроллеры
  │   ├── middleware/      # Аутентификация, валидация
  │   ├── models/          # Модели данных
  │   ├── routes/          # Маршруты API
  │   ├── services/        # Бизнес-логика
  │   ├── utils/           # Утилиты
  │   └── app.ts           # Основной файл приложения
  ├── swagger/             # Swagger документация
  └── package.json
  ```

### 2. Фронтенд
- **Фреймворк**: React + TypeScript
- **UI библиотека**: Material-UI (MUI)
- **Состояние**: Zustand
- **HTTP клиент**: Axios
- **Структура**:
  ```
  frontend/
  ├── src/
  │   ├── components/      # Переиспользуемые компоненты
  │   ├── pages/           # Страницы приложения
  │   ├── services/        # API сервисы
  │   ├── hooks/           # Кастомные хуки
  │   ├── types/           # TypeScript типы
  │   └── App.tsx
  └── package.json
  ```

## Функциональные требования

### Система пользователей
- **Админ** (тебя учетка):
  - Управление пользователями
  - Полный доступ к VPN ключам
  - Настройки системы
  
- **Обычные пользователи**:
  - Просмотр своих VPN ключей
  - Создание новых ключей (с лимитами)
  - Удаление своих ключей

### API Endpoints (примерная структура)

#### Аутентификация (локальная + OAuth Server)
**Локальная аутентификация:**
- `POST /api/auth/register` - Регистрация нового пользователя
- `POST /api/auth/login` - Вход по email/паролю
- `POST /api/auth/forgot-password` - Восстановление пароля
- `POST /api/auth/reset-password` - Сброс пароля
- `POST /api/auth/refresh` - Обновление JWT токена
- `POST /api/auth/logout` - Выход из системы
- `GET /api/auth/me` - Информация о текущем пользователе

**OAuth 2.0 Server (мы как провайдер):**
- `GET /api/oauth/authorize` - Authorization endpoint (OAuth flow)
- `POST /api/oauth/token` - Token endpoint (получение access_token)
- `GET /api/oauth/userinfo` - User info endpoint (данные пользователя)
- `POST /api/oauth/revoke` - Отзыв токенов
- `GET /.well-known/oauth-authorization-server` - OAuth discovery endpoint

**Управление OAuth приложениями:**
- `GET /api/oauth/apps` - Список OAuth приложений пользователя
- `POST /api/oauth/apps` - Создать новое OAuth приложение
- `PUT /api/oauth/apps/:id` - Обновить OAuth приложение
- `DELETE /api/oauth/apps/:id` - Удалить OAuth приложение

#### Управление пользователями (только админ)
- `GET /api/users` - Список пользователей
- `POST /api/users` - Создать пользователя
- `PUT /api/users/:id` - Обновить пользователя
- `DELETE /api/users/:id` - Удалить пользователя

#### VPN ключи
- `GET /api/vpn/keys` - Список ключей (свои для юзера, все для админа)
- `POST /api/vpn/keys` - Создать новый ключ
- `GET /api/vpn/keys/:id` - Информация о ключе
- `DELETE /api/vpn/keys/:id` - Удалить ключ

#### Статистика (для админа)
- `GET /api/stats/overview` - Общая статистика
- `GET /api/stats/users` - Статистика по пользователям

### База данных (схема)

```sql
-- Пользователи
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',         -- 'admin' или 'user'
    is_email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OAuth приложения (клиенты которые используют наш OAuth)
CREATE TABLE oauth_clients (
    id SERIAL PRIMARY KEY,
    client_id VARCHAR(255) UNIQUE NOT NULL,
    client_secret VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    redirect_uris TEXT[] NOT NULL,           -- Массив разрешенных redirect URI
    scopes TEXT[] DEFAULT ARRAY['read'],     -- Доступные scopes
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,  -- Владелец приложения
    is_trusted BOOLEAN DEFAULT FALSE,        -- Доверенное приложение (пропускает consent screen)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Authorization codes (временные коды для OAuth flow)
CREATE TABLE oauth_authorization_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(255) UNIQUE NOT NULL,
    client_id VARCHAR(255) REFERENCES oauth_clients(client_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    redirect_uri TEXT NOT NULL,
    scopes TEXT[] NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Access tokens для OAuth клиентов
CREATE TABLE oauth_access_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    client_id VARCHAR(255) REFERENCES oauth_clients(client_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    scopes TEXT[] NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Refresh tokens для OAuth клиентов
CREATE TABLE oauth_refresh_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    access_token_id INTEGER REFERENCES oauth_access_tokens(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Токены для сброса пароля
CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- VPN ключи
CREATE TABLE vpn_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    outline_key_id VARCHAR(100) NOT NULL,
    access_url TEXT NOT NULL,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Сессии для JWT refresh токенов (внутренние)
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## План реализации

### Этап 1: Подготовка структуры проекта
1. Создать папки `backend/` и `frontend/`
2. Настроить базовую структуру и конфигурации
3. Перенести логику работы с Outline VPN в backend

### Этап 2: Разработка бэкенда
1. Настроить Express.js с TypeScript
2. Подключить PostgreSQL
3. Реализовать OAuth 2.0 аутентификацию (Google, GitHub)
4. Создать API для управления VPN ключами
5. Добавить Swagger документацию
6. Реализовать систему ролей и middleware

### Этап 3: Разработка фронтенда
1. Создать базовую структуру React приложения с TypeScript
2. Настроить MUI и Zustand
3. Реализовать OAuth авторизацию
4. Создать интерфейс управления ключами
5. Добавить админ-панель
6. Интегрировать с backend API

### Этап 4: Локальное тестирование
1. Настроить локальную PostgreSQL
2. Протестировать все функции
3. Настроить развертывание для разработки

## Технические детали

### Безопасность
- Локальная аутентификация с хэшированием паролей (bcrypt)
- JWT токены с refresh токенами для внутреннего API
- OAuth 2.0 Server для внешних интеграций
- Email верификация для регистрации
- Rate limiting для API
- Валидация всех входящих данных
- CORS настройки
- Защищенные роуты и middleware
- Secure хранение client_secret для OAuth приложений

### OAuth Server (мы как провайдер)
- **Authorization Code Flow** - стандартный OAuth 2.0 flow
- **Scopes**: read, write, admin (для разных уровней доступа)
- **Client управление**: создание/удаление OAuth приложений через UI
- **Consent screen**: пользователь видит какие права запрашивает приложение
- **Token management**: access_token, refresh_token с истечением

### Локальная разработка
- PostgreSQL локально (через brew/apt)
- Backend на порту 3001
- Frontend на порту 3000
- Hot reload для обеих частей

## Заметки
- Telegram бот остается в текущем виде как legacy, потом можно будет его переписать для работы с новым OAuth API
- Возможность расширения: добавление уведомлений, статистики использования, лимитов трафика
- **OAuth Server позволит интеграции**: 
  - Telegram бот сможет авторизоваться через твой сервер
  - Мобильные приложения
  - Другие веб-сервисы
  - CLI инструменты
- Для начала разработки используем локальное окружение без Docker
- Production конфигурация и контейнеризация будут добавлены позже

## Примеры интеграций через OAuth

**Telegram бот как OAuth клиент:**
1. Пользователь пишет `/login` боту
2. Бот отправляет ссылку на authorization endpoint
3. Пользователь авторизуется на веб-сайте
4. Бот получает access_token и может управлять VPN ключами пользователя

**Мобильное приложение:**
1. Приложение регистрируется как OAuth клиент
2. Использует Authorization Code Flow для авторизации
3. Получает доступ к VPN API пользователя