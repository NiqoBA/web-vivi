'use client';

import { useEffect } from 'react';

export function useNavScroll(navId = 'nav') {
  useEffect(() => {
    const nav = document.getElementById(navId);
    if (!nav) return;

    let scrolled = false;

    const onScroll = () => {
      const s = window.scrollY > 40;
      if (s !== scrolled) {
        scrolled = s;
        nav.classList.toggle('scrolled', s);
        nav.classList.toggle('over', window.scrollY < window.innerHeight - 100);
      }
      document.querySelectorAll('[data-parallax]').forEach((el) => {
        const k = parseFloat((el as HTMLElement).dataset.parallax || '0') || 0;
        (el as HTMLElement).style.transform = `translate3d(0, ${window.scrollY * k}px, 0)`;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [navId]);
}
