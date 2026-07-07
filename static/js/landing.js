/**
 * landing.js — Landing page interactions
 * Handles scroll-triggered animations.
 */
(function () {
  'use strict';

  // Intersection Observer for fade-in animations
  const animatedEls = document.querySelectorAll('[data-animate]');
  if (!animatedEls.length) return;

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  animatedEls.forEach(function (el) { observer.observe(el); });
})();
