import {
  $,
  $$,
  esc,
  icon,
  uid,
  dayISO,
  shiftedDay,
  dateLabel,
  money,
  statuses,
  taskStatuses,
  priorities,
  options,
  statusBadge,
  priorityBadge,
  ownerName,
  empty,
  animateNumbers,
} from "./utils.js";
import {
  getDB,
  transact,
  updateEntity,
  removeEntity,
  recordContact,
  log,
  stats,
  exportData,
  importData,
  resetData,
  storageWarning,
} from "./storage.js";
import { dashboard } from "./dashboard.js";
import { clients, clientView } from "./clients.js";
import { tasks, taskView } from "./tasks.js";
import { calendar, calendarView } from "./calendar.js";
import { analytics, analyticsView } from "./analytics.js";
const pages = {
  dashboard: [
    "Pulpit",
    "home",
    "Dzień dobry!",
    "Oto najważniejsze informacje z VEYRO.",
  ],
  clients: [
    "Klienci",
    "user",
    "Dobre relacje.",
    "Twoi klienci. Nowe możliwości. Kolejny krok.",
  ],
  tasks: [
    "Zadania",
    "check",
    "Krok po kroku.",
    "Zrób miejsce na to, co naprawdę ważne.",
  ],
  calendar: [
    "Kalendarz",
    "calendar",
    "Dobry plan.",
    "Wszystko ma swój czas. Znajdź go tutaj.",
  ],
  analytics: [
    "Analityka",
    "chart",
    "Widać postęp.",
    "Liczby, które pomagają podejmować dobre decyzje.",
  ],
  ideas: [
    "Pomysły",
    "idea",
    "Coś dobrego.",
    "Miejsce na pomysły, które mogą urosnąć.",
  ],
  files: [
    "Pliki",
    "folder",
    "Pod ręką.",
    "Dokumenty i kopie zapasowe Twojej firmy.",
  ],
  settings: [
    "Ustawienia",
    "settings",
    "Po Twojemu.",
    "Profil, zespół i cele — wszystko w jednym miejscu.",
  ],
  activity: [
    "Aktywności",
    "activity",
    "Dzieje się.",
    "Każdy krok ma znaczenie. Oto Wasza historia.",
  ],
};
let currentPage = "dashboard",
  lastFocus = null,
  confirmCallback = null,
  pendingImport = null;
const modal = $("#modal"),
  content = $("#content");
function toast(message, error = false) {
  const el = document.createElement("div");
  el.className = "toast" + (error ? " error" : "");
  el.textContent = message;
  $("#toasts").append(el);
  setTimeout(() => {
    el.classList.add("leaving");
    setTimeout(() => el.remove(), 260);
  }, 4500);
}
function preferences() {
  const d = getDB();
  document.body.classList.toggle("compact", !!d.profile.compact);
  document.body.classList.toggle("reduce-motion", !!d.profile.reduceMotion);
  $(".brand").textContent = d.profile.company || "VEYRO";
  $(".team-avatars").innerHTML = d.team
    .slice(0, 2)
    .map(
      (u) =>
        `<span>${esc(u.initials || u.name.slice(0, 2).toUpperCase())}</span>`,
    )
    .join("");
}
function render({ animate = true } = {}) {
  preferences();
  const p = pages[currentPage] || pages.dashboard;
  document.title = `${getDB().profile.company} — ${p[0]}`;
  $("#navigation").innerHTML = Object.entries(pages)
    .filter(([key]) => !["settings", "activity"].includes(key))
    .map(
      ([key, [label, ico]]) =>
        `<a href="#${key}" class="nav-item ${key === currentPage ? "active" : ""}" ${key === currentPage ? 'aria-current="page"' : ""}>${icon(ico)}${label}</a>`,
    )
    .join("");
  $(".settings-link").innerHTML = icon("settings") + "Ustawienia";
  $("#header-heading").innerHTML =
    `<h1>${p[2]}${currentPage === "dashboard" ? '<span class="sun" aria-hidden="true">☼</span>' : ""}</h1><p>${p[3]}</p>`;
  $("#today").innerHTML =
    new Date()
      .toLocaleDateString("pl-PL", { weekday: "long" })
      .replace(/^./, (c) => c.toUpperCase()) +
    "<br>" +
    new Date().toLocaleDateString("pl-PL", { day: "numeric", month: "long" });
  $(".header-tools [data-action=search]").innerHTML = icon("search");
  $(".notification-button").innerHTML = icon("bell");
  $(".notification-button").classList.toggle(
    "has-alert",
    reminderItems().length > 0,
  );
  const view = {
    dashboard,
    clients,
    tasks,
    calendar,
    analytics,
    ideas: ideasView,
    settings: settingsView,
    files: filesView,
    activity: activityView,
  };
  content.innerHTML = view[currentPage]();
  content.style.animation = "none";
  void content.offsetWidth;
  content.style.animation = "";
  if (animate) animateNumbers(content);
  $("#save-state").textContent =
    "Zapis lokalny · " +
    new Date().toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
    });
}
function navigate(page) {
  if (!pages[page]) page = "dashboard";
  currentPage = page;
  if (location.hash !== "#" + page) history.pushState(null, "", "#" + page);
  document.body.classList.remove("menu-open");
  render();
  window.scrollTo({ top: 0, behavior: "instant" });
}
function openModal(title, body, footer = "") {
  lastFocus = document.activeElement;
  $("#modal-content").innerHTML =
    `<div class="modal-header"><h2 id="modal-title">${esc(title)}</h2><button class="icon-button" data-action="close-modal" aria-label="Zamknij okno">${icon("close")}</button></div>${body}${footer}`;
  if (!modal.open) modal.showModal();
  setTimeout(() => {
    const field = modal.querySelector(
      "input:not([type=hidden]),textarea,select",
    );
    if (field) field.focus();
  }, 30);
}
function closeModal() {
  modal.close();
  confirmCallback = null;
  pendingImport = null;
  if (lastFocus?.isConnected) lastFocus.focus();
}
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    const rect = modal.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    )
      closeModal();
  }
});
modal.addEventListener("cancel", () => {
  confirmCallback = null;
  pendingImport = null;
});
const field = (
  label,
  name,
  value = "",
  type = "text",
  extra = "",
  full = false,
) =>
  `<label class="field ${full ? "full" : ""}"><span>${label}</span><input type="${type}" name="${name}" value="${esc(value)}" ${extra}></label>`;
