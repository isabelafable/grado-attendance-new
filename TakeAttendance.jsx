// Take Attendance — the fast marking screen. AM/PM separated, segmented
// Present/Late/Absent, inline remarks, bulk actions, draft + submit + audit.

function SummaryStrip({ st }) {
  const cell = (n, conf, faded) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <span style={{
        minWidth: 26, height: 26, padding: '0 7px', borderRadius: 7,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: faded ? 'var(--surface-sunken)' : conf.tint,
        color: faded ? 'var(--text-muted)' : conf.fg,
        border: faded ? '1px solid var(--border-subtle)' : 'none',
        font: 'var(--fw-semibold) 14px/1 var(--font-mono)',
      }}>{n}</span>
      <span className="grado-text-s" style={{ color: faded ? 'var(--text-muted)' : conf.fg, fontWeight: 600 }}>{conf.label}</span>
    </div>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      {cell(st.counts.present, window.ATT_BY_KEY.present)}
      {cell(st.counts.late, window.ATT_BY_KEY.late)}
      {cell(st.counts.absent, window.ATT_BY_KEY.absent)}
      {cell(st.unmarked, { tint: '', fg: '', label: 'Unmarked' }, true)}
    </div>
  );
}

const LATE_CHIPS = ['Traffic / transport', 'Weather', 'Health reason', 'Family reason', 'No reason provided', 'Other'];
const ABSENT_CHIPS = ['Sick', 'Family matter', 'Parent informed', 'Weather / transport', 'No information yet', 'Other'];
const CLASS_OPTS = [
  { key: 'pending', label: 'Pending', fill: 'var(--grado-gray-500)' },
  { key: 'excused', label: 'Excused', fill: 'var(--grado-green-300)' },
  { key: 'unexcused', label: 'Unexcused', fill: 'var(--grado-red-300)' },
];

function Chip({ label, selected, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '4px 9px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap',
      border: '1px solid ' + (selected ? 'var(--border-brand)' : 'var(--border-default)'),
      background: selected ? 'var(--surface-selected)' : 'var(--surface-card)',
      color: selected ? 'var(--color-brand)' : 'var(--text-secondary)',
      font: 'var(--fw-semibold) 11.5px/1.2 var(--font-sans)', transition: 'all 110ms ease',
    }}>{label}</button>
  );
}

