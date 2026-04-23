// 관리자 인증
const ADMIN_PASSWORD = '1234';
const AUTH_KEY = 'mapri_is_admin';

const Auth = {
  listeners: new Set(),
  isAdmin() {
    return sessionStorage.getItem(AUTH_KEY) === '1';
  },
  login(pw) {
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, '1');
      this.notify();
      return true;
    }
    return false;
  },
  logout() {
    sessionStorage.removeItem(AUTH_KEY);
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

window.Auth = Auth;
