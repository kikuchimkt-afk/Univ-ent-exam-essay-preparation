/* ============================================
   大学入試 小論文対策LP — JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // --- Scroll Fade-in Animation ---
  const initScrollAnimations = () => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right').forEach(el => {
      observer.observe(el);
    });
  };

  // --- Bar Chart Animation ---
  const initBarCharts = () => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const fills = entry.target.querySelectorAll('.bar-chart__fill');
          fills.forEach((fill, index) => {
            setTimeout(() => {
              fill.style.width = fill.dataset.width;
            }, index * 120);
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    document.querySelectorAll('.bar-chart').forEach(chart => {
      observer.observe(chart);
    });
  };

  // --- Accordion ---
  const initAccordion = () => {
    document.querySelectorAll('.accordion__header').forEach(header => {
      header.addEventListener('click', () => {
        const item = header.parentElement;
        const body = item.querySelector('.accordion__body');
        const content = body.querySelector('.accordion__content');
        const isActive = item.classList.contains('active');

        // Close all other items in the same accordion
        const accordion = item.parentElement;
        accordion.querySelectorAll('.accordion__item.active').forEach(activeItem => {
          if (activeItem !== item) {
            activeItem.classList.remove('active');
            activeItem.querySelector('.accordion__body').style.maxHeight = '0';
          }
        });

        // Toggle current
        if (isActive) {
          item.classList.remove('active');
          body.style.maxHeight = '0';
        } else {
          item.classList.add('active');
          body.style.maxHeight = content.scrollHeight + 'px';
        }
      });
    });
  };

  // --- Smooth header background on scroll ---
  const initHeaderScroll = () => {
    const header = document.querySelector('.header');
    if (!header) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 80) {
        header.style.boxShadow = '0 2px 20px rgba(139, 119, 101, 0.1)';
      } else {
        header.style.boxShadow = 'none';
      }
    });
  };

  // --- Counter Animation for stat values ---
  const initCounters = () => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseFloat(el.dataset.count);
          const suffix = el.dataset.suffix || '';
          const duration = 1500;
          const start = performance.now();

          const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = (target * eased).toFixed(1);

            el.textContent = (current % 1 === 0 ? parseInt(current) : current) + suffix;

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('[data-count]').forEach(el => {
      observer.observe(el);
    });
  };

  // Initialize all
  initScrollAnimations();
  initBarCharts();
  initAccordion();
  initHeaderScroll();
  initCounters();
});
