// ==NS Capture All for QX (FINAL)==

const NS_HEADER_KEY = "NS_NodeseekHeaders";
const NS_ACCOUNT_KEY = "NS_AccountInfo";
const NS_ACCOUNT_RAW_KEY = "NS_AccountRaw";

// ========= HEADER CAPTURE =========
if (typeof $request !== "undefined") {
  try {
    const headers = $request.headers || {};

    const filtered = {
      "User-Agent": headers["User-Agent"],
      "Cookie": headers["Cookie"],
      "Origin": headers["Origin"],
      "Referer": headers["Referer"],
      "Accept": headers["Accept"],
      "Accept-Language": headers["Accept-Language"],
      "Content-Type": headers["Content-Type"],
      "refract-key": headers["refract-key"],
      "refract-sign": headers["refract-sign"]
    };

    $persistentStore.write(JSON.stringify(filtered), NS_HEADER_KEY);

    // ✅ ADD THIS
    $notification.post("NS Debug", "Headers Captured", "Success");

  } catch (e) {
    $notification.post("NS Debug", "Header Failed", String(e));
  }

  $done({});
  return;
}

// ========= RESPONSE CAPTURE =========
function safeParse(text) {
  try { return JSON.parse(text); } catch { return null; }
}

function findFirstDeep(obj, keys) {
  if (!obj || typeof obj !== "object") return "";

  const wanted = new Set(keys.map(k => k.toLowerCase()));
  const queue = [obj];

  while (queue.length) {
    const cur = queue.shift();
    if (!cur || typeof cur !== "object") continue;

    for (const [k, v] of Object.entries(cur)) {
      if (
        wanted.has(k.toLowerCase()) &&
        v !== null &&
        String(v).trim() !== ""
      ) {
        return String(v).trim();
      }
      if (typeof v === "object") queue.push(v);
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
    $done({});
    return;
  }

  const root = parsed.data || parsed.result || parsed;

  const account = {
    username: findFirstDeep(root, [
      "username","userName","nickname","name","displayName"
    ]),
    level: findFirstDeep(root, [
      "level","rank","vipLevel","lv"
    ]),
    assets: findFirstDeep(root, [
      "assets","coin","points","balance","score"
    ]),
    updatedAt: new Date().toLocaleString()
  };

  $persistentStore.write(JSON.stringify(account), NS_ACCOUNT_KEY);
  console.log("[NS] account saved");

} catch (e) {
  console.log("[NS] response parse failed: " + e);
}

$done({});
