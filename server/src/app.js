import express from 'express';
import rulesRouter from './api/routes/rules.routes.js';

// Initialize the Express app
const app = express();

// Middleware to parse JSON bodies from incoming requests
app.use(express.json());

// Mount the rules router to the /api/rules path
app.use('/api/rules', rulesRouter);

// A simple root route to confirm the server is up
app.get('/', (req, res) => {
  res.send('Degree-Compass API is running...');
});

export default app;