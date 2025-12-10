// services/analytics.service.js
import { PrismaClient } from '@prisma/client';
import * as gameRules from '../services/validation.service.js';
const prisma = new PrismaClient();

export const createViewLog = async (userId, reportData) => {
  const { gameId, duration, totalQuestions, correctAnswers } = reportData;

  // 1. שימוש בפונקציה קיימת: וידוא קיום המשחק ושליפת הנתונים שלו
  // הפונקציה הזו (מהקובץ validation) כבר מחזירה את ה-game אם הוא קיים
  const game = await gameRules.ensureGameExists(gameId);
  // 2. חישוב אחוזי השתתפות (לוגיקה עסקית פשוטה שנשארת כאן)
  let participationPercent = 0;
  if (totalQuestions > 0) {
    participationPercent = correctAnswers / totalQuestions;
  }

  // 3. יצירת הלוג עם ה-hostId ששלפנו
  const newLog = await prisma.viewLog.create({
    data: {
      userId: userId,
      gameId: gameId,
      hostId: game.hostId, // <--- הנה התוספת הקריטית לפי ההנחיה של משה
      duration: duration,
      answersCount: totalQuestions,
      participationPercent: participationPercent,
    },
  });

  return newLog;
};
