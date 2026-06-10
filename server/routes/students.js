import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const { school_id, level } = req.query;
  let q = supabaseAdmin.from('students')
    .select(`*, school:schools(id, name, location, type, curriculum), results(year, term, subjects)`)
    .order('last_name');
  if (school_id) q = q.eq('school_id', school_id);
  if (level) q = q.eq('level', level);
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('students')
    .select(`*, school:schools(id, name, location, type, curriculum), results(*)`)
    .eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Student not found' });
  res.json(data);
});

router.post('/', requireAuth, async (req, res) => {
  const { first_name, last_name, school_id, level, class_name, ref_no, dob, gender, parent_name, parent_phone, sponsorship_date, photo_url, notes } = req.body;
  if (!first_name || !last_name || !school_id || !level) {
    return res.status(400).json({ error: 'first_name, last_name, school_id, level required' });
  }
  const { data, error } = await supabaseAdmin
    .from('students').insert([{ first_name, last_name, school_id, level, class_name, ref_no, dob, gender, parent_name, parent_phone, sponsorship_date, photo_url, notes }])
    .select(`*, school:schools(id,name)`).single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/:id', requireAuth, async (req, res) => {
  const fields = ['first_name','last_name','school_id','level','class_name','ref_no','dob','gender','parent_name','parent_phone','sponsorship_date','photo_url','notes'];
  const update = {};
  fields.forEach(f => { if (req.body[f] !== undefined) update[f] = req.body[f]; });
  const { data, error } = await supabaseAdmin
    .from('students').update(update).eq('id', req.params.id)
    .select(`*, school:schools(id,name)`).single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', requireAuth, async (req, res) => {
  await supabaseAdmin.from('results').delete().eq('student_id', req.params.id);
  const { error } = await supabaseAdmin.from('students').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

export default router;
