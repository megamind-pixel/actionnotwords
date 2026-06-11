import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Eye, Pencil, Trash2, Users, Download, UserCircle, Upload, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { LEVELS, SUBJECTS, getGrade, calcMean, gradeColor, studentTrend } from '../lib/kenya';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';

function LevelPill({ level }) {
  const info = LEVELS[level];
  return <span className={`level-pill level-${level}`}>{info?.label || level}</span>;
}

function TrendBadge({ trend }) {
  if (trend === 'up') return <span className="trend-up">↑ Improving</span>;
  if (trend === 'down') return <span className="trend-down">↓ Declining</span>;
  if (trend === 'stable') return <span className="trend-stable">→ Stable</span>;
  return <span className="trend-stable">— New</span>;
}

function StatusBadge({ avg, level }) {
  if (avg === null) return <span className="badge badge-gray">No data</span>;
  if (level === 'ecde' || level === 'lower_primary') {
    const g = getGrade(avg, level);
    const color = gradeColor(g);
    return <span className={`badge badge-${color}`}>{g}</span>;
  }
  if (level === 'secondary') {
    const g = getGrade(avg, level);
    return <span className={`badge badge-${gradeColor(g)}`}>{g} ({avg}%)</span>;
  }
  if (avg >= 70) return <span className="badge badge-green">On Track ({avg}%)</span>;
  if (avg >= 50) return <span className="badge badge-amber">Average ({avg}%)</span>;
  return <span className="badge badge-red">At Risk ({avg}%)</span>;
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

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `student-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('image')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('image')
        .getPublicUrl(filePath);

      set('photo_url', publicUrl);
      toast.success('Photo uploaded!');
    } catch (err) {
      console.error(err);
      toast.error('Upload failed. Ensure "photos" bucket exists and is public.');
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
    <form onSubmit={submit}>
      <div className="form-row">
        <div className="form-group"><label className="form-label">First Name *</label>
          <input className="form-input" value={form.first_name} onChange={e=>set('first_name',e.target.value)} placeholder="Amara" required />
        </div>
        <div className="form-group"><label className="form-label">Last Name *</label>
          <input className="form-input" value={form.last_name} onChange={e=>set('last_name',e.target.value)} placeholder="Ochieng" required />
        </div>
      </div>
      <div className="form-row">
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
      <div className="form-row">
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
      <div className="form-row">
        <div className="form-group"><label className="form-label">Date of Birth</label>
          <input className="form-input" type="date" value={form.dob} onChange={e=>set('dob',e.target.value)} />
        </div>
        <div className="form-group"><label className="form-label">Gender</label>
          <select className="form-select" value={form.gender} onChange={e=>set('gender',e.target.value)}>
            <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Parent / Guardian</label>
          <input className="form-input" value={form.parent_name} onChange={e=>set('parent_name',e.target.value)} placeholder="Parent name" />
        </div>
        <div className="form-group"><label className="form-label">Parent Phone</label>
          <input className="form-input" value={form.parent_phone} onChange={e=>set('parent_phone',e.target.value)} placeholder="+254 7xx xxx xxx" />
        </div>
      </div>
      <div className="form-group"><label className="form-label">Sponsorship Start Date</label>
        <input className="form-input" type="date" value={form.sponsorship_date} onChange={e=>set('sponsorship_date',e.target.value)} />
      </div>
      <div className="form-group"><label className="form-label">Profile Picture</label>
        <div className="flex-center gap-12" style={{marginBottom: 8}}>
          {form.photo_url ? (
            <img src={form.photo_url} alt="Preview" className="avatar" style={{width:48,height:48,objectFit:'cover',borderRadius:'50%'}} />
          ) : (
            <div className="avatar" style={{width:48,height:48,background:'var(--g1)',color:'var(--g4)'}}>
              <UserCircle size={24} />
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{display:'none'}} accept="image/*" />
          <button type="button" className="btn btn-secondary btn-sm" onClick={()=>fileInputRef.current.click()} disabled={uploading}>
            {uploading ? <Loader2 size={13} className="spinner" /> : <Upload size={13} />}
            {uploading ? 'Uploading...' : 'Upload from Laptop'}
          </button>
          {form.photo_url && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={()=>set('photo_url', '')} style={{color:'var(--red)'}}>Remove</button>
          )}
        </div>
        <input className="form-input" value={form.photo_url} onChange={e=>set('photo_url',e.target.value)} placeholder="Or paste photo URL here..." />
      </div>
      <div className="form-group"><label className="form-label">Notes</label>
        <textarea className="form-textarea" value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Additional notes…" />
      </div>
      <div className="flex-center gap-8" style={{justifyContent:'flex-end',marginTop:8}}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving…':'Save Student'}</button>
      </div>
    </form>
  );
}

function ProfileModal({ student, open, onClose, onEdit }) {
  if (!student) return null;
  const { settings } = useAuth();
  const results = student.results || [];
  const sorted = [...results].sort((a,b)=>a.year-b.year||a.term-b.term);
  const latest = sorted[sorted.length-1];
  const avg = latest ? calcMean(latest.subjects) : null;
  const trend = studentTrend(results);
  const levelAvg = student.levelAvg;
  
  // Calculate Overall average across all terms
  const allMeans = sorted.map(r => calcMean(r.subjects)).filter(m => m !== null);
  const overallAvg = allMeans.length ? Math.round(allMeans.reduce((a,b)=>a+b,0) / allMeans.length) : null;

  const pct = avg || 0;
  const circ = 2*Math.PI*36;
  const dash = (pct/100)*circ;
  const ringColor = pct>=70?'var(--green)':pct>=50?'var(--amber)':'var(--red)';
  const ini = ((student.first_name[0]||'')+(student.last_name[0]||'')).toUpperCase();

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal open={open} onClose={onClose} title="Student Profile" large>
      {/* ── PRINT VERSION (Hidden on screen) ── */}
      <div className="print-only">
        <div style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: 15, marginBottom: 25 }}>
          {settings.logo_url && (
            <img src={settings.logo_url} alt="Logo" style={{ height: 60, marginBottom: 10, objectFit: 'contain' }} />
          )}
          <h1 style={{ margin: 0, fontSize: 26, fontFamily: 'serif' }}>{settings.org_name.toUpperCase()}</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#444', textTransform: 'uppercase', letterSpacing: 1.5 }}>Official Academic Performance Report</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: 20, marginBottom: 25 }}>
          <div>
            <h4 style={{ textTransform: 'uppercase', fontSize: 12, color: '#666', borderBottom: '1px solid #eee', marginBottom: 10, paddingBottom: 4 }}>Student Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px' }}>
              <div style={{ fontSize: 13 }}><span style={{ fontWeight: 600 }}>Name:</span> {student.first_name} {student.last_name}</div>
              <div style={{ fontSize: 13 }}><span style={{ fontWeight: 600 }}>Ref No:</span> {student.ref_no || '—'}</div>
              <div style={{ fontSize: 13 }}><span style={{ fontWeight: 600 }}>School:</span> {student.school?.name || '—'}</div>
              <div style={{ fontSize: 13 }}><span style={{ fontWeight: 600 }}>Level:</span> {LEVELS[student.level]?.label}</div>
              <div style={{ fontSize: 13 }}><span style={{ fontWeight: 600 }}>Class:</span> {student.class_name || '—'}</div>
              <div style={{ fontSize: 13 }}><span style={{ fontWeight: 600 }}>Gender:</span> {student.gender || '—'}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
             {student.photo_url ? (
               <img src={student.photo_url} alt="Profile" style={{ width: 120, height: 120, objectFit: 'cover', border: '1px solid #eee' }} />
             ) : (
               <div style={{ width: 120, height: 120, border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: '#ccc', background: '#fcfcfc' }}>{ini}</div>
             )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 10, marginBottom: 30 }}>
          <div style={{ border: '1px solid #eee', padding: '10px 5px', textAlign: 'center', borderRadius: 6 }}>
            <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>Term Mean</div>
            <div style={{ fontSize: 18, fontWeight: 'bold' }}>{avg != null ? `${avg}%` : '—'}</div>
          </div>
          <div style={{ border: '1px solid #eee', padding: '10px 5px', textAlign: 'center', borderRadius: 6, background: '#fcfcfc' }}>
            <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>Overall Avg</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: 'var(--blue)' }}>{overallAvg != null ? `${overallAvg}%` : '—'}</div>
          </div>
          <div style={{ border: '1px solid #eee', padding: '10px 5px', textAlign: 'center', borderRadius: 6 }}>
            <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>Grade Avg</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#666' }}>{levelAvg != null ? `${levelAvg}%` : '—'}</div>
          </div>
          <div style={{ border: '1px solid #eee', padding: '10px 5px', textAlign: 'center', borderRadius: 6 }}>
            <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>Kenya Grade</div>
            <div style={{ fontSize: 18, fontWeight: 'bold' }}>{avg != null ? getGrade(avg, student.level) : '—'}</div>
          </div>
          <div style={{ border: '1px solid #eee', padding: '10px 5px', textAlign: 'center', borderRadius: 6 }}>
            <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>Trend</div>
            <div style={{ fontSize: 16, fontWeight: 'bold', color: trend==='up'?'#0f7940':trend==='down'?'#C0292A':'#444' }}>
              {trend === 'up' ? 'IMPROVING' : trend === 'down' ? 'DECLINING' : trend === 'stable' ? 'STABLE' : 'NEW'}
            </div>
          </div>
        </div>

        <h4 style={{ textTransform: 'uppercase', fontSize: 12, color: '#666', borderBottom: '1px solid #eee', marginBottom: 12, paddingBottom: 4 }}>Subject Analysis (Latest Term)</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 30, fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8f8f8' }}>
              <th style={{ textAlign: 'left', padding: '10px 12px', border: '1px solid #eee' }}>Subject</th>
              <th style={{ textAlign: 'center', padding: '10px 12px', border: '1px solid #eee' }}>Score (%)</th>
              <th style={{ textAlign: 'center', padding: '10px 12px', border: '1px solid #eee' }}>Grade</th>
              <th style={{ textAlign: 'left', padding: '10px 12px', border: '1px solid #eee' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {latest?.subjects && (SUBJECTS[student.level]||Object.keys(latest.subjects)).map(sub => {
              const mark = latest.subjects[sub];
              if (mark === undefined) return null;
              const n = Number(mark);
              return (
                <tr key={sub}>
                  <td style={{ padding: '8px 12px', border: '1px solid #eee' }}>{sub}</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #eee', textAlign: 'center', fontWeight: 'bold' }}>{n}%</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #eee', textAlign: 'center' }}>{getGrade(n, student.level)}</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #eee' }}>
                    <span style={{ color: n>=70?'#0f7940':n>=50?'#b86d00':'#C0292A', fontWeight: 600 }}>
                      {n>=70?'Excellent':n>=50?'Average':'At Risk'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {sorted.length > 0 && (
          <>
            <h4 style={{ textTransform: 'uppercase', fontSize: 12, color: '#666', borderBottom: '1px solid #eee', marginBottom: 12, paddingBottom: 4 }}>Academic History</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 30 }}>
              <thead>
                <tr style={{ background: '#f8f8f8' }}>
                  <th style={{ padding: '8px', border: '1px solid #eee', textAlign: 'left' }}>Year</th>
                  <th style={{ padding: '8px', border: '1px solid #eee', textAlign: 'left' }}>Term</th>
                  <th style={{ padding: '8px', border: '1px solid #eee', textAlign: 'center' }}>Mean Score</th>
                  <th style={{ padding: '8px', border: '1px solid #eee', textAlign: 'center' }}>Grade</th>
                  <th style={{ padding: '8px', border: '1px solid #eee', textAlign: 'center' }}>Position</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(r => {
                  const a = calcMean(r.subjects);
                  return (
                    <tr key={r.id}>
                      <td style={{ padding: '6px 8px', border: '1px solid #eee' }}>{r.year}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #eee' }}>Term {r.term}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #eee', textAlign: 'center', fontWeight: 'bold' }}>{a}%</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #eee', textAlign: 'center' }}>{getGrade(a, student.level)}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #eee', textAlign: 'center' }}>{r.position && r.class_size ? `${r.position}/${r.class_size}` : r.position || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

        <div style={{ marginTop: 40 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 5 }}>Teacher's Remarks:</div>
            <div style={{ borderBottom: '1px solid #eee', height: 40 }}></div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, marginTop: 60 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: 6, fontSize: 11, fontWeight: 'bold' }}>SCHOOL HEADTEACHER SIGNATURE</div>
              <div style={{ fontSize: 9, color: '#888', marginTop: 3 }}>Date: ____________________</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: 6, fontSize: 11, fontWeight: 'bold' }}>PARENT/GUARDIAN SIGNATURE</div>
              <div style={{ fontSize: 9, color: '#888', marginTop: 3 }}>Date: ____________________</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SCREEN VERSION (Hidden on print) ── */}
      <div className="no-print">
        <div className="flex-center gap-16 mb-20">
          {student.photo_url ? (
            <img src={student.photo_url} alt="Profile" className="avatar" style={{width:64,height:64,objectFit:'cover'}} />
          ) : (
            <div className="avatar" style={{width:64,height:64,fontSize:22}}>{ini}</div>
          )}
          <div>
            <div style={{fontSize:21,fontWeight:800,lineHeight:1.1}}>{student.first_name} {student.last_name}</div>
            <div className="text-sm text-muted">{student.school?.name||'—'} · {student.class_name||'—'} · {student.ref_no||'No ID'}</div>
            <div className="flex-center gap-8 mt-4">
              <LevelPill level={student.level} />
              <TrendBadge trend={trend} />
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
              <Download size={13} /> PDF
            </button>
          </div>
        </div>

        <div className="grid-2 mb-16">
          <div className="card" style={{padding:14,textAlign:'center'}}>
            <div className="ring-container" style={{margin:'0 auto 8px'}}>
              <svg viewBox="0 0 88 88" width="88" height="88">
                <circle cx="44" cy="44" r="36" fill="none" stroke="var(--g1)" strokeWidth="7"/>
                <circle cx="44" cy="44" r="36" fill="none" stroke={ringColor} strokeWidth="7"
                  strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
              </svg>
              <div className="ring-label">
                <strong>{avg!=null?`${avg}%`:'—'}</strong>
                <span>Latest</span>
              </div>
            </div>
            <div className="text-sm text-muted">Term Average</div>
          </div>
          <div className="card" style={{padding:14}}>
            <div className="text-sm mb-8"><strong>Parent:</strong> {student.parent_name||'—'}</div>
            <div className="text-sm mb-8"><strong>Phone:</strong> {student.parent_phone||'—'}</div>
            <div className="text-sm mb-8"><strong>DOB:</strong> {student.dob||'—'}</div>
            <div className="text-sm mb-8"><strong>Gender:</strong> {student.gender||'—'}</div>
            <div className="text-sm mb-8"><strong>Sponsored:</strong> {student.sponsorship_date||'—'}</div>
            {student.notes && <div className="text-sm text-muted">{student.notes}</div>}
          </div>
        </div>

        {latest?.subjects && (
          <div className="card mb-16" style={{padding:14}}>
            <div className="text-bold mb-12" style={{fontSize:13}}>Latest Term — Subject Breakdown</div>
            {(SUBJECTS[student.level]||Object.keys(latest.subjects)).map(sub => {
              const mark = latest.subjects[sub];
              if (mark === undefined) return null;
              const n = Number(mark);
              const g = getGrade(n, student.level);
              return (
                <div key={sub} className="flex-center gap-10 mb-12">
                  <div style={{fontSize:12.5,fontWeight:600,color:'var(--g5)',minWidth:120}}>{sub}</div>
                  <div className="progress" style={{flex:1}}>
                    <div className={`progress-fill ${n>=70?'green':n>=50?'amber':''}`} style={{width:`${n}%`}}/>
                  </div>
                  <div style={{fontSize:12.5,fontWeight:800,minWidth:36,textAlign:'right',color:n>=70?'var(--green)':n>=50?'var(--amber)':'var(--red)'}}>{n}%</div>
                  <span className={`badge badge-${gradeColor(g)}`}>{g}</span>
                </div>
              );
            })}
          </div>
        )}

        {sorted.length > 0 && (
          <div className="card" style={{padding:14}}>
            <div className="text-bold mb-8" style={{fontSize:13}}>All Results ({sorted.length} term{sorted.length!==1?'s':''})</div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Year</th><th>Term</th><th>Type</th><th>Mean</th><th>Grade</th><th>Position</th></tr></thead>
                <tbody>
                  {sorted.map(r => {
                    const a = calcMean(r.subjects);
                    const g = a!=null ? getGrade(a, student.level) : '—';
                    return (
                      <tr key={r.id}>
                        <td>{r.year}</td><td>Term {r.term}</td>
                        <td className="text-sm text-muted">{r.exam_type||'End Term'}</td>
                        <td><strong>{a!=null?`${a}%`:'—'}</strong></td>
                        <td>{a!=null?<span className={`badge badge-${gradeColor(g)}`}>{g}</span>:'—'}</td>
                        <td>{r.position&&r.class_size?`${r.position}/${r.class_size}`:r.position||'—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex-center gap-8 mt-16">
          <button className="btn btn-primary btn-sm" onClick={onEdit}>Edit Profile</button>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
        </div>
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
      // Calculate level average from the current students list
      const levelStudents = students.filter(x => x.level === s.level);
      const avgs = levelStudents.map(x => {
        const studentResults = x.results || [];
        const sorted = [...studentResults].sort((a,b) => a.year - b.year || a.term - b.term);
        const latest = sorted[sorted.length - 1];
        return latest ? calcMean(latest.subjects) : null;
      }).filter(v => v !== null);
      const levelAvg = avgs.length ? Math.round(avgs.reduce((a,b)=>a+b,0) / avgs.length) : null;
      
      setProfile({ ...s, levelAvg }); 
    }
    catch { toast.error('Failed to load profile'); }
  }

  async function saveStudent(form) {
    if (modal?.id) {
      const updated = await api.updateStudent(modal.id, form);
      setStudents(s => s.map(x => x.id===modal.id ? updated : x));
      toast.success('Student updated');
    } else {
      const created = await api.createStudent(form);
      setStudents(s => [...s, created]);
      toast.success('Student added!');
    }
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

  // Get latest result for each student (from the students list, results not joined here)
  // We'll compute trend from the student object if results are loaded; otherwise show from results page
  const getLatest = (student) => null; // Results loaded in profile only
  const getAvg = (student) => null;

  if (loading) return <div className="loading-page"><div className="spinner"/></div>;

  return (
    <div>
      <div className="no-print">
        <div className="flex-between mb-20">
          <div>
            <div style={{fontSize:15,fontWeight:700}}>All Students</div>
            <div className="text-sm text-muted">{filtered.length} student{filtered.length!==1?'s':''} found</div>
          </div>
          <div className="flex-center gap-8">
            <input className="form-input" style={{width:180,fontSize:12.5}} placeholder="Search…"
              value={search} onChange={e=>setSearch(e.target.value)} />
            <select className="form-select" style={{width:'auto',fontSize:12.5}} value={filterSchool} onChange={e=>setFilterSchool(e.target.value)}>
              <option value="">All Schools</option>
              {schools.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select className="form-select" style={{width:'auto',fontSize:12.5}} value={filterLevel} onChange={e=>setFilterLevel(e.target.value)}>
              <option value="">All Levels</option>
              {Object.entries(LEVELS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
            <select className="form-select" style={{width:'auto',fontSize:12.5}} value={filterTrend} onChange={e=>setFilterTrend(e.target.value)}>
              <option value="">All Trends</option>
              <option value="up">Improving</option>
              <option value="stable">Stable</option>
              <option value="down">Declining</option>
              <option value="new">New</option>
            </select>
            <button className="btn btn-primary btn-sm" onClick={()=>setModal({})}>
              <Plus size={13}/> Add Student
            </button>
          </div>
        </div>

        {filtered.length===0 ? (
          <div className="card"><div className="empty-state">
            <Users strokeWidth={1.2}/>
            <p>No students found. {!search && <button className="btn btn-primary btn-sm" onClick={()=>setModal({})} style={{marginTop:12}}>Add first student</button>}</p>
          </div></div>
        ) : (
          <div className="card card-p0">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Student</th><th>School</th><th>Level</th><th>Class</th><th>Sponsored</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id}>
                      <td>
                        <div className="flex-center gap-10">
                          {s.photo_url ? (
                            <img src={s.photo_url} alt="" className="avatar" style={{width:30,height:30,objectFit:'cover',borderRadius:'50%'}} />
                          ) : (
                            <div className="avatar" style={{width:30,height:30,fontSize:10}}>
                              {(s.first_name[0]||'')+(s.last_name[0]||'')}
                            </div>
                          )}
                          <div>
                            <div className="text-bold text-sm">{s.first_name} {s.last_name}</div>
                            <div className="text-xs text-muted">{s.ref_no||'—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-sm">{s.school?.name||'—'}</td>
                      <td><LevelPill level={s.level}/></td>
                      <td className="text-sm">{s.class_name||'—'}</td>
                      <td className="text-sm text-muted">{s.sponsorship_date||'—'}</td>
                      <td>
                        <div className="flex-center gap-6">
                          <button className="btn btn-ghost btn-sm" onClick={()=>viewProfile(s.id)}><Eye size={12}/> View</button>
                          {admin?.role !== 'viewer' && (
                            <>
                              <button className="btn btn-secondary btn-sm" onClick={()=>setModal(s)}><Pencil size={12}/> Edit</button>
                              <button className="btn btn-danger btn-sm" onClick={()=>setDelId(s.id)}><Trash2 size={12}/> Del</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal open={!!modal} onClose={()=>setModal(null)} title={modal?.id?'Edit Student':'Add Student'} large>
        <StudentForm initial={modal||{}} schools={schools} onSave={saveStudent} onClose={()=>setModal(null)}/>
      </Modal>

      <ProfileModal student={profile} open={!!profile} onClose={()=>setProfile(null)}
        onEdit={()=>{ setModal(profile); setProfile(null); }} />

      <ConfirmDialog open={!!delId} onClose={()=>setDelId(null)} onConfirm={deleteStudent}
        title="Delete Student" message="Delete this student and all their results? Cannot be undone." danger/>
    </div>
  );
}
