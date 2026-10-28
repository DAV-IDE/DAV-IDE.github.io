/* Pomodoro Timer website — language switch and Supabase helpers shared by the pages */
(function () {
  'use strict';

  // Public project values (the same ones shipped in the app): safe to expose, access is enforced by RLS
  const SUPABASE_URL = 'https://pcjtjyfwmeqfgsbfszgp.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjanRqeWZ3bWVxZmdzYmZzemdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MTI5OTMsImV4cCI6MjEwNDA4ODk5M30.c1cZy7Vy9mTvABFH62ZjGbZKjxW_K6jLVxgG9h3mw0w';
  const APP_SCHEME = 'pomodorotimer://';

  function readLang() {
    // ?lang= from the toggle; #it / #en from older links to the privacy and account-deletion pages
    const fromQuery = new URLSearchParams(window.location.search).get('lang') || window.location.hash.slice(1);
    if (fromQuery === 'it' || fromQuery === 'en') {
      try { localStorage.setItem('pomodoro-site-lang', fromQuery); } catch { /* storage blocked */ }
      return fromQuery;
    }
    try {
      const saved = localStorage.getItem('pomodoro-site-lang');
      if (saved === 'it' || saved === 'en') return saved;
    } catch { /* storage blocked */ }
    return (navigator.language || 'it').toLowerCase().indexOf('it') === 0 ? 'it' : 'en';
  }

  const lang = readLang();

  // Fills every [data-i18n] element from strings[lang], shows only the sections in that language
  // (pages written in both languages) and marks the active language link
  function translate(strings) {
    const table = strings[lang] || strings.it;
    document.documentElement.lang = lang;
    document.querySelectorAll('main [lang]').forEach(function (el) {
      el.hidden = el.getAttribute('lang') !== lang;
    });
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      const value = table[el.getAttribute('data-i18n')];
      if (value !== undefined) el.textContent = value;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      const value = table[el.getAttribute('data-i18n-placeholder')];
      if (value !== undefined) el.setAttribute('placeholder', value);
    });
    if (table.pageTitle) document.title = table.pageTitle;
    document.querySelectorAll('.lang-switch a').forEach(function (link) {
      link.setAttribute('aria-current', link.getAttribute('data-lang') === lang ? 'true' : 'false');
    });
    return table;
  }

  // Auth links carry their result in the query (PKCE) or, for errors, sometimes in the hash
  function readAuthParams() {
    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    return {
      code: params.get('code'),
      error: params.get('error') || hash.get('error'),
      errorCode: params.get('error_code') || hash.get('error_code'),
      errorDescription: params.get('error_description') || hash.get('error_description'),
    };
  }

  // Removes one-time codes from the address bar (history, screenshots, shared links)
  function clearAuthParams() {
    const keep = new URLSearchParams(window.location.search).get('lang');
    const clean = window.location.pathname + (keep ? '?lang=' + keep : '');
    window.history.replaceState(null, '', clean);
  }

  function createClient() {
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { flowType: 'pkce', detectSessionInUrl: false, persistSession: true },
    });
  }

  // PKCE: the verifier exists only in the browser (or app) that asked for the email
  function hasCodeVerifier() {
    const ref = SUPABASE_URL.split('//')[1].split('.')[0];
    try {
      return Boolean(localStorage.getItem('sb-' + ref + '-auth-token-code-verifier'));
    } catch {
      return false;
    }
  }

  function appLink(path, code) {
    return APP_SCHEME + path + (code ? '?code=' + encodeURIComponent(code) : '');
  }

  function isMobile() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  function show(id) {
    document.querySelectorAll('[data-state]').forEach(function (el) {
      el.hidden = el.getAttribute('data-state') !== id;
    });
  }

  window.PomodoroSite = {
    lang: lang,
    translate: translate,
    readAuthParams: readAuthParams,
    clearAuthParams: clearAuthParams,
    createClient: createClient,
    hasCodeVerifier: hasCodeVerifier,
    appLink: appLink,
    isMobile: isMobile,
    show: show,
  };
})();
