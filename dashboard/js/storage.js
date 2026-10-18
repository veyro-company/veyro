import { uid, shiftedDay, dayISO, statusName } from "./utils.js";
const KEY = "veyro.dashboard.v1";
const copy = (x) => JSON.parse(JSON.stringify(x));
function seed() {
  const now = new Date().toISOString();
  const sample = [
    ["Bloom Studio", "Kreacja", "bloom.studio", "conversation", 2, 0],
    ["Fit Mom", "Fitness", "fitmom.pl", "sent", 1, 0],
    ["Soy Luna", "E-commerce", "soyluna.shop", "sent", 3, 0],
    ["Daily Aesthetic", "Lifestyle", "daily.aesthetic", "conversation", 0, 1],
    ["Kawiarnia Moment", "Gastronomia", "kawiarnia.moment", "offer", 1, 1],
    ["Luna Concept", "Design", "luna.concept", "conversation", 2, 2],
    ["Moya Ceramika", "Rękodzieło", "moya.ceramika", "sent", 2, 3],
    ["Form Studio", "Architektura", "form.studio", "found", 0, 2],
    ["Naturalnie", "Kosmetyki", "naturalnie", "found", 0, 3],
    ["Miejsce", "Gastronomia", "miejsce.cafe", "found", 0, 4],
    ["Natura Home", "Wnętrza", "natura.home", "found", 0, 4],
    ["Oko Design", "Design", "oko.design", "found", 0, 5],
    ["Noma", "Moda", "noma.wear", "found", 0, 5],
    ["Slow Living", "Lifestyle", "slow.living", "found", 0, 6],
    ["Światło", "Fotografia", "swiatlo.studio", "found", 0, 7],
    ["Zielona", "Florystyka", "zielona", "found", 0, 7],
    ["Maki", "Gastronomia", "maki.bistro", "found", 0, 8],
    ["Forma", "Fitness", "forma.club", "found", 0, 8],
    ["Aura", "Kosmetyki", "aura.care", "found", 0, 9],
  ];
  const clients = sample.map((a, i) => ({
    id: "c" + (i + 1),
    name: a[0],
    industry: a[1],
    instagram: a[2],
    status: a[3],
    lastMessage: a[3] === "found" ? "" : shiftedDay(-a[4]),
    nextContact: shiftedDay(a[5]),
    ownerId: i % 2 ? "u2" : "u1",
    description:
      i === 0
        ? "Studio kreatywne. Potrzebuje wsparcia w komunikacji marki."
        : "Potencjalna współpraca w zakresie komunikacji i social media.",
    notes: "",
    value: 0,
    wonAt: "",
    archived: false,
    createdAt: now,
    updatedAt: now,
    history: [
      { id: uid(), at: now, text: "Dodano profil do CRM.", type: "created" },
    ],
  }));
  const tasks = [
    {
      id: "t1",
      title: "Odpisać do @fitmom.pl",
      status: "todo",
      priority: "high",
      due: dayISO(),
      time: "10:00",
      ownerId: "u1",
      clientId: "c2",
      description: "Wrócić z propozycją krótkiej rozmowy.",
      checklist: [],
    },
    {
      id: "t2",
      title: "Wysłać 5 nowych wiadomości",
      status: "done",
      priority: "normal",
      due: dayISO(),
      time: "12:00",
      ownerId: "u2",
      clientId: "",
      description: "Spersonalizować każdą wiadomość.",
      checklist: [],
    },
    {
      id: "t3",
      title: "Przygotować ofertę dla @bloom.studio",
      status: "todo",
      priority: "high",
      due: dayISO(),
      time: "14:00",
      ownerId: "u1",
      clientId: "c1",
      description: "Przygotować zakres obsługi i wycenę.",
      checklist: [
        { id: uid(), text: "Analiza profilu", done: true },
        { id: uid(), text: "Propozycja zakresu", done: false },
      ],
    },
    {
      id: "t4",
      title: "Zaplanować post na Instagram",
      status: "todo",
      priority: "normal",
      due: dayISO(),
      time: "16:00",
      ownerId: "u2",
      clientId: "",
      description: "Przedstawić wartości VEYRO.",
      checklist: [],
    },
  ];
  const events = [
    {
      id: "e1",
      title: "Call z @bloom.studio",
      date: dayISO(),
      time: "14:00",
      endTime: "14:30",
      type: "call",
      clientId: "c1",
      taskId: "t3",
      description: "Omówienie potrzeb i celów marki.",
      reminder: 30,
      ownerId: "u1",
    },
    {
      id: "e2",
      title: "Follow-up do 3 klientów",
      date: shiftedDay(1),
      time: "10:00",
      endTime: "10:30",
      type: "followup",
      clientId: "",
      taskId: "",
      description: "Sprawdzić odpowiedzi w CRM.",
      reminder: 15,
      ownerId: "u2",
    },
    {
      id: "e3",
      title: "Analiza wyników tygodnia",
      date: shiftedDay(3),
      time: "12:00",
      endTime: "13:00",
      type: "analysis",
      clientId: "",
      taskId: "",
      description: "Podsumowanie działań i wniosków.",
      reminder: 30,
      ownerId: "u1",
    },
    {
      id: "e4",
      title: "Planowanie treści",
      date: shiftedDay(5),
      time: "16:00",
      endTime: "17:00",
      type: "content",
      clientId: "",
      taskId: "t4",
      description: "Pomysły na kolejny tydzień.",
      reminder: 15,
      ownerId: "u2",
    },
  ];
  const activity = [
    {
      id: uid(),
      at: now,
      text: "Przygotowano przykładową przestrzeń VEYRO.",
      entityId: "",
      entityType: "system",
      type: "system",
    },
  ];
  const contactLog = [0, 1, 2].map((n) => ({
    id: uid(),
    clientId: "c" + (n + 1),
    at: dayISO() + "T09:00:00",
    type: "message",
  }));
  return {
    schemaVersion: 1,
    team: [
      { id: "u1", name: "Aleksandra", initials: "AK" },
      { id: "u2", name: "Michał", initials: "MK" },
    ],
    profile: {
      name: "Aleksandra",
      company: "VEYRO",
      email: "",
      weeklyGoal: 20,
      revenueGoal: 10000,
      clientGoal: 5,
      compact: false,
      reduceMotion: false,
      reminders: true,
      showDemo: true,
    },
    clients,
    tasks,
    events,
    ideas: [
      {
        id: "i1",
        title: "Marki, które mają coś do powiedzenia",
        description:
          "Seria postów o autentycznej komunikacji. Pokażmy, jak pomagamy małym markom rosnąć.",
        priority: "high",
        createdAt: now,
      },
      {
        id: "i2",
        title: "Pakiet na dobry początek",
        description:
          "Prosty pakiet startowy: audyt profilu, strategia i pierwsze materiały.",
        priority: "normal",
        createdAt: now,
      },
      {
        id: "i3",
        title: "Kawa z VEYRO",
        description:
          "Krótkie, niezobowiązujące spotkania z lokalnymi przedsiębiorcami.",
        priority: "low",
        createdAt: now,
      },
    ],
    activity,
    contactLog,
  };
}
let db,
  storageProblem = "";
