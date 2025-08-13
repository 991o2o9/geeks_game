import express from "express";
import { jwtAuthMiddleware } from "../middlewares/auth.js";
import { User } from "../models/User.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     LeaderboardEntry:
 *       type: object
 *       properties:
 *         rank:
 *           type: integer
 *           description: Позиция игрока в рейтинге
 *           example: 1
 *           minimum: 1
 *         username:
 *           type: string
 *           description: Имя пользователя
 *           example: "player123"
 *         coins:
 *           type: integer
 *           description: Количество монет у игрока
 *           example: 1500
 *           minimum: 0
 *         lastActive:
 *           type: string
 *           format: date-time
 *           description: Время последней активности
 *           example: "2024-01-15T10:30:00.000Z"
 *     LeaderboardResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Статус успешного выполнения
 *           example: true
 *         leaderboard:
 *           type: array
 *           description: Список игроков в рейтинге
 *           items:
 *             $ref: '#/components/schemas/LeaderboardEntry'
 *     UpdateCoinsRequest:
 *       type: object
 *       required:
 *         - coins
 *       properties:
 *         coins:
 *           type: integer
 *           minimum: 0
 *           description: Новое количество монет
 *           example: 2000
 *     UpdateCoinsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Статус успешного обновления
 *           example: true
 *         coins:
 *           type: integer
 *           description: Обновленное количество монет
 *           example: 2000
 *         username:
 *           type: string
 *           description: Имя пользователя
 *           example: "player123"
 *     UserProfile:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *           description: Имя пользователя
 *           example: "player123"
 *         coins:
 *           type: integer
 *           description: Текущее количество монет
 *           example: 1500
 *         lastActive:
 *           type: string
 *           format: date-time
 *           description: Время последней активности
 *           example: "2024-01-15T10:30:00.000Z"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Дата создания аккаунта
 *           example: "2024-01-01T00:00:00.000Z"
 *     ProfileResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Статус успешного выполнения
 *           example: true
 *         user:
 *           $ref: '#/components/schemas/UserProfile'
 */

/**
 * @swagger
 * /api/user/leaderboard:
 *   get:
 *     summary: Получение таблицы лидеров
 *     description: |
 *       Получение списка лучших игроков, отсортированных по количеству монет.
 *
 *       **Особенности:**
 *       - Сортировка по убыванию количества монет
 *       - Возвращает позицию, имя пользователя, монеты и время активности
 *       - Не требует аутентификации (публичный endpoint)
 *       - Поддерживает пагинацию через параметр limit
 *
 *       **Параметры:**
 *       - `limit` - количество игроков для отображения (1-100, по умолчанию 10)
 *
 *       **Использование:**
 *       - Для отображения рейтинга на главной странице
 *       - Мотивация игроков к соревнованию
 *       - Отслеживание прогресса сообщества
 *     tags: [Пользователи]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Количество игроков для отображения
 *         example: 10
 *     responses:
 *       200:
 *         description: Таблица лидеров успешно получена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeaderboardResponse'
 *       500:
 *         description: Ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Leaderboard
router.get("/leaderboard", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const leaderboard = await User.find()
      .select("username coins lastActive")
      .sort({ coins: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      leaderboard: leaderboard.map((user, index) => ({
        rank: index + 1,
        username: user.username,
        coins: user.coins,
        lastActive: user.lastActive,
      })),
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

/**
 * @swagger
 * /api/user/coins:
 *   post:
 *     summary: Обновление количества монет пользователя
 *     description: |
 *       Обновление количества монет для аутентифицированного пользователя.
 *
 *       **Требования:**
 *       - Обязательная аутентификация (Bearer token)
 *       - Количество монет должно быть неотрицательным числом
 *
 *       **Использование:**
 *       - После выполнения игровых действий
 *       - При покупке предметов
 *       - При получении наград
 *       - Для синхронизации состояния игры
 *
 *       **Безопасность:**
 *       - Только владелец аккаунта может изменять свои монеты
 *       - Валидация входных данных
 *       - Автоматическое обновление времени последней активности
 *     tags: [Пользователи]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCoinsRequest'
 *     responses:
 *       200:
 *         description: Количество монет успешно обновлено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateCoinsResponse'
 *       400:
 *         description: Неверное количество монет (отрицательное число)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Не авторизован - недействительный или отсутствующий токен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Пользователь не найден
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
// Update coins
router.post("/coins", jwtAuthMiddleware, async (req, res) => {
  try {
    const { coins } = req.body;
    if (typeof coins !== "number" || coins < 0) {
      return res.status(400).json({ error: "Invalid coins amount" });
    }
    const user = await User.findOne({ userId: req.userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    user.coins = coins;
    user.lastActive = new Date();
    await user.save();

    res.json({ success: true, coins: user.coins, username: user.username });
  } catch (error) {
    console.error("Update coins error:", error);
    res.status(500).json({ error: "Failed to update coins" });
  }
});

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Получение профиля пользователя
 *     description: |
 *       Получение информации о профиле аутентифицированного пользователя.
 *
 *       **Возвращаемые данные:**
 *       - Имя пользователя
 *       - Текущее количество монет
 *       - Время последней активности
 *       - Дата создания аккаунта
 *
 *       **Использование:**
 *       - Отображение профиля в игре
 *       - Проверка прогресса игрока
 *       - Отслеживание активности
 *       - Персонализация интерфейса
 *
 *       **Безопасность:**
 *       - Только владелец аккаунта может просматривать свой профиль
 *       - Обязательная аутентификация
 *       - Защищенные данные не передаются
 *     tags: [Пользователи]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Профиль пользователя успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProfileResponse'
 *       401:
 *         description: Не авторизован - недействительный или отсутствующий токен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Пользователь не найден
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
// Get profile
router.get("/profile", jwtAuthMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.userId }).select(
      "username coins lastActive createdAt"
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      success: true,
      user: {
        username: user.username,
        coins: user.coins,
        lastActive: user.lastActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

export default router;
