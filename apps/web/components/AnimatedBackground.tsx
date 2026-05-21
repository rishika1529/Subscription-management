'use client';

import { useEffect } from 'react';

export function AnimatedBackground() {
  useEffect(() => {
    const starsEl = document.getElementById('bg-stars');
    if (starsEl && starsEl.children.length === 0) {
      for (let i = 0; i < 150; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        star.style.animationDuration = (2 + Math.random() * 3) + 's';
        starsEl.appendChild(star);
      }
    }

    const shapesEl = document.getElementById('bg-shapes');
    if (shapesEl && shapesEl.children.length === 0) {
      const defs = [
        { circle: false, size: 20, x: 10, y: 20, delay: 0 },
        { circle: true,  size: 30, x: 85, y: 15, delay: 3 },
        { circle: false, size: 15, x: 70, y: 70, delay: 6 },
        { circle: true,  size: 25, x: 20, y: 75, delay: 9 },
        { circle: false, size: 40, x: 50, y: 40, delay: 12 },
        { circle: true,  size: 18, x: 90, y: 50, delay: 15 },
      ];
      defs.forEach((d) => {
        const el = document.createElement('div');
        el.className = 'shape' + (d.circle ? ' circle' : '');
        el.style.width = d.size + 'px';
        el.style.height = d.size + 'px';
        el.style.left = d.x + '%';
        el.style.top = d.y + '%';
        el.style.animationDelay = d.delay + 's';
        shapesEl.appendChild(el);
      });
    }

    const meteorsEl = document.getElementById('bg-meteors');
    if (meteorsEl && meteorsEl.children.length === 0) {
      for (let i = 0; i < 8; i++) {
        const m = document.createElement('div');
        m.className = 'meteor';
        m.style.left = Math.random() * 100 + '%';
        m.style.top = Math.random() * 50 + '%';
        m.style.animationDelay = i * 2.5 + 's';
        m.style.animationDuration = (6 + Math.random() * 4) + 's';
        meteorsEl.appendChild(m);
      }
    }
  }, []);

  return (
    <div className="bg-animation" aria-hidden="true">
      <div className="grid-overlay" />
      <div className="gradient-orb" />
      <div className="gradient-orb" />
      <div className="stars" id="bg-stars" />
      <div className="shapes" id="bg-shapes" />
      <div id="bg-meteors" />
    </div>
  );
}
