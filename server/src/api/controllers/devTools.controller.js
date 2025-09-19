import * as devToolsService from '../../services/devToolsService.js';
import { generateFullDegreeProgram } from '../../services/massDataService.js';

export const getTable = async (req, res) => {
  try {
    const { tableName } = req.params;
    const items = await devToolsService.getTableContents(tableName);
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const upsertItem = async (req, res) => {
  try {
    const { tableName, item } = req.body;
    if (!tableName || !item) {
      return res.status(400).json({ message: 'Request body must include tableName and item.' });
    }
    const result = await devToolsService.putItem(tableName, item);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeItem = async (req, res) => {
  try {
    const { tableName, key } = req.body;
     if (!tableName || !key) {
      return res.status(400).json({ message: 'Request body must include tableName and key.' });
    }
    const result = await devToolsService.deleteItem(tableName, key);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const generateData = async (req, res) => {
    try {
        const result = await generateFullDegreeProgram();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};