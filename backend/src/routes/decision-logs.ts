import { Router } from 'express';
import { getDecisionLogsCollection } from '../db.js';

const router = Router();

// GET /api/decision-logs?page=1&tx=prefix
router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page as string, 10) || 1, 1);
    const txPrefix = (req.query.tx as string || '').trim();
    const pageSize = 20;
    
    const decisionLogsCollection = getDecisionLogsCollection();
    
    // Build filter based on transaction ID prefix
    const filter = txPrefix
      ? { transactionId: { $regex: `^${txPrefix}`, $options: 'i' } }
      : {};

    // Get paginated results
    const entries = await decisionLogsCollection
      .find(filter)
      .sort({ timestamp: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();

    // Check if there are more results
    const totalCount = await decisionLogsCollection.countDocuments(filter);
    const hasMore = page * pageSize < totalCount;

    res.json({ entries, hasMore, total: totalCount });
  } catch (error) {
    console.error('Error fetching decision logs:', error);
    res.status(500).json({ error: 'Failed to fetch decision logs' });
  }
});

export default router;
