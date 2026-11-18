// «Сьогодні»: live local time and open/closed state of the 11 clinics (concept signature),
// city tabs in #clinics and small sheet helpers. Without JS the page shows the static schedule.
import { CITIES, OPEN_FROM, OPEN_TO, type City, type Clinic } from "../data/site";

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

interface Now { day: number; minutes: number; hhmm: string; }

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function nowIn(tz: string): Now {
  let fmt = fmtCache.get(tz);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    fmtCache.set(tz, fmt);
  }
  const parts = fmt.formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const h = get("hour").padStart(2, "0");
  const m = get("minute").padStart(2, "0");
  return { day: days.indexOf(get("weekday")) + 1, minutes: Number(h) * 60 + Number(m), hhmm: `${h}:${m}` };
}

const DAY_ACC = ["", "у понеділок", "у вівторок", "у середу", "у четвер", "у п'ятницю", "у суботу", "в неділю"];
const hm = (min: number) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, "0")}`;

function isOpen(c: Clinic, n: Now) {
  return c.days.includes(n.day) && n.minutes >= OPEN_FROM && n.minutes < OPEN_TO;
}

/** «сьогодні о 9:00», «завтра о 9:00», «у понеділок о 9:00» */
function nextOpening(days: number[], n: Now): string {
  if (days.includes(n.day) && n.minutes < OPEN_FROM) return `сьогодні о ${hm(OPEN_FROM)}`;
  for (let i = 1; i <= 7; i += 1) {
    const d = ((n.day - 1 + i) % 7) + 1;
    if (days.includes(d)) return i === 1 ? `завтра о ${hm(OPEN_FROM)}` : `${DAY_ACC[d]} о ${hm(OPEN_FROM)}`;
  }
  return "";
}

function setClock(el: HTMLElement, text: string) {
  const prev = el.dataset.value;
  if (prev === text) return;
  el.dataset.value = text;
  if (!prev || prev.length !== text.length) {
    el.replaceChildren(...[...text].map((ch) => digit(ch, false)));
    return;
  }
  [...text].forEach((ch, i) => {
    if (prev[i] !== ch) el.children[i]?.replaceWith(digit(ch, !reduce));
  });
}
function digit(ch: string, roll: boolean) {
  const outer = document.createElement("span");
  outer.className = roll ? "clock__d is-roll" : "clock__d";
  const inner = document.createElement("span");
  inner.textContent = ch;
  outer.append(inner);
  return outer;
}

function setState(holder: HTMLElement, open: boolean, text: string, first: boolean) {
  const target = holder.querySelector<HTMLElement>("[data-state]");
  if (target && target.textContent !== text) target.textContent = text;
  const was = holder.classList.contains("is-open");
  holder.classList.toggle("is-open", open);
  if (open && (first || !was) && !reduce) {
    holder.classList.remove("is-wave");
    void holder.offsetWidth;
    holder.classList.add("is-wave");
  }
}

function cityState(city: City, n: Now) {
  const open = city.clinics.filter((c) => isOpen(c, n)).length;
  const total = city.clinics.length;
  if (open > 0) return { open: true, text: `Відчинено до ${hm(OPEN_TO)}`, count: `${open} з ${total} клінік` };
  const all = [...new Set(city.clinics.flatMap((c) => c.days))];
  return { open: false, text: `Зачинено, відчиниться ${nextOpening(all, n)}`, count: `${total} ${total === 1 ? "клініка" : total < 5 ? "клініки" : "клінік"}` };
}

let first = true;
function tick() {
  const byTz = new Map<string, Now>();
  const at = (tz: string) => { let v = byTz.get(tz); if (!v) { v = nowIn(tz); byTz.set(tz, v); } return v; };

  document.querySelectorAll<HTMLElement>("[data-clock]").forEach((el) => setClock(el, at(el.dataset.clock!).hhmm));

  for (const city of CITIES) {
    const n = at(city.timeZone);
    const st = cityState(city, n);
    document.querySelectorAll<HTMLElement>(`[data-live-city="${city.id}"]`).forEach((el) => {
      setState(el, st.open, st.text, first);
      const count = el.querySelector<HTMLElement>("[data-count]");
      if (count) count.textContent = st.count;
    });
    city.clinics.forEach((c, i) => {
      document.querySelectorAll<HTMLElement>(`[data-live-clinic="${city.id}-${i}"]`).forEach((el) => {
        const open = isOpen(c, n);
        setState(el, open, open ? `Відчинено до ${hm(OPEN_TO)}` : `Зачинено, відчиниться ${nextOpening(c.days, n)}`, first);
      });
    });
  }
  first = false;
}

tick();
// Align ticks to the start of each minute.
const start = () => { tick(); window.setInterval(tick, 60_000); };
window.setTimeout(start, 60_000 - (Date.now() % 60_000) + 50);
document.addEventListener("visibilitychange", () => { if (!document.hidden) tick(); });

// ---------- city tabs (#clinics) ----------
const tablist = document.querySelector<HTMLElement>("[role=tablist]");
if (tablist) {
  const tabs = [...tablist.querySelectorAll<HTMLButtonElement>("[role=tab]")];
  const bar = tablist.querySelector<HTMLElement>(".tabs__bar");
  const panels = tabs.map((t) => document.getElementById(t.getAttribute("aria-controls")!)!);

  const moveBar = (tab: HTMLElement) => {
    if (!bar) return;
    bar.style.setProperty("--x", `${tab.offsetLeft}px`);
    bar.style.setProperty("--w", `${tab.offsetWidth / 100}`);
  };
  const select = (idx: number, focus = false, animate = true) => {
    tabs.forEach((t, i) => {
      const on = i === idx;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      panels[i]!.hidden = !on;
      panels[i]!.classList.toggle("is-in", on && animate && !reduce);
    });
    moveBar(tabs[idx]!);
    if (focus) tabs[idx]!.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => select(i));
    t.addEventListener("keydown", (e) => {
      const k = e.key;
      let n = -1;
      if (k === "ArrowRight") n = (i + 1) % tabs.length;
      else if (k === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length;
      else if (k === "Home") n = 0;
      else if (k === "End") n = tabs.length - 1;
      if (n >= 0) { e.preventDefault(); select(n, true); }
    });
  });
  const fromHash = () => {
    const i = panels.findIndex((p) => `#${p.id}` === location.hash);
    if (i >= 0) {
      select(i);
      document.getElementById("clinics")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    }
  };
  panels.forEach((p, i) => {
    document.querySelectorAll<HTMLAnchorElement>(`a[href="#${p.id}"]`).forEach((a) => a.addEventListener("click", (e) => {
      e.preventDefault();
      history.replaceState(null, "", `#${p.id}`);
      select(i);
      document.getElementById("clinics")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    }));
  });
  select(0, false, false);
  if (location.hash) fromHash();
  window.addEventListener("hashchange", fromHash);
  window.addEventListener("resize", () => {
    const cur = tabs.find((t) => t.getAttribute("aria-selected") === "true");
    if (cur) moveBar(cur);
  });
  document.fonts?.ready.then(() => {
    const cur = tabs.find((t) => t.getAttribute("aria-selected") === "true");
    if (cur) moveBar(cur);
  });
}

// ---------- sheets: close the menu after choosing a section ----------
document.querySelectorAll<HTMLAnchorElement>("[data-close-sheet]").forEach((a) => {
  a.addEventListener("click", () => a.closest<HTMLElement>("[popover]")?.hidePopover());
});
