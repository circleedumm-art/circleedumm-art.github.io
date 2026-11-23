/* Student applications for public classes the current student has not attended. */
(() => {
  if (typeof VIEW === "undefined") return;
  const baseClasses = VIEW.classes.bind(VIEW);
  VIEW.classes = () => baseClasses() + '<h3 class="sec">Explore other classes</h3><p class="note">Already a CLC student? Apply for a class you have not attended.</p><button class="btn" id="applyClass">Find a class</button>';
  document.addEventListener("click", async e => {
    if (e.target.id !== "applyClass") return;
    try {
      const results = await Promise.all([
        db.collection("publicSchedule").get(),
        db.collection("classApplications").where("studentId", "==", me.id).get()
      ]);
      const attended = new Set(rows.map(r => r.c.id));
      const apps = new Map(results[1].docs.map(d => [d.id, d.data()]));
      const options = results[0].docs.map(d => ({ id: d.id, ...d.data() })).filter(c => {
        const app = apps.get(c.id + "_" + me.id);
        return !attended.has(c.id) && (!app || app.status === "rejected");
      });
      const items = options.map(c => {
        const li = document.createElement("li"); li.className = "item";
        const info = document.createElement("div"); info.className = "grow";
        const title = document.createElement("b"); title.textContent = cTitle(c) + (c.label ? " · " + c.label : "");
        const price = document.createElement("small"); price.textContent = Number(c.priceMMK || 0) === 0 ? "Free" : Number(c.priceMMK).toLocaleString() + " MMK";
        const schedule = document.createElement("small"); schedule.textContent = c.day || "Schedule to be confirmed";
        info.append(title, schedule, price);
        const button = document.createElement("button"); button.className = "btn small"; button.textContent = apps.get(c.id + "_" + me.id)?.status === "rejected" ? "Apply again" : "Apply";
        button.dataset.applyId = c.id; button.dataset.program = c.programId;
        li.append(info, button); return li;
      });
      const container = document.createElement("ul"); container.className = "group"; items.forEach(x => container.append(x));
      showSheet("<h3>Apply for another class</h3>");
      const sheet = document.querySelector("#modal .sheet");
      if (items.length) sheet.append(container);
      else { const p = document.createElement("p"); p.className = "note"; p.textContent = "No additional public classes are available."; sheet.append(p); }
    } catch (err) { console.error(err); toast("Could not load classes. Please try again."); }
  });
  document.addEventListener("click", async e => {
    const button = e.target.closest("[data-apply-id]"); if (!button) return;
    try {
      const id = button.dataset.applyId, ref = db.collection("classApplications").doc(id + "_" + me.id), prior = await ref.get();
      if (prior.exists) await ref.update({ status: "pending", updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      else await ref.set({ classId:id, studentId:me.id, studentName:me.name, programId:button.dataset.program, status:"pending", createdAt:firebase.firestore.FieldValue.serverTimestamp() });
      toast("Application sent to CLC for review."); document.getElementById("mc")?.click();
    } catch (err) { console.error(err); toast("Could not submit application. Please try again."); }
  });
})();