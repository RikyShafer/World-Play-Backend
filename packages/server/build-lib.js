import * as esbuild from 'esbuild';
import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);

async function build() {
    try {
        console.log('🔍 Locating mediasoup-client...');
        
        // הטריק: אנחנו מבקשים מ-Node למצוא את הקובץ בשבילנו
        // זה עובד גם ב-Monorepo וגם בפרויקט רגיל
        const entryPoint = require.resolve('mediasoup-client');
        console.log('📍 Found at:', entryPoint);

        console.log('🔨 Building file...');
        
        await esbuild.build({
            entryPoints: [entryPoint],
            bundle: true,
            minify: true,
            format: 'iife', // פורמט שמתאים לדפדפן
            globalName: 'MediasoupClient', // השם שיהיה זמין ב-HTML
            outfile: 'public/mediasoup-client.min.js',
        });

        console.log('✅ SUCCESS! File created at: public/mediasoup-client.min.js');
    } catch (e) {
        console.error('❌ Build failed:', e);
    }
}

build();