import express from 'express';
import cors from 'cors';
import rulesRouter from './api/routes/rules.routes.js';
import studentsRouter from './api/routes/students.routes.js'; // 1. Import the new router

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- ROUTES ---
app.use('/api/rules', rulesRouter);
app.use('/api/students', studentsRouter); // 2. Mount the new router

app.get('/', (req, res) => {
  res.send('Degree-Compass API is running...');
});

export default app;