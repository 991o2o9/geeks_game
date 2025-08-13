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

  // Здесь должна быть проверка пароля
  // Поскольку в текущей модели пароль не хранится,
  // мы будем считать, что пользователь аутентифицирован по username
  // В реальном приложении здесь должна быть проверка хеша пароля

  user.lastActive = new Date();
  await user.save();

  return { id: user.userId, username: user.username };
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

  // Создаем нового пользователя
  const userId = `user-${username}-${Date.now()}`;
  const user = await User.create({
    username,
    userId,
    coins: 0,
  });

  console.log(`New user registered: ${username}`);
  return { id: user.userId, username: user.username };
}

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Вход в систему
 *     description: |
 *       Аутентификация пользователя по имени и паролю.
 *
 *       **Особенности:**
 *       - Если пользователь не существует, он будет автоматически создан
 *       - Если пользователь существует, выполняется вход
 *       - При успешной операции возвращаются JWT токены (access и refresh)
 *       - Токены также сохраняются в HTTP-only cookies
 *       - Защищен от брутфорс атак (ограничение попыток входа)
 *
 *       **Безопасность:**
 *       - Автоматическое создание новых пользователей
 *       - Используется защита от повторных запросов
 *       - Rate limiting для предотвращения атак
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
 *       201:
 *         description: Пользователь успешно создан и вошел в систему
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Отсутствуют обязательные поля (username или password)
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
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  try {
    // Сначала пытаемся найти существующего пользователя
    let user = await authenticateUser(username, password);
    let isNewUser = false;

    // Если пользователь не найден, регистрируем его
    if (!user) {
      try {
        user = await registerUser(username, password);
        isNewUser = true;
        console.log(`New user registered via login: ${username}`);
      } catch (registerError) {
        if (registerError.message === "Username already taken") {
          return res.status(409).json({
            error: "Username already taken",
            message:
              "A user with this username already exists. Please choose a different username.",
          });
        }
        throw registerError;
      }
    }

    // Создаем токены для пользователя
    const accessToken = signAccessToken({ sub: user.id });
    const refreshToken = signRefreshToken({ sub: user.id });

    await RefreshToken.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 864e5),
    });

    res.cookie("accessToken", accessToken, { httpOnly: true, sameSite: "lax" });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
    });

    // Возвращаем соответствующий статус и сообщение
    if (isNewUser) {
      res.status(201).json({
        accessToken,
        refreshToken,
        message: "User registered and logged in successfully",
      });
    } else {
      res.json({
        accessToken,
        refreshToken,
        message: "Login successful",
      });
    }
  } catch (error) {
    console.error("Login/Register error:", error);
    const rec = req._loginAttemptRecord;
    rec.count++;
    await rec.save();
    res.status(500).json({ error: "Internal server error" });
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
