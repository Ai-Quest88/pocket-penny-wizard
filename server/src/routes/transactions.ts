import { Router, Response } from 'express';
import { query } from '../db/pool.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// GET /api/transactions — List with joins
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { category_id, search, date_from, date_to, type, asset_account_id, liability_account_id, uncategorized } = req.query;

    let sql = `
      SELECT t.*,
        a.name as asset_account_name,
        l.name as liability_account_name,
        c.name as category_display_name
      FROM transactions t
      LEFT JOIN assets a ON t.asset_account_id = a.id
      LEFT JOIN liabilities l ON t.liability_account_id = l.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
    `;
    const params: any[] = [userId];
    let paramIdx = 1;

    if (category_id) {
      sql += ` AND t.category_id = $${++paramIdx}`;
      params.push(category_id);
    }
    if (uncategorized === 'true') {
      sql += ` AND t.category_id IS NULL`;
    }
    if (search) {
      sql += ` AND t.description ILIKE $${++paramIdx}`;
      params.push(`%${search}%`);
    }
    if (date_from) {
      sql += ` AND t.date >= $${++paramIdx}`;
      params.push(date_from);
    }
    if (date_to) {
      sql += ` AND t.date <= $${++paramIdx}`;
      params.push(date_to);
    }
    if (type) {
      sql += ` AND t.type = $${++paramIdx}`;
      params.push(type);
    }
    if (asset_account_id) {
      sql += ` AND t.asset_account_id = $${++paramIdx}`;
      params.push(asset_account_id);
    }
    if (liability_account_id) {
      sql += ` AND t.liability_account_id = $${++paramIdx}`;
      params.push(liability_account_id);
    }

    sql += ` ORDER BY t.date DESC, t.created_at DESC`;

    const result = await query(sql, params);
    return res.json(result.rows);
  } catch (err: any) {
    console.error('GET /transactions error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/transactions/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT t.*, a.name as asset_account_name, l.name as liability_account_name, c.name as category_display_name
       FROM transactions t
       LEFT JOIN assets a ON t.asset_account_id = a.id
       LEFT JOIN liabilities l ON t.liability_account_id = l.id
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = $1 AND t.user_id = $2`,
      [req.params.id, req.user!.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    return res.json(result.rows[0]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/transactions — Create single
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const body = { ...req.body, user_id: userId };

    const keys = Object.keys(body).filter(k => body[k] !== undefined);
    const values = keys.map(k => body[k]);
    const placeholders = keys.map((_, i) => `$${i + 1}`);

    const result = await query(
      `INSERT INTO transactions (${keys.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
      values
    );
    return res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error('POST /transactions error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/transactions/bulk — Bulk create
router.post('/bulk', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const items: any[] = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Expected array of items' });
    }

    const enriched = items.map(item => ({ ...item, user_id: userId }));
    const keys = Object.keys(enriched[0]);
    const allValues: any[] = [];
    const rowPlaceholders: string[] = [];

    enriched.forEach((item, rowIdx) => {
      const placeholders = keys.map((_, colIdx) => `$${rowIdx * keys.length + colIdx + 1}`);
      rowPlaceholders.push(`(${placeholders.join(', ')})`);
      keys.forEach(k => allValues.push(item[k] ?? null));
    });

    const result = await query(
      `INSERT INTO transactions (${keys.join(', ')}) VALUES ${rowPlaceholders.join(', ')} RETURNING *`,
      allValues
    );
    return res.status(201).json(result.rows);
  } catch (err: any) {
    console.error('POST /transactions/bulk error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/transactions/:id
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const body = { ...req.body };
    delete body.id; delete body.user_id; delete body.created_at;

    const keys = Object.keys(body).filter(k => body[k] !== undefined);
    const setClauses = keys.map((k, i) => `${k} = $${i + 1}`);
    const values = [...keys.map(k => body[k]), req.params.id, req.user!.id];

    const result = await query(
      `UPDATE transactions SET ${setClauses.join(', ')}, updated_at = NOW()
       WHERE id = $${keys.length + 1} AND user_id = $${keys.length + 2}
       RETURNING *`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    return res.json(result.rows[0]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user!.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    return res.json({ deleted: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
