import { Engine, Rule } from 'json-rules-engine';
import { getRulesCollection, getDecisionLogsCollection } from './db.js';
import { v4 as uuidv4 } from 'uuid';

export interface FraudRule {
  _id?: string;
  id: string;
  name: string;
  description: string;
  active: boolean;
  conditions: any;
  event: {
    type: string;
    params: {
      message: string;
      severity: 'low' | 'medium' | 'high';
      rule_id: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  merchantId: string;
  merchantCategory: string;
  location: {
    state: string;
    city: string;
  };
  timestamp: Date;
  paymentMethod: string;
  ipAddress: string;
  deviceFingerprint: string;
}

class RuleEngineService {
  private engine: Engine;
  private rulesCache: FraudRule[] = [];

  constructor() {
    this.engine = new Engine();
    this.setupCustomOperators();
  }

  private setupCustomOperators() {
    // Custom operator for time-based rules
    this.engine.addOperator('isBusinessHours', (factValue: Date, jsonValue: boolean) => {
      const hour = factValue.getHours();
      const isBusinessHours = hour >= 9 && hour <= 17;
      return jsonValue ? isBusinessHours : !isBusinessHours;
    });

    // Custom operator for location-based rules
    this.engine.addOperator('isHighRiskstate', (factValue: string, jsonValue: boolean) => {
      const highRiskCountries = ['Pakistan', 'Bangladesh']; //this is ex. counrty
      const isHighRisk = highRiskCountries.includes(factValue);
      return jsonValue ? isHighRisk : !isHighRisk;
    });

    // Custom operator for amount thresholds
    this.engine.addOperator('exceedsThreshold', (factValue: number, jsonValue: number) => {
      return factValue > jsonValue;
    });
  }

  async loadRules(): Promise<void> {
    try {
      const rulesCollection = getRulesCollection();
      const docs = await rulesCollection.find({ active: true }).toArray();
      this.rulesCache = docs.map(doc => ({
        _id: doc._id?.toString(),
        id: doc.id,
        name: doc.name,
        description: doc.description,
        active: doc.active,
        conditions: doc.conditions,
        event: doc.event,
        createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
        updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date()
      })) as FraudRule[];
      
      // Clear existing rules and add fresh ones
      this.engine = new Engine();
      this.setupCustomOperators();
      
      this.rulesCache.forEach(rule => {
        const engineRule = new Rule({
          conditions: rule.conditions,
          event: rule.event
        });
        this.engine.addRule(engineRule);
      });

      console.log(`Loaded ${this.rulesCache.length} active rules`);
    } catch (error) {
      console.error('Error loading rules:', error);
    }
  }

  async watchRuleChanges(): Promise<void> {
    try {
      const rulesCollection = getRulesCollection();
      const changeStream = rulesCollection.watch();
      
      changeStream.on('change', async (change) => {
        console.log('Rule change detected:', change.operationType);
        await this.loadRules();
      });

      console.log('Watching for rule changes...');
    } catch (error) {
      console.error('Error setting up rule change watcher:', error);
    }
  }

  async applyRulesToTransaction(transaction: Transaction): Promise<any> {
    try {
      const facts = {
        amount: transaction.amount,
        state: transaction.location.state,
        merchantCategory: transaction.merchantCategory,
        timestamp: transaction.timestamp,
        userId: transaction.userId,
        paymentMethod: transaction.paymentMethod
      };

      const { events } = await this.engine.run(facts);
      
      const result = {
        transactionId: transaction.id,
        timestamp: new Date(),
        facts,
        matchedRules: events.map(event => ({
          ruleId: event.params.rule_id,
          type: event.type,
          message: event.params.message,
          severity: event.params.severity
        })),
        isFraudulent: events.length > 0,
        riskScore: this.calculateRiskScore(events)
      };

      // Store decision log
      await this.storeDecisionLog(result);
      
      return result;
    } catch (error) {
      console.error('Error applying rules to transaction:', error);
      return {
        transactionId: transaction.id,
        timestamp: new Date(),
        matchedRules: [],
        isFraudulent: false,
        riskScore: 0,
        error: error.message
      };
    }
  }

  private calculateRiskScore(events: any[]): number {
    let score = 0;
    events.forEach(event => {
      switch (event.params.severity) {
        case 'high': score += 30; break;
        case 'medium': score += 20; break;
        case 'low': score += 10; break;
      }
    });
    return Math.min(score, 100);
  }

  private async storeDecisionLog(decision: any): Promise<void> {
    try {
      const decisionLogsCollection = getDecisionLogsCollection();
      await decisionLogsCollection.insertOne(decision);
    } catch (error) {
      console.error('Error storing decision log:', error);
    }
  }
}

export const ruleEngine = new RuleEngineService();
