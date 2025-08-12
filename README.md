# 🎮 GeeksGame API

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)

**Backend API для игровой платформы с современной архитектурой и безопасностью**

[🚀 Быстрый старт](#-быстрый-старт) •
[📚 Документация](#-api-документация) •
[🧪 Тестирование](#-тестирование-api) •
[⚙️ Конфигурация](#️-конфигурация)

</div>

---

## ✨ Особенности

- 🔐 **JWT аутентификация** с refresh токенами
- 👤 **Управление пользователями** и профилями
- 🏆 **Система лидеров** и достижений
- 🛡️ **Продвинутая безопасность** (Helmet, CORS, Rate Limiting)
- 📊 **Swagger документация** с интерактивным UI
- 🌍 **GeoIP определение** локации пользователей
- 🔄 **Защита от дублирующих запросов**
- 📈 **Логирование** всех операций

## 🚀 Быстрый старт

### Предварительные требования

- Node.js >= 16.0.0
- MongoDB >= 4.4
- npm или yarn

### Установка

```bash
# Клонируйте репозиторий
git clone <repository-url>
cd geeksgame

# Установите зависимости
npm install

# Создайте файл .env (см. раздел Конфигурация)
cp .env.example .env

# Запустите в режиме разработки
npm run dev
```

Сервер будет доступен по адресу: `http://localhost:3000`

### Доступные команды

| Команда            | Описание                   |
| ------------------ | -------------------------- |
| `npm start`        | Запуск production сервера  |
| `npm run dev`      | Запуск с автоперезагрузкой |
| `npm run test-api` | Запуск API тестов          |

## 📚 API Документация

### 🎯 Swagger UI

Интерактивная документация доступна по адресу:
**http://localhost:3000/api/docs/**

> ⚠️ **Важно**: В production режиме документация недоступна по соображениям безопасности

### 🔗 Основные endpoints

| Группа     | Endpoint                    | Описание                   |
| ---------- | --------------------------- | -------------------------- |
| **Health** | `GET /`                     | Проверка работоспособности |
| **Auth**   | `POST /auth/login`          | Авторизация пользователя   |
| **Auth**   | `POST /auth/register`       | Регистрация пользователя   |
| **Auth**   | `POST /auth/refresh`        | Обновление токенов         |
| **Auth**   | `POST /auth/logout`         | Выход из системы           |
| **Users**  | `GET /api/user/profile`     | Получение профиля          |
| **Users**  | `PUT /api/user/profile`     | Обновление профиля         |
| **Users**  | `GET /api/user/leaderboard` | Таблица лидеров            |

## 🧪 Тестирование API

### Автоматическое тестирование

```bash
npm run test-api
```

### Ручное тестирование

```bash
# Проверка состояния сервера
curl http://localhost:3000/

# Регистрация нового пользователя
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
```

## ⚙️ Конфигурация

### Переменные окружения

Создайте файл `.env` в корне проекта:

```env
# 🖥️ Server Configuration
PORT=3000
NODE_ENV=development

# 🗄️ Database
MONGODB_URL=mongodb://localhost:27017/geeksgame

# 🔐 JWT Secrets (генерируйте сложные ключи для production!)
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars

# 🌐 CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173
```

### Структура проекта

```
geeksGame/
│
├── 📁 config/           # Конфигурационные файлы
├── 📁 middlewares/      # Express middleware
├── 📁 models/           # Mongoose модели
├── 📁 routes/           # API маршруты
│   ├── auth.js         # Аутентификация
│   └── user.js         # Управление пользователями
├── 📁 utils/            # Утилиты и хелперы
├── 📄 server.js         # Основной файл сервера
├── 📄 test-api.js       # Скрипт тестирования
└── 📄 package.json      # Конфигурация проекта
```

## 🛡️ Безопасность

### Защитные механизмы

| Механизм                  | Development | Production         |
| ------------------------- | ----------- | ------------------ |
| **Rate Limiting**         | 30 req/min  | 20 req/min         |
| **Helmet Headers**        | Базовый     | Строгий            |
| **CORS**                  | Все origins | Только разрешенные |
| **Swagger Docs**          | ✅ Включен  | ❌ Отключен        |
| **Request Deduplication** | 5 сек TTL   | 5 сек TTL          |

### Особенности защиты

- 🔒 **JWT токены** с коротким временем жизни
- 🚫 **Защита от брутфорс** атак на логин
- 🌍 **GeoIP трекинг** подозрительной активности
- 🔄 **Автоматическая ротация** refresh токенов
- 📝 **Подробное логирование** всех операций

## 🚀 Технологический стек

### Backend

- **Node.js** - Серверная среда выполнения
- **Express.js** - Web фреймворк
- **MongoDB** - NoSQL база данных
- **Mongoose** - ODM для MongoDB

### Безопасность

- **JWT** - Аутентификация и авторизация
- **bcrypt** - Хеширование паролей
- **Helmet** - Заголовки безопасности
- **express-rate-limit** - Ограничение запросов

### Разработка

- **nodemon** - Автоперезагрузка в dev режиме
- **Swagger** - Документация API
- **Morgan** - HTTP логирование

## 📈 Мониторинг и логирование

Все запросы автоматически логируются с помощью Morgan:

- ✅ HTTP статусы
- ⏱️ Время ответа
- 📍 IP адреса и геолокация
- 🔍 User-Agent информация

## 🤝 Контрибьютинг

1. Форкните репозиторий
2. Создайте feature ветку (`git checkout -b feature/amazing-feature`)
3. Зафиксируйте изменения (`git commit -m 'Add amazing feature'`)
4. Отправьте в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект лицензирован под ISC лицензией.

---

<div align="center">

**Создано с ❤️ для GeeksGame**

[⬆️ Наверх](#-geeksgame-api)

</div>
