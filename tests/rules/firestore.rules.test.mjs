import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test, before, after, beforeEach } from "node:test";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";

const ADMIN_EMAIL = "circle.edu.mm@gmail.com";   // must match firestore.rules
let env;
const TS = () => firebase.firestore.FieldValue.serverTimestamp();
const as = (uid, claims) => env.authenticatedContext(uid, claims).firestore();
const guest = () => env.unauthenticatedContext().firestore();
const admin = () => as("admin1", { email: ADMIN_EMAIL, email_verified: true });

before(async () => {
  env = await initializeTestEnvironment({ projectId: "demo-clc-rules", firestore: { rules: readFileSync("firestore.rules", "utf8") } });
});
after(() => env.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async ctx => {
    const set = (path, data) => ctx.firestore().doc(path).set(data);
    const person = (role, name, extra = {}) => ({ role, name, loginId: name.toLowerCase(), status: "active", ...extra });
    await set("users/stu1", person("student", "Stu1"));
    await set("users/stu2", person("student", "Stu2"));
    await set("users/stu3", person("student", "Stu3"));
    await set("users/stuOff", person("student", "StuOff", { status: "inactive" }));
    await set("users/tea1", person("teacher", "Tea1"));
    await set("users/tea2", person("teacher", "Tea2"));
    await set("classes/c1", { teacherId: "tea1", programId: "p1", day: "Monday", time: "19:00", venue_en: "Online" });
    await set("publicSchedule/c1", { programId: "p1" });
    for (const s of ["stu1", "stu2", "stuOff"]) await set(`memberships/c1_${s}`, { classId: "c1", studentId: s, status: "enrolled" });
    await set("grades/g1", { classId: "c1", studentId: "stu1", title: "Mid", score: 80, max: 100 });
    await set("grades/g2", { classId: "c1", studentId: "stu2", title: "Mid", score: 70, max: 100 });
    for (const s of ["stu1", "stu2"]) await set(`attendanceEntries/c1_2026-11-27_${s}`, { classId: "c1", date: "2026-11-27", studentId: s, status: "present" });
    await set("homework/h1", { classId: "c1", teacherId: "tea1", title: "HW", instructions: "Do it", dueDate: "2026-12-01", link: "" });
    for (const s of ["stu1", "stu2"]) await set(`homeworkSubmissions/h1_${s}`, { homeworkId: "h1", classId: "c1", studentId: s, studentName: s, response: "x", url: "", status: "submitted" });
    await set("enrolments/e1", { name: "Aye", email: "aye@example.com", course: "English", note: "", status: "pending" });
    await set("certificateVerifications/CLC-2026-TEST", { certificateNo: "CLC-2026-TEST", classTitle: "English", studentInitials: "S. O.", valid: true });
    await set("certificateNumberIndex/CLC-2026-TEST", { verificationId: "CLC-2026-TEST" });
  });
});

/* ---------- Guests and enrolments ---------- */
const validEnrol = () => ({ name: "Aye Aye", email: "aye@example.com", course: "English", note: "", status: "pending", scholarship: "none", essay: "", createdAt: TS() });

test("guest can create a valid pending enrolment", () => assertSucceeds(guest().collection("enrolments").add(validEnrol())));

for (const [label, patch] of Object.entries({
  "status other than pending": { status: "approved" },
  "name over 100 characters": { name: "x".repeat(101) },
  "email over 150 characters": { email: "x".repeat(151) },
  "note over 500 characters": { note: "x".repeat(501) },
  "unknown extra field": { role: "admin" },
  "scholarship without a real essay": { scholarship: "full", essay: "short" },
  "createdAt set by the client": { createdAt: new Date() },
})) {
  test(`guest cannot create an enrolment with ${label}`, () => assertFails(guest().collection("enrolments").add({ ...validEnrol(), ...patch })));
}

test("guest cannot read, update or delete enrolments", async () => {
  const doc = guest().doc("enrolments/e1");
  await assertFails(doc.get());
  await assertFails(doc.update({ status: "approved" }));
  await assertFails(doc.delete());
});

/* ---------- Students ---------- */
test("student reads only their own grade, attendance entry and submission", async () => {
  const db = as("stu1");
  await assertSucceeds(db.doc("grades/g1").get());
  await assertFails(db.doc("grades/g2").get());
  await assertSucceeds(db.doc("attendanceEntries/c1_2026-11-27_stu1").get());
  await assertFails(db.doc("attendanceEntries/c1_2026-11-27_stu2").get());
  await assertSucceeds(db.doc("homeworkSubmissions/h1_stu1").get());
  await assertFails(db.doc("homeworkSubmissions/h1_stu2").get());
});

test("student cannot read other profiles or memberships", async () => {
  const db = as("stu1");
  await assertSucceeds(db.doc("users/stu1").get());
  await assertFails(db.doc("users/stu2").get());
  await assertSucceeds(db.doc("memberships/c1_stu1").get());
  await assertFails(db.doc("memberships/c1_stu2").get());
});

test("student cannot change their role, write grades or write attendance", async () => {
  const db = as("stu1");
  await assertFails(db.doc("users/stu1").update({ role: "teacher" }));
  await assertSucceeds(db.doc("users/stu1").update({ about: "Hello", updatedAt: TS() }));
  await assertFails(db.collection("grades").add({ classId: "c1", studentId: "stu1", title: "Self", score: 100, max: 100 }));
  await assertFails(db.doc("attendanceEntries/c1_2026-11-28_stu1").set({ classId: "c1", date: "2026-11-28", studentId: "stu1", status: "present" }));
});

