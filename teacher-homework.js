/* Homework: grouped, minimal list with per-student review. */
(() => {
  "use strict";
  const copy = {
    en: {
      homework: "Homework", title: "Assignment title", instructions: "Instructions", due: "Due",
      link: "Resource link (optional)", assign: "Assign homework", noHomework: "No homework assigned yet.",
      loading: "Loading homework…", notSubmitted: "Not submitted", submitted: "Submitted", reviewed: "Reviewed",
      needs_revision: "Needs revision", completed_in_person: "Done in person", response: "Student work",
      feedback: "Feedback", score: "Score /100 (optional)", save: "Save feedback", status: "Status",
      edit: "Edit", editSave: "Save changes", editSaved: "Homework updated.", cancel: "Cancel",
      inPerson: "Mark done in person", completionSaved: "Completion recorded.", need: "Add a title, instructions, and due date.",
      badUrl: "Use a link beginning with https://", saved: "Homework assigned.", feedbackSaved: "Feedback saved.",
      fail: "Could not save. Please try again.", upcoming: "Upcoming", past: "Past due", done: "Completed",
      newHw: "+ New homework", submittedWord: "submitted", late: "Late", all: "All", emptyFilter: "No students here.", open: "Open link"
    },
    my: {
      homework: "အိမ်စာ", title: "အိမ်စာ ခေါင်းစဉ်", instructions: "ညွှန်ကြားချက်များ", due: "နောက်ဆုံးရက်",
      link: "အရင်းအမြစ် လင့်ခ် (ရွေးချယ်စရာ)", assign: "အိမ်စာ ပေးမည်", noHomework: "အိမ်စာ မပေးရသေးပါ။",
      loading: "အိမ်စာ ဖွင့်နေသည်…", notSubmitted: "မပို့ရသေး", submitted: "ပို့ပြီး", reviewed: "စစ်ဆေးပြီး",
      needs_revision: "ပြင်ဆင်ရန်", completed_in_person: "လူကိုယ်တိုင် ပြီးစီး", response: "ကျောင်းသား၏ အလုပ်",
      feedback: "အကြံပြုချက်", score: "ရမှတ် /၁၀၀ (ရွေးချယ်စရာ)", save: "အကြံပြုချက် သိမ်းမည်", status: "အခြေအနေ",
      edit: "ပြင်မည်", editSave: "ပြင်ဆင်မှု သိမ်းမည်", editSaved: "အိမ်စာ ပြင်ဆင်ပြီးပါပြီ။", cancel: "မလုပ်တော့ပါ",
      inPerson: "လူကိုယ်တိုင် ပြီးစီးကြောင်း မှတ်မည်", completionSaved: "ပြီးစီးမှု မှတ်တမ်းတင်ပြီးပါပြီ။",
      need: "ခေါင်းစဉ်၊ ညွှန်ကြားချက်နှင့် နောက်ဆုံးရက် ထည့်ပါ။", badUrl: "https:// ဖြင့် စသော လင့်ခ်ကို အသုံးပြုပါ။",
      saved: "အိမ်စာ ပေးပြီးပါပြီ။", feedbackSaved: "အကြံပြုချက် သိမ်းပြီးပါပြီ။", fail: "သိမ်းမရပါ။ ပြန်ကြိုးစားပါ။",
      upcoming: "လာမည့်", past: "သတ်မှတ်ရက် ကျော်လွန်", done: "ပြီးစီး", newHw: "+ အိမ်စာအသစ်",
      submittedWord: "ပို့ပြီး", late: "နောက်ကျ", all: "အားလုံး", emptyFilter: "ဤအမျိုးအစားတွင် ကျောင်းသား မရှိပါ။", open: "လင့်ခ် ဖွင့်မည်"
    }
  };
  const text = k => copy[lang === "my" ? "my" : "en"][k] || k;
  const dateText = d => d ? fmt(d) : "—";
  SUBS.push("homework");

  const DONE = ["reviewed", "completed_in_person"];
  const GROUPS = ["upcoming", "past", "done"], CHIPS = ["all", "none", "submitted", "needs_revision", "reviewed"];
  const RANK = { submitted: 0, none: 1, needs_revision: 2, reviewed: 3 };   // what needs your attention comes first
  const ui = { form: null, focus: false, groups: { upcoming: true, past: true, done: false }, open: {}, filter: {} };
  const keyOf = s => !s ? "none" : DONE.includes(s.status) ? "reviewed" : s.status === "needs_revision" ? "needs_revision" : "submitted";
  const chipLabel = k => text(k === "none" ? "notSubmitted" : k);
  const subsOf = (d, hw) => (d.homeworkSubmissions || []).filter(s => s.homeworkId === hw.id);
  // Late = the student's record says so, or it was sent after the due date.
  const isLate = (s, hw) => {
    if (!s || s.source === "in_person") return false;
    if (s.late === true) return true;
    const at = ts(s.submittedAt || s.createdAt);
    return !!(at && hw.dueDate && at > new Date(hw.dueDate + "T23:59:59").getTime());
  };
  const stats = (c, d, hw) => {
    const ids = new Set(live(c).map(m => m.studentId)), subs = subsOf(d, hw).filter(s => ids.has(s.studentId));
    return { total: ids.size, sent: subs.length, done: subs.filter(s => DONE.includes(s.status)).length };
  };
  const stateOf = (c, d, hw) => {
    const s = stats(c, d, hw);
    if (s.total && s.done === s.total) return "done";
    return hw.dueDate && hw.dueDate < today() ? "past" : "upcoming";
  };

  const studentRow = (hw, m, sub) => {
    const k = keyOf(sub), label = sub && sub.status === "completed_in_person" ? text("completed_in_person") : chipLabel(k);
    const pills = '<span class="hw-pills"><span class="pill hw-st-' + k + '">' + esc(label) + '</span>' +
      (isLate(sub, hw) ? '<span class="pill hw-late">' + text("late") + '</span>' : "") + '</span>';
    if (!sub) return '<div class="hw-stu hw-stu-row"><b>' + esc(m.studentName) + '</b>' + pills +
      '<button class="btn small ghost" type="button" data-hw-complete="' + esc(hw.id) + '" data-student="' + esc(m.studentId) + '">' + text("inPerson") + '</button></div>';
    const status = sub.status || "submitted", oldScore = sub.score !== undefined && sub.score !== null ? sub.score : "";
    return '<details class="hw-stu"><summary><b>' + esc(m.studentName) + '</b>' + pills + '</summary><div class="hw-stu-body">' +
      (sub.response ? '<p class="hw-copy"><small>' + text("response") + '</small><br>' + esc(sub.response) + '</p>' : "") +
      (safeUrl(sub.url) ? '<a class="btn small ghost" href="' + esc(sub.url) + '" target="_blank" rel="noopener">' + text("open") + '</a>' : "") +
      '<form class="group form" data-hw-review="' + esc(sub.id) + '" style="margin-top:8px" novalidate>' +
      '<label><span>' + text("feedback") + '</span><textarea name="feedback" rows="3" maxlength="3000">' + esc(sub.feedback || "") + '</textarea></label>' +
      '<label><span>' + text("score") + '</span><input name="score" type="number" min="0" max="100" step="1" value="' + esc(oldScore) + '"></label>' +
      '<label><span>' + text("status") + '</span><select name="status">' +
      (sub.source === "in_person" ? '<option value="completed_in_person" selected>' + text("completed_in_person") + '</option>' : "") +
      '<option value="reviewed"' + (status === "reviewed" ? " selected" : "") + '>' + text("reviewed") + '</option>' +
      '<option value="needs_revision"' + (status === "needs_revision" ? " selected" : "") + '>' + text("needs_revision") + '</option></select></label></form>' +
      '<button class="btn small" type="button" data-hw-feedback="' + esc(sub.id) + '">' + text("save") + '</button></div></details>';
  };

  const hwItem = (c, d, hw) => {
    const s = stats(c, d, hw), pct = s.total ? Math.round(s.sent / s.total * 100) : 0, f = ui.filter[hw.id] || "all";
    const rows = live(c).map(m => ({ m: m, sub: subsOf(d, hw).find(x => x.studentId === m.studentId) }));
    const count = k => k === "all" ? rows.length : rows.filter(r => keyOf(r.sub) === k).length;
    const shown = rows.filter(r => f === "all" || keyOf(r.sub) === f)
      .sort((a, b) => RANK[keyOf(a.sub)] - RANK[keyOf(b.sub)] || (a.m.studentName || "").localeCompare(b.m.studentName || ""));
    const prog = s.sent + "/" + s.total + " " + text("submittedWord");
    return '<details class="hw-item" data-hw-id="' + esc(hw.id) + '"' + (ui.open[hw.id] ? " open" : "") + '><summary>' +
      '<span class="hw-title">' + esc(hw.title) + '</span>' +
      '<span class="hw-meta">' + text("due") + ' ' + esc(dateText(hw.dueDate)) + ' · ' + prog + '</span>' +
      '<span class="hw-prog" role="img" aria-label="' + esc(prog) + '"><i style="width:' + pct + '%"></i></span></summary>' +
      '<div class="hw-body"><p class="hw-copy">' + esc(hw.instructions) + '</p>' +
      '<div class="hw-actions">' + (safeUrl(hw.link) ? '<a class="btn small ghost" href="' + esc(hw.link) + '" target="_blank" rel="noopener">' + text("open") + '</a>' : "") +
      '<button class="btn small ghost" type="button" data-hw-edit="' + esc(hw.id) + '">' + text("edit") + '</button></div>' +
      '<div class="hw-chips" role="group">' + CHIPS.map(k => '<button type="button" class="hw-chip" data-hw-chip="' + esc(hw.id) + '|' + k + '" aria-pressed="' + (f === k) + '">' + chipLabel(k) + ' ' + count(k) + '</button>').join("") + '</div>' +
      '<div class="hw-students">' + (shown.map(r => studentRow(hw, r.m, r.sub)).join("") || '<p class="note">' + text("emptyFilter") + '</p>') + '</div></div></details>';
  };

  const formHtml = d => {
    const hw = ui.form ? (d.homework || []).find(x => x.id === ui.form) : null, v = k => esc(hw ? hw[k] || "" : "");
    return '<form id="hw-assignment-form" class="group form" style="margin-top:14px" novalidate>' +
      '<input name="homeworkId" type="hidden" value="' + esc(hw ? hw.id : "") + '">' +
      '<label><span>' + text("title") + '</span><input name="title" maxlength="150" value="' + v("title") + '"></label>' +
      '<label><span>' + text("instructions") + '</span><textarea name="instructions" rows="4" maxlength="3000">' + v("instructions") + '</textarea></label>' +
      '<label><span>' + text("due") + '</span><input name="dueDate" type="date" value="' + v("dueDate") + '"></label>' +
      '<label><span>' + text("link") + '</span><input name="link" maxlength="500" inputmode="url" autocapitalize="none" placeholder="https://" value="' + v("link") + '"></label></form>' +
      '<button class="btn wide" id="hw-add" type="button">' + text(hw ? "editSave" : "assign") + '</button>' +
      '<button class="link" id="hw-cancel" type="button">' + text("cancel") + '</button>';
  };

  BODY.homework = (c, d) => {
    if (!d.hwLoaded) return '<p class="note" style="margin-top:14px">' + text("loading") + '</p>';
    const all = d.homework || [], by = {};
    GROUPS.forEach(g => by[g] = []);
    all.forEach(hw => by[stateOf(c, d, hw)].push(hw));
    by.upcoming.sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
    by.past.sort((a, b) => String(b.dueDate).localeCompare(String(a.dueDate)));
    by.done.sort((a, b) => String(b.dueDate).localeCompare(String(a.dueDate)));
    const groups = GROUPS.filter(g => by[g].length).map(g =>
      '<details class="hw-group" data-hw-group="' + g + '"' + (ui.groups[g] ? " open" : "") + '><summary><span>' + text(g) + '</span><span class="hw-badge">' + by[g].length + '</span></summary>' +
      by[g].map(hw => hwItem(c, d, hw)).join("") + '</details>').join("");
    return (ui.form === null ? '<button class="btn wide" id="hw-new" type="button">' + text("newHw") + '</button>' : formHtml(d)) +
      (groups || '<ul class="group" style="margin-top:14px"><li class="empty"><div>' + text("noHomework") + '</div></li></ul>');
  };

  BIND.homework = (c, d) => {
    if (!d.hwLoaded) {
      if (!d.hwLoading) {
        d.hwLoading = true;
        Promise.all([
          db.collection("homework").where("classId", "==", c.id).get(),
          db.collection("homeworkSubmissions").where("classId", "==", c.id).get()
        ]).then(r => {
          d.homework = r[0].docs.map(x => Object.assign({ id: x.id }, x.data()));
          d.homeworkSubmissions = r[1].docs.map(x => Object.assign({ id: x.id }, x.data()));
          d.hwLoaded = true; render();
        }).catch(err => { console.error(err); d.hwLoading = false; toast(text("fail")); });
      }
      return;
    }
    $$("details[data-hw-group]").forEach(el => el.ontoggle = () => { ui.groups[el.dataset.hwGroup] = el.open; });
    $$("details[data-hw-id]").forEach(el => el.ontoggle = () => { ui.open[el.dataset.hwId] = el.open; });
    $$("[data-hw-chip]").forEach(b => b.onclick = () => { const p = b.dataset.hwChip.split("|"); ui.filter[p[0]] = p[1]; ui.open[p[0]] = true; render(); });
    $$("[data-hw-edit]").forEach(b => b.onclick = () => { ui.form = b.dataset.hwEdit; ui.focus = true; render(); });
    const newBtn = $("#hw-new");
    if (newBtn) newBtn.onclick = () => { ui.form = ""; ui.focus = true; render(); };
    const form = $("#hw-assignment-form");
    if (form) {
      $("#hw-cancel").onclick = () => { ui.form = null; render(); };
      if (ui.focus) { ui.focus = false; form.scrollIntoView({ behavior: "smooth", block: "center" }); form.elements.title.focus(); }
      $("#hw-add").onclick = guard(async () => {
        const f = form.elements, title = f.title.value.trim(), instructions = f.instructions.value.trim(), dueDate = f.dueDate.value;
        const linkText = f.link.value.trim(), link = linkText ? safeUrl(linkText) : "";
        if (!title || !instructions || !dueDate) return toast(text("need"));
        if (linkText && !link) return toast(text("badUrl"));
        const existingId = f.homeworkId.value;
        if (existingId) {
          const patch = { title: title, instructions: instructions, dueDate: dueDate, link: link, updatedAt: FV.serverTimestamp() };
          await db.collection("homework").doc(existingId).update(patch);
          Object.assign(d.homework.find(x => x.id === existingId), patch);
          toast(text("editSaved"));
        } else {
          const data = { classId: c.id, teacherId: me.id, title: title, instructions: instructions, dueDate: dueDate, link: link, createdAt: FV.serverTimestamp() };
          const ref = await db.collection("homework").add(data);
          d.homework.push(Object.assign({ id: ref.id }, data, { createdAt: { ms: Date.now() } }));
          toast(text("saved"));
        }
        ui.form = null; render();
      });
    }
    $$("[data-hw-complete]").forEach(button => button.onclick = guard(async () => {
      const student = mem(c).find(x => x.studentId === button.dataset.student), hw = d.homework.find(x => x.id === button.dataset.hwComplete);
      if (!student || !hw) return;
      const id = hw.id + "_" + student.studentId;
      const data = { homeworkId: hw.id, classId: c.id, studentId: student.studentId, studentName: student.studentName,
        response: "", url: "", status: "completed_in_person", source: "in_person", teacherId: me.id, completedAt: FV.serverTimestamp() };
      await db.collection("homeworkSubmissions").doc(id).set(data);
      d.homeworkSubmissions.push(Object.assign({ id: id }, data, { completedAt: { ms: Date.now() } }));
      toast(text("completionSaved")); render();
    }));
    $$("[data-hw-feedback]").forEach(button => button.onclick = guard(async () => {
      const rf = button.parentElement.querySelector("form[data-hw-review]"), id = button.dataset.hwFeedback, sub = d.homeworkSubmissions.find(x => x.id === id);
      if (!rf || !sub) return;
      const feedback = rf.elements.feedback.value.trim(), status = rf.elements.status.value;
      const scoreText = rf.elements.score.value.trim(), score = scoreText === "" ? null : Number(scoreText);
      if (scoreText !== "" && (!Number.isFinite(score) || score < 0 || score > 100)) return toast(text("fail"));
      const patch = { feedback: feedback, status: status, reviewedAt: FV.serverTimestamp() };
      if (score !== null) patch.score = score;
      await db.collection("homeworkSubmissions").doc(id).update(patch);
      Object.assign(sub, { feedback: feedback, status: status });
      if (score !== null) sub.score = score;
      toast(text("feedbackSaved")); render();
    }));
  };
})();
