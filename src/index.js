import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';

// ייבוא נתיבי REST
import userRoutes from '../routes/user.routes.js';
import financeRoutes from '../routes/finance.routes.js';
import streamRoutes from '../routes/stream.routes.js';
import gameRoutes from '../routes/games.routes.js';
import chatRouter from '../routes/chat.router.js'; // ודא נתיב נכון

// ייבוא קונפיגורציה ושירותי Socket
import corsOptions from '../config/corsOptions.js';
import { initializeSocketIO } from '../services/socket.service.js'; // ודא נתיב נכון

dotenv.config();

const app = express();
// מוגדר כ-server
const server = http.createServer(app); 

// הגדרת פורט
const PORT = process.env.PORT || 8080;

// --- Middleware ---
app.use(express.json());
// שימוש ב-corsOptions המיובא
app.use(cors(corsOptions)); 

// --- Routes (REST API) ---
app.use('/users', userRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/streams', streamRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/chat', chatRouter);

// --- אתחול Socket.IO (ללא כפילות) ---
// העברת משתנה server המוגדר מעלה
const io = initializeSocketIO(server); 
app.set('io', io); // עכשיו io מוגדר היטב

app.get('/', (req, res) => {
  res.send('Live Game Streaming Backend is Running!');
});

// --- הסר את כל לוגיקת io.on('connection') מכאן! ---
// הלוגיקה הזו צריכה להיות בתוך initializeSocketIO בקובץ socket.service.js

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});