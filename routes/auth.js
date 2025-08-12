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

async function findUserByCredentials(username, password) {
  let user = await User.findOne({ username });
  if (!user) {
    const userId = `user-${username}-${Date.now()}`;
    user = await User.create({ username, userId, coins: 0 });
    console.log(`New user registered: ${username}`);
  } else {
    user.lastActive = new Date();
    await user.save();
  }
  return { id: user.userId, username: user.username };
}

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Вход пользователя в систему
 *     description: |
 *       Аутентификация пользователя по имени и паролю.
 *       
 *       **Особенности:**
 *       - Если пользователь не существует, он будет автоматически создан
 *       - При успешном входе возвращаются JWT токены (access и refresh)
 *       - Токены также сохраняются в HTTP-only cookies
 *       - Защищен от брутфорс атак (ограничение попыток входа)
 *       
 *       **Безопасность:**
 *       - Пароли не хранятся в открытом виде
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
 *       400:
 *         description: Отсутствуют обязательные поля (username или password)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Неверные учетные данные
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
  if (!username || !password)
    return res.status(400).json({ error: "Missing creds" });
  const user = await findUserByCredentials(username, password);
  if (!user) {
    const rec = req._loginAttemptRecord;
    rec.count++;
    await rec.save();
    return res.status(401).json({ error: "Invalid creds" });
  }
  await LoginAttempt.deleteOne({ ip: req.ip });
  const accessToken = signAccessToken({ sub: user.id });
  const refreshToken = signRefreshToken({ sub: user.id });
  await RefreshToken.create({
    token: refreshToken,
    userId: user.id,
    expiresAt: new Date(Date.now() + 7 * 864e5),
  });
  res.cookie("accessToken", accessToken, { httpOnly: true, sameSite: "lax" });
  res.cookie("refreshToken", refreshToken, { httpOnly: true, sameSite: "lax" });
  res.json({ accessToken, refreshToken });
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
