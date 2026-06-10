import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell, Legend } from 'recharts';
import { api } from '../lib/api';

export default function Reports() {
  const [tab, setTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [schoolReport, setSchoolReport] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getOverview(), api.getSchoolReport()])
      .then(([ov, sr]) => { setOverview(ov); setSchoolReport(sr); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner"/></div>;

  const lvlData = Object.entries(overview?.by_level || {}).map(([k, v]) => ({
    name: k.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase()), count: v
  }));

  const lvlProgressData = Object.entries(overview?.level_progress || {}).map(([k, v]) => ({
    name: k.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase()), score: v,
    fill: v >= 70 ? 'var(--green)' : v >= 50 ? 'var(--amber)' : 'var(--red)'
  }));

  const genderData = Object.entries(overview?.gender_means || {}).filter(([_, v]) => v !== null).map(([k, v]) => ({
    name: k, score: v, fill: k === 'Male' ? '#1a5fa8' : k === 'Female' ? '#C0292A' : '#7a7773'
  }));

  const schoolData = schoolReport.map(s => ({
    name: s.school.name.split(' ').slice(0,2).join(' '),
    score: s.mean_score ?? 0,
    students: s.student_count,
    fill: (s.mean_score??0)>=70?'#0f7940':(s.mean_score??0)>=50?'#b86d00':'#C0292A',
  }));

  return (
    <div>
      <div className="tabs mb-20">
        {[['overview','Overview'],['school','By School'],['student','By Student']].map(([id,label])=>(
          <button key={id} className={`tab-btn ${tab===id?'active':''}`} onClick={()=>setTab(id)}>{label}</button>
        ))}
      </div>

      {tab==='overview' && (
        <div>
          <div className="grid-4 mb-20">
            {[
              {label:'Total Students',value:overview?.total_students??0,color:'red'},
              {label:'Overall Mean',value:overview?.overall_mean!=null?`${overview.overall_mean}%`:'—',color:'green'},
              {label:'On Track (≥70%)',value:overview?.on_track??0,color:'blue'},
              {label:'At Risk (<50%)',value:overview?.at_risk??0,color:'amber'},
            ].map(({label,value,color})=>(
              <div key={label} className={`stat-card ${color}`}>
                <div className="stat-num">{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>

          <div className="grid-2 mb-20">
            <div className="card">
              <div className="section-title mb-16">Gender Performance Gap</div>
              {genderData.length ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={genderData} barSize={40}>
                    <XAxis dataKey="name" tick={{fontSize:12,fontWeight:600}} axisLine={false} tickLine={false}/>
                    <YAxis domain={[0, 100]} tick={{fontSize:11}} axisLine={false} tickLine={false}/>
                    <Tooltip formatter={(v)=>[`${v}%`,'Mean Score']} contentStyle={{borderRadius:8,border:'1px solid #e0dedb'}}/>
                    <Bar dataKey="score" radius={[4,4,0,0]}>
                      {genderData.map((e,i)=><Cell key={i} fill={e.fill}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="empty-state"><p>No gender data yet</p></div>}
            </div>
            <div className="card">
              <div className="section-title mb-16">Sponsorship ROI (Growth)</div>
              <div style={{textAlign:'center',padding:'20px 0'}}>
                <div style={{fontSize:48,fontWeight:800,color:Number(overview?.avg_growth) >= 0 ? 'var(--green)' : 'var(--red)'}}>
                  {Number(overview?.avg_growth) > 0 ? '+' : ''}{overview?.avg_growth}%
                </div>
                <div className="text-muted" style={{fontSize:14,maxWidth:200,margin:'0 auto'}}>
                  Average grade movement across all sponsored students this term.
                </div>
              </div>
              <div className="alert alert-info mt-12" style={{fontSize:11}}>
                This metric shows the "Value Added" by the sponsorship program since the students joined.
              </div>
            </div>
          </div>

          <div className="grid-2 mb-20">
            <div className="card">
              <div className="section-title mb-16">Group Progress (Average per Grade)</div>
              {lvlProgressData.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={lvlProgressData} barSize={34}>
                    <XAxis dataKey="name" tick={{fontSize:10,fill:'#7a7773'}} axisLine={false} tickLine={false}/>
                    <YAxis domain={[0, 100]} tick={{fontSize:11,fill:'#7a7773'}} axisLine={false} tickLine={false}/>
                    <Tooltip formatter={(v)=>[`${v}%`,'Mean Score']} contentStyle={{borderRadius:8,border:'1px solid #e0dedb',fontSize:12}}/>
                    <Bar dataKey="score" radius={[4,4,0,0]}>
                      {lvlProgressData.map((e,i)=><Cell key={i} fill={e.fill}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="empty-state"><p>Add results to see group progress</p></div>}
            </div>
            <div className="card">
              <div className="section-title mb-16">Students by Education Level</div>
              {lvlData.length ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={lvlData} barSize={30}>
                    <XAxis dataKey="name" tick={{fontSize:10,fill:'#7a7773'}} axisLine={false} tickLine={false}/>
                    <YAxis hide/>
                    <Tooltip contentStyle={{borderRadius:8,border:'1px solid #e0dedb',fontSize:12}}/>
                    <Bar dataKey="count" fill="#1a5fa8" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="empty-state"><p>No data yet</p></div>}
            </div>
            <div className="card">
              <div className="section-title mb-16">Trend Summary</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                {[
                  {label:'↑ Improving',value:overview?.improving??0,color:'var(--green)',bg:'var(--green-l)'},
                  {label:'→ Stable',value:(overview?.total_students??0)-(overview?.improving??0)-(overview?.declining??0),color:'var(--g3)',bg:'var(--g1)'},
                  {label:'↓ Declining',value:overview?.declining??0,color:'var(--red)',bg:'var(--red-l)'},
                ].map(({label,value,color,bg})=>(
                  <div key={label} style={{textAlign:'center',padding:'16px 8px',background:bg,borderRadius:'var(--r)'}}>
                    <div style={{fontSize:28,fontWeight:800,color}}>{value}</div>
                    <div className="text-sm text-muted">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab==='school' && (
        <div>
          <div className="card mb-20">
            <div className="section-title mb-16">School Performance Comparison</div>
            {schoolData.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={schoolData} barSize={36}>
                  <XAxis dataKey="name" tick={{fontSize:11,fill:'#7a7773'}} axisLine={false} tickLine={false}/>
                  <YAxis domain={[0,100]} tick={{fontSize:11,fill:'#7a7773'}} axisLine={false} tickLine={false}/>
                  <Tooltip formatter={(v)=>[`${v}%`,'Mean Score']} contentStyle={{borderRadius:8,border:'1px solid #e0dedb',fontSize:12}}/>
                  <Bar dataKey="score" radius={[4,4,0,0]}>
                    {schoolData.map((e,i)=><Cell key={i} fill={e.fill}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="empty-state"><p>No school data</p></div>}
          </div>
          <div className="card card-p0">
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>School</th><th>Location</th><th>Students</th><th>Mean</th><th>On Track</th><th>At Risk</th><th>Bar</th></tr></thead>
                <tbody>
                  {schoolReport.map((s,i)=>(
                    <tr key={s.school.id}>
                      <td className="text-muted">{i+1}</td>
                      <td><strong className="text-sm">{s.school.name}</strong></td>
                      <td className="text-sm text-muted">{s.school.location}</td>
                      <td>{s.student_count}</td>
                      <td><strong style={{color:s.mean_score>=70?'var(--green)':s.mean_score>=50?'var(--amber)':'var(--red)'}}>{s.mean_score!=null?`${s.mean_score}%`:'—'}</strong></td>
                      <td><span className="badge badge-green">{s.on_track}</span></td>
                      <td><span className="badge badge-red">{s.at_risk}</span></td>
                      <td><div className="progress" style={{width:110}}><div className={`progress-fill ${(s.mean_score??0)>=70?'green':(s.mean_score??0)>=50?'amber':''}`} style={{width:`${s.mean_score??0}%`}}/></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab==='student' && (
        <div className="card">
          <div className="section-title mb-12">Per-student reports require loading all results.</div>
          <div className="alert alert-info">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            View individual student performance by clicking <strong>View</strong> on any student in the Students page.
          </div>
        </div>
      )}
    </div>
  );
}
