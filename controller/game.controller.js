import gameService from '../services/game.service.js';

const gameController = {
  // POST /api/games
  async createGame(req, res) {
    try {
      // הנחה: המשתמש מזוהה דרך ה-Token
      const userId = req.user.id;
      const { title, description, streamId, moderatorId } = req.body;

      // ולידציה: חייבים כותרת ו-streamId כדי ליצור משחק
      if (!title || !streamId) {
        return res.status(400).json({
          error: 'חסרים שדות חובה: title, streamId',
        });
      }

      const game = await gameService.createGame(userId, {
        title,
        description,
        streamId,
        moderatorId,
      });
      res.status(201).json({ message: 'המשחק נוצר בהצלחה', game });
    } catch (error) {
      console.error('Create Game Error:', error);
      // בדיקה אם הסטרים בכלל קיים
      if (error.code === 'P2003') {
        // Foreign key constraint failed
        return res
          .status(404)
          .json({ error: 'הסטרים (streamId) שצוין לא קיים' });
      }
      res.status(500).json({ error: 'שגיאה ביצירת המשחק' });
    }
  },

  // PATCH /api/games/:id/status
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // ולידציה לסטטוסים המותרים למשחק
      const validStatuses = ['WAITING', 'ACTIVE', 'FINISHED'];

      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          error: `סטטוס לא תקין. ערכים מותרים: ${validStatuses.join(', ')}`,
        });
      }

      const updatedGame = await gameService.updateGameStatus(id, status);

      res.status(200).json({ message: 'סטטוס המשחק עודכן', game: updatedGame });
    } catch (error) {
      console.error('Update Game Status Error:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'משחק לא נמצא' });
      }
      res.status(500).json({ error: 'שגיאה בעדכון סטטוס המשחק' });
    }
  },
};

export default gameController;
