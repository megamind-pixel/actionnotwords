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
      {/* ── VITAL SIGNS ── */}
      <div className="grid-4 mb-32">
        {vitalSigns.map(({ label, value, color, icon: Icon, sub }) => (
          <div key={label} className="card stat-card">
            <div className={`stat-icon ${color}`}><Icon size={20} /></div>
            <div>
              <div className="stat-num">{value}</div>
              <div className="stat-label">{label}</div>
              {sub && <div style={{ fontSize: 11, color: 'var(--brand-danger)', marginTop: 4, fontWeight: 600 }}>{sub}</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2 mb-32">
        {/* ── THE MOVEMENT (TRENDS) ── */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="flex-between mb-24">
            <div>
              <div className="section-title">Academic Movement</div>
              <div className="section-sub">Cohort trajectory this term</div>
            </div>
            <div className="flex-center gap-8">
               <span className="badge badge-green">↑ {overview?.improving} Improved</span>
               <span className="badge badge-red">↓ {overview?.declining} Declined</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, flex: 1 }}>
             <div style={{ background: '#F0FDF4', borderRadius: 'var(--radius-md)', padding: 16, border: '1px solid #DCFCE7' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ArrowUpRight size={14} /> Top Gainers
                </div>
                {overview?.focus_lists?.improved?.length > 0 ? (
                  overview.focus_lists.improved.map(s => (
                    <div key={s.id} onClick={() => navigate(`/students?id=${s.id}`)} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, cursor: 'pointer' }}>
                      <span className="text-sm font-semibold">{s.name}</span>
                      <span style={{ color: 'var(--brand-success)', fontWeight: 800, fontSize: 12 }}>+{s.diff}%</span>
                    </div>
                  ))
                ) : <div className="text-xs text-muted">No data</div>}
             </div>

             <div style={{ background: '#FEF2F2', borderRadius: 'var(--radius-md)', padding: 16, border: '1px solid #FEE2E2' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ArrowDownRight size={14} /> At Risk
                </div>
                {overview?.focus_lists?.declined?.length > 0 ? (
                  overview.focus_lists.declined.map(s => (
                    <div key={s.id} onClick={() => navigate(`/students?id=${s.id}`)} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, cursor: 'pointer' }}>
                      <span className="text-sm font-semibold">{s.name}</span>
                      <span style={{ color: 'var(--brand-danger)', fontWeight: 800, fontSize: 12 }}>{s.diff}%</span>
                    </div>
                  ))
                ) : <div className="text-xs text-muted">No data</div>}
             </div>
          </div>

          <div className="flex-center gap-12 mt-20">
            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => navigate('/students?trend=up')}>View All Improving</button>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => navigate('/students?trend=down')}>View All Declining</button>
          </div>
        </div>

        {/* ── CLASS/LEVEL PERFORMANCE GRAPH ── */}
        <div className="card">
          <div className="flex-between mb-24">
            <div>
              <div className="section-title">Cohort Performance</div>
              <div className="section-sub">Average mean score comparison</div>
            </div>
            <div className="tabs-mini">
              <button className={`tab-btn ${chartView === 'class' ? 'active' : ''}`} onClick={() => setChartView('class')}>Class</button>
              <button className={`tab-btn ${chartView === 'level' ? 'active' : ''}`} onClick={() => setChartView('level')}>Level</button>
            </div>
          </div>
          <div style={{ height: 260, width: '100%' }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500, fill: 'var(--text-muted)' }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <Tooltip 
                    cursor={{ fill: '#F1F5F9' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="card" style={{ padding: '12px', boxShadow: 'var(--shadow-lg)', border: 'none' }}>
                            <div className="font-bold mb-4" style={{ fontSize: 13 }}>{data.name}</div>
                            <div className="flex-center gap-8">
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: data.color }} />
                              <span style={{ fontSize: 16, fontWeight: 800 }}>{data.score}%</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]} barSize={chartView === 'class' ? 20 : 36}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="empty-state">No data available</div>}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="mb-24">
          <div className="section-title">Grade Level Summary</div>
          <div className="section-sub">Detailed breakdown and enrollment metrics</div>
        </div>
        <div className="grid-3" style={{ gap: 24 }}>
          {groupPerformance.length > 0 ? (
            groupPerformance.map(gp => (
              <div key={gp.name} className="performance-item" style={{ padding: '20px', background: 'var(--bg-app)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex-between mb-16">
                  <div className="flex-center gap-12">
                    <div style={{ padding: 10, background: '#fff', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
                      <GraduationCap size={18} color="var(--brand-accent)" />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{gp.name}</div>
                      <div className="text-xs text-muted">{gp.count} Students</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: gp.color }}>{gp.score}%</div>
                    <div className="badge" style={{ background: `${gp.color}15`, color: gp.color, fontSize: 9 }}>
                      {gp.score >= 70 ? 'Excellent' : gp.score >= 50 ? 'Steady' : 'Critical'}
                    </div>
                  </div>
                </div>
                <div className="progress" style={{ height: 8, background: '#E2E8F0', borderRadius: 4 }}>
                  <div className="progress-fill" style={{ width: `${gp.score}%`, backgroundColor: gp.color }} />
                </div>
              </div>
            ))
          ) : <div className="empty-state">No data available</div>}
        </div>
      </div>
    </div>
  );
}
