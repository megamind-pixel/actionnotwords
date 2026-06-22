import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { requireAdmin, requireEditor } from '../middleware/auth.js';

const router = Router();

// Helper: compute mean from subjects JSONB (fallback when mean_score not set)
function calcMeanFromSubjects(subjects) {
  if (!subjects) return null;
  const vals = Object.values(subjects).map(Number).filter(v => !isNaN(v) && v >= 0);
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
}

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

router.post('/', requireEditor, async (req, res) => {
  const { student_id, year, term, exam_type, subjects, mean_score, score_proof_url, position, class_size, remarks } = req.body;
  if (!student_id || !year || !term) {
    return res.status(400).json({ error: 'student_id, year, term required' });
  }
  // Require either mean_score or at least one subject mark
  const hasSubjects = subjects && Object.values(subjects).some(v => v !== '');
  if (mean_score == null && !hasSubjects) {
    return res.status(400).json({ error: 'Enter a mean score or at least one subject mark' });
  }

  // Auto-fill mean_score from subjects if not provided
  const resolvedMean = mean_score != null ? Number(mean_score) : calcMeanFromSubjects(subjects);

  const { data, error } = await supabaseAdmin
    .from('results')
    .upsert([{ 
      student_id, year, term, exam_type, 
      subjects: subjects || {}, 
      mean_score: resolvedMean, 
      score_proof_url: score_proof_url || null,
      position, class_size, remarks 
    }], { onConflict: 'student_id,year,term' })
    .select(`*, student:students(id, first_name, last_name, level, ref_no, school:schools(name))`).single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/:id', requireEditor, async (req, res) => {
  const { subjects, mean_score, score_proof_url, position, class_size, remarks, exam_type } = req.body;

  // Auto-fill mean_score from subjects if not provided
  const resolvedMean = mean_score != null ? Number(mean_score) : calcMeanFromSubjects(subjects);

  const { data, error } = await supabaseAdmin
    .from('results').update({ 
      subjects: subjects || {}, 
      mean_score: resolvedMean,
      score_proof_url: score_proof_url || null,
      position, class_size, remarks, exam_type 
    })
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
