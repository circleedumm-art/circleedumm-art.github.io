/* Cross-browser app installation. Use the native prompt when available and explain
   the correct manual install path on browsers without a prompt API. */
(() => {
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(e => console.warn("Service worker:", e)));
  }
  const bar=document.getElementById("installBar"), action=document.getElementById("installAction"), dismiss=document.getElementById("installDismiss");
  if(!bar||!action||!dismiss)return;
  const copy={
    en:{
      title:"Keep CLC close at hand",install:"Install app",how:"How to install",
      ios:"In Safari, tap Share, then choose “Add to Home Screen”.",
      safariMac:"In Safari, open File and choose “Add to Dock”.",
      edge:"In Microsoft Edge, open the menu, then Apps → Install this site as an app.",
      android:"Open your browser menu and choose “Install app” or “Add to Home screen”.",
      chrome:"Use the Install icon in the address bar, or Chrome menu → Cast, save and share → Install page as app.",
      other:"Open this site in Safari on iPhone/iPad, or Chrome or Edge on a computer or Android device to install it.",
      close:"Dismiss"
    },
    my:{
      title:"CLC ကို အလွယ်တကူ အသုံးပြုနိုင်ရန် ထည့်သွင်းပါ",install:"အက်ပ် ထည့်သွင်းရန်",how:"ထည့်သွင်းနည်း",
      ios:"Safari တွင် Share ကိုနှိပ်ပြီး “Add to Home Screen” ကိုရွေးပါ။",
      safariMac:"Safari တွင် File ကိုဖွင့်ပြီး “Add to Dock” ကိုရွေးပါ။",
      edge:"Microsoft Edge မီနူးကိုဖွင့်ပြီး Apps → Install this site as an app ကိုရွေးပါ။",
      android:"Browser မီနူးကိုဖွင့်ပြီး “Install app” သို့မဟုတ် “Add to Home screen” ကိုရွေးပါ။",
      chrome:"လိပ်စာဘားရှိ Install သင်္ကေတ သို့မဟုတ် Chrome မီနူးမှ Install page as app ကိုရွေးပါ။",
      other:"iPhone/iPad တွင် Safari၊ ကွန်ပျူတာ သို့မဟုတ် Android တွင် Chrome သို့မဟုတ် Edge ဖြင့်ဖွင့်ပြီး ထည့်သွင်းပါ။",
      close:"ပိတ်မည်"
    }
  };
  const language=()=>document.documentElement.lang==="my"?"my":"en";
  const ua=navigator.userAgent.toLowerCase();
  const ios=/iphone|ipad|ipod/.test(ua), android=/android/.test(ua), edge=/edg\//.test(ua), safari=/safari/.test(ua)&&!/chrome|crios|android/.test(ua);
  let deferred=null;
  const standalone=()=>matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
  const manualKey=()=>ios?"ios":safari?"safariMac":edge?"edge":android?"android":/chrome/.test(ua)?"chrome":"other";
  const refresh=()=>{
    const t=copy[language()];
    document.getElementById("installTitle").textContent=t.title;
    document.getElementById("installHelp").textContent=deferred?"":t[manualKey()];
    action.textContent=deferred?t.install:t.how;
    dismiss.setAttribute("aria-label",t.close);
  };
  const dismissed=()=>{try{return sessionStorage.getItem("clc_install_dismissed")}catch(e){return false}};
  const show=()=>{if(standalone()||dismissed())return;refresh();bar.hidden=false};
  addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferred=e;show()});
  addEventListener("appinstalled",()=>{bar.hidden=true;deferred=null});
  dismiss.addEventListener("click",()=>{bar.hidden=true;try{sessionStorage.setItem("clc_install_dismissed","1")}catch(e){}});
  action.addEventListener("click",async()=>{
    if(!deferred){refresh();return}
    try{await deferred.prompt();const choice=await deferred.userChoice;if(choice?.outcome==="accepted")bar.hidden=true}
    catch(e){document.getElementById("installHelp").textContent=copy[language()][manualKey()]}
    finally{deferred=null;refresh()}
  });
  new MutationObserver(refresh).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
  setTimeout(show,1200);
})();