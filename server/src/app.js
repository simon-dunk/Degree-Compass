import express from 'express';
import cors from 'cors';
import rulesRouter from './api/routes/rules.routes.js';
import studentsRouter from './api/routes/students.routes.js';
import auditRouter from './api/routes/audit.routes.js';
import plannerRouter from './api/routes/planner.routes.js'; // 1. Import new router

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- ROUTES ---
app.use('/api/rules', rulesRouter);
app.use('/api/students', studentsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/planner', plannerRouter); // 2. Mount new router

app.get('/', (req, res) => {
  res.send('Degree-Compass API is running...');
});

export default app;