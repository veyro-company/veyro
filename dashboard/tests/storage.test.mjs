import assert from "node:assert/strict";
import { pathToFileURL, fileURLToPath } from "node:url";
import fs from "node:fs";
const root = fileURLToPath(new URL("../", import.meta.url));
const memory = new Map();
globalThis.localStorage = {
  getItem: (k) => memory.get(k) || null,
  setItem: (k, v) => memory.set(k, v),
};
globalThis.document = new EventTarget();
if (!globalThis.CustomEvent)
  globalThis.CustomEvent = class extends Event {
    constructor(type, options) {
      super(type);
      this.detail = options?.detail;
    }
  };
const s = await import(pathToFileURL(root + "js/storage.js"));
const u = await import(pathToFileURL(root + "js/utils.js"));
let passed = 0;
const test = (name, fn) => {
  fn();
  passed++;
  console.log("OK " + name);
};
test("Dane startowe i walidacja eksportu", () => {
  assert.equal(s.getDB().clients.length, 19);
  assert.equal(s.stats().conversation, 3);
  assert.equal(s.stats().found, 12);
  s.validate(JSON.parse(s.exportData()));
});
test("Nowy klient pozyskany ma date i przychod", () => {
  s.updateEntity("clients", {
    id: "qa-won",
    name: "QA",
    status: "won",
    value: 1250,
    history: [],
    ownerId: "u1",
    nextContact: "",
    archived: false,
  });
  assert.ok(s.getDB().clients.find((x) => x.id === "qa-won").wonAt);
  assert.equal(s.stats().revenue, 1250);
});
test("Wiadomosc aktualizuje lejek i cel", () => {
  s.updateEntity("clients", {
    id: "qa-contact",
    name: "Kontakt",
    status: "found",
    value: 0,
    ownerId: "u2",
    nextContact: "",
    archived: false,
  });
  const n = s.stats().contacts;
  s.recordContact("qa-contact", "message", "Notatka");
  assert.equal(s.stats().contacts, n + 1);
  assert.equal(
    s.getDB().clients.find((x) => x.id === "qa-contact").status,
    "sent",
  );
  s.recordContact("qa-contact", "reply", "Tak");
  assert.equal(
    s.getDB().clients.find((x) => x.id === "qa-contact").status,
    "conversation",
  );
  assert.equal(
    s.getDB().clients.find((x) => x.id === "qa-contact").history[0].text,
    "Otrzymano odpowiedź: Tak",
  );
});
test("Zmiana statusu rejestruje kontakt raz", () => {
  const c = s.getDB().clients.find((x) => x.id === "qa-contact");
  const n = s.stats().contacts;
  s.updateEntity("clients", { ...c, status: "sent" });
  assert.equal(s.stats().contacts, n + 1);
  s.updateEntity("clients", {
    ...s.getDB().clients.find((x) => x.id === c.id),
    notes: "Nowa notatka",
  });
  assert.equal(s.stats().contacts, n + 1);
});
test("Archiwum nie zawyza przychodu", () => {
  s.transact((d) => {
    d.clients.find((x) => x.id === "qa-won").archived = true;
  });
  assert.equal(s.stats().revenue, 0);
});
test("Usuwanie porzadkuje relacje", () => {
  s.updateEntity("tasks", {
    id: "qa-task",
    title: "QA task",
    status: "todo",
    priority: "normal",
    checklist: [{ id: "check", text: "Krok", done: true }],
    clientId: "qa-contact",
    due: u.dayISO(),
  });
  s.updateEntity("events", {
    id: "qa-event",
    title: "QA event",
    date: u.dayISO(),
    time: "12:00",
    taskId: "qa-task",
    clientId: "qa-contact",
  });
  s.removeEntity("clients", "qa-contact");
  assert.equal(s.getDB().tasks.find((x) => x.id === "qa-task").clientId, "");
  assert.equal(s.getDB().events.find((x) => x.id === "qa-event").clientId, "");
  s.removeEntity("tasks", "qa-task");
  assert.equal(s.getDB().events.find((x) => x.id === "qa-event").taskId, "");
});
test("Eksport i import przywracaja caly stan", () => {
  const exported = JSON.parse(s.exportData());
  s.resetData(false);
  assert.equal(s.getDB().clients.length, 0);
  s.importData(exported);
  assert.equal(s.getDB().clients.length, exported.clients.length);
  assert.deepEqual(
    s.validate(JSON.parse(s.exportData())).tasks,
    exported.tasks,
  );
});
test("Odrzucenie blednego importu bez utraty danych", () => {
  const before = s.exportData();
  assert.throws(() => s.importData({ schemaVersion: 2 }));
  assert.equal(
    s.exportData().replace(/"exportedAt": ".*?"/, '"exportedAt":""'),
    before.replace(/"exportedAt": ".*?"/, '"exportedAt":""'),
  );
  const data = JSON.parse(before);
  data.clients[0].status = "inny";
  assert.throws(() => s.importData(data));
});
test("Uszkodzona checklista i zly URL pliku sa odrzucane", () => {
  const data = JSON.parse(s.exportData());
  data.tasks[0].checklist = {};
  assert.throws(() => s.validate(data));
  const d = JSON.parse(s.exportData());
  d.files = [{ id: "file", name: "x", size: 1, data: "javascript:alert(1)" }];
  assert.throws(() => s.validate(d));
});
test("Blad zapisu nie zmienia stanu w pamieci", () => {
  const before = JSON.stringify(s.getDB()),
    setter = localStorage.setItem;
  localStorage.setItem = () => {
    throw Error("quota");
  };
  assert.throws(() =>
    s.transact((d) => {
      d.clients = [];
    }),
  );
  assert.equal(JSON.stringify(s.getDB()), before);
  localStorage.setItem = setter;
});
test("Escaping danych uzytkownika", () =>
  assert.equal(u.esc('<script>"&'), "&lt;script&gt;&quot;&amp;"));
test("Poczatek tygodnia przypada w poniedzialek", () => {
  assert.equal(s.weekStart(new Date("2026-10-18T12:00:00")).getDay(), 1);
  assert.equal(
    u.dayISO(s.weekStart(new Date("2026-10-18T12:00:00"))),
    "2026-10-12",
  );
});
test("Czysta przestrzen zachowuje profil i usuwa pliki", () => {
  s.transact((d) => {
    d.profile.name = "Profil QA";
    d.files = [];
  });
  s.resetData(false);
  assert.equal(s.getDB().profile.name, "Profil QA");
  for (const k of ["clients", "tasks", "events", "ideas", "contactLog"])
    assert.equal(s.getDB()[k].length, 0);
  assert.equal((s.getDB().files || []).length, 0);
});
test("Kwoty zachowuja grosze", () =>
  assert.equal(u.money(1250.5), "1250,50 zł"));
console.log(`Wynik: ${passed} testow zakonczonych powodzeniem.`);
