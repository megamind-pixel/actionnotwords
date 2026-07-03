import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', requireSuperAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('admins').select('*').order('created_at');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get current admin info
router.get('/me', requireAuth, async (req, res) => {
  res.json(req.admin || null);
});

// Request access (public)
router.post('/request', async (req, res) => {
  const { email, name } = req.body;
  if (!email || !name) return res.status(400).json({ error: 'Email and name required' });
  
  const { data: existing } = await supabaseAdmin.from('admins').select('id').eq('email', email).single();
  if (existing) return res.status(400).json({ error: 'Request already submitted or user exists' });

  const { data, error } = await supabaseAdmin
    .from('admins').insert([{ email, name, role: 'viewer', status: 'pending' }]).select().single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// Invite: create pending admin record, send magic link via Supabase
router.post('/invite', requireSuperAdmin, async (req, res) => {
  const { email, name, role = 'admin' } = req.body;
  if (!email || !name) return res.status(400).json({ error: 'email and name required' });
  
  // Check not already invited
  const { data: existing } = await supabaseAdmin.from('admins').select('id').eq('email', email).single();
  if (existing) return res.status(400).json({ error: 'Already invited' });

  // Create pending admin record
  const { data: admin, error: adminError } = await supabaseAdmin
    .from('admins').insert([{ email, name, role, status: 'pending' }]).select().single();
  if (adminError) return res.status(500).json({ error: adminError.message });

  // Send invite email via Supabase Auth (magic link / invite)
  const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.FRONTEND_ORIGIN}/auth/callback`
  });
  if (inviteError) {
    // Don't fail — admin record created, email may need manual send
    console.warn('Invite email error:', inviteError.message);
  }

  res.status(201).json({ ...admin, invite_sent: !inviteError });
});

router.delete('/:id', requireSuperAdmin, async (req, res) => {
  const { data: admin } = await supabaseAdmin.from('admins').select('user_id').eq('id', req.params.id).single();
  if (admin?.user_id) {
    await supabaseAdmin.auth.admin.deleteUser(admin.user_id).catch(() => {});
  }
  const { error } = await supabaseAdmin.from('admins').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

router.post('/:id/approve', requireSuperAdmin, async (req, res) => {
  const { data: admin, error: fetchErr } = await supabaseAdmin.from('admins').select('*').eq('id', req.params.id).single();
  if (fetchErr || !admin) return res.status(404).json({ error: 'Admin not found' });
  
  const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(admin.email, {
    redirectTo: `${process.env.FRONTEND_ORIGIN}/auth/callback`
  });
  
  if (inviteError) return res.status(500).json({ error: inviteError.message });
  res.json({ success: true, invite_sent: true });
});

// Called after Google OAuth — link user_id to admin record
router.post('/link', requireAuth, async (req, res) => {
  // Find the single pending/active admin record for this email
  const { data: admin, error: fetchErr } = await supabaseAdmin
    .from('admins')
    .select('id, status')
    .eq('email', req.user.email)
    .single();

  if (fetchErr || !admin) {
    // No admin record found — user is not invited
    return res.status(403).json({ error: 'No admin record found for this email. Contact your Super Admin.' });
  }

  // Only update by the specific ID to avoid touching other rows
  const { error } = await supabaseAdmin
    .from('admins')
    .update({ user_id: req.user.id, status: 'active' })
    .eq('id', admin.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

export default router;
