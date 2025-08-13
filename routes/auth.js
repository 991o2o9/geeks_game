import express from "express";
import { loginBruteForceProtection } from "../middlewares/bruteForce.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../config/jwt.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { LoginAttempt } from "../models/LoginAttempt.js";
import { User } from "../models/User.js";
import {
  hashPassword,
  verifyPassword,
  validatePassword,
  validateUsername,
} from "../utils/passwordUtils.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: Имя пользователя для входа в систему
 *           example: "player123"
 *           minLength: 3
 *           maxLength: 50
 *         password:
 *           type: string
 *           description: Пароль пользователя
 *           example: "password123"
 *           minLength: 6
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: Имя пользователя для регистрации
 *           example: "newplayer123"
 *           minLength: 3
 *           maxLength: 50
 *         password:
 *           type: string
 *           description: Пароль пользователя
 *           example: "securePass123"
 *           minLength: 6
 *     LoginResponse:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *           description: JWT токен доступа (действует 15 минут)
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         refreshToken:
 *           type: string
 *           description: JWT токен обновления (действует 7 дней)
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         message:
 *           type: string
 *           description: Сообщение о результате операции
 *           example: "Login successful"
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: ID пользователя
 *             username:
 *               type: string
 *               description: Имя пользователя
 *             coins:
 *               type: number
 *               description: Количество монет
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Тип ошибки
 *           example: "Username already taken"
 *         message:
 *           type: string
 *           description: Подробное описание ошибки
 *           example: "A user with this username already exists. Please choose a different username."
 *         details:
 *           type: array
 *           items:
 *             type: string
 *           description: Детали ошибок валидации
 *     RefreshRequest:
 *       type: object
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: JWT токен обновления для получения нового access token
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     RefreshResponse:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *           description: Новый JWT токен доступа
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     LogoutRequest:
 *       type: object
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: JWT токен обновления для аннулирования
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     LogoutResponse:
 *       type: object
 *       properties:
 *         ok:
 *           type: boolean
 *           description: Статус успешного выхода
 *           example: true
 */

/**
 * Проверяет существование пользователя и валидирует пароль
 */
async function authenticateUser(username, password) {
  const user = await User.findOne({ username });
  if (!user) {
    return null; // Пользователь не найден
  }

  // Проверяем пароль
  const isPasswordValid = await verifyPassword(password, user.password);
  if (!isPasswordValid) {
    return null; // Неверный пароль
  }

  // Обновляем время последней активности
  user.lastActive = new Date();
  await user.save();

  return {
    id: user.userId,
    username: user.username,
    coins: user.coins,
  };
}

/**
 * Регистрирует нового пользователя
 */
