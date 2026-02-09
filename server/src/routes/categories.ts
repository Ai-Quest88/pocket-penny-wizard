import { Router, Response } from 'express';
import { query, withTransaction } from '../db/pool.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// GET /api/categories — With groups and hierarchy
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { filter_name, filter_user_id } = req.query;

    let sql = `SELECT c.*, cb.name as bucket_name, cb.group_id,
              cg.name as group_name, cg.category_type as group_type, cg.color as group_color
       FROM categories c
       LEFT JOIN category_buckets cb ON c.bucket_id = cb.id
       LEFT JOIN category_groups cg ON cb.group_id = cg.id
       WHERE (c.user_id = $1 OR c.is_system = true)`;
    const params: any[] = [userId];

    if (filter_name) {
      params.push(filter_name);
      sql += ` AND c.name = $${params.length}`;
    }

    sql += ` ORDER BY cg.sort_order, cb.sort_order, c.sort_order, c.name`;

    const result = await query(sql, params);
    return res.json(result.rows);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/categories/groups — Category groups
router.get('/groups', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const result = await query(
      `SELECT * FROM category_groups
       WHERE user_id = $1 OR is_system = true
       ORDER BY sort_order, name`,
      [userId]
    );
    return res.json(result.rows);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/categories/with-relations — Full hierarchy
router.get('/with-relations', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const groups = await query(
      `SELECT * FROM category_groups WHERE user_id = $1 OR is_system = true ORDER BY sort_order`,
      [userId]
    );

    const buckets = await query(
      `SELECT * FROM category_buckets WHERE user_id = $1 ORDER BY sort_order`,
      [userId]
    );

    const categories = await query(
      `SELECT c.*, cb.group_id FROM categories c
       LEFT JOIN category_buckets cb ON c.bucket_id = cb.id
       WHERE c.user_id = $1 OR c.is_system = true ORDER BY c.sort_order, c.name`,
      [userId]
    );

    // Build nested structure: groups -> buckets -> categories
    const grouped = groups.rows.map((g: any) => ({
      ...g,
      buckets: buckets.rows
        .filter((b: any) => b.group_id === g.id)
        .map((b: any) => ({
          ...b,
          categories: categories.rows.filter((c: any) => c.bucket_id === b.id),
        })),
      categories: categories.rows.filter((c: any) => c.group_id === g.id),
    }));

    // Include ungrouped categories
    const ungroupedCats = categories.rows.filter(
      (c: any) => !c.group_id || !groups.rows.find((g: any) => g.id === c.group_id)
    );

    return res.json({ groups: grouped, ungrouped: ungroupedCats });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/categories — Create category
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const body = { ...req.body, user_id: req.user!.id };
    const keys = Object.keys(body).filter(k => body[k] !== undefined);
    const values = keys.map(k => body[k]);
    const placeholders = keys.map((_, i) => `$${i + 1}`);

    const result = await query(
      `INSERT INTO categories (${keys.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
      values
    );
    return res.status(201).json(result.rows[0]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/categories/groups — Create group
router.post('/groups', async (req: AuthRequest, res: Response) => {
  try {
    const body = { ...req.body, user_id: req.user!.id };
    const keys = Object.keys(body).filter(k => body[k] !== undefined);
    const values = keys.map(k => body[k]);
    const placeholders = keys.map((_, i) => `$${i + 1}`);

    const result = await query(
      `INSERT INTO category_groups (${keys.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
      values
    );
    return res.status(201).json(result.rows[0]);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/categories/create-defaults — Create default categories for user
router.post('/create-defaults', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await query('SELECT create_default_categories_for_user($1)', [userId]);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/categories/:id
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const body = { ...req.body };
    delete body.id; delete body.user_id; delete body.created_at;

    const keys = Object.keys(body).filter(k => body[k] !== undefined);
    const setClauses = keys.map((k, i) => `${k} = $${i + 1}`);
    const values = [...keys.map(k => body[k]), req.params.id, req.user!.id];

    const result = await query(
      `UPDATE categories SET ${setClauses.join(', ')}, updated_at = NOW()
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

// DELETE /api/categories/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user!.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    return res.json({ deleted: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
