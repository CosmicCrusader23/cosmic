(function () {
  'use strict';

  var html = document.documentElement;
  var toggle = document.getElementById('theme-toggle');

  function getAnchorOffset() {
    var nav = document.querySelector('.nav-bar');
    if (!nav) return 10;

    return Math.max(2, nav.getBoundingClientRect().bottom + 2);
  }

  function alignHashTarget() {
    if (!window.location.hash) return;

    var id = decodeURIComponent(window.location.hash.slice(1));
    var target = document.getElementById(id);
    if (!target) {
      target = document.getElementById(id.replace(/[.,;:!?]+$/, ''));
    }
    if (!target) return;

    var labelledBy = target.getAttribute('aria-labelledby');
    if (labelledBy) {
      var heading = document.getElementById(labelledBy);
      if (heading) target = heading;
    }

    window.scrollTo({
      top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - getAnchorOffset()),
      behavior: 'auto'
    });
  }

  window.addEventListener('hashchange', alignHashTarget);
  window.addEventListener('load', alignHashTarget);
  window.setTimeout(alignHashTarget, 0);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(alignHashTarget);
  }

  if (!toggle) return;

  function setButtonState(isDark) {
    html.classList.toggle('dark', isDark);
    html.classList.toggle('light', !isDark);
    toggle.classList.toggle('is-dark', isDark);
    toggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    toggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
  }

  var savedTheme = localStorage.getItem('theme');
  var isDark = !savedTheme || savedTheme === 'dark';
  setButtonState(isDark);

  toggle.addEventListener('click', function () {
    isDark = !html.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    setButtonState(isDark);
    toggle.animate(
      [{ transform: 'rotate(0deg)' }, { transform: 'rotate(180deg)' }, { transform: 'rotate(0deg)' }],
      { duration: 360, easing: 'cubic-bezier(.25,.46,.45,.94)' }
    );
  });
})();
