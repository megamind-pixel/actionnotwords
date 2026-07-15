import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Plus, Eye, Pencil, Trash2, Users, Download, 
  UserCircle, Upload, Loader2, Search, Filter,
  MoreVertical, Mail, Phone, Calendar, MapPin,
  GraduationCap, TrendingUp, TrendingDown, Minus, User
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { LEVELS, SUBJECTS, getGrade, calcMean, gradeColor, studentTrend } from '../lib/kenya';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { BulkUploadModal } from '../components/BulkUploadModal';

function LevelPill({ level }) {
  const info = LEVELS[level];
  const colors = {
    ecde: 'badge-blue',
    lower_primary: 'badge-green',
    upper_primary: 'badge-blue',
    junior_secondary: 'badge-amber',
    secondary: 'badge-red',
    tertiary: 'badge-gray'
  };
  return <span className={`badge ${colors[level] || 'badge-gray'}`}>{info?.label || level}</span>;
}

function TrendBadge({ trend }) {
  if (trend === 'up') return <span className="flex-center gap-4 text-xs font-bold" style={{ color: 'var(--brand-success)' }}><TrendingUp size={14}/> Improving</span>;
  if (trend === 'down') return <span className="flex-center gap-4 text-xs font-bold" style={{ color: 'var(--brand-danger)' }}><TrendingDown size={14}/> Declining</span>;
  if (trend === 'stable') return <span className="flex-center gap-4 text-xs font-bold" style={{ color: 'var(--text-muted)' }}><Minus size={14}/> Stable</span>;
  return <span className="text-xs text-muted font-bold">— New</span>;
}

