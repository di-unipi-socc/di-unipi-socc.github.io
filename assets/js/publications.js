const publicationCategories = ["journal", "conference", "books", "collection", "editorship", "reference", "data", "informal"];
const publicationTypeToCss = { books: "pub-books", journal: "pub-journal", conference: "pub-conference", collection: "pub-collection", editorship: "pub-editorship", reference: "pub-reference", data: "pub-data", informal: "pub-informal" };
const publicationCounts = () => Object.fromEntries(publicationCategories.map((type) => [type, 0]));

function showStats(bar, publications) {
  const counts = publicationCounts(); publications.forEach((publication) => counts[publication.type] = (counts[publication.type] || 0) + 1);
  bar.replaceChildren(); const label = document.createElement("span"); label.textContent = window.siteText.publications.stats; bar.append(label);
  const badges = document.createElement("div"); badges.className = "pb-1 flex flex-wrap gap-1"; bar.append(badges);
  publicationCategories.forEach((type) => { if (!counts[type]) return; const badge = document.createElement("span"); badge.className = `pub-badge-small ${publicationTypeToCss[type]}`; badge.textContent = `${window.siteText.publications.categories[type]}: ${counts[type]}`; badges.append(badge); });
  const total = document.createElement("span"); total.className = "text-[11px] text-unipi-ink-500 dark:text-unipi-text"; total.textContent = `${window.siteText.publications.all}: ${publications.length}`; bar.append(total);
}

function renderPublications(target, publications) {
  const pubs = [...publications].sort((a, b) => Number(b.year) - Number(a.year) || Number(b.month) - Number(a.month) || a.title.localeCompare(b.title));
  const container = document.createElement("div"); const stats = document.createElement("div"); stats.id = "pub-stats-bar"; stats.className = "flex flex-wrap items-center gap-2 text-[11px] text-unipi-ink-600 dark:text-unipi-text"; showStats(stats, pubs); container.append(stats);
  [...new Set(pubs.map((publication) => publication.year))].sort((a, b) => b - a).forEach((year) => { const heading = document.createElement("h3"); heading.className = "mt-6 mb-2 text-sm font-bold text-unipi-ink-700 dark:text-unipi-text"; heading.textContent = year; const list = document.createElement("ul"); list.className = "space-y-2 text-sm"; pubs.filter((publication) => publication.year === year).forEach((publication) => { const item = document.createElement("li"); item.className = "flex gap-2 items-baseline"; const badge = document.createElement("span"); badge.className = `shrink-0 pub-badge ${publicationTypeToCss[publication.type]}`; const body = document.createElement("div"); body.innerHTML = `<span class="text-unipi-ink-600 dark:text-unipi-subtle">${publication.authors.join(", ")}:</span> <span class="font-semibold text-unipi-ink-900 dark:text-unipi-text">${publication.title}</span>, <span class="text-unipi-ink-600 dark:text-unipi-subtle">${publication.venue ? `${publication.venue}, ` : ""}${publication.year}.</span>`; if (publication.url) { const link = document.createElement("a"); link.href = publication.url; link.target = "_blank"; link.rel = "noopener"; link.className = "badge-unipi ml-1 cursor-pointer"; link.textContent = publication.url.includes("doi.org") ? "DOI" : "Link"; body.append(link); } item.append(badge, body); list.append(item); }); container.append(heading, list); });
  target.replaceChildren(container);
}

function filterPublications() {
  const results = document.getElementById("pub-results"), search = document.getElementById("pub-search"), year = document.getElementById("pub-year"), type = document.getElementById("pub-type"), clear = document.getElementById("pub-clear"); let source = [];
  const apply = () => { const query = search.value.trim().toLowerCase(); renderPublications(results, source.filter((publication) => (!year.value || publication.year === year.value) && (!type.value || publication.type === type.value) && (!query || [publication.title, publication.year, publication.venue, ...publication.authors].join(" ").toLowerCase().includes(query)))); };
  fetch("/assets/publications.json").then((response) => response.json()).then((publications) => { source = publications; [...new Set(source.map((publication) => publication.year))].sort((a, b) => b - a).forEach((value) => year.add(new Option(value, value))); apply(); search.addEventListener("input", apply); year.addEventListener("change", apply); type.addEventListener("change", apply); clear.addEventListener("click", () => { search.value = ""; year.value = ""; type.value = ""; apply(); }); }).catch(() => { results.textContent = "Publication data is unavailable."; });
}

filterPublications();
