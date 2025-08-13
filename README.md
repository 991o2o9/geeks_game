# GeeksGame Backend API

Backend API для игры GeeksGame с системой аутентификации и управления пользователями.

## 🚀 Возможности

- **Аутентификация**: Регистрация, вход, выход, обновление токенов
- **Безопасность**: Хеширование паролей, JWT токены, защита от атак
- **Валидация**: Проверка входных данных, требования к паролям
- **Rate Limiting**: Защита от DDoS атак
- **Swagger**: Автоматическая документация API
- **MongoDB**: Хранение данных пользователей

## 📋 Требования

- Node.js 18+
- MongoDB 5+
- npm или yarn

## 🛠️ Установка

1. Клонируйте репозиторий:

```bash
git clone <repository-url>
cd geeksGame
```

2. Установите зависимости:

```bash
npm install
```

3. Создайте файл `.env` в корневой директории:

```env
PORT=3000
MONGODB_URL=mongodb://localhost:27017/geeksgame
JWT_ACCESS_SECRET=your-super-secret-access-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
NODE_ENV=development
ENABLE_SWAGGER_DOCS=true
```

4. Запустите MongoDB:

```bash
# Локально
mongod

# Или используйте Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

5. Запустите сервер:

```bash
# Режим разработки
npm run dev

# Продакшн
npm start
```

## 🔐 API Аутентификации

### Endpoints

| Метод  | Путь             | Описание                        |
| ------ | ---------------- | ------------------------------- |
| `POST` | `/auth/register` | Регистрация нового пользователя |
| `POST` | `/auth/login`    | Вход в систему                  |
| `POST` | `/auth/refresh`  | Обновление access token         |
| `POST` | `/auth/logout`   | Выход из системы                |

### 1. Регистрация пользователя

**POST** `/auth/register`

Создает нового пользователя в системе.

**Тело запроса:**

```json
{
  "username": "player123",
  "password": "securePass123"
}
```

**Требования к данным:**

- `username`: 3-50 символов, только буквы, цифры и подчеркивания
- `password`: минимум 6 символов, максимум 128, должен содержать букву и цифру

**Ответ (201):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "User registered successfully",
  "user": {
    "id": "user-player123-1234567890",
    "username": "player123",
    "coins": 0
  }
}
```

**Ошибки:**

- `400` - Ошибка валидации данных
- `409` - Пользователь с таким именем уже существует
- `500` - Внутренняя ошибка сервера

### 2. Вход в систему

**POST** `/auth/login`

Аутентификация существующего пользователя.

**Тело запроса:**

```json
{
  "username": "player123",
  "password": "securePass123"
}
```

**Ответ (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful",
  "user": {
    "id": "user-player123-1234567890",
    "username": "player123",
    "coins": 0
  }
}
```

**Ошибки:**

- `400` - Отсутствуют обязательные поля
- `401` - Неверные учетные данные
- `429` - Слишком много попыток входа (защита от брутфорс атак)
- `500` - Внутренняя ошибка сервера

### 3. Обновление токена

**POST** `/auth/refresh`

Получение нового access token с помощью refresh token.

**Тело запроса:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Ответ (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Ошибки:**

- `401` - Недействительный refresh token

### 4. Выход из системы

**POST** `/auth/logout`

Выход пользователя и аннулирование refresh token.

**Тело запроса:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Ответ (200):**

```json
{
  "ok": true
}
```

## 🔒 Безопасность

### JWT Токены

- **Access Token**: Действует 15 минут, используется для доступа к защищенным ресурсам
- **Refresh Token**: Действует 7 дней, используется для обновления access token

### Хеширование паролей

- Используется bcrypt с 12 раундами соли
- Пароли никогда не хранятся в открытом виде

### Защита от атак

- **Rate Limiting**: 30 запросов в минуту на IP адрес
- **Brute Force Protection**: Ограничение попыток входа
- **Duplicate Request Prevention**: Защита от повторных запросов
- **Security Headers**: Helmet.js для защиты от уязвимостей

### Cookies

- HTTP-only cookies для токенов
- Secure flag в продакшене
- SameSite=Lax для защиты от CSRF

## 📊 Модели данных

### User

```javascript
{
  username: String,        // Уникальное имя пользователя
  password: String,        // Хешированный пароль
  userId: String,          // Уникальный ID пользователя
  coins: Number,           // Количество монет
  createdAt: Date,         // Дата создания
  lastActive: Date         // Последняя активность
}
```

### RefreshToken

```javascript
{
  token: String,           // JWT refresh token
  userId: String,          // ID пользователя
  expiresAt: Date          // Дата истечения
}
```

## 🧪 Тестирование

Запустите тесты API:

```bash
# Базовое тестирование
node test-auth.js

# Финальное тестирование с задержками
node test-auth-final.js
```

## 📚 Документация Swagger

В режиме разработки документация доступна по адресу:

```
http://localhost:3000/api/docs
```

## 🚀 Скрипты

- `npm run dev` - Запуск в режиме разработки с nodemon
- `npm start` - Запуск в продакшн режиме
- `npm test` - Запуск тестов (пока не настроено)

## 🔧 Конфигурация

Основные настройки в `config/env.js`:

- Порт сервера
- URL MongoDB
- Секреты JWT
- Время жизни токенов
- Настройки безопасности

## 📝 Логирование

- Логирование подозрительной активности
- Логирование попыток входа
- Логирование ошибок

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Внесите изменения
4. Создайте Pull Request

## 📄 Лицензия

ISC License

## 🆘 Поддержка

При возникновении проблем:

1. Проверьте логи сервера
2. Убедитесь, что MongoDB запущен
3. Проверьте настройки в `.env` файле
4. Создайте Issue в репозитории
