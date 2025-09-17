import express from 'express';
import cors from 'cors';
import rulesRouter from './api/routes/rules.routes.js';
import studentsRouter from './api/routes/students.routes.js';
import auditRouter from './api/routes/audit.routes.js';
import plannerRouter from './api/routes/planner.routes.js';
import devToolsRouter from './api/routes/devTools.routes.js'; // 1. Import new router
import coursesRouter from './api/routes/courses.routes.js';

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- ROUTES ---
app.use('/api/rules', rulesRouter);
app.use('/api/students', studentsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/planner', plannerRouter);
app.use('/api/dev', devToolsRouter);
app.use('/api/courses', coursesRouter);

app.get('/', (req, res) => {
  res.send('Degree-Compass API is running...');
});

export default app;