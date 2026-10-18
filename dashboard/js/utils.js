export const $ = (s, p = document) => p.querySelector(s);
export const $$ = (s, p = document) => [...p.querySelectorAll(s)];
export const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const uid = () =>
  globalThis.crypto?.randomUUID?.() ||
  Date.now().toString(36) + Math.random().toString(36).slice(2);
export function dayISO(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function shiftedDay(n = 0) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return dayISO(d);
}
export function dateLabel(value, options = { day: "numeric", month: "short" }) {
  if (!value) return "Bez terminu";
  const d = new Date(value.length === 10 ? value + "T12:00" : value);
  return isNaN(d) ? "—" : d.toLocaleDateString("pl-PL", options);
}
export function relativeDay(value) {
  if (!value) return "Brak wiadomości";
  const n = Math.floor(
    (new Date(dayISO() + "T12:00") - new Date(value.slice(0, 10) + "T12:00")) /
      86400000,
  );
  return n === 0
    ? "Ostatnia wiadomość dzisiaj"
    : n === 1
      ? "Ostatnia wiadomość 1 dzień temu"
      : `Ostatnia wiadomość ${n} dni temu`;
}
export const money = (n) =>
  new Intl.NumberFormat("pl-PL", {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n) + " zł";
export const statuses = [
  ["found", "Znaleziony"],
  ["sent", "Kontakt wysłany"],
  ["conversation", "Rozmowa"],
  ["offer", "Oferta"],
  ["won", "Pozyskany"],
  ["lost", "Utracony"],
];
export const taskStatuses = [
  ["todo", "Do zrobienia"],
  ["doing", "W trakcie"],
  ["done", "Wykonane"],
];
export const priorities = [
  ["high", "Wysoki"],
  ["normal", "Normalny"],
  ["low", "Niski"],
];
export const statusName = (s) => statuses.find((x) => x[0] === s)?.[1] || s;
export const taskStatusName = (s) =>
  taskStatuses.find((x) => x[0] === s)?.[1] || s;
export const priorityName = (s) => priorities.find((x) => x[0] === s)?.[1] || s;
export const ownerName = (db, id) =>
  db.team.find((x) => x.id === id)?.name || "Nieprzypisany";
export function badge(text, color = "gray") {
  return `<span class="badge ${color}">${esc(text)}</span>`;
}
export function statusBadge(s) {
  return badge(
    statusName(s),
    {
      found: "gray",
      sent: "yellow",
      conversation: "purple",
      offer: "yellow",
      won: "green",
      lost: "red",
    }[s],
  );
}
export function priorityBadge(p) {
  return badge(
    priorityName(p),
    p === "high" ? "red" : p === "low" ? "green" : "gray",
  );
}
export const paths = {
  home: "m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z",
  users:
    "M20 21v-2a6 6 0 0 0-12 0v2M14 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M3 21v-2a6 6 0 0 1 3-5M5 3a4 4 0 0 0 0 8",
  user: "M20 21v-2a8 8 0 0 0-16 0v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  check:
    "M9 11l3 3 5-6M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2",
  calendar:
    "M3 8h18M7 2v5M17 2v5M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2",
  chart: "M5 20v-7M12 20V4M19 20v-11",
  idea: "M9 18h6M10 22h4M8 14a7 7 0 1 1 8 0c-1 1-1 2-1 4H9c0-2 0-3-1-4",
  folder: "M3 6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11H3z",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z",
  search: "M21 21l-5-5M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16",
  bell: "M18 8a6 6 0 0 0-12 0c0 8-3 8-3 9h18c0-1-3-1-3-9M10 21h4",
  arrow: "M5 12h14M13 6l6 6-6 6",
  chevron: "m9 5 7 7-7 7",
  plus: "M12 4v16M4 12h16",
  close: "m6 6 12 12M6 18 18 6",
  flag: "M5 21V3c5-3 9 3 14 0v10c-5 3-9-3-14 0",
  phone:
    "M5 3l4 4-2 3a15 15 0 0 0 7 7l3-2 4 4c-1 3-3 4-6 3A24 24 0 0 1 2 9C1 6 2 4 5 3",
  message: "M4 3h16v14H8l-5 4V4zM7 7h10M7 11h7",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  upload: "M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5",
  edit: "m14 5 5 5M3 21l5-1L21 7l-5-5L3 15z",
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7",
  archive: "M3 3h18v5H3zM5 8v13h14V8M10 12h4",
  activity: "m2 12 5 0 3-8 4 16 3-8h5",
  copy: "M8 8h13v13H8zM16 8V3H3v13h5",
};
export const icon = (name, extra = "") =>
  `<svg class="icon ${extra}" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.arrow}"/></svg>`;
export const empty = (title, desc, action = "", label = "Dodaj") =>
  `<div class="empty-state">${icon("folder")}<strong>${esc(title)}</strong><p>${esc(desc)}</p>${action ? `<button class="button" data-action="${action}">${icon("plus")}${esc(label)}</button>` : ""}</div>`;
export function options(list, value, blank = "") {
  return (
    (blank ? `<option value="">${esc(blank)}</option>` : "") +
    list
      .map(
        ([id, name]) =>
          `<option value="${esc(id)}" ${String(value) === String(id) ? "selected" : ""}>${esc(name)}</option>`,
      )
      .join("")
  );
}
export function animateNumbers(root = document) {
  const reduced =
    matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.body.classList.contains("reduce-motion");
  root.querySelectorAll("[data-count]").forEach((el) => {
    const end = Number(el.dataset.count),
      currency = el.dataset.currency === "true",
      pad = el.dataset.pad === "true";
    const fmt = (n) =>
      currency ? money(n) : String(n).padStart(pad ? 2 : 1, "0");
    if (reduced) {
      el.textContent = fmt(end);
      return;
    }
    const start = performance.now();
    function step(now) {
      const t = Math.min((now - start) / 1050, 1),
        e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      el.textContent = fmt(t === 1 ? end : Math.round(end * e));
      if (t < 1 && el.isConnected) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}
