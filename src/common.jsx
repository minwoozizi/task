// 공통 컴포넌트: Icon, Modal, Toast, ConfirmModal, AdminGate
const { useState, useEffect, useRef, useCallback, useMemo } = React;

// ============ Icon ============
const Icon = ({ name, size = 16, ...props }) => {
  const paths = {
    'menu': <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>,
    'x': <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>,
    'home': <path d="M3 12L12 3l9 9M5 10v10h14V10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    'upload': <path d="M12 3v12M6 9l6-6 6 6M4 21h16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    'trending': <path d="M3 17l6-6 4 4 8-8M14 7h7v7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    'list': <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>,
    'shield': <path d="M12 2l8 3v7c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V5l8-3z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    'users': <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    'chart': <path d="M3 3v18h18M7 16l4-4 4 4 5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    'settings': <><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
    'lock': <><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2" fill="none"/></>,
    'unlock': <><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M7 11V7a5 5 0 019.9-1" stroke="currentColor" strokeWidth="2" fill="none"/></>,
    'trash': <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M6 6l1 14a2 2 0 002 2h6a2 2 0 002-2l1-14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    'refresh': <path d="M1 4v6h6M23 20v-6h-6M3.5 9A9 9 0 0118.3 5.3L23 10M1 14l4.7 4.7A9 9 0 0020.5 15" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    'check': <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    'download': <path d="M12 3v12M6 13l6 6 6-6M4 21h16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    'plus': <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>,
    'edit': <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    'building': <><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M9 21V9h6v12M3 10h18" stroke="currentColor" strokeWidth="2"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...props}>
      {paths[name] || null}
    </svg>
  );
};

// ============ Toast ============
const ToastStore = {
  toasts: [],
  listeners: new Set(),
  add(msg, type = 'success') {
    const id = Date.now() + Math.random();
    this.toasts.push({ id, msg, type });
    this.notify();
    setTimeout(() => this.remove(id), 2500);
  },
  remove(id) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  },
  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
  notify() { this.listeners.forEach(fn => fn()); },
};
window.toast = (msg, type) => ToastStore.add(msg, type);

const ToastWrap = () => {
  const [, force] = useState(0);
  useEffect(() => ToastStore.subscribe(() => force(x => x + 1)), []);
  return (
    <div className="toast-wrap">
      {ToastStore.toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>
      ))}
    </div>
  );
};

// ============ Modal ============
const Modal = ({ open, onClose, title, children, footer, size }) => {
  if (!open) return null;
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className={`modal ${size === 'lg' ? 'modal-lg' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="btn-ghost" style={{ padding: 4, border: 'none' }} onClick={onClose}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

// ============ AdminGate (관리자 인증 모달) ============
const AdminGateStore = {
  pending: null,
  listeners: new Set(),
  request(fn) {
    if (window.Auth.isAdmin()) { fn(); return; }
    this.pending = fn;
    this.notify();
  },
  cancel() { this.pending = null; this.notify(); },
  confirmed() {
    const fn = this.pending;
    this.pending = null;
    this.notify();
    if (fn) fn();
  },
  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
  notify() { this.listeners.forEach(fn => fn()); },
};
window.requireAdmin = (fn) => AdminGateStore.request(fn);

const AdminGateModal = () => {
  const [, force] = useState(0);
  const [pw, setPw] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef = useRef();

  useEffect(() => AdminGateStore.subscribe(() => force(x => x + 1)), []);
  useEffect(() => {
    if (AdminGateStore.pending) {
      setPw('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [AdminGateStore.pending]);

  const submit = () => {
    if (window.Auth.login(pw)) {
      window.toast('관리자 모드 진입', 'success');
      AdminGateStore.confirmed();
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setPw('');
    }
  };

  return (
    <Modal
      open={!!AdminGateStore.pending}
      onClose={() => AdminGateStore.cancel()}
      title="관리자 인증"
      footer={<>
        <button className="btn btn-ghost" onClick={() => AdminGateStore.cancel()}>취소</button>
        <button className="btn btn-coral" onClick={submit}>확인</button>
      </>}
    >
      <p style={{ fontSize: 13, color: 'var(--gray-700)', margin: '0 0 12px' }}>
        이 기능은 관리자만 사용할 수 있습니다. 관리자 비밀번호를 입력하세요.
      </p>
      <input
        ref={inputRef}
        type="password"
        className={`input ${shake ? 'shake' : ''}`}
        value={pw}
        onChange={e => setPw(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        placeholder="비밀번호"
      />
    </Modal>
  );
};

// ============ Confirm ============
const ConfirmStore = {
  pending: null,
  listeners: new Set(),
  ask(opts) { return new Promise(resolve => { this.pending = { ...opts, resolve }; this.notify(); }); },
  resolve(v) { const p = this.pending; this.pending = null; this.notify(); if (p) p.resolve(v); },
  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
  notify() { this.listeners.forEach(fn => fn()); },
};
window.confirmDialog = (opts) => ConfirmStore.ask(opts);

const ConfirmModal = () => {
  const [, force] = useState(0);
  useEffect(() => ConfirmStore.subscribe(() => force(x => x + 1)), []);
  const p = ConfirmStore.pending;
  return (
    <Modal
      open={!!p}
      onClose={() => ConfirmStore.resolve(false)}
      title={p?.title || '확인'}
      footer={<>
        <button className="btn btn-ghost" onClick={() => ConfirmStore.resolve(false)}>{p?.cancelText || '취소'}</button>
        <button className={`btn ${p?.danger ? 'btn-danger' : 'btn-coral'}`} onClick={() => ConfirmStore.resolve(true)}>{p?.okText || '확인'}</button>
      </>}
    >
      <p style={{ fontSize: 13, margin: 0 }}>{p?.message}</p>
    </Modal>
  );
};

window.Icon = Icon;
window.Modal = Modal;
window.ToastWrap = ToastWrap;
window.AdminGateModal = AdminGateModal;
window.ConfirmModal = ConfirmModal;
