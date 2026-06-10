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
    const { data: admin } = await supabaseAdmin
      .from('admins').select('*').eq('user_id', user.id).single();
    if (!admin) return res.status(403).json({ error: 'Not an authorized admin' });
    req.user = user;
    req.admin = admin;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Auth error' });
  }
}

export async function requireSuperAdmin(req, res, next) {
  await requireAuth(req, res, () => {
    if (req.admin?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super admin access required' });
    }
    next();
  });
}
