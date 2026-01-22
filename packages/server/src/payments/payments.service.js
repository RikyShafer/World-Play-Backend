import Stripe from 'stripe'; // במקום require
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentSheet = async (userId, amount) => {
  // 1. מוצאים את המשתמש כדי לדעת אם להכפיל לו מטבעות
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  // 2. פותחים עסקה ב-Stripe ושומרים את ה-userId ב-Metadata
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // Stripe עובד באגורות
    currency: 'ils',
    metadata: {
      userId: userId,
      isFirstPurchase: String(user.isFirstPurchase),
    },
  });

  return {
    paymentIntent: paymentIntent.client_secret,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  };
};
