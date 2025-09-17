import * as rulesService from '../../services/rulesService.js';

/**
 * @desc    Get all degree rules for a given major
 * @route   GET /api/rules/:majorCode
 * @access  Private (Admin)
 */
export const getDegreeRules = async (req, res) => {
  try {
    const { majorCode } = req.params;
    const rules = await rulesService.getRulesByMajor(majorCode.toUpperCase());

    if (rules.length > 0) {
      res.status(200).json(rules);
    } else {
      res.status(404).json({ message: `No rules found for major: ${majorCode}` });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching rules.', error: error.message });
  }
};

/**
 * @desc    Create or update a degree rule.
 * @route   POST /api/rules
 * @access  Private (Admin)
 */
export const createOrUpdateDegreeRule = async (req, res) => {
  try {
    const ruleData = req.body;
    // Basic validation
    if (!ruleData.MajorCode || !ruleData.RequirementType) {
      return res.status(400).json({ message: 'Request body must include MajorCode and RequirementType.' });
    }

    const savedRule = await rulesService.createOrUpdateRule(ruleData);
    res.status(201).json({
      message: 'Rule created/updated successfully',
      rule: savedRule,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error creating or updating rule.', error: error.message });
  }
};


/**
 * @desc    Delete a specific degree rule
 * @route   DELETE /api/rules/:majorCode/:requirementType
 * @access  Private (Admin)
 */
export const deleteDegreeRule = async (req, res) => {
  try {
    const { majorCode, requirementType } = req.params;
    const result = await rulesService.deleteRule(majorCode.toUpperCase(), requirementType.toUpperCase());
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting rule.', error: error.message });
  }
};

/**
 * @desc    Get a list of all unique major codes
 * @route   GET /api/rules/majors/all
 * @access  Private (Admin)
 */
export const getAllMajorCodes = async (req, res) => {
  try {
    const majors = await rulesService.getAllMajors();
    res.status(200).json(majors);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching major codes.', error: error.message });
  }
};