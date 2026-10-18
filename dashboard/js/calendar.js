import { getDB, weekStart } from "./storage.js";
import { esc, dayISO, dateLabel, icon } from "./utils.js";
export const calendarView = { date: new Date(), mode: "month" };
export function calendar() {
  const d = getDB(),
    v = calendarView,
    date = new Date(v.date);
  let start, end;
  if (v.mode === "month") {
    start = weekStart(new Date(date.getFullYear(), date.getMonth(), 1));
    const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    end = new Date(start);
    end.setDate(
      start.getDate() +
        Math.ceil(
          (last.getDate() +
            ((new Date(date.getFullYear(), date.getMonth(), 1).getDay() + 6) %
              7)) /
            7,
        ) *
          7,
    );
  } else {
    start = weekStart(date);
    end = new Date(start);
    end.setDate(start.getDate() + 7);
  }
  let cells = "";
  for (
    let cursor = new Date(start);
    cursor < end;
    cursor.setDate(cursor.getDate() + 1)
  ) {
    const day = dayISO(cursor),
      events = d.events
        .filter((e) => e.date === day)
        .sort((a, b) => a.time.localeCompare(b.time)),
      tasks = d.tasks.filter((t) => t.due === day && t.status !== "done");
    cells += `<div class="calendar-cell ${day === dayISO() ? "today" : ""} ${cursor.getMonth() !== date.getMonth() ? "outside" : ""}" data-action="date-event" data-date="${day}" tabindex="0" role="button" aria-label="Dodaj wydarzenie ${dateLabel(day, { day: "numeric", month: "long" })}"><span class="calendar-day">${cursor.getDate()}</span>${events.map((e) => `<button class="calendar-event" data-action="edit-event" data-id="${esc(e.id)}" title="${esc(e.time + " " + e.title)}"><span class="event-time">${esc(e.time)} </span>${esc(e.title)}</button>`).join("")}${tasks.map((t) => `<button class="calendar-event task-event" data-action="edit-task" data-id="${esc(t.id)}" title="Zadanie: ${esc(t.title)}">✓ ${esc(t.title)}</button>`).join("")}</div>`;
  }
  return `<div class="calendar-toolbar"><h2>${v.mode === "month" ? date.toLocaleDateString("pl-PL", { month: "long", year: "numeric" }) : dateLabel(dayISO(start)) + " – " + dateLabel(dayISO(new Date(end.getTime() - 86400000)))}</h2><button class="icon-button" data-action="calendar-prev" aria-label="Poprzedni okres">‹</button><button class="icon-button" data-action="calendar-next" aria-label="Następny okres">›</button><button class="button small" data-action="calendar-today">Dzisiaj</button><div class="segmented"><button class="${v.mode === "month" ? "active" : ""}" data-action="calendar-mode" data-mode="month">Miesiąc</button><button class="${v.mode === "week" ? "active" : ""}" data-action="calendar-mode" data-mode="week">Tydzień</button></div><button class="button primary" data-action="new-event">${icon("plus")}Wydarzenie</button></div><div class="calendar ${v.mode === "week" ? "calendar-week" : ""}"><div class="calendar-head">${["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"].map((x) => `<span>${x}</span>`).join("")}</div><div class="calendar-grid">${cells}</div></div><p class="tip-text">Kliknij dzień, aby dodać wydarzenie. Lawenda oznacza wydarzenia, limonka — otwarte zadania.</p>`;
}
