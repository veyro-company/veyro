import { getDB } from "./storage.js";
import {
  esc,
  icon,
  taskStatuses,
  options,
  empty,
  priorityBadge,
  ownerName,
  dateLabel,
  dayISO,
} from "./utils.js";
export const taskView = { query: "", status: "", owner: "", mode: "list" };
export function tasks() {
  const d = getDB(),
    v = taskView;
  const list = d.tasks
    .filter(
      (t) =>
        (!v.query ||
          t.title
            .toLocaleLowerCase("pl")
            .includes(v.query.toLocaleLowerCase("pl"))) &&
        (!v.status || t.status === v.status) &&
        (!v.owner || t.ownerId === v.owner),
    )
    .sort(
      (a, b) =>
        (a.due || "9999").localeCompare(b.due || "9999") ||
        (a.time || "").localeCompare(b.time || ""),
    );
  return `<div class="view-toolbar"><label class="search-input">${icon("search")}<input id="task-search" data-filter="task-query" placeholder="Znajdź zadanie…" aria-label="Szukaj zadań" value="${esc(v.query)}"></label><select data-filter="task-status" aria-label="Status zadania">${options(taskStatuses, v.status, "Wszystkie statusy")}</select><select data-filter="task-owner" aria-label="Osoba odpowiedzialna">${options(
    d.team.map((u) => [u.id, u.name]),
    v.owner,
    "Cały zespół",
  )}</select><div class="segmented"><button data-action="task-view" data-mode="list" class="${v.mode === "list" ? "active" : ""}">Lista</button><button data-action="task-view" data-mode="kanban" class="${v.mode === "kanban" ? "active" : ""}">Kanban</button></div><button class="button primary" data-action="new-task">${icon("plus")}Nowe zadanie</button></div><div class="section-summary"><span>${list.filter((t) => t.status !== "done").length} do wykonania · ${list.filter((t) => t.status === "done").length} zakończonych</span><span>Każdy mały krok się liczy.</span></div>${
    v.mode === "list"
      ? `<div class="task-list">${list.map((t) => `<div class="task-row ${t.status === "done" ? "done" : ""}"><input type="checkbox" data-task-toggle="${esc(t.id)}" aria-label="Wykonane: ${esc(t.title)}" ${t.status === "done" ? "checked" : ""}><button class="task-name" data-action="edit-task" data-id="${esc(t.id)}">${esc(t.title)}${t.checklist.length ? `<span class="checklist-caption"> · ${t.checklist.filter((x) => x.done).length}/${t.checklist.length}</span>` : ""}</button><span class="task-meta">${esc(ownerName(d, t.ownerId))}</span>${priorityBadge(t.priority)}<time class="${t.due && t.due < dayISO() && t.status !== "done" ? "date-overdue" : ""}">${dateLabel(t.due)} ${esc(t.time)}</time><button class="icon-button" data-action="edit-task" data-id="${esc(t.id)}" aria-label="Edytuj zadanie">${icon("edit")}</button></div>`).join("") || empty("Czysta lista, nowe możliwości", "Dodaj pierwsze zadanie dla swojego zespołu.", "new-task", "Dodaj zadanie")}</div>`
      : `<div class="kanban">${taskStatuses
          .map(
            ([id, label]) =>
              `<section class="kanban-column" data-drop="tasks" data-status="${id}"><div class="kanban-title">${label}<span>${list.filter((t) => t.status === id).length}</span></div>${list
                .filter((t) => t.status === id)
                .map(
                  (t) =>
                    `<button class="kanban-card" draggable="true" data-drag="tasks" data-action="edit-task" data-id="${esc(t.id)}">${priorityBadge(t.priority)}<h3>${esc(t.title)}</h3><p>${esc(t.description || "Bez opisu")}</p>${t.checklist.length ? `<p>Checklista: ${t.checklist.filter((x) => x.done).length}/${t.checklist.length}</p>` : ""}<div class="card-bottom"><span>${esc(ownerName(d, t.ownerId))}</span><span>${dateLabel(t.due)}</span></div></button>`,
                )
                .join("")}</section>`,
          )
          .join(
            "",
          )}</div><p class="tip-text">Przeciągaj zadania między kolumnami lub zmieniaj status w formularzu edycji.</p>`
  }`;
}