function ClassificationControl({ value, onChange }) {
  const v = value || 'pending';
  return (
    <div style={{ display: 'inline-flex', border: '1px solid var(--border-default)', borderRadius: 7, overflow: 'hidden' }}>
      {CLASS_OPTS.map((o, i) => {
        const active = v === o.key;
        return (
          <button key={o.key} type="button" onClick={() => onChange(o.key)} style={{
            padding: '5px 11px', border: 'none', borderLeft: i ? '1px solid var(--border-subtle)' : 'none', cursor: 'pointer',
            background: active ? o.fill : 'transparent', color: active ? '#fff' : 'var(--text-secondary)',
            font: 'var(--fw-semibold) 12px/1 var(--font-sans)', transition: 'all 110ms ease',
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

function RemarkEditor({ status, remark, tag, absence, locked, onRemark, onTag, onAbsence }) {
  const chips = status === 'absent' ? ABSENT_CHIPS : LATE_CHIPS;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {locked ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {tag
            ? <span style={{ padding: '4px 10px', borderRadius: 999, background: 'var(--surface-selected)', color: 'var(--color-brand)', font: 'var(--fw-semibold) 12px/1.2 var(--font-sans)' }}>{tag}</span>
            : <span className="grado-text-s" style={{ color: 'var(--grado-gray-400)' }}>No reason given</span>}
          {remark ? <span className="grado-text-s" style={{ color: 'var(--text-secondary)' }}>“{remark}”</span> : null}
        </div>
      ) : (
        <React.Fragment>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {chips.map((c) => <Chip key={c} label={c} selected={tag === c} onClick={() => onTag(tag === c ? null : c)} />)}
          </div>
          <input
            value={remark || ''}
            onChange={(e) => onRemark(e.target.value)}
            placeholder={tag === 'Other' ? 'Please specify…' : 'Add detail (optional)'}
            style={{
              width: '100%', maxWidth: 340, height: 34, padding: '0 12px', borderRadius: 6,
              border: '1px solid var(--border-default)', background: 'var(--surface-card)',
              font: 'var(--fw-regular) 13px/1 var(--font-sans)', color: 'var(--text-primary)', outline: 'none',
            }}
            onFocus={(e) => { e.currentTarget.style.border = '2px solid var(--border-focus)'; e.currentTarget.style.padding = '0 11px'; }}
            onBlur={(e) => { e.currentTarget.style.border = '1px solid var(--border-default)'; e.currentTarget.style.padding = '0 12px'; }}
          />
        </React.Fragment>
      )}
      {status === 'absent' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="grado-eyebrow-sm" style={{ fontSize: 10 }}>Validation</span>
          <ClassificationControl value={absence} onChange={onAbsence} />
          {locked && <span className="grado-text-xs" style={{ color: 'var(--text-muted)' }}>editable after submission</span>}
        </div>
      )}
    </div>
  );
}

function LearnerRow({ idx, learner, status, remark, tag, absence, locked, onMark, onRemark, onTag, onAbsence, rowRef, onKeyNav }) {
  const showRemark = status === 'late' || status === 'absent' || (remark && remark.length) || tag;
  const conf = window.ATT_BY_KEY[status];
  return (
    <div
      ref={rowRef}
      tabIndex={locked ? -1 : 0}
      onKeyDown={(e) => {
        if (locked) return;
        const k = e.key.toLowerCase();
        const map = { p: 'present', '1': 'present', l: 'late', '2': 'late', a: 'absent', '3': 'absent' };
        if (map[k]) { e.preventDefault(); onMark(learner.id, map[k]); }
        else if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); onKeyNav(idx + 1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); onKeyNav(idx - 1); }
      }}
      className="att-learner-row"
      style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '12px 18px',
        borderTop: '1px solid var(--border-subtle)', outline: 'none',
        background: status ? 'var(--surface-card)' : 'var(--surface-card)',
        borderLeft: '3px solid ' + (conf ? conf.fill : 'transparent'),
        transition: 'border-color 130ms ease',
      }}
      onFocus={(e) => { if (!locked) e.currentTarget.style.background = 'var(--grado-dark-purple-50)'; }}
      onBlur={(e) => { e.currentTarget.style.background = 'var(--surface-card)'; }}
    >
      <span className="grado-num" style={{ width: 24, color: 'var(--text-muted)', fontSize: 13, flexShrink: 0, textAlign: 'right' }}>{idx + 1}</span>
      <div className="att-name" style={{ flex: '1 1 170px', minWidth: 150, display: 'flex', alignItems: 'center', gap: 11 }}>
        <span style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: 'var(--surface-selected)',
          color: 'var(--color-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          font: 'var(--fw-semibold) 12px/1 var(--font-sans)',
        }}>{learner.name.split(',')[0].slice(0, 1)}{(learner.name.split(',')[1] || ' ').trim().slice(0, 1)}</span>
        <span className="grado-body-strong" style={{ lineHeight: 1.3 }}>{learner.name}</span>
      </div>
      <div className="att-status" style={{ flex: '0 0 auto', width: 312, maxWidth: '100%' }}>
        <window.StatusSegmented value={status || null} onChange={(v) => onMark(learner.id, v)} disabled={locked} />
      </div>
      <div className="att-remark" style={{ flex: '1 1 300px', minWidth: 240 }}>
        {showRemark ? (
          <RemarkEditor
            status={status} remark={remark} tag={tag} absence={absence} locked={locked}
            onRemark={(t) => onRemark(learner.id, t)} onTag={(c) => onTag(learner.id, c)} onAbsence={(c) => onAbsence(learner.id, c)}
          />
        ) : (
          <span className="grado-text-s" style={{ color: 'var(--grado-gray-400)' }}>{status === 'present' ? '—' : 'No remark needed'}</span>
        )}
      </div>
    </div>
  );
}

