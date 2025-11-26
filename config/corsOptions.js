const whitelist = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:8000",
];

const corsOptions = {
    origin:  (origin, callback) => {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    optionsSuccssStatus:200
};

// במקום module.exports = corsOptions;
export default corsOptions; // <-- זהו הייצוא הנכון עבור ESM