const selectField = (label, name, list, value = "", blank = "", full = false) =>
  `<label class="field ${full ? "full" : ""}"><span>${label}</span><select name="${name}" aria-label="${esc(label)}">${options(list, value, blank)}</select></label>`;
const textField = (label, name, value = "", full = true) =>
  `<label class="field ${full ? "full" : ""}"><span>${label}</span><textarea name="${name}" maxlength="10000">${esc(value)}</textarea></label>`;
function formWrap(kind, id, body) {
  return `<form id="entity-form" data-kind="${kind}" data-id="${esc(id || "")}"><div class="modal-body"><div class="form-error" role="alert"></div><div class="form-grid">${body}</div></div><div class="modal-footer">${id ? `<button type="button" class="button danger" data-action="delete-${kind}" data-id="${esc(id)}">${icon("trash")}Usuń</button>` : "<span></span>"}<div><button type="button" class="button" data-action="close-modal">Anuluj</button><button type="submit" class="button primary">Zapisz ${icon("check")}</button></div></div></form>`;
}
function clientForm(id = "") {
  const d = getDB(),
    c = d.clients.find((x) => x.id === id) || {
      ownerId: d.team[0].id,
      status: "found",
      nextContact: dayISO(),
      value: 0,
    };
  const body =
    field(
      "Nazwa klienta *",
      "name",
      c.name,
      "text",
      'required maxlength="120" autocomplete="organization"',
    ) +
    field("Branża", "industry", c.industry, "text", 'maxlength="100"') +
    field(
      "Instagram (bez @)",
      "instagram",
      c.instagram,
      "text",
      'maxlength="100" placeholder="np. bloom.studio"',
    ) +
    selectField("Status kontaktu", "status", statuses, c.status) +
    selectField(
      "Osoba odpowiedzialna",
      "ownerId",
      d.team.map((u) => [u.id, u.name]),
      c.ownerId,
      "Nieprzypisany",
    ) +
    field(
      "Wartość współpracy (zł)",
      "value",
      c.value || 0,
      "number",
      'min="0" max="999999999" step="0.01"',
    ) +
    field("Ostatnia wiadomość", "lastMessage", c.lastMessage, "date") +
    field("Następny kontakt", "nextContact", c.nextContact, "date") +
    textField("Opis", "description", c.description) +
    textField("Notatki", "notes", c.notes);
  openModal(
    id ? "Edytuj klienta" : "Nowa dobra relacja",
    formWrap("client", id, body),
  );
}
function clientDetail(id) {
  const d = getDB(),
    c = d.clients.find((x) => x.id === id);
  if (!c) return;
  openModal(
    c.name,
    `<div class="modal-body"><div style="display:flex;gap:10px;flex-wrap:wrap">${statusBadge(c.status)}${c.archived ? '<span class="badge gray">W archiwum</span>' : ""}<span class="badge gray">${esc(c.industry || "Bez branży")}</span></div><p class="tip-text">Instagram: ${esc(c.instagram ? "@" + c.instagram : "—")} · Opiekun: ${esc(ownerName(d, c.ownerId))}</p><p class="tip-text">Następny kontakt: <strong>${dateLabel(c.nextContact)}</strong> · Wartość: <strong>${money(c.value || 0)}</strong></p><p style="margin-top:19px;white-space:pre-wrap">${esc(c.description || "Nie dodano jeszcze opisu.")}</p>${c.notes ? `<div class="panel" style="margin-top:18px"><h3>Notatki</h3><p style="white-space:pre-wrap;margin-top:7px;font-size:13px">${esc(c.notes)}</p></div>` : ""}<div class="detail-actions"><button class="button lavender" data-action="contact-message" data-id="${esc(id)}">${icon("message")}Zapisz wiadomość</button><button class="button" data-action="contact-reply" data-id="${esc(id)}">${icon("check")}Zapisz odpowiedź</button><button class="button" data-action="client-event" data-id="${esc(id)}">${icon("calendar")}Zaplanuj kontakt</button></div><p class="tip-text">Zapis kontaktu aktualizuje historię i wyniki. Wiadomość wyślij przez swój kanał kontaktu.</p><div class="history"><h3>Historia relacji</h3>${c.history.map((h) => `<div class="history-item">${esc(h.text)}<small>${dateLabel(h.at, { day: "numeric", month: "long", year: "numeric" })} · ${new Date(h.at).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}</small></div>`).join("") || '<p class="muted">Brak historii.</p>'}</div></div>`,
    `<div class="modal-footer"><button class="button" data-action="archive-client" data-id="${esc(id)}">${icon("archive")}${c.archived ? "Przywróć" : "Archiwizuj"}</button><button class="button primary" data-action="edit-client" data-id="${esc(id)}">${icon("edit")}Edytuj dane</button></div>`,
  );
}
function contactForm(id, type) {
  const c = getDB().clients.find((x) => x.id === id);
  if (!c) return;
  openModal(
    type === "message"
      ? "Zapisz wysłaną wiadomość"
      : "Zapisz otrzymaną odpowiedź",
    `<form id="contact-form" data-id="${esc(id)}" data-type="${type}"><div class="modal-body"><p style="margin-bottom:20px">Klient: <strong>${esc(c.name)}</strong></p>${textField("Krótka notatka o kontakcie", "note", "")}<p class="tip-text">Ten zapis trafi do historii klienta i analityki.</p></div><div class="modal-footer"><span></span><button class="button primary" type="submit">Zapisz kontakt</button></div></form>`,
  );
}
function taskForm(id = "", preset = {}) {
  const d = getDB(),
    t = d.tasks.find((x) => x.id === id) || {
      status: "todo",
      priority: "normal",
      due: dayISO(),
      time: "",
      ownerId: d.team[0].id,
      checklist: [],
      ...preset,
    };
  let body =
    field(
      "Nazwa zadania *",
      "title",
      t.title,
      "text",
      'required maxlength="180"',
      true,
    ) +
    selectField("Status", "status", taskStatuses, t.status) +
    selectField("Priorytet", "priority", priorities, t.priority) +
    field("Termin", "due", t.due, "date") +
    field("Godzina", "time", t.time, "time") +
    selectField(
      "Osoba odpowiedzialna",
      "ownerId",
      d.team.map((x) => [x.id, x.name]),
      t.ownerId,
      "Nieprzypisany",
    ) +
    selectField(
      "Powiązany klient",
      "clientId",
      d.clients
        .filter((x) => !x.archived || x.id === t.clientId)
        .map((x) => [x.id, x.name]),
      t.clientId,
      "Bez powiązania",
    ) +
    textField("Opis", "description", t.description) +
    `<div class="field full"><span>Checklista</span><div id="checklist" class="checklist-edit">${(t.checklist || []).map((x) => checklistLine(x)).join("")}</div><button type="button" class="button small" data-action="checklist-add">${icon("plus")}Dodaj punkt</button></div>`;
  openModal(
    id ? "Edytuj zadanie" : "Kolejny mały krok",
    formWrap("task", id, body),
  );
}
function checklistLine(item = {}) {
  return `<div class="checklist-line" data-check-id="${esc(item.id || uid())}"><input type="checkbox" aria-label="Punkt checklisty wykonany" ${item.done ? "checked" : ""}><input type="text" aria-label="Treść punktu checklisty" value="${esc(item.text || "")}" maxlength="200" placeholder="Co trzeba zrobić?"><button type="button" class="icon-button" data-action="checklist-remove" aria-label="Usuń punkt">${icon("close")}</button></div>`;
}
function eventForm(id = "", preset = {}) {
  const d = getDB(),
    e = d.events.find((x) => x.id === id) || {
      date: dayISO(),
      time: "10:00",
      endTime: "11:00",
      type: "meeting",
      reminder: 15,
      ownerId: d.team[0].id,
      ...preset,
    };
  const body =
    field(
      "Nazwa wydarzenia *",
      "title",
      e.title,
      "text",
      'required maxlength="180"',
      true,
    ) +
    field("Data *", "date", e.date, "date", "required") +
    selectField(
      "Rodzaj",
      "type",
      [
        ["meeting", "Spotkanie"],
        ["call", "Rozmowa"],
        ["followup", "Follow-up"],
        ["analysis", "Analiza"],
        ["content", "Publikacja"],
      ],
      e.type,
    ) +
    field("Początek *", "time", e.time, "time", "required") +
    field("Koniec", "endTime", e.endTime, "time") +
    selectField(
      "Powiązany klient",
      "clientId",
      d.clients
        .filter((x) => !x.archived || x.id === e.clientId)
        .map((x) => [x.id, x.name]),
      e.clientId,
      "Bez powiązania",
    ) +
    selectField(
      "Powiązane zadanie",
      "taskId",
      d.tasks.map((x) => [x.id, x.title]),
      e.taskId,
      "Bez powiązania",
    ) +
    selectField(
      "Osoba odpowiedzialna",
      "ownerId",
      d.team.map((x) => [x.id, x.name]),
      e.ownerId,
      "Nieprzypisany",
    ) +
    selectField(
      "Przypomnienie w aplikacji",
      "reminder",
      [
        ["0", "W chwili wydarzenia"],
        ["5", "5 minut wcześniej"],
        ["15", "15 minut wcześniej"],
        ["30", "30 minut wcześniej"],
        ["60", "Godzinę wcześniej"],
        ["-1", "Bez przypomnienia"],
      ],
      e.reminder,
    ) +
    textField("Notatki do wydarzenia", "description", e.description);
  openModal(
    id ? "Edytuj wydarzenie" : "Zaplanuj coś dobrego",
    formWrap("event", id, body),
  );
}
function ideaForm(id = "") {
  const i = getDB().ideas.find((x) => x.id === id) || { priority: "normal" };
  openModal(
    id ? "Edytuj pomysł" : "Zapisz nowy pomysł",
    formWrap(
      "idea",
      id,
      field(
        "Tytuł *",
        "title",
        i.title,
        "text",
        'required maxlength="180"',
        true,
      ) +
        textField("Co masz na myśli?", "description", i.description) +
        selectField("Priorytet", "priority", priorities, i.priority, "", true),
    ),
  );
}
function ideasView() {
  const d = getDB();
  return `<div class="view-toolbar"><span class="muted" style="flex:1">${d.ideas.length} pomysłów czeka na swój moment</span><button class="button primary" data-action="new-idea">${icon("plus")}Nowy pomysł</button></div><div class="idea-grid">${[
    ...d.ideas,
  ]
    .sort(
      (a, b) =>
        priorities.findIndex((x) => x[0] === a.priority) -
        priorities.findIndex((x) => x[0] === b.priority),
    )
    .map(
      (i) =>
        `<article class="idea-card">${priorityBadge(i.priority)}<h3>${esc(i.title)}</h3><p>${esc(i.description)}</p><div class="idea-actions"><button class="button small" data-action="idea-to-task" data-id="${esc(i.id)}">${icon("check")}Zamień w zadanie</button><button class="icon-button" data-action="edit-idea" data-id="${esc(i.id)}" aria-label="Edytuj pomysł ${esc(i.title)}">${icon("edit")}</button></div></article>`,
    )
    .join(
      "",
    )}</div>${!d.ideas.length ? empty("Tutaj zaczyna się coś dobrego", "Zapisz pierwszy pomysł.", "new-idea", "Dodaj pomysł") : ""}`;
}
function settingsView() {
  const d = getDB(),
    p = d.profile;
  return `<div class="settings-layout"><form id="settings-form"><section class="panel settings-panel"><h2>Twoja przestrzeń</h2><div class="form-grid">${field("Twoje imię *", "name", p.name, "text", 'required maxlength="80"') + field("Nazwa firmy *", "company", p.company, "text", 'required maxlength="40"') + field("Adres e-mail", "email", p.email, "email", 'maxlength="180"', true)}</div></section><section class="panel settings-panel"><h2>Mały zespół. Duże możliwości.</h2><div class="form-grid">${d.team.map((u, i) => field("Osoba " + (i + 1) + " *", "team-" + u.id, u.name, "text", 'required maxlength="80"')).join("")}</div><p class="settings-notice">Osoby służą do przypisywania pracy. Dane są lokalne — nie ma tu logowania ani synchronizacji pomiędzy komputerami.</p></section><section class="panel settings-panel" id="goal-settings"><h2>Wasze cele</h2><div class="form-grid">${field("Wiadomości w tygodniu *", "weeklyGoal", p.weeklyGoal, "number", 'required min="1" max="100000" step="1"') + field("Cel przychodu (zł) *", "revenueGoal", p.revenueGoal, "number", 'required min="1" max="999999999" step="1"') + field("Cel pozyskanych klientów *", "clientGoal", p.clientGoal, "number", 'required min="1" max="100000" step="1"')}</div></section><section class="panel settings-panel"><h2>Tak, jak lubisz</h2><div style="display:grid;gap:16px"><label class="check-field"><input type="checkbox" name="compact" ${p.compact ? "checked" : ""}>Bardziej zwarty widok</label><label class="check-field"><input type="checkbox" name="reduceMotion" ${p.reduceMotion ? "checked" : ""}>Ogranicz animacje</label><label class="check-field"><input type="checkbox" name="reminders" ${p.reminders ? "checked" : ""}>Przypomnienia wewnątrz aplikacji</label></div><p class="settings-notice">Ustawienie systemowe ograniczenia animacji jest zawsze respektowane. Przypomnienia działają podczas otwarcia aplikacji.</p></section><button class="button primary" type="submit">${icon("check")}Zapisz ustawienia</button></form><div style="display:grid;gap:20px"><section class="panel settings-panel"><h2>Bezpieczna kopia pod ręką</h2><p class="settings-notice">Dane są przechowywane w tej przeglądarce. Eksportuj kopię, aby przenieść je na inny komputer lub zabezpieczyć przed wyczyszczeniem pamięci.</p><div class="backup-actions"><button class="button" data-action="export">${icon("download")}Eksportuj dane JSON</button><button class="button" data-action="import">${icon("upload")}Importuj kopię JSON</button></div><p class="settings-notice">Import zastępuje bieżące dane po sprawdzeniu pliku i Twoim potwierdzeniu.</p></section><section class="panel settings-panel"><h2>Nowy początek</h2><p class="settings-notice">Przestrzeń startuje z przykładowymi klientami i zadaniami. Usuń je, gdy zechcesz pracować na własnych danych.</p><div class="backup-actions"><button class="button danger" data-action="clear-data">Wyczyść dane aplikacji</button><button class="button" data-action="demo-data">Wczytaj dane przykładowe</button></div></section><section class="panel settings-panel"><h2>Historia zespołu</h2><p class="settings-notice">Zobacz zapisane zmiany, kontakty i wykonane zadania.</p><button class="button" data-page="activity">${icon("activity")}Zobacz aktywności</button></section></div></div>`;
}
function activityView() {
  const d = getDB();
  return `<section class="panel"><div class="panel-heading"><h2>Ostatnie aktywności</h2><span class="muted">${d.activity.length} wpisów</span></div><div class="activity-list" style="max-height:none">${d.activity.map((a) => `<div class="activity-item"><span class="activity-dot"></span><div><p>${esc(a.text)}</p><small>${dateLabel(a.at, { day: "numeric", month: "long", year: "numeric" })} · ${new Date(a.at).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}</small>${a.entityType === "clients" && d.clients.some((c) => c.id === a.entityId) ? `<button class="inline-link" style="font-size:11px;margin-top:5px" data-action="client-detail" data-id="${esc(a.entityId)}">Otwórz klienta</button>` : ""}</div></div>`).join("") || empty("Historia zaczyna się tutaj", "Zapisane działania pojawią się w tym miejscu.")}</div></section>`;
}
function filesView() {
  const d = getDB(),
    files = d.files || [];
  return `<div class="view-toolbar"><span class="muted" style="flex:1">Twoje pliki, zawsze pod ręką</span><button class="button" data-action="export">${icon("download")}Kopia zapasowa</button><button class="button primary" data-action="attach-file">${icon("plus")}Dodaj plik</button></div><section class="panel"><div class="panel-heading"><h2>Biblioteka VEYRO</h2><small>${files.length} plików</small></div><div class="file-list">${files.map((f) => `<div class="file-item">${icon("folder")}<div><strong>${esc(f.name)}</strong><small>${Math.ceil(f.size / 1024)} KB · ${dateLabel(f.createdAt)}</small></div><button class="button small" data-action="download-file" data-id="${esc(f.id)}">${icon("download")}Pobierz</button><button class="icon-button" data-action="delete-file" data-id="${esc(f.id)}" aria-label="Usuń plik ${esc(f.name)}">${icon("trash")}</button></div>`).join("") || empty("Jeszcze pusta teczka", "Dodaj brief, ofertę lub materiały do projektu.", "attach-file", "Wybierz plik")}</div><p class="tip-text">Pliki zapisują się lokalnie wraz z danymi i trafiają do eksportu JSON. Maksymalnie 1 MB na plik i 2 MB łącznie. W przypadku większych materiałów korzystaj z własnego dysku.</p></section>`;
}
function confirm(title, message, callback, label = "Potwierdź") {
  openModal(
    title,
    `<div class="modal-body"><p style="white-space:pre-wrap">${esc(message)}</p></div>`,
    `<div class="modal-footer"><button class="button" data-action="close-modal">Anuluj</button><button class="button primary" data-action="confirm">${esc(label)}</button></div>`,
  );
  confirmCallback = callback;
}
function exportBackup() {
  const blob = new Blob([exportData()], { type: "application/json" });
  downloadBlob(blob, `veyro-kopia-${dayISO()}.json`);
  toast("Kopia zapasowa została pobrana.");
}
function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function chooseImport() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.onchange = async () => {
    try {
      const f = input.files[0];
      if (!f) return;
      if (f.size > 12 * 1024 * 1024)
        throw Error("Plik kopii jest za duży (maks. 12 MB).");
      const raw = JSON.parse(await f.text());
      const { validate } = await import("./storage.js");
      const data = validate(raw);
      confirm(
        "Przywrócić kopię danych?",
        `Sprawdzono plik „${f.name}”.\nKlienci: ${data.clients.length}, zadania: ${data.tasks.length}, wydarzenia: ${data.events.length}, pomysły: ${data.ideas.length}.\n\nBieżące dane zostaną zastąpione. Przed importem możesz anulować i wykonać eksport.`,
        () => {
          importData(data);
          closeModal();
          render();
          toast("Kopia została przywrócona.");
        },
        "Zastąp dane",
      );
    } catch (e) {
      toast(e.message || "Nie udało się odczytać kopii.", true);
    }
  };
  input.click();
}
function chooseFile() {
  const input = document.createElement("input");
  input.type = "file";
  input.onchange = () => {
    const f = input.files[0];
    if (!f) return;
    const size = (getDB().files || []).reduce((a, x) => a + x.size, 0);
    if (f.size > 1024 * 1024 || size + f.size > 2 * 1024 * 1024) {
      toast("Limit: 1 MB na plik i 2 MB w bibliotece.", true);
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => toast("Nie udało się odczytać pliku.", true);
    reader.onload = () => {
      try {
        transact((d) => {
          d.files = d.files || [];
          d.files.push({
            id: uid(),
            name: f.name,
            size: f.size,
            type: f.type,
            data: reader.result,
            createdAt: new Date().toISOString(),
          });
          log(d, "Dodano plik: " + f.name + ".");
        });
        render();
        toast("Plik dodany do biblioteki.");
      } catch (e) {
        toast(e.message, true);
      }
    };
    reader.readAsDataURL(f);
  };
  input.click();
}
function addMenu() {
  openModal(
    "Co chcesz zrobić?",
    `<div class="modal-body dialog-options">${[
      ["new-client", "user", "Nowy klient", "Rozpocznij dobrą relację"],
      ["new-task", "check", "Nowe zadanie", "Zaplanuj kolejny krok"],
      ["new-event", "calendar", "Nowe wydarzenie", "Znajdź czas w kalendarzu"],
      ["new-idea", "idea", "Nowy pomysł", "Zapisz, zanim ucieknie"],
    ]
      .map(
        ([a, i, t, s]) =>
          `<button data-action="${a}">${icon(i)}<span><strong>${t}</strong><small>${s}</small></span>${icon("arrow")}</button>`,
      )
      .join("")}</div>`,
  );
}
function searchModal() {
  openModal(
    "Znajdź w swojej przestrzeni",
    `<div class="modal-body"><label class="search-input" style="display:block">${icon("search")}<input id="global-search" aria-label="Szukaj w aplikacji" placeholder="Klient, zadanie, wydarzenie, pomysł…" autocomplete="off"></label><div id="search-results" class="search-results"><p class="muted">Wpisz przynajmniej 2 znaki.</p></div></div>`,
  );
}
function searchAll(q) {
  if (q.trim().length < 2) {
    $("#search-results").innerHTML =
      '<p class="muted">Wpisz przynajmniej 2 znaki.</p>';
    return;
  }
  const d = getDB(),
    groups = [
      ["clients", "Klient", "client-detail", "user"],
      ["tasks", "Zadanie", "edit-task", "check"],
      ["events", "Wydarzenie", "edit-event", "calendar"],
      ["ideas", "Pomysł", "edit-idea", "idea"],
    ];
  let results = [];
  for (const [collection, label, action, ico] of groups) {
    results.push(
      ...d[collection]
        .filter((x) =>
          [x.name, x.title, x.instagram, x.description, x.notes]
            .join(" ")
            .toLocaleLowerCase("pl")
            .includes(q.toLocaleLowerCase("pl")),
        )
        .map(
          (x) =>
            `<button class="search-result" data-action="${action}" data-id="${esc(x.id)}">${icon(ico)}<strong>${esc(x.name || x.title)}</strong><small>${label}</small></button>`,
        ),
    );
  }
  $("#search-results").innerHTML =
    results.slice(0, 30).join("") ||
    empty("Nic nie znaleziono", "Spróbuj innego hasła.");
}
function reminderItems() {
  const d = getDB(),
    now = new Date(),
    today = dayISO();
  if (!d.profile.reminders) return [];
  return [
    ...d.events
      .filter((e) => {
        const start = new Date(e.date + "T" + e.time);
        return (
          Number(e.reminder) >= 0 &&
          start <= new Date(now.getTime() + Number(e.reminder) * 60000) &&
          start >= new Date(now.getTime() - 60 * 60000)
        );
      })
      .map((e) => ({
        action: "edit-event",
        id: e.id,
        title: e.title,
        desc: dateLabel(e.date) + ", " + e.time,
      })),
    ...d.tasks
      .filter((t) => t.status !== "done" && t.due && t.due <= today)
      .map((t) => ({
        action: "edit-task",
        id: t.id,
        title: t.title,
        desc:
          t.due < today
            ? "Termin minął: " + dateLabel(t.due)
            : "Na dziś" + (t.time ? ", " + t.time : ""),
      })),
    ...d.clients
      .filter(
        (c) =>
          !c.archived &&
          !["lost", "won"].includes(c.status) &&
          c.nextContact &&
          c.nextContact <= today,
      )
      .map((c) => ({
        action: "client-detail",
        id: c.id,
        title: "Kontakt: " + c.name,
        desc: dateLabel(c.nextContact),
      })),
  ];
}
function remindersModal() {
  const items = reminderItems();
  openModal(
    "Warto o tym pamiętać",
    `<div class="modal-body">${!getDB().profile.reminders ? '<p class="tip-text">Przypomnienia są wyłączone. Możesz włączyć je w ustawieniach.</p>' : ""}<div class="dialog-options">${items.map((i) => `<button data-action="${i.action}" data-id="${esc(i.id)}">${icon("bell")}<span><strong>${esc(i.title)}</strong><small>${esc(i.desc)}</small></span>${icon("arrow")}</button>`).join("") || empty("Wszystko pod kontrolą", "Brak bieżących przypomnień.")}</div></div>`,
  );
}
const actions = {
  "close-modal": closeModal,
  "add-menu": addMenu,
  "new-client": () => clientForm(),
  "edit-client": (el) => clientForm(el.dataset.id),
  "client-detail": (el) => clientDetail(el.dataset.id),
  "contact-message": (el) => contactForm(el.dataset.id, "message"),
  "contact-reply": (el) => contactForm(el.dataset.id, "reply"),
  "new-task": () => taskForm(),
  "edit-task": (el) => taskForm(el.dataset.id),
  "new-event": () => eventForm(),
  "edit-event": (el) => eventForm(el.dataset.id),
  "date-event": (el) => eventForm("", { date: el.dataset.date }),
  "client-event": (el) => {
    const c = getDB().clients.find((x) => x.id === el.dataset.id);
    eventForm("", {
      clientId: c.id,
      title: "Kontakt z " + c.name,
      date: c.nextContact || dayISO(),
      type: "followup",
    });
  },
  "plan-post": () =>
    eventForm("", { title: "Publikacja na Instagramie", type: "content" }),
  "new-idea": () => ideaForm(),
  "edit-idea": (el) => ideaForm(el.dataset.id),
  "idea-to-task": (el) => {
    const i = getDB().ideas.find((x) => x.id === el.dataset.id);
    taskForm("", {
      title: i.title,
      description: i.description,
      priority: i.priority,
      sourceIdeaId: i.id,
    });
    $("#entity-form").dataset.ideaId = i.id;
  },
  "filter-clients": (el) => {
    clientView.status = el.dataset.status;
    clientView.archived = false;
    navigate("clients");
  },
  "client-view": (el) => {
    clientView.mode = el.dataset.mode;
    render();
  },
  "task-view": (el) => {
    taskView.mode = el.dataset.mode;
    render();
  },
  "toggle-archive": () => {
    clientView.archived = !clientView.archived;
    render();
  },
  "archive-client": (el) => {
    const c = getDB().clients.find((x) => x.id === el.dataset.id);
    transact((d) => {
      const item = d.clients.find((x) => x.id === c.id);
      item.archived = !item.archived;
      item.history.unshift({
        id: uid(),
        at: new Date().toISOString(),
        text: item.archived
          ? "Zarchiwizowano profil."
          : "Przywrócono z archiwum.",
        type: "archive",
      });
      log(
        d,
        `${item.archived ? "Zarchiwizowano" : "Przywrócono"} klienta: ${item.name}.`,
        "clients",
        item.id,
      );
    });
    if (modal.open) closeModal();
    render();
    toast(
      c.archived ? "Klient przywrócony." : "Klient przeniesiony do archiwum.",
    );
  },
  "checklist-add": () => {
    $("#checklist").insertAdjacentHTML("beforeend", checklistLine());
    $("#checklist .checklist-line:last-child input[type=text]").focus();
  },
  "checklist-remove": (el) => el.closest(".checklist-line").remove(),
  "calendar-prev": () => calendarShift(-1),
  "calendar-next": () => calendarShift(1),
  "calendar-today": () => {
    calendarView.date = new Date();
    render();
  },
  "calendar-mode": (el) => {
    calendarView.mode = el.dataset.mode;
    render();
  },
  "analytics-period": (el) => {
    analyticsView.period = el.dataset.mode;
    analyticsView.offset = 0;
    render();
  },
  "analytics-prev": () => {
    analyticsView.offset--;
    render();
  },
  "analytics-next": () => {
    analyticsView.offset++;
    render();
  },
  "analytics-now": () => {
    analyticsView.offset = 0;
    render();
  },
  "chart-info": (el) => toast(el.dataset.tip),
  export: exportBackup,
  import: chooseImport,
  "attach-file": chooseFile,
  "download-file": async (el) => {
    const f = getDB().files.find((x) => x.id === el.dataset.id);
    const res = await fetch(f.data);
    downloadBlob(await res.blob(), f.name);
  },
  "clear-data": () =>
    confirm(
      "Wyczyścić dane aplikacji?",
      "Wszyscy klienci, zadania, wydarzenia, pomysły, pliki i historia zostaną usunięte. Profil oraz cele zostaną zachowane. Wykonaj wcześniej eksport, jeśli chcesz zachować kopię.",
      () => {
        resetData(false);
        closeModal();
        render();
        toast("Gotowe. Przestrzeń czeka na Twoje dane.");
      },
      "Usuń dane",
    ),
  "demo-data": () =>
    confirm(
      "Wczytać dane przykładowe?",
      "Bieżące dane i ustawienia zostaną zastąpione przykładową przestrzenią VEYRO.",
      () => {
        resetData(true);
        closeModal();
        render();
        toast("Dane przykładowe wczytane.");
      },
      "Wczytaj przykłady",
    ),
  confirm: () => {
    if (confirmCallback) confirmCallback();
  },
  search: searchModal,
  notifications: remindersModal,
  goals: () => {
    navigate("settings");
    $("#goal-settings").scrollIntoView({ block: "center", behavior: "smooth" });
  },
  team: () => navigate("settings"),
  "first-client": () => {
    clientView.status = "offer";
    clientView.archived = false;
    navigate("clients");
    toast("Oto oferty, które możesz zamienić we współpracę.");
  },
  menu: () => document.body.classList.toggle("menu-open"),
  "close-menu": () => document.body.classList.remove("menu-open"),
};
for (const [kind, collection] of [
  ["client", "clients"],
  ["task", "tasks"],
  ["event", "events"],
  ["idea", "ideas"],
  ["file", "files"],
])
  actions["delete-" + kind] = (el) => {
    const item = getDB()[collection].find((x) => x.id === el.dataset.id);
    confirm(
      "Usunąć ten element?",
      `„${item.name || item.title}” zostanie trwale usunięty. Tej operacji nie można cofnąć bez kopii zapasowej.`,
      () => {
        removeEntity(collection, item.id);
        closeModal();
        render();
        toast("Element usunięty.");
      },
      "Usuń",
    );
  };
function calendarShift(n) {
  const d = new Date(calendarView.date);
  if (calendarView.mode === "month") {
    d.setDate(1);
    d.setMonth(d.getMonth() + n);
  } else d.setDate(d.getDate() + n * 7);
  calendarView.date = d;
  render();
}
document.addEventListener("click", async (e) => {
  const el = e.target.closest("[data-action],[data-page]");
  if (!el) return;
  if (el.disabled) return;
  e.preventDefault();
  try {
    if (el.dataset.page) {
      if (modal.open) closeModal();
      navigate(el.dataset.page);
    } else await actions[el.dataset.action]?.(el);
  } catch (err) {
    toast(err.message || "Nie udało się wykonać operacji.", true);
  }
});
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    searchModal();
  }
  if (
    (e.key === "Enter" || e.key === " ") &&
    e.target.matches("[role=button][data-action]")
  ) {
    e.preventDefault();
    e.target.click();
  }
});
let filterTimer;
document.addEventListener("input", (e) => {
  if (e.target.id === "global-search") searchAll(e.target.value);
  if (["client-query", "task-query"].includes(e.target.dataset.filter)) {
    const id = e.target.id,
      pos = e.target.selectionStart,
      value = e.target.value;
    if (e.target.dataset.filter === "client-query") clientView.query = value;
    else taskView.query = value;
    clearTimeout(filterTimer);
    filterTimer = setTimeout(() => {
      render({ animate: false });
      const field = document.getElementById(id);
      field?.focus();
      field?.setSelectionRange(pos, pos);
    }, 160);
  }
});
document.addEventListener("change", (e) => {
  try {
    const f = e.target.dataset.filter;
    if (f && !f.endsWith("query")) {
      const [entity, key] = f.split("-");
      (entity === "client" ? clientView : taskView)[key] = e.target.value;
      render({ animate: false });
    }
    if (e.target.dataset.taskToggle) {
      const t = getDB().tasks.find((x) => x.id === e.target.dataset.taskToggle);
      updateEntity("tasks", {
        ...t,
        status: e.target.checked ? "done" : "todo",
      });
      render({ animate: false });
      toast(
        e.target.checked
          ? "Kolejny krok zrobiony. Brawo!"
          : "Zadanie ponownie otwarte.",
      );
    }
  } catch (err) {
    toast(err.message, true);
    render({ animate: false });
  }
});
document.addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  try {
    if (form.id === "entity-form") {
      const values = Object.fromEntries(new FormData(form)),
        id = form.dataset.id,
        kind = form.dataset.kind,
        collection = {
          client: "clients",
          task: "tasks",
          event: "events",
          idea: "ideas",
        }[kind],
        previous = getDB()[collection].find((x) => x.id === id) || {};
      for (const key of Object.keys(values))
        if (typeof values[key] === "string") values[key] = values[key].trim();
      if (!(values.name || values.title))
        throw Error("Wpisz nazwę — same spacje nie wystarczą.");
      if (kind === "client") {
        values.value = Number(values.value || 0);
        if (!Number.isFinite(values.value) || values.value < 0)
          throw Error("Wpisz poprawną wartość współpracy.");
        values.instagram = values.instagram.replace(/^@/, "");
        values.archived = previous.archived || false;
      }
      if (kind === "task") {
        values.checklist = $$(".checklist-line", form)
          .map((line) => ({
            id: line.dataset.checkId,
            text: $("input[type=text]", line).value.trim(),
            done: $("input[type=checkbox]", line).checked,
          }))
          .filter((x) => x.text);
      }
      if (kind === "event") {
        values.reminder = Number(values.reminder);
        if (values.endTime && values.endTime <= values.time)
          throw Error("Godzina końca musi być późniejsza niż początek.");
      }
      const ideaId = form.dataset.ideaId;
      updateEntity(collection, { ...previous, ...values, id: id || uid() });
      if (ideaId)
        transact((d) => {
          d.ideas = d.ideas.filter((i) => i.id !== ideaId);
          log(d, "Zamieniono pomysł w zadanie.");
        });
      closeModal();
      render();
      toast(
        id ? "Zmiany zostały zapisane." : "Dodano. Kolejny krok przed Tobą.",
      );
    } else if (form.id === "contact-form") {
      recordContact(
        form.dataset.id,
        form.dataset.type,
        new FormData(form).get("note").trim(),
      );
      const id = form.dataset.id;
      render();
      clientDetail(id);
      toast("Kontakt zapisany. Wyniki są aktualne.");
    } else if (form.id === "settings-form") {
      const fd = new FormData(form);
      if (!String(fd.get("name")).trim() || !String(fd.get("company")).trim())
        throw Error("Nazwa i imię nie mogą być puste.");
      transact((d) => {
        for (const key of ["name", "company", "email"])
          d.profile[key] = String(fd.get(key)).trim();
        for (const key of ["weeklyGoal", "revenueGoal", "clientGoal"]) {
          const n = Number(fd.get(key));
          if (!Number.isFinite(n) || n < 1)
            throw Error("Cele muszą być większe od zera.");
          d.profile[key] = n;
        }
        for (const key of ["compact", "reduceMotion", "reminders"])
          d.profile[key] = fd.has(key);
        for (const u of d.team) {
          const name = String(fd.get("team-" + u.id)).trim();
          if (!name) throw Error("Wpisz imiona członków zespołu.");
          u.name = name;
          u.initials = name
            .split(/\s+/)
            .map((x) => x[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
        }
        log(d, "Zaktualizowano profil, cele i preferencje.");
      });
      render();
      toast("Ustawienia zapisane.");
    }
  } catch (err) {
    const error = $(".form-error", form);
    if (error) {
      error.textContent = err.message;
      error.classList.add("visible");
      error.scrollIntoView({ block: "nearest" });
    } else toast(err.message, true);
  }
});
let dragging = null;
document.addEventListener("dragstart", (e) => {
  const card = e.target.closest("[data-drag]");
  if (!card) return;
  dragging = { collection: card.dataset.drag, id: card.dataset.id };
  e.dataTransfer.setData("text/plain", card.dataset.id);
  e.dataTransfer.effectAllowed = "move";
});
document.addEventListener("dragover", (e) => {
  const col = e.target.closest("[data-drop]");
  if (col && dragging?.collection === col.dataset.drop) {
    e.preventDefault();
    col.classList.add("drag-over");
    e.dataTransfer.dropEffect = "move";
  }
});
document.addEventListener("dragleave", (e) => {
  const col = e.target.closest("[data-drop]");
  if (col && !col.contains(e.relatedTarget)) col.classList.remove("drag-over");
});
document.addEventListener("dragend", () => {
  dragging = null;
  $$(".drag-over").forEach((x) => x.classList.remove("drag-over"));
});
document.addEventListener("drop", (e) => {
  const col = e.target.closest("[data-drop]");
  if (!col || !dragging || col.dataset.drop !== dragging.collection) return;
  e.preventDefault();
  try {
    const item = getDB()[dragging.collection].find((x) => x.id === dragging.id);
    if (item.status !== col.dataset.status) {
      updateEntity(dragging.collection, {
        ...item,
        status: col.dataset.status,
      });
      render();
      toast("Status zaktualizowany.");
    }
  } catch (err) {
    toast(err.message, true);
  }
  dragging = null;
  $$(".drag-over").forEach((x) => x.classList.remove("drag-over"));
});
window.addEventListener("popstate", () => navigate(location.hash.slice(1)));
window.addEventListener("hashchange", () => {
  if (location.hash.slice(1) !== currentPage) navigate(location.hash.slice(1));
});
window.addEventListener("storage", (e) => {
  if (e.key === "veyro.dashboard.v1")
    toast(
      "Dane zmieniono w innej karcie. Odśwież stronę przed dalszą edycją.",
      true,
    );
});
const reminded = new Set();
function checkReminders() {
  if (!getDB().profile.reminders) return;
  const now = new Date();
  for (const event of getDB().events) {
    const start = new Date(event.date + "T" + event.time),
      key = event.id + event.date + event.time;
    if (
      Number(event.reminder) >= 0 &&
      now >= new Date(start - Number(event.reminder) * 60000) &&
      now <= new Date(start.getTime() + 60000) &&
      !reminded.has(key)
    ) {
      reminded.add(key);
      toast(`Przypomnienie: ${event.title} o ${event.time}`);
    }
  }
  $(".notification-button").classList.toggle(
    "has-alert",
    reminderItems().length > 0,
  );
}
setInterval(checkReminders, 30000);
navigate(location.hash.slice(1));
checkReminders();
if (storageWarning()) toast(storageWarning(), true);

// Skrót do treści nie zmienia aktywnej sekcji aplikacji.
$(".skip-link").addEventListener("click", (event) => {
  event.preventDefault();
  content.focus();
  content.scrollIntoView({ block: "start" });
});
