import { Router, Response } from 'express';
import { query } from '../db/pool.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// POST /api/rpc/:functionName — Execute database functions
router.post('/:functionName', async (req: AuthRequest, res: Response) => {
  try {
    const { functionName } = req.params;
    const params = req.body;
    const userId = req.user!.id;

    switch (functionName) {
      case 'create_default_categories_for_user': {
        const result = await query('SELECT create_default_categories_for_user($1::uuid)', [
          params.p_user_id || userId,
        ]);
        return res.json(result.rows[0] || { success: true });
      }

      case 'find_learned_pattern': {
        // Frontend (LearnedPatternMatcher) expects: array of {pattern_id, category_name, category_id, confidence}
        // Normalize the search description same way patterns are stored
        const searchDesc = (params.p_description || '')
          .toLowerCase()
          .replace(/[0-9]+/g, '')
          .replace(/[^\w\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        // Match if either contains the other, or first word (merchant name) matches
        const result = await query(
          `SELECT id as pattern_id, pattern, category_id, category_name, match_count,
                  LEAST(0.85 + (match_count * 0.02), 0.98) as confidence
           FROM learned_patterns
           WHERE user_id = $1 
             AND (
               $2 ILIKE '%' || pattern || '%'
               OR pattern ILIKE '%' || $2 || '%'
               OR split_part(pattern, ' ', 1) = split_part($2, ' ', 1)
             )
           ORDER BY match_count DESC LIMIT 1`,
          [userId, searchDesc]
        );
        // Always return array for Supabase RPC compatibility
        return res.json(result.rows);
      }

      case 'save_learned_pattern': {
        // Accept both p_pattern and p_description for compatibility
        const pattern = params.p_pattern || params.p_description || '';
        // Normalize the pattern
        const normalized = pattern
          .toLowerCase()
          .replace(/[0-9]+/g, '')
          .replace(/[^\w\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (!normalized || normalized.length < 3) {
          return res.json(null);
        }

        const result = await query(
          `INSERT INTO learned_patterns (user_id, pattern, category_id, category_name, match_count, last_matched_at)
           VALUES ($1, $2, $3, $4, 1, NOW())
           ON CONFLICT (user_id, pattern) DO UPDATE SET
             category_id = EXCLUDED.category_id,
             category_name = EXCLUDED.category_name,
             match_count = learned_patterns.match_count + 1,
             last_matched_at = NOW()
           RETURNING id`,
          [userId, normalized, params.p_category_id || null, params.p_category_name]
        );
        // Return the ID as a string for compatibility
        return res.json(result.rows[0]?.id || null);
      }

      default:
        return res.status(404).json({ error: `Unknown function: ${functionName}` });
    }
  } catch (err: any) {
    console.error('RPC error:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
