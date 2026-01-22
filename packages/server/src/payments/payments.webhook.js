import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const userId = intent.metadata.userId;
    const isFirst = intent.metadata.isFirstPurchase === 'true';
    const amountPaid = intent.amount / 100;

    // עדכון ב-DB בתוך טרנזקציה בטוחה
    await prisma.$transaction(async (tx) => {
      // אם רכישה ראשונה - פי 20 מטבעות (למשל 10 ש"ח = 200 מטבעות)
      // אם לא - פי 10 מטבעות (10 ש"ח = 100 מטבעות)
      const coinsToAdd = isFirst ? amountPaid * 20 : amountPaid * 10;

      await tx.user.update({
        where: { id: userId },
        data: {
          walletCoins: { increment: coinsToAdd },
          isFirstPurchase: false, // ביטול הבונוס לפעם הבאה
        },
      });

      // רישום הפעולה בטבלת הטרנזקציות
      await tx.transaction.create({
        data: {
          userId: userId,
          type: 'PURCHASE',
          status: 'SUCCESS',
          amount: coinsToAdd,
          currency: 'COIN',
        },
      });
    });
  }
  res.json({ received: true });
};
