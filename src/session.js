// 내 지사/센터 세션
const SESSION_KEY = 'mapri_my_center';

const Session = {
  listeners: new Set(),
  get() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    } catch { return null; }
  },
  set(branch, center) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ branch, center }));
    this.notify();
  },
  clear() {
    localStorage.removeItem(SESSION_KEY);
    this.notify();
  },
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  },
  notify() {
    this.listeners.forEach(fn => fn());
  },
};

window.Session = Session;
