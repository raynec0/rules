// Daily NodeSeek check-in using previously captured headers
const NS_HEADER_KEY = "NS_NodeseekHeaders";
const NS_LAST_RESULT = "NS_LastResult";

function formatTime(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function saveResult(obj) {
  $persistentStore.write(JSON.stringify(obj), NS_LAST_RESULT);
}

const raw = $persistentStore.read(NS_HEADER_KEY);
if (!raw) {
  saveResult({
    time: formatTime(new Date()),
    statusText: "❌ Missing headers",
    style: "error",
    message: "Open your NodeSeek profile page once first.",
  });
  $notification.post("NodeSeek", "Check-in failed", "Missing saved headers");
  $done();
}

let savedHeaders = {};
try {
  savedHeaders = JSON.parse(raw) || {};
} catch (e) {
  saveResult({
    time: formatTime(new Date()),
    statusText: "❌ Bad headers",
    style: "error",
    message: "Saved headers are corrupted. Re-open your profile page.",
  });
  $notification.post("NodeSeek", "Check-in failed", "Saved headers are corrupted");
  $done();
}

const headers = {
  "Connection": savedHeaders["Connection"] || "keep-alive",
  "Accept-Encoding": savedHeaders["Accept-Encoding"] || "gzip, deflate, br",
  "Priority": savedHeaders["Priority"] || "u=3, i",
  "Content-Type": savedHeaders["Content-Type"] || "text/plain;charset=UTF-8",
  "Origin": savedHeaders["Origin"] || "https://www.nodeseek.com",
  "refract-sign": savedHeaders["refract-sign"] || "",
  "User-Agent":
    savedHeaders["User-Agent"] ||
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7.2 Mobile/15E148 Safari/604.1",
  "refract-key": savedHeaders["refract-key"] || "",
  "Sec-Fetch-Mode": savedHeaders["Sec-Fetch-Mode"] || "cors",
  "Cookie": savedHeaders["Cookie"] || "",
  "Host": savedHeaders["Host"] || "www.nodeseek.com",
  "Referer": savedHeaders["Referer"] || "https://www.nodeseek.com/sw.js?v=0.3.33",
  "Accept-Language": savedHeaders["Accept-Language"] || "zh-CN,zh-Hans;q=0.9",
  "Accept": savedHeaders["Accept"] || "*/*",
};

$httpClient.post(
  {
    url: "https://www.nodeseek.com/api/attendance?random=true",
    headers,
    body: "",
    timeout: 10,
    "auto-cookie": false,
  },
  (error, response, data) => {
    const now = formatTime(new Date());
    const body = String(data || "");
    const status = response ? (response.status || response.statusCode || 0) : 0;

    let message = "";
    try {
      const parsed = JSON.parse(body);
      message = String(parsed?.message || "");
    } catch {}

    if (error) {
      saveResult({
        time: now,
        statusText: "❌ Request error",
        style: "error",
        message: String(error),
      });
      $notification.post("NodeSeek", "Check-in failed", String(error));
      return $done();
    }

    if (body.includes("Just a moment") || body.includes("<!DOCTYPE html")) {
      saveResult({
        time: now,
        statusText: "⚠️ Cloudflare",
        style: "alert",
        message: "Blocked by Cloudflare challenge",
      });
      $notification.post("NodeSeek", "Check-in blocked", "Cloudflare challenge");
      return $done();
    }

    if (status >= 200 && status < 300) {
      const finalMsg = message || "Check-in succeeded";
      saveResult({
        time: now,
        statusText: "✅ Success",
        style: "good",
        message: finalMsg,
      });
      $notification.post("NodeSeek", "Check-in success", finalMsg);
      return $done();
    }

    if (status === 403) {
      const finalMsg = message || body || "403 blocked";
      saveResult({
        time: now,
        statusText: "⚠️ 403",
        style: "alert",
        message: finalMsg,
      });
      $notification.post("NodeSeek", "Check-in blocked", finalMsg);
      return $done();
    }

    const finalMsg = message || body || `HTTP ${status}`;
    saveResult({
      time: now,
      statusText: `⚠️ ${status || "Unknown"}`,
      style: "alert",
      message: finalMsg,
    });
    $notification.post("NodeSeek", "Check-in abnormal", finalMsg);
    $done();
  }
);