// Segmented attendance status control (Present / Late / Absent) with Grado
// semantic colors, plus shared status config + small status badge.
const ATT_STATUSES = [
  { key: 'present', label: 'Present', short: 'P', tone: 'green',  fill: 'var(--grado-green-300)',  on: '#fff',                 tint: 'var(--grado-green-100)',  fg: 'var(--grado-green-400)',  icon: 'check' },
  { key: 'late',    label: 'Late',    short: 'L', tone: 'yellow', fill: 'var(--grado-yellow-300)', on: 'var(--grado-gray-700)', tint: 'var(--grado-yellow-100)', fg: 'var(--grado-yellow-400)', icon: 'clock' },
  { key: 'absent',  label: 'Absent',  short: 'A', tone: 'red',    fill: 'var(--grado-red-300)',    on: '#fff',                 tint: 'var(--grado-red-100)',    fg: 'var(--grado-red-400)',    icon: 'x' },
];
const ATT_BY_KEY = Object.fromEntries(ATT_STATUSES.map((s) => [s.key, s]));

function StatusSegmented({ value, onChange, size = 'md', disabled = false }) {
  const h = size === 'sm' ? 34 : 42;
  const fs = size === 'sm' ? 13 : 14;
  return (
    <div
      role="group"
      style={{
        display: 'inline-flex',
        border: '1px solid var(--border-default)',
        borderRadius: 8,
        overflow: 'hidden',
        background: 'var(--surface-card)',
        opacity: disabled ? 0.55 : 1,
        width: '100%',
        maxWidth: 360,
      }}
    >
      {ATT_STATUSES.map((s, i) => {
        const active = value === s.key;
        return (
          <button
            key={s.key}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onChange(active ? null : s.key)}
            style={{
              flex: 1,
              height: h,
              border: 'none',
              borderLeft: i === 0 ? 'none' : '1px solid var(--border-subtle)',
              background: active ? s.fill : 'transparent',
              color: active ? s.on : 'var(--text-secondary)',
              font: `var(--fw-semibold) ${fs}px/1 var(--font-sans)`,
              cursor: disabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'background 130ms ease, color 130ms ease',
              WebkitTapHighlightColor: 'transparent',
            }}
            onMouseEnter={(e) => { if (!active && !disabled) { e.currentTarget.style.background = s.tint; e.currentTarget.style.color = s.fg; } }}
            onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
          >
            <i data-lucide={s.icon} style={{ width: 15, height: 15, strokeWidth: 2.25 }}></i>
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

// Small filled status badge for summaries / submitted view.
function StatusBadge({ status, size = 'md' }) {
  const s = ATT_BY_KEY[status];
  if (!s) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: size === 'sm' ? '2px 8px' : '3px 10px', borderRadius: 999,
        background: 'var(--surface-sunken)', color: 'var(--text-muted)',
        border: '1px solid var(--border-subtle)',
        font: `var(--fw-semibold) ${size === 'sm' ? 11 : 12}px/1.4 var(--font-sans)`,
      }}>—</span>
    );
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: size === 'sm' ? '2px 9px' : '3px 11px', borderRadius: 999,
      background: s.tint, color: s.fg,
      font: `var(--fw-semibold) ${size === 'sm' ? 11 : 12}px/1.4 var(--font-sans)`,
    }}>
      <i data-lucide={s.icon} style={{ width: 13, height: 13, strokeWidth: 2.5 }}></i>
      {s.label}
    </span>
  );
}

// Derive a session's roll-up from its marks. total = learner count.
function sessionState(sess, total) {
  const marks = (sess && sess.marks) || {};
  const counts = { present: 0, late: 0, absent: 0 };
  let marked = 0;
  for (const k in marks) {
    if (marks[k]) { counts[marks[k]] = (counts[marks[k]] || 0) + 1; marked++; }
  }
  const unmarked = Math.max(0, total - marked);
  let state = 'pending';
  if (sess && sess.submitted) state = 'completed';
  else if (marked > 0) state = 'draft';
  return { counts, marked, unmarked, total, state };
}

const SESSION_META = {
  pending:   { label: 'Pending',     tone: 'gray',   pill: 'subtle' },
  draft:     { label: 'In progress', tone: 'blue',   pill: 'subtle' },
  completed: { label: 'Submitted',   tone: 'green',  pill: 'subtle' },
};

Object.assign(window, { ATT_STATUSES, ATT_BY_KEY, StatusSegmented, StatusBadge, sessionState, SESSION_META });
