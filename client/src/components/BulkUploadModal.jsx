import { useState } from 'react';
import { AlertCircle, CheckCircle2, Upload, X, ClipboardPaste } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { Modal } from './Modal';

/* ── Grade → level + class mapping ── */
function resolveGrade(raw) {
  const s = String(raw || '').trim().toLowerCase();

  // PP1 / PP2
  if (s === 'pp1') return { level: 'ecde', class_name: 'PP1' };
  if (s === 'pp2') return { level: 'ecde', class_name: 'PP2' };

  // Form 1-4  (8-4-4)
  const formMatch = s.match(/^form\s*([1-4])$/i);
  if (formMatch) return { level: 'secondary', class_name: `Form ${formMatch[1]}` };

  // Numeric grade 1-12
  const num = parseInt(s, 10);
  if (!isNaN(num)) {
    if (num >= 1 && num <= 3)   return { level: 'lower_primary',    class_name: `Grade ${num}` };
    if (num >= 4 && num <= 6)   return { level: 'upper_primary',    class_name: `Grade ${num}` };
    if (num >= 7 && num <= 9)   return { level: 'junior_secondary', class_name: `Grade ${num}` };
    if (num >= 10 && num <= 12) return { level: 'senior_secondary', class_name: `Grade ${num}` };
  }

  // "Grade X" written out
  const gradeMatch = s.match(/^grade\s*(\d+)$/i);
  if (gradeMatch) return resolveGrade(gradeMatch[1]);

  return null;
}

/* ── Parse a DOB in formats like 01-Jul-2013, 2013-07-01, 01/07/2013 ── */
function parseDOB(raw) {
  if (!raw) return '';
  const s = raw.trim();
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // DD-Mon-YYYY or DD/Mon/YYYY
  const months = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 };
  const m1 = s.match(/^(\d{1,2})[-/]([A-Za-z]{3})[-/](\d{4})$/);
  if (m1) {
    const mo = months[m1[2].toLowerCase()];
    if (mo) return `${m1[3]}-${String(mo).padStart(2,'0')}-${m1[1].padStart(2,'0')}`;
  }
  // DD/MM/YYYY
  const m2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m2) return `${m2[3]}-${m2[2].padStart(2,'0')}-${m2[1].padStart(2,'0')}`;
  return s; // return as-is and let the server validate
}

/* ── Match school name (case-insensitive, partial) ── */
function matchSchool(name, schools) {
  const q = name.trim().toLowerCase();
  return (
    schools.find(s => s.name.toLowerCase() === q) ||
    schools.find(s => s.name.toLowerCase().includes(q)) ||
    schools.find(s => q.includes(s.name.toLowerCase()))
  );
}

/* ── Parse one pasted row (tab or multiple-spaces separated) ── */
function parseRow(line, schools) {
  // Split on tabs first; if no tabs, split on 2+ spaces
  const parts = line.includes('\t')
    ? line.split('\t').map(p => p.trim()).filter(Boolean)
    : line.split(/\s{2,}/).map(p => p.trim()).filter(Boolean);

  if (parts.length < 5) return { error: 'Need at least 5 columns (First Name, Last Name, Grade, ANW Ref, School)' };

  // columns: [0]=firstName [1]=lastName [2]=grade [3]=ref [4..]=school
  const [firstName, lastName, gradeRaw, refNo, ...schoolParts] = parts;
  const schoolName = schoolParts.join(' ');

  const errors = [];

  if (!firstName) errors.push('Missing first name');
  if (!lastName)  errors.push('Missing last name');

  const gradeInfo = resolveGrade(gradeRaw);
  if (!gradeInfo) errors.push(`Unknown grade "${gradeRaw}"`);

  const school = matchSchool(schoolName, schools);
  if (!school) errors.push(`School not found: "${schoolName}"`);

  if (errors.length) return { errors };

  return {
    first_name:   firstName,
    last_name:    lastName,
    level:        gradeInfo.level,
    class_name:   gradeInfo.class_name,
    ref_no:       refNo,
    school_id:    school.id,
    _schoolName:  school.name,
  };
}

/* ─────────────────────────────────────────────────── */

