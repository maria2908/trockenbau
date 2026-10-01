'use strict';
<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>

const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

const menuButton = document.getElementById('menu-button');
const mobileMenu = document.getElementById('mobile-menu');
const header = document.getElementById('site-header');
const backToTop = document.getElementById('back-to-top');
const currentYear = document.getElementById('current-year');

if (currentYear) currentYear.textContent = new Date().getFullYear();

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  mobileMenu.classList.toggle('hidden');
  menuButton.setAttribute('aria-label', isOpen ? 'Menü öffnen' : 'Menü schließen');
});

document.querySelectorAll('#mobile-menu a').forEach((link) => {
  link.addEventListener('click', () => {
    mobileMenu.classList.add('hidden');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Menü öffnen');
  });
});

window.addEventListener('scroll', () => {
  const scrolled = window.scrollY > 40;
  header?.classList.toggle('scrolled', scrolled);
  backToTop?.classList.toggle('hidden', window.scrollY < 600);
}, { passive: true });

backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

function initializeComparison(comparison) {
  if (comparison.dataset.initialized) return;
  comparison.dataset.initialized = 'true';

  const range = comparison.querySelector('input[type="range"]');
  const after = comparison.querySelector('.comparison-after');
  const afterImage = after.querySelector('img');

  const updateComparison = () => {
    const value = `${range.value}%`;
    after.style.width = value;
    afterImage.style.width = `${comparison.clientWidth}px`;
    comparison.style.setProperty('--position', value);
  };

  range.addEventListener('input', updateComparison);
  window.addEventListener('resize', updateComparison);
  updateComparison();
}

document.querySelectorAll('[data-comparison]').forEach(initializeComparison);

document.querySelectorAll('[data-project-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    const category = button.dataset.projectFilter;
    document.querySelectorAll('[data-project-filter]').forEach((item) => item.classList.remove('is-active'));
    button.classList.add('is-active');
    document.querySelectorAll('[data-project-category]').forEach((project) => {
      project.classList.toggle('hidden', category !== 'alle' && project.dataset.projectCategory !== category);
    });
  });
});

const reviewsList = document.getElementById('reviews-list');
const reviewsPrevious = document.getElementById('reviews-previous');
const reviewsNext = document.getElementById('reviews-next');
const reviewsPagination = document.getElementById('reviews-pagination');

function reviewsPageWidth() {
  const card = reviewsList?.querySelector('.review-card');
  if (!card || !reviewsList) return 0;
  const gap = Number.parseFloat(window.getComputedStyle(reviewsList).gap) || 0;
  return 2 * (card.getBoundingClientRect().width + gap);
}

function createReviewDots() {
  if (!reviewsList || !reviewsPagination) return;
  const pageCount = Math.ceil(reviewsList.querySelectorAll('.review-card').length / 2);
  reviewsPagination.innerHTML = '';
  Array.from({ length: pageCount }, (_, index) => {
    const dot = document.createElement('span');
    dot.className = `review-dot${index === 0 ? ' is-active' : ''}`;
    reviewsPagination.append(dot);
  });
}

function updateReviewsControls() {
  if (!reviewsList || !reviewsPrevious || !reviewsNext) return;
  const isFirstPage = reviewsList.scrollLeft < 10;
  const isLastPage = reviewsList.scrollLeft >= reviewsList.scrollWidth - reviewsList.clientWidth - 10;
  reviewsPrevious.disabled = isFirstPage;
  reviewsNext.disabled = isLastPage;
  const currentPage = Math.round(reviewsList.scrollLeft / reviewsPageWidth());
  reviewsPagination?.querySelectorAll('.review-dot').forEach((dot, index) => dot.classList.toggle('is-active', index === currentPage));
}

