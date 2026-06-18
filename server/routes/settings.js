import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js';

const router = Router();

// Get global settings (Public)
router.get('/', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('settings').select('*').eq('id', 1).single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Update global settings (Super Admin only)
router.put('/', requireSuperAdmin, async (req, res) => {
  const { org_name, logo_url, current_year, current_term } = req.body;
  const update = {};
  if (org_name !== undefined) update.org_name = org_name;
  if (logo_url !== undefined) update.logo_url = logo_url;
  if (current_year !== undefined) update.current_year = current_year;
  if (current_term !== undefined) update.current_term = current_term;
  update.updated_at = new Date();

  const { data, error } = await supabaseAdmin
    .from('settings')
    .update(update)
    .eq('id', 1)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
