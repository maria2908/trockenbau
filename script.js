'use strict';

const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';

const menuButton = document.getElementById('menu-button');
const mobileMenu = document.getElementById('mobile-menu');
const header = document.getElementById('site-header');
const backToTop = document.getElementById('back-to-top');
const currentYear = document.getElementById('current-year');

currentYear.textContent = new Date().getFullYear();

menuButton.addEventListener('click', () => {
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
  header.classList.toggle('scrolled', scrolled);
  backToTop.classList.toggle('hidden', window.scrollY < 600);
}, { passive: true });

backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

document.querySelectorAll('[data-comparison]').forEach((comparison) => {
  const range = comparison.querySelector('input[type="range"]');
  const after = comparison.querySelector('.comparison-after');

  const updateComparison = () => {
    const value = `${range.value}%`;
    after.style.width = value;
    comparison.style.setProperty('--position', value);
  };

  range.addEventListener('input', updateComparison);
  updateComparison();
});

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

form.querySelectorAll('input, select, textarea').forEach((field) => {
  field.addEventListener('blur', () => validateField(field));
  field.addEventListener('input', () => {
    if (field.classList.contains('invalid')) validateField(field);
  });
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const fields = [...form.querySelectorAll('input, select, textarea')];
  const isValid = fields.every(validateField);

  if (!isValid) {
    formStatus.textContent = 'Bitte prüfen Sie die markierten Felder.';
    formStatus.className = 'text-sm text-red-600';
    form.querySelector('.invalid')?.focus();
    return;
  }

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
    submitButton.textContent = 'Anfrage senden';
  }
});

/*
EMAILJS EINRICHTUNG
1. Kostenloses Konto auf https://www.emailjs.com/ erstellen.
2. Unter "Email Services" einen E-Mail-Dienst verbinden.
3. Unter "Email Templates" eine Vorlage anlegen.
4. In der Vorlage Variablen verwenden, die den Feldnamen entsprechen:
   {{name}}, {{email}}, {{phone}}, {{service}}, {{message}}
5. Oben in dieser Datei YOUR_PUBLIC_KEY, YOUR_SERVICE_ID und
   YOUR_TEMPLATE_ID durch die echten Werte ersetzen.
6. In EmailJS die erlaubte Domain eintragen, damit nur Ihre Webseite
   Anfragen senden darf.

Für produktive Webseiten sollten zusätzlich Spam-Schutz, serverseitige
Validierung und eine echte Datenschutzseite eingerichtet werden.
*/
