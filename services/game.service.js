import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const gameService = {
  // יצירת משחק חדש
  //  + הוספת ה-HOST כשחקן ראשון
  async createGame(hostId, { title, description, streamId, moderatorId }) {
    return await prisma.game.create({
      data: {
        title,
        description,
        hostId,
        streamId,
        moderatorId,
        status: 'WAITING',

        // יצירה אוטומטית של המארח כשחקן בטבלה
        participants: {
          create: {
            userId: hostId,
            role: 'HOST',
            score: 0,
          },
        },
      },
      include: {
        participants: true,
      },
    });
  },

  /**
   * הצטרפות שחקן למשחק
   * כולל בדיקות אבטחה לתפקידים מיוחדים
   */
  async joinGame(gameId, userId, role = 'PLAYER') {
    // 1. שליפת המשחק לבדיקה
    const game = await prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new Error('Game not found');
    }

    if (game.status !== 'WAITING') {
      throw new Error(`Cannot join game. Current status: ${game.status}`);
    }

    // --- בדיקות אבטחה (Security Checks) ---

    // אם המשתמש מנסה להירשם כ-MODERATOR, נבדוק שהוא אכן המורשה
    if (role === 'MODERATOR') {
      if (game.moderatorId !== userId) {
        throw new Error(
          'Unauthorized: You are not assigned as moderator for this game'
        );
      }
    }

    // אם המשתמש מנסה להירשם כ-HOST (למשל במקרה של התחברות מחדש)
    if (role === 'HOST') {
      if (game.hostId !== userId) {
        throw new Error('Unauthorized: You are not the host of this game');
      }
    }

    // --- סוף בדיקות אבטחה ---

    // 2. בדיקה אם המשתתף כבר קיים (מונע כפילות)
    const existingParticipant = await prisma.gameParticipant.findUnique({
      where: {
        gameId_userId: {
          gameId,
          userId,
        },
      },
    });

    if (existingParticipant) {
      return { alreadyJoined: true, participant: existingParticipant };
    }

    // 3. יצירת המשתתף בפועל
    const newParticipant = await prisma.gameParticipant.create({
      data: {
        gameId,
        userId,
        role: role,
        score: 0,
      },
    });

    return { alreadyJoined: false, participant: newParticipant };
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
