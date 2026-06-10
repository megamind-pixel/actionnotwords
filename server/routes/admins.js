import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', requireSuperAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('admins').select('*').order('created_at');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
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

// Called after Google OAuth — link user_id to admin record
router.post('/link', requireAuth, async (req, res) => {
  const { error } = await supabaseAdmin
    .from('admins').update({ user_id: req.user.id, status: 'active' })
    .eq('email', req.user.email);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

export default router;