test("student can apply for a public class once, and only as themselves", async () => {
  const app = uid => ({ classId: "c1", studentId: uid, studentName: uid, programId: "p1", status: "pending", createdAt: TS() });
  await assertSucceeds(as("stu3").doc("classApplications/c1_stu3").set(app("stu3")));
  await assertFails(as("stu1").doc("classApplications/c1_stu1").set(app("stu1")));    // already a member
  await assertFails(as("stu3").doc("classApplications/c1_stu2").set(app("stu2")));    // pretending to be someone else
});

/* ---------- Teachers ---------- */
test("teacher edits only the allowed fields of their own class", async () => {
  await assertSucceeds(as("tea1").doc("classes/c1").update({ venue_en: "Room 2", updatedAt: TS() }));
  await assertFails(as("tea1").doc("classes/c1").update({ teacherId: "tea2" }));
  await assertFails(as("tea1").doc("classes/c1").update({ priceMMK: 0 }));
  await assertFails(as("tea2").doc("classes/c1").update({ venue_en: "Hacked" }));
});

test("teacher sees and grades only their own class", async () => {
  const grade = { classId: "c1", studentId: "stu1", title: "Quiz", score: 9, max: 10 };
  await assertSucceeds(as("tea1").doc("grades/g1").get());
  await assertFails(as("tea2").doc("grades/g1").get());
  await assertSucceeds(as("tea1").collection("grades").add(grade));
  await assertFails(as("tea1").collection("grades").add({ ...grade, score: 11 }));
  await assertFails(as("tea2").collection("grades").add(grade));
});

test("only the class teacher can mark attendance", async () => {
  const entry = { classId: "c1", date: "2026-11-28", studentId: "stu1", status: "present" };
  await assertSucceeds(as("tea1").doc("attendanceEntries/c1_2026-11-28_stu1").set(entry));
  await assertFails(as("tea2").doc("attendanceEntries/c1_2026-11-28_stu1").set(entry));
});

/* ---------- Certificates ---------- */
test("anyone can GET a certificate record but nobody can LIST them", async () => {
  for (const db of [guest(), as("stu1")]) {
    await assertSucceeds(db.doc("certificateVerifications/CLC-2026-TEST").get());
    await assertSucceeds(db.doc("certificateNumberIndex/CLC-2026-TEST").get());
    await assertFails(db.collection("certificateVerifications").get());
    await assertFails(db.collection("certificateNumberIndex").get());
  }
});

test("only the admin can write certificate records", async () => {
  const rec = { certificateNo: "CLC-2026-NEW", valid: true };
  await assertFails(guest().doc("certificateVerifications/CLC-2026-NEW").set(rec));
  await assertFails(as("stu1").doc("certificateVerifications/CLC-2026-NEW").set(rec));
  await assertSucceeds(admin().doc("certificateVerifications/CLC-2026-NEW").set(rec));
  await assertSucceeds(admin().doc("certificateNumberIndex/CLC-2026-NEW").set({ verificationId: "CLC-2026-NEW" }));
});

/* ---------- Inactive accounts and admin ---------- */
test("inactive accounts are locked out of class data", async () => {
  const db = as("stuOff");
  await assertSucceeds(db.doc("users/stuOff").get());           // own profile stays readable
  await assertFails(db.doc("memberships/c1_stuOff").get());
  await assertFails(db.doc("classes/c1").get());
});

test("admin can read and write everywhere", async () => {
  await assertSucceeds(admin().doc("anything/x").set({ a: 1 }));
  await assertSucceeds(admin().doc("users/stu1").get());
  await assertSucceeds(admin().doc("enrolments/e1").update({ status: "approved" }));
});

test("non-admins and unverified admin emails get nothing from the catch-all", async () => {
  await assertFails(as("stu1").doc("anything/x").set({ a: 1 }));
  await assertFails(as("stu1").doc("anything/x").get());
  await assertFails(as("fake1", { email: ADMIN_EMAIL, email_verified: false }).doc("users/stu1").get());
});

/* ---------- Experiment: how big a class can one attendance save be? ---------- */
async function teacherBatch(n) {
  const db = as("tea1"), date = "2026-11-28", b = db.batch();
  b.set(db.doc(`attendance/c1_${date}`), { classId: "c1", date, records: {}, teacherId: "tea1", updatedAt: TS() });
  for (let i = 1; i <= n; i++) b.set(db.doc(`attendanceEntries/c1_${date}_bulk${i}`), { classId: "c1", date, studentId: `bulk${i}`, status: "present" });
  try { await assertSucceeds(b.commit()); return "OK"; } catch { return "REJECTED"; }
}

test("attendance in ONE batch: report how many students the rules allow", async () => {
  await env.withSecurityRulesDisabled(async ctx => {
    for (let i = 1; i <= 40; i++) await ctx.firestore().doc(`memberships/c1_bulk${i}`).set({ classId: "c1", studentId: `bulk${i}`, status: "enrolled" });
  });
  const results = {};
  for (const n of [5, 10, 15, 20, 25, 30, 40]) results[n] = await teacherBatch(n);
  console.log("ATTENDANCE BATCH (students -> result):", JSON.stringify(results));
  assert.equal(results[5], "OK");   // small classes must always work; larger sizes are reported, not asserted
});
