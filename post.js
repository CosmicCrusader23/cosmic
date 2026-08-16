(function () {
  'use strict';

  document.querySelectorAll('[data-copy-code]').forEach(function (button) {
    button.addEventListener('click', function () {
      var code = button.parentElement.querySelector('code');
      if (!code || !navigator.clipboard) return;
      navigator.clipboard.writeText(code.textContent).then(function () {
        var original = button.textContent;
        button.textContent = 'copied';
        window.setTimeout(function () { button.textContent = original; }, 1400);
      });
    });
  });
})();
