/**
 * Quantumult X — Custom Geo Location Checker (English)
 * Title    : <flag> <Continent> · <Country> · <Region/City>
 * Subtitle : <ISP / Org> · <AS number AS-name>
 */

const raw = (() => {
  try { return JSON.parse($resource); }
  catch (e) { return {}; }
})();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Build a regional-indicator flag from any 2-letter ISO code.
function flag(code) {
  if (!code || code.length !== 2) return "🏳️";
  const cc = code.toUpperCase();
  return String.fromCodePoint(
    ...[...cc].map(c => 0x1F1A5 + c.charCodeAt(0))
  );
}

// Pretty continent name (ip-api already returns English, but normalize edge cases).
const CONTINENT_MAP = {
  AF: "Africa",
  AN: "Antarctica",
  AS: "Asia",
  EU: "Europe",
  NA: "North America",
  OC: "Oceania",
  SA: "South America",
};

// Dedupe adjacent identical segments and drop empties.
function joinParts(parts, sep = " · ") {
  const out = [];
  for (const p of parts.map(s => (s || "").trim()).filter(Boolean)) {
    if (out[out.length - 1]?.toLowerCase() !== p.toLowerCase()) out.push(p);
  }
  return out.join(sep);
}

// Tag mobile / proxy / hosting networks so suspicious nodes are visible.
function tags(d) {
  const t = [];
  if (d.mobile)  t.push("Mobile");
  if (d.proxy)   t.push("Proxy");
  if (d.hosting) t.push("Hosting");
  return t.length ? `  [${t.join("/")}]` : "";
}

// ---------------------------------------------------------------------------
// Fail-safe: API returned an error or empty body
// ---------------------------------------------------------------------------
if (raw.status && raw.status !== "success") {
  $done({
    title: "🏳️ Location unavailable",
    subtitle: raw.message || "Geo lookup failed",
    ip: "—",
  });
  return;
}

// ---------------------------------------------------------------------------
// Title — flag + place
// ---------------------------------------------------------------------------
const cc        = raw.countryCode  || "";
const continent = CONTINENT_MAP[raw.continentCode] || raw.continent || "";
const country   = raw.country      || "Unknown";
const region    = raw.regionName   || "";
const city      = raw.city         || "";

// Special-case city-states / SARs so we don't print "Hong Kong · Hong Kong · Hong Kong".
const CITY_LIKE = new Set(["HK", "MO", "SG", "MC", "VA", "GI"]);

let place;
if (CITY_LIKE.has(cc)) {
  place = joinParts([country, city]);
} else if (cc === "TW") {
  // Always show Taipei/Kaohsiung/etc. and skip redundant "Taiwan" duplication.
  place = joinParts(["Asia", "Taiwan", city || region]);
} else {
  place = joinParts([continent, country, region, city]);
}

const title = `${flag(cc)} ${place}`;

// ---------------------------------------------------------------------------
// Subtitle — provider + AS info
// ---------------------------------------------------------------------------
// Prefer `org` (more specific datacenter / brand) then fall back to `isp`.
const provider = raw.org || raw.isp || "Unknown ISP";

// `as` looks like "AS3462 HINET"; split into number + name for nicer rendering.
let asLine = "";
if (raw.as) {
  const m = raw.as.match(/^(AS\d+)\s*(.*)$/);
  asLine = m ? ` · ${m[1]}${m[2] ? " " + m[2] : ""}` : ` · ${raw.as}`;
} else if (raw.asname) {
  asLine = ` · ${raw.asname}`;
}

const subtitle = `${provider}${asLine}${tags(raw)}`;

// ---------------------------------------------------------------------------
// Return
// ---------------------------------------------------------------------------
$done({
  title,
  subtitle,
  ip: raw.query || "—",
});