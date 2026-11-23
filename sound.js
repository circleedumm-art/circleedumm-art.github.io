/* A small, bell-like two-note chime with a matching animated mute toggle. */
(() => {
  const buttons=[...document.querySelectorAll("#soundToggleHead")];
  if(!buttons.length)return;
  let enabled=true,ctx=null;
  try{enabled=localStorage.getItem("clc_click_sound")!=="off"}catch(e){}
  const label=()=>{
    const my=document.documentElement.lang==="my";
    buttons.forEach(b=>{
      b.innerHTML='<svg class="sound-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path class="sound-waves" d="M16 9a5 5 0 0 1 0 6m2-9a8 8 0 0 1 0 12"/><path class="sound-slash" d="m16 9 5 6m0-6-5 6"/></svg>';b.classList.toggle("is-muted",!enabled);
      b.classList.toggle("sound-on",enabled);b.setAttribute("aria-pressed",String(enabled));
      b.setAttribute("aria-label",my?(enabled?"နှိပ်သံ ဖွင့်ထားသည်":"နှိပ်သံ ပိတ်ထားသည်"):(enabled?"Click sounds on":"Click sounds off"));
      b.title=b.getAttribute("aria-label");
    });
  };
  const chime=()=>{
    try{
      const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
      ctx=ctx||new AC();if(ctx.state==="suspended")ctx.resume();
      const t=ctx.currentTime;
      [[659.25,0],[987.77,.075]].forEach(([hz,delay])=>{
        const o=ctx.createOscillator(),g=ctx.createGain(),start=t+delay;
        o.type="sine";o.frequency.setValueAtTime(hz,start);
        g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(.014,start+.012);g.gain.exponentialRampToValueAtTime(.0001,start+.22);
        o.connect(g);g.connect(ctx.destination);o.start(start);o.stop(start+.23);
      });
    }catch(e){}
  };
  buttons.forEach(b=>b.addEventListener("click",()=>{
    enabled=!enabled;try{localStorage.setItem("clc_click_sound",enabled?"on":"off")}catch(e){}
    label();b.classList.remove("sound-change");void b.offsetWidth;b.classList.add("sound-change");setTimeout(()=>b.classList.remove("sound-change"),420);
    if(enabled)chime();
  }));
  new MutationObserver(label).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});label();
  document.addEventListener("click",e=>{
    if(!enabled||e.detail===0||e.target.closest("#soundToggleHead,input,textarea,select,[contenteditable=true]"))return;
    chime();
  },{passive:true});
})();