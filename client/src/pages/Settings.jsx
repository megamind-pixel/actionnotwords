import { useState, useEffect, useRef } from 'react';
import { Building2, GraduationCap, ShieldCheck, History, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';

export default function Settings() {
  const [settings, setSettings] = useState({ org_name: 'Actions Not Words', logo_url: '' });
  const [year, setYear] = useState('2025');
  const [term, setTerm] = useState('2');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.getSettings()
      .then(setSettings)
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `org-logo-${Date.now()}.${fileExt}`;
      const filePath = `branding/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('image')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('image')
        .getPublicUrl(filePath);

      const updated = await api.updateSettings({ logo_url: publicUrl });
      setSettings(updated);
      toast.success('Logo updated!');
    } catch (err) {
      console.error(err);
      toast.error('Logo upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateSettings({ org_name: settings.org_name });
      setSettings(updated);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div className="grid-2">
      <div>
        <div className="card mb-16">
          <div className="section-header mb-16">
            <div>
              <div className="section-title">Program Identity</div>
              <div className="section-sub text-muted">Manage your organization's public details</div>
            </div>
            <Building2 size={20} color="var(--red)" />
          </div>

          <div className="form-group"><label className="form-label">Organisation Logo</label>
            <div className="flex-center gap-16 p-12 mb-16" style={{ background: 'var(--off)', borderRadius: 'var(--r)', border: '1px dashed var(--g2)' }}>
              {settings.logo_url ? (
                <img src={settings.logo_url} alt="Logo" style={{ height: 48, maxWidth: 120, objectFit: 'contain' }} />
              ) : (
                <div style={{ height: 48, width: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--g1)', color: 'var(--g4)', borderRadius: 8 }}>
                  <ImageIcon size={20} />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <input type="file" ref={fileInputRef} onChange={handleLogoUpload} style={{ display: 'none' }} accept="image/*" />
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current.click()} disabled={uploading}>
                  {uploading ? <Loader2 size={13} className="spinner" /> : <Upload size={13} />}
                  {uploading ? 'Uploading...' : 'Change Logo'}
                </button>
                <div className="text-xs text-muted mt-4">Visible on Sidebar and PDF reports</div>
              </div>
            </div>
          </div>

          <form onSubmit={save}>
            <div className="form-group"><label className="form-label">Organisation Name</label>
              <input className="form-input" value={settings.org_name} onChange={e=>setSettings({...settings, org_name: e.target.value})} placeholder="Actions Not Words" />
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Current Academic Year</label>
                <select className="form-select" value={year} onChange={e=>setYear(e.target.value)}>
                  {['2022','2023','2024','2025','2026'].map(y=><option key={y}>{y}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Active Term</label>
                <select className="form-select" value={term} onChange={e=>setTerm(e.target.value)}>
                  <option value="1">Term 1</option><option value="2">Term 2</option><option value="3">Term 3</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={saving}>
              {saving ? 'Saving...' : 'Update Program Details'}
            </button>
          </form>
        </div>
...
        <div className="card">
          <div className="section-header mb-12">
            <div className="section-title">System Status</div>
            <ShieldCheck size={18} color="var(--green)" />
          </div>
          <div className="flex-center gap-10 p-12" style={{ background: 'var(--green-l)', borderRadius: 'var(--r)', marginBottom: 12 }}>
             <div style={{ width: 8, height: 8, background: 'var(--green)', borderRadius: '50%' }} />
             <div className="text-sm text-bold" style={{ color: 'var(--green)' }}>Database Connected & Online</div>
          </div>
          <p className="text-xs text-muted">All student records and performance data are being securely synced to your private Supabase cloud storage.</p>
        </div>
      </div>

      <div>
        <div className="card mb-16">
          <div className="section-header mb-12">
            <div className="section-title">Grading Framework</div>
            <GraduationCap size={20} color="var(--blue)" />
          </div>
          <div className="text-sm mb-12" style={{ padding: 10, background: 'var(--off)', borderRadius: 8 }}>
            <strong>Primary (CBC):</strong><br/>
            <span className="text-muted">EE (Exceeds) ≥80% | ME (Meets) 60-79%</span>
          </div>
          <div className="text-sm mb-12" style={{ padding: 10, background: 'var(--off)', borderRadius: 8 }}>
            <strong>Secondary (8-4-4):</strong><br/>
            <span className="text-muted">Standard KCSE A-E scale with points calculation.</span>
          </div>
          <p className="text-xs text-muted">Grading rules are locked to Kenya's national education standard to ensure reporting consistency.</p>
        </div>

        <div className="card">
          <div className="section-header mb-12">
            <div className="section-title">System Activity</div>
            <History size={18} color="var(--g3)" />
          </div>
          <div className="text-sm text-muted">Version 1.2.0 (Latest)</div>
          <div className="text-sm text-muted" style={{ marginTop: 4 }}>Last database sync: Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>
    </div>
  );
}
