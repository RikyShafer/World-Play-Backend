
const router = express.Router();
import express from 'express';

import * as feedController from '../controller/feed.controller.js'; 
import * as analyticsController from '../controller/analytics.controller.js';
// --- הגדרת הכתובות ---

// 1. Analytics API: דיווח נתונים
router.post('/analytics/report', analyticsController.reportAnalytics);

// 2. Feed Query: קבלת פיד שידורים חיים
router.get('/feed', feedController.getLiveFeed);

export default router;