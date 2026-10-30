// Extracts news items from the Income Tax portal "Latest News" page.
// The page is server-rendered HTML (no JSON API like the GST portal), so
// items are located by their date label (e.g. "12-Oct-2026").
// License: GPLv3

// Minimal DOM shape so this works with deno-dom (and other DOM libs).
// deno-lint-ignore no-explicit-any
type El = any;

export interface NewsItem {
  date: Date;
  title: string;
  html: string;
  link: string;
  id: string;
}

const DATE_RE = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/;
const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

export function parseDate(s: string): Date | null {
  const m = s.trim().match(DATE_RE);
  if (!m) return null;
  const month = MONTHS[m[2].toLowerCase()];
  if (month === undefined) return null;
  return new Date(Date.UTC(Number(m[3]), month, Number(m[1])));
}

const clean = (s: string) => s.replace(/\s+/g, " ").trim();

// Text of all descendant text nodes, space-separated so adjacent
// paragraphs don't run together
function textOf(node: El): string {
  if (node.nodeType === 3) return node.nodeValue ?? "";
  return [...node.childNodes].map(textOf).join(" ");
}

// Smallest elements whose whole text is a date label
function findDateElements(root: El): El[] {
  const out: El[] = [];
  for (const el of root.querySelectorAll("*")) {
    if (!parseDate(el.textContent ?? "")) continue;
    const childIsDate = [...el.children].some((c: El) =>
      parseDate(c.textContent ?? "")
    );
    if (!childIsDate) out.push(el);
  }
  return out;
}

function countDates(el: El, dateEls: El[]): number {
  // walk up manually instead of relying on Node.contains()
  return dateEls.filter((d) => {
    for (let n = d; n; n = n.parentNode) if (n === el) return true;
    return false;
  }).length;
}

// Turn relative links into absolute ones
function absolutize(el: El, base: string) {
  for (const a of el.querySelectorAll("a[href]")) {
    try {
      a.setAttribute("href", new URL(a.getAttribute("href"), base).href);
    } catch { /* ignore bad hrefs */ }
  }
}

async function sha1(s: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-1",
    new TextEncoder().encode(s),
  );
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0"))
    .join("").slice(0, 16);
}

export async function extractItems(
  doc: El,
  pageUrl: string,
): Promise<NewsItem[]> {
  const root = doc.querySelector("main") ?? doc.body ?? doc;
  const dateEls = findDateElements(root);
  const items: NewsItem[] = [];

  for (const dateEl of dateEls) {
    const date = parseDate(dateEl.textContent)!;

    // Case 1: climb to the largest ancestor that holds only this one date
    // (a "row" wrapper). Case 2: rows are flat siblings — collect the
    // siblings that follow the date until the next date.
    let row: El = dateEl;
    while (
      row.parentElement && row.parentElement !== root &&
      countDates(row.parentElement, dateEls) === 1
    ) row = row.parentElement;

    const container = doc.createElement("div");
    if (row !== dateEl) {
      const copy = row.cloneNode(true);
      // drop the date label from the copy
      for (const el of [...copy.querySelectorAll("*")]) {
        if (parseDate(el.textContent ?? "") && el.parentNode) {
          el.parentNode.removeChild(el);
          break;
        }
      }
      container.appendChild(copy);
    } else {
      let sib = dateEl.nextSibling;
      while (sib) {
        const isDate = sib.nodeType === 1 &&
          (parseDate(sib.textContent ?? "") ||
            countDates(sib, dateEls) > 0);
        if (isDate) break;
        container.appendChild(sib.cloneNode(true));
        sib = sib.nextSibling;
      }
    }

    absolutize(container, pageUrl);
    const text = clean(textOf(container));
    if (!text) continue;

    const title = clean(text.replace(/click here\.?/gi, ""));
    const firstLink = container.querySelector("a[href]")?.getAttribute("href");
    const hash = await sha1(`${dateEl.textContent.trim()}|${text}`);

    items.push({
      date,
      title: title.length > 140 ? title.slice(0, 137) + "..." : title,
      html: container.innerHTML.trim(),
      link: firstLink ?? `${pageUrl}#${hash}`,
      id: `${pageUrl}#${hash}`,
    });
  }
  return items;
}
