// ==NS Checkin QX (FINAL)==

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
    message: "Open NodeSeek once while logged in"
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

// ensure required headers exist
headers["User-Agent"] ||= "Mozilla/5.0";
headers["Accept"] ||= "*/*";
headers["Content-Type"] ||= "text/plain;charset=UTF-8";

$httpClient.post(
  {
    url: "https://www.nodeseek.com/api/attendance?random=true",
    headers,
    body: "",
    timeout: 10
  },
  (error, response, data) => {
    const now = formatTime(new Date());
    const body = String(data || "");
    const status = response?.status || 0;

    let msg = "";
    try {
      msg = JSON.parse(body)?.message || "";
    } catch {}

    // network error
    if (error) {
      saveResult({
        time: now,
        statusText: "❌ Request error",
        message: String(error)
      });

      $notification.post("NodeSeek", "Error", String(error));
      return $done();
    }

    // cloudflare block
    if (body.includes("Just a moment") || body.includes("<!DOCTYPE html")) {
      saveResult({
        time: now,
        statusText: "⚠️ Cloudflare",
        message: "Blocked by CF"
      });

      $notification.post("NodeSeek", "Blocked", "Cloudflare");
      return $done();
    }

    // success
    if (status >= 200 && status < 300) {
      const final = msg || "Check-in success";

      saveResult({
        time: now,
        statusText: "✅ Success",
        message: final
      });

      $notification.post("NodeSeek", "Success", final);
      return $done();
    }

    // fail
    const final = msg || body || `HTTP ${status}`;

    saveResult({
      time: now,
      statusText: "⚠️ Failed",
      message: final
    });

    $notification.post("NodeSeek", "Failed", final);
    $done();
  }
);
