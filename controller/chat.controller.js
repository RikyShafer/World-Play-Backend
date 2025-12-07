import prisma from '../utils/prisma.js'; // זה הייבוא הנכון של ה-singleton

/**
 * @desc טוען היסטוריית הודעות צ'אט עבור משחק ספציפי
 * @route GET /api/chat/:gameId/history
 * @access Public (או נדרש Auth)
 */
export const getChatHistory = async (req, res) => {
    // Note: בפרויקט אמיתי, נדרש אימות שהמשתמש מורשה לצפות בצ'אט
    const { gameId } = req.params;
    const { limit = 50, offset = 0 } = req.query; // Pagination

    try {
        // חשוב: נניח שאתה משתמש ב-gameId ב-WHERE כדי לסנן הודעות. 
        // אם לא הוספת את gameId לסכמת ChatMessage, עליך לעשות זאת!
        const messages = await prisma.chatMessage.findMany({
            // אם הוספת gameId ל-ChatMessage:
            // where: { gameId: gameId }, 
            
            // כרגע נשתמש בתנאי פשוט שאינו מסנן לפי gameId, מכיוון שאין עמודה כזו בסכמה
            // כפי שהצגת. אם זאת התנהגות שגויה, הוסף את gameId לסכמת Prisma.
            
            select: {
                id: true,
                messageText: true,
                createdAt: true,
                sender: {
                    select: {
                        id: true,
                        username: true,
                        role: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc', // הודעות חדשות אחרונות (כדי להפוך אח"כ ב-Client)
            },
            take: parseInt(limit),
            skip: parseInt(offset),
        });

        // הופכים את הסדר כדי שהישנות יופיעו קודם (לצורך תצוגה)
        const reversedMessages = messages.reverse();

        res.status(200).json({
            success: true,
            data: reversedMessages,
        });

    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve chat history.' });
    }
};

// ניתן להוסיף כאן לוגיקה לטיפול בהודעות פרטיות (P2P) אם נדרש