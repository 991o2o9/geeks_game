import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// база данных
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true, 
}).then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Ошибка:", err));

// роуты тут пишите все ендпоинты которые вам нужны
app.get('/', (req, res) => {
  res.send({ msg: "Server is running" });
});

// запуск сервера
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
