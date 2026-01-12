import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch'; // ודאי שהספרייה מותקנת ב-media-server

import { createPlainTransport } from './mediasoup.service.js';

const TEMP_DIR = '/usr/src/app/packages/media-server/media_files';
const activeStreams = new Map();


if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

export const StreamService = {
    getActiveStreams: () => activeStreams,
    getTempDir: () => TEMP_DIR,

    // פונקציית עזר לעדכון הבאקנד
    async notifyBackend(streamId, status) {
        try {
            const response = await fetch('http://app-server:8080/api/streams/update-status-from-server', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ streamId, status })
            });
            if (response.ok) {
                console.log(`📡 Backend updated: ${streamId} is ${status}`);
            } else {
                console.error(`⚠️ Backend returned error for ${streamId}`);
            }
        } catch (err) {
            console.error(`❌ Failed to notify Backend for ${streamId}:`, err.message);
        }
    },

    async startStream(streamId, inputPipe, res, router) {
    if (activeStreams.has(streamId)) {
        throw new Error('Stream already exists');
    }

    // 1. יצירת הטרנספורט הפנימי (ה"גשר") ב-Mediasoup
    const transport = await createPlainTransport(router);

    // 2. יצירת ה-Producer - זה הזרם שהצופים יצרכו
    const producer = await transport.produce({
        kind: 'video',
        rtpParameters: {
            codecs: [{
                mimeType: 'video/VP8', // חייב להתאים לקידוד ב-FFmpeg ובקונפיג
                payloadType: 101,
                clockRate: 90000
            }],
            encodings: [{ ssrc: 1111 }]
        }
    });

    // 3. קבלת הפורט שהמדיסופ פתח עבור ה-FFmpeg
    const rtpPort = transport.tuple.localPort;

    // 4. הפעלת ה-FFmpeg ושידור לפורט הפנימי של המדיסופ
    const ffmpeg = spawn('ffmpeg', [
        '-i', 'pipe:0',
        '-c:v', 'libvpx',      // קידוד VP8 שמתאים ל-WebRTC
        '-preset', 'ultrafast',
        '-tune', 'zerolatency',
        '-f', 'rtp', `rtp://127.0.0.1:${rtpPort}`
    ]);

    // 5. שמירת ה-ProducerId כדי שהסוקט ידע למי לחבר את הצופים
    activeStreams.set(streamId, {
        ffmpeg,
        producerId: producer.id,
        startTime: Date.now()
    });

    // עדכון הבאקנד והזרמת המידע
    this.notifyBackend(streamId, 'LIVE');
    inputPipe.pipe(ffmpeg.stdin);

    // טיפול בסגירה
    ffmpeg.on('close', () => {
        transport.close(); // סגירת הגשר כשהשידור נגמר
        this.notifyBackend(streamId, 'FINISHED');
        activeStreams.delete(streamId);
    });
    
    return producer.id;
},

    stopStream(streamId) {
        const stream = activeStreams.get(streamId);
        if (stream && stream.ffmpeg) {
            stream.ffmpeg.kill('SIGTERM');
            // ה-close handler כבר יעדכן את הבאקנד כ-FINISHED
        }
    }
};