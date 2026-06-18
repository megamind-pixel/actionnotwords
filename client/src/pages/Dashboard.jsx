import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, School, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight, GraduationCap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '../lib/api';

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState('class'); // 'class' or 'level'
  const navigate = useNavigate();

  useEffect(() => {
    api.getOverview()
      .then(ov => setOverview(ov))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  // Vital Signs
  const vitalSigns = [
    { label: 'Total Sponsorships', value: overview?.total_students ?? 0, color: 'blue', icon: Users },
    { label: 'Academic Health', value: overview?.overall_mean != null ? `${overview.overall_mean}%` : '—', color: 'green', icon: TrendingUp },
    { label: 'At-Risk Alert', value: overview?.at_risk ?? 0, color: 'red', icon: AlertTriangle, sub: 'Below 50%' },
    { label: 'Partner Schools', value: overview?.total_schools ?? 0, color: 'amber', icon: School },
  ];

  // Group Performance (Status per Grade)
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

  const chartData = chartView === 'class' ? classPerformance : groupPerformance;

  return (
    <div className="fade-in">
      <div className="section-header mb-20">
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Program Overview</h2>
          <p className="text-muted text-sm">Key vital signs and academic health</p>
        </div>
      </div>

      {/* ── VITAL SIGNS ── */}
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
        {/* ── THE MOVEMENT (TRENDS) ── */}
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

        {/* ── CLASS/LEVEL PERFORMANCE GRAPH ── */}
        <div className="card">
          <div className="section-header mb-16">
            <div>
              <div className="section-title">Cohort Performance</div>
              <div className="section-sub text-muted">Average mean score comparison</div>
            </div>
            <div className="tabs-mini">
              <button className={`tab-btn ${chartView === 'class' ? 'active' : ''}`} onClick={() => setChartView('class')}>Class</button>
              <button className={`tab-btn ${chartView === 'level' ? 'active' : ''}`} onClick={() => setChartView('level')}>Level</button>
            </div>
          </div>
          <div style={{ height: 280, width: '100%' }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600 }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip 
                    cursor={{ fill: 'var(--g1)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="custom-tooltip" style={{ background: '#fff', padding: '10px 14px', borderRadius: 12, boxShadow: 'var(--sh2)', border: 'none' }}>
                            <div className="text-bold mb-4" style={{ fontSize: 13 }}>{data.name}</div>
                            <div className="flex-center gap-8">
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: data.color }} />
                              <span style={{ fontSize: 16, fontWeight: 800 }}>{data.score}%</span>
                            </div>
                            {data.count !== undefined && <div className="text-xs text-muted mt-4">{data.count} Students</div>}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={chartView === 'class' ? 24 : 40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="empty-state"><p>No data available for this view</p></div>}
          </div>
        </div>
      </div>

      <div className="card mb-24">
        <div className="section-header mb-16">
          <div>
            <div className="section-title">Grade Level Summary</div>
            <div className="section-sub text-muted">Detailed breakdown and enrollment</div>
          </div>
        </div>
        <div className="grid-3" style={{ gap: 24 }}>
          {groupPerformance.length > 0 ? (
            groupPerformance.map(gp => (
              <div key={gp.name} className="performance-item" style={{ padding: '16px', background: 'var(--fcfcfc)', borderRadius: 12, border: '1px solid var(--g1)' }}>
                <div className="flex-between mb-10">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ padding: 8, background: 'var(--g1)', borderRadius: 8 }}>
                      <GraduationCap size={16} color="var(--g4)" />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{gp.name}</div>
                      <div className="text-xs text-muted">{gp.count} Students</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: gp.color }}>{gp.score}%</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: gp.color, textTransform: 'uppercase' }}>
                      {gp.score >= 70 ? 'Excellent' : gp.score >= 50 ? 'Steady' : 'Critical'}
                    </div>
                  </div>
                </div>
                <div className="progress" style={{ height: 6, background: 'var(--g1)', overflow: 'hidden' }}>
                  <div className="progress-fill" style={{ width: `${gp.score}%`, backgroundColor: gp.color, borderRadius: 3 }} />
                </div>
              </div>
            ))
          ) : <div className="empty-state"><p>No group data yet</p></div>}
        </div>
      </div>
    </div>
  );
}
