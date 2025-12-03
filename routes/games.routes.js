import express from 'express';
import gameController from '../controller/game.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticateToken);

// יצירת משחק (דורש streamId ב-Body)
router.post('/', gameController.createGame);

// עדכון סטטוס (למשל לסיום המשחק)
router.patch('/:id/status', gameController.updateStatus);

export default router;
