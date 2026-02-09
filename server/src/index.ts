import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import categoryRoutes from './routes/categories.js';
import userProfileRoutes from './routes/user-profiles.js';
import aiRoutes from './routes/ai.js';
import rpcRoutes from './routes/rpc.js';
import { createCrudRouter } from './routes/crud.js';
import pool from './db/pool.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001');

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/user-profiles', userProfileRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/rpc', rpcRoutes);

// Generic CRUD routes for simpler tables
app.use('/api/entities', createCrudRouter({ table: 'entities', orderBy: 'created_at DESC' }));
app.use('/api/assets', createCrudRouter({
  table: 'assets',
  defaultSelect: 'assets.*, e.name as entity_name',
  joins: 'LEFT JOIN entities e ON assets.entity_id = e.id',
  orderBy: 'created_at DESC',
}));
app.use('/api/liabilities', createCrudRouter({
  table: 'liabilities',
  defaultSelect: 'liabilities.*, e.name as entity_name',
  joins: 'LEFT JOIN entities e ON liabilities.entity_id = e.id',
  orderBy: 'created_at DESC',
}));
app.use('/api/budgets', createCrudRouter({ table: 'budgets', orderBy: 'created_at DESC' }));
app.use('/api/households', createCrudRouter({ table: 'households', orderBy: 'created_at DESC' }));
app.use('/api/learned-patterns', createCrudRouter({ table: 'learned_patterns', orderBy: 'match_count DESC' }));
app.use('/api/user-financial-goals', createCrudRouter({ table: 'user_financial_goals', orderBy: 'created_at DESC' }));
app.use('/api/cfo-alerts', createCrudRouter({ table: 'cfo_alerts', orderBy: 'created_at DESC' }));
app.use('/api/user-category-corrections', createCrudRouter({ table: 'user_category_corrections', orderBy: 'created_at DESC' }));
app.use('/api/user-merchant-mappings', createCrudRouter({ table: 'user_merchant_mappings', orderBy: 'times_used DESC' }));
app.use('/api/system-keyword-rules', createCrudRouter({ table: 'system_keyword_rules', userScoped: false, orderBy: 'priority DESC' }));
app.use('/api/notifications', createCrudRouter({ table: 'notifications', orderBy: 'created_at DESC' }));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':***@')}`);
  console.log(`🔑 AI: ${process.env.GEMINI_API_KEY ? 'Gemini configured' : 'No AI key (using local fallbacks)'}`);
});

export default app;
