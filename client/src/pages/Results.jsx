import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { SUBJECTS, LEVELS, calcMean, getGrade, gradeColor } from '../lib/kenya';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';

function ResultForm({ initial, students, onSave, onClose }) {
  const { settings } = useAuth();
  const [form, setForm] = useState({ 
    student_id:'', 
    year: settings.current_year || new Date().getFullYear().toString(), 
    term: settings.current_term || '1', 
    exam_type: 'end_term', 
    subjects: {}, 
    position: '', 
    class_size: '', 
    remarks: '', 
    ...initial 
  });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const setSubject = (sub, val) => setForm(f=>({...f, subjects:{...f.subjects,[sub]:val}}));

  const student = students.find(s => s.id === form.student_id);
  const studentLevel = student?.level;
  const subs = studentLevel ? SUBJECTS[studentLevel] || [] : [];
  const curriculum = studentLevel ? LEVELS[studentLevel]?.curriculum : null;

  useEffect(() => {
    if (student) {
      // If we're adding a new result and the student changed, or if it's the first time we've selected a student
      if (!initial?.id && form.student_id !== initial?.student_id) {
        setForm(f => ({ ...f, subjects: {} }));
      }
    }
  }, [form.student_id, student]);

  async function submit(e) {
    e.preventDefault();
    if (!form.student_id) { toast.error('Select a student'); return; }
    const filled = Object.values(form.subjects).filter(v=>v!=='');
    if (!filled.length) { toast.error('Enter at least one mark'); return; }
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  }

  return (
    <form onSubmit={submit}>
      <div className="grid-2 mb-16">
        <div className="form-group"><label className="form-label">Student *</label>
          <select className="form-select" value={form.student_id} onChange={e=>set('student_id',e.target.value)} required>
            <option value="">Select student</option>
            {students.map(s=>(
              <option key={s.id} value={s.id}>
                {s.first_name} {s.last_name} — {LEVELS[s.level]?.label || s.level}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group"><label className="form-label">Academic Year *</label>
          <select className="form-select" value={form.year} onChange={e=>set('year',e.target.value)}>
            {['2022','2023','2024','2025','2026'].map(y=><option key={y}>{y}</option>)}
          </select>
        </div>
      </div>
      <div className="grid-2 mb-16">
        <div className="form-group"><label className="form-label">Term *</label>
          <select className="form-select" value={form.term} onChange={e=>set('term',e.target.value)}>
            <option value="1">Term 1</option><option value="2">Term 2</option><option value="3">Term 3</option>
          </select>
        </div>
        <div className="form-group"><label className="form-label">Exam Type</label>
          <select className="form-select" value={form.exam_type} onChange={e=>set('exam_type',e.target.value)}>
            <option value="end_term">End of Term</option>
            <option value="mock">Mock Exam</option>
            {student && LEVELS[student.level]?.curriculum === 'CBC' ? (
              <>
                <option value="kpsea">KPSEA (Grade 6)</option>
                <option value="kjsea">KJSEA (Grade 9)</option>
              </>
            ) : (
              <>
                <option value="kcpe">KCPE</option>
                <option value="kcse">KCSE</option>
              </>
            )}
          </select>
        </div>
      </div>

      {student && subs.length > 0 && (
        <div style={{marginBottom:18, border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-md)', padding:16, background:'var(--bg-app)'}}>
          <div className="flex-between mb-16">
            <div className="form-label" style={{margin:0, fontWeight:700}}>
              Marks — {student.first_name} {student.last_name}
            </div>
            <span className={`badge ${curriculum === 'CBC' ? 'badge-blue' : 'badge-gray'}`} style={{fontSize:10, textTransform:'uppercase'}}>
              {curriculum} Curriculum · {LEVELS[student.level]?.label}
            </span>
          </div>
          <div className="grid-3 gap-16">
            {subs.map(sub => {
              const val = form.subjects[sub];
              const grade = getGrade(val, student.level);
              return (
                <div key={sub} className="form-group" style={{marginBottom: 0}}>
                  <div className="flex-between" style={{marginBottom:4}}>
                    <label className="form-label" style={{fontSize:11, margin:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}} title={sub}>{sub}</label>
                    {val && <span className={`badge badge-${gradeColor(grade)}`} style={{fontSize:9, padding:'1px 4px'}}>{grade}</span>}
                  </div>
                  <input className="form-input" type="number" min="0" max="100" placeholder="0–100"
                    value={val??''} onChange={e=>setSubject(sub, e.target.value)}/>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid-2 mb-16">
        <div className="form-group"><label className="form-label">Position in Class</label>
          <input className="form-input" type="number" value={form.position} onChange={e=>set('position',e.target.value)} placeholder="e.g. 5"/>
        </div>
        <div className="form-group"><label className="form-label">Class Size</label>
          <input className="form-input" type="number" value={form.class_size} onChange={e=>set('class_size',e.target.value)} placeholder="e.g. 40"/>
        </div>
      </div>
      <div className="form-group"><label className="form-label">Remarks</label>
        <textarea className="form-textarea" value={form.remarks} onChange={e=>set('remarks',e.target.value)} placeholder="Optional teacher remarks…" style={{minHeight:60}}/>
      </div>
      <div className="flex-center gap-8" style={{justifyContent:'flex-end',marginTop:8}}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving…':'Save Results'}</button>
      </div>
    </form>
  );
}

export default function Results() {
  const { admin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [delId, setDelId] = useState(null);
  const [filterStudent, setFilterStudent] = useState(searchParams.get('student_id') || '');
  const [filterTerm, setFilterTerm] = useState('');

  async function load() {
    try {
      const [r, s] = await Promise.all([api.getResults(), api.getStudents()]);
      setResults(r); setStudents(s);
      
      const autoAdd = searchParams.get('action') === 'add';
      const studentId = searchParams.get('student_id');
      if (autoAdd && studentId) {
        setModal({ student_id: studentId });
        // Clear params to avoid reopening on refresh
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('action');
        setSearchParams(newParams, { replace: true });
      }
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function saveResult(form) {
    if (modal?.id) {
      const updated = await api.updateResult(modal.id, form);
      setResults(r => r.map(x=>x.id===modal.id?updated:x));
      toast.success('Result updated');
    } else {
      const created = await api.createResult(form);
      setResults(r => {
        const idx = r.findIndex(x=>x.student_id===created.student_id&&x.year===created.year&&x.term===created.term);
        if (idx>=0) { const n=[...r]; n[idx]=created; return n; }
        return [...r, created];
      });
      toast.success('Results saved!');
    }
  }

  async function deleteResult() {
    try {
      await api.deleteResult(delId);
      setResults(r => r.filter(x=>x.id!==delId));
      toast.success('Deleted');
    } catch (err) { toast.error(err.message); }
  }

  const terms = [...new Set(results.map(r=>`${r.year} T${r.term}`))].sort();
  const filtered = results.filter(r => {
    if (filterStudent && r.student_id!==filterStudent) return false;
    if (filterTerm && `${r.year} T${r.term}`!==filterTerm) return false;
    return true;
  });

  if (loading) return <div className="loading-page"><div className="spinner"/></div>;

  return (
    <div>
      <div className="no-print">
        <div className="flex-between mb-20">
          <div>
            <div style={{fontSize:15,fontWeight:700}}>Exam Results</div>
            <div className="text-sm text-muted">End-of-term academic records</div>
          </div>
          <div className="flex-center gap-8">
            <select className="form-select" style={{width:'auto',fontSize:12.5}} value={filterStudent} onChange={e=>setFilterStudent(e.target.value)}>
              <option value="">All Students</option>
              {students.map(s=><option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
            </select>
            <select className="form-select" style={{width:'auto',fontSize:12.5}} value={filterTerm} onChange={e=>setFilterTerm(e.target.value)}>
              <option value="">All Terms</option>
              {terms.map(t=><option key={t}>{t}</option>)}
            </select>
            <button className="btn btn-primary btn-sm" onClick={()=>setModal({})}>
              <Plus size={13}/> Enter Results
            </button>
          </div>
        </div>

        {filtered.length===0 ? (
          <div className="card"><div className="empty-state">
            <p>No results yet. {admin?.role !== 'viewer' && <button className="btn btn-primary btn-sm" onClick={()=>setModal({})} style={{marginTop:12}}>Enter first results</button>}</p>
          </div></div>
        ) : (
          <div className="card card-p0"><div className="table-wrap">
            <table>
              <thead><tr><th>Student</th><th>School</th><th>Year</th><th>Term</th><th>Subjects</th><th>Mean</th><th>Grade</th><th>Position</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(r => {
                  const avg = calcMean(r.subjects);
                  const g = avg!=null ? getGrade(avg, r.student?.level) : '—';
                  const subPreview = Object.entries(r.subjects||{}).slice(0,3)
                    .map(([k,v])=><span key={k} className="badge badge-gray" style={{fontSize:'9.5px',marginRight:3}}>{k.split(' ')[0]}: {v}</span>);
                  return (
                    <tr key={r.id}>
                      <td>
                        <div className="text-bold text-sm">{r.student?.first_name} {r.student?.last_name}</div>
                        <div className="text-xs text-muted">{r.student?.ref_no||'—'}</div>
                      </td>
                      <td className="text-sm">{r.student?.school?.name||'—'}</td>
                      <td>{r.year}</td>
                      <td>Term {r.term}</td>
                      <td><div className="flex-wrap gap-4">{subPreview}</div></td>
                      <td><strong style={{color:avg>=70?'var(--green)':avg>=50?'var(--amber)':'var(--red)'}}>{avg!=null?`${avg}%`:'—'}</strong></td>
                      <td>{avg!=null?<span className={`badge badge-${gradeColor(g)}`}>{g}</span>:'—'}</td>
                      <td className="text-sm">{r.position&&r.class_size?`${r.position}/${r.class_size}`:r.position||'—'}</td>
                      <td>
                        <div className="flex-center gap-6">
                          <button className="btn btn-secondary btn-sm" onClick={()=>setModal(r)}><Pencil size={12}/></button>
                          <button className="btn btn-danger btn-sm" onClick={()=>setDelId(r.id)}><Trash2 size={12}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div></div>
        )}
      </div>

      <Modal open={!!modal} onClose={()=>setModal(null)} title={modal?.id?'Edit Results':'Enter Exam Results'} large>
        <ResultForm initial={modal||{}} students={students} onSave={saveResult} onClose={()=>setModal(null)}/>
      </Modal>

      <ConfirmDialog open={!!delId} onClose={()=>setDelId(null)} onConfirm={deleteResult}
        title="Delete Result" message="Delete this result record? Cannot be undone." danger/>
    </div>
  );
}