function ConfirmModal({ title, children, confirmLabel, confirmIcon, tone, onConfirm, onClose, confirmDisabled }) {
  const { Button: TButton } = window.GradoDesignSystem_045d50;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--overlay-scrim)', zIndex: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--surface-card)', borderRadius: 12, boxShadow: 'var(--shadow-lg)',
        width: 'min(480px, 100%)', overflow: 'hidden',
      }}>
        <div style={{ padding: '20px 22px 0' }}>
          <h3 className="grado-h3">{title}</h3>
          <div className="grado-body" style={{ color: 'var(--text-secondary)', marginTop: 10, lineHeight: 1.55 }}>{children}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: 18, marginTop: 8 }}>
          <TButton variant="ghost" onClick={onClose}>Cancel</TButton>
          <TButton variant="primary" iconLeft={confirmIcon} onClick={onConfirm} disabled={confirmDisabled}
            style={tone === 'danger' ? { background: 'var(--grado-red-300)' } : undefined}>{confirmLabel}</TButton>
        </div>
      </div>
    </div>
  );
}

function TakeAttendance({ data, cls, session, sess, onMark, onRemark, onTag, onAbsence, onMarkAllPresent, onSaveDraft, onSubmit, onReopen, onSwitchSession, onBack }) {
  const { Button: TButton, Pill: TPill } = window.GradoDesignSystem_045d50;
  const { TODAY } = data;
  const LEARNERS = cls.learners;
  const [exceptionsOnly, setExceptionsOnly] = React.useState(false);
  const [modal, setModal] = React.useState(null); // 'submit' | 'reopen'
  const [reason, setReason] = React.useState('');
  const [savedFlash, setSavedFlash] = React.useState(false);
  const rowRefs = React.useRef([]);
  const total = LEARNERS.length;
  const st = window.sessionState(sess, total);
  const locked = !!sess.submitted;
  const label = session === 'am' ? 'AM Attendance' : 'PM Attendance';

  React.useEffect(() => { window.lucide && window.lucide.createIcons(); });

  const visible = LEARNERS.filter((l) => {
    if (!exceptionsOnly) return true;
    const s = sess.marks[l.id];
    return s === 'late' || s === 'absent' || !s;
  });
  const focusRow = (i) => { const r = rowRefs.current[i]; if (r) r.focus(); };
  const doSave = () => { onSaveDraft(); setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1800); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 40 }}>
      {/* Header card */}
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <div style={{ padding: 22, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ width: 46, height: 46, borderRadius: 11, background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i data-lucide={cls.kind === 'advisory' ? 'calendar-check-2' : 'book-open'} style={{ width: 23, height: 23, color: '#fff' }}></i>
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 className="grado-h2">{cls.title}</h1>
                <TPill tone={cls.pillTone} variant="solid" size="sm">{cls.pillLabel}</TPill>
              </div>
              <div className="grado-body" style={{ color: 'var(--text-secondary)', marginTop: 3 }}>
                {cls.meta} · {TODAY.long}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            {locked
              ? <TPill tone="green" variant="subtle" dot>Submitted</TPill>
              : st.state === 'draft'
                ? <TPill tone="blue" variant="subtle" dot>Draft — not submitted</TPill>
                : <TPill tone="gray" variant="subtle" dot>Not started</TPill>}
            {/* AM / PM switch — sessions not offered by this class are locked */}
            <div style={{ display: 'inline-flex', border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden' }}>
              {['am', 'pm'].map((s) => {
                const enabled = cls.sessions.includes(s);
                const t = s === 'am' ? cls.amTime : cls.pmTime;
                return (
                  <button key={s} type="button" disabled={!enabled} onClick={() => enabled && onSwitchSession(s)}
                    title={enabled ? '' : 'This class meets only in the ' + cls.sessions[0].toUpperCase() + ' session'}
                    style={{
                      padding: '8px 18px', border: 'none', cursor: enabled ? 'pointer' : 'not-allowed',
                      borderLeft: s === 'pm' ? '1px solid var(--border-default)' : 'none',
                      background: !enabled ? 'var(--surface-sunken)' : session === s ? 'var(--grado-blue-300)' : 'var(--surface-card)',
                      color: !enabled ? 'var(--text-disabled)' : session === s ? '#fff' : 'var(--text-secondary)',
                      font: 'var(--fw-semibold) 13px/1 var(--font-sans)',
                      display: 'flex', alignItems: 'center', gap: 7,
                    }}>
                    <i data-lucide={!enabled ? 'lock' : s === 'am' ? 'sunrise' : 'sunset'} style={{ width: 15, height: 15 }}></i>
                    {s.toUpperCase()}{enabled && t ? ' · ' + t : ''}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {locked && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 10, background: 'var(--feedback-success-bg)', border: '1px solid var(--grado-green-200)' }}>
          <i data-lucide="shield-check" style={{ width: 20, height: 20, color: 'var(--grado-green-300)', flexShrink: 0 }}></i>
          <div style={{ flex: 1 }}>
            <div className="grado-body-strong" style={{ color: 'var(--grado-green-400)' }}>{label} submitted</div>
            <div className="grado-text-s" style={{ color: 'var(--grado-green-400)', marginTop: 1 }}>
              Submitted by {data.TEACHER.name} · {sess.submittedAt}. Changes after submission require a reason and are logged.
            </div>
          </div>
          <TButton variant="outline" size="sm" iconLeft="pencil" onClick={() => { setReason(''); setModal('reopen'); }}>Edit attendance</TButton>
        </div>
      )}

      {/* Sticky action + summary bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20, background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)', borderRadius: 12, boxShadow: 'var(--shadow-sm)',
        padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <TButton variant="secondary" size="sm" iconLeft="check-check" onClick={onMarkAllPresent} disabled={locked}>Mark all present</TButton>
          <button type="button" onClick={() => setExceptionsOnly((v) => !v)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 12px', borderRadius: 6, cursor: 'pointer',
            border: '1px solid ' + (exceptionsOnly ? 'var(--border-brand)' : 'var(--border-default)'),
            background: exceptionsOnly ? 'var(--surface-selected)' : 'var(--surface-card)',
            color: exceptionsOnly ? 'var(--color-brand)' : 'var(--text-secondary)',
            font: 'var(--fw-semibold) 13px/1 var(--font-sans)',
          }}>
            <i data-lucide="filter" style={{ width: 15, height: 15 }}></i>
            Show late / absent only
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <SummaryStrip st={st} />
          {!locked && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {savedFlash && <span className="grado-text-s" style={{ color: 'var(--grado-green-300)', display: 'inline-flex', alignItems: 'center', gap: 5 }}><i data-lucide="check" style={{ width: 14, height: 14 }}></i>Saved</span>}
              <TButton variant="outline" size="sm" iconLeft="save" onClick={doSave}>Save draft</TButton>
              <TButton variant="primary" size="sm" iconLeft="send" onClick={() => setModal('submit')}>Submit attendance</TButton>
            </div>
          )}
        </div>
      </div>

      {/* Tip */}
      {!locked && (
        <p className="grado-text-s" style={{ display: 'flex', alignItems: 'center', gap: 7, margin: '-4px 2px 0' }}>
          <i data-lucide="keyboard" style={{ width: 15, height: 15 }}></i>
          Tip — click a row, then press <b style={{ fontWeight: 600 }}>P</b> / <b style={{ fontWeight: 600 }}>L</b> / <b style={{ fontWeight: 600 }}>A</b> to mark and <b style={{ fontWeight: 600 }}>↓</b> to drop to the next learner.
        </p>
      )}

      {/* Learner list */}
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
        <div className="att-list-head" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '11px 18px', background: 'var(--surface-sunken)' }}>
          <span style={{ width: 24, flexShrink: 0 }}></span>
          <span className="grado-eyebrow-sm att-name" style={{ flex: '1 1 170px', minWidth: 150 }}>Learner</span>
          <span className="grado-eyebrow-sm att-status" style={{ flex: '0 0 auto', width: 312 }}>Status</span>
          <span className="grado-eyebrow-sm att-remark" style={{ flex: '1 1 300px', minWidth: 240 }}>Remark</span>
        </div>
        {visible.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <i data-lucide="party-popper" style={{ width: 32, height: 32, color: 'var(--grado-green-300)' }}></i>
            <p className="grado-body" style={{ marginTop: 10, color: 'var(--text-secondary)' }}>No exceptions — everyone is marked present.</p>
          </div>
        )}
        {visible.map((l) => {
          const realIdx = LEARNERS.indexOf(l);
          return (
            <LearnerRow
              key={l.id}
              idx={realIdx}
              learner={l}
              status={sess.marks[l.id]}
              remark={sess.remarks[l.id]}
              tag={(sess.tags || {})[l.id]}
              absence={(sess.absence || {})[l.id]}
              locked={locked}
              onMark={onMark}
              onRemark={onRemark}
              onTag={onTag}
              onAbsence={onAbsence}
              rowRef={(el) => { rowRefs.current[realIdx] = el; }}
              onKeyNav={focusRow}
            />
          );
        })}
      </div>

      {/* Bottom submit bar */}
      {!locked && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginTop: 4 }}>
          <span className="grado-text-s" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {st.unmarked > 0
              ? <React.Fragment><i data-lucide="alert-circle" style={{ width: 15, height: 15, color: 'var(--grado-orange-300)' }}></i>{st.unmarked} learner{st.unmarked === 1 ? '' : 's'} still unmarked</React.Fragment>
              : <React.Fragment><i data-lucide="check-circle-2" style={{ width: 15, height: 15, color: 'var(--grado-green-300)' }}></i>All {total} learners marked</React.Fragment>}
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <TButton variant="outline" iconLeft="save" onClick={doSave}>Save draft</TButton>
            <TButton variant="primary" iconLeft="send" onClick={() => setModal('submit')}>Submit {label}</TButton>
          </div>
        </div>
      )}

      {modal === 'submit' && (
        <ConfirmModal
          title={'Submit ' + label + '?'}
          confirmLabel="Submit attendance" confirmIcon="send"
          onConfirm={() => { onSubmit(); setModal(null); }}
          onClose={() => setModal(null)}
        >
          You're about to submit <b style={{ fontWeight: 600 }}>{label}</b> for {cls.title} on {TODAY.short}.
          <div style={{ display: 'flex', gap: 14, margin: '14px 0 4px', flexWrap: 'wrap' }}>
            <SummaryStrip st={st} />
          </div>
          {st.unmarked > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--grado-orange-300)', fontWeight: 600, fontSize: 13 }}>
              <i data-lucide="alert-triangle" style={{ width: 15, height: 15 }}></i>{st.unmarked} unmarked learner{st.unmarked === 1 ? '' : 's'} will be left blank.
            </span>
          )}
        </ConfirmModal>
      )}

      {modal === 'reopen' && (
        <ConfirmModal
          title="Edit submitted attendance"
          confirmLabel="Unlock & edit" confirmIcon="unlock" tone="danger"
          confirmDisabled={reason.trim().length < 4}
          onConfirm={() => { onReopen(reason.trim()); setModal(null); }}
          onClose={() => setModal(null)}
        >
          This record was already submitted. Editing reopens it and is recorded in the audit trail. Please give a reason.
          <input
            value={reason} onChange={(e) => setReason(e.target.value)} autoFocus
            placeholder="e.g. Corrected a learner marked absent by mistake"
            style={{ width: '100%', height: 40, marginTop: 12, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-default)', font: 'var(--fw-regular) 14px/1 var(--font-sans)', outline: 'none' }}
          />
        </ConfirmModal>
      )}
    </div>
  );
}

window.TakeAttendance = TakeAttendance;
