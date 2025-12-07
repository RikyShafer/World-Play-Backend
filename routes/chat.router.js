import { Router } from 'express';
import { getChatHistory } from '../controller/chat.controller.js';
// נניח שיש לך middleware לאימות משתמשים
// import { protect } from '../middleware/auth.middleware.js'; 

const router = Router();

// נדרש GameId כדי לדעת איזה צ'אט לטעון
router.get('/:gameId/history', getChatHistory); 

// אם צריך צ'אט פרטי, אפשר להוסיף:
// router.get('/private/:otherUserId', protect, getPrivateChat);

export default router;