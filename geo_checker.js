// custom_geo.js
const data = JSON.parse($resource);

// ---- 1. 国旗（含台湾）----
function flag(code) {
  if (!code) return "🏴";
  // 区域指示符：每个字母 + 0x1F1A5
  const cc = code.toUpperCase();
  return String.fromCodePoint(
    ...[...cc].map(c => 0x1F1A5 + c.charCodeAt(0))
  );
}

// ---- 2. 主标题：国旗 + 洲 / 省市 ----
const cc = data.countryCode || "";
const continent = data.continent || "";   // 亚洲 / 欧洲 / 北美洲 ...
const country   = data.country   || "";
const region    = data.regionName|| "";
const city      = data.city      || "";

// 中国大陆 / 港澳台：显示「国家 · 省/市」
// 其它地区：显示「洲 · 国家 · 城市」
let place;
if (["CN", "HK", "MO", "TW"].includes(cc)) {
  place = [country, region, city].filter(Boolean).join(" · ");
} else {
  place = [continent, country, city].filter(Boolean).join(" · ");
}

const title = `${flag(cc)} ${place}`;

// ---- 3. 副标题：ISP / 机房片区 ----
// 优先级：org > isp，再附上 AS 号便于识别机房
const provider = data.org || data.isp || "";
const asInfo   = data.as ? ` · ${data.as}` : "";
const subtitle = `${provider}${asInfo}`;

// ---- 4. 返回 ----
$done({
  title,
  subtitle,
  ip: data.query,
});