import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'social',
    timestamp: new Date().toISOString(),
  });
});

// Stub endpoints
app.get('/api/feed', (req, res) => {
  res.json({
    data: [],
    meta: {
      current_page: 1,
      total: 0,
    },
  });
});

app.post('/api/posts', (req, res) => {
  res.json({
    data: {
      id: 1,
      content: req.body.content,
      created_at: new Date().toISOString(),
    },
  });
});

app.get('/api/polls', (req, res) => {
  res.json({
    data: [],
  });
});

app.listen(PORT, () => {
  console.log(`Social service running on port ${PORT}`);
});