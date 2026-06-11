import { supabaseAdmin } from '../supabase.js';

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid token' });
    
    // Find admin by user_id OR email (for initial linking)
    const { data: admin } = await supabaseAdmin
      .from('admins')
      .select('*')
      .or(`user_id.eq.${user.id},email.eq.${user.email}`)
      .single();

    req.user = user;
    req.admin = admin; // Might be null if not invited yet
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Auth error' });
  }
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (!req.admin || req.admin.status !== 'active') {
      return res.status(403).json({ error: 'Active admin access required' });
    }
    next();
  });
}

export function requireSuperAdmin(req, res, next) {
  requireAdmin(req, res, () => {
    if (req.admin?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super admin access required' });
    }
    next();
  });
}
