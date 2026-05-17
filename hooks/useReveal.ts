'use client';

import { useEffect } from 'react';

export function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );

    const observe = (root?: ParentNode) => {
      (root || document).querySelectorAll('.reveal:not(.in)').forEach((el) => io.observe(el));
    };

    observe();

    const onCatalog = (ev: Event) => {
      const detail = (ev as CustomEvent<{ root?: ParentNode }>).detail;
      observe(detail?.root);
    };
    window.addEventListener('alfa:observe-reveals', onCatalog);

    return () => {
      io.disconnect();
      window.removeEventListener('alfa:observe-reveals', onCatalog);
    };
  }, []);
}

export function dispatchObserveReveals(root?: ParentNode) {
  window.dispatchEvent(new CustomEvent('alfa:observe-reveals', { detail: { root } }));
}
