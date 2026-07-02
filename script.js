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

// Keep the animated arrowhead exactly tangent to the final visible beam segment.
document.querySelectorAll('.pricing-chart-beam-line animate[attributeName="d"]').forEach(animation=>{
  const values=animation.getAttribute("values");
  if(!values)return;
  const frames=values.split(";").map(frame=>({
    frame,
    points:[...frame.matchAll(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)].map(match=>({x:Number(match[1]),y:Number(match[2]),start:match.index,end:match.index+match[0].length}))
  }));
  const aligned=frames.map((entry,frameIndex)=>{
    const {frame,points}=entry;
    if(points.length<3)return frame;
    const end=points.at(-2);
    const originalTip=points.at(-1);
    if(Math.hypot(originalTip.x-end.x,originalTip.y-end.y)>4)return frame;
    const nextEnd=frames[frameIndex+1]?.points.at(-2);
    const previousEnd=frames[frameIndex-1]?.points.at(-2);
    let dx=0,dy=0;
    if(nextEnd&&(nextEnd.x!==end.x||nextEnd.y!==end.y)){dx=nextEnd.x-end.x;dy=nextEnd.y-end.y}
    else if(previousEnd&&(previousEnd.x!==end.x||previousEnd.y!==end.y)){dx=end.x-previousEnd.x;dy=end.y-previousEnd.y}
    else{
      dx=originalTip.x-end.x;dy=originalTip.y-end.y;
    }
    const length=Math.hypot(dx,dy);
    if(!length)return frame;
    const tip=points.at(-1);
    const replacement=`${(end.x+dx/length*2).toFixed(2)} ${(end.y+dy/length*2).toFixed(2)}`;
    return frame.slice(0,tip.start)+replacement+frame.slice(tip.end);
  }).join(";");
  animation.setAttribute("values",aligned);
  animation.setAttribute("begin","indefinite");
  animation.setAttribute("repeatCount","1");
  if(typeof animation.endElement==='function')animation.endElement();
});

// Use one shared clock for all three patterns so the path, arrow and fade
// cannot drift apart. After pattern three, the first pattern starts again
// while everything is invisible, making the full reset unnoticeable.
const pricingChart=document.querySelector('.pricing-market-animation');
if(pricingChart&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  const cycles=[...pricingChart.querySelectorAll('.pricing-chart-cycle')];
  let cycleTimer;
  const startPricingCycle=index=>{
    window.clearTimeout(cycleTimer);
    cycles.forEach(cycle=>cycle.classList.remove('is-active'));
    const activeCycle=cycles[index];
    if(!activeCycle)return;
    void activeCycle.getBoundingClientRect();
    activeCycle.classList.add('is-active');
    const pathAnimation=activeCycle.querySelector('animate[attributeName="d"]');
    if(pathAnimation&&typeof pathAnimation.beginElement==='function')pathAnimation.beginElement();
    cycleTimer=window.setTimeout(()=>startPricingCycle((index+1)%cycles.length),12000);
  };
  startPricingCycle(0);
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden)startPricingCycle(0);
  });
}
