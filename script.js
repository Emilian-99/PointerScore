const header=document.querySelector('[data-header]');const navToggle=document.querySelector('.nav-toggle');const navLinks=document.querySelectorAll('.nav-menu a');const reveals=document.querySelectorAll('.reveal');const faqItems=document.querySelectorAll('.faq-item');const leadForm=document.querySelector('[data-lead-form]');const formNote=document.querySelector('[data-form-note]');const parallaxTarget=document.querySelector('[data-parallax]');function setHeaderState(){if(header)header.classList.toggle('is-scrolled',window.scrollY>12)}function closeNav(){document.body.classList.remove('nav-open');if(navToggle){navToggle.setAttribute('aria-expanded','false');navToggle.setAttribute('aria-label','Navigation öffnen')}}navToggle&&navToggle.addEventListener('click',()=>{const isOpen=document.body.classList.toggle('nav-open');navToggle.setAttribute('aria-expanded',String(isOpen));navToggle.setAttribute('aria-label',isOpen?'Navigation schließen':'Navigation öffnen')});navLinks.forEach(link=>link.addEventListener('click',closeNav));window.addEventListener('scroll',()=>{setHeaderState();if(parallaxTarget&&window.matchMedia('(prefers-reduced-motion: no-preference)').matches){const offset=Math.min(window.scrollY*.08,40);parallaxTarget.style.transform='translate3d(0, '+offset+'px, 0)'}},{passive:true});const revealObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target)}})},{threshold:.16});reveals.forEach((el,index)=>{
  if (el.classList.contains('section-heading') || el.classList.contains('hero-copy')) el.classList.add('reveal-soft-left');
  if (el.classList.contains('hero-dashboard') || el.classList.contains('product-card') || el.classList.contains('faq-list')) el.classList.add('reveal-soft-right');
  el.style.transitionDelay=(Math.min(index%5,4)*60)+'ms';
  revealObserver.observe(el);
});faqItems.forEach(item=>{const button=item.querySelector('button');const content=item.querySelector('.faq-content');button&&button.addEventListener('click',()=>{const isOpen=item.classList.toggle('is-open');button.setAttribute('aria-expanded',String(isOpen));content.style.maxHeight=isOpen?content.scrollHeight+'px':'0px'})});leadForm&&leadForm.addEventListener('submit',event=>{event.preventDefault();const data=new FormData(leadForm);const name=String(data.get('name')||'').trim();formNote.textContent=name?'Danke, '+name+'. Deine Vormerkung wurde lokal erfasst.':'Danke. Deine Vormerkung wurde lokal erfasst.';leadForm.reset()});setHeaderState();
const scoreValueElements=document.querySelectorAll("[data-score-value]");
scoreValueElements.forEach(scoreValueElement=>{
  const targetScore=Number(scoreValueElement.dataset.scoreValue)||82;
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    scoreValueElement.textContent=String(targetScore);
  }else{
    scoreValueElement.textContent="0";
    const scoreStart=performance.now()+180;
    const scoreDuration=1200;
    const updateScore=now=>{
      const progress=Math.max(0,Math.min(1,(now-scoreStart)/scoreDuration));
      const eased=1-Math.pow(1-progress,3);
      scoreValueElement.textContent=String(Math.round(targetScore*eased));
      if(progress<1)requestAnimationFrame(updateScore);
    };
    requestAnimationFrame(updateScore);
  }
});
