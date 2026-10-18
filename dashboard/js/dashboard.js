import { getDB, stats } from "./storage.js";
import {
  esc,
  icon,
  dayISO,
  dateLabel,
  relativeDay,
  badge,
  empty,
  money,
} from "./utils.js";
const title = (name, page, extra = "") =>
  `<div class="panel-heading"><button class="title-link" data-page="${page}"><h2>${name}</h2>${icon("arrow")}</button>${extra}</div>`;
export function taskRow(t, full = false) {
  return `<div class="task-row ${t.status === "done" ? "done" : ""}"><input type="checkbox" aria-label="Wykonane: ${esc(t.title)}" data-task-toggle="${esc(t.id)}" ${t.status === "done" ? "checked" : ""}><button class="task-name" data-action="edit-task" data-id="${esc(t.id)}">${esc(t.title)}</button>${full ? badge({ high: "Wysoki", normal: "Normalny", low: "Niski" }[t.priority], t.priority === "high" ? "red" : "gray") : ""}<time>${full ? dateLabel(t.due) : esc(t.time || "")}</time></div>`;
}
export function eventTile(e) {
  return `<button class="event-tile" data-action="edit-event" data-id="${esc(e.id)}"><span class="event-icon">${icon({ call: "phone", followup: "message", analysis: "chart", content: "calendar", meeting: "users" }[e.type] || "calendar")}</span><span><small>${e.date === dayISO() ? "Dziś" : dateLabel(e.date)}, ${esc(e.time)}</small><strong>${esc(e.title)}</strong></span></button>`;
}
export function dashboard() {
  const d = getDB(),
    s = stats(),
    pct = Math.min(100, Math.round((s.contacts / s.goal) * 100));
  const attention = d.clients
    .filter((c) => !c.archived && !["won", "lost", "found"].includes(c.status))
    .sort((a, b) =>
      (a.nextContact || "9999").localeCompare(b.nextContact || "9999"),
    )
    .slice(0, 5);
  const tasks = d.tasks
    .filter((t) => t.due === dayISO())
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  const upcoming = d.events
    .filter((e) => e.date >= dayISO())
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 4);
  const awaiting = d.clients.filter(
    (c) => !c.archived && c.status === "sent",
  ).length;
  return `<section class="stats-grid" aria-label="Statystyki firmy">
 <button class="stat-card conversations" data-action="filter-clients" data-status="conversation"><h2>Aktywne rozmowy ${icon("arrow")}</h2><strong class="big-number" data-count="${s.conversation}" data-pad="true">${String(s.conversation).padStart(2, "0")}</strong><div class="conversation-aside"><div class="avatar-stack">${d.team
   .slice(0, 2)
   .map(
     (u) =>
       `<span class="mini-avatar">${esc(u.initials || u.name.slice(0, 2))}</span>`,
   )
   .join(
     "",
   )}<span class="mini-avatar">+${Math.max(0, s.conversation - 2)}</span></div><span>${awaiting} czekają na odpowiedź</span></div></button>
 <button class="stat-card leads" data-action="filter-clients" data-status="found"><h2>Potencjalni klienci ${icon("arrow")}</h2><strong class="big-number" data-count="${s.found}">${s.found}</strong><span class="subtext">+${d.clients.filter((c) => !c.archived && c.status === "found" && new Date(c.createdAt) >= new Date(new Date().setDate(new Date().getDate() - 7))).length} &nbsp;w tym tygodniu</span><span class="bars-decoration"><i></i><i></i><i></i></span></button>
 <button class="stat-card revenue" data-page="analytics"><h2>Przychód ${icon("arrow")}</h2><strong class="big-number ${s.revenue >= 1000000 ? "long-number" : s.revenue >= 1000 ? "compact-number" : ""}" data-count="${s.revenue}" data-currency="true">${money(s.revenue)}</strong><span class="subtext">${icon("flag")} &nbsp; ${s.won ? "Pozyskani klienci: " + s.won : "Cel: pierwszy klient"}</span><svg class="revenue-line" viewBox="0 0 90 125" aria-hidden="true"><path d="M4 120C20 55 26 50 39 72S58 71 87 6"/></svg></button>
 <button class="stat-card goal" data-action="goals"><h2>Cel tygodnia</h2><div class="goal-ring" style="--progress:${pct / 100}"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40"/><circle class="progress" cx="50" cy="50" r="40"/></svg><strong>${pct}%</strong></div><strong class="goal-summary">${s.contacts} / ${s.goal}</strong><span class="goal-caption">kontaktów wykonanych</span></button>
 </section>
 <div class="dashboard-middle"><section class="panel funnel-panel">${title("Lejek sprzedażowy", "clients")}<div class="funnel">${[
   ["found", "Znalezione<br>profile", s.found, "#dcf98b"],
   ["sent", "Wysłane<br>wiadomości", s.sent, "#bfb0f5"],
   ["conversation", "Rozmowy", s.conversation, "#ff9d78"],
   ["offer", "Oferty", s.offer, "#ffd098"],
   ["won", "Klienci", s.won, "#b9d380"],
 ]
   .map(
     ([status, label, n, color]) =>
       `<button class="funnel-stage" data-action="filter-clients" data-status="${status}"><div class="funnel-label">${label}</div><div class="funnel-count" data-count="${n}">${n}</div><div class="progress-track"><span class="progress-fill" style="--width:${(n / Math.max(1, s.found, s.sent, s.conversation, s.offer, s.won)) * 100}%;background:${color}"></span></div></button>`,
   )
   .join("")}</div></section>
 <section class="panel quick-panel">${title("Szybkie akcje", "ideas").replace('data-page="ideas"', 'data-action="add-menu"')}<div class="quick-grid"><button data-action="new-client">${icon("user")}Dodaj klienta</button><button data-action="new-task">${icon("check")}Dodaj zadanie</button><button data-action="new-idea">${icon("idea")}Nowy pomysł</button><button data-action="plan-post">${icon("calendar")}Zaplanuj post</button></div></section></div>
 <div class="dashboard-lower"><section class="panel attention-panel">${title("Klienci wymagający uwagi", "clients", '<button class="button small" data-page="clients">Zobacz wszystkich</button>')}${
   attention
     .map((c) => {
       let text =
           c.status === "sent"
             ? "Brak odpowiedzi"
             : c.status === "offer"
               ? "Czeka na ofertę"
               : "Rozmowa trwa",
         color =
           c.status === "sent"
             ? "red"
             : c.status === "offer"
               ? "gray"
               : "purple";
       if (c.nextContact && c.nextContact < dayISO()) {
         text = "Do follow-upu";
         color = "yellow";
       }
       return `<button class="client-row" data-action="client-detail" data-id="${esc(c.id)}"><span class="client-logo">${esc(
         c.name
           .split(" ")
           .map((x) => x[0])
           .slice(0, 2)
           .join(""),
       )}</span><span class="client-details"><strong>@${esc(c.instagram || c.name)}</strong><small>${relativeDay(c.lastMessage)}</small></span>${badge(text, color)}${icon("chevron")}</button>`;
     })
     .join("") ||
   empty(
     "Wszystko pod kontrolą",
     "Dodaj klientów, żeby rozwijać relacje.",
     "new-client",
     "Dodaj klienta",
   )
 }</section>
 <section class="panel tasks-panel">${title("Zadania na dziś", "tasks", `<span class="count-pill">${tasks.length}</span>`)}${
   tasks
     .slice(0, 4)
     .map((t) => taskRow(t))
     .join("") || empty("Spokojny dzień", "Brak zadań na dziś.")
 }<button class="button task-add" data-action="new-task">${icon("plus")}Dodaj zadanie</button></section>
 <aside class="quote-card"><h2>Warto<br>pamiętać.</h2><blockquote>„Małe kroki<br>też prowadzą<br>do dużych<br>wyników.”</blockquote><svg class="plant" viewBox="0 0 150 310" aria-hidden="true"><g fill="currentColor"><path d="M155 8C77 18 22 46 0 84c47-37 94-55 155-69M155 20C82 36 34 77 20 123c35-55 81-83 135-97M156 38C106 62 73 105 67 154c23-54 50-89 89-109M157 60c-24 27-37 55-32 102 10-49 22-69 36-91M151 187C79 190 35 219 7 252c42-27 85-43 144-58M154 202c-54 17-94 52-113 99 33-39 64-65 116-89M156 223c-29 23-41 48-40 84 13-33 25-56 42-72"/><path d="M150 8C141 93 152 168 145 310" fill="none" stroke="currentColor" stroke-width="3"/></g></svg></aside></div>
 <section class="panel events-panel">${title("Nadchodzące wydarzenia", "calendar")}<div class="events-grid">${upcoming.map(eventTile).join("") || empty("Przestrzeń na nowe plany", "Zaplanuj następny krok.", "new-event", "Dodaj wydarzenie")}</div></section><section class="panel" style="margin-top:16px">${title("Ostatnie aktywności", "activity", '<button class="button small" data-page="activity">Pełna historia</button>')}<div class="activity-list">${
   d.activity
     .slice(0, 3)
     .map(
       (a) =>
         `<div class="activity-item"><span class="activity-dot"></span><div><p>${esc(a.text)}</p><small>${dateLabel(a.at, { day: "numeric", month: "long" })}</small></div></div>`,
     )
     .join("") ||
   empty("Tu pojawi się Wasza historia", "Dodaj pierwszy kontakt lub zadanie.")
 }</div></section>`;
}
