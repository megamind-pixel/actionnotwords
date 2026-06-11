import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAdmin, async (req, res) => {
  const { student_id, year, term } = req.query;
  let q = supabaseAdmin.from('results')
    .select(`*, student:students(id, first_name, last_name, level, ref_no, school:schools(name))`)
    .order('year', { ascending: false }).order('term', { ascending: false });
  if (student_id) q = q.eq('student_id', student_id);
  if (year) q = q.eq('year', year);
  if (term) q = q.eq('term', term);
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', requireAdmin, async (req, res) => {
  const { student_id, year, term, exam_type, subjects, position, class_size, remarks } = req.body;
  if (!student_id || !year || !term || !subjects) {
    return res.status(400).json({ error: 'student_id, year, term, subjects required' });
  }
  // Upsert — one record per student/year/term
  const { data, error } = await supabaseAdmin
    .from('results')
    .upsert([{ student_id, year, term, exam_type, subjects, position, class_size, remarks }],
      { onConflict: 'student_id,year,term' })
    .select(`*, student:students(id, first_name, last_name, level, ref_no, school:schools(name))`).single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/:id', requireAdmin, async (req, res) => {
  const { subjects, position, class_size, remarks, exam_type } = req.body;
  const { data, error } = await supabaseAdmin
    .from('results').update({ subjects, position, class_size, remarks, exam_type })
    .eq('id', req.params.id)
    .select(`*, student:students(id, first_name, last_name, level, ref_no)`).single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', requireEditor, async (req, res) => {
  const { error } = await supabaseAdmin.from('results').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

export default router;
