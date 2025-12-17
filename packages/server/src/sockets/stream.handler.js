// src/sockets/stream.handler.js
import * as msService from '../services/mediasoup.service.js';
import { logger } from '../utils/logger.js';

// אחסון זמני בזיכרון (כמו שעשינו קודם)
const rooms = {};      // gameId -> { router, hostSocketId }
const transports = {}; // transportId -> transport
const producers = {};  // producerId -> producer
const consumers = {};  // consumerId -> consumer

export const registerStreamHandlers = (io, socket) => {
  const user = socket.user; // המשתמש המחובר (מגיע מה-Auth Middleware שלך)

  // 1. Host פותח חדר שידור (בדרך כלל זה יקרה יחד עם join_room של המשחק)
  socket.on('stream:create_room', async ({ gameId }, callback) => {
    try {
      if (!rooms[gameId]) {
        const worker = msService.getWorker();
        const router = await msService.createRouter(worker);
        rooms[gameId] = { router, hostSocketId: socket.id };
        logger.socketAction(user, 'STREAM_ROOM_CREATED', `Game: ${gameId}`);
      }
      
      const router = rooms[gameId].router;
      callback({ rtpCapabilities: router.rtpCapabilities });
    } catch (error) {
      logger.error(`Create Stream Room Error`, error);
      callback({ error: error.message });
    }
  });

  // 2. יצירת Transport (צינור)
  socket.on('stream:create_transport', async ({ gameId }, callback) => {
    try {
      const room = rooms[gameId];
      if (!room) return callback({ error: 'Stream room not found' });

      const transport = await msService.createWebRtcTransport(room.router);
      
      // הוק לטיפול בניתוקים
      transport.on('dtlsstatechange', (dtlsState) => {
        if (dtlsState === 'closed') transport.close();
      });

      transports[transport.id] = transport;

      callback({
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      });
    } catch (error) {
      logger.error('Create Transport Error', error);
      callback({ error: error.message });
    }
  });

  // 3. חיבור Transport
  socket.on('stream:connect_transport', async ({ transportId, dtlsParameters }, callback) => {
    const transport = transports[transportId];
    if (transport) {
      await transport.connect({ dtlsParameters });
      callback({ success: true });
    } else {
      callback({ error: 'Transport not found' });
    }
  });

  // 4. שידור (Produce)
  socket.on('stream:produce', async ({ transportId, kind, rtpParameters, gameId }, callback) => {
    const transport = transports[transportId];
    if (!transport) return callback({ error: 'Transport not found' });

    try {
      const producer = await transport.produce({ kind, rtpParameters });
      producers[producer.id] = producer;

      // מודיעים לכל המשתתפים בחדר שיש מפיק חדש
      socket.to(gameId).emit('stream:new_producer', { producerId: producer.id });
      
      logger.socketAction(user, 'START_PRODUCING', `Kind: ${kind}`);
      callback({ id: producer.id });
    } catch (error) {
      callback({ error: error.message });
    }
  });

  // 5. צפייה (Consume)
  socket.on('stream:consume', async ({ transportId, producerId, rtpCapabilities }, callback) => {
    const transport = transports[transportId];
    // מציאת ה-Router דרך ה-Transport (טריק פנימי של Mediasoup)
    // בפועל, בקוד הפשוט עדיף לשלוח גם gameId, אבל ננסה לחלץ:
    const routerId = transport?.internal?.routerId;
    const roomKey = Object.keys(rooms).find(k => rooms[k].router.id === routerId);
    
    if (!transport || !roomKey) return callback({ error: 'Params missing' });

    const router = rooms[roomKey].router;

    try {
      if (router.canConsume({ producerId, rtpCapabilities })) {
        const consumer = await transport.consume({
          producerId,
          rtpCapabilities,
          paused: true,
        });

        consumers[consumer.id] = consumer;

        callback({
          id: consumer.id,
          producerId,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
        });

        await consumer.resume();
      } else {
        callback({ error: 'Cannot consume' });
      }
    } catch (error) {
      logger.error('Consume Error', error);
      callback({ error: error.message });
    }
  });
};