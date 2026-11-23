(() => {
  const key = "clc_notice_seen_" + (typeof auth !== "undefined" && auth.currentUser ? auth.currentUser.uid : "guest");
  let attempts=0;
  const check=()=>{
    attempts++;
    const list = typeof anns !== "undefined" ? anns : (typeof ann !== "undefined" ? ann : []);
    const now=Date.now(), live=list.filter(a=>a.title && a.text && (typeof annIsLive!=="function" || annIsLive(a)) && (!a.publishAt || (a.publishAt.toDate?a.publishAt.toDate().getTime():new Date(a.publishAt).getTime())<=now));
    let seen={}; try{seen=JSON.parse(localStorage.getItem(key)||"{}")}catch{}
    const item=live.slice().sort((a,b)=>{const x=a.publishAt?.toDate?a.publishAt.toDate().getTime():new Date(a.publishAt||0).getTime(),y=b.publishAt?.toDate?b.publishAt.toDate().getTime():new Date(b.publishAt||0).getTime();return y-x}).find(a=>!seen[a.id]);
    if(item){const box=document.createElement("div");box.className="clc-notice";box.setAttribute("role","dialog");box.setAttribute("aria-modal","true");const card=document.createElement("section");card.className="clc-notice-card";const title=document.createElement("h2");title.textContent=item.title;const body=document.createElement("p");body.textContent=item.text;const close=document.createElement("button");close.className="btn";close.textContent=(document.documentElement.lang==="my"?"ပိတ်မည်":"Close");close.onclick=()=>{seen[item.id]=true;try{localStorage.setItem(key,JSON.stringify(seen))}catch{}box.remove()};card.append(title,body,close);box.append(card);document.body.append(box);return}
    if(attempts<30) setTimeout(check,800);
  }; setTimeout(check,600);
})();