async function registerUser(username, password) {
  // Проверяем, не существует ли уже пользователь с таким username
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    throw new Error("Username already taken");
  }

  // Хешируем пароль
  const hashedPassword = await hashPassword(password);

  // Создаем нового пользователя
  const userId = `user-${username}-${Date.now()}`;
  const user = await User.create({
    username,
    password: hashedPassword,
    userId,
    coins: 0,
  });

  console.log(`New user registered: ${username}`);
  return {
    id: user.userId,
    username: user.username,
    coins: user.coins,
  };
}

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     description: |
 *       Создание нового аккаунта в системе.
 *
 *       **Особенности:**
 *       - Проверка уникальности username
 *       - Валидация пароля по требованиям безопасности
 *       - Автоматическое хеширование пароля
 *       - Автоматическое создание userId
 *       - Начальный баланс монет: 0
 *       - Защита от дублирования учетных записей
 *
 *       **Требования к паролю:**
 *       - Минимум 6 символов
 *       - Максимум 128 символов
 *       - Должен содержать хотя бы одну букву и одну цифру
 *
 *       **Требования к username:**
 *       - Минимум 3 символа
 *       - Максимум 50 символов
 *       - Только буквы, цифры и подчеркивания
 *
 *       **Безопасность:**
 *       - Валидация входных данных
 *       - Проверка существования пользователя
 *       - Защита от повторных запросов
 *       - Хеширование паролей с солью
 *     tags: [Аутентификация]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Пользователь успешно зарегистрирован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Ошибка валидации данных
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Пользователь с таким именем уже существует
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  // Валидация входных данных
  const usernameValidation = validateUsername(username);
  const passwordValidation = validatePassword(password);

  const validationErrors = [
    ...usernameValidation.errors,
    ...passwordValidation.errors,
  ];

  if (validationErrors.length > 0) {
    return res.status(400).json({
      error: "Validation failed",
      message: "Invalid input data",
      details: validationErrors,
    });
  }

  try {
    const user = await registerUser(username, password);

    // Создаем токены для нового пользователя
    const accessToken = signAccessToken({ sub: user.id });
    const refreshToken = signRefreshToken({ sub: user.id });

    await RefreshToken.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 864e5),
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000, // 15 минут
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    });

    res.status(201).json({
      accessToken,
      refreshToken,
      message: "User registered successfully",
      user: {
        id: user.id,
        username: user.username,
        coins: user.coins,
      },
    });
  } catch (error) {
    if (error.message === "Username already taken") {
      return res.status(409).json({
        error: "Username already taken",
        message:
          "A user with this username already exists. Please choose a different username.",
      });
    }

    console.error("Registration error:", error);
    res.status(500).json({
      error: "Failed to register user",
      message: "Internal server error during registration",
    });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Вход пользователя в систему
 *     description: |
 *       Аутентификация существующего пользователя по имени и паролю.
 *
 *       **Особенности:**
 *       - Только для существующих пользователей
 *       - При успешном входе возвращаются JWT токены (access и refresh)
 *       - Токены также сохраняются в HTTP-only cookies
 *       - Защищен от брутфорс атак (ограничение попыток входа)
 *
 *       **Безопасность:**
 *       - Проверка существования пользователя
 *       - Верификация хешированного пароля
 *       - Используется защита от повторных запросов
 *       - Rate limiting для предотвращения атак
 *       - Защита от брутфорс атак
 *     tags: [Аутентификация]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Успешный вход в систему
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *         headers:
 *           Set-Cookie:
 *             description: HTTP-only cookies с токенами
 *             schema:
 *               type: string
 *       400:
 *         description: Отсутствуют обязательные поля (username или password)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Неверные учетные данные или пользователь не существует
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Слишком много попыток входа (защита от брутфорс атак)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/login", loginBruteForceProtection(), async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: "Missing credentials",
      message: "Username and password are required",
    });
  }

  try {
    const user = await authenticateUser(username, password);

    if (!user) {
      const rec = req._loginAttemptRecord;
      if (rec) {
        rec.count++;
        await rec.save();
      }
      return res.status(401).json({
        error: "Invalid credentials",
        message:
          "Invalid username or password. Please check your credentials and try again.",
      });
    }

    // Удаляем запись о попытке входа при успешной аутентификации
    if (req._loginAttemptRecord) {
      await LoginAttempt.deleteOne({ ip: req.ip });
    }

    const accessToken = signAccessToken({ sub: user.id });
    const refreshToken = signRefreshToken({ sub: user.id });

    await RefreshToken.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 864e5),
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000, // 15 минут
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    });

    res.json({
      accessToken,
      refreshToken,
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        coins: user.coins,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    const rec = req._loginAttemptRecord;
    if (rec) {
      rec.count++;
      await rec.save();
    }
    res.status(500).json({
      error: "Internal server error",
      message: "An error occurred during login. Please try again later.",
    });
  }
});

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Обновление токена доступа
 *     description: |
 *       Получение нового access token с помощью refresh token.
 *
 *       **Как это работает:**
 *       - Refresh token можно получить из cookies или тела запроса
 *       - При успешном обновлении возвращается новый access token
 *       - Новый токен также сохраняется в HTTP-only cookie
 *       - Недействительные refresh token автоматически удаляются
 *
 *       **Когда использовать:**
 *       - Когда access token истек (15 минут)
 *       - Для продления сессии без повторного входа
 *     tags: [Аутентификация]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *     responses:
 *       200:
 *         description: Токен успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshResponse'
 *         headers:
 *           Set-Cookie:
 *             description: HTTP-only cookie с новым access token
 *             schema:
 *               type: string
 *       401:
 *         description: Недействительный refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/refresh", async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  const record = await RefreshToken.findOne({ token });
  if (!record) return res.status(401).json({ error: "Invalid refresh token" });
  try {
    verifyRefreshToken(token);
    const newAccess = signAccessToken({ sub: record.userId });
    res.cookie("accessToken", newAccess, { httpOnly: true, sameSite: "lax" });
    res.json({ accessToken: newAccess });
  } catch {
    await RefreshToken.deleteOne({ token });
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Выход пользователя из системы
 *     description: |
 *       Выход пользователя из системы и аннулирование refresh token.
 *
 *       **Что происходит при выходе:**
 *       - Refresh token удаляется из базы данных
 *       - Cookies с токенами очищаются
 *       - Пользователь больше не может использовать старые токены
 *
 *       **Безопасность:**
 *       - Полное завершение сессии
 *       - Предотвращение несанкционированного доступа
 *       - Очистка всех связанных данных
 *     tags: [Аутентификация]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LogoutRequest'
 *     responses:
 *       200:
 *         description: Успешный выход из системы
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogoutResponse'
 */
router.post("/logout", async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (token) await RefreshToken.deleteOne({ token });
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ ok: true });
});

export default router;
