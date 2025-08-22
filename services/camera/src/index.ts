import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4002;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'camera',
    timestamp: new Date().toISOString(),
  });
});

// Photo upload endpoint
app.post('/api/photos', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No photo uploaded' });
  }

  res.json({
    data: {
      id: Math.random().toString(36).substr(2, 9),
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploaded_at: new Date().toISOString(),
      reveal_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // D+1
    },
  });
});

// Get photos for event
app.get('/api/events/:eventId/photos', (req, res) => {
  res.json({
    data: [],
    meta: {
      current_page: 1,
      total: 0,
    },
  });
});

// Process D+1 reveals (stub)
app.post('/api/photos/process-reveals', (req, res) => {
  res.json({
    processed: 0,
    message: 'No photos to reveal',
  });
});

app.listen(PORT, () => {
  console.log(`Camera service running on port ${PORT}`);
});