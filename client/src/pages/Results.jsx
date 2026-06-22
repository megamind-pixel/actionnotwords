import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';

// Inline SVG icons for ones not available in older lucide-react
const ChevronDown = ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
const ChevronUp = ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>;
const X = ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const Image = ({ size = 24, style }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
const ExternalLink = ({ size = 13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
import toast from 'react-hot-toast';
import { api, uploadScoreProof } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { SUBJECTS, LEVELS, calcMean, getGrade, gradeColor } from '../lib/kenya';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';

// ── Proof Image Uploader ──────────────────────────────────────────────────────
function ProofUploader({ value, onChange }) {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  async function handleFile(file) {
    if (!file) return;
    // Local preview
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const url = await uploadScoreProof(file);
      onChange(url);
      toast.success('Score proof uploaded!');
    } catch (err) {
      toast.error('Upload failed: ' + err.message);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  function clear() {
    setPreview(null);
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  }

  const displayUrl = preview || value;

  return (
    <div>
      <label className="form-label">Score Proof Image</label>
      {displayUrl ? (
        <div style={{ position: 'relative', display: 'inline-block', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '2px solid var(--border-subtle)', marginBottom: 4 }}>
          <img src={displayUrl} alt="Score proof" style={{ width: '100%', maxHeight: 180, objectFit: 'contain', background: '#F8FAFC', display: 'block' }} />
          <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 4 }}>
            {value && !preview && (
              <a href={value} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }}>
                <ExternalLink size={11} /> View
              </a>
            )}
            <button type="button" className="btn btn-danger btn-sm" style={{ padding: '4px 6px' }} onClick={clear}>
              <X size={12} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); }}
          onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
          style={{
            border: '2px dashed var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '24px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            background: 'var(--bg-app)',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand-accent)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
        >
          {uploading ? (
            <div className="flex-center gap-8" style={{ justifyContent: 'center', color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ width: 18, height: 18 }} /> Uploading…
            </div>
          ) : (
            <>
              <Image size={24} style={{ margin: '0 auto 8px', color: 'var(--text-muted)' }} />
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 500 }}>
                Click to upload or drag & drop
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Photo of report card / score sheet (JPG, PNG, PDF)
              </div>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files[0])}
      />
    </div>
  );
}

