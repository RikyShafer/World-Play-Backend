const whitelist = [
    'http://localhost:3000',
    'http://localhost:8081',
    'http://localhost:19006',
    'http://192.168.56.1:8081',
    'exp://192.168.56.1:8081',
    'http://localhost:8080' // הוספת שרת האפליקציה עצמו ליתר ביטחון
];

const corsOptions = {
    origin: (origin, callback) => {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // אישור כל סוגי הבקשות
    allowedHeaders: ['Content-Type', 'Authorization', 'token', 'x-requested-with'], // התיקון הקריטי!
    optionsSuccessStatus: 200,
};

export default corsOptions;