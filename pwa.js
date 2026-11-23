/* Install prompt for supported browsers and clear install guidance elsewhere. */
(() => {
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(e => console.warn("Service worker:", e)));
  }
  const bar=document.getElementById("installBar"), action=document.getElementById("installAction"), dismiss=document.getElementById("installDismiss");
  if(!bar||!action||!dismiss)return;
  const copy={
    en:{title:"Install Circle Learning Centre",install:"Install",ios:"On iPhone or iPad, tap Share, then “Add to Home Screen”.",other:"Use your browser menu and choose “Install app” or “Add to Home Screen”.",close:"Dismiss"},
    my:{title:"Circle Learning Centre အက်ပ် ထည့်သွင်းရန်",install:"ထည့်သွင်းရန်",ios:"iPhone သို့မဟုတ် iPad တွင် Share ကိုနှိပ်ပြီး “Add to Home Screen” ကိုရွေးပါ။",other:"Browser မီနူးမှ “Install app” သို့မဟုတ် “Add to Home Screen” ကိုရွေးပါ။",close:"ပိတ်မည်"}
  };
  const language=()=>document.documentElement.lang==="my"?"my":"en";
  let deferred=null;
  const standalone=()=>matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
  const refresh=()=>{const t=copy[language()];document.getElementById("installTitle").textContent=t.title;document.getElementById("installHelp").textContent=/iphone|ipad|ipod/i.test(navigator.userAgent)?t.ios:t.other;action.textContent=t.install;dismiss.setAttribute("aria-label",t.close)};
  const dismissed=()=>{try{return sessionStorage.getItem("clc_install_dismissed")}catch(e){return false}};
  const show=()=>{if(standalone()||dismissed())return;refresh();bar.hidden=false};
  addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferred=e;show()});
  addEventListener("appinstalled",()=>{bar.hidden=true;deferred=null});
  dismiss.addEventListener("click",()=>{bar.hidden=true;try{sessionStorage.setItem("clc_install_dismissed","1")}catch(e){}});
  action.addEventListener("click",async()=>{if(deferred){try{await deferred.prompt()}catch(e){}deferred=null;bar.hidden=true}else{document.getElementById("installHelp").textContent=copy[language()].other}});
  new MutationObserver(refresh).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
  setTimeout(show,1800);
})();