// ── Result Form ───────────────────────────────────────────────────────────────
function ResultForm({ initial, students, onSave, onClose }) {
  const { settings } = useAuth();
  const [form, setForm] = useState({
    student_id: '',
    year: settings.current_year || new Date().getFullYear().toString(),
    term: settings.current_term || '1',
    exam_type: 'end_term',
    mean_score: '',
    score_proof_url: '',
    subjects: {},
    position: '',
    class_size: '',
    remarks: '',
    ...initial
  });
  const [saving, setSaving] = useState(false);
  const [showSubjects, setShowSubjects] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setSubject = (sub, val) => setForm(f => ({ ...f, subjects: { ...f.subjects, [sub]: val } }));

  const student = students.find(s => s.id === form.student_id);
  const studentLevel = student?.level;
  const subs = studentLevel ? SUBJECTS[studentLevel] || [] : [];
  const curriculum = studentLevel ? LEVELS[studentLevel]?.curriculum : null;

  // Derived grade from mean_score
  const meanVal = form.mean_score !== '' ? Number(form.mean_score) : null;
  const grade = meanVal !== null ? getGrade(meanVal, studentLevel) : '—';

  useEffect(() => {
    if (student && !initial?.id && form.student_id !== initial?.student_id) {
      setForm(f => ({ ...f, subjects: {}, mean_score: '' }));
    }
  }, [form.student_id, student]);

  async function submit(e) {
    e.preventDefault();
    if (!form.student_id) { toast.error('Select a student'); return; }
    if (form.mean_score === '' || form.mean_score == null) {
      toast.error('Enter the overall mean score'); return;
    }
    const score = Number(form.mean_score);
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error('Mean score must be between 0 and 100'); return;
    }
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  }

  return (
    <form onSubmit={submit}>
      {/* Student + Year */}
      <div className="grid-2 mb-16">
        <div className="form-group">
          <label className="form-label">Student *</label>
          <select className="form-select" value={form.student_id} onChange={e => set('student_id', e.target.value)} required>
            <option value="">Select student</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>
                {s.first_name} {s.last_name} — {LEVELS[s.level]?.label || s.level}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Academic Year *</label>
          <select className="form-select" value={form.year} onChange={e => set('year', e.target.value)}>
            {['2022', '2023', '2024', '2025', '2026'].map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Term + Exam Type */}
      <div className="grid-2 mb-16">
        <div className="form-group">
          <label className="form-label">Term *</label>
          <select className="form-select" value={form.term} onChange={e => set('term', e.target.value)}>
            <option value="1">Term 1</option><option value="2">Term 2</option><option value="3">Term 3</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Exam Type</label>
          <select className="form-select" value={form.exam_type} onChange={e => set('exam_type', e.target.value)}>
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

      {/* ── MEAN SCORE (PRIMARY INPUT) ── */}
      <div style={{ marginBottom: 18, border: '2px solid var(--brand-accent)', borderRadius: 'var(--radius-md)', padding: 16, background: 'var(--bg-app)' }}>
        <div className="flex-between mb-12">
          <div className="form-label" style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>
            Overall Mean Score *
          </div>
          {student && (
            <span className={`badge ${curriculum === 'CBC' ? 'badge-blue' : 'badge-gray'}`} style={{ fontSize: 10, textTransform: 'uppercase' }}>
              {curriculum} · {LEVELS[student.level]?.label}
            </span>
          )}
        </div>
        <div className="flex-center gap-16">
          <div style={{ flex: 1 }}>
            <input
              className="form-input"
              type="number"
              min="0"
              max="100"
              step="0.5"
              placeholder="Enter mean score (0–100)"
              value={form.mean_score}
              onChange={e => set('mean_score', e.target.value)}
              style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', height: 52 }}
              required
            />
          </div>
          {meanVal !== null && (
            <div style={{ textAlign: 'center', minWidth: 72 }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: meanVal >= 70 ? 'var(--green)' : meanVal >= 50 ? 'var(--amber)' : 'var(--red)' }}>
                {meanVal}%
              </div>
              <span className={`badge badge-${gradeColor(grade)}`} style={{ fontSize: 11, padding: '2px 8px' }}>{grade}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── PROOF IMAGE UPLOAD ── */}
      <div className="mb-16">
        <ProofUploader value={form.score_proof_url} onChange={url => set('score_proof_url', url)} />
      </div>

      {/* ── OPTIONAL SUBJECT BREAKDOWN ── */}
      {student && subs.length > 0 && (
        <div style={{ marginBottom: 18, border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => setShowSubjects(v => !v)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'var(--bg-app)', border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)' }}
          >
            <span>+ Add Subject Breakdown (optional)</span>
            {showSubjects ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showSubjects && (
            <div style={{ padding: 16, borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                Entering individual subjects will <strong>not</strong> override the mean score above — it is kept for reference only.
              </div>
              <div className="grid-3 gap-16">
                {subs.map(sub => {
                  const val = form.subjects[sub];
                  const subGrade = getGrade(val, studentLevel);
                  return (
                    <div key={sub} className="form-group" style={{ marginBottom: 0 }}>
                      <div className="flex-between" style={{ marginBottom: 4 }}>
                        <label className="form-label" style={{ fontSize: 11, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={sub}>{sub}</label>
                        {val && <span className={`badge badge-${gradeColor(subGrade)}`} style={{ fontSize: 9, padding: '1px 4px' }}>{subGrade}</span>}
                      </div>
                      <input className="form-input" type="number" min="0" max="100" placeholder="0–100"
                        value={val ?? ''} onChange={e => setSubject(sub, e.target.value)} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Position + Class Size */}
      <div className="grid-2 mb-16">
        <div className="form-group">
          <label className="form-label">Position in Class</label>
          <input className="form-input" type="number" value={form.position} onChange={e => set('position', e.target.value)} placeholder="e.g. 5" />
        </div>
        <div className="form-group">
          <label className="form-label">Class Size</label>
          <input className="form-input" type="number" value={form.class_size} onChange={e => set('class_size', e.target.value)} placeholder="e.g. 40" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Remarks</label>
        <textarea className="form-textarea" value={form.remarks} onChange={e => set('remarks', e.target.value)} placeholder="Optional teacher remarks…" style={{ minHeight: 60 }} />
      </div>

      <div className="flex-center gap-8" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Result'}</button>
      </div>
    </form>
  );
}

// ── Results Page ──────────────────────────────────────────────────────────────
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
  const [proofModal, setProofModal] = useState(null); // image URL to preview

  async function load() {
    try {
      const [r, s] = await Promise.all([api.getResults(), api.getStudents()]);
      setResults(r); setStudents(s);

      const autoAdd = searchParams.get('action') === 'add';
      const studentId = searchParams.get('student_id');
      if (autoAdd && studentId) {
        setModal({ student_id: studentId });
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('action');
        setSearchParams(newParams, { replace: true });
      }
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function saveResult(form) {
    // Resolve mean_score — prefer explicit entry, fallback to subjects calc
    const explicitMean = form.mean_score !== '' && form.mean_score != null ? Number(form.mean_score) : null;
    const payload = { ...form, mean_score: explicitMean };

    if (modal?.id) {
      const updated = await api.updateResult(modal.id, payload);
      setResults(r => r.map(x => x.id === modal.id ? updated : x));
      toast.success('Result updated');
    } else {
      const created = await api.createResult(payload);
      setResults(r => {
        const idx = r.findIndex(x => x.student_id === created.student_id && x.year === created.year && x.term === created.term);
        if (idx >= 0) { const n = [...r]; n[idx] = created; return n; }
        return [...r, created];
      });
      toast.success('Results saved!');
    }
  }

  async function deleteResult() {
    try {
      await api.deleteResult(delId);
      setResults(r => r.filter(x => x.id !== delId));
      toast.success('Deleted');
    } catch (err) { toast.error(err.message); }
  }

  // Resolve mean for display: prefer mean_score column, fall back to subjects
  function getDisplayMean(r) {
    if (r.mean_score != null) return Math.round(Number(r.mean_score));
    return calcMean(r.subjects);
  }

  const terms = [...new Set(results.map(r => `${r.year} T${r.term}`))].sort();
  const filtered = results.filter(r => {
    if (filterStudent && r.student_id !== filterStudent) return false;
    if (filterTerm && `${r.year} T${r.term}` !== filterTerm) return false;
    return true;
  });

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="no-print">
        <div className="flex-between mb-20">
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Exam Results</div>
            <div className="text-sm text-muted">End-of-term academic records</div>
          </div>
          <div className="flex-center gap-8">
            <select className="form-select" style={{ width: 'auto', fontSize: 12.5 }} value={filterStudent} onChange={e => setFilterStudent(e.target.value)}>
              <option value="">All Students</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
            </select>
            <select className="form-select" style={{ width: 'auto', fontSize: 12.5 }} value={filterTerm} onChange={e => setFilterTerm(e.target.value)}>
              <option value="">All Terms</option>
              {terms.map(t => <option key={t}>{t}</option>)}
            </select>
            <button className="btn btn-primary btn-sm" onClick={() => setModal({})}>
              <Plus size={13} /> Enter Results
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="card"><div className="empty-state">
            <p>No results yet. {admin?.role !== 'viewer' && <button className="btn btn-primary btn-sm" onClick={() => setModal({})} style={{ marginTop: 12 }}>Enter first results</button>}</p>
          </div></div>
        ) : (
          <div className="card card-p0"><div className="table-wrap">
            <table>
              <thead><tr>
                <th>Student</th>
                <th>School</th>
                <th>Year</th>
                <th>Term</th>
                <th>Mean Score</th>
                <th>Grade</th>
                <th>Proof</th>
                <th>Position</th>
                <th>Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map(r => {
                  const avg = getDisplayMean(r);
                  const g = avg != null ? getGrade(avg, r.student?.level) : '—';
                  return (
                    <tr key={r.id}>
                      <td>
                        <div className="text-bold text-sm">{r.student?.first_name} {r.student?.last_name}</div>
                        <div className="text-xs text-muted">{r.student?.ref_no || '—'}</div>
                      </td>
                      <td className="text-sm">{r.student?.school?.name || '—'}</td>
                      <td>{r.year}</td>
                      <td>Term {r.term}</td>
                      <td>
                        <strong style={{ color: avg >= 70 ? 'var(--green)' : avg >= 50 ? 'var(--amber)' : 'var(--red)', fontSize: 15 }}>
                          {avg != null ? `${avg}%` : '—'}
                        </strong>
                      </td>
                      <td>{avg != null ? <span className={`badge badge-${gradeColor(g)}`}>{g}</span> : '—'}</td>
                      <td>
                        {r.score_proof_url ? (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 8px', fontSize: 11 }}
                            onClick={() => setProofModal(r.score_proof_url)}
                            title="View score proof"
                          >
                            <Image size={12} /> View
                          </button>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                      <td className="text-sm">{r.position && r.class_size ? `${r.position}/${r.class_size}` : r.position || '—'}</td>
                      <td>
                        <div className="flex-center gap-6">
                          <button className="btn btn-secondary btn-sm" onClick={() => setModal(r)}><Pencil size={12} /></button>
                          <button className="btn btn-danger btn-sm" onClick={() => setDelId(r.id)}><Trash2 size={12} /></button>
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

      {/* Result entry/edit modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Edit Results' : 'Enter Exam Results'} large>
        <ResultForm initial={modal || {}} students={students} onSave={saveResult} onClose={() => setModal(null)} />
      </Modal>

      {/* Score proof preview modal */}
      <Modal open={!!proofModal} onClose={() => setProofModal(null)} title="Score Proof">
        {proofModal && (
          <div style={{ textAlign: 'center' }}>
            <img src={proofModal} alt="Score proof" style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 'var(--radius-md)' }} />
            <div style={{ marginTop: 12 }}>
              <a href={proofModal} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                <ExternalLink size={13} /> Open Full Size
              </a>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!delId} onClose={() => setDelId(null)} onConfirm={deleteResult}
        title="Delete Result" message="Delete this result record? Cannot be undone." danger />
    </div>
  );
}
