/* Homework view and submission flow for the student portal. */
(() => {
  "use strict";
  const copy = {
    en: {
      homework: "Homework", open: "Open", loading: "Loading homework…", due: "Due", noHomework: "No homework has been assigned yet.",
      instructions: "Instructions", response: "Your answer or notes", workLink: "Link to your work (optional)",
      submit: "Submit homework", resubmit: "Resubmit work", submitted: "Submitted", reviewed: "Reviewed",
      needs_revision: "Revision requested", notSubmitted: "Not submitted", feedback: "Teacher feedback",
      score: "Score", required: "Write a response or add a link before submitting.",
      badUrl: "Use a link beginning with https://", saved: "Homework submitted.", failed: "Could not submit homework. Please try again."
    },
    my: {
      homework: "အိမ်စာ", open: "ဖွင့်မည်", loading: "အိမ်စာများ ဖွင့်နေသည်…", due: "နောက်ဆုံးရက်", noHomework: "အိမ်စာ မပေးရသေးပါ။",
      instructions: "ညွှန်ကြားချက်များ", response: "သင့်အဖြေ သို့မဟုတ် မှတ်ချက်", workLink: "သင့်အလုပ် လင့်ခ် (ရွေးချယ်စရာ)",
      submit: "အိမ်စာ ပို့မည်", resubmit: "ပြန်ပို့မည်", submitted: "ပို့ပြီး", reviewed: "စစ်ဆေးပြီး",
      needs_revision: "ပြင်ဆင်ရန် လိုအပ်", notSubmitted: "မပို့ရသေး", feedback: "ဆရာ၏ အကြံပြုချက်",
      score: "ရမှတ်", required: "မပို့မီ အဖြေရေးပါ သို့မဟုတ် လင့်ခ်ထည့်ပါ။",
      badUrl: "https:// ဖြင့် စသော လင့်ခ်ကို အသုံးပြုပါ။", saved: "အိမ်စာ ပို့ပြီးပါပြီ။", failed: "အိမ်စာ ပို့မရပါ။ ပြန်ကြိုးစားပါ။"
    }
  };
  const text = k => copy[lang === "my" ? "my" : "en"][k];
  let loaded = false, loading = false, assignments = [], submissions = [];
  const nav = document.querySelector("[data-homework-nav]");
  const syncNav = () => { if (nav) nav.textContent = text("homework"); };
  syncNav();
  new MutationObserver(syncNav).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  const loadData = async () => {
    const activeRows = rows.filter(r => r.c);
    const snaps = await Promise.all(activeRows.map(r => db.collection("homework").where("classId", "==", r.c.id).get()));
    assignments = snaps.flatMap(s => s.docs.map(d => Object.assign({ id: d.id }, d.data())));
    assignments.sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
    const snap = await db.collection("homeworkSubmissions").where("studentId", "==", me.id).get();
    submissions = snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
    loaded = true;
  };

  VIEW.homework = () => {
    syncNav();
    if (!loaded) {
      if (!loading && me && ready) {
        loading = true;
        loadData().then(() => { loading = false; if (location.hash === "#homework") render(); })
          .catch(err => { console.error(err); loading = false; toast(text("failed")); });
      }
      return '<ul class="group"><li class="empty"><div>' + text(me && ready ? "loading" : "noHomework") + '</div></li></ul>';
    }
    if (!assignments.length) return '<ul class="group"><li class="empty"><div>' + text("noHomework") + '</div></li></ul>';
    return '<ul class="group">' + assignments.map(hw => {
      const row = rows.find(r => r.c.id === hw.classId);
      const submission = submissions.find(s => s.homeworkId === hw.id);
      const status = submission ? submission.status : "notSubmitted";
      const resource = safeUrl(hw.link) ? '<a class="btn small ghost" href="' + esc(hw.link) + '" target="_blank" rel="noopener">' + text("open") + '</a>' : "";
      const feedback = submission && submission.feedback ? '<small class="reply">' + text("feedback") + ': ' + esc(submission.feedback) + '</small>' : "";
      const score = submission && submission.score !== undefined && submission.score !== null ? '<small>' + text("score") + ': ' + esc(submission.score) + ' / 100</small>' : "";
      return '<li class="item"><div class="grow"><b>' + esc(hw.title) + '</b>' +
        '<small>' + esc(row ? cTitle(row.c) : "") + ' · ' + text("due") + ': ' + esc(fmt(hw.dueDate)) + '</small>' +
        '<small class="hw-copy">' + text("instructions") + ': ' + esc(hw.instructions) + '</small>' + resource +
        '<span class="pill s-' + (status === "notSubmitted" ? "pending" : status === "needs_revision" ? "rejected" : "active") + '">' + text(status) + '</span></div>' +
        '<form class="group form" data-hw-form="' + esc(hw.id) + '" style="margin-top:10px" novalidate>' +
        '<label><span>' + text("response") + '</span><textarea name="response" rows="4" maxlength="3000">' + esc(submission ? submission.response : "") + '</textarea></label>' +
        '<label><span>' + text("workLink") + '</span><input name="url" maxlength="500" inputmode="url" autocapitalize="none" placeholder="https://" value="' + esc(submission ? submission.url : "") + '"></label></form>' +
        '<button class="btn wide" type="button" data-hw-submit="' + esc(hw.id) + '">' + text(submission ? "resubmit" : "submit") + '</button>' +
        feedback + score + '</li>';
    }).join("") + '</ul>';
  };

  document.querySelector("#view").addEventListener("click", async event => {
    const button = event.target.closest("[data-hw-submit]");
    if (!button) return;
    const hw = assignments.find(x => x.id === button.dataset.hwSubmit);
    const form = button.parentElement.querySelector("form[data-hw-form]");
    if (!hw || !form) return;
    const response = form.elements.response.value.trim(), urlText = form.elements.url.value.trim();
    if (!response && !urlText) return toast(text("required"));
    const url = urlText ? safeUrl(urlText) : "";
    if (urlText && !url) return toast(text("badUrl"));
    const id = hw.id + "_" + me.id;
    const prior = submissions.find(s => s.homeworkId === hw.id);
    const data = {
      homeworkId: hw.id, classId: hw.classId, studentId: me.id, studentName: me.name,
      response: response, url: url, status: "submitted", submittedAt: FV.serverTimestamp()
    };
    button.disabled = true;
    try {
      await db.collection("homeworkSubmissions").doc(id).set(data, { merge: true });
      if (prior) Object.assign(prior, data);
      else submissions.push(Object.assign({ id: id }, data, { submittedAt: { ms: Date.now() } }));
      toast(text("saved"));
      render();
    } catch (err) {
      console.error(err);
      toast(text("failed"));
      button.disabled = false;
    }
  });
})();
