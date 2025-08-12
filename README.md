# GeeksGame API

Backend API для игровой платформы GeeksGame с аутентификацией и управлением пользователями.

## 🚀 Быстрый старт

### Установка зависимостей

```bash
npm install
```

### Запуск сервера

```bash
npm run dev
```

Сервер запустится на `http://localhost:3000`

## 📚 API Документация

### Swagger UI

Полная документация API доступна по адресу:
**http://localhost:3000/api/docs/**

> **⚠️ Важно:** Документация доступна только в режиме разработки (development). В production режиме доступ к `/api/docs` заблокирован.

### Основные разделы документации:

- **🔐 Аутентификация** - Вход, выход, обновление токенов
- **👤 Пользователи** - Профили, монеты, таблица лидеров

### Основные endpoints

- **Health Check**: `GET /` - проверка работоспособности сервера
- **Auth**: `/auth/*` - аутентификация и регистрация
- **Game**: `/api/game/*` - игровая логика
- **User**: `/api/user/*` - управление пользователями

## 🧪 Тестирование API

### Автоматический тест

```bash
npm run test-api
```

### Ручное тестирование

1. **Проверка здоровья сервера:**

   ```bash
   curl http://localhost:3000/
   ```

2. **Доступ к документации:**

   ```bash
   curl http://localhost:3000/api/docs/
   ```

3. **Тестирование через браузер:**
   - Откройте `http://localhost:3000/api/docs/` в браузере
   - Используйте Swagger UI для интерактивного тестирования

## ⚙️ Конфигурация

### Переменные окружения

Создайте файл `.env` в корне проекта:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URL=mongodb://localhost:27017/geeksgame

# JWT Secrets
JWT_ACCESS_SECRET=your-super-secret-access-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## 🔧 Структура проекта

```
geeksGame/
├── config/          # Конфигурационные файлы
├── middlewares/     # Express middleware
├── models/          # Mongoose модели
├── routes/          # API маршруты
├── utils/           # Утилиты
├── server.js        # Основной файл сервера
└── test-api.js      # Скрипт для тестирования
```

## 🛡️ Безопасность

### Development режим:

- **Helmet** с мягкими настройками
- **CORS** разрешает все origins
- **Rate Limiting**: 30 запросов в минуту
- **Duplicate Request Protection**: 5 секунд TTL, исключает GET запросы
- **JWT аутентификация**
- **Защита от брутфорс атак**
- **Swagger документация доступна**

### Production режим:

- **Helmet** со строгими настройками безопасности
- **CORS** только для разрешенных доменов
- **Rate Limiting**: 20 запросов в минуту (более строго)
- **Swagger документация отключена**
- **HSTS заголовки**
- **Content Security Policy**

## 📝 Примечания

- Для полной функциональности требуется MongoDB
- **Environment-based конфигурация**: разные настройки для development и production
- Swagger документация автоматически генерируется из JSDoc комментариев в routes
- **Защита от дублирующих запросов**:
  - TTL: 5 секунд
  - GET запросы исключены из проверки
  - Запросы к документации пропускаются
- **Rate Limiting**: 30 запросов/мин (dev), 20 запросов/мин (prod)
- **Swagger документация**: доступна только в development режиме