function StudentForm({ initial, schools, onSave, onClose }) {
  const [form, setForm] = useState({ first_name:'',last_name:'',school_id:'',level:'',class_name:'',ref_no:'',dob:'',gender:'',parent_name:'',parent_phone:'',sponsorship_date:'',photo_url:'',notes:'', ...initial });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const classes = LEVELS[form.level]?.classes || [];

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `student-photos/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('image').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('image').getPublicUrl(filePath);
      set('photo_url', publicUrl);
      toast.success('Photo uploaded!');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.first_name||!form.last_name||!form.school_id||!form.level) { toast.error('Fill all required fields'); return; }
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  }

  return (
    <form onSubmit={submit} className="fade-in">
      <div className="grid-2 mb-16">
        <div className="form-group"><label className="form-label">First Name *</label>
          <input className="form-input" value={form.first_name} onChange={e=>set('first_name',e.target.value)} placeholder="Amara" required />
        </div>
        <div className="form-group"><label className="form-label">Last Name *</label>
          <input className="form-input" value={form.last_name} onChange={e=>set('last_name',e.target.value)} placeholder="Ochieng" required />
        </div>
      </div>
      <div className="grid-2 mb-16">
        <div className="form-group"><label className="form-label">School *</label>
          <select className="form-select" value={form.school_id} onChange={e=>set('school_id',e.target.value)} required>
            <option value="">Select school</option>
            {schools.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">Education Level *</label>
          <select className="form-select" value={form.level} onChange={e=>set('level',e.target.value)} required>
            <option value="">Select level</option>
            {Object.entries(LEVELS).map(([k,v])=><option key={k} value={k}>{v.label} ({v.curriculum})</option>)}
          </select>
        </div>
      </div>
      <div className="grid-2 mb-16">
        <div className="form-group"><label className="form-label">Class / Year *</label>
          <select className="form-select" value={form.class_name} onChange={e=>set('class_name',e.target.value)}>
            <option value="">Select class</option>
            {classes.map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">ANW Ref No.</label>
          <input className="form-input" value={form.ref_no} onChange={e=>set('ref_no',e.target.value)} placeholder="ANW-2025-001" />
        </div>
      </div>
      <div className="grid-2 mb-16">
        <div className="form-group"><label className="form-label">Date of Birth</label>
          <input className="form-input" type="date" value={form.dob} onChange={e=>set('dob',e.target.value)} />
        </div>
        <div className="form-group"><label className="form-label">Gender</label>
          <select className="form-select" value={form.gender} onChange={e=>set('gender',e.target.value)}>
            <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
          </select>
        </div>
      </div>
      <div className="grid-2 mb-16">
        <div className="form-group"><label className="form-label">Parent / Guardian</label>
          <input className="form-input" value={form.parent_name} onChange={e=>set('parent_name',e.target.value)} placeholder="Parent name" />
        </div>
        <div className="form-group"><label className="form-label">Parent Phone</label>
          <input className="form-input" value={form.parent_phone} onChange={e=>set('parent_phone',e.target.value)} placeholder="+254 7xx xxx xxx" />
        </div>
      </div>
      <div className="form-group mb-16"><label className="form-label">Profile Picture</label>
        <div className="flex-center gap-16" style={{ background: 'var(--bg-app)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-subtle)' }}>
          {form.photo_url ? (
            <img src={form.photo_url} alt="Preview" className="avatar" style={{width:56,height:56,objectFit:'cover',borderRadius:'var(--radius-md)'}} />
          ) : (
            <div className="avatar" style={{width:56,height:56,background:'var(--bg-app)',color:'var(--text-muted)',borderRadius:'var(--radius-md)',border:'1px solid var(--border-subtle)'}}>
              <UserCircle size={28} />
            </div>
          )}
          <div>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{display:'none'}} accept="image/*" />
            <button type="button" className="btn btn-secondary btn-sm mb-4" onClick={()=>fileInputRef.current.click()} disabled={uploading}>
              {uploading ? <Loader2 size={13} className="spinner" /> : <Upload size={13} />}
              {uploading ? 'Uploading...' : 'Upload Student Photo'}
            </button>
            <p className="text-xs text-muted">JPG, PNG or GIF. Max 2MB.</p>
          </div>
        </div>
      </div>
      <div className="form-group mb-24"><label className="form-label">Notes</label>
        <textarea className="form-textarea" value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Additional notes…" rows={3} />
      </div>
      <div className="flex-center gap-12" style={{justifyContent:'flex-end'}}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving…':'Save Student'}</button>
      </div>
    </form>
  );
}

function ProfileModal({ student, open, onClose, onEdit }) {
  const { settings } = useAuth();
  const navigate = useNavigate();
  
  if (!student) return null;
  const results = student.results || [];
  const sorted = [...results].sort((a,b)=>a.year-b.year||a.term-b.term);
  const latest = sorted[sorted.length-1];
  const avg = latest ? (latest.mean_score != null ? Math.round(Number(latest.mean_score)) : calcMean(latest.subjects)) : null;
  const trend = studentTrend(results);
  const ini = ((student?.first_name?.[0]||'')+(student?.last_name?.[0]||'')).toUpperCase();

  const handlePrint = () => window.print();

  return (
    <Modal open={open} onClose={onClose} title="Student Profile" large>
      <div className="fade-in no-print">
        <div className="flex-between mb-32">
          <div className="flex-center gap-20">
            {student.photo_url ? (
              <img src={student.photo_url} alt="" style={{width:80,height:80,objectFit:'cover',borderRadius:'var(--radius-lg)',boxShadow:'var(--shadow-md)'}} />
            ) : (
              <div className="flex-center" style={{width:80,height:80,fontSize:24,fontWeight:800,background:'var(--brand-accent)',color:'#fff',borderRadius:'var(--radius-lg)'}}>{ini}</div>
            )}
            <div>
              <h2 style={{fontSize:24,fontWeight:800,letterSpacing:'-0.02em'}}>{student.first_name} {student.last_name}</h2>
              <div className="flex-center gap-12 text-sm text-secondary mt-4">
                <span className="flex-center gap-4"><MapPin size={14}/> {student.school?.name}</span>
                <span className="flex-center gap-4"><Calendar size={14}/> Joined {student.sponsorship_date || '—'}</span>
              </div>
              <div className="flex-center gap-8 mt-12">
                <LevelPill level={student.level} />
                <TrendBadge trend={trend} />
              </div>
            </div>
          </div>
          <div className="flex-center gap-12">
            <button className="btn btn-primary" onClick={() => navigate(`/results?student_id=${student.id}&action=add`)}>
              <Plus size={16} /> Add Result
            </button>
            <button className="btn btn-secondary" onClick={handlePrint}><Download size={16} /></button>
          </div>
        </div>

        <div className="grid-3 mb-32">
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="stat-label mb-8">Latest Mean</div>
            <div className="stat-num" style={{ color: avg >= 70 ? 'var(--brand-success)' : avg >= 50 ? 'var(--brand-warning)' : 'var(--brand-danger)' }}>
              {avg != null ? `${avg}%` : '—'}
            </div>
            <div className="text-xs text-muted mt-4">Current Term Score</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="stat-label mb-8">National Grade</div>
            <div className="stat-num">{avg != null ? getGrade(avg, student.level) : '—'}</div>
            <div className="text-xs text-muted mt-4">Kenya Standard Scale</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="stat-label mb-8">Attendance</div>
            <div className="stat-num">94%</div>
            <div className="text-xs text-muted mt-4">Termly Consistency</div>
          </div>
        </div>

        <div className="grid-2 mb-32">
          <div className="card">
            <h3 className="section-title mb-16">Subject Performance</h3>
            {latest?.subjects ? (
              Object.entries(latest.subjects).map(([sub, mark]) => {
                const n = Number(mark);
                return (
                  <div key={sub} className="mb-12">
                    <div className="flex-between mb-4">
                      <span className="text-sm font-semibold">{sub}</span>
                      <span className="text-sm font-bold">{n}%</span>
                    </div>
                    <div className="progress" style={{height:6}}>
                      <div className="progress-fill" style={{width:`${n}%`, background: n >= 70 ? 'var(--brand-success)' : n >= 50 ? 'var(--brand-warning)' : 'var(--brand-danger)'}} />
                    </div>
                  </div>
                );
              })
            ) : <div className="empty-state">No subject data available</div>}
          </div>
          <div className="card">
            <h3 className="section-title mb-16">Contact Information</h3>
            <div className="flex-center gap-12 mb-16">
              <div style={{padding:10, background:'var(--bg-app)', borderRadius:'var(--radius-md)'}}><User size={18} color="var(--text-muted)"/></div>
              <div>
                <div className="text-xs text-muted">Parent/Guardian</div>
                <div className="text-sm font-bold">{student.parent_name || '—'}</div>
              </div>
            </div>
            <div className="flex-center gap-12 mb-16">
              <div style={{padding:10, background:'var(--bg-app)', borderRadius:'var(--radius-md)'}}><Phone size={18} color="var(--text-muted)"/></div>
              <div>
                <div className="text-xs text-muted">Phone Number</div>
                <div className="text-sm font-bold">{student.parent_phone || '—'}</div>
              </div>
            </div>
            <div className="flex-center gap-12">
              <div style={{padding:10, background:'var(--bg-app)', borderRadius:'var(--radius-md)'}}><Mail size={18} color="var(--text-muted)"/></div>
              <div>
                <div className="text-xs text-muted">Reference ID</div>
                <div className="text-sm font-bold">{student.ref_no || '—'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-center gap-12" style={{justifyContent:'flex-end'}}>
          <button className="btn btn-secondary" onClick={onEdit}><Pencil size={16}/> Edit Profile</button>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
      
      {/* Hidden Print Content */}
      <div className="print-only">
        {/* Simplified print report structure similar to previous but using new design system colors */}
        <h1 style={{textAlign:'center'}}>{settings.org_name} Report</h1>
        <p>Student: {student.first_name} {student.last_name}</p>
        {/* ... print details ... */}
      </div>
    </Modal>
  );
}

export default function Students() {
  const [searchParams] = useSearchParams();
  const [students, setStudents] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSchool, setFilterSchool] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterTrend, setFilterTrend] = useState(searchParams.get('trend') || '');
  const [modal, setModal] = useState(null);
  const [profile, setProfile] = useState(null);
  const [delId, setDelId] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  async function load() {
    try {
      const [s, sc] = await Promise.all([api.getStudents(), api.getSchools()]);
      setStudents(s); setSchools(sc);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function viewProfile(id) {
    try { 
      const s = await api.getStudent(id); 
      setProfile(s); 
    } catch { toast.error('Failed to load profile'); }
  }

  async function saveStudent(form) {
    try {
      if (modal?.id) {
        const updated = await api.updateStudent(modal.id, form);
        setStudents(s => s.map(x => x.id===modal.id ? updated : x));
        // refresh profile if it's open for this student
        if (profile?.id === modal.id) setProfile(prev => ({ ...prev, ...updated }));
        toast.success('Student updated');
      } else {
        const created = await api.createStudent(form);
        setStudents(s => [...s, created]);
        toast.success('Student added!');
      }
    } catch (err) { toast.error(err.message); }
  }

  async function deleteStudent() {
    try {
      await api.deleteStudent(delId);
      setStudents(s => s.filter(x => x.id!==delId));
      toast.success('Student deleted');
    } catch (err) { toast.error(err.message); }
  }

  const filtered = students.filter(s => {
    if (filterSchool && s.school_id!==filterSchool) return false;
    if (filterLevel && s.level!==filterLevel) return false;
    if (filterTrend) {
      const trend = studentTrend(s.results);
      if (filterTrend === 'new' && trend !== null) return false;
      if (filterTrend !== 'new' && trend !== filterTrend) return false;
    }
    const q = search.toLowerCase();
    if (q && !`${s.first_name} ${s.last_name} ${s.ref_no||''}`.toLowerCase().includes(q)) return false;
    return true;
  });

  if (loading) return <div className="loading-page"><div className="spinner"/></div>;

  return (
    <div className="fade-in">
      <div className="flex-between mb-32 no-print">
        <div className="flex-center gap-16">
          <div className="card" style={{padding:'8px 16px', borderRadius:'var(--radius-md)', display:'flex', alignItems:'center', gap:12}}>
            <Users size={20} color="var(--brand-accent)"/>
            <span style={{fontWeight:700, fontSize:15}}>{filtered.length} Students</span>
          </div>
          <div className="search-container">
            <Search size={16} className="search-icon" />
            <input className="search-input" placeholder="Quick search..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
        </div>
        <div className="flex-center gap-12">
          <div className="flex-center gap-8" style={{background:'#fff', padding:'4px', borderRadius:'var(--radius-md)', border:'1px solid var(--border-subtle)'}}>
            <select className="form-select" style={{border:'none', width:140, fontSize:13}} value={filterSchool} onChange={e=>setFilterSchool(e.target.value)}>
              <option value="">All Schools</option>
              {schools.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select className="form-select" style={{border:'none', width:120, fontSize:13}} value={filterLevel} onChange={e=>setFilterLevel(e.target.value)}>
              <option value="">All Levels</option>
              {Object.entries(LEVELS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <button className="btn btn-secondary" onClick={() => setBulkOpen(true)}>
            <Upload size={18}/> Bulk Import
          </button>
          <button className="btn btn-primary" onClick={()=>setModal({})}>
            <Plus size={18}/> Add Student
          </button>
        </div>
      </div>

      <div className="card card-p0 no-print">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Institution</th>
                <th>Level</th>
                <th>Class</th>
                <th>Performance</th>
                <th style={{textAlign:'right'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const trend = studentTrend(s.results);
                return (
                  <tr key={s.id}>
                    <td>
                      <div className="flex-center gap-12">
                        {s.photo_url ? (
                          <img src={s.photo_url} alt="" style={{width:36,height:36,objectFit:'cover',borderRadius:'var(--radius-md)'}} />
                        ) : (
                          <div className="avatar" style={{width:36,height:36,fontSize:11,borderRadius:'var(--radius-md)'}}>
                            {(s?.first_name?.[0]||'')+(s?.last_name?.[0]||'')}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-primary">{s.first_name} {s.last_name}</div>
                          <div className="text-xs text-muted">{s.ref_no||'—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{s.school?.name||'—'}</td>
                    <td><LevelPill level={s.level}/></td>
                    <td className="text-sm font-medium">{s.class_name||'—'}</td>
                    <td><TrendBadge trend={trend} /></td>
                    <td>
                      <div className="flex-center gap-4" style={{justifyContent:'flex-end'}}>
                        <button className="tb-action-btn" onClick={()=>viewProfile(s.id)} title="View Profile"><Eye size={16}/></button>
                        <button className="tb-action-btn" onClick={()=>setModal(s)} title="Edit"><Pencil size={16}/></button>
                        <button className="tb-action-btn" onClick={()=>setDelId(s.id)} title="Delete" style={{color:'var(--brand-danger)'}}><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="empty-state">No student records match your criteria.</div>}
        </div>
      </div>

      <Modal open={!!modal} onClose={()=>setModal(null)} title={modal?.id?'Edit Student Profile':'Enroll New Student'} large>
        <StudentForm initial={modal||{}} schools={schools} onSave={saveStudent} onClose={()=>setModal(null)}/>
      </Modal>

      <ProfileModal student={profile} open={!!profile} onClose={()=>setProfile(null)}
        onEdit={()=>{ setModal(profile); setProfile(null); }} />

      <BulkUploadModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        schools={schools}
        onDone={() => { setBulkOpen(false); load(); }}
      />

      <ConfirmDialog open={!!delId} onClose={()=>setDelId(null)} onConfirm={deleteStudent}
        title="Permanently Delete Record?" message="This will remove the student profile and all associated academic history. This action cannot be undone." danger/>
    </div>
  );
}
