// geo_checker.js — ipinfo.io 定制版
var data = JSON.parse($response.body);

// 国家代码 → 国旗 emoji（含 TW 🇹🇼）
function toFlag(code) {
  return [...(code || 'UN').toUpperCase()]
    .map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65))
    .join('');
}

var flag   = toFlag(data.country);
var city   = data.city   || '';
var region = data.region || '';
var org    = data.org    || '';  // 格式: "AS4812 China Telecom (Group)"

// ── 主标题：国旗 + 城市, 省/州 ──
var locParts = [];
if (city)                    locParts.push(city);
if (region && region !== city) locParts.push(region);
var title = flag + ' ' + (locParts.join(', ') || data.country);

// ── 副标题：拆分 ASN 和运营商名称 ──
// org 原始示例: "AS9808 China Mobile Communications Group Co., Ltd."
var asnMatch = org.match(/^(AS\d+)\s+(.+)$/);
var subtitle = asnMatch
  ? asnMatch[1] + ' · ' + asnMatch[2]   // AS9808 · China Mobile ...
  : org;

$done({
  country:      title,
  ip:           data.ip,
  organization: subtitle
});
