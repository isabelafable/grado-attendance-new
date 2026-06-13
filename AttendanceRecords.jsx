// Attendance Records — read-only color-coded grid with week/month views, AM/PM
// split, per-learner summary, and permission-gated override (reason + audit).

// ---- June 2026 calendar (Jun 1 = Monday) ----
function juneDays() {
  const out = [];
  const W = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let d = 1; d <= 30; d++) {
    const dow = new Date(Date.UTC(2026, 5, d)).getUTCDay();
    out.push({ dom: d, dow, weekday: W[dow], iso: `2026-06-${String(d).padStart(2, '0')}` });
  }
  return out;
}
const TODAY_ISO = '2026-06-11';

// Deterministic base attendance so the grid is populated.
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0); }
function baseStatus(learnerId, iso, session, learnerIdx) {
  if (iso > TODAY_ISO) return null; // not yet taken
  const r = hashStr(learnerId + iso + session) % 100;
  const absentThresh = 5 + (learnerIdx % 4) * 2;   // some learners miss more
  const lateThresh = absentThresh + 8;
  if (r < absentThresh) return 'absent';
  if (r < lateThresh) return 'late';
  return 'present';
}

function RecCell({ status, edited, onClick, clickable }) {
  const conf = status ? window.ATT_BY_KEY[status] : null;
  return (
    <button
      type="button"
      disabled={!clickable || !status}
      onClick={onClick}
      title={status ? (window.ATT_BY_KEY[status].label + (edited ? ' · edited' : '')) : 'No record'}
      style={{
        width: 26, height: 26, borderRadius: 6, border: 'none', padding: 0, position: 'relative',
        cursor: clickable && status ? 'pointer' : 'default',
        background: conf ? conf.fill : 'var(--grado-gray-100)',
        color: conf ? conf.on : 'var(--grado-gray-400)',
        font: 'var(--fw-semibold) 11px/1 var(--font-sans)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        outline: clickable && status ? '1px solid transparent' : 'none',
        transition: 'transform 100ms ease, box-shadow 100ms ease',
      }}
      onMouseEnter={(e) => { if (clickable && status) { e.currentTarget.style.boxShadow = '0 0 0 2px var(--grado-dark-blue)'; e.currentTarget.style.transform = 'scale(1.08)'; } }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
      {conf ? conf.short : '·'}
      {edited && <span style={{ position: 'absolute', top: -3, right: -3, width: 8, height: 8, borderRadius: '50%', background: 'var(--grado-dark-blue)', border: '1.5px solid #fff' }}></span>}
    </button>
  );
}

function OverrideModal({ learner, day, session, current, onSave, onClose }) {
  const { Button } = window.GradoDesignSystem_045d50;
  const [val, setVal] = React.useState(current);
  const [reason, setReason] = React.useState('');
  React.useEffect(() => { window.lucide && window.lucide.createIcons(); });
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay-scrim)', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--surface-card)', borderRadius: 12, boxShadow: 'var(--shadow-lg)', width: 'min(460px,100%)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 22px 0' }}>
          <h3 className="grado-h3">Override attendance</h3>
          <div className="grado-body" style={{ color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>
            <b style={{ fontWeight: 600 }}>{learner.name}</b> · {day.weekday} {day.iso.slice(5).replace('-', '/')} · <b style={{ fontWeight: 600 }}>{session.toUpperCase()}</b>
          </div>
          <div style={{ margin: '16px 0 6px' }}><window.StatusSegmented value={val} onChange={setVal} /></div>
          <p className="grado-text-s" style={{ margin: '14px 0 6px', fontWeight: 600, color: 'var(--text-secondary)' }}>Reason for change (required, logged)</p>
          <input value={reason} onChange={(e) => setReason(e.target.value)} autoFocus placeholder="e.g. Medical certificate received — excused"
            style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-default)', font: 'var(--fw-regular) 14px/1 var(--font-sans)', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: 18, marginTop: 6 }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" iconLeft="save" disabled={!val || reason.trim().length < 4} onClick={() => onSave(val, reason.trim())}>Save override</Button>
        </div>
      </div>
    </div>
  );
}

