import express from 'express';
import { getTable, upsertItem, removeItem, generateData } from '../controllers/devTools.controller.js';

const router = express.Router();

// Route to get all items from a table
router.get('/table/:tableName', getTable);

// Route to add or update an item (upsert)
router.post('/item', upsertItem);

// Route to delete an item
router.delete('/item', removeItem);

// Route to trigger mass data generation
router.post('/generate-mass-data', generateData);

export default router;