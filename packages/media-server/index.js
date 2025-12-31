const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const app = express();
const port = 8000;

app.get('/', (req, res) => {
  res.send('Media Server is Running!');
});

// בדיקה ש-FFmpeg זמין במערכת
ffmpeg.getAvailableFormats((err, formats) => {
  if (err) {
    console.error('FFmpeg is NOT available:', err);
  } else {
    console.log('FFmpeg is ready and working!');
  }
});

app.listen(port, () => {
  console.log(`Media server listening at http://localhost:${port}`);
});