/**
 * Quantumult X — Custom Geo Location Checker (English, final)
 *
 * Flip DEBUG to true to see the raw API JSON in the subtitle.
 */
const DEBUG = false;

// ---------- Parse ----------
let raw;
try {
  raw = JSON.parse($resource);
} catch (e) {
  raw = { status: "error", message: "Bad JSON from API" };
}

// ---------- Helpers ----------
const FLAG_OVERRIDES = {
  // TW: "[TW]",   // uncomment if your iOS region hides 🇹🇼
};

function flag(code) {
  if (FLAG_OVERRIDES[code]) return FLAG_OVERRIDES[code];
  if (!code || code.length !== 2) return "🏳️";
  const cc = code.toUpperCase();
  return String.fromCodePoint(
    ...[...cc].map(c => 0x1F1A5 + c.charCodeAt(0))
  );
}

const CONTINENT_MAP = {
  AF: "Africa", AN: "Antarctica", AS: "Asia", EU: "Europe",
  NA: "North America", OC: "Oceania", SA: "South America",
};

function joinParts(parts, sep = " · ") {
  const out = [];
  for (const p of parts.map(s => (s || "").trim()).filter(Boolean)) {
    if (out[out.length - 1]?.toLowerCase() !== p.toLowerCase()) out.push(p);
  }
  return out.join(sep);
}

function tagSuffix(d) {
  const t = [];
  if (d.mobile)  t.push("Mobile");
  if (d.proxy)   t.push("Proxy");
  if (d.hosting) t.push("Hosting");
  return t.length ? `  [${t.join("/")}]` : "";
}

// ---------- Build output ----------
let title, subtitle, ip;

if (DEBUG) {
  title    = "DEBUG";
  subtitle = JSON.stringify(raw).slice(0, 200);
  ip       = raw.query || "—";
} else if (raw.status && raw.status !== "success") {
  title    = `${flag("")} Location unavailable`;
  subtitle = raw.message || "Geo lookup failed";
  ip       = raw.query || "—";
} else {
  const cc        = raw.countryCode  || "";
  const continent = CONTINENT_MAP[raw.continentCode] || raw.continent || "";
  const country   = raw.country      || "Unknown";
  const region    = raw.regionName   || "";
  const city      = raw.city         || "";

  const CITY_LIKE = new Set(["HK", "MO", "SG", "MC", "VA", "GI"]);

  let place;
  if (CITY_LIKE.has(cc)) {
    place = joinParts([country, city]);
  } else if (cc === "TW") {
    place = joinParts(["Asia", "Taiwan", city || region]);
  } else {
    place = joinParts([continent, country, region, city]);
  }

  title = `${flag(cc)} ${place}`;

  const provider = raw.org || raw.isp || "Unknown ISP";

  let asLine = "";
  if (raw.as) {
    const m = raw.as.match(/^(AS\d+)\s*(.*)$/);
    asLine = m ? ` · ${m[1]}${m[2] ? " " + m[2] : ""}` : ` · ${raw.as}`;
  } else if (raw.asname) {
    asLine = ` · ${raw.asname}`;
  }

  subtitle = `${provider}${asLine}${tagSuffix(raw)}`;
  ip       = raw.query || "—";
}

// ---------- Return ----------
$done({ title, subtitle, ip });