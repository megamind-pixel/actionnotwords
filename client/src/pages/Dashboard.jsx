import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, School, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight, GraduationCap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '../lib/api';

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getOverview()
      .then(ov => setOverview(ov))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  // Option 1: Vital Signs
  const vitalSigns = [
    { label: 'Total Sponsorships', value: overview?.total_students ?? 0, color: 'blue', icon: Users },
    { label: 'Academic Health', value: overview?.overall_mean != null ? `${overview.overall_mean}%` : '—', color: 'green', icon: TrendingUp },
    { label: 'At-Risk Alert', value: overview?.at_risk ?? 0, color: 'red', icon: AlertTriangle, sub: 'Below 50%' },
    { label: 'Partner Schools', value: overview?.total_schools ?? 0, color: 'amber', icon: School },
  ];

  // Option 2: Group Performance (Status per Grade)
  const groupPerformance = Object.entries(overview?.level_progress || {}).map(([k, v]) => ({
    name: k.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    score: v,
    count: overview?.by_level[k] || 0,
    color: v >= 70 ? 'var(--green)' : v >= 50 ? 'var(--amber)' : 'var(--red)'
  }));

  const classPerformance = Object.entries(overview?.class_progress || {}).map(([k, v]) => ({
    name: k,
    score: v,
    color: v >= 70 ? 'var(--green)' : v >= 50 ? 'var(--amber)' : 'var(--red)'
  })).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  return (
    <div className="fade-in">
      <div className="section-header mb-20">
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Program Overview</h2>
          <p className="text-muted text-sm">Key vital signs and academic health</p>
        </div>
      </div>

      {/* ── OPTION 1: VITAL SIGNS ── */}
      <div className="grid-4 mb-24">
        {vitalSigns.map(({ label, value, color, icon: Icon, sub }) => (
          <div key={label} className={`stat-card ${color}`} style={{ padding: '20px 24px' }}>
            <div className={`stat-icon ${color}`}><Icon /></div>
            <div className="stat-num" style={{ fontSize: 32 }}>{value}</div>
            <div className="stat-label" style={{ fontSize: 13, fontWeight: 600, color: 'var(--g5)' }}>{label}</div>
            {sub && <div style={{ fontSize: 10, color: 'var(--red)', marginTop: 4, fontWeight: 700, textTransform: 'uppercase' }}>{sub}</div>}
          </div>
        ))}
      </div>

      <div className="grid-2 mb-24">
        {/* ── OPTION 3: THE MOVEMENT (TRENDS) ── */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="section-header" style={{ marginBottom: 20 }}>
            <div>
              <div className="section-title">The Movement</div>
              <div className="section-sub text-muted">Academic trajectory across the cohort</div>
            </div>
            <div className="flex-center gap-8">
               <span className="badge badge-green">↑ {overview?.improving} Improved</span>
               <span className="badge badge-red">↓ {overview?.declining} Declined</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, flex: 1 }}>
             <div className="trend-list-panel" style={{ background: 'var(--green-l)', borderRadius: 'var(--r)', padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--green)', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ArrowUpRight size={14} /> Top Gainers
                </div>
                {overview?.focus_lists?.improved?.length > 0 ? (
                  overview.focus_lists.improved.map(s => (
                    <div key={s.id} onClick={() => navigate(`/students?id=${s.id}`)} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, cursor: 'pointer' }}>
                      <span className="text-sm text-bold">{s.name}</span>
                      <span style={{ color: 'var(--green)', fontWeight: 800, fontSize: 12 }}>+{s.diff}%</span>
                    </div>
                  ))
                ) : <div className="text-xs text-muted">No data available</div>}
             </div>

             <div className="trend-list-panel" style={{ background: 'var(--red-l)', borderRadius: 'var(--r)', padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--red)', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ArrowDownRight size={14} /> Critical Attention
                </div>
                {overview?.focus_lists?.declined?.length > 0 ? (
                  overview.focus_lists.declined.map(s => (
                    <div key={s.id} onClick={() => navigate(`/students?id=${s.id}`)} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, cursor: 'pointer' }}>
                      <span className="text-sm text-bold">{s.name}</span>
                      <span style={{ color: 'var(--red)', fontWeight: 800, fontSize: 12 }}>{s.diff}%</span>
                    </div>
                  ))
                ) : <div className="text-xs text-muted">No data available</div>}
             </div>
          </div>

          <div className="flex-center gap-12 mt-20">
            <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => navigate('/students?trend=up')}>View All Improving</button>
            <button className="btn btn-ghost btn-sm" style={{ flex: 1, color: 'var(--red)' }} onClick={() => navigate('/students?trend=down')}>View All Declining</button>
          </div>
        </div>

        {/* ── CLASS PERFORMANCE GRAPH ── */}
        <div className="card">
          <div className="section-title mb-16">Average Performance per Class</div>
          <div style={{ height: 280, width: '100%' }}>
            {classPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600 }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip 
                    cursor={{ fill: 'var(--g1)' }}
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]} barSize={30}>
                    {classPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="empty-state"><p>No class data yet</p></div>}
          </div>
        </div>

        {/* ── OPTION 2: GROUP STATUS ── */}
        <div className="card">
          <div className="section-title mb-16">Grade Level Summary</div>
          <div style={{ maxHeight: 280, overflowY: 'auto', paddingRight: 8 }}>
            {groupPerformance.length > 0 ? (
              groupPerformance.map(gp => (
                <div key={gp.name} className="mb-16">
                  <div className="flex-between mb-6">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <GraduationCap size={16} color="var(--g4)" />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{gp.name}</span>
                      <span className="text-xs text-muted">({gp.count} students)</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: gp.color }}>{gp.score}%</span>
                  </div>
                  <div className="progress" style={{ height: 6, background: 'var(--g1)' }}>
                    <div className="progress-fill" style={{ width: `${gp.score}%`, backgroundColor: gp.color }} />
                  </div>
                </div>
              ))
            ) : <div className="empty-state"><p>No group data yet</p></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
