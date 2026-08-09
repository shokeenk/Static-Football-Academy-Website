  lucide.createIcons();

  // loader
  window.addEventListener('load', () => setTimeout(() => document.getElementById('loader').classList.add('hide'), 400));

  // scroll progress + navbar state
  const navbar = document.getElementById('navbar');
  const progress = document.getElementById('progress');
  const scrollTopBtn = document.getElementById('scrollTop');
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    navbar.classList.toggle('scrolled', y > 40);
    scrollTopBtn.classList.toggle('show', y > 500);
    const h = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
  });
  scrollTopBtn.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));

  // mobile drawer
  const drawer = document.getElementById('drawer');
  document.getElementById('menuBtn').addEventListener('click', () => drawer.classList.remove('translate-x-full'));
  document.getElementById('closeDrawer').addEventListener('click', () => drawer.classList.add('translate-x-full'));
  document.querySelectorAll('.drawer-link').forEach(a => a.addEventListener('click', () => drawer.classList.add('translate-x-full')));

  // cursor glow
  const glow = document.getElementById('cursor-glow');
  window.addEventListener('mousemove', e => { glow.style.left = e.clientX+'px'; glow.style.top = e.clientY+'px'; });

  // reveal on scroll
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => { if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
  }, {threshold:0.15});
  revealEls.forEach(el => io.observe(el));

  // animated counters
  const counters = document.querySelectorAll('.counter');
  const cIo = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if(en.isIntersecting){
        const el = en.target, target = +el.dataset.count;
        let cur = 0; const step = Math.max(1, Math.round(target/40));
        const t = setInterval(() => { cur += step; if(cur>=target){cur=target; clearInterval(t);} el.textContent = cur + (target>=100?'+':(target<10?'':'+')); }, 30);
        cIo.unobserve(el);
      }
    });
  }, {threshold:0.4});
  counters.forEach(c => cIo.observe(c));

  // "Why Static FC" grid — built from data to keep markup light
  const whyItems = [
    ['target','AIFF Inspired Training Methods'],
    ['badge-check','Qualified Coaching'],
    ['crosshair','Technical Development'],
    ['brain','Match Intelligence'],
    ['dumbbell','Physical Fitness'],
    ['users-round','Team Building'],
    ['sparkles','Confidence Development'],
    ['shield','Safe Learning Environment'],
  ];
  const whyGrid = document.getElementById('whyGrid');
  whyItems.forEach(([icon,label],i) => {
    const div = document.createElement('div');
    div.className = 'reveal flex items-center gap-5';
    div.style.setProperty('--i', i);
    div.innerHTML = `<div class="w-14 h-14 rounded-2xl glass flex items-center justify-center flex-shrink-0"><i data-lucide="${icon}" class="w-6 h-6 text-grass"></i></div><div class="font-semibold text-lg">${label}</div>`;
    whyGrid.appendChild(div);
  });
  lucide.createIcons();
  document.querySelectorAll('#whyGrid .reveal').forEach(el => io.observe(el));

  // testimonial slider
  const tTrack = document.getElementById('tTrack');
  const slides = document.querySelectorAll('.t-slide');
  const dotsWrap = document.getElementById('tDots');
  let tIndex = 0;
  slides.forEach((_,i) => {
    const d = document.createElement('button');
    d.className = 'w-2.5 h-2.5 rounded-full ' + (i===0 ? 'bg-grass' : 'bg-white/20');
    d.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(d);
  });
  function goTo(i){
    tIndex = i;
    tTrack.style.transform = `translateX(-${i*100}%)`;
    [...dotsWrap.children].forEach((d,j) => d.className = 'w-2.5 h-2.5 rounded-full ' + (j===i ? 'bg-grass' : 'bg-white/20'));
  }
  setInterval(() => goTo((tIndex+1) % slides.length), 5000);

  // lightbox gallery
  const lightbox = document.getElementById('lightbox');
  const lightboxLabel = document.getElementById('lightboxLabel');
  const lightboxImg = document.getElementById('lightboxImg');
  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      lightboxLabel.textContent = item.dataset.label;
      const imgEl = item.querySelector('img');
      lightboxImg.src = imgEl ? imgEl.src : '';
      lightboxImg.alt = imgEl ? imgEl.alt : '';
      lightbox.classList.remove('hidden'); lightbox.classList.add('flex');
    });
  });
  document.getElementById('closeLightbox').addEventListener('click', () => {
    lightbox.classList.add('hidden'); lightbox.classList.remove('flex');
  });
  // click on the dark backdrop (not the card itself) also closes it
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      lightbox.classList.add('hidden'); lightbox.classList.remove('flex');
    }
  });

  // Note: booking form logic (multi-step wizard, validation, WhatsApp message
  // construction) lives in js/booking-form.js, loaded separately below.
