/* Homework assignment, tracking and feedback tools for teacher classes. */
(() => {
  "use strict";
  const copy = {
    en: {
      homework: "Homework", title: "Assignment title", instructions: "Instructions", due: "Due date",
      link: "Resource link (optional)", assign: "Assign homework", noHomework: "No homework assigned yet.",
      loading: "Loading submissions…", students: "Student submissions", notSubmitted: "Not submitted",
      submitted: "Submitted", reviewed: "Reviewed", needs_revision: "Revision requested", completed_in_person: "Completed in person",
      response: "Student work", feedback: "Feedback", score: "Score out of 100 (optional)",
      save: "Save feedback", status: "Status", edit: "Edit assignment", editSave: "Save changes", editSaved: "Homework updated.", cancel: "Cancel edit", inPerson: "Record completed in person", completionSaved: "Completion recorded.", need: "Add a title, instructions, and due date.",
      badUrl: "Use a link beginning with https://", saved: "Homework assigned.",
      feedbackSaved: "Feedback saved.", fail: "Could not save homework. Please try again."
    },
    my: {
      homework: "အိမ်စာ", title: "အိမ်စာ ခေါင်းစဉ်", instructions: "ညွှန်ကြားချက်များ", due: "နောက်ဆုံးရက်",
      link: "အရင်းအမြစ် လင့်ခ် (ရွေးချယ်စရာ)", assign: "အိမ်စာ ပေးမည်", noHomework: "အိမ်စာ မပေးရသေးပါ။",
      loading: "ကျောင်းသားများ၏ ပေးပို့မှု ဖွင့်နေသည်…", students: "ကျောင်းသား၏ အိမ်စာများ", notSubmitted: "မပို့ရသေး",
      submitted: "ပို့ပြီး", reviewed: "စစ်ဆေးပြီး", needs_revision: "ပြင်ဆင်ရန် လိုအပ်", completed_in_person: "လူကိုယ်တိုင် ပြီးစီး",
      response: "ကျောင်းသား၏ အလုပ်", feedback: "အကြံပြုချက်", score: "ရမှတ် / ၁၀၀ (ရွေးချယ်စရာ)",
      save: "အကြံပြုချက် သိမ်းမည်", status: "အခြေအနေ", edit: "အိမ်စာ ပြင်မည်", editSave: "ပြင်ဆင်မှု သိမ်းမည်", editSaved: "အိမ်စာ ပြင်ဆင်ပြီးပါပြီ။", cancel: "မလုပ်တော့ပါ", inPerson: "လူကိုယ်တိုင် ပြီးစီးကြောင်း မှတ်မည်", completionSaved: "ပြီးစီးမှု မှတ်တမ်းတင်ပြီးပါပြီ။", need: "ခေါင်းစဉ်၊ ညွှန်ကြားချက်နှင့် နောက်ဆုံးရက် ထည့်ပါ။",
      badUrl: "https:// ဖြင့် စသော လင့်ခ်ကို အသုံးပြုပါ။", saved: "အိမ်စာ ပေးပြီးပါပြီ။",
      feedbackSaved: "အကြံပြုချက် သိမ်းပြီးပါပြီ။", fail: "သိမ်းမရပါ။ ပြန်ကြိုးစားပါ။"
    }
  };
  const text = k => copy[lang === "my" ? "my" : "en"][k] || k;
  const dateText = d => d ? fmt(d) : "—";
  SUBS.push("homework");

  BODY.homework = (c, d) => {
    const assignments = d.homework || [];
    const cards = assignments.map(hw => {
      const submissions = d.homeworkSubmissions || [];
      const items = mem(c).map(student => {
        const sub = submissions.find(s => s.homeworkId === hw.id && s.studentId === student.studentId);
        if (!sub) return '<li class="item"><div class="grow"><b>' + esc(student.studentName) + '</b><small>' + text("notSubmitted") + '</small><button class="btn small ghost" type="button" data-hw-complete="' + esc(hw.id) + '" data-student="' + esc(student.studentId) + '">' + text("inPerson") + '</button></div></li>';
        const status = sub.status || "submitted";
        const studentWork = '<small class="hw-copy">' + text("response") + ': ' + esc(sub.response || "") + '</small>' +
          (safeUrl(sub.url) ? '<a class="btn small ghost" href="' + esc(sub.url) + '" target="_blank" rel="noopener">' + t("openLink") + '</a>' : "");
        const oldScore = sub.score !== undefined && sub.score !== null ? sub.score : "";
        return '<li class="item"><div class="grow"><b>' + esc(student.studentName) + '</b><small>' + text(status) + '</small>' +
          studentWork + '<form class="group form" data-hw-review="' + esc(sub.id) + '" style="margin-top:8px" novalidate>' +
          '<label><span>' + text("feedback") + '</span><textarea name="feedback" rows="3" maxlength="3000">' + esc(sub.feedback || "") + '</textarea></label>' +
          '<label><span>' + text("score") + '</span><input name="score" type="number" min="0" max="100" step="1" value="' + esc(oldScore) + '"></label>' +
          '<label><span>' + text("status") + '</span><select name="status">' +
          (sub.source === "in_person" ? '<option value="completed_in_person" selected>' + text("completed_in_person") + '</option>' : '') +
          '<option value="reviewed"' + (status === "reviewed" ? " selected" : "") + '>' + text("reviewed") + '</option>' +
          '<option value="needs_revision"' + (status === "needs_revision" ? " selected" : "") + '>' + text("needs_revision") + '</option></select></label></form>' +
          '<button class="btn small" type="button" data-hw-feedback="' + esc(sub.id) + '">' + text("save") + '</button></div></li>';
      }).join("");
      return '<section><p class="sub">' + esc(hw.title) + '</p><button class="btn small ghost" type="button" data-hw-edit="' + esc(hw.id) + '">' + text("edit") + '</button><ul class="group"><li class="item"><div class="grow">' +
        '<small>' + text("due") + ': ' + esc(dateText(hw.dueDate)) + '</small><small class="hw-copy">' + esc(hw.instructions) + '</small>' +
        (safeUrl(hw.link) ? '<a class="btn small ghost" href="' + esc(hw.link) + '" target="_blank" rel="noopener">' + t("openLink") + '</a>' : '') +
        '</div></li>' + items + '</ul></section>';
    }).join("");
    return '<form id="hw-assignment-form" class="group form" style="margin-top:14px" novalidate>' +
      '<input name="homeworkId" type="hidden" value="">' +
      '<label><span>' + text("title") + '</span><input name="title" maxlength="150"></label>' +
      '<label><span>' + text("instructions") + '</span><textarea name="instructions" rows="4" maxlength="3000"></textarea></label>' +
      '<label><span>' + text("due") + '</span><input name="dueDate" type="date"></label>' +
      '<label><span>' + text("link") + '</span><input name="link" maxlength="500" inputmode="url" autocapitalize="none" placeholder="https://"></label></form>' +
      '<button class="btn wide" id="hw-add">' + text("assign") + '</button><button class="link" id="hw-cancel-edit" type="button" hidden>' + text("cancel") + '</button>' +
      (!d.hwLoaded ? '<p class="note">' + text("loading") + '</p>' : (cards || '<ul class="group"><li class="empty"><div>' + text("noHomework") + '</div></li></ul>'));
  };

  BIND.homework = (c, d) => {
    if (!d.hwLoaded) {
      if (!d.hwLoading) {
        d.hwLoading = true;
        Promise.all([
          db.collection("homework").where("classId", "==", c.id).get(),
          db.collection("homeworkSubmissions").where("classId", "==", c.id).get()
        ]).then(results => {
          d.homework = results[0].docs.map(x => Object.assign({ id: x.id }, x.data()));
          d.homeworkSubmissions = results[1].docs.map(x => Object.assign({ id: x.id }, x.data()));
          d.hwLoaded = true;
          render();
        }).catch(err => { console.error(err); d.hwLoading = false; toast(text("fail")); });
      }
      return;
    }
    const form = $("#hw-assignment-form"), addButton = $("#hw-add"), cancelButton = $("#hw-cancel-edit");
    const resetEdit = () => { form.reset(); form.elements.homeworkId.value = ""; addButton.textContent = text("assign"); cancelButton.hidden = true; };
    cancelButton.onclick = resetEdit;
    $$("[data-hw-edit]").forEach(button => button.onclick = () => {
      const hw = d.homework.find(x => x.id === button.dataset.hwEdit);
      if (!hw) return;
      form.elements.homeworkId.value = hw.id;
      form.elements.title.value = hw.title || "";
      form.elements.instructions.value = hw.instructions || "";
      form.elements.dueDate.value = hw.dueDate || "";
      form.elements.link.value = hw.link || "";
      addButton.textContent = text("editSave");
      cancelButton.hidden = false;
      form.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    addButton.onclick = guard(async () => {
      const f = form.elements;
      const title = f.title.value.trim(), instructions = f.instructions.value.trim(), dueDate = f.dueDate.value;
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
      render();
    });
    $$("[data-hw-complete]").forEach(button => button.onclick = guard(async () => {
      const student = mem(c).find(x => x.studentId === button.dataset.student);
      const hw = d.homework.find(x => x.id === button.dataset.hwComplete);
      if (!student || !hw) return;
      const id = hw.id + "_" + student.studentId;
      const data = { homeworkId: hw.id, classId: c.id, studentId: student.studentId, studentName: student.studentName,
        response: "", url: "", status: "completed_in_person", source: "in_person", teacherId: me.id, completedAt: FV.serverTimestamp() };
      await db.collection("homeworkSubmissions").doc(id).set(data);
      d.homeworkSubmissions.push(Object.assign({ id: id }, data, { completedAt: { ms: Date.now() } }));
      toast(text("completionSaved"));
      render();
    }));
    $$("[data-hw-feedback]").forEach(button => button.onclick = guard(async () => {
      const form = button.parentElement.querySelector("form[data-hw-review]");
      const id = button.dataset.hwFeedback, sub = d.homeworkSubmissions.find(x => x.id === id);
      if (!form || !sub) return;
      const feedback = form.elements.feedback.value.trim(), status = form.elements.status.value;
      const scoreText = form.elements.score.value.trim(), score = scoreText === "" ? null : Number(scoreText);
      if (scoreText !== "" && (!Number.isFinite(score) || score < 0 || score > 100)) return toast(text("fail"));
      const patch = { feedback: feedback, status: status, reviewedAt: FV.serverTimestamp() };
      if (score !== null) patch.score = score;
      await db.collection("homeworkSubmissions").doc(id).update(patch);
      Object.assign(sub, { feedback: feedback, status: status });
      if (score !== null) sub.score = score;
      toast(text("feedbackSaved"));
      render();
    }));
  };
})();
