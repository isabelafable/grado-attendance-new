// Mock data for the Grado teacher attendance prototype.
(function () {
  const LEARNERS = [
    { id: 'l01', name: 'Tanaka, Haruto', sex: 'M' },
    { id: 'l02', name: 'Nguyen, Linh', sex: 'F' },
    { id: 'l03', name: 'Kim, Ji-woo', sex: 'F' },
    { id: 'l04', name: 'Wong, Wei Lun', sex: 'M' },
    { id: 'l05', name: 'Patel, Aarav', sex: 'M' },
    { id: 'l06', name: 'Sato, Yui', sex: 'F' },
    { id: 'l07', name: 'Lim, Hao Ming', sex: 'M' },
    { id: 'l08', name: 'Park, Min-jun', sex: 'M' },
    { id: 'l09', name: 'Cheng, Xiulan', sex: 'F' },
    { id: 'l10', name: 'Suzuki, Ren', sex: 'M' },
    { id: 'l11', name: 'Tran, Bao Han', sex: 'F' },
    { id: 'l12', name: 'Mehta, Priya', sex: 'F' },
    { id: 'l13', name: 'Wang, Fang', sex: 'F' },
    { id: 'l14', name: 'Lee, Seo-yeon', sex: 'F' },
    { id: 'l15', name: 'Yamamoto, Sora', sex: 'M' },
    { id: 'l16', name: 'Reddy, Ananya', sex: 'F' },
  ];

  const TEACHER = {
    name: 'Hana Kimura',
    first: 'Hana',
    initials: 'HK',
    username: '0688',
    email: 'hana.kimura@reedley.edu',
  };

  const ADVISORY = {
    id: 'ls1-orange',
    name: 'LS1 Orange',
    yearLevel: 'Grade 1',
    ay: 'AY 2025 – 2026',
    term: 'Yearlong',
    code: 'K-10',
    advisory: true,
    learnerCount: LEARNERS.length,
    room: 'Room 1-A',
    amTime: '7:30 AM',
    pmTime: '1:00 PM',
  };

  // A couple of subject classes the same teacher handles (lower priority than advisory).
  const SUBJECTS = [
    { id: 'eng-ls2', subject: 'English 1', name: 'LS2 Blue', yearLevel: 'Grade 2', learnerCount: 22, time: '9:00 AM', session: 'am' },
    { id: 'math-ls3', subject: 'Mathematics 1', name: 'LS3 Green', yearLevel: 'Grade 3', learnerCount: 24, time: '2:00 PM', session: 'pm' },
  ];

  const TODAY = { weekday: 'Thursday', long: 'Thursday, June 11, 2026', short: 'Jun 11, 2026', iso: '2026-06-11' };

  // Roster name pool for subject classes (distinct from the advisory roster).
  const SUBJECT_POOL = [
    'Choi, Eun-woo', 'Huang, Mei', 'Ito, Daiki', 'Singh, Aarush', 'Pham, Quoc', 'Tan, Jia Hui',
    'Yoshida, Aoi', 'Gupta, Diya', 'Zhang, Lei', 'Watanabe, Hina', 'Ong, Wei Jie', 'Bui, Ngoc',
    'Nakamura, Riku', 'Sharma, Ishaan', 'Liu, Yan', 'Jung, Ha-eun', 'Do, Minh', 'Goh, Kai',
    'Fujimoto, Sakura', 'Rao, Kavya', 'Chen, Bo', 'Han, Seo-jun', 'Le, Thao', 'Lim, Zhi Wei',
    'Mori, Yuto', 'Desai, Rohan',
  ];
  function buildLearners(prefix, count, offset) {
    const out = [];
    for (let i = 0; i < count; i++) {
      const nm = SUBJECT_POOL[(i + offset) % SUBJECT_POOL.length];
      out.push({ id: `${prefix}-${String(i + 1).padStart(2, '0')}`, name: nm, sex: i % 2 ? 'F' : 'M' });
    }
    return out;
  }

  // Unified class contexts (advisory + subjects) keyed by id.
  const ADVISORY_CTX = {
    id: ADVISORY.id, kind: 'advisory', title: ADVISORY.name, pillTone: 'purple', pillLabel: 'Advisory',
    yearLevel: ADVISORY.yearLevel, ay: ADVISORY.ay, term: ADVISORY.term, room: ADVISORY.room,
    sessions: ['am', 'pm'], amTime: ADVISORY.amTime, pmTime: ADVISORY.pmTime,
    learners: LEARNERS,
    meta: `${ADVISORY.yearLevel} · ${LEARNERS.length} learners · ${ADVISORY.room}`,
  };
  const SUBJECT_CTX = SUBJECTS.map((s, idx) => {
    const learners = buildLearners(s.id, s.learnerCount, idx * 5);
    return {
      id: s.id, kind: 'subject', title: s.subject, pillTone: 'blue', pillLabel: 'Subject',
      section: s.name, yearLevel: s.yearLevel, ay: ADVISORY.ay, term: ADVISORY.term,
      sessions: [s.session], amTime: s.session === 'am' ? s.time : null, pmTime: s.session === 'pm' ? s.time : null,
      learners,
      meta: `${s.name} · ${s.yearLevel} · ${learners.length} learners`,
    };
  });
  const CLASSES = [ADVISORY_CTX, ...SUBJECT_CTX];
  const classById = (id) => CLASSES.find((c) => c.id === id) || ADVISORY_CTX;

  window.AttData = { LEARNERS, TEACHER, ADVISORY, SUBJECTS, TODAY, CLASSES, classById, ADVISORY_CTX, SUBJECT_CTX };
})();
