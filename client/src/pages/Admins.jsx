import { useState, useEffect } from 'react';
import { Send, Trash2, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { ConfirmDialog } from '../components/ConfirmDialog';

export default function Admins() {
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState({ name:'', email:'', role:'admin' });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [delId, setDelId] = useState(null);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  useEffect(() => {
    api.getAdmins().then(setAdmins).catch(()=>toast.error('Failed to load admins')).finally(()=>setLoading(false));
  }, []);

  async function invite(e) {
    e.preventDefault();
    if (!form.name||!form.email) { toast.error('Name and email required'); return; }
    setSending(true);
    try {
      const a = await api.inviteAdmin(form);
      setAdmins(prev=>[...prev, a]);
      setForm({name:'',email:'',role:'admin'});
      toast.success(`Invite sent to ${form.name}`);
    } catch (err) { toast.error(err.message); }
    finally { setSending(false); }
  }

  async function removeAdmin() {
    try {
      await api.deleteAdmin(delId);
      setAdmins(a=>a.filter(x=>x.id!==delId));
      toast.success('Admin removed');
    } catch (err) { toast.error(err.message); }
  }

  async function approve(id, name) {
    try {
      await api.approveAdmin(id);
      setAdmins(a => a.map(x => x.id === id ? { ...x, status: 'active' } : x));
      toast.success(`Approved ${name}. Invite email sent.`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (loading) return <div className="loading-page"><div className="spinner"/></div>;

  return (
    <div className="grid-2">
      <div className="card">
        <div className="section-header mb-20">
          <div><div className="section-title">Invite Admin</div><div className="section-sub text-muted">They sign in with Google after receiving the invite</div></div>
        </div>
        <form onSubmit={invite}>
          <div className="form-group"><label className="form-label">Full Name *</label>
            <input className="form-input" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Jane Kamau" required/>
          </div>
          <div className="form-group"><label className="form-label">Email Address *</label>
            <input className="form-input" type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="jane@actionsnotwords.org" required/>
          </div>
          <div className="form-group"><label className="form-label">Role</label>
            <select className="form-select" value={form.role} onChange={e=>set('role',e.target.value)}>
              <option value="admin">Admin (full access)</option>
              <option value="viewer">Viewer (read-only)</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={sending}>
            <Send size={13}/>{sending?'Sending…':'Send Invite'}
          </button>
        </form>
        <div className="alert alert-info mt-16">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Invited admins receive an email and must sign in with their Google account. Requires Supabase to be configured.
        </div>
      </div>

      <div className="card">
        <div className="section-header mb-16">
          <div><div className="section-title">Admin Team</div><div className="section-sub text-muted">{admins.length} member{admins.length!==1?'s':''}</div></div>
        </div>
        {admins.length===0 ? (
          <div className="empty-state" style={{padding:'32px 16px'}}>
            <UserPlus strokeWidth={1.2} size={36} style={{margin:'0 auto 12px',display:'block',stroke:'var(--g2)'}}/>
            <p>No admins invited yet</p>
          </div>
        ) : (
          admins.map(a => (
            <div key={a.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid var(--g1)'}}>
              <div className="avatar" style={{width:34,height:34,fontSize:12}}>
                {(a.name||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
              </div>
              <div style={{flex:1}}>
                <div className="text-bold text-sm">{a.name}</div>
                <div className="text-xs text-muted">{a.email} · {a.role}</div>
              </div>
              <span className={`badge ${a.status==='active'?'badge-green':a.status==='pending'?'badge-amber':'badge-gray'}`}>
                {a.status||'pending'}
              </span>
              {a.status === 'pending' && (
                <button className="btn btn-secondary btn-sm" onClick={() => approve(a.id, a.name)}>Approve</button>
              )}
              <button className="btn btn-danger btn-sm" onClick={()=>setDelId(a.id)}><Trash2 size={12}/></button>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog open={!!delId} onClose={()=>setDelId(null)} onConfirm={removeAdmin}
        title="Remove Admin" message="Remove this admin? They will lose access immediately." danger/>
    </div>
  );
}
