import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('schools').select('*').order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', requireAdmin, async (req, res) => {
  const { name, location, type, curriculum, contact_name, contact_phone } = req.body;
  if (!name || !location) return res.status(400).json({ error: 'Name and location required' });
  const { data, error } = await supabaseAdmin
    .from('schools').insert([{ name, location, type, curriculum, contact_name, contact_phone }]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/:id', requireAdmin, async (req, res) => {
  const { name, location, type, curriculum, contact_name, contact_phone } = req.body;
  const { data, error } = await supabaseAdmin
    .from('schools').update({ name, location, type, curriculum, contact_name, contact_phone })
    .eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', requireEditor, async (req, res) => {
  const { error } = await supabaseAdmin.from('schools').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

export default router;