export function BulkUploadModal({ open, onClose, schools, onDone }) {
  const [pasted, setPasted]   = useState('');
  const [rows, setRows]       = useState(null); // parsed preview
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null); // import results

  function handleParse() {
    const lines = pasted.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) { toast.error('Nothing pasted yet'); return; }
    const parsed = lines.map((line, i) => ({ line: i + 1, raw: line, ...parseRow(line, schools) }));
    setRows(parsed);
    setResults(null);
  }

  function reset() {
    setPasted('');
    setRows(null);
    setResults(null);
  }

  async function handleImport() {
    const valid = rows.filter(r => !r.errors);
    if (!valid.length) { toast.error('No valid rows to import'); return; }
    setImporting(true);
    const res = [];
    for (const row of valid) {
      const { _schoolName, line, raw, ...payload } = row;
      try {
        await api.createStudent(payload);
        res.push({ line, name: `${payload.first_name} ${payload.last_name}`, ok: true });
      } catch (err) {
        res.push({ line, name: `${payload.first_name} ${payload.last_name}`, ok: false, msg: err.message });
      }
    }
    setImporting(false);
    setResults(res);
    const saved = res.filter(r => r.ok).length;
    if (saved) { toast.success(`${saved} student${saved > 1 ? 's' : ''} imported!`); onDone(); }
  }

  const validCount   = rows ? rows.filter(r => !r.errors).length : 0;
  const invalidCount = rows ? rows.filter(r =>  r.errors).length : 0;

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Bulk Import Students" large>
      <div className="fade-in">

        {/* ── Step 1: Paste ── */}
        {!rows && (
          <>
            <div style={{ background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
              <strong>Expected column order (paste from Excel / Google Sheets):</strong><br />
              <code style={{ fontSize: 12 }}>First Name &nbsp;│&nbsp; Last Name &nbsp;│&nbsp; Grade &nbsp;│&nbsp; ANW Ref No &nbsp;│&nbsp; School Name</code>
              <br /><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Grade can be a number (1–12), "Form 1–4", or "PP1/PP2".</span>
            </div>

            <div className="form-group">
              <label className="form-label">Paste rows here</label>
              <textarea
                className="form-textarea"
                rows={10}
                style={{ fontFamily: 'monospace', fontSize: 13 }}
                placeholder={"Margret Njeri\tKinuthia\t8\tANW 129\tRoots Junior Secondary\nAnotherFirst\tLastName\t5\tANW 130\tSpringfield Primary"}
                value={pasted}
                onChange={e => setPasted(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <button className="btn btn-secondary" onClick={() => { reset(); onClose(); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleParse} disabled={!pasted.trim()}>
                <ClipboardPaste size={15} /> Preview Import
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Preview ── */}
        {rows && !results && (
          <>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <span className="badge badge-green">{validCount} ready</span>
              {invalidCount > 0 && <span className="badge badge-red">{invalidCount} with errors (will be skipped)</span>}
            </div>

            <div className="card card-p0" style={{ maxHeight: 360, overflowY: 'auto', marginBottom: 16 }}>
              <table style={{ fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Class</th>
                    <th>Ref No</th>
                    <th>School</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.line} style={{ background: r.errors ? 'rgba(239,68,68,0.04)' : undefined }}>
                      <td style={{ color: 'var(--text-muted)' }}>{r.line}</td>
                      {r.errors ? (
                        <>
                          <td colSpan={5} style={{ color: 'var(--brand-danger)', fontSize: 12 }}>
                            {r.raw.slice(0, 60)}… &nbsp;— {r.errors.join(', ')}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="font-bold">{r.first_name} {r.last_name}</td>
                          <td>{r.class_name}</td>
                          <td>{r.ref_no}</td>
                          <td>{r._schoolName}</td>
                        </>
                      )}
                      <td>
                        {r.errors
                          ? <AlertCircle size={15} color="var(--brand-danger)" />
                          : <CheckCircle2 size={15} color="var(--brand-success)" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="btn btn-secondary" onClick={reset}>← Paste Again</button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary" onClick={() => { reset(); onClose(); }}>Cancel</button>
                <button className="btn btn-primary" onClick={handleImport} disabled={importing || validCount === 0}>
                  {importing ? 'Importing…' : <><Upload size={15} /> Import {validCount} Student{validCount !== 1 ? 's' : ''}</>}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Step 3: Results ── */}
        {results && (
          <>
            <div style={{ marginBottom: 16 }}>
              <div className="badge badge-green" style={{ marginRight: 8 }}>{results.filter(r => r.ok).length} imported successfully</div>
              {results.filter(r => !r.ok).length > 0 && (
                <div className="badge badge-red">{results.filter(r => !r.ok).length} failed</div>
              )}
            </div>
            <div className="card card-p0" style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 16 }}>
              <table style={{ fontSize: 13 }}>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i}>
                      <td>{r.ok ? <CheckCircle2 size={15} color="var(--brand-success)" /> : <AlertCircle size={15} color="var(--brand-danger)" />}</td>
                      <td className="font-bold">{r.name}</td>
                      <td style={{ color: r.ok ? 'var(--brand-success)' : 'var(--brand-danger)', fontSize: 12 }}>
                        {r.ok ? 'Saved' : r.msg}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => { reset(); onClose(); }}>Done</button>
            </div>
          </>
        )}

      </div>
    </Modal>
  );
}
