const { ApiError } = require('./api-client');

// creates the series and a sensor for every definition of the source (if they do not exist yet)
// and remembers the sensor keys in `entries` ({ series name: { seriesId, sensorId, apiKey } })
async function setup(client, source, entries, { user, password }) {
  const token = await client.login(user, password);
  try {
    const existing = await client.listSeries();

    for (const def of source.series) {
      let series = existing.find((s) => s.name === def.name);
      if (!series) {
        series = await client.createSeries(token, {
          name: def.name, minValue: def.minValue, maxValue: def.maxValue,
          color: def.color, icon: def.icon, unit: def.unit,
        });
        console.log(`Utworzono serię: ${def.name}`);
      }

      const entry = entries[def.name];
      if (entry && entry.seriesId === series.id) {
        console.log(`Seria ${def.name}: czujnik już istnieje.`);
        continue;
      }
      const sensor = await client.createSensor(token, { name: def.sensorName, seriesId: series.id });
      entries[def.name] = { seriesId: series.id, sensorId: sensor.id, apiKey: sensor.apiKey };
      console.log(`Zarejestrowano czujnik: ${def.sensorName}`);
    }
  } finally {
    await client.logout(token).catch(() => {});
  }
}

// sends the points that the series does not have yet (the same timestamp is never sent twice)
async function sendNew(client, entry, points) {
  const result = { sent: 0, skipped: 0, rejected: 0 };
  if (points.length === 0) return result;

  const stored = await client.listMeasurements({
    series: entry.seriesId,
    from: points[0].timestamp,
    to: points[points.length - 1].timestamp,
    limit: 10000,
  });
  const known = new Set(stored.map((m) => Date.parse(m.timestamp)));

  for (const point of points) {
    if (known.has(Date.parse(point.timestamp))) {
      result.skipped += 1;
      continue;
    }
    try {
      await client.sendMeasurement(entry.apiKey, point);
      result.sent += 1;
    } catch (err) {
      // 422 = value outside the range of the series, the rest of the data is still sent
      if (err instanceof ApiError && err.status === 422) {
        console.warn(`Odrzucono ${point.timestamp} (${point.value}): ${err.message}`);
        result.rejected += 1;
      } else {
        throw err;
      }
    }
  }
  return result;
}

// fetches the data from the source and sends it, series by series
async function run(client, source, entries) {
  for (const def of source.series) {
    const entry = entries[def.name];
    if (!entry) {
      throw new Error(`Brak klucza dla serii "${def.name}". Uruchom najpierw polecenie setup.`);
    }
    try {
      const points = await source.fetchPoints(def);
      const r = await sendNew(client, entry, points);
      console.log(`${def.name}: wysłano ${r.sent}, pominięto ${r.skipped}, odrzucono ${r.rejected}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        throw new Error(`Klucz serii "${def.name}" nie działa (czujnik lub seria usunięte?). Uruchom ponownie setup.`);
      }
      console.error(`${def.name}: ${err.message}`);
    }
  }
}

module.exports = { setup, sendNew, run };
