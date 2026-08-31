const $ = (sel, root = document) => root.querySelector(sel);

const state = {
  view: "home",
  params: {},
  toast: null,
  filter: "Wszystko",
  q: "",
  addMethod: null,
  addCat: "Winyl",
  inheritStep: 1,
  inheritKeep: ["B84722", "B84725"],
  inheritSell: ["B84721", "B84723"],
  inheritGive: ["B84724"],
  inheritRecycle: ["B84728"],
  negotiation: {
    ask: 250,
    offer: 210,
    history: [
      { who: "Właściciel", text: "Cena: 250 zł", time: "12:02" },
      { who: "Anna", text: "Propozycja: 210 zł", time: "12:11" }
    ]
  },
  draftWant: "",
  lastAdded: null
};

function goldIcon(path) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}
const ICO = {
  back: goldIcon('<path d="M15 18l-6-6 6-6"/>'),
  home: goldIcon('<path d="M4 11.5L12 4l8 7.5"/><path d="M6 10.5V20h12v-9.5"/>'),
  grid: goldIcon('<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>'),
  search: goldIcon('<circle cx="11" cy="11" r="6"/><path d="M20 20l-3.5-3.5"/>'),
  user: goldIcon('<circle cx="12" cy="8" r="3.2"/><path d="M5 19c1.4-3.2 3.8-4.6 7-4.6S17.6 15.8 19 19"/>'),
  plus: goldIcon('<path d="M12 5v14M5 12h14"/>'),
  bell: goldIcon('<path d="M6 16h12l-1.2-2.2a6 6 0 0 1-.6-2.8V10a5.2 5.2 0 1 0-10.4 0v1c0 1-.2 1.9-.6 2.8L6 16"/><path d="M10 16a2 2 0 0 0 4 0"/>'),
};

function money(n) {
  return new Intl.NumberFormat("pl-PL").format(n) + " zł";
}
function itemById(id) {
  return BEREK.items.find(i => i.id === id);
}
function totals() {
  const items = BEREK.items;
  const value = items.reduce((s, i) => s + i.value, 0);
  const cats = items.reduce((m, i) => (m[i.cat] = (m[i.cat] || 0) + 1, m), {});
  return { n: items.length, value, cats };
}
function statusBadge(st) {
  const map = {
    "Na sprzedaż": "sale",
    "Kolekcja prywatna": "priv",
    "Oddam": "give",
    "Recykling": "warn",
    "Zarezerwowany": "match",
    "Sprzedany": "priv",
    "Wymiana": "match"
  };
  return `<span class="badge ${map[st] || ""}">${st}</span>`;
}
function locText(loc) {
  return [loc.place, loc.shelf, loc.box].filter(Boolean).join(" → ");
}

function go(view, params = {}) {
  state.view = view;
  state.params = params;
  render();
  $(".app").scrollTop = 0;
}
function toast(msg) {
  state.toast = msg;
  render();
  setTimeout(() => { state.toast = null; render(); }, 2200);
}

function tabbar() {
  const v = state.view;
  const act = (name) => (v === name ? "active" : "");
  return `
    <nav class="tabbar">
      <button class="tab ${act("home")}" data-go="home">${ICO.home}<span>Start</span></button>
      <button class="tab ${act("collection")}" data-go="collection">${ICO.grid}<span>Kolekcja</span></button>
      <button class="tab plus" data-go="add">${ICO.plus}<span>+</span></button>
      <button class="tab ${["wants","find"].includes(v) ? "active" : ""}" data-go="wants">${ICO.search}<span>Szukam</span></button>
      <button class="tab ${act("profile")}" data-go="profile">${ICO.user}<span>Profil</span></button>
    </nav>`;
}

function top(title, back = "home") {
  return `
    <div class="topbar">
      <button class="icon-btn" data-go="${back}">${ICO.back}</button>
      <div class="h3">${title}</div>
      <button class="icon-btn" data-go="matches">${ICO.bell}</button>
    </div>`;
}

/* ---------- VIEWS ---------- */
function viewHome() {
  const t = totals();
  const match = BEREK.matches[0];
  const item = itemById(match.itemId);
  return `
    <div class="pad" style="padding-top:6px">
      <div class="between">
        <div>
          <div class="kicker">Warszawa · kolekcja</div>
          <div class="logo mt-8">BEREK</div>
        </div>
        <button class="avatar" data-go="profile">${BEREK.user.initials}</button>
      </div>
      <p class="muted mt-8" style="font-family:var(--display);font-size:18px;color:var(--text)">
        Masz? Szukasz? Berek połączy.
      </p>
    </div>

    <div class="hero">
      <img src="assets/hero-vinyls.jpg" alt="">
      <div class="veil">
        <div class="tiny faint">MAM → SZUKAM → BEREK ŁĄCZY → DZIAŁAMY</div>
        <div class="h3 mt-8">${t.n} przedmiotów · ${money(t.value)}</div>
      </div>
    </div>

    <div class="pad">
      <button class="card match-banner press btn-block" data-go="match" data-id="${match.id}" style="text-align:left">
        <div class="kicker">🎯 Berek Match</div>
        <div class="h3 mt-8">Anna szuka Twojego Pink Floyd</div>
        <p class="small muted mt-8">${item.title} · ${item.catalog} · zgodność ${match.score}%</p>
      </button>

      <div class="grid-4 mt-16">
        <button class="tile press" data-go="collection"><span class="ico">📀</span><span class="lbl">Moja kolekcja</span><span class="sub">${t.n} szt.</span></button>
        <button class="tile press" data-go="wants"><span class="ico">🔎</span><span class="lbl">Szukam</span><span class="sub">${BEREK.myWants.length} ogłoszenia</span></button>
        <button class="tile press" data-go="add"><span class="ico">＋</span><span class="lbl">Dodaj</span><span class="sub">zdjęcie / skan</span></button>
        <button class="tile press" data-go="find"><span class="ico">🌐</span><span class="lbl">Znajdź</span><span class="sub">w sieci Berek</span></button>
        <button class="tile press" data-go="sell"><span class="ico">🏷</span><span class="lbl">Sprzedaj</span><span class="sub">oferta + post</span></button>
        <button class="tile press" data-go="give"><span class="ico">❤️</span><span class="lbl">Oddaj</span><span class="sub">Aleje Życia</span></button>
        <button class="tile press" data-go="recycle"><span class="ico">♻️</span><span class="lbl">Recykling</span><span class="sub">partnerzy</span></button>
        <button class="tile press" data-go="profile"><span class="ico">👤</span><span class="lbl">Mój profil</span><span class="sub">${BEREK.user.name.split(" ")[0]}</span></button>
      </div>

      <div class="grid-2 mt-12">
        <button class="tile press" data-go="inherit"><span class="ico">🤍</span><span class="lbl">Kolekcja po bliskich</span><span class="sub">8 kroków + raport</span></button>
        <button class="tile press" data-go="experts"><span class="ico">✋</span><span class="lbl">Potrzebuję pomocy</span><span class="sub">eksperci Berka</span></button>
      </div>
    </div>`;
}

