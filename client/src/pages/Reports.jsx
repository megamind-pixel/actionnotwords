import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid, Cell, Legend, 
  PieChart, Pie, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, ScatterChart, Scatter, ZAxis,
  AreaChart, Area
} from 'recharts';
import { 
  Users, TrendingUp, AlertTriangle, School, 
  Download, FileText, RefreshCw, Filter, 
  Search, ChevronDown, Award, ArrowUpRight, 
  ArrowDownRight, BrainCircuit, Activity, 
  GraduationCap, Target, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

// ── CUSTOM COMPONENTS ──

const PremiumCard = ({ title, subtitle, icon: Icon, children, className = "" }) => (
  <div className={`card fade-in ${className}`} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <div className="section-header mb-20">
      <div>
        <div className="section-title" style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.3px' }}>{title}</div>
        {subtitle && <div className="section-sub">{subtitle}</div>}
      </div>
      {Icon && <div style={{ color: 'var(--g3)' }}><Icon size={18} strokeWidth={2.5} /></div>}
    </div>
    <div style={{ flex: 1 }}>{children}</div>
  </div>
);

const KPICard = ({ label, value, subValue, trend, trendValue, icon: Icon, color }) => (
  <div className={`stat-card ${color} premium-kpi`}>
    <div className="flex-between mb-12">
      <div className={`stat-icon ${color}`}><Icon size={18} /></div>
      {trend && (
        <div className={`badge ${trend === 'up' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 10 }}>
          {trend === 'up' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          {trendValue}
        </div>
      )}
    </div>
    <div className="stat-num" style={{ fontSize: 28, letterSpacing: '-1px' }}>{value}</div>
    <div className="stat-label" style={{ fontSize: 12, fontWeight: 600, opacity: 0.8 }}>{label}</div>
    {subValue && <div className="text-xs text-muted mt-4">{subValue}</div>}
  </div>
);

export default function Reports() {
  const [overview, setOverview] = useState(null);
  const [schoolReport, setSchoolReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    school: '',
    level: '',
    year: '2025',
    term: ''
  });

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    
    try {
      const [ov, sr] = await Promise.all([api.getOverview(), api.getSchoolReport()]);
      setOverview(ov);
      setSchoolReport(sr);
    } catch (err) {
      toast.error('Failed to sync report data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ── PREPARE DATA ──

  const lvlData = useMemo(() => 
    Object.entries(overview?.by_level || {}).map(([k, v]) => ({
      name: k.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase()), 
      value: v,
      fill: k === 'secondary' ? 'var(--red)' : k === 'junior_secondary' ? 'var(--amber)' : 'var(--blue)'
    })), [overview]);

  const genderData = useMemo(() => 
    Object.entries(overview?.gender_means || {}).filter(([_, v]) => v !== null).map(([k, v]) => ({
      name: k, score: v
    })), [overview]);

  const historyData = useMemo(() => overview?.history || [], [overview]);

  const subjectRadarData = useMemo(() => 
    Object.entries(overview?.subject_means || {}).map(([k, v]) => ({
      subject: k.split(' ').slice(0, 1)[0],
      A: v,
      fullMark: 100
    })).slice(0, 7), [overview]);

  const gradeDistData = useMemo(() => {
    if (!overview?.grade_distribution) return [];
    const order = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E'];
    const cbcOrder = ['EE', 'ME', 'AE', 'BE'];
    
    return [
      ...order.map(g => ({ name: g, count: overview.grade_distribution[g] || 0, type: '8-4-4' })),
      ...cbcOrder.map(g => ({ name: g, count: overview.grade_distribution[g] || 0, type: 'CBC' }))
    ].filter(g => g.count > 0);
  }, [overview]);

  const filteredSchools = useMemo(() => {
    return schoolReport.filter(s => 
      s.school.name.toLowerCase().includes(search.toLowerCase()) ||
      s.school.location.toLowerCase().includes(search.toLowerCase())
    );
  }, [schoolReport, search]);

  const topSchools = useMemo(() => 
    schoolReport.slice(0, 5).map(s => ({
      name: s.school.name,
      score: s.mean_score || 0
    })), [schoolReport]);

  // ── AI INSIGHTS GENERATION ──
  const insights = useMemo(() => {
    if (!overview) return [];
    const list = [];
    if (overview.improving > overview.declining) 
      list.push({ text: `Performance is trending UP. ${overview.improving} students showed significant growth this term.`, type: 'success' });
    if (overview.at_risk > 0)
      list.push({ text: `Intervention needed: ${overview.at_risk} students are currently falling below the 50% threshold.`, type: 'warning' });
    if (overview.avg_growth > 5)
      list.push({ text: `Academic ROI is exceptional at +${overview.avg_growth}%. Programs are delivering measurable value.`, type: 'info' });
    
    // Find top subject
    const topSub = Object.entries(overview.subject_means || {}).sort((a,b) => b[1]-a[1])[0];
    if (topSub) list.push({ text: `Cohort strength identified in ${topSub[0]} with a mean score of ${topSub[1]}%.`, type: 'info' });
    
    return list;
  }, [overview]);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      {/* ── HEADER ── */}
      <div className="flex-between mb-24 no-print">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>Performance Analytics</h2>
          <p className="text-muted text-sm">Comprehensive insights and academic growth metrics</p>
        </div>
        <div className="flex-center gap-10">
          <button className="btn btn-secondary" onClick={() => loadData(true)} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? 'spinner' : ''} />
            {refreshing ? 'Syncing...' : 'Refresh'}
          </button>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <Download size={14} /> Export PDF
          </button>
          <button className="btn btn-primary">
            <Target size={14} /> Generate Report
          </button>
        </div>
      </div>

      {/* ── KPI GRID ── */}
      <div className="grid-4 mb-24 no-print">
        <KPICard 
          label="Total Students" 
          value={overview?.total_students ?? 0} 
          subValue="Active sponsorships"
          icon={Users} 
          color="blue"
          trend="up"
          trendValue="+12%"
        />
        <KPICard 
          label="Overall Mean" 
          value={overview?.overall_mean ? `${overview.overall_mean}%` : '—'} 
          subValue="Cohort average score"
          icon={TrendingUp} 
          color="green"
          trend={Number(overview?.avg_growth) >= 0 ? 'up' : 'down'}
          trendValue={`${overview?.avg_growth}%`}
        />
        <KPICard 
          label="On Track" 
          value={overview?.on_track ?? 0} 
          subValue="Scoring above 70%"
          icon={Award} 
          color="blue"
        />
        <KPICard 
          label="At Risk" 
          value={overview?.at_risk ?? 0} 
          subValue="Scoring below 50%"
          icon={AlertTriangle} 
          color="red"
        />
      </div>

      {/* ── FILTERS ── */}
      <div className="card mb-24 no-print" style={{ padding: '12px 20px' }}>
        <div className="flex-center gap-16 flex-wrap">
          <div className="flex-center gap-8 text-sm font-bold" style={{ color: 'var(--g4)' }}>
            <Filter size={14} /> Filters:
          </div>
          <select className="form-select" style={{ width: 'auto', minWidth: 140 }} value={filters.school} onChange={e => setFilters({...filters, school: e.target.value})}>
            <option value="">All Schools</option>
            {schoolReport.map(s => <option key={s.school.id} value={s.school.id}>{s.school.name}</option>)}
          </select>
          <select className="form-select" style={{ width: 'auto' }} value={filters.level} onChange={e => setFilters({...filters, level: e.target.value})}>
            <option value="">All Levels</option>
            <option value="cbc">CBC System</option>
            <option value="844">8-4-4 System</option>
          </select>
          <select className="form-select" style={{ width: 'auto' }} value={filters.year} onChange={e => setFilters({...filters, year: e.target.value})}>
            <option>2024</option><option>2025</option><option>2026</option>
          </select>
          <div style={{ marginLeft: 'auto' }} className="flex-center gap-10">
            <div className="search-bar" style={{ height: 32, minWidth: 180 }}>
              <Search />
              <input placeholder="Search schools..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilters({school:'',level:'',year:'2025',term:''}); }}>Reset</button>
          </div>
        </div>
      </div>

      {/* ── TOP ROW CHARTS ── */}
      <div className="grid-2 mb-24">
        <PremiumCard title="Performance Trajectory" subtitle="Overall mean score trends across terms" icon={Activity}>
          <div style={{ height: 280, width: '100%' }}>
            {historyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--red)" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="var(--red)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--g1)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600 }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: 'var(--sh2)', fontSize: 12 }}
                    cursor={{ stroke: 'var(--red)', strokeWidth: 1 }}
                  />
                  <Area type="monotone" dataKey="score" stroke="var(--red)" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" dot={{ r: 4, fill: 'var(--red)', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="empty-state">No trend data available</div>}
          </div>
        </PremiumCard>

        <PremiumCard title="Subject Proficiency" subtitle="Radar analysis of core subjects" icon={Target}>
          <div style={{ height: 280, width: '100%' }}>
            {subjectRadarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={subjectRadarData}>
                  <PolarGrid stroke="var(--g2)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 700 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Mean Score" dataKey="A" stroke="var(--blue)" fill="var(--blue)" fillOpacity={0.4} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: 'var(--sh2)', fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            ) : <div className="empty-state">No subject data available</div>}
          </div>
        </PremiumCard>
      </div>

      {/* ── MIDDLE ROW: INSIGHTS & ROI ── */}
      <div className="grid-3 mb-24">
        <PremiumCard title="Program ROI" subtitle="Value Added metric" icon={Award}>
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div className="flex-center" style={{ justifyContent: 'center', gap: 10 }}>
              <div style={{ fontSize: 42, fontWeight: 900, color: Number(overview?.avg_growth) >= 0 ? 'var(--green)' : 'var(--red)', letterSpacing: '-2px' }}>
                {Number(overview?.avg_growth) > 0 ? '+' : ''}{overview?.avg_growth}%
              </div>
              <div className={`badge ${Number(overview?.avg_growth) >= 0 ? 'badge-green' : 'badge-red'}`} style={{ padding: '4px 10px' }}>
                {Number(overview?.avg_growth) >= 0 ? 'Improving' : 'Declining'}
              </div>
            </div>
            <div className="text-muted text-sm mt-8" style={{ maxWidth: 220, margin: '0 auto' }}>
              Average movement in student performance since program enrollment.
            </div>
            <div className="progress mt-24" style={{ height: 8, background: 'var(--g1)' }}>
              <div className="progress-fill green" style={{ width: `${Math.min(100, Math.max(0, 50 + Number(overview?.avg_growth) * 2))}%` }} />
            </div>
          </div>
        </PremiumCard>

        <PremiumCard title="AI Intelligence" subtitle="Automated cohort insights" icon={BrainCircuit} className="no-print">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {insights.map((insight, idx) => (
              <div key={idx} className={`alert alert-${insight.type}`} style={{ padding: '8px 12px', borderRadius: 12 }}>
                <div style={{ fontSize: 11.5, fontWeight: 600 }}>{insight.text}</div>
              </div>
            ))}
          </div>
        </PremiumCard>

        <PremiumCard title="Gender Performance" subtitle="Male vs Female Mean" icon={BarChart3}>
           <div style={{ height: 200, width: '100%', marginTop: 20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={genderData} barSize={40}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700 }} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ fill: 'var(--g1)' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: 'var(--sh2)', fontSize: 12 }} />
                <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'Male' ? 'var(--blue)' : 'var(--red)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
           </div>
        </PremiumCard>
      </div>

      {/* ── SCHOOL TABLE ── */}
      <div className="card card-p0 mb-24">
        <div className="flex-between p-20">
          <div>
            <div className="section-title">School Rankings</div>
            <div className="section-sub">Detailed breakdown by institution</div>
          </div>
          <button className="btn btn-ghost btn-sm">
            <Download size={13} /> CSV
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>School Name</th>
                <th>Location</th>
                <th>Sponsorships</th>
                <th>Cohort Mean</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Performance Bar</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchools.map((s, i) => (
                <tr key={s.school.id}>
                  <td className="text-muted text-bold" style={{ width: 60 }}>#{i + 1}</td>
                  <td>
                    <div className="text-bold">{s.school.name}</div>
                  </td>
                  <td className="text-sm text-muted">{s.school.location}</td>
                  <td className="text-bold">{s.student_count}</td>
                  <td className="text-bold" style={{ color: (s.mean_score || 0) >= 70 ? 'var(--green)' : (s.mean_score || 0) >= 50 ? 'var(--amber)' : 'var(--red)' }}>
                    {s.mean_score ? `${s.mean_score}%` : '—'}
                  </td>
                  <td>
                    <span className={`badge ${(s.mean_score || 0) >= 70 ? 'badge-green' : (s.mean_score || 0) >= 50 ? 'badge-amber' : 'badge-red'}`}>
                      {(s.mean_score || 0) >= 70 ? 'Excellent' : (s.mean_score || 0) >= 50 ? 'Steady' : 'At Risk'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="flex-center gap-10" style={{ justifyContent: 'flex-end' }}>
                       <div className="progress" style={{ width: 100, height: 6 }}>
                        <div className={`progress-fill ${(s.mean_score || 0) >= 70 ? 'green' : (s.mean_score || 0) >= 50 ? 'amber' : ''}`} style={{ width: `${s.mean_score || 0}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── BOTTOM ROW: GRADE DIST & LEVEL ── */}
      <div className="grid-2">
        <PremiumCard title="Grade Distribution" subtitle="Cohort academic spread" icon={BarChart3}>
           <div style={{ height: 240, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeDistData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--g1)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip cursor={{ fill: 'var(--g1)' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: 'var(--sh2)', fontSize: 12 }} />
                <Bar dataKey="count" fill="var(--blue)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
           </div>
        </PremiumCard>

        <PremiumCard title="Education Levels" subtitle="Student distribution" icon={PieChartIcon}>
           <div style={{ height: 240, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={lvlData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {lvlData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: 'var(--sh2)', fontSize: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 600, paddingTop: 20 }} />
              </PieChart>
            </ResponsiveContainer>
           </div>
        </PremiumCard>
      </div>
    </div>
  );
}
