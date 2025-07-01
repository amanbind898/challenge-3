import { Router } from 'express';
import { getRulesCollection } from '../db';

import { FraudRule } from '../ruleEngine';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all rules
router.get('/', async (req, res) => {
  try {
    const rulesCollection = getRulesCollection();
    const rules = await rulesCollection.find({}).sort({ createdAt: -1 }).toArray();
    res.json(rules);
  } catch (error) {
    console.error('Error fetching rules:', error);
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
});

// Get rule by ID
router.get('/:id', async (req, res) => {
  try {
    const rulesCollection = getRulesCollection();
    const rule = await rulesCollection.findOne({ id: req.params.id });
    
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    
    res.json(rule);
  } catch (error) {
    console.error('Error fetching rule:', error);
    res.status(500).json({ error: 'Failed to fetch rule' });
  }
});

// Create new rule
router.post('/', async (req, res) => {
  try {
    const { name, description, conditions, event } = req.body;
    
    if (!name || !conditions || !event) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const rule: Omit<FraudRule, '_id'> = {
      id: uuidv4(),
      name,
      description: description || '',
      active: true,
      conditions,
      event: {
        ...event,
        params: {
          ...event.params,
          rule_id: uuidv4()
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const rulesCollection = getRulesCollection();
    const result = await rulesCollection.insertOne(rule);

    res.status(201).json({ ...rule, _id: result.insertedId });
  } catch (error) {
    console.error('Error creating rule:', error);
    res.status(500).json({ error: 'Failed to create rule' });
  }
});

// Update rule
router.put('/:id', async (req, res) => {
  try {
    const { name, description, conditions, event, active } = req.body;
    
    const updateData: Partial<FraudRule> = {
      updatedAt: new Date()
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (conditions !== undefined) updateData.conditions = conditions;
    if (event !== undefined) updateData.event = event;
    if (active !== undefined) updateData.active = active;

    const rulesCollection = getRulesCollection();
    const result = await rulesCollection.updateOne(
      { id: req.params.id },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    const updatedRule = await rulesCollection.findOne({ id: req.params.id });
    res.json(updatedRule);
  } catch (error) {
    console.error('Error updating rule:', error);
    res.status(500).json({ error: 'Failed to update rule' });
  }
});

// Delete rule 
router.delete('/:id', async (req, res) => {
  try {
    const rulesCollection = getRulesCollection();
    const result = await rulesCollection.updateOne(
      { id: req.params.id },
      { $set: { active: false, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    res.json({ message: 'Rule deactivated successfully' });
  } catch (error) {
    console.error('Error deleting rule:', error);
    res.status(500).json({ error: 'Failed to delete rule' });
  }
});

// Toggle rule active status
router.patch('/:id/toggle', async (req, res) => {
  try {
    const rulesCollection = getRulesCollection();
    const rule = await rulesCollection.findOne({ id: req.params.id });
    
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    const result = await rulesCollection.updateOne(
      { id: req.params.id },
      { $set: { active: !rule.active, updatedAt: new Date() } }
    );

    const updatedRule = await rulesCollection.findOne({ id: req.params.id });
    res.json(updatedRule);
  } catch (error) {
    console.error('Error toggling rule:', error);
    res.status(500).json({ error: 'Failed to toggle rule' });
  }
});

export default router;