function AttendanceRecords({ data, onFlash }) {
  const { ADVISORY, LEARNERS, TEACHER } = data;
  const { Pill, Switch, Button } = window.GradoDesignSystem_045d50;
  const DAYS = React.useMemo(juneDays, []);
  const [view, setView] = React.useState('week');        // 'week' | 'month'
  const [session, setSession] = React.useState('both');  // 'am' | 'pm' | 'both'
  const [showWeekends, setShowWeekends] = React.useState(false);
  const [weekStart, setWeekStart] = React.useState(8);   // Monday-of-week day-of-month (Jun 8 = current week)
  const [override, setOverride] = React.useState(false);
  const [overrides, setOverrides] = React.useState({});  // key -> status
  const [editing, setEditing] = React.useState(null);
  const [auditCount, setAuditCount] = React.useState(0);

  React.useEffect(() => { window.lucide && window.lucide.createIcons(); });

  const key = (id, iso, s) => `${id}|${iso}|${s}`;
  const getStatus = (id, iso, s, idx) => (key(id, iso, s) in overrides ? overrides[key(id, iso, s)] : baseStatus(id, iso, s, idx));
  const isEdited = (id, iso, s) => key(id, iso, s) in overrides;

  // visible columns
  let cols = view === 'week'
    ? DAYS.filter((d) => d.dom >= weekStart && d.dom <= weekStart + 6)
    : DAYS.slice();
  if (!showWeekends) cols = cols.filter((d) => d.dow !== 0 && d.dow !== 6);

  const sessions = session === 'both' ? ['am', 'pm'] : [session];

  const learnerSummary = (id, idx) => {
    let p = 0, l = 0, a = 0, tot = 0;
    cols.forEach((d) => sessions.forEach((s) => { const st = getStatus(id, d.iso, s, idx); if (st) { tot++; if (st === 'present') p++; else if (st === 'late') l++; else a++; } }));
    return { p, l, a, tot, rate: tot ? Math.round(((p + l) / tot) * 100) : null };
  };
  const colTally = (d) => {
    let p = 0, l = 0, a = 0;
    LEARNERS.forEach((ln, idx) => sessions.forEach((s) => { const st = getStatus(ln.id, d.iso, s, idx); if (st === 'present') p++; else if (st === 'late') l++; else if (st === 'absent') a++; }));
    return { p, l, a };
  };

  const weekLabel = () => { const end = Math.min(weekStart + (showWeekends ? 6 : 4), 30); return `Jun ${weekStart}–${end}`; };
  const moveWeek = (dir) => setWeekStart((w) => Math.max(1, Math.min(29, w + dir * 7)));

  const onCellClick = (ln, d, s, cur) => { if (!override) return; if (d.iso > TODAY_ISO) { onFlash('That day has no record yet.'); return; } setEditing({ ln, d, s, cur }); };
  const saveOverride = (val, reason) => {
    setOverrides((o) => ({ ...o, [key(editing.ln.id, editing.d.iso, editing.s)]: val }));
    setAuditCount((c) => c + 1);
    onFlash(`Override saved & logged — ${editing.ln.name.split(',')[0]}, ${editing.d.weekday} ${editing.s.toUpperCase()}`);
    setEditing(null);
  };

  const nameColW = 220, sumColW = 132;
  const dayColW = sessions.length === 2 ? 64 : 40;

  const headCell = { position: 'sticky', top: 0, zIndex: 3, background: 'var(--surface-sunken)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 50 }}>
      {/* Header */}
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, boxShadow: 'var(--shadow-sm)', padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ width: 46, height: 46, borderRadius: 11, background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i data-lucide="calendar-check-2" style={{ width: 23, height: 23, color: '#fff' }}></i>
            </span>
            <div>
              <h1 className="grado-h2">Attendance Records</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
                <Pill tone="purple" variant="subtle" size="sm">{ADVISORY.name}</Pill>
                <span className="grado-body" style={{ color: 'var(--text-secondary)' }}>{ADVISORY.yearLevel} · {ADVISORY.learnerCount} learners · {ADVISORY.ay} · {ADVISORY.term}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="outline" size="sm" iconLeft="download" onClick={() => onFlash('Exporting CSV…')}>CSV</Button>
            <Button variant="outline" size="sm" iconLeft="file-text" onClick={() => onFlash('Exporting PDF…')}>PDF</Button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, boxShadow: 'var(--shadow-sm)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* week/month */}
          <div style={{ display: 'inline-flex', border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden' }}>
            {['week', 'month'].map((v) => (
              <button key={v} type="button" onClick={() => setView(v)} style={{ padding: '8px 16px', border: 'none', borderLeft: v === 'month' ? '1px solid var(--border-default)' : 'none', cursor: 'pointer', background: view === v ? 'var(--grado-blue-300)' : 'var(--surface-card)', color: view === v ? '#fff' : 'var(--text-secondary)', font: 'var(--fw-semibold) 13px/1 var(--font-sans)', textTransform: 'capitalize' }}>{v}</button>
            ))}
          </div>
          {/* session */}
          <div style={{ display: 'inline-flex', border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden' }}>
            {[['am', 'AM'], ['pm', 'PM'], ['both', 'AM + PM']].map(([v, lbl], i) => (
              <button key={v} type="button" onClick={() => setSession(v)} style={{ padding: '8px 14px', border: 'none', borderLeft: i ? '1px solid var(--border-default)' : 'none', cursor: 'pointer', background: session === v ? 'var(--color-brand)' : 'var(--surface-card)', color: session === v ? '#fff' : 'var(--text-secondary)', font: 'var(--fw-semibold) 13px/1 var(--font-sans)' }}>{lbl}</button>
            ))}
          </div>
          {view === 'week' && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <button type="button" onClick={() => moveWeek(-1)} aria-label="Previous week" style={iconBtn}><i data-lucide="chevron-left" style={{ width: 16, height: 16 }}></i></button>
              <button type="button" onClick={() => setWeekStart(8)} style={{ ...iconBtn, width: 'auto', padding: '0 12px', font: 'var(--fw-semibold) 13px/1 var(--font-sans)' }}>This week</button>
              <button type="button" onClick={() => moveWeek(1)} aria-label="Next week" style={iconBtn}><i data-lucide="chevron-right" style={{ width: 16, height: 16 }}></i></button>
              <span className="grado-body-strong" style={{ marginLeft: 6 }}>{weekLabel()}</span>
            </div>
          )}
          {view === 'month' && <span className="grado-body-strong" style={{ marginLeft: 2 }}>June 2026</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Switch size="sm" checked={showWeekends} onChange={() => setShowWeekends((v) => !v)} />
            <span className="grado-text-s" style={{ fontWeight: 600 }}>Weekends</span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Switch size="sm" checked={override} onChange={() => setOverride((v) => !v)} />
            <span className="grado-text-s" style={{ fontWeight: 600, color: override ? 'var(--color-brand)' : 'var(--text-secondary)' }}>Override mode</span>
          </div>
        </div>
      </div>

      {/* Override banner */}
      {override
        ? <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, background: 'var(--feedback-warning-bg)', border: '1px solid var(--grado-yellow-200)' }}>
            <i data-lucide="shield-alert" style={{ width: 18, height: 18, color: 'var(--grado-orange-300)' }}></i>
            <span className="grado-text-s" style={{ color: 'var(--grado-yellow-400)', fontWeight: 600 }}>Override mode is on — click any cell to change a record. Every change needs a reason and is written to the audit trail{auditCount ? ` (${auditCount} this session)` : ''}.</span>
          </div>
        : <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 2px' }}>
            <i data-lucide="lock" style={{ width: 14, height: 14, color: 'var(--text-muted)' }}></i>
            <span className="grado-text-s">Read-only view. Turn on <b style={{ fontWeight: 600 }}>Override mode</b> (advisers with permission) to correct a record.</span>
          </div>}

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span className="grado-eyebrow-sm">Legend</span>
        {window.ATT_STATUSES.map((s) => (
          <span key={s.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 18, height: 18, borderRadius: 5, background: s.fill, color: s.on, font: 'var(--fw-semibold) 10px/1 var(--font-sans)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.short}</span>
            <span className="grado-text-s" style={{ fontWeight: 600 }}>{s.label}</span>
          </span>
        ))}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 18, height: 18, borderRadius: 5, background: 'var(--grado-gray-100)', color: 'var(--grado-gray-400)', font: 'var(--fw-semibold) 10px/1 var(--font-sans)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>·</span>
          <span className="grado-text-s" style={{ fontWeight: 600 }}>No record</span>
        </span>
      </div>

      {/* Grid */}
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%' }}>
            <thead>
              <tr>
                <th style={{ ...headCell, left: 0, zIndex: 5, minWidth: nameColW, width: nameColW, textAlign: 'left', padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)' }}>
                  <span className="grado-eyebrow-sm">Learner</span>
                </th>
                {cols.map((d) => {
                  const today = d.iso === TODAY_ISO;
                  return (
                    <th key={d.iso} style={{ ...headCell, minWidth: dayColW, padding: '8px 4px', borderBottom: '1px solid var(--border-subtle)', background: today ? 'var(--grado-blue-100)' : 'var(--surface-sunken)' }}>
                      <div className="grado-text-xs" style={{ color: today ? 'var(--grado-blue-400)' : 'var(--text-muted)', fontWeight: 600 }}>{d.weekday}</div>
                      <div className="grado-num" style={{ fontSize: 13, fontWeight: 600, color: today ? 'var(--grado-blue-400)' : 'var(--text-primary)' }}>{d.dom}</div>
                      {sessions.length === 2 && <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 3 }}><span className="grado-text-xs" style={{ width: 26, fontSize: 9, letterSpacing: '.04em' }}>AM</span><span className="grado-text-xs" style={{ width: 26, fontSize: 9, letterSpacing: '.04em' }}>PM</span></div>}
                    </th>
                  );
                })}
                <th style={{ ...headCell, right: 0, zIndex: 5, minWidth: sumColW, width: sumColW, padding: '10px 12px', textAlign: 'right', borderBottom: '1px solid var(--border-subtle)', borderLeft: '1px solid var(--border-subtle)' }}>
                  <span className="grado-eyebrow-sm">Attendance</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {LEARNERS.map((ln, idx) => {
                const sum = learnerSummary(ln.id, idx);
                return (
                  <tr key={ln.id}>
                    <td style={{ position: 'sticky', left: 0, zIndex: 2, background: 'var(--surface-card)', minWidth: nameColW, width: nameColW, padding: '8px 16px', borderBottom: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: 'var(--surface-selected)', color: 'var(--color-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: 'var(--fw-semibold) 11px/1 var(--font-sans)' }}>{ln.name.split(',')[0].slice(0, 1)}{(ln.name.split(',')[1] || ' ').trim().slice(0, 1)}</span>
                        <span className="grado-body" style={{ fontWeight: 500, lineHeight: 1.25 }}>{ln.name}</span>
                      </div>
                    </td>
                    {cols.map((d) => {
                      const today = d.iso === TODAY_ISO;
                      return (
                        <td key={d.iso} style={{ padding: '6px 4px', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)', background: today ? 'rgba(44,123,229,0.05)' : 'transparent' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                            {sessions.map((s) => (
                              <RecCell key={s} status={getStatus(ln.id, d.iso, s, idx)} edited={isEdited(ln.id, d.iso, s)} clickable={override} onClick={() => onCellClick(ln, d, s, getStatus(ln.id, d.iso, s, idx))} />
                            ))}
                          </div>
                        </td>
                      );
                    })}
                    <td style={{ position: 'sticky', right: 0, zIndex: 2, background: 'var(--surface-card)', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', borderLeft: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        <span className="grado-num" style={{ fontSize: 14, fontWeight: 600, color: sum.rate === null ? 'var(--text-muted)' : sum.rate >= 90 ? 'var(--grado-green-300)' : sum.rate >= 75 ? 'var(--grado-yellow-400)' : 'var(--grado-red-300)' }}>{sum.rate === null ? '—' : sum.rate + '%'}</span>
                        <span className="grado-text-xs" style={{ whiteSpace: 'nowrap' }}>{sum.p}/{sum.l}/{sum.a}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ position: 'sticky', left: 0, zIndex: 2, background: 'var(--surface-sunken)', padding: '10px 16px', borderRight: '1px solid var(--border-subtle)' }}>
                  <span className="grado-eyebrow-sm">Daily totals (P / L / A)</span>
                </td>
                {cols.map((d) => {
                  const t = colTally(d);
                  const has = t.p + t.l + t.a > 0;
                  return (
                    <td key={d.iso} style={{ padding: '8px 4px', textAlign: 'center', background: 'var(--surface-sunken)' }}>
                      {has ? <div className="grado-num" style={{ fontSize: 11, lineHeight: 1.5 }}>
                        <span style={{ color: 'var(--grado-green-300)' }}>{t.p}</span> <span style={{ color: 'var(--grado-yellow-400)' }}>{t.l}</span> <span style={{ color: 'var(--grado-red-300)' }}>{t.a}</span>
                      </div> : <span className="grado-text-xs">—</span>}
                    </td>
                  );
                })}
                <td style={{ position: 'sticky', right: 0, zIndex: 2, background: 'var(--surface-sunken)', borderLeft: '1px solid var(--border-subtle)' }}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {editing && <OverrideModal learner={editing.ln} day={editing.d} session={editing.s} current={editing.cur} onSave={saveOverride} onClose={() => setEditing(null)} />}
    </div>
  );
}

const iconBtn = { width: 32, height: 32, borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--surface-card)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };

window.AttendanceRecords = AttendanceRecords;
