import express from 'express';
import cors from 'cors';
import rulesRouter from './api/routes/rules.routes.js';

// Initialize the Express app
const app = express();

// --- MIDDLEWARE ---
app.use(cors()); // <-- 2. USE CORS MIDDLEWARE
app.use(express.json());

// --- ROUTES ---
// Mount the rules router to the /api/rules path
app.use('/api/rules', rulesRouter);

// A simple root route to confirm the server is up
app.get('/', (req, res) => {
  res.send('Degree-Compass API is running...');
});

export default app;