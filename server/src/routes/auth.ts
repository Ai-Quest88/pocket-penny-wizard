import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/pool.js';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists
    const existing = await query('SELECT id FROM auth_users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO auth_users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name, created_at`,
      [email, passwordHash, full_name || null]
    );

    const user = result.rows[0];

    // Create user_profile
    await query(
      `INSERT INTO user_profiles (id, email, full_name, currency_preference)
       VALUES ($1, $2, $3, 'AUD')
       ON CONFLICT (id) DO NOTHING`,
      [user.id, email, full_name || null]
    );

    const token = generateToken({ id: user.id, email: user.email });

    return res.status(201).json({
      user: { id: user.id, email: user.email, full_name: user.full_name },
      access_token: token,
    });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await query(
      'SELECT id, email, password_hash, full_name FROM auth_users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken({ id: user.id, email: user.email });

    return res.json({
      user: { id: user.id, email: user.email, full_name: user.full_name },
      access_token: token,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/session
router.get('/session', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT id, email, full_name, created_at FROM auth_users WHERE id = $1',
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: result.rows[0] });
  } catch (err: any) {
    console.error('Session error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/refresh
router.post('/refresh', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const token = generateToken({ id: req.user!.id, email: req.user!.email });
    return res.json({ access_token: token });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
