// Sensor keys are shown by the API only once, so the generator keeps them in a local file.
// Format: { "<api url>": { "<series name>": { seriesId, sensorId, apiKey } } }
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'keys.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return {};
  }
}

function save(keys) {
  fs.writeFileSync(FILE, JSON.stringify(keys, null, 2) + '\n', { mode: 0o600 });
}

module.exports = { load, save, FILE };