function viewCollection() {
  const t = totals();
  const chips = ["Wszystko", "Winyl", "CD", "Książka", "Na sprzedaż", "Oddam", "Recykling"];
  const q = state.q.toLowerCase();
  let list = BEREK.items.filter(i => {
    if (state.filter === "Winyl" || state.filter === "CD" || state.filter === "Książka") return i.cat === state.filter;
    if (state.filter === "Na sprzedaż") return i.status === "Na sprzedaż";
    if (state.filter === "Oddam") return i.status === "Oddam";
    if (state.filter === "Recykling") return i.status === "Recykling";
    return true;
  }).filter(i => !q || (i.title + i.artist + i.id).toLowerCase().includes(q));

  const precious = [...BEREK.items].sort((a,b) => b.value - a.value)[0];
  const wanted = BEREK.items.filter(i => i.wantedBy > 0).length;

  return `
    ${top("Moja kolekcja", "home")}
    <div class="pad">
      <div class="search">
        <span class="faint">${ICO.search}</span>
        <input id="colQ" placeholder="Szukaj w mojej kolekcji…" value="${state.q}">
      </div>
      <div class="grid-2 mt-12">
        <div class="stat"><b>${t.n}</b><span>przedmiotów</span></div>
        <div class="stat"><b>${money(t.value)}</b><span>orientacyjna wartość</span></div>
      </div>
      <div class="grid-2 mt-8">
        <div class="stat"><b>${t.cats.Winyl || 0} / ${t.cats.CD || 0} / ${t.cats.Książka || 0}</b><span>winyl · CD · książki</span></div>
        <div class="stat"><b>${wanted}</b><span>poszukiwane przez innych</span></div>
      </div>

      <div class="chips mt-16">
        ${chips.map(c => `<button class="chip ${state.filter===c?"on":""}" data-filter="${c}">${c}</button>`).join("")}
      </div>

      <div class="between mt-16 mb-8">
        <div class="h3">Ostatnio dodane</div>
        <span class="tiny faint">najcenniejsze: ${precious.artist}</span>
      </div>
      <div class="stack">
        ${list.map(i => `
          <button class="card press" data-go="item" data-id="${i.id}">
            <div class="item-row">
              <img class="cover" src="${i.img}" alt="">
              <div style="text-align:left">
                <div class="tiny faint">${i.cat} · ${i.year} · #${i.id}</div>
                <div class="h3">${i.title}</div>
                <div class="small muted">${i.artist}</div>
              </div>
              <div style="text-align:right">
                ${statusBadge(i.status)}
                <div class="small mt-8">${money(i.value)}</div>
              </div>
            </div>
          </button>`).join("") || `<div class="empty">Brak wyników dla tych filtrów.</div>`}
      </div>
    </div>`;
}

