// dashboard.js

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.card[data-link]').forEach(card => {
    card.style.cursor = 'pointer'; // Show pointer cursor on hover
    card.addEventListener('click', () => {
      const targetUrl = card.getAttribute('data-link');
      if (targetUrl) {
        window.location.href = targetUrl;
      }
    });
  });
});
