import { Router, Response } from 'express';
import { query } from '../db/pool.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

interface CrudOptions {
  table: string;
  userScoped?: boolean; // Filter by user_id (default true)
  allowedColumns?: string[]; // Columns allowed in insert/update
  defaultSelect?: string; // Default SELECT columns
  joins?: string; // JOIN clause for select
  orderBy?: string; // Default ORDER BY
}

export function createCrudRouter(options: CrudOptions): Router {
  const {
    table,
    userScoped = true,
    defaultSelect = '*',
    joins = '',
    orderBy = 'created_at DESC',
  } = options;

  const router = Router();
  router.use(authMiddleware);

  // GET / — List all
  router.get('/', async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const where = userScoped ? `WHERE ${table}.user_id = $1` : '';
      const params = userScoped ? [userId] : [];

      // Support query params for filtering
      const filters: string[] = [];
      let paramIdx = params.length;

      for (const [key, value] of Object.entries(req.query)) {
        if (key.startsWith('filter_') && value) {
          const col = key.replace('filter_', '');
          paramIdx++;
          filters.push(`${table}.${col} = $${paramIdx}`);
          params.push(value as string);
        }
      }

      const filterClause = filters.length
        ? (where ? ' AND ' : 'WHERE ') + filters.join(' AND ')
        : '';

      const sql = `SELECT ${defaultSelect} FROM ${table} ${joins} ${where}${filterClause} ORDER BY ${table}.${orderBy}`;
      const result = await query(sql, params);
      return res.json(result.rows);
    } catch (err: any) {
      console.error(`GET /${table} error:`, err);
      return res.status(500).json({ error: err.message });
    }
  });

  // GET /:id — Get one
  router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const where = userScoped
        ? `WHERE ${table}.id = $1 AND ${table}.user_id = $2`
        : `WHERE ${table}.id = $1`;
      const params = userScoped ? [req.params.id, userId] : [req.params.id];

      const result = await query(
        `SELECT ${defaultSelect} FROM ${table} ${joins} ${where}`,
        params
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Not found' });
      }
      return res.json(result.rows[0]);
    } catch (err: any) {
      console.error(`GET /${table}/:id error:`, err);
      return res.status(500).json({ error: err.message });
    }
  });

  // POST / — Create
  router.post('/', async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const body = { ...req.body };

      if (userScoped) {
        body.user_id = userId;
      }

      const keys = Object.keys(body).filter(k => body[k] !== undefined);
      const values = keys.map(k => body[k]);
      const placeholders = keys.map((_, i) => `$${i + 1}`);

      const sql = `INSERT INTO ${table} (${keys.join(', ')})
                    VALUES (${placeholders.join(', ')})
                    RETURNING *`;

      const result = await query(sql, values);
      return res.status(201).json(result.rows[0]);
    } catch (err: any) {
      console.error(`POST /${table} error:`, err);
      return res.status(500).json({ error: err.message });
    }
  });

  // POST /bulk — Bulk create
  router.post('/bulk', async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const items: any[] = req.body;

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Expected array of items' });
      }

      // Add user_id to each item
      const enriched = items.map(item => ({
        ...item,
        ...(userScoped ? { user_id: userId } : {}),
      }));

      const keys = Object.keys(enriched[0]);
      const allValues: any[] = [];
      const rowPlaceholders: string[] = [];

      enriched.forEach((item, rowIdx) => {
        const placeholders = keys.map((_, colIdx) => `$${rowIdx * keys.length + colIdx + 1}`);
        rowPlaceholders.push(`(${placeholders.join(', ')})`);
        keys.forEach(k => allValues.push(item[k]));
      });

      const sql = `INSERT INTO ${table} (${keys.join(', ')})
                    VALUES ${rowPlaceholders.join(', ')}
                    RETURNING *`;

      const result = await query(sql, allValues);
      return res.status(201).json(result.rows);
    } catch (err: any) {
      console.error(`POST /${table}/bulk error:`, err);
      return res.status(500).json({ error: err.message });
    }
  });

  // PATCH /:id — Update
  router.patch('/:id', async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const body = { ...req.body };
      delete body.id;
      delete body.user_id;
      delete body.created_at;

      const keys = Object.keys(body).filter(k => body[k] !== undefined);
      if (keys.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const setClauses = keys.map((k, i) => `${k} = $${i + 1}`);
      const values = keys.map(k => body[k]);

      let paramIdx = values.length;
      const whereParts = [`id = $${++paramIdx}`];
      values.push(req.params.id);

      if (userScoped) {
        whereParts.push(`user_id = $${++paramIdx}`);
        values.push(userId);
      }

      const sql = `UPDATE ${table}
                    SET ${setClauses.join(', ')}, updated_at = NOW()
                    WHERE ${whereParts.join(' AND ')}
                    RETURNING *`;

      const result = await query(sql, values);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Not found' });
      }
      return res.json(result.rows[0]);
    } catch (err: any) {
      console.error(`PATCH /${table}/:id error:`, err);
      return res.status(500).json({ error: err.message });
    }
  });

  // DELETE /:id — Delete
  router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const where = userScoped
        ? 'WHERE id = $1 AND user_id = $2'
        : 'WHERE id = $1';
      const params = userScoped ? [req.params.id, userId] : [req.params.id];

      const result = await query(`DELETE FROM ${table} ${where} RETURNING id`, params);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Not found' });
      }
      return res.json({ deleted: true, id: result.rows[0].id });
    } catch (err: any) {
      console.error(`DELETE /${table}/:id error:`, err);
      return res.status(500).json({ error: err.message });
    }
  });

  return router;
}
