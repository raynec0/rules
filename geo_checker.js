try {
  var data = JSON.parse($response.body);

  function toFlag(code) {
    var upper = (code || 'UN').toUpperCase();
    var flag = '';
    for (var i = 0; i < upper.length; i++) {
      flag += String.fromCodePoint(0x1F1E6 + upper.charCodeAt(i) - 65);
    }
    return flag;
  }

  var flag   = toFlag(data.country);
  var city   = data.city   || '';
  var region = data.region || '';
  var org    = data.org    || '';

  var locParts = [];
  if (city) locParts.push(city);
  if (region && region !== city) locParts.push(region);
  var loc = flag + ' ' + (locParts.length > 0 ? locParts.join(', ') : data.country);

  var m = org.match(/^(AS\d+)\s+(.+)$/);
  var subtitle = m ? m[1] + ' · ' + m[2] : org;

  $done({
    country:      loc,
    ip:           data.ip,
    organization: subtitle
  });

} catch(e) {
  $done({
    country:      'ERR: ' + e.message,
    ip:           'check org field',
    organization: $response ? $response.body.substring(0, 80) : 'no response'
  });
}
