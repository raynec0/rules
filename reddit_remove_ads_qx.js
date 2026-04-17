/*
 * Reddit remove ads for Quantumult X
 * 说明：
 * - 这是基于“通用 GraphQL JSON 递归清洗”的替代版，不是原 jq 的逐字翻译
 * - 目标：尽量移除 promoted / ad / advertisement / sponsored 一类对象
 * - 适配：QX script-response-body
 */

function isObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

function isAdLike(obj) {
  if (!obj || typeof obj !== "object") return false;

  const text = JSON.stringify(obj).toLowerCase();

  // 常见广告标记
  const hitKeywords = [
    '"promoted"',
    '"ispromoted":true',
    '"ad"',
    '"ads"',
    '"advertisement"',
    '"sponsored"',
    '"isad":true',
    '"adpayload"',
    '"adcontext"',
    '"adswebview"',
    '"promotedmetadata"',
    '"displayad"',
    '"bannerad"',
    '"slotname":"ad',
    '"typename":"ad',
    '"nodetypename":"ad'
  ];

  if (hitKeywords.some(k => text.includes(k))) return true;

  // 一些更“结构化”的判断
  if (obj.isPromoted === true) return true;
  if (obj.isAd === true) return true;
  if (obj.promoted === true) return true;
  if (typeof obj.__typename === "string" && /ad|promoted|sponsored/i.test(obj.__typename)) return true;
  if (typeof obj.nodeType === "string" && /ad|promoted|sponsored/i.test(obj.nodeType)) return true;
  if (typeof obj.type === "string" && /ad|promoted|sponsored/i.test(obj.type)) return true;
  if (typeof obj.kind === "string" && /ad|promoted|sponsored/i.test(obj.kind)) return true;

  return false;
}

function clean(value) {
  if (Array.isArray(value)) {
    const out = [];
    for (const item of value) {
      if (isAdLike(item)) continue;
      out.push(clean(item));
    }
    return out;
  }

  if (isObject(value)) {
    if (isAdLike(value)) return null;

    const out = {};
    for (const [key, val] of Object.entries(value)) {
      // 明显广告字段直接丢弃
      if (/^(ad|ads|advertisement|advertisements|promoted|promotion|sponsored)$/i.test(key)) {
        continue;
      }

      const cleaned = clean(val);

      // 删除被清空的广告对象
      if (cleaned === null) continue;

      out[key] = cleaned;
    }
    return out;
  }

  return value;
}

try {
  const obj = JSON.parse($response.body);
  const cleaned = clean(obj);
  $done({ body: JSON.stringify(cleaned) });
} catch (e) {
  console.log("reddit_remove_ads_qx error: " + e);
  $done({});
}