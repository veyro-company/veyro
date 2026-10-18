import { getDB, stats, weekStart } from "./storage.js";
import { esc, dayISO, dateLabel, money, options, icon } from "./utils.js";
export const analyticsView = { period: "week", offset: 0 };
export function analytics() {
  const d = getDB(),
    s = stats(),
    v = analyticsView,
    now = new Date();
  let start,
    end,
    bins = [];
  if (v.period === "week") {
    start = weekStart(now);
    start.setDate(start.getDate() + v.offset * 7);
    end = new Date(start);
    end.setDate(end.getDate() + 7);
    for (let i = 0; i < 7; i++) {
      const from = new Date(start);
      from.setDate(from.getDate() + i);
      const to = new Date(from);
      to.setDate(to.getDate() + 1);
      bins.push({
        from,
        to,
        label: ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"][i],
      });
    }
  } else {
    start = new Date(now.getFullYear(), now.getMonth() + v.offset, 1);
    end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    for (let i = 0; i < 7; i++) {
      const from = new Date(start);
      from.setDate(1 + i * 5);
      if (from >= end) break;
      const to = new Date(from);
      to.setDate(to.getDate() + 5);
      if (to > end) to.setTime(end.getTime());
      bins.push({
        from,
        to,
        label: `${from.getDate()}–${new Date(to - 1).getDate()}`,
      });
    }
  }
  const logs = d.contactLog.filter(
      (l) => new Date(l.at) >= start && new Date(l.at) < end,
    ),
    sent = logs.filter((l) => l.type === "message").length,
    replies = logs.filter((l) => l.type === "reply").length,
    won = d.clients.filter(
      (c) =>
        !c.archived &&
        c.status === "won" &&
        new Date(c.wonAt) >= start &&
        new Date(c.wonAt) < end,
    ),
    revenue = won.reduce((a, c) => a + Number(c.value || 0), 0);
  bins = bins.map((b) => ({
    ...b,
    messages: logs.filter(
      (l) =>
        l.type === "message" &&
        new Date(l.at) >= b.from &&
        new Date(l.at) < b.to,
    ).length,
    replies: logs.filter(
      (l) =>
        l.type === "reply" && new Date(l.at) >= b.from && new Date(l.at) < b.to,
    ).length,
    revenue: won
      .filter((c) => new Date(c.wonAt) >= b.from && new Date(c.wonAt) < b.to)
      .reduce((a, c) => a + Number(c.value || 0), 0),
  }));
  const max = Math.max(1, ...bins.flatMap((b) => [b.messages, b.replies]));
  const revMax = Math.max(1, ...bins.map((b) => b.revenue));
  return `<div class="view-toolbar"><div class="segmented"><button class="${v.period === "week" ? "active" : ""}" data-action="analytics-period" data-mode="week">Tygodnie</button><button class="${v.period === "month" ? "active" : ""}" data-action="analytics-period" data-mode="month">Miesiące</button></div><button class="icon-button" data-action="analytics-prev" aria-label="Poprzedni okres">‹</button><strong>${v.period === "week" ? dateLabel(dayISO(start)) + " – " + dateLabel(dayISO(new Date(end - 1))) : start.toLocaleDateString("pl-PL", { month: "long", year: "numeric" })}</strong><button class="icon-button" data-action="analytics-next" aria-label="Następny okres">›</button><button class="button small" data-action="analytics-now">Bieżący okres</button></div><section class="metric-row"><div class="metric" style="background:var(--lavender)"><small>Wysłane wiadomości</small><strong data-count="${sent}">${sent}</strong></div><div class="metric" style="background:var(--lime)"><small>Otrzymane odpowiedzi</small><strong data-count="${replies}">${replies}</strong></div><div class="metric"><small>Skuteczność kontaktów</small><strong>${sent ? Math.round((replies / sent) * 100) : 0}%</strong></div><div class="metric" style="background:var(--peach)"><small>Pozyskani klienci</small><strong data-count="${won.length}">${won.length}</strong></div></section>
 <div class="chart-grid"><section class="panel chart-panel"><div class="panel-heading"><h2>Rozmowy zaczynają się od „cześć”</h2><small>${v.period === "week" ? "Dzień po dniu" : "Wyniki miesiąca"}</small></div><div class="chart-bars" role="group" aria-label="Wiadomości: ${sent}. Odpowiedzi: ${replies}.">${bins.map((b) => `<div class="bar-group"><button class="chart-bar" style="--height:${(b.messages / max) * 100}%" data-action="chart-info" data-tip="${b.label}: ${b.messages} wiadomości" aria-label="${b.label}: ${b.messages} wiadomości"></button><button class="chart-bar reply" style="--height:${(b.replies / max) * 100}%" data-action="chart-info" data-tip="${b.label}: ${b.replies} odpowiedzi" aria-label="${b.label}: ${b.replies} odpowiedzi"></button><small>${b.label}</small></div>`).join("")}</div><div class="legend"><span>Wiadomości</span><span>Odpowiedzi</span></div></section>
 <section class="panel chart-panel"><div class="panel-heading"><h2>Każdy cel zaczyna się od kroku</h2>${icon("flag")}</div><div class="conversion-list">${[
   ["Kontakty w bieżącym tygodniu", s.contacts, s.goal, "#c8b8f0"],
   [
     "Przychód łącznie",
     s.revenue,
     Number(d.profile.revenueGoal) || 10000,
     "#f9b58f",
   ],
   [
     "Pozyskani klienci łącznie",
     s.won,
     Number(d.profile.clientGoal) || 5,
     "#d5eb8e",
   ],
 ]
   .map(
     ([name, n, target, color]) =>
       `<div><label><span>${name}</span><strong>${name.includes("Przychód") ? money(n) + " / " + money(target) : n + " / " + target}</strong></label><div class="progress-track"><span class="progress-fill" style="--width:${Math.min(100, (n / target) * 100)}%;background:${color}"></span></div></div>`,
   )
   .join(
     "",
   )}</div><button class="button small" style="margin-top:27px" data-page="settings">Zmień cele ${icon("arrow")}</button></section>
 <section class="panel"><div class="panel-heading"><h2>Przychody w wybranym okresie</h2><small>Wartość pozyskanych klientów</small></div><div class="revenue-total">${money(revenue)}</div><svg class="chart-revenue" viewBox="0 0 600 180" preserveAspectRatio="none" role="img" aria-label="Przychód ${money(revenue)}"><path d="M0 155h600M0 90h600M0 25h600" stroke="#e7e4db" fill="none"/><polyline points="${bins.map((b, i) => `${20 + i * (560 / Math.max(1, bins.length - 1))},${155 - (b.revenue / revMax) * 125}`).join(" ")}"/>${bins.map((b, i) => `<circle cx="${20 + i * (560 / Math.max(1, bins.length - 1))}" cy="${155 - (b.revenue / revMax) * 125}" r="4"><title>${b.label}: ${money(b.revenue)}</title></circle>`).join("")}</svg></section><section class="panel"><h2>Jak czytać te wyniki?</h2><p class="tip-text">Wiadomości i odpowiedzi rejestrujesz w karcie klienta. Zmiana statusu na „Kontakt wysłany” lub „Rozmowa” również zapisuje odpowiednią aktywność.</p><p class="tip-text">Przychód jest sumą wartości klientów ze statusem „Pozyskany”. Wyniki okresu wykorzystują datę pozyskania klienta. Skuteczność to liczba odpowiedzi podzielona przez liczbę wiadomości w wybranym okresie.</p></section></div>`;
}
