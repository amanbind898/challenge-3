import  express from 'express';
import { createServer } from 'http';
import  cors from 'cors';
import  dotenv from 'dotenv';
import { connectDB, closeDB } from './db';
import { WebSocketService } from './websocket';
import { ruleEngine } from './ruleEngine.js';
import rulesRouter from './routes/rules';
// Add this import at the top
import decisionLogsRouter from './routes/decision-logs';





dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/rules', rulesRouter);
app.use('/api/decision-logs', decisionLogsRouter);

// Initialize services
async function startServer() {
  try {
    // Connect to database
    await connectDB();
    
    // Initialize rule engine
    await ruleEngine.loadRules();
    await ruleEngine.watchRuleChanges();
    
    // Initialize WebSocket service
    const wsService = new WebSocketService(server);
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}/ws`);
      console.log(`🔗 API endpoint: http://localhost:${PORT}/api`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
