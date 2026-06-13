// Teacher Dashboard — Today's Attendance is the first, most prominent thing.
function CountChips({ counts, unmarked }) {
  const items = [
    { n: counts.present, ...window.ATT_BY_KEY.present },
    { n: counts.late, ...window.ATT_BY_KEY.late },
    { n: counts.absent, ...window.ATT_BY_KEY.absent },
  ];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {items.map((it) => (
        <span key={it.key} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
          borderRadius: 999, background: it.tint, color: it.fg,
          font: 'var(--fw-semibold) 13px/1 var(--font-sans)',
        }}>
          <span className="grado-num" style={{ fontSize: 13, fontWeight: 600, color: it.fg }}>{it.n}</span>
          {it.label}
        </span>
      ))}
      {unmarked > 0 && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
          borderRadius: 999, background: 'var(--surface-sunken)', color: 'var(--text-muted)',
          border: '1px solid var(--border-subtle)', font: 'var(--fw-semibold) 13px/1 var(--font-sans)',
        }}>
          <span className="grado-num" style={{ fontSize: 13, fontWeight: 600 }}>{unmarked}</span> unmarked
        </span>
      )}
    </div>
  );
}

function SessionPanel({ session, label, time, icon, sess, total, onTake }) {
  const { Pill, Button } = window.GradoDesignSystem_045d50;
  const st = window.sessionState(sess, total);
  const meta = window.SESSION_META[st.state];
  const tones = {
    pending: { bar: 'var(--grado-gray-300)', bg: 'var(--surface-sunken)' },
    draft: { bar: 'var(--grado-blue-300)', bg: 'var(--grado-blue-100)' },
    completed: { bar: 'var(--grado-green-300)', bg: 'var(--grado-green-100)' },
  }[st.state];
  return (
    <div style={{
      border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden',
      background: 'var(--surface-card)', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ height: 4, background: tones.bar }}></div>
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 38, height: 38, borderRadius: 9, background: tones.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <i data-lucide={icon} style={{ width: 20, height: 20, color: 'var(--text-secondary)' }}></i>
            </span>
            <div>
              <div className="grado-h4">{label}</div>
              <div className="grado-text-s" style={{ marginTop: 1 }}>Starts {time}</div>
            </div>
          </div>
          <Pill tone={meta.tone} variant={meta.pill} dot>{meta.label}</Pill>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          {st.state === 'pending'
            ? <div className="grado-body" style={{ color: 'var(--text-muted)' }}>Not yet taken — {total} learners to mark.</div>
            : <CountChips counts={st.counts} unmarked={st.unmarked} />}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {st.state === 'pending' && (
            <Button variant="primary" iconRight="arrow-right" onClick={() => onTake(session)} style={{ width: '100%' }}>
              Take {label}
            </Button>
          )}
          {st.state === 'draft' && (
            <Button variant="primary" iconRight="arrow-right" onClick={() => onTake(session)} style={{ width: '100%' }}>
              Continue marking
            </Button>
          )}
          {st.state === 'completed' && (
            <React.Fragment>
              <Button variant="outline" iconLeft="pencil" onClick={() => onTake(session)} style={{ flex: 1 }}>
                Review & edit
              </Button>
              <span className="grado-text-s" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--grado-green-300)', whiteSpace: 'nowrap' }}>
                <i data-lucide="check-circle-2" style={{ width: 15, height: 15 }}></i>
                {sess.submittedAt || 'Done'}
              </span>
            </React.Fragment>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickLink({ icon, title, desc, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      textAlign: 'left', cursor: 'pointer', background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 16,
      display: 'flex', gap: 13, alignItems: 'flex-start', transition: 'box-shadow 140ms ease, border-color 140ms ease',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--border-default)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}>
      <span style={{
        width: 38, height: 38, borderRadius: 9, background: 'var(--surface-selected)', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <i data-lucide={icon} style={{ width: 19, height: 19, color: 'var(--color-brand)' }}></i>
      </span>
      <div>
        <div className="grado-body-strong">{title}</div>
        <div className="grado-text-s" style={{ marginTop: 2, lineHeight: 1.45 }}>{desc}</div>
      </div>
    </button>
  );
}

function SubjectRow({ cls, store, onTake }) {
  const { Pill, Button } = window.GradoDesignSystem_045d50;
  const cstore = store[cls.id] || { am: {}, pm: {} };
  const st = window.sessionState(cstore[cls.session] || {}, cls.learnerCount);
  const meta = window.SESSION_META[st.state];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
      borderTop: '1px solid var(--border-subtle)',
    }}>
      <span style={{
        width: 36, height: 36, borderRadius: 8, background: 'var(--surface-sunken)', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <i data-lucide="book-open" style={{ width: 18, height: 18, color: 'var(--text-secondary)' }}></i>
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="grado-body-strong">{cls.subject} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>· {cls.name}</span></div>
        <div className="grado-text-s" style={{ marginTop: 1 }}>{cls.yearLevel} · {cls.learnerCount} learners · {cls.time}</div>
      </div>
      <Pill tone="gray" variant="subtle" size="sm">{cls.session.toUpperCase()} only</Pill>
      <Pill tone={meta.tone} variant="subtle" dot>{meta.label}</Pill>
      <Button variant="ghost" size="sm" iconRight="arrow-right" onClick={() => onTake(cls)}>{st.state === 'completed' ? 'Review' : st.state === 'draft' ? 'Continue' : 'Take'}</Button>
    </div>
  );
}

function TeacherDashboard({ data, store, onTake, onPrev }) {
  const { HeroBanner, Pill } = window.GradoDesignSystem_045d50;
  const { TEACHER, ADVISORY, SUBJECTS, TODAY } = data;
  const total = ADVISORY.learnerCount;
  const advStore = store[ADVISORY.id] || { am: {}, pm: {} };
  const amSt = window.sessionState(advStore.am, total);
  const pmSt = window.sessionState(advStore.pm, total);
  const pendingCount = (amSt.state !== 'completed' ? 1 : 0) + (pmSt.state !== 'completed' ? 1 : 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <HeroBanner
        greeting="Good morning,"
        name={'Teacher ' + TEACHER.first}
        subtitle={TODAY.long + '  ·  ' + (pendingCount > 0
          ? `${pendingCount} attendance ${pendingCount === 1 ? 'session' : 'sessions'} still need your action.`
          : 'All advisory attendance is in. Nicely done.')}
        right={
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ textAlign: 'center', minWidth: 76 }}>
              <div className="grado-num" style={{ fontSize: 30, color: '#fff', fontWeight: 600 }}>{total}</div>
              <div style={{ font: 'var(--fw-semibold) 11px/1.3 var(--font-sans)', color: 'rgba(255,255,255,.85)', letterSpacing: '.03em', textTransform: 'uppercase', marginTop: 2 }}>Advisory<br/>learners</div>
            </div>
          </div>
        }
      />

      {/* TODAY'S ATTENDANCE — the priority */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <p className="grado-eyebrow">Today's Attendance · {TODAY.weekday}</p>
          <button type="button" onClick={onPrev} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: 'var(--text-link)', font: 'var(--fw-semibold) 13px/1 var(--font-sans)',
          }}>
            <i data-lucide="history" style={{ width: 15, height: 15 }}></i>
            View previous attendance
          </button>
        </div>

        {/* Advisory — pinned & emphasized */}
        <div style={{
          background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
          borderRadius: 12, boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
        }}>
          <div style={{ padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{
                  width: 48, height: 48, borderRadius: 12, background: 'var(--gradient-brand)', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i data-lucide="calendar-check-2" style={{ width: 24, height: 24, color: '#fff' }}></i>
                </span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h2 className="grado-h2">{ADVISORY.name}</h2>
                    <Pill tone="purple" variant="solid" size="sm">Advisory</Pill>
                  </div>
                  <div className="grado-body" style={{ color: 'var(--text-secondary)', marginTop: 3 }}>
                    {ADVISORY.yearLevel} · {ADVISORY.learnerCount} learners · {ADVISORY.room} · {ADVISORY.ay}
                  </div>
                </div>
              </div>
              {pendingCount > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 13px', borderRadius: 999,
                  background: 'var(--feedback-warning-bg)', color: 'var(--grado-orange-300)',
                  font: 'var(--fw-semibold) 13px/1 var(--font-sans)',
                }}>
                  <i data-lucide="alarm-clock" style={{ width: 16, height: 16 }}></i>
                  Action required
                </span>
              )}
            </div>

            <div className="att-session-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <SessionPanel session="am" label="AM Attendance" time={ADVISORY.amTime} icon="sunrise" sess={advStore.am} total={total} onTake={onTake} />
              <SessionPanel session="pm" label="PM Attendance" time={ADVISORY.pmTime} icon="sunset" sess={advStore.pm} total={total} onTake={onTake} />
            </div>
            <p className="grado-text-s" style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i data-lucide="info" style={{ width: 14, height: 14 }}></i>
              AM and PM are recorded separately — a learner can be present in the morning and absent in the afternoon.
            </p>
          </div>
        </div>
      </div>

      {/* Subject classes — lower priority */}
      <div>
        <p className="grado-eyebrow" style={{ marginBottom: 12 }}>Your Subject Classes</p>
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: 'var(--surface-sunken)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i data-lucide="layers" style={{ width: 16, height: 16, color: 'var(--text-muted)' }}></i>
            <span className="grado-text-s">Advisory attendance is your daily reporting priority — subject classes can follow.</span>
          </div>
          {SUBJECTS.map((c) => <SubjectRow key={c.id} cls={c} store={store} onTake={onTake} />)}
        </div>
      </div>

      {/* Original dashboard entries — retained, re-skinned */}
      <div>
        <p className="grado-eyebrow" style={{ marginBottom: 12 }}>Shortcuts</p>
        <div className="att-quicklinks" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <QuickLink icon="calendar-days" title="Your Classes" desc="Your classes and grading sheets." onClick={() => {}} />
          <QuickLink icon="list" title="Homeroom Sections" desc="Sections you are currently advising." onClick={() => {}} />
          <QuickLink icon="download" title="Requests to Drop" desc="Students requesting to drop a class." onClick={() => {}} />
          <QuickLink icon="history" title="Previous Attendance" desc="Review and export past records." onClick={onPrev} />
        </div>
      </div>
    </div>
  );
}

window.TeacherDashboard = TeacherDashboard;