try {
  const saved = localStorage.getItem(KEY);
  db = saved ? validate(JSON.parse(saved)) : seed();
  if (!saved) localStorage.setItem(KEY, JSON.stringify(db));
} catch (e) {
  db = seed();
  storageProblem =
    "Nie udało się odczytać danych. Pracujesz na danych przykładowych; wyeksportuj dane przed zamknięciem.";
}
export function getDB() {
  return db;
}
export function storageWarning() {
  return storageProblem;
}
export function persist(next = db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
    db = next;
    document.dispatchEvent(new CustomEvent("veyro:updated"));
    return true;
  } catch (e) {
    throw new Error(
      "Brak miejsca lub dostępu do pamięci przeglądarki. Wyeksportuj dane i zwolnij miejsce.",
    );
  }
}
export function transact(fn) {
  const next = copy(db);
  fn(next);
  persist(next);
  return next;
}
export function log(
  db,
  text,
  entityType = "system",
  entityId = "",
  type = "change",
) {
  db.activity.unshift({
    id: uid(),
    at: new Date().toISOString(),
    text,
    entityType,
    entityId,
    type,
  });
  db.activity = db.activity.slice(0, 2000);
}
export function updateEntity(collection, entity) {
  transact((d) => {
    const list = d[collection],
      index = list.findIndex((x) => x.id === entity.id);
    const previous = index >= 0 ? list[index] : null;
    const now = new Date().toISOString();
    entity = {
      ...entity,
      id: entity.id || uid(),
      createdAt: previous?.createdAt || now,
      updatedAt: now,
    };
    if (collection === "clients") {
      entity.history = previous?.history || [];
      const changed = previous && previous.status !== entity.status;
      entity.history.unshift({
        id: uid(),
        at: now,
        text: !previous
          ? "Dodano klienta."
          : changed
            ? `Status: ${statusName(previous.status)} → ${statusName(entity.status)}.`
            : "Zaktualizowano dane klienta.",
        type: "change",
      });
      if ((changed || !previous) && entity.status === "won" && !entity.wonAt)
        entity.wonAt = now;
      if ((changed || !previous) && entity.status === "sent") {
        entity.lastMessage = dayISO();
        d.contactLog.push({
          id: uid(),
          clientId: entity.id,
          at: now,
          type: "message",
        });
      }
      if (
        (changed || !previous) &&
        ["conversation", "offer"].includes(entity.status)
      )
        d.contactLog.push({
          id: uid(),
          clientId: entity.id,
          at: now,
          type: "reply",
        });
    }
    if (index < 0) list.push(entity);
    else list[index] = entity;
    const names = {
      clients: "klienta",
      tasks: "zadanie",
      events: "wydarzenie",
      ideas: "pomysł",
    };
    log(
      d,
      `${previous ? "Zaktualizowano" : "Dodano"} ${names[collection]}: ${entity.name || entity.title}.`,
      collection,
      entity.id,
    );
  });
}
export function removeEntity(collection, id) {
  transact((d) => {
    const item = d[collection].find((x) => x.id === id);
    d[collection] = d[collection].filter((x) => x.id !== id);
    if (collection === "clients") {
      d.tasks.forEach((x) => {
        if (x.clientId === id) x.clientId = "";
      });
      d.events.forEach((x) => {
        if (x.clientId === id) x.clientId = "";
      });
    }
    if (collection === "tasks")
      d.events.forEach((x) => {
        if (x.taskId === id) x.taskId = "";
      });
    log(d, `Usunięto: ${item?.name || item?.title || "element"}.`);
  });
}
export function recordContact(id, type, note) {
  transact((d) => {
    const c = d.clients.find((c) => c.id === id);
    if (!c) throw Error("Nie znaleziono klienta.");
    const at = new Date().toISOString();
    d.contactLog.push({ id: uid(), clientId: id, type, at });
    c.lastMessage = dayISO();
    if (type === "message" && c.status === "found") c.status = "sent";
    if (type === "reply" && ["found", "sent"].includes(c.status))
      c.status = "conversation";
    c.history.unshift({
      id: uid(),
      at,
      text:
        (type === "message" ? "Wysłano wiadomość" : "Otrzymano odpowiedź") +
        (note ? ": " + note : "."),
      type,
    });
    log(
      d,
      `${type === "message" ? "Wiadomość do" : "Odpowiedź od"} ${c.name}.`,
      "clients",
      id,
      type,
    );
  });
}
export function weekStart(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}
export function stats() {
  const active = db.clients.filter((x) => !x.archived),
    start = weekStart();
  const contacts = db.contactLog.filter(
    (x) => x.type === "message" && new Date(x.at) >= start,
  );
  return {
    found: active.filter((x) => x.status === "found").length,
    sent: active.filter((x) => x.status === "sent").length,
    conversation: active.filter((x) => x.status === "conversation").length,
    offer: active.filter((x) => x.status === "offer").length,
    won: active.filter((x) => x.status === "won").length,
    revenue: active
      .filter((x) => x.status === "won")
      .reduce((a, c) => a + Number(c.value || 0), 0),
    contacts: contacts.length,
    goal: Number(db.profile.weeklyGoal) || 20,
  };
}
function assert(condition, message) {
  if (!condition) throw Error("Nieprawidłowa kopia danych: " + message);
}
export function validate(data) {
  assert(
    data && typeof data === "object" && !Array.isArray(data),
    "oczekiwano obiektu JSON.",
  );
  assert(data.schemaVersion === 1, "nieobsługiwana wersja.");
  for (const k of [
    "clients",
    "tasks",
    "events",
    "ideas",
    "team",
    "activity",
    "contactLog",
  ]) {
    assert(Array.isArray(data[k]), `brak listy ${k}.`);
    assert(data[k].length <= 50000, `zbyt wiele rekordów ${k}.`);
    const ids = new Set();
    for (const item of data[k]) {
      assert(
        item && typeof item === "object" && typeof item.id === "string",
        `rekord ${k} nie ma identyfikatora.`,
      );
      assert(!ids.has(item.id), `powtórzony identyfikator ${k}.`);
      ids.add(item.id);
    }
  }
  assert(
    data.profile &&
      typeof data.profile.name === "string" &&
      typeof data.profile.company === "string",
    "brak profilu.",
  );
  assert(data.team.length > 0, "brak członków zespołu.");
  for (const u of data.team)
    assert(typeof u.name === "string", "błędna osoba.");
  assert(
    Number.isFinite(Number(data.profile.weeklyGoal)) &&
      Number(data.profile.weeklyGoal) > 0,
    "cel tygodniowy musi być większy od zera.",
  );
  const isDate = (v) =>
    typeof v === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    !isNaN(new Date(v + "T12:00").getTime());
  for (const c of data.clients) {
    assert(
      typeof c.name === "string" &&
        c.name.trim() &&
        ["found", "sent", "conversation", "offer", "won", "lost"].includes(
          c.status,
        ),
      "błędny klient.",
    );
    assert(
      Array.isArray(c.history) &&
        c.history.every(
          (x) => typeof x.text === "string" && typeof x.at === "string",
        ),
      "błędna historia klienta.",
    );
    assert(!c.nextContact || isDate(c.nextContact), "błędny termin kontaktu.");
    assert(
      Number.isFinite(Number(c.value)) && Number(c.value) >= 0,
      "błędna kwota.",
    );
  }
  for (const t of data.tasks) {
    assert(
      typeof t.title === "string" &&
        t.title.trim() &&
        ["todo", "doing", "done"].includes(t.status),
      "błędne zadanie.",
    );
    assert(
      Array.isArray(t.checklist) &&
        t.checklist.every(
          (c) => typeof c.text === "string" && typeof c.done === "boolean",
        ),
      "błędna checklista.",
    );
    assert(!t.due || isDate(t.due), "błędny termin zadania.");
  }
  for (const e of data.events) {
    assert(
      typeof e.title === "string" &&
        e.title.trim() &&
        isDate(e.date) &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(e.time),
      "błędne wydarzenie.",
    );
  }
  for (const i of data.ideas)
    assert(
      typeof i.title === "string" && typeof i.description === "string",
      "błędny pomysł.",
    );
  for (const l of data.contactLog)
    assert(
      ["message", "reply"].includes(l.type) && !isNaN(new Date(l.at)),
      "błędny dziennik kontaktów.",
    );
  const files = data.files || [];
  assert(
    Array.isArray(files) && files.length < 500,
    "błędna biblioteka plików.",
  );
  let totalSize = 0;
  for (const f of files) {
    assert(
      typeof f.id === "string" &&
        typeof f.name === "string" &&
        Number.isFinite(f.size) &&
        f.size >= 0 &&
        f.size <= 1024 * 1024,
      "błędny plik.",
    );
    assert(
      typeof f.data === "string" &&
        /^data:[^;,]*;base64,[A-Za-z0-9+/=]*$/.test(f.data),
      "błędna zawartość pliku.",
    );
    assert(f.data.length <= 1500000, "zbyt duży plik.");
    totalSize += f.size;
  }
  assert(totalSize <= 2 * 1024 * 1024, "przekroczony limit biblioteki.");
  return { ...copy(data), files: copy(files) };
}
export function importData(data) {
  persist(validate(data));
}
export function resetData(demo = false) {
  const next = seed();
  if (!demo) {
    for (const key of [
      "clients",
      "tasks",
      "events",
      "ideas",
      "activity",
      "contactLog",
    ])
      next[key] = [];
    next.profile = copy(db.profile);
    next.team = copy(db.team);
    next.profile.showDemo = false;
  }
  persist(next);
}
export function exportData() {
  return JSON.stringify(
    { ...db, exportedAt: new Date().toISOString() },
    null,
    2,
  );
}
// Granica adaptera: przyszły backend może zastąpić getDB/persist/transact.
// Identyfikatory użytkowników i relacje pozostają stabilne; brak pozornego logowania.
