export const LEVELS = {
  ecde:             { label: 'ECDE',             classes: ['PP1','PP2'],                                   curriculum: 'CBC' },
  lower_primary:    { label: 'Lower Primary',    classes: ['Grade 1','Grade 2','Grade 3'],                 curriculum: 'CBC' },
  upper_primary:    { label: 'Upper Primary',    classes: ['Grade 4','Grade 5','Grade 6'],                 curriculum: 'CBC' },
  junior_secondary: { label: 'Junior Secondary', classes: ['Grade 7','Grade 8','Grade 9'],                 curriculum: 'CBC' },
  secondary:        { label: 'Secondary',        classes: ['Form 1','Form 2','Form 3','Form 4'],           curriculum: '8-4-4' },
  tertiary:         { label: 'Tertiary',         classes: ['Year 1','Year 2','Year 3','Year 4','Year 5'],  curriculum: 'University' },
};

export const SUBJECTS = {
  ecde:             ['Language Activities','Mathematical Activities','Environmental Activities','Psychomotor & Creative Arts'],
  lower_primary:    ['Literacy','Kiswahili','Mathematics','Environmental Activities','Creative Arts','Religious Education','Physical Education'],
  upper_primary:    ['English','Kiswahili','Mathematics','Science & Technology','Social Studies','Religious Education','Creative Arts','Physical Education'],
  junior_secondary: ['English','Kiswahili','Mathematics','Integrated Science','Social Studies','Business Studies','Pre-Technical Studies','Creative Arts','Physical Education'],
  secondary:        ['English','Kiswahili','Mathematics','Biology','Chemistry','Physics','History & Government','Geography','Religious Education','Business Studies','Agriculture','Computer Studies'],
  tertiary:         ['Unit 1','Unit 2','Unit 3','Unit 4','Unit 5','Unit 6'],
};

export function kcseGrade(mark) {
  const m = Number(mark);
  if (m >= 75) return { grade: 'A',   points: 12 };
  if (m >= 70) return { grade: 'A-',  points: 11 };
  if (m >= 65) return { grade: 'B+',  points: 10 };
  if (m >= 60) return { grade: 'B',   points: 9  };
  if (m >= 55) return { grade: 'B-',  points: 8  };
  if (m >= 50) return { grade: 'C+',  points: 7  };
  if (m >= 45) return { grade: 'C',   points: 6  };
  if (m >= 40) return { grade: 'C-',  points: 5  };
  if (m >= 35) return { grade: 'D+',  points: 4  };
  if (m >= 30) return { grade: 'D',   points: 3  };
  if (m >= 25) return { grade: 'D-',  points: 2  };
  return { grade: 'E', points: 1 };
}

export function cbcGrade(mark) {
  const m = Number(mark);
  if (m >= 80) return 'EE';
  if (m >= 60) return 'ME';
  if (m >= 40) return 'AE';
  return 'BE';
}

export function tertiaryGrade(mark) {
  const m = Number(mark);
  if (m >= 70) return 'First Class';
  if (m >= 60) return 'Upper Second';
  if (m >= 50) return 'Lower Second';
  if (m >= 40) return 'Pass';
  return 'Fail';
}

export function getGrade(mark, level) {
  if (mark === null || mark === undefined || mark === '') return '—';
  if (level === 'secondary') return kcseGrade(mark).grade;
  if (level === 'tertiary') return tertiaryGrade(mark);
  return cbcGrade(mark);
}

export function calcMean(subjects) {
  if (!subjects) return null;
  const vals = Object.values(subjects).map(Number).filter(v => !isNaN(v) && v >= 0);
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
}

export function gradeColor(grade) {
  const positive = ['A','A-','B+','B','B-','EE','ME','First Class','Upper Second'];
  const mid = ['C+','C','C-','AE','Pass','Lower Second'];
  if (positive.includes(grade)) return 'green';
  if (mid.includes(grade)) return 'amber';
  return 'red';
}

export function studentTrend(results) {
  if (!results || results.length < 2) return null;
  const sorted = [...results].sort((a, b) => a.year - b.year || a.term - b.term);
  const avgs = sorted.map(r => calcMean(r.subjects)).filter(x => x !== null);
  if (avgs.length < 2) return null;
  const diff = avgs[avgs.length - 1] - avgs[avgs.length - 2];
  return diff > 3 ? 'up' : diff < -3 ? 'down' : 'stable';
}
