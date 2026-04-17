// ==NS Capture Account Response==
// Save raw account response + parsed account info

const NS_ACCOUNT_KEY = "NS_AccountInfo";
const NS_ACCOUNT_RAW_KEY = "NS_AccountRaw";

function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

function findFirstDeep(obj, keys) {
  if (!obj || typeof obj !== "object") return "";
  const wanted = new Set(keys.map(k => k.toLowerCase()));
  const queue = [obj];
  const seen = new Set();

  while (queue.length) {
    const cur = queue.shift();
    if (!cur || typeof cur !== "object" || seen.has(cur)) continue;
    seen.add(cur);

    for (const [k, v] of Object.entries(cur)) {
      if (wanted.has(String(k).toLowerCase()) && v !== null && v !== undefined && String(v).trim() !== "") {
        return String(v).trim();
      }
      if (v && typeof v === "object") queue.push(v);
    }
  }
  return "";
}

try {
  const body = String(($response && $response.body) || "");
  if (body) {
    $persistentStore.write(body, NS_ACCOUNT_RAW_KEY);
  }

  const parsed = safeParse(body);
  if (!parsed) {
    console.log("[NS] response body is not valid JSON");
    $done({});
    return;
  }

  const root = parsed.data || parsed.result || parsed;

  const account = {
    username: findFirstDeep(root, [
      "username", "userName", "nickname", "nickName", "name",
      "displayName", "login", "accountName", "screenName"
    ]),
    level: findFirstDeep(root, [
      "level", "rank", "grade", "vipLevel", "lv"
    ]),
    assets: findFirstDeep(root, [
      "assets", "asset", "chicken", "chickenLegs", "coin",
      "coins", "points", "score", "balance"
    ]),
    updatedAt: new Date().toLocaleString("zh-CN")
  };

  $persistentStore.write(JSON.stringify(account), NS_ACCOUNT_KEY);
  console.log("[NS] account saved: " + JSON.stringify(account));
} catch (e) {
  console.log("[NS] capture response failed: " + e);
}

$done({});