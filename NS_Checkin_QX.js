// ==NS Checkin QX==

const NS_HEADER_KEY = "NS_NodeseekHeaders";
const NS_LAST_RESULT = "NS_LastResult";

function formatTime(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function saveResult(obj) {
  $persistentStore.write(JSON.stringify(obj), NS_LAST_RESULT);
}

const raw = $persistentStore.read(NS_HEADER_KEY);

if (!raw) {
  saveResult({
    time: formatTime(new Date()),
    statusText: "❌ Missing headers",
    message: "Open NodeSeek once"
  });
  $notification.post("NodeSeek", "Check-in failed", "Missing headers");
  $done();
  return;
}

let headers = {};
try {
  headers = JSON.parse(raw);
} catch {
  $done();
  return;
}

$httpClient.post(
  {
    url: "https://www.nodeseek.com/api/attendance?random=true",
    headers,
    body: ""
  },
  (error, response, data) => {
    const now = formatTime(new Date());
    const body = String(data || "");
    const status = response?.status || 0;

    let msg = "";
    try {
      msg = JSON.parse(body)?.message || "";
    } catch {}

    if (error) {
      saveResult({ time: now, statusText: "❌ Error", message: error });
      $notification.post("NodeSeek", "Error", error);
      return $done();
    }

    if (status >= 200 && status < 300) {
      const final = msg || "Success";
      saveResult({ time: now, statusText: "✅ Success", message: final });
      $notification.post("NodeSeek", "Check-in success", final);
      return $done();
    }

    const final = msg || body || `HTTP ${status}`;
    saveResult({ time: now, statusText: "⚠️ Failed", message: final });
    $notification.post("NodeSeek", "Check-in failed", final);

    $done();
  }
);
