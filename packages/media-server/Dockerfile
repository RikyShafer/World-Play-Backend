FROM node:20-alpine

# התקנת FFmpeg בתוך הקונטיינר
RUN apk add --no-cache ffmpeg

WORKDIR /usr/src/app

# העתקת קבצי ניהול החבילות
COPY package*.json ./

# התקנת התלויות
RUN npm install

# העתקת שאר הקוד
COPY . .

EXPOSE 8000
CMD ["node", "index.js"]