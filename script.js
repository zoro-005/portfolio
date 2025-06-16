const themeToggle = document.getElementById('theme-toggle');
const themeIconPath = document.getElementById('theme-icon-path');
let isToggling = false;
let isDark = document.documentElement.getAttribute('data-theme') === 'dark';

// Clear sun icon (with rays)
const sunPath = "M15 2.5a.625.625 0 0 0-.625.625v2.5a.625.625 0 0 0 1.25 0v-2.5A.625.625 0 0 0 15 2.5zm-8.25 2.875a.625.625 0 0 0-.4375 1.0625l1.75 1.75a.625.625 0 0 0 .875-.875l-1.75-1.75a.625.625 0 0 0-.4375-.1875zm15.5 0a.625.625 0 0 0-.4375.1875l-1.75 1.75a.625.625 0 0 0 .875.875l1.75-1.75a.625.625 0 0 0 0-.875.625.625 0 0 0-.4375-.1875zM15 7.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15zM2.5 15a.625.625 0 0 0 0 1.25h2.5a.625.625 0 0 0 0-1.25zm25 0a.625.625 0 0 0 0 1.25h2.5a.625.625 0 0 0 0-1.25zm-6.875 7.75a.625.625 0 0 0-.4375.1875l-1.75 1.75a.625.625 0 0 0 .875.875l1.75-1.75a.625.625 0 0 0 0-.875.625.625 0 0 0-.4375-.1875zm-10.25 0a.625.625 0 0 0-.4375.1875l-1.75 1.75a.625.625 0 0 0 .875.875l1.75-1.75a.625.625 0 0 0 0-.875.625.625 0 0 0-.4375-.1875zm6.875 6.875A.625.625 0 0 0 14.375 30v2.5a.625.625 0 0 0 1.25 0v-2.5a.625.625 0 0 0-.625-.625z";

// Crescent moon
const moonPath = "M24.75 15.54A12 12 0 1 1 13.54 3a9 9 0 1 0 11.21 12.54z";

function animateIcon(fromPath, toPath, duration = 500) {
  if (typeof flubber !== 'undefined') {
    try {
      const interpolator = flubber.interpolate(fromPath, toPath);
      let startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        themeIconPath.setAttribute('d', interpolator(progress));
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          themeIconPath.setAttribute('d', toPath);
        }
      }

      requestAnimationFrame(step);
    } catch (err) {
      themeIconPath.setAttribute('d', toPath);
    }
  } else {
    themeIconPath.setAttribute('d', toPath);
  }
}

themeToggle.addEventListener('click', () => {
  if (isToggling) return;
  isToggling = true;

  const rect = themeToggle.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  document.body.style.setProperty('--x', `${x}px`);
  document.body.style.setProperty('--y', `${y}px`);

  document.body.classList.add('theme-transition');
  document.body.style.animation = 'radialSpread 1.5s ease forwards';

  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    animateIcon(moonPath, sunPath);
    isDark = false;
    localStorage.setItem('theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    animateIcon(sunPath, moonPath);
    isDark = true;
    localStorage.setItem('theme', 'dark');
  }

  updateParticleColor(x, y);

  setTimeout(() => {
    document.body.classList.remove('theme-transition');
    document.body.style.clipPath = '';
    document.body.style.animation = '';
    isToggling = false;
  }, 1800);
});

// Initial theme on load
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
  themeIconPath.setAttribute('d', moonPath);
  isDark = true;
} else {
  document.documentElement.removeAttribute('data-theme');
  themeIconPath.setAttribute('d', sunPath);
  isDark = false;
}

// Back-to-top button
const backToTop = document.getElementById('back-to-top');
backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Footer visibility on scroll
const footer = document.querySelector('footer');
let lastScrollY = window.scrollY;
window.addEventListener('scroll', () => {
  const currentY = window.scrollY;
  footer.classList.toggle('visible', currentY < lastScrollY);
  lastScrollY = currentY;
});

// Section animation on load
window.addEventListener('load', () => {
  const aboutSection = document.getElementById('about');
  aboutSection.classList.add('visible');
  console.log('About section marked as visible'); // Debug log
  initParticles();
});

// Reveal elements on scroll
const observer = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      obs.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('#projects, #skills, #education, #certifications, .project-card, .skill-card, .education-card')
  .forEach(el => observer.observe(el));

// Particle animation logic
let particles = [];
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let transitionStartTime = null;
let maxDistance = Math.hypot(window.innerWidth, window.innerHeight);

function parseRGBA(color) {
  const match = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
  return match ? match.slice(1, 5).map((v, i) => i < 3 ? parseInt(v) : parseFloat(v)) : [0, 0, 0, 0];
}

function interpolateColor(start, end, progress) {
  return `rgba(${start.map((c, i) => {
    const val = c + (end[i] - c) * progress;
    return i < 3 ? Math.round(val) : val.toFixed(2);
  }).join(', ')})`;
}

function initParticles() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  particles = [];
  for (let i = 0; i < 50; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 3 + 1,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      color: isDark ? 'rgba(99,179,237,0.3)' : 'rgba(66,153,225,0.3)',
      startColor: null,
      endColor: null,
      distance: 0,
      progress: 1
    });
  }
  requestAnimationFrame(animateParticles);
}

function updateParticleColor(originX, originY) {
  transitionStartTime = performance.now();
  maxDistance = Math.hypot(window.innerWidth, window.innerHeight);
  const targetColor = isDark ? 'rgba(99,179,237,0.3)' : 'rgba(66,153,225,0.3)';
  particles.forEach(p => {
    p.startColor = parseRGBA(p.color);
    p.endColor = parseRGBA(targetColor);
    p.distance = Math.hypot(p.x - originX, p.y - originY);
    p.progress = 0;
  });
}

function animateParticles(timestamp) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const duration = 1800;
  if (transitionStartTime) {
    const elapsed = timestamp - transitionStartTime;
    particles.forEach(p => {
      const delay = (p.distance / maxDistance) * duration * 0.5;
      const localProgress = Math.min(1, Math.max(0, (elapsed - delay) / (duration - delay)));
      p.color = interpolateColor(p.startColor, p.endColor, localProgress);
    });
    if (elapsed >= duration) transitionStartTime = null;
  }

  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0) p.x = canvas.width;
    if (p.x > canvas.width) p.x = 0;
    if (p.y < 0) p.y = canvas.height;
    if (p.y > canvas.height) p.y = 0;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI);
    ctx.fillStyle = p.color;
    ctx.fill();
  });

  requestAnimationFrame(animateParticles);
}

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  maxDistance = Math.hypot(window.innerWidth, window.innerHeight);
});