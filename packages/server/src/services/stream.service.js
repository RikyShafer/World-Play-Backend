// stream.service.js
import { PrismaClient } from '@prisma/client';
import * as gameRules from '../services/validation.service.js';

const prisma = new PrismaClient();

const streamService = {

  async startStream(streamId, inputPipe, res) {
        if (activeStreams.has(streamId)) {
            throw new Error('Stream already exists');
        }

        console.log(`📡 Ingesting stream ${streamId} and relaying to internal RTP`);

        // הגדרת פורט ייחודי לכל סטרים (למשל, מתחילים מ-5004)
        const rtpPort = 5000 + Math.floor(Math.random() * 1000); 
        const rtpUrl = `rtp://127.0.0.1:${rtpPort}`;

        const ffmpeg = spawn('ffmpeg', [
            '-i', 'pipe:0',                   // קלט מהדפדפן/טרמינל
            '-c:v', 'libx264',                // קידוד וידאו
            '-preset', 'ultrafast',           // מהירות מקסימלית
            '-tune', 'zerolatency',           // אופטימיזציה לאפס דיליי
            '-c:a', 'aac',                    // קידוד אודיו
            '-f', 'rtp',                      // פורמט היציאה: RTP
            rtpUrl                            // הכתובת הפנימית
        ]);

        activeStreams.set(streamId, {
            ffmpeg,
            rtpUrl,
            rtpPort,
            startTime: Date.now()
        });

        // עדכון הבאקנד שהשידור התחיל (כמו שעשינו קודם)
        this.notifyBackend(streamId, 'LIVE');

        inputPipe.pipe(ffmpeg.stdin);

        ffmpeg.stderr.on('data', (data) => {
            // לוגים לבקרה
            if (data.toString().includes('error')) {
                console.error(`⚠️ FFmpeg [${streamId}]:`, data.toString());
            }
        });

        ffmpeg.on('close', (code) => {
            console.log(`🛑 Stream relay ${streamId} stopped (code: ${code})`);
            activeStreams.delete(streamId);
            this.notifyBackend(streamId, 'FINISHED');
        });
    },
  async createStream(hostId, { title }) {
    await gameRules.validateUserHasNoActiveStream(hostId);

    return await prisma.stream.create({
      data: {
        title,
        hostId,
        status: 'WAITING',
      },
    });
  },


  async updateStreamStatus(streamId, userId, newStatus) {
    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
    });

    if (!stream) throw new Error('Stream not found');

    if (stream.hostId !== userId) {
      throw new Error('Unauthorized: Only the host can update stream status');
    }

    const dataToUpdate = { status: newStatus };
    const now = new Date();

    if (newStatus === 'LIVE' && !stream.startTime) {
      dataToUpdate.startTime = now;
    } else if (newStatus === 'FINISHED') {
      dataToUpdate.endTime = now;
    } else if (newStatus === 'PAUSE') {
      dataToUpdate.lastPausedAt = now;
    }

    return await prisma.stream.update({
      where: { id: streamId },
      data: dataToUpdate,
    });
  },

  // תיקון תחביר: בתוך אובייקט משתמשים ב-async שםהפונקציה() ולא ב-const
  async pauseStream(streamId, videoTimestamp) {
    return await prisma.stream.update({
      where: { id: streamId },
      data: {
        status: 'PAUSE',
        lastPausedAt: new Date(),
        // אם הוספת שדה videoTimestamp בפריזמה, עדכני אותו כאן:
        // videoTimestamp: videoTimestamp 
      },
    });
  },

  async resumeStream(streamId) {
    return await prisma.stream.update({
      where: { id: streamId },
      data: { status: 'LIVE' },
    });
  },
};

export default streamService;


