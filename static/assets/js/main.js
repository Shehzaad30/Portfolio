// ─── Particle System ─────────────────────────────────────
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let mouse = { x: null, y: null };

function resizeCanvas() {
  if(!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = canvas.parentElement.offsetHeight;
  initParticles();
}
window.addEventListener('resize', resizeCanvas);

class Particle {
  constructor() { this.reset(true); }
  reset(init) {
    if(!canvas) return;
    this.x = Math.random() * canvas.width;
    this.y = init ? Math.random() * canvas.height : Math.random() * canvas.height;
    this.size = Math.random() * 1.8 + 0.5;
    this.speedX = (Math.random() - 0.5) * 0.4;
    this.speedY = (Math.random() - 0.5) * 0.4;
    this.opacity = Math.random() * 0.5 + 0.15;
    this.color = Math.random() > 0.85 ? '247,209,255' : '165,231,255';
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    if (mouse.x !== null) {
      const dx = mouse.x - this.x, dy = mouse.y - this.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 120) { this.x -= dx * 0.012; this.y -= dy * 0.012; }
    }
    if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset(false);
  }
  draw() {
    ctx.fillStyle = `rgba(${this.color},${this.opacity})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Draw lines between nearby particles
function drawConnections() {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 100) {
        ctx.strokeStyle = `rgba(165,231,255,${0.06 * (1 - dist/100)})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }
}

function initParticles() {
  if(!canvas) return;
  particles = [];
  const count = Math.min(Math.floor((canvas.width * canvas.height) / 12000), 120);
  for (let i = 0; i < count; i++) particles.push(new Particle());
}

function animateParticles() {
  if(!canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawConnections();
  particles.forEach(p => { p.update(); p.draw(); });
  requestAnimationFrame(animateParticles);
}

if(canvas) {
    resizeCanvas();
    animateParticles();
}


// ─── Mouse Tracking ───────────────────────────────────────
document.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;

  // Floating badges parallax
  if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    document.querySelectorAll('.animate-float').forEach((el, i) => {
      const depth = (i + 1) * 12;
      const mx = (e.clientX / window.innerWidth - 0.5) * depth;
      const my = (e.clientY / window.innerHeight - 0.5) * depth;
      el.style.setProperty('--tx', mx + 'px');
      el.style.setProperty('--ty', my + 'px');
      el.style.transform = `translate(var(--tx), var(--ty))`;
    });
  }
});

// ─── 3D Card Tilt ─────────────────────────────────────────
document.querySelectorAll('.tilt-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;
    const rect = card.getBoundingClientRect();
    const rx = -(e.clientY - rect.top - rect.height/2) / 15;
    const ry =  (e.clientX - rect.left  - rect.width/2)  / 15;
    card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
    card.style.transition = 'transform 0.1s ease';
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale(1)';
    card.style.transition = 'transform 0.5s cubic-bezier(0.2,0.8,0.2,1)';
  });
});

// ─── Intersection Observer – reveals + skill bars ─────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = el.style.transitionDelay || (i * 0.04) + 's';
  revealObserver.observe(el);
});

// Skill bars
const skillObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.querySelectorAll('.skill-bar-fill').forEach(bar => {
      bar.style.width = bar.dataset.width + '%';
    });
    // Circular progress
    entry.target.querySelectorAll('.circle-fill').forEach(circle => {
      const p = parseInt(circle.dataset.progress);
      const circumference = 2 * Math.PI * 45;
      circle.style.strokeDashoffset = circumference * (1 - p / 100);
    });
    skillObserver.unobserve(entry.target);
  });
}, { threshold: 0.3 });

const skillsSection = document.getElementById('skills');
if (skillsSection) skillObserver.observe(skillsSection);

// Fix circle-wrap positions
document.querySelectorAll('.circle-wrap').forEach(wrap => {
  wrap.style.position = 'relative';
  const inner = document.createElement('div');
  inner.className = 'absolute inset-0 flex items-center justify-center';
  const span = wrap.querySelector('span');
  if (span) inner.appendChild(span);
  wrap.appendChild(inner);
});

// ─── Active nav link on scroll ────────────────────────────
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    if (window.scrollY >= section.offsetTop - 100) current = section.id;
  });
  navLinks.forEach(link => {
    link.classList.remove('text-primary', 'border-b-2', 'border-primary', 'pb-1');
    link.classList.add('text-on-surface-variant');
    if (link.getAttribute('href') === '#' + current) {
      link.classList.add('text-primary');
      link.classList.remove('text-on-surface-variant');
    }
  });
  // Navbar bg on scroll
  const navbar = document.getElementById('navbar');
  if (window.scrollY > 50) {
    navbar.style.background = 'rgba(5,5,5,0.85)';
  } else {
    navbar.style.background = 'rgba(19,19,19,0.1)';
  }
}, { passive: true });

// ─── Mobile Menu ──────────────────────────────────────────
const menuToggle = document.getElementById('menu-toggle');
if(menuToggle) {
    menuToggle.addEventListener('click', () => {
        document.getElementById('mobile-menu').classList.toggle('open');
    });
}

document.querySelectorAll('#mobile-menu a').forEach(a => {
  a.addEventListener('click', () => document.getElementById('mobile-menu').classList.remove('open'));
});

// ─── Portfolio Filter ─────────────────────────────────────
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => {
      b.classList.remove('active','bg-primary-container','text-on-primary-container');
      b.classList.add('glass-card','text-on-surface-variant');
    });
    btn.classList.add('active','bg-primary-container','text-on-primary-container');
    btn.classList.remove('glass-card','text-on-surface-variant');

    const filter = btn.dataset.filter;
    document.querySelectorAll('.portfolio-item').forEach(item => {
      if (filter === 'all' || item.dataset.cat === filter) {
        item.style.display = 'block';
        item.style.opacity = '0';
        setTimeout(() => { item.style.transition = 'opacity 0.4s'; item.style.opacity = '1'; }, 50);
      } else {
        item.style.transition = 'opacity 0.3s';
        item.style.opacity = '0';
        setTimeout(() => { item.style.display = 'none'; }, 300);
      }
    });
  });
});

// ─── Contact Form ─────────────────────────────────────────
const contactForm = document.getElementById('contact-form');
if(contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type=submit]');
        btn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
        btn.classList.add('opacity-80');
        btn.disabled = true;
        setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
        btn.classList.remove('opacity-80');
        btn.disabled = false;
        e.target.reset();
        }, 3000);
    });
}
