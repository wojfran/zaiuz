// Data generator: takes measurements from a source and sends them to the API as sensors.
//
//   node generator/cli.js setup    --source gios --api https://adres   (series + sensors, once)
//   node generator/cli.js backfill --source gios --api https://adres   (send the available history)
//   node generator/cli.js live     --source gios --api https://adres   (repeat every --interval minutes)
//
// Admin login for setup: ADMIN_USER and ADMIN_PASSWORD (environment) or --user / --password.
const { parseArgs } = require('util');
const { createClient } = require('./api-client');
const keys = require('./keys');
const { setup, run } = require('./sync');

const SOURCES = {
  gios: require('./sources/gios'),
  synthetic: require('./sources/synthetic'),
};

const USAGE = `Użycie: node generator/cli.js <setup|backfill|live> [opcje]
  --source gios|synthetic   źródło danych (domyślnie gios)
  --api <url>               adres API (domyślnie API_URL lub http://localhost:3000)
  --interval <minuty>       odstęp między odczytami w trybie live (domyślnie 30)
  --user, --password        dane administratora dla setup (domyślnie ADMIN_USER, ADMIN_PASSWORD)`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      source: { type: 'string', default: 'gios' },
      api: { type: 'string', default: process.env.API_URL || 'http://localhost:3000' },
      interval: { type: 'string', default: '30' },
      user: { type: 'string', default: process.env.ADMIN_USER },
      password: { type: 'string', default: process.env.ADMIN_PASSWORD },
    },
  });

  const command = positionals[0];
  const source = SOURCES[values.source];
  const interval = Number(values.interval);
  if (!['setup', 'backfill', 'live'].includes(command) || !source || !(interval > 0)) {
    console.error(USAGE);
    process.exit(1);
  }

  const apiUrl = values.api.replace(/\/+$/, '');
  const client = createClient(apiUrl);
  const all = keys.load();
  const entries = (all[apiUrl] = all[apiUrl] || {});

  if (command === 'setup') {
    if (!values.user || !values.password) {
      throw new Error('Podaj dane administratora (ADMIN_USER i ADMIN_PASSWORD lub --user i --password).');
    }
    await setup(client, source, entries, { user: values.user, password: values.password });
    keys.save(all);
    console.log(`Klucze czujników zapisano w ${keys.FILE}`);
  } else if (command === 'backfill') {
    await run(client, source, entries);
  } else {
    console.log(`Tryb live: odczyt co ${interval} min, zatrzymanie: Ctrl+C`);
    for (;;) {
      await run(client, source, entries);
      await sleep(interval * 60 * 1000);
    }
  }
}

main().catch((err) => {
  console.error(`Błąd: ${err.message}`);
  process.exit(1);
});
