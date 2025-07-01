import { MongoClient, Db, Collection } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB || 'fraud_detection';

let client: MongoClient;
export let db: Db;

export const connectDB = async (): Promise<void> => {
  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export const getDB = (): Db => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};

export const closeDB = async (): Promise<void> => {
  if (client) {
    await client.close();
  }
};


export const getRulesCollection = () => getDB().collection('rules');

export const getTransactionsCollection = () => getDB().collection('transactions');
export const getDecisionLogsCollection = () => getDB().collection('decision_logs');
