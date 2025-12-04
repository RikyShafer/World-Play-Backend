import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const gameService = {
  // יצירת משחק חדש
  async createGame(hostId, { title, description, streamId, moderatorId }) {
    return await prisma.game.create({
      data: {
        title,
        description,
        hostId, // המנחה שיוצר את המשחק
        streamId, // הסטרים שבתוכו המשחק מתקיים
        moderatorId, // המודרטור של המשחק
        status: 'WAITING', // ברירת מחדל
      },
    });
  },

  // עדכון סטטוס המשחק
  async updateGameStatus(gameId, status) {
    const dataToUpdate = { status };

    // אם הסטטוס הוא "הסתיים", אנחנו נועלים את זמן הסיום
    if (status === 'FINISHED') {
      dataToUpdate.finishedAt = new Date();
    }

    return await prisma.game.update({
      where: { id: gameId },
      data: dataToUpdate,
    });
  },
};

export default gameService;