reviewsPrevious?.addEventListener('click', () => reviewsList.scrollBy({ left: -reviewsPageWidth(), behavior: 'smooth' }));
reviewsNext?.addEventListener('click', () => reviewsList.scrollBy({ left: reviewsPageWidth(), behavior: 'smooth' }));
reviewsList?.addEventListener('scroll', updateReviewsControls, { passive: true });
window.addEventListener('resize', updateReviewsControls);
createReviewDots();
updateReviewsControls();

const form = document.getElementById('contact-form');
const submitButton = document.getElementById('submit-button');
const formStatus = document.getElementById('form-status');

const validators = {
  name: (value) => value.trim().length >= 2 ? '' : 'Bitte geben Sie Ihren Namen ein.',
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? '' : 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
  phone: (value) => !value.trim() || /^[+\d\s()\/-]{6,}$/.test(value.trim()) ? '' : 'Bitte prüfen Sie die Telefonnummer.',
  service: (value) => value ? '' : 'Bitte wählen Sie eine Leistung aus.',
  message: (value) => value.trim().length >= 15 ? '' : 'Bitte beschreiben Sie Ihr Projekt mit mindestens 15 Zeichen.',
  privacy: (_, field) => field.checked ? '' : 'Bitte stimmen Sie der Datenschutzerklärung zu.'
};

function validateField(field) {
  const validator = validators[field.name];
  if (!validator) return true;

  const message = validator(field.value, field);
  const wrapper = field.closest('div');
  const error = wrapper ? wrapper.querySelector('.error-message') : null;

  field.classList.toggle('invalid', Boolean(message));
  field.setAttribute('aria-invalid', String(Boolean(message)));
  if (error) error.textContent = message;

  return !message;
}

form?.querySelectorAll('input, select, textarea').forEach((field) => {
  field.addEventListener('blur', () => validateField(field));
  field.addEventListener('input', () => {
    if (field.classList.contains('invalid')) validateField(field);
  });
});

form?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const fields = [...form.querySelectorAll('input, select, textarea')];
  const isValid = fields.every(validateField);

  if (!isValid) {
    formStatus.textContent = 'Bitte prüfen Sie die markierten Felder.';
    formStatus.className = 'text-sm text-red-600';
    form.querySelector('.invalid')?.focus();
    return;
  }

  emailjs.init({
    publicKey: EMAILJS_PUBLIC_KEY
});

  const placeholdersConfigured = ![
    EMAILJS_PUBLIC_KEY,
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID
  ].some((value) => value.startsWith('YOUR_'));

  if (!placeholdersConfigured) {
    formStatus.textContent = 'Demo-Modus: EmailJS-Zugangsdaten sind noch nicht eingetragen.';
    formStatus.className = 'text-sm text-amber-700';
    return;
  }

  try {
    submitButton.disabled = true;
    submitButton.textContent = 'Wird gesendet …';
    formStatus.textContent = '';

    if (!window.emailjs) {
      throw new Error('EmailJS konnte nicht geladen werden.');
    }

    window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

    await window.emailjs.sendForm(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      form
    );

    form.reset();
    formStatus.textContent = 'Vielen Dank! Ihre Anfrage wurde erfolgreich gesendet.';
    formStatus.className = 'text-sm text-green-700';
  } catch (error) {
    console.error('Fehler beim Senden:', error);
    formStatus.textContent = 'Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es später erneut oder rufen Sie uns an.';
    formStatus.className = 'text-sm text-red-600';
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Unverbindliche Anfrage senden <span aria-hidden="true">→</span>';
  }
});




// form.addEventListener("submit", async function (event) {
//     event.preventDefault();

//     try {
//         const response = await emailjs.sendForm(
//             EMAILJS_SERVICE_ID,
//             EMAILJS_TEMPLATE_ID,
//             form
//         );

//         console.log("E-Mail versendet:", response);
//         alert("Vielen Dank! Ihre Anfrage wurde erfolgreich versendet.");

//         form.reset();
//     } catch (error) {
//         console.error("Fehler beim Versenden:", error);
//         alert("Die Nachricht konnte leider nicht versendet werden.");
//     }
// });