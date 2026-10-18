import { getDB } from "./storage.js";
import {
  esc,
  icon,
  statuses,
  statusBadge,
  ownerName,
  dateLabel,
  dayISO,
  options,
  empty,
} from "./utils.js";
export const clientView = {
  query: "",
  status: "",
  owner: "",
  sort: "nextContact",
  mode: "table",
  archived: false,
};
export function clients() {
  const d = getDB(),
    v = clientView;
  const list = d.clients
    .filter(
      (c) =>
        !!c.archived === v.archived &&
        (!v.status || c.status === v.status) &&
        (!v.owner || c.ownerId === v.owner) &&
        (!v.query ||
          [c.name, c.industry, c.instagram, c.notes]
            .join(" ")
            .toLocaleLowerCase("pl")
            .includes(v.query.toLocaleLowerCase("pl"))),
    )
    .sort((a, b) =>
      v.sort === "name"
        ? a.name.localeCompare(b.name, "pl")
        : v.sort === "value"
          ? Number(b.value) - Number(a.value)
          : (a[v.sort] || "9999").localeCompare(b[v.sort] || "9999"),
    );
  return `<div class="view-toolbar"><label class="search-input">${icon("search")}<input id="client-search" data-filter="client-query" aria-label="Szukaj klientów" placeholder="Szukaj nazwy, branży, Instagrama…" value="${esc(v.query)}"></label><select data-filter="client-status" aria-label="Status klienta">${options(statuses, v.status, "Wszystkie statusy")}</select><select data-filter="client-owner" aria-label="Osoba odpowiedzialna">${options(
    d.team.map((x) => [x.id, x.name]),
    v.owner,
    "Cały zespół",
  )}</select><select data-filter="client-sort" aria-label="Sortowanie klientów">${options(
    [
      ["nextContact", "Najbliższy kontakt"],
      ["name", "Nazwa A–Z"],
      ["value", "Wartość malejąco"],
      ["lastMessage", "Ostatnia wiadomość"],
    ],
    v.sort,
  )}</select><div class="segmented" aria-label="Widok klientów"><button data-action="client-view" data-mode="table" class="${v.mode === "table" ? "active" : ""}">Tabela</button><button data-action="client-view" data-mode="kanban" class="${v.mode === "kanban" ? "active" : ""}">Kanban</button></div><button class="button primary" data-action="new-client">${icon("plus")}Nowy klient</button></div>
 <div class="section-summary"><span>${list.length} ${v.archived ? "w archiwum" : "klientów w Twojej przestrzeni"}</span><button class="inline-link" data-action="toggle-archive">${v.archived ? "Pokaż aktywnych" : "Pokaż archiwum"}</button></div>
 ${
   v.mode === "table"
     ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Klient / Instagram</th><th>Branża</th><th>Status</th><th>Opiekun</th><th>Następny kontakt</th><th>Wartość</th><th><span class="muted">Akcje</span></th></tr></thead><tbody>${list.map((c) => `<tr data-action="client-detail" data-id="${esc(c.id)}" tabindex="0" role="button" aria-label="Otwórz klienta ${esc(c.name)}"><td><div class="table-client"><span class="client-logo">${esc(c.name.slice(0, 1))}</span><div><strong>${esc(c.name)}</strong><small>@${esc(c.instagram || "—")}</small></div></div></td><td>${esc(c.industry || "—")}</td><td>${statusBadge(c.status)}</td><td>${esc(ownerName(d, c.ownerId))}</td><td class="${c.nextContact && c.nextContact < dayISO() ? "date-overdue" : ""}">${dateLabel(c.nextContact)}</td><td>${Number(c.value || 0).toLocaleString("pl-PL")} zł</td><td><div class="row-actions"><button data-action="edit-client" data-id="${esc(c.id)}" aria-label="Edytuj ${esc(c.name)}">${icon("edit")}</button><button data-action="archive-client" data-id="${esc(c.id)}" aria-label="${v.archived ? "Przywróć" : "Archiwizuj"} ${esc(c.name)}">${icon("archive")}</button></div></td></tr>`).join("")}</tbody></table>${!list.length ? empty("Brak klientów w tym widoku", "Zmień filtry lub dodaj pierwszy profil.", "new-client", "Dodaj klienta") : ""}</div>`
     : `<div class="kanban" aria-label="Lejek klientów">${statuses
         .map(
           ([id, label]) =>
             `<section class="kanban-column" data-drop="clients" data-status="${id}"><div class="kanban-title">${label}<span>${list.filter((c) => c.status === id).length}</span></div>${list
               .filter((c) => c.status === id)
               .map(
                 (c) =>
                   `<button class="kanban-card" draggable="true" data-drag="clients" data-id="${esc(c.id)}" data-action="client-detail"><span class="client-logo">${esc(c.name[0])}</span><h3>${esc(c.name)}</h3><p>@${esc(c.instagram)} · ${esc(c.industry)}</p><div class="card-bottom"><span>${esc(ownerName(d, c.ownerId))}</span><span>${dateLabel(c.nextContact)}</span></div></button>`,
               )
               .join("")}</section>`,
         )
         .join(
           "",
         )}</div><p class="tip-text">Przeciągnij kartę do kolumny, aby zmienić status. Możesz też zmienić status w edycji klienta.</p>`
 }`;
}
