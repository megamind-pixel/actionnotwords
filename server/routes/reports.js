import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// Overview stats
router.get('/overview', requireAdmin, async (req, res) => {
  const [students, schools, results] = await Promise.all([
    supabaseAdmin.from('students').select('id, level, school_id, gender, class_name'),
    supabaseAdmin.from('schools').select('id, name, location'),
    supabaseAdmin.from('results').select('student_id, year, term, subjects, mean_score, student:students(level, gender)')
  ]);

  // Prefer mean_score column; fall back to computing from subjects JSONB
  const calcMean = (r) => {
    if (r.mean_score != null) return Math.round(Number(r.mean_score));
    if (!r.subjects) return null;
    const vals = Object.values(r.subjects).map(Number).filter(v => !isNaN(v) && v >= 0);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  };
  // For school report route (subjects only object)
  const calcMeanFromSubjects = (subjects) => {
    if (!subjects) return null;
    const vals = Object.values(subjects).map(Number).filter(v => !isNaN(v) && v >= 0);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  };

  // Latest result per student
  const latestByStudent = {};
  (results.data || []).forEach(r => {
    const key = r.student_id;
    if (!latestByStudent[key] || r.year > latestByStudent[key].year ||
      (r.year === latestByStudent[key].year && r.term > latestByStudent[key].term)) {
      latestByStudent[key] = r;
    }
  });

  const avgs = Object.values(latestByStudent).map(r => calcMean(r)).filter(x => x !== null);
  const mean = avgs.length ? Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length) : null;
  const atRisk = avgs.filter(a => a < 50).length;
  const onTrack = avgs.filter(a => a >= 70).length;

  // By level and class
  const byLevel = {};
  const levelMeans = {};
  const levelCounts = {};
  const classMeans = {};
  const classCounts = {};

  (students.data || []).forEach(s => { 
    byLevel[s.level] = (byLevel[s.level] || 0) + 1; 
    const lr = latestByStudent[s.id];
    if (lr) {
      const m = calcMean(lr);
      if (m !== null) {
        levelMeans[s.level] = (levelMeans[s.level] || 0) + m;
        levelCounts[s.level] = (levelCounts[s.level] || 0) + 1;
        
        if (s.class_name) {
          classMeans[s.class_name] = (classMeans[s.class_name] || 0) + m;
          classCounts[s.class_name] = (classCounts[s.class_name] || 0) + 1;
        }
      }
    }
  });

  const levelProgress = {};
  Object.keys(levelMeans).forEach(lvl => {
    levelProgress[lvl] = Math.round(levelMeans[lvl] / levelCounts[lvl]);
  });

  const classProgress = {};
  Object.keys(classMeans).forEach(cls => {
    classProgress[cls] = Math.round(classMeans[cls] / classCounts[cls]);
  });

  // Gender Performance
  const genderStats = { Male: { sum: 0, count: 0 }, Female: { sum: 0, count: 0 }, Other: { sum: 0, count: 0 } };
  (students.data || []).forEach(s => {
    const lr = latestByStudent[s.id];
    if (lr && s.gender && genderStats[s.gender]) {
      const m = calcMean(lr);
      if (m !== null) {
        genderStats[s.gender].sum += m;
        genderStats[s.gender].count += 1;
      }
    }
  });
  const genderMeans = {};
  Object.keys(genderStats).forEach(g => {
    genderMeans[g] = genderStats[g].count ? Math.round(genderStats[g].sum / genderStats[g].count) : null;
  });

  // Trends
  const studentStats = (students.data || []).map(s => {
    const sResults = (results.data || []).filter(r => r.student_id === s.id)
      .sort((a, b) => a.year - b.year || a.term - b.term);
    if (sResults.length < 2) return { id: s.id, trend: null, diff: 0 };
    
    const avgsArr = sResults.map(r => calcMean(r)).filter(x => x !== null);
    if (avgsArr.length < 2) return { id: s.id, trend: null, diff: 0 };
    
    const diff = avgsArr[avgsArr.length - 1] - avgsArr[avgsArr.length - 2];
    return { 
      id: s.id, 
      name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Student',
      diff, 
      trend: diff > 3 ? 'up' : diff < -3 ? 'down' : 'stable',
      last_score: avgsArr[avgsArr.length - 1]
    };
  });

  const improving = studentStats.filter(s => s.trend === 'up').length;
  const declining = studentStats.filter(s => s.trend === 'down').length;
  
  const topImproved = [...studentStats].filter(s => s.trend === 'up').sort((a,b) => b.diff - a.diff).slice(0, 5);
  const mostDeclined = [...studentStats].filter(s => s.trend === 'down').sort((a,b) => a.diff - b.diff).slice(0, 5);

  // Overall Growth (Mean of all improvements/declines)
  const validDiffs = studentStats.filter(s => s.diff !== 0).map(s => s.diff);
  const avgGrowth = validDiffs.length ? (validDiffs.reduce((a,b) => a + b, 0) / validDiffs.length).toFixed(1) : 0;

  // ── Subject Performance (All time) ──
  const subjectStats = {};
  (results.data || []).forEach(r => {
    Object.entries(r.subjects || {}).forEach(([sub, mark]) => {
      const m = Number(mark);
      if (!isNaN(m)) {
        if (!subjectStats[sub]) subjectStats[sub] = { sum: 0, count: 0 };
        subjectStats[sub].sum += m;
        subjectStats[sub].count += 1;
      }
    });
  });
  const subjectMeans = {};
  Object.keys(subjectStats).forEach(s => {
    subjectMeans[s] = Math.round(subjectStats[s].sum / subjectStats[s].count);
  });

  // ── Class student counts (all students, not just those with results) ──
  const classStudentCounts = {};
  (students.data || []).forEach(s => {
    if (s.class_name) {
      classStudentCounts[s.class_name] = (classStudentCounts[s.class_name] || 0) + 1;
    }
  });

  // ── Grade Distribution (Latest Results) ──
  const getGrade = (mark, level) => {
    const m = Number(mark);
    if (level === 'secondary') {
      if (m >= 75) return 'A'; if (m >= 70) return 'A-'; if (m >= 65) return 'B+';
      if (m >= 60) return 'B'; if (m >= 55) return 'B-'; if (m >= 50) return 'C+';
      if (m >= 45) return 'C'; if (m >= 40) return 'C-'; if (m >= 35) return 'D+';
      if (m >= 30) return 'D'; if (m >= 25) return 'D-'; return 'E';
    }
    if (m >= 80) return 'EE'; if (m >= 60) return 'ME'; if (m >= 40) return 'AE'; return 'BE';
  };

  const gradeDist = { A:0, 'A-':0, 'B+':0, B:0, 'B-':0, 'C+':0, C:0, 'C-':0, 'D+':0, D:0, 'D-':0, E:0, EE:0, ME:0, AE:0, BE:0 };
  Object.values(latestByStudent).forEach(r => {
    const m = calcMean(r);
    if (m !== null) {
      const g = getGrade(m, r.student?.level);
      gradeDist[g] = (gradeDist[g] || 0) + 1;
    }
  });

  // ── Historical Trends (Overall Mean per Term) ──
  const termHistory = {};
  (results.data || []).forEach(r => {
    const key = `${r.year} T${r.term}`;
    const m = calcMean(r);
    if (m !== null) {
      if (!termHistory[key]) termHistory[key] = { sum: 0, count: 0 };
      termHistory[key].sum += m;
      termHistory[key].count += 1;
    }
  });
  const history = Object.keys(termHistory).sort().map(key => ({
    name: key,
    score: Math.round(termHistory[key].sum / termHistory[key].count)
  }));

  res.json({
    total_students: students.data?.length || 0,
    total_schools: schools.data?.length || 0,
    overall_mean: mean,
    at_risk: atRisk,
    on_track: onTrack,
    improving,
    declining,
    by_level: byLevel,
    level_progress: levelProgress,
    class_progress: classProgress,
    class_counts: classStudentCounts,
    gender_means: genderMeans,
    subject_means: subjectMeans,
    grade_distribution: gradeDist,
    history,
    avg_growth: avgGrowth,
    focus_lists: {
      improved: topImproved,
      declined: mostDeclined
    }
  });
});

