document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.card[data-link]').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      const targetUrl = card.getAttribute('data-link');
      if (targetUrl) {
        window.location.href = targetUrl;
      }
    });
  });
});
