/**
 * Quantumult X — Custom Geo Location Checker (English, hardened)
 *
 * Turn DEBUG = true once to see the raw API JSON in the subtitle.
 * That immediately tells you which fields the API is actually returning.
 */
const DEBUG = false;

const raw = (() => {
  try { return JSON.parse($resource); }
  catch (e) { return { status: "error", message: "Bad JSON" }; }
})();

// ---------- Debug short-circuit ----------
if (DEBUG) {
  $done({
    title: "DEBUG",
    subtitle: JSON.stringify(raw).slice(0, 180),
    ip: raw.query || "—",
  });
  return;
}

// ---------- Helpers ----------
const FLAG_OVERRIDES = {
  // Use a text fallback if your iOS region hides specific flags.
  // TW: "TW",
};

function flag(code) {
  if (!code) return "🏳️";
  if (FLAG_OVERRIDES[code]) return FLAG_OVERRIDES[code];
  if (code.length !== 2) return "🏳️";
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

function tags(d) {
  const t = [];
  if (d.mobile)  t.push("Mobile");
  if (d.proxy)   t.push("Proxy");
  if (d.hosting) t.push("Hosting");
  return t.length ? `  [${t.join("/")}]` : "";
}

// ---------- Fail-safe ----------
if (raw.status && raw.status !== "success") {
  $done({
    title: `${flag("")} Location unavailable`,
    subtitle: raw.message || "Geo lookup failed",
    ip: raw.query || "—",
  });
  return;
}

// ---------- Title ----------
const cc        = raw.countryCode  || "";
const continent = CONTINENT_MAP[raw.continentCode] || raw.continent || "";
const country   = raw.country      || "Unknown";
const region    = raw.regionName   || "";
const city      = raw.city         || "";

const CITY_LIKE = new Set(["HK", "MO", "SG", "MC", "VA", "GI"]);

let place;
if (CITY_LIKE.has(cc)) {
  place = joinParts([country, city]);          // e.g. Hong Kong · Central
} else if (cc === "TW") {
  place = joinParts(["Asia", "Taiwan", city || region]);
} else {
  place = joinParts([continent, country, region, city]);
}

const title = `${flag(cc)} ${place}`;

// ---------- Subtitle ----------
const provider = raw.org || raw.isp || "Unknown ISP";

let asLine = "";
if (raw.as) {
  const m = raw.as.match(/^(AS\d+)\s*(.*)$/);
  asLine = m ? ` · ${m[1]}${m[2] ? " " + m[2] : ""}` : ` · ${raw.as}`;
} else if (raw.asname) {
  asLine = ` · ${raw.asname}`;
}

const subtitle = `${provider}${asLine}${tags(raw)}`;

// ---------- Return ----------
$done({
  title,
  subtitle,
  ip: raw.query || "—",
});