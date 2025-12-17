import { Server } from 'socket.io';
import { socketAuth } from '../middleware/socketAuth.js';
import { logger } from '../utils/logger.js';
import { registerGameHandlers } from '../sockets/game.handler.js';
import { registerStreamHandlers } from '../sockets/stream.handler.js';
// packages/server/src/services/socket.service.js

export const initializeSocketIO = (httpServer) => {
  console.log('socket.service.js -> STARTING INIT');

  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  console.log('socket.service.js -> IO Created');

  // 👇 שינוי 1: שמנו את בדיקת האבטחה בהערה זמנית
  // io.use(socketAuth); 

  io.on('connection', (socket) => {
    console.log('socket.service.js -> NEW CONNECTION:', socket.id);

    // 👇 שינוי 2: אם אין משתמש (כי ביטלנו אבטחה), ניצור משתמש אורח פיקטיבי
    // זה קריטי כדי שהלוגים בהמשך לא יקרסו
    socket.user = socket.user || { 
        id: 'guest_' + socket.id.substr(0, 4), 
        username: 'Guest Tester', 
        role: 'PLAYER' 
    };

    const user = socket.user;
    logger.socketConnect(user, socket.id);

    registerGameHandlers(io, socket);
    registerStreamHandlers(io, socket); // הנדלר הוידאו שלנו

    socket.on('disconnect', (reason) => {
      logger.socketDisconnect(user, socket.id, reason);
    });
  });

  logger.system('Socket.io Service Initialized');
  console.log('socket.service.js -> FINISHED INIT');

  return io;
};
