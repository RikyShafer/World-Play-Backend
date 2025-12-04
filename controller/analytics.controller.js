import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();


// פונקציה לדיווח נתונים ושמירת ViewLog
export const reportAnalytics = async (req, res) => {
  try {
    const { userId, gameId, duration, totalQuestions, correctAnswers } = req.body;

    // 1. Calculation Logic: חישוב אחוז השתתפות
    // מונע חילוק ב-0: אם אין שאלות, האחוז הוא 0
    let participationPercent = 0;
    if (totalQuestions > 0) {
      participationPercent = correctAnswers / totalQuestions; 
      // דוגמה: 8 תשובות נכונות מתוך 10 = 0.8
    }

    // 2. שמירה ב-DB בטבלת ViewLog
    const newLog = await prisma.viewLog.create({
      data: {
        userId: userId,
        gameId: gameId,
        duration: duration, // זמן בדקות או שניות (תלוי מה הקליינט שולח)
        answersCount: totalQuestions, // נניח ששומרים פה על כמה שאלות הוא ענה/נשאל
        participationPercent: participationPercent // הערך המחושב (למשל 0.8)
      }
    });

    res.status(201).json({ message: "Analytics reported successfully", log: newLog });

  } catch (error) {
    console.error("Error reporting analytics:", error);
    res.status(500).json({ error: "Failed to report analytics" });
  }
};