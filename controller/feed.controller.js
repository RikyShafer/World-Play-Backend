import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();


// פונקציה לשליפת הפיד (משחקים בשידור חי בלבד)
export const getLiveFeed = async (req, res) => {
  try {
    const liveStreams = await prisma.stream.findMany({
      where: {
        status: 'LIVE' // שולף רק מה שבסטטוס LIVE
      },
      include: {
        host: true, // מביא גם את פרטי המנחה (שם, תמונה וכו')
        games: true // מביא את המשחקים המשויכים לשידור
      }
    });

    res.status(200).json(liveStreams);

  } catch (error) {
    console.error("Error fetching feed:", error);
    res.status(500).json({ error: "Failed to fetch feed" });
  }
};