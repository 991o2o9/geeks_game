import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

/**
 * Хеширует пароль с использованием bcrypt
 * @param {string} password - Пароль в открытом виде
 * @returns {Promise<string>} - Хешированный пароль
 */
export async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Проверяет пароль против хеша
 * @param {string} password - Пароль в открытом виде
 * @param {string} hashedPassword - Хешированный пароль
 * @returns {Promise<boolean>} - true если пароль верный
 */
export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * Валидирует пароль по требованиям безопасности
 * @param {string} password - Пароль для проверки
 * @returns {Object} - Результат валидации
 */
export function validatePassword(password) {
  const errors = [];
  
  if (password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }
  
  if (password.length > 128) {
    errors.push("Password must not exceed 128 characters");
  }
  
  // Проверяем наличие хотя бы одной буквы и одной цифры
  if (!/[a-zA-Z]/.test(password)) {
    errors.push("Password must contain at least one letter");
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Валидирует username по требованиям
 * @param {string} username - Имя пользователя для проверки
 * @returns {Object} - Результат валидации
 */
export function validateUsername(username) {
  const errors = [];
  
  if (username.length < 3) {
    errors.push("Username must be at least 3 characters long");
  }
  
  if (username.length > 50) {
    errors.push("Username must not exceed 50 characters");
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push("Username can only contain letters, numbers, and underscores");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
