import express from 'express';
const router = express.Router();
import { createPaymentSheet } from '../payments/payments.service.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

router.post('/create-sheet', authenticateToken, async (req, res) => {
  try {
    const { userId, amount } = req.body;
    const result = await createPaymentSheet(userId, amount);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
