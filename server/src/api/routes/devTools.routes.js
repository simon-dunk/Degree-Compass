import express from 'express';
import { getTable, upsertItem, removeItem, generateData, bulkUploadCourses } from '../controllers/devTools.controller.js'; // 1. Import new controller

const router = express.Router();

router.get('/table/:tableName', getTable);
router.post('/item', upsertItem);
router.delete('/item', removeItem);
router.post('/generate-mass-data', generateData);
router.post('/courses/bulk-upload', bulkUploadCourses);

export default router;