import { Router, Response } from 'express';
import { query } from '../db/pool.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// GET /api/user-profiles — List (scoped to user)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    // Support filter_user_id or filter_id from query builder
    const filterUserId = req.query.filter_user_id || req.query.filter_id || userId;

    const result = await query(
      'SELECT * FROM user_profiles WHERE id = $1',
      [filterUserId]
    );
    return res.json(result.rows);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/user-profiles/me
router.get('/me', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM user_profiles WHERE id = $1',
      [req.user!.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Profile not found' });
    return res.json(result.rows[0]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/user-profiles — Upsert
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const body = { ...req.body };

    // Ensure id is set to user's id (user_profiles.id = auth_users.id)
    const profileId = body.user_id || body.id || userId;
    delete body.user_id;
    delete body.id;

    const keys = Object.keys(body).filter(k => body[k] !== undefined);
    const values = keys.map(k => body[k]);

    // Upsert: insert or update
    const setClauses = keys.map((k, i) => `${k} = $${i + 2}`);
    const insertCols = ['id', ...keys];
    const insertVals = [profileId, ...values];
    const placeholders = insertVals.map((_, i) => `$${i + 1}`);

    const result = await query(
      `INSERT INTO user_profiles (${insertCols.join(', ')})
       VALUES (${placeholders.join(', ')})
       ON CONFLICT (id) DO UPDATE SET ${setClauses.length > 0 ? setClauses.join(', ') : 'id = EXCLUDED.id'}
       RETURNING *`,
      insertVals
    );
    return res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error('POST /user-profiles error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/user-profiles/me
router.patch('/me', async (req: AuthRequest, res: Response) => {
  try {
    const body = { ...req.body };
    delete body.id; delete body.created_at;

    const keys = Object.keys(body).filter(k => body[k] !== undefined);
    if (keys.length === 0) return res.status(400).json({ error: 'No fields to update' });

    const setClauses = keys.map((k, i) => `${k} = $${i + 1}`);
    const values = [...keys.map(k => body[k]), req.user!.id];

    const result = await query(
      `INSERT INTO user_profiles (id, ${keys.join(', ')})
       VALUES ($${keys.length + 1}, ${keys.map((_, i) => `$${i + 1}`).join(', ')})
       ON CONFLICT (id) DO UPDATE SET ${setClauses.join(', ')}
       RETURNING *`,
      values
    );
    return res.json(result.rows[0]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
