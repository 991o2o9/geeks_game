import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "GeeksGame API 🚀",
      version: "1.0.0",
      description: `
## 🎮 GeeksGame API — Документация

Добро пожаловать в **документацию**

### 🔐 Аутентификация
- **Access Token** — живёт 15 минут
- **Refresh Token** — 7 дней

### 🛡️ Безопасность 
- Блокируем брутфорс, пока злоумышленник не устанет.
- 30 запросов в минуту — думаю этого достаточно.
- CORS, Helmet и прочие для защиты.
- Дубликаты запросов? Даже не пытайся.

### 📝 Заметки
- Для защищённых запросов нужен Bearer токен.
- GET-запросы свободные (ну почти).

---
**P.S.** Если ты читаешь это и решил взломать API — знай: мы уже знаем, где ты живёшь.
      `,
      contact: {
        name: "Asoltobekov",
        email: "asoltobekov@gmail.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Локальный сервер разработки",
      },
    ],
    tags: [
      { name: "Аутентификация", description: "Логин, токены и прочее" },
      { name: "Пользователи", description: "Профили, монеты и топы" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "JWT токен. В заголовке Authorization напиши 'Bearer {токен}'",
        },
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Сообщение об ошибке",
              example: "Неверные учётные данные",
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerUi, swaggerSpec };