function viewItem() {
  const i = itemById(state.params.id) || BEREK.items[0];
  const isBook = i.cat === "Książka";
  return `
    ${top(i.cat, "collection")}
    <div class="pad">
      <img class="cover xl" src="${i.img}" alt="">
      <div class="between mt-16">
        <div>
          <div class="kicker">${i.cat} · #${i.id}</div>
          <div class="h2 mt-8">${i.title}</div>
          <div class="muted mt-8">${i.artist}</div>
        </div>
        ${statusBadge(i.status)}
      </div>

      <div class="card mt-16">
        <div class="kv">
          ${isBook ? `
            <span>Autor</span><b>${i.artist}</b>
            <span>Tytuł</span><b>${i.title}</b>
            <span>ISBN</span><b>${i.isbn || i.catalog}</b>
            <span>Wydawnictwo</span><b>${i.label}</b>
            <span>Rok</span><b>${i.year}</b>
            <span>Wydanie</span><b>${i.edition}</b>
            <span>Język</span><b>${i.lang || "polski"}</b>
            <span>Kategoria</span><b>${i.cat}</b>
            <span>Stan</span><b>${i.condition}</b>
            <span>Wartość orient.</span><b>${money(i.value)}</b>
          ` : `
            <span>Wykonawca</span><b>${i.artist}</b>
            <span>Tytuł</span><b>${i.title}</b>
            <span>Wydanie</span><b>${i.edition}</b>
            <span>Kraj</span><b>${i.country}</b>
            <span>Rok</span><b>${i.year}</b>
            <span>Label</span><b>${i.label}</b>
            <span>Nr katalogowy</span><b>${i.catalog}</b>
            <span>Matrix / dead wax</span><b>${i.matrix}</b>
            <span>Stan</span><b>${i.condition}</b>
            <span>Wartość orient.</span><b>${money(i.value)}</b>
            <span>Pewność ID</span><b>${i.confidence}%</b>
          `}
        </div>
      </div>

      <div class="card mt-12">
        <div class="tiny faint">Lokalizacja</div>
        <div class="h3 mt-8">${i.cat.toUpperCase()} #${i.id}</div>
        <p class="muted small mt-8">${locText(i.loc)}</p>
        <div class="grid-2 mt-12">
          <button class="btn btn-ghost btn-sm" data-go="location" data-id="${i.id}">Zmień miejsce</button>
          <button class="btn btn-outline btn-sm" data-go="qr" data-id="${i.id}">Kod QR</button>
        </div>
      </div>

      <p class="small muted mt-16">${i.note}</p>
      ${i.wantedBy ? `<p class="small mt-8" style="color:var(--match)">Poszukiwane przez ${i.wantedBy} osób w sieci Berek.</p>` : ""}

      <div class="stack mt-16">
        <button class="btn btn-primary btn-block" data-go="offer" data-id="${i.id}">Przygotuj ofertę</button>
        <button class="btn btn-ghost btn-block" data-go="social" data-id="${i.id}">Stwórz post sprzedażowy</button>
        <div class="grid-2">
          <button class="btn btn-ghost" data-go="give" data-id="${i.id}">❤️ Oddaj</button>
          <button class="btn btn-ghost" data-go="recycle" data-id="${i.id}">♻️ Recykling</button>
        </div>
      </div>
    </div>`;
}

function viewAdd() {
  return `
    ${top("Dodaj przedmiot", "home")}
    <div class="pad">
      <button class="btn btn-primary btn-block" style="height:64px;font-size:18px" data-go="add">+ DODAJ</button>
      <p class="small muted mt-12" style="text-align:center">Najpierw wybierz sposób, potem kategorię.</p>

      <div class="stack mt-16">
        <button class="card press" data-method="photo"><div class="between"><div><div class="h3">📸 Zrób zdjęcie</div><div class="small muted mt-8">Aparat rozpozna okładkę i etykietę</div></div></div></button>
        <button class="card press" data-method="gallery"><div class="h3">🖼️ Wybierz zdjęcie</div><div class="small muted mt-8">Z rolki aparatu</div></button>
        <button class="card press" data-method="manual"><div class="h3">🔎 Wprowadź ręcznie</div><div class="small muted mt-8">Gdy AI nie ma pewności</div></button>
        <button class="card press" data-method="scan"><div class="h3">📷 Skanuj serię</div><div class="small muted mt-8">ISBN, kod kreskowy, runout</div></button>
      </div>

      <div class="h3 mt-20 mb-8">Kategoria</div>
      <div class="chips">
        ${["Winyl","CD","Książka","Inne"].map(c => `<button class="chip ${state.addCat===c?"on":""}" data-cat="${c}">${c}</button>`).join("")}
      </div>
    </div>`;
}

function viewAnalyzing() {
  return `
    ${top("Identyfikacja", "add")}
    <div class="pad" style="text-align:center;padding-top:48px">
      <div style="margin:0 auto" class="pulse-ring">
        <img src="assets/logo.jpg" alt="" style="width:54px;height:54px;object-fit:cover;border-radius:14px">
      </div>
      <div class="h2 mt-20">Berek analizuje przedmiot…</div>
      <p class="muted small mt-8">Okładka · etykieta · matrix · bazy kolekcjonerskie</p>
      <div class="progress mt-20"><i></i></div>
      <p class="tiny faint mt-16">To prototyp — wynik jest demonstracyjny.</p>
    </div>`;
}

