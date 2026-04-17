// ==NS Checkin QX (FIXED)==

const NS_HEADER_KEY = "NS_NodeseekHeaders";
const NS_LAST_RESULT = "NS_LastResult";

function formatTime(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function saveResult(obj) {
  $prefs.setValueForKey(JSON.stringify(obj), NS_LAST_RESULT);
}

const raw = $prefs.valueForKey(NS_HEADER_KEY);

if (!raw) {
  saveResult({
    time: formatTime(new Date()),
    statusText: "❌ Missing headers",
    message: "Open NodeSeek once while logged in"
  });

  $notify("NodeSeek", "Check-in Failed", "Missing headers");
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

$task.fetch({
  url: "https://www.nodeseek.com/api/attendance?random=true",
  method: "POST",
  headers: headers,
  body: ""
}).then(response => {

  const now = formatTime(new Date());
  const body = response.body || "";
  const status = response.statusCode;

  let msg = "";
  try {
    msg = JSON.parse(body)?.message || "";
  } catch {}

  // Cloudflare block
  if (body.includes("Just a moment") || body.includes("<!DOCTYPE html")) {
    saveResult({
      time: now,
      statusText: "⚠️ Cloudflare",
      message: "Blocked by CF"
    });

    $notify("NodeSeek", "Blocked", "Cloudflare");
    return;
  }

  // success
  if (status >= 200 && status < 300) {
    const final = msg || "Check-in success";

    saveResult({
      time: now,
      statusText: "✅ Success",
      message: final
    });

    $notify("NodeSeek", "Success", final);
    return;
  }

  // fail
  const final = msg || body || `HTTP ${status}`;

  saveResult({
    time: now,
    statusText: "⚠️ Failed",
    message: final
  });

  $notify("NodeSeek", "Failed", final);

}, reason => {

  const now = formatTime(new Date());

  saveResult({
    time: now,
    statusText: "❌ Request error",
    message: String(reason)
  });

  $notify("NodeSeek", "Error", String(reason));

}).finally(() => {
  $done();
});
