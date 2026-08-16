(function () {
  'use strict';

  var html = document.documentElement;
  var toggle = document.getElementById('theme-toggle');
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