function viewRecognition() {
  const vinyl = {
    artist: "Pink Floyd",
    title: "The Dark Side of the Moon",
    edition: "UK Harvest, gatefold, first press (prawdopodobne)",
    country: "Wielka Brytania",
    year: "1973",
    label: "Harvest",
    catalog: "SHVL 804",
    matrix: "SHVL 804 A-2 / SHVL 804 B-2",
    condition: "do oceny (zdjęcie)",
    value: "780–920 zł"
  };
  const book = {
    title: "Lalka",
    artist: "Bolesław Prus",
    isbn: "brak (1956)",
    label: "PIW",
    year: "1956",
    edition: "wydanie z 1956 — do potwierdzenia erraty",
    lang: "polski",
    cat: "Literatura polska",
    value: "150–210 zł"
  };
  const isBook = state.addCat === "Książka";
  const d = isBook ? book : vinyl;
  return `
    ${top("Wynik rozpoznania", "add")}
    <div class="pad">
      <img class="cover lg" src="${isBook ? "assets/books-shelf.jpg" : "assets/cover-spectrum.jpg"}" alt="">
      <div class="card mt-16" style="border-color:rgba(224,177,90,.35)">
        <div class="badge warn">Prawdopodobne dopasowanie — 87%</div>
        <p class="small muted mt-12">AI nie ma wystarczającej pewności, żeby traktować to jako fakt. Potwierdź albo popraw.</p>
      </div>
      <div class="card mt-12">
        <div class="kv">
          ${isBook ? `
            <span>Tytuł</span><b>${d.title}</b>
            <span>Autor</span><b>${d.artist}</b>
            <span>ISBN</span><b>${d.isbn}</b>
            <span>Wydawnictwo</span><b>${d.label}</b>
            <span>Rok</span><b>${d.year}</b>
            <span>Wydanie</span><b>${d.edition}</b>
            <span>Język</span><b>${d.lang}</b>
            <span>Kategoria</span><b>${d.cat}</b>
            <span>Wartość orient.</span><b>${d.value}</b>
          ` : `
            <span>Wykonawca</span><b>${d.artist}</b>
            <span>Tytuł</span><b>${d.title}</b>
            <span>Wydanie</span><b>${d.edition}</b>
            <span>Kraj</span><b>${d.country}</b>
            <span>Rok</span><b>${d.year}</b>
            <span>Label</span><b>${d.label}</b>
            <span>Nr katalogowy</span><b>${d.catalog}</b>
            <span>Matrix / dead wax</span><b>${d.matrix}</b>
            <span>Stan</span><b>${d.condition}</b>
            <span>Wartość orient.</span><b>${d.value}</b>
          `}
        </div>
      </div>
      <div class="grid-2 mt-16">
        <button class="btn btn-primary" data-act="confirm-add">Potwierdź</button>
        <button class="btn btn-ghost" data-act="fix-add">Popraw</button>
      </div>
    </div>`;
}

function viewWants() {
  return `
    ${top("Szukam", "home")}
    <div class="pad">
      <div class="card">
        <div class="h3">Dodaj ogłoszenie „Szukam…”</div>
        <p class="small muted mt-8">Konkretne wydanie działa lepiej niż ogólny tytuł.</p>
        <input id="wantQ" class="mt-12" style="width:100%;background:var(--elev);border:1px solid var(--line);border-radius:12px;padding:12px" placeholder="np. Pink Floyd — konkretne wydanie winylowe">
        <button class="btn btn-primary btn-block mt-12" data-go="want-form">Dalej</button>
      </div>

      <div class="h3 mt-20 mb-8">Twoje poszukiwania</div>
      <div class="stack">
        ${BEREK.myWants.map(w => `
          <div class="card">
            <div class="between"><div class="h3">${w.query}</div><span class="badge">${w.priority}</span></div>
            <p class="small muted mt-8">max ${money(w.max)} · ${w.condition} · ${w.country} · ${w.edition}</p>
          </div>`).join("")}
      </div>

      <div class="h3 mt-20 mb-8">Ktoś szuka tego, co masz</div>
      <div class="stack">
        ${BEREK.wants.map(w => `
          <button class="card press" data-go="match" data-id="M1">
            <div class="tiny faint">${w.by} · ${w.city}</div>
            <div class="h3 mt-8">${w.query}</div>
            <p class="small muted mt-8">do ${money(w.max)} · ${w.condition}</p>
          </button>`).join("")}
      </div>
    </div>`;
}

function viewWantForm() {
  return `
    ${top("Nowe „Szukam”", "wants")}
    <div class="pad stack">
      <div class="field"><label>Czego szukasz</label><input value="Pink Floyd — konkretne wydanie winylowe"></div>
      <div class="field"><label>Maksymalna cena</label><input value="900 zł"></div>
      <div class="field"><label>Stan</label><select><option>NM</option><option selected>VG+</option><option>VG</option><option>G</option></select></div>
      <div class="field"><label>Kraj</label><input value="Wielka Brytania"></div>
      <div class="field"><label>Konkretne wydanie</label><input value="Harvest SHVL 804, matrix A-2/B-2"></div>
      <div class="field"><label>Priorytet</label><select><option>Niski</option><option selected>Średni</option><option>Wysoki</option></select></div>
      <button class="btn btn-primary btn-block" data-act="save-want">Opublikuj w sieci Berek</button>
    </div>`;
}

function viewFind() {
  return `
    ${top("Znajdź", "home")}
    <div class="pad">
      <div class="search"><span class="faint">${ICO.search}</span><input placeholder="Szukaj w sieci Berek…"></div>
      <p class="small muted mt-12">Wyniki z katalogów innych użytkowników. Nie sklep — sieć posiadaczy.</p>
      <div class="stack mt-16">
        ${BEREK.items.slice(0,4).map(i => `
          <div class="card">
            <div class="item-row">
              <img class="cover" src="${i.img}" alt="">
              <div>
                <div class="tiny faint">${i.cat} · ${i.city || BEREK.user.city}</div>
                <div class="h3">${i.title}</div>
                <div class="small muted">${i.artist} · ${i.year}</div>
              </div>
              ${statusBadge(i.status)}
            </div>
          </div>`).join("")}
      </div>
    </div>`;
}

