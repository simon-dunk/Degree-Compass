import { runDegreeAudit } from '../../services/degreeAuditService.js';

/**
 * @desc    Run a degree audit for a specific student
 * @route   GET /api/audit/:studentId
 * @access  Public (for now)
 */
export const getAuditReport = async (req, res) => {
  try {
    const { studentId } = req.params;
    const auditReport = await runDegreeAudit(studentId);
    res.status(200).json(auditReport);
  } catch (error) {
    // If the student isn't found, the service throws an error.
    res.status(404).json({ message: 'Failed to run audit.', error: error.message });
  }
};