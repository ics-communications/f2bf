(function () {
  var menu = document.getElementById('f2bfMobileMenu');
  var burger = document.getElementById('f2bf-burger-btn');
  var close = document.getElementById('f2bf-mobile-close-btn');

  if (burger) {
    burger.addEventListener('click', function () {
      menu.classList.add('is-open');
    });
  }

  if (close) {
    close.addEventListener('click', function () {
      menu.classList.remove('is-open');
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) {
      menu.classList.remove('is-open');
    }
  });
})();
