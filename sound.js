/* Subtle, user-mutable UI chime. Web Audio runs only after a user gesture. */
(() => {
  const buttons=[...document.querySelectorAll("#soundToggleHead")];
  if(!buttons.length)return;
  let enabled=true,ctx=null;
  try{enabled=localStorage.getItem("clc_click_sound")!=="off"}catch(e){}
  const label=()=>{const my=document.documentElement.lang==="my";buttons.forEach(b=>{b.textContent=enabled?"♪":"♩";b.setAttribute("aria-pressed",String(enabled));b.setAttribute("aria-label",my?(enabled?"နှိပ်သံ ဖွင့်ထားသည်":"နှိပ်သံ ပိတ်ထားသည်"):(enabled?"Click sounds on":"Click sounds off"));b.title=b.getAttribute("aria-label")})};
  buttons.forEach(b=>b.addEventListener("click",()=>{enabled=!enabled;try{localStorage.setItem("clc_click_sound",enabled?"on":"off")}catch(e){}label()}));
  new MutationObserver(label).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});label();
  document.addEventListener("click",e=>{
    if(!enabled||e.detail===0||e.target.closest("#soundToggleHead,input,textarea,select,[contenteditable=true]"))return;
    try{
      const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
      ctx=ctx||new Audio();if(ctx.state==="suspended")ctx.resume();
      const now=ctx.currentTime,gain=ctx.createGain(),osc=ctx.createOscillator();
      osc.type="sine";osc.frequency.setValueAtTime(740,now);osc.frequency.exponentialRampToValueAtTime(980,now+.045);
      gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.018,now+.012);gain.gain.exponentialRampToValueAtTime(.0001,now+.12);
      osc.connect(gain);gain.connect(ctx.destination);osc.start(now);osc.stop(now+.13);
    }catch(err){}
  },{passive:true});
})();