function viewMatch() {
  const item = itemById("B84721");
  return `
    ${top("Berek Match", "home")}
    <div class="pad">
      <div class="card match-banner">
        <div class="kicker">🎯 BEREK MATCH</div>
        <div class="h2 mt-8">Znaleziono dopasowanie</div>
        <p class="small muted mt-8">Użytkownik A ma · użytkownik B szuka · Berek łączy.</p>
      </div>

      <div class="card mt-12">
        <div class="row">
          <div class="avatar">AN</div>
          <div>
            <div class="h3">Anna szuka</div>
            <div class="small muted">Pink Floyd — określone wydanie · Kraków</div>
          </div>
        </div>
        <p class="small mt-12">The Dark Side of the Moon · Harvest SHVL 804 · UK first press · max 900 zł · VG+</p>
      </div>

      <div class="card mt-12">
        <div class="tiny faint">Ty posiadasz</div>
        <div class="item-row mt-12">
          <img class="cover" src="${item.img}" alt="">
          <div>
            <div class="h3">${item.title}</div>
            <div class="small muted">${item.catalog} · ${item.matrix}</div>
            <div class="tiny faint mt-8">dokładnie dopasowany egzemplarz</div>
          </div>
        </div>
      </div>

      <div class="stack mt-16">
        <button class="btn btn-match btn-block" data-act="interested">Zainteresowany</button>
        <button class="btn btn-ghost btn-block" data-go="negotiate" data-id="${item.id}">Negocjuj</button>
        <div class="grid-2">
          <button class="btn btn-ghost" data-act="later">Nie teraz</button>
          <button class="btn btn-danger" data-act="not-sale">Nie na sprzedaż</button>
        </div>
      </div>
    </div>`;
}

function viewNegotiate() {
  const n = state.negotiation;
  return `
    ${top("Negocjacja", "match")}
    <div class="pad">
      <div class="card">
        <div class="between"><span class="muted">Cena właściciela</span><b>${n.ask} zł</b></div>
        <div class="between mt-12"><span class="muted">Kupująca · moja propozycja</span><b>${n.offer} zł</b></div>
      </div>
      <div class="h3 mt-20 mb-8">Historia negocjacji</div>
      <div class="timeline">
        ${n.history.map(h => `<div class="ev"><b>${h.who}</b> <span class="tiny faint">${h.time}</span><p>${h.text}</p></div>`).join("")}
      </div>
      <div class="field mt-8"><label>Kontrpropozycja</label><input id="counter" value="230 zł"></div>
      <div class="stack mt-16">
        <button class="btn btn-match btn-block" data-act="accept-neg">Akceptuję</button>
        <button class="btn btn-primary btn-block" data-act="counter-neg">Kontrpropozycja</button>
        <button class="btn btn-danger btn-block" data-act="reject-neg">Odrzuć</button>
      </div>
      <p class="tiny faint mt-12">Prototyp nie obsługuje płatności. Po akceptacji umawiacie odbiór.</p>
    </div>`;
}

function viewSell() {
  const sale = BEREK.items.filter(i => i.status === "Na sprzedaż" || i.status === "Kolekcja prywatna");
  return `
    ${top("Sprzedaj", "home")}
    <div class="pad">
      <p class="small muted mb-16">Wybierz przedmiot i przygotuj ofertę. Status możesz zmienić w każdej chwili.</p>
      <div class="stack">
        ${sale.map(i => `
          <button class="card press" data-go="offer" data-id="${i.id}">
            <div class="item-row">
              <img class="cover" src="${i.img}" alt="">
              <div style="text-align:left">
                <div class="h3">${i.title}</div>
                <div class="small muted">${i.artist}</div>
              </div>
              ${statusBadge(i.status)}
            </div>
          </button>`).join("")}
      </div>
    </div>`;
}

function viewOffer() {
  const i = itemById(state.params.id) || BEREK.items[0];
  return `
    ${top("Oferta", "sell")}
    <div class="pad">
      <p class="small muted">Berek generuje tytuł, opis, zdjęcie, cenę i stan.</p>
      <img class="cover lg mt-12" src="${i.img}" alt="">
      <div class="card mt-12 stack">
        <div class="field"><label>Tytuł</label><input value="${i.artist} – ${i.title} (${i.year}) · ${i.catalog}"></div>
        <div class="field"><label>Cena</label><input value="${money(i.value)}"></div>
        <div class="field"><label>Stan</label><input value="${i.condition}"></div>
        <div class="field"><label>Status</label>
          <select>
            ${["Kolekcja prywatna","Na sprzedaż","Sprzedany","Zarezerwowany","Wymiana","Oddam","Recykling"].map(s => `<option ${s===i.status?"selected":""}>${s}</option>`).join("")}
          </select>
        </div>
        <div class="field"><label>Opis</label><textarea>${i.artist}, „${i.title}”, ${i.edition}, ${i.country} ${i.year}. Label: ${i.label}. ${i.cat==="Winyl"?`Matrix: ${i.matrix}.`:""} Stan: ${i.condition}. ${i.note} Lokalizacja odbioru: Warszawa.</textarea></div>
      </div>
      <button class="btn btn-primary btn-block mt-16" data-act="share-offer">Udostępnij ofertę</button>
      <button class="btn btn-ghost btn-block mt-8" data-go="social" data-id="${i.id}">Stwórz post sprzedażowy</button>
    </div>`;
}

function viewSocial() {
  const i = itemById(state.params.id) || BEREK.items[0];
  const text = `${i.artist} – ${i.title} (${i.year})\n${i.edition}\nStan: ${i.condition} · ${money(i.value)}\nWarszawa\n\nMasz? Szukasz? Berek połączy.\n#Berek`;
  return `
    ${top("Post sprzedażowy", "offer")}
    <div class="pad">
      <p class="small muted mb-12">Materiał gotowy do skopiowania. Berek nic nie publikuje sam.</p>
      <div class="post-card">
        <img src="${i.img}" alt="">
        <div class="post-body">
          <div style="font-weight:700">${i.artist}</div>
          <div style="font-family:var(--display);font-size:22px;margin-top:4px">${i.title}</div>
          <p style="margin-top:8px;font-size:13px;line-height:1.45">${i.edition} · ${i.condition} · ${money(i.value)}</p>
          <div class="post-brand"><span>BEREK</span><span>#Berek</span></div>
        </div>
      </div>
      <div class="card mt-12"><pre style="white-space:pre-wrap;font-family:var(--font);font-size:13px;color:var(--muted)">${text}</pre></div>
      <div class="grid-2 mt-16">
        <button class="btn btn-primary" data-act="copy-post">Kopiuj tekst</button>
        <button class="btn btn-ghost" data-act="share-post">Udostępnij</button>
      </div>
    </div>`;
}

function viewGive() {
  return `
    ${top("Oddaj", "home")}
    <div class="pad">
      <div class="card">
        <div class="h3">❤️ Oddaj</div>
        <p class="small muted mt-8">Chcesz przekazać przedmiot zamiast go sprzedawać? Berek pomoże znaleźć właściwą ścieżkę przekazania.</p>
      </div>
      <div class="stack mt-16">
        ${BEREK.orgs.map(o => `
          <button class="card press" data-act="donate" data-org="${o.name}">
            <div class="tiny faint">${o.type} · ${o.city}</div>
            <div class="h3 mt-8">${o.name}</div>
            <p class="small muted mt-8">${o.blurb}</p>
          </button>`).join("")}
        <button class="card press" data-act="donate" data-org="Osoba potrzebująca">
          <div class="h3">Osoba potrzebująca</div>
          <p class="small muted mt-8">Berek pokaże dopasowania z listy „Szukam” ze statusem darowizna.</p>
        </button>
        <button class="card press" data-act="donate" data-org="Inna organizacja">
          <div class="h3">Inna organizacja</div>
        </button>
      </div>
    </div>`;
}

function viewRecycle() {
  return `
    ${top("Recykling", "home")}
    <div class="pad">
      <div class="h2">♻️ Oddaj do recyklingu</div>
      <p class="small muted mt-8">Wybierz rodzaj przedmiotu. Dane partnerskie są demonstracyjne.</p>
      <div class="stack mt-16">
        ${BEREK.recycle.map(r => `
          <div class="card">
            <div class="h3">${r.kind}</div>
            <p class="small muted mt-8">${r.how}</p>
            <p class="small mt-8">Partner: <b>${r.partner}</b></p>
            ${r.pickup ? `<button class="btn btn-outline btn-sm mt-12" data-act="pickup">Zgłoś odbiór</button>` : `<p class="tiny faint mt-8">Odbiór we własnym zakresie.</p>`}
          </div>`).join("")}
      </div>
    </div>`;
}

function viewProfile() {
  const t = totals();
  return `
    ${top("Mój profil", "home")}
    <div class="pad">
      <div class="row">
        <div class="avatar" style="width:56px;height:56px;font-size:18px">${BEREK.user.initials}</div>
        <div>
          <div class="h2">${BEREK.user.name}</div>
          <div class="small muted">${BEREK.user.city} · w Berek od ${BEREK.user.since} · ★ ${BEREK.user.rating}</div>
        </div>
      </div>
      <div class="grid-2 mt-16">
        <div class="stat"><b>${t.n}</b><span>w katalogu</span></div>
        <div class="stat"><b>${money(t.value)}</b><span>wartość orient.</span></div>
      </div>
      <div class="stack mt-16">
        <button class="card press" data-go="collection">Moja kolekcja</button>
        <button class="card press" data-go="wants">Moje „Szukam”</button>
        <button class="card press" data-go="matches">Powiadomienia Match</button>
        <button class="card press" data-go="experts">Eksperci Berka</button>
        <button class="card press" data-go="inherit">Kolekcja po bliskich</button>
      </div>
    </div>`;
}

function viewLocation() {
  const i = itemById(state.params.id) || BEREK.items[0];
  const places = ["Dom","Pokój","Regał","Półka","Pudło","Magazyn","Samochód","Targi","U klienta"];
  return `
    ${top("Lokalizacja", "item")}
    <div class="pad">
      <div class="h3">${i.cat.toUpperCase()} #${i.id}</div>
      <p class="small muted mt-8">Teraz: ${locText(i.loc)}</p>
      <div class="chips mt-16" style="flex-wrap:wrap">
        ${places.map(p => `<button class="chip ${i.loc.place===p?"on":""}" data-act="set-loc" data-place="${p}">${p}</button>`).join("")}
      </div>
      <div class="field mt-16"><label>Regał / półka / pudło</label><input value="Regał A → Pudło 7"></div>
      <button class="btn btn-primary btn-block mt-16" data-act="save-loc">Zapisz lokalizację</button>
    </div>`;
}

function viewQR() {
  const i = itemById(state.params.id) || BEREK.items[0];
  return `
    ${top("Kod QR", "item")}
    <div class="pad" style="text-align:center">
      <div class="h3">${i.cat.toUpperCase()} #${i.id}</div>
      <p class="small muted mt-8">${locText(i.loc)}</p>
      <div class="qr mt-20"></div>
      <p class="tiny faint mt-16">Przypisz własny kod do pudła, półki albo egzemplarza.</p>
      <button class="btn btn-ghost btn-block mt-16" data-act="print-qr">Drukuj etykietę</button>
    </div>`;
}

function viewInherit() {
  const s = state.inheritStep;
  const steps = [
    "Katalogowanie",
    "Identyfikacja",
    "Lokalizacja",
    "Wycena orientacyjna",
    "Zachować",
    "Sprzedać",
    "Przekazać",
    "Recykling"
  ];
  const bodies = [
    `<p class="muted">Ania odziedziczyła po dziadku ok. 3000 płyt. Berek prowadzi przez porządek, nie przez pośpiech.</p>
     <div class="card mt-16"><div class="h3">Partia demonstracyjna</div><p class="small muted mt-8">W prototypie pracujemy na ${BEREK.items.length} reprezentatywnych egzemplarzach z większej kolekcji.</p></div>
     <button class="btn btn-primary btn-block mt-16" data-inherit="next">Zacznij katalogowanie</button>`,
    `<p class="muted">Każda okładka i etykieta dostaje propozycję ID. Poniżej pewności 90% zawsze: Potwierdź / Popraw.</p>
     ${BEREK.items.slice(0,3).map(i => `<div class="card mt-12"><div class="between"><div><b>${i.artist}</b><div class="small muted">${i.title}</div></div><span class="badge warn">${i.confidence}%</span></div></div>`).join("")}
     <button class="btn btn-primary btn-block mt-16" data-inherit="next">Dalej</button>`,
    `<p class="muted">Nadajemy miejsca. Przykład: Magazyn → Regał A → Pudło 7.</p>
     <div class="card mt-16"><div class="qr"></div><p class="small muted mt-12" style="text-align:center">WINYL #B84721</p></div>
     <button class="btn btn-primary btn-block mt-16" data-inherit="next">Dalej</button>`,
    `<p class="muted">Suma orientacyjna partii demo: <b>${money(totals().value)}</b>. To nie wycena antykwaryczna.</p>
     <button class="btn btn-primary btn-block mt-16" data-inherit="next">Dalej</button>`,
    pickList("inheritKeep", "Co zostaje w domu"),
    pickList("inheritSell", "Co może pójść w obieg"),
    pickList("inheritGive", "Co przekazujemy dalej"),
    pickList("inheritRecycle", "Co kończy obieg materialny")
  ];
  return `
    ${top("Po bliskich", "home")}
    <div class="pad">
      <div class="kicker">krok ${s} / 8</div>
      <div class="h2 mt-8">${steps[s-1]}</div>
      <div class="stepper">${steps.map((_,i)=>`<i class="${i<s?"on":""}"></i>`).join("")}</div>
      ${bodies[s-1]}
      ${s === 8 ? `<button class="btn btn-match btn-block mt-12" data-go="report">Generuj raport kolekcji</button>` : ""}
      ${s > 1 ? `<button class="btn btn-ghost btn-block mt-8" data-inherit="prev">Wstecz</button>` : ""}
    </div>`;
}
function pickList(key, label) {
  return `
    <p class="muted">${label}. Zaznaczenia są poglądowe.</p>
    <div class="stack mt-12">
      ${BEREK.items.map(i => {
        const on = state[key].includes(i.id);
        return `<button class="card press" data-toggle="${key}" data-id="${i.id}">
          <div class="between"><div><b>${i.title}</b><div class="small muted">${i.artist}</div></div><span class="badge ${on?"match":""}">${on?"wybrane":"pomiń"}</span></div>
        </button>`;
      }).join("")}
    </div>
    <button class="btn btn-primary btn-block mt-16" data-inherit="next">Dalej</button>`;
}

function viewReport() {
  const val = (ids) => ids.map(itemById).filter(Boolean).reduce((s,i)=>s+i.value,0);
  return `
    ${top("Raport kolekcji", "inherit")}
    <div class="pad">
      <div class="kicker">BEREK · dokument roboczy</div>
      <div class="h2 mt-8">Kolekcja po dziadku Ani</div>
      <p class="small muted mt-8">Partia demonstracyjna · Warszawa · 31.08.2026</p>
      <div class="card mt-16 kv">
        <span>Zachować</span><b>${state.inheritKeep.length} szt. · ${money(val(state.inheritKeep))}</b>
        <span>Sprzedać</span><b>${state.inheritSell.length} szt. · ${money(val(state.inheritSell))}</b>
        <span>Przekazać</span><b>${state.inheritGive.length} szt. · ${money(val(state.inheritGive))}</b>
        <span>Recykling</span><b>${state.inheritRecycle.length} szt. · ${money(val(state.inheritRecycle))}</b>
      </div>
      <p class="small muted mt-16">Raport nie zastępuje ekspertyzy. Służy do decyzji rodzinnych i dalszej pracy z ekspertem Berka.</p>
      <button class="btn btn-primary btn-block mt-16" data-act="save-report">Zapisz raport</button>
    </div>`;
}

function viewExperts() {
  return `
    ${top("Eksperci Berka", "home")}
    <div class="pad">
      <div class="h2">Potrzebuję pomocy</div>
      <p class="small muted mt-8">Katalogowanie, wycena, sortowanie, zdjęcia, czyszczenie, sprzedaż, transport.</p>
      <div class="stack mt-16">
        ${BEREK.experts.map(e => `
          <div class="card">
            <div class="between">
              <div>
                <div class="h3">${e.name}</div>
                <div class="small muted">${e.role} · ${e.city}</div>
              </div>
              <span class="tiny faint">${e.rate}</span>
            </div>
            <button class="btn btn-outline btn-sm mt-12" data-act="ask-expert" data-name="${e.name}">Wyślij zgłoszenie</button>
          </div>`).join("")}
      </div>
    </div>`;
}

function viewMatchesList() {
  return viewMatch();
}

const views = {
  home: viewHome,
  collection: viewCollection,
  item: viewItem,
  add: viewAdd,
  analyzing: viewAnalyzing,
  recognition: viewRecognition,
  wants: viewWants,
  "want-form": viewWantForm,
  find: viewFind,
  match: viewMatch,
  matches: viewMatchesList,
  negotiate: viewNegotiate,
  sell: viewSell,
  offer: viewOffer,
  social: viewSocial,
  give: viewGive,
  recycle: viewRecycle,
  profile: viewProfile,
  location: viewLocation,
  qr: viewQR,
  inherit: viewInherit,
  report: viewReport,
  experts: viewExperts
};

function render() {
  const app = $("#app");
  const fn = views[state.view] || viewHome;
  app.innerHTML = fn();
  $("#toast-slot").innerHTML = state.toast ? `<div class="toast">${state.toast}</div>` : "";
  document.querySelectorAll(".tabbar .tab").forEach(el => {
    const g = el.getAttribute("data-go");
    el.classList.toggle("active", g === state.view || (g==="wants" && ["wants","find","want-form"].includes(state.view)));
    if (el.classList.contains("plus")) el.classList.toggle("active", false);
  });
}

function bind() {
  document.body.addEventListener("click", (e) => {
    const t = e.target.closest("[data-go],[data-method],[data-filter],[data-cat],[data-act],[data-inherit],[data-toggle]");
    if (!t) return;

    if (t.dataset.go) {
      go(t.dataset.go, { id: t.dataset.id, org: t.dataset.org });
      return;
    }
    if (t.dataset.method) {
      state.addMethod = t.dataset.method;
      if (t.dataset.method === "manual") { go("recognition"); return; }
      go("analyzing");
      setTimeout(() => go("recognition"), 2200);
      return;
    }
    if (t.dataset.filter) { state.filter = t.dataset.filter; render(); return; }
    if (t.dataset.cat) { state.addCat = t.dataset.cat; render(); return; }
    if (t.dataset.inherit) {
      if (t.dataset.inherit === "next") state.inheritStep = Math.min(8, state.inheritStep + 1);
      if (t.dataset.inherit === "prev") state.inheritStep = Math.max(1, state.inheritStep - 1);
      render(); return;
    }
    if (t.dataset.toggle) {
      const key = t.dataset.toggle;
      const id = t.dataset.id;
      state[key] = state[key].includes(id) ? state[key].filter(x => x !== id) : state[key].concat(id);
      render(); return;
    }
    const act = t.dataset.act;
    if (act === "confirm-add") {
      toast("Dodano do kolekcji. Możesz jeszcze uzupełnić lokalizację.");
      go("collection");
    } else if (act === "fix-add") {
      toast("Tryb poprawiania — pola są edytowalne w pełnej wersji.");
    } else if (act === "save-want") {
      toast("Ogłoszenie „Szukam” jest widoczne w sieci Berek.");
      go("wants");
    } else if (act === "interested") {
      toast("Anna dostała sygnał. Możesz przejść do negocjacji.");
      go("negotiate");
    } else if (act === "later") {
      toast("Przypomnimy za 3 dni.");
      go("home");
    } else if (act === "not-sale") {
      const it = itemById("B84721");
      if (it) it.status = "Kolekcja prywatna";
      toast("Oznaczono jako nie na sprzedaż.");
      go("item", { id: "B84721" });
    } else if (act === "accept-neg") {
      state.negotiation.history.push({ who: "Ty", text: "Akceptacja " + state.negotiation.offer + " zł", time: "teraz" });
      toast("Uzgodniono cenę. Umówcie odbiór.");
      render();
    } else if (act === "counter-neg") {
      const val = ($("#counter") && $("#counter").value) || "230 zł";
      state.negotiation.history.push({ who: "Ty", text: "Kontrpropozycja: " + val, time: "teraz" });
      toast("Wysłano kontrpropozycję.");
      render();
    } else if (act === "reject-neg") {
      toast("Negocjacja zamknięta.");
      go("home");
    } else if (act === "share-offer") {
      toast("Link oferty skopiowany (demo).");
    } else if (act === "copy-post" || act === "share-post") {
      toast("Tekst i grafika gotowe do wklejenia. Bez automatycznej publikacji.");
    } else if (act === "donate") {
      toast("Zgłoszenie do: " + t.dataset.org + ". Fundacja Aleje Życia skontaktuje się w wersji produkcyjnej.");
    } else if (act === "pickup") {
      toast("Zgłoszono odbiór. Partner demo potwierdzi termin.");
    } else if (act === "save-loc") {
      toast("Lokalizacja zapisana.");
      go("item", { id: state.params.id || "B84721" });
    } else if (act === "set-loc") {
      toast("Wybrano: " + t.dataset.place);
    } else if (act === "print-qr") {
      toast("Etykieta QR w kolejce druku (demo).");
    } else if (act === "save-report") {
      toast("Raport zapisany w profilu Ani.");
    } else if (act === "ask-expert") {
      toast("Zgłoszenie wysłane do: " + t.dataset.name);
    }
  });

  document.body.addEventListener("input", (e) => {
    if (e.target.id === "colQ") {
      state.q = e.target.value;
      const pos = e.target.selectionStart;
      render();
      const el = $("#colQ");
      if (el) { el.focus(); el.setSelectionRange(pos, pos); }
    }
  });
}

function boot() {
  try {
    bind();
    render();
  } catch (err) {
    const app = document.getElementById("app");
    if (app) {
      app.innerHTML = '<div class="pad"><div class="h3">Błąd prototypu</div><p class="small muted mt-8">' + String(err) + "</p></div>";
    }
    console.error(err);
  }
}
boot();