// School performance comparison
router.get('/schools', requireAdmin, async (req, res) => {
  const { data: schools } = await supabaseAdmin.from('schools').select('id, name, location');
  const { data: students } = await supabaseAdmin.from('students').select('id, school_id, level');
  const { data: results } = await supabaseAdmin.from('results').select('student_id, year, term, subjects, mean_score');

  const calcMean = (r) => {
    if (r.mean_score != null) return Math.round(Number(r.mean_score));
    if (!r.subjects) return null;
    const vals = Object.values(r.subjects).map(Number).filter(v => !isNaN(v) && v >= 0);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  };

  const latestByStudent = {};
  (results || []).forEach(r => {
    const key = r.student_id;
    if (!latestByStudent[key] || r.year > latestByStudent[key].year || (r.year === latestByStudent[key].year && r.term > latestByStudent[key].term)) {
      latestByStudent[key] = r;
    }
  });

  const report = (schools || []).map(sch => {
    const schStudents = (students || []).filter(s => s.school_id === sch.id);
    const avgs = schStudents.map(s => {
      const lr = latestByStudent[s.id];
      return lr ? calcMean(lr) : null;
    }).filter(x => x !== null);
    const mean = avgs.length ? Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length) : null;
    return {
      school: sch,
      student_count: schStudents.length,
      mean_score: mean,
      on_track: avgs.filter(a => a >= 70).length,
      at_risk: avgs.filter(a => a < 50).length
    };
  }).sort((a, b) => (b.mean_score || 0) - (a.mean_score || 0));

  res.json(report);
});

export default router;
