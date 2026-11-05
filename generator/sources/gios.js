// Source: air quality from GIOŚ (https://api.gios.gov.pl), PM10 from Warsaw stations.
// Hourly values, newest first, in local Polish time.

const API = 'https://api.gios.gov.pl/pjp-api/v1/rest';

const PM10 = { minValue: 0, maxValue: 500, icon: 'cloud', unit: 'µg/m³' };

// sensorId = "stanowisko" of the PM10 indicator on the station (from /station/sensors/{stationId})
const series = [
  { ...PM10, name: 'PM10 – Warszawa, Al. Niepodległości', color: '#1f77b4',
    sensorName: 'GIOŚ MzWarAlNiepo', sensorId: 3584 },
  { ...PM10, name: 'PM10 – Warszawa, ul. Tołstoja', color: '#ff7f0e',
    sensorName: 'GIOŚ MzWarTolstoj', sensorId: 3654 },
  { ...PM10, name: 'PM10 – Warszawa, ul. Kondratowicza', color: '#2ca02c',
    sensorName: 'GIOŚ MzWarKondrat', sensorId: 3764 },
];

const zoneFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Europe/Warsaw', hourCycle: 'h23',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
});

// difference (local time - UTC) in ms for the given moment
function offsetMs(utcMs) {
  const p = {};
  for (const part of zoneFormat.formatToParts(new Date(utcMs))) p[part.type] = part.value;
  const local = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return local - Math.floor(utcMs / 1000) * 1000;
}

// "2026-11-05 14:00:00" (Warsaw time) -> Date in UTC, null for a wrong format
function warsawToUtc(text) {
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(text);
  if (!m) return null;
  const asUtc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
  // second pass for times close to the change between summer and winter time
  const first = asUtc - offsetMs(asUtc);
  return new Date(asUtc - offsetMs(first));
}

// returns [{ timestamp (ISO, UTC), value }] from the oldest to the newest
async function fetchPoints(def) {
  const res = await fetch(`${API}/data/getData/${def.sensorId}?size=500`, {
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`GIOŚ odpowiedział kodem ${res.status}`);
  const data = await res.json();

  return (data['Lista danych pomiarowych'] || [])
    .filter((row) => typeof row['Wartość'] === 'number') // hours without a result are null
    .map((row) => ({ time: warsawToUtc(row['Data']), value: row['Wartość'] }))
    .filter((p) => p.time)
    .map((p) => ({ timestamp: p.time.toISOString(), value: p.value }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

module.exports = { name: 'gios', series, fetchPoints, warsawToUtc };
