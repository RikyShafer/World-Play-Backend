FROM node:20-alpine
WORKDIR /usr/src/app

# התקנת openssl עבור פריזמה
RUN apk add --no-cache openssl

# 1. העתקת קבצי ההגדרות מכל המקומות (שורש, שרת, ו-shared)
COPY package.json ./
COPY packages/server/package*.json ./packages/server/
COPY packages/shared/package*.json ./packages/shared/

# 2. התקנת כל התלויות (זה יתקין גם את השרת וגם את shared ויקשר ביניהם)
RUN npm install

# 3. העתקת הקוד של shared (חובה כדי שהשרת יוכל להשתמש בו)
COPY packages/shared/ ./packages/shared/

# 4. העתקת קוד השרת
COPY packages/server/ ./packages/server/

# 5. יצירת Prisma Client
RUN npx prisma generate --schema=./packages/server/prisma/schema.prisma

# 6. הגדרת תיקיית עבודה להרצה
WORKDIR /usr/src/app/packages/server
EXPOSE 3000

CMD ["npm", "start"]