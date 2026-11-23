/* Alumni class applications. Reads only the public class catalogue and own application records. */
(() => {
  if (typeof VIEW === "undefined") return;
  const original = VIEW.classes.bind(VIEW);
  VIEW.classes = () => original() + `<h3 class="sec">Explore other classes</h3><p class="note">Apply for a class you have not attended. The CLC team will review your request.</p><button class="btn" id="applyClass">Find a class</button>`;
  document.addEventListener("click", async e => {
    if (e.target.id !== "applyClass") return;
    try {
      const [catalog, mine] = await Promise.all([
        db.collection("publicSchedule").get(),
        db.collection("classApplications").where("studentId", "==", me.id).get()
      ]);
      const attended = new Set(rows.map(r => r.c.id));
      const apps = new Map(mine.docs.map(d => [d.id, d.data()]));
      const choices = catalog.docs.map(d => ({id:d.id,...d.data()})).filter(c => !attended.has(c.id) && apps.get(c.id + "_" + me.id)?.status !== "pending" && apps.get(c.id + "_" + me.id)?.status !== "approved");
      showSheet(`<h3>Apply for another class</h3>${choices.length ? `<ul class="group">${choices.map(c=>{const old=apps.get(c.id+"_"+me.id);return `<li class="item"><div class="grow"><b>${esc(cTitle(c))}${c.label?" · "+esc(c.label):""}</b><small>${esc(c.day||"Schedule to be confirmed")} · ${Number(c.priceMMK||0)===0?"Free":Number(c.priceMMK).toLocaleString()+" MMK"}</small>${old?.status==="rejected"?"<small>Your last request was declined; you may apply again.</small>":""}</div><button class="btn small" data-apply-id="${esc(c.id)}" data-program="${esc(c.programId)}">${old?.status==="rejected"?"Apply again":"Apply"}</button></li>`}).join("")}</ul>`:"<p class='note'>No additional classes are open for applications right now.</p>"});
    } catch(err) { console.error(err); toast("Could not load classes. Please try again."); }
  });
  document.addEventListener("click", async e => {
    const b=e.target.closest("[data-apply-id]"); if(!b) return;
    try { const id=b.dataset.applyId, ref=db.collection("classApplications").doc(id+"_"+me.id), data={classId:id,studentId:me.id,studentName:me.name,programId:b.dataset.program,status:"pending",createdAt:firebase.firestore.FieldValue.serverTimestamp()};
      const prior=await ref.get(); if(prior.exists) await ref.update({status:"pending",updatedAt:firebase.firestore.FieldValue.serverTimestamp()}); else await ref.set(data); toast("Application sent to CLC for review."); document.getElementById("mc")?.click();
    } catch(err) { console.error(err); toast("Could not submit application. Please try again."); }
  });
})();