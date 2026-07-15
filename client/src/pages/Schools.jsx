import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, School } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';

const TYPES = {
  ecde: 'ECDE Centre',
  primary: 'Primary School',
  junior_secondary: 'Junior Secondary School (Grades 7–9)',
  senior_secondary: 'Senior Secondary School (Grades 10–12)',
  secondary: 'Secondary School (8-4-4)',
  mixed: 'Mixed (Pri+Sec)',
  tvet: 'TVET / Vocational College',
  tertiary: 'Tertiary/University',
};
const CURRICULA = { cbc: 'CBC', '844': '8-4-4', both: 'Both (Transition)' };

function SchoolForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '', location: '', type: 'primary', curriculum: 'cbc',
    contact_name: '', contact_phone: '', ...initial,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    if (!form.name || !form.location) { toast.error('Name and location required'); return; }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="form-group">
        <label className="form-label">School Name *</label>
        <input
          className="form-input"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="Nairobi Primary School"
          required
        />
      </div>

      <div className="grid-2 mb-16">
        <div className="form-group">
          <label className="form-label">County / Location *</label>
          <input
            className="form-input"
            value={form.location}
            onChange={e => set('location', e.target.value)}
            placeholder="Nairobi"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">School Type</label>
          <select className="form-select" value={form.type} onChange={e => set('type', e.target.value)}>
            {Object.entries(TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      <div className="grid-2 mb-16">
        <div className="form-group">
          <label className="form-label">Curriculum</label>
          <select className="form-select" value={form.curriculum} onChange={e => set('curriculum', e.target.value)}>
            {Object.entries(CURRICULA).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Principal / Contact</label>
          <input
            className="form-input"
            value={form.contact_name}
            onChange={e => set('contact_name', e.target.value)}
            placeholder="Mr. Kamau"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Phone</label>
        <input
          className="form-input"
          value={form.contact_phone}
          onChange={e => set('contact_phone', e.target.value)}
          placeholder="+254 7xx xxx xxx"
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save School'}
        </button>
      </div>
    </form>
  );
}

export default function Schools() {
  const { admin } = useAuth();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | school_object
  const [delId, setDelId] = useState(null);

  async function load() {
    try {
      const d = await api.getSchools();
      setSchools(d);
    } catch {
      toast.error('Failed to load schools');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function saveSchool(form) {
    if (modal?.id) {
      const updated = await api.updateSchool(modal.id, form);
      setSchools(s => s.map(x => x.id === modal.id ? updated : x));
      toast.success('School updated');
    } else {
      const created = await api.createSchool(form);
      setSchools(s => [...s, created]);
      toast.success('School added!');
    }
  }

  async function deleteSchool() {
    try {
      await api.deleteSchool(delId);
      setSchools(s => s.filter(x => x.id !== delId));
      toast.success('School deleted');
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="flex-between mb-20">
        <div>
          <div className="section-title">Partner Schools</div>
          <div className="text-sm text-muted">
            {schools.length} school{schools.length !== 1 ? 's' : ''} registered
          </div>
        </div>
        {admin?.role !== 'viewer' && (
          <button className="btn btn-primary btn-sm" onClick={() => setModal('add')}>
            <Plus size={14} /> Add School
          </button>
        )}
      </div>

      {/* Empty state */}
      {schools.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <School strokeWidth={1.2} />
            <p>No schools added yet.</p>
            {admin?.role !== 'viewer' && (
              <button className="btn btn-primary btn-sm" onClick={() => setModal('add')}>
                Add First School
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid-3">
          {schools.map(sch => (
            <div key={sch.id} className="card">
              <div className="flex-between mb-12">
                <div className="stat-icon blue" style={{ margin: 0 }}>
                  <School size={17} strokeWidth={2} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setModal(sch)}
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => setDelId(sch.id)}
                  >
                    <Trash2 size={12} /> Del
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 3 }}>{sch.name}</div>
              <div className="text-sm text-muted mb-8">
                {sch.location} · {TYPES[sch.type] || sch.type}
              </div>
              <span className="badge badge-blue" style={{ marginBottom: 12, display: 'inline-block' }}>
                {CURRICULA[sch.curriculum] || sch.curriculum}
              </span>
              <div className="divider" />
              {sch.contact_name && <div className="text-sm">Contact: {sch.contact_name}</div>}
              {sch.contact_phone && <div className="text-sm text-muted">{sch.contact_phone}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.id ? 'Edit School' : 'Add School'}
      >
        <SchoolForm
          initial={modal?.id ? modal : {}}
          onSave={saveSchool}
          onClose={() => setModal(null)}
        />
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!delId}
        onClose={() => setDelId(null)}
        onConfirm={deleteSchool}
        title="Delete School"
        message="Delete this school? Students associated with it will be unlinked."
        danger
      />
    </div>
  );
}
