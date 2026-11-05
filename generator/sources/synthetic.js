// Source: generated data (daily cycle + noise), for tests without internet access.

const STEP_MINUTES = 30;
const POINTS = 48; // the last 24 hours

const series = [
  { name: 'Symulacja: temperatura', minValue: -20, maxValue: 40, color: '#d62728', icon: 'thermometer',
    unit: '°C', sensorName: 'Generator temperatury', mid: 12, amplitude: 8, noise: 0.8 },
  { name: 'Symulacja: wilgotność', minValue: 0, maxValue: 100, color: '#9467bd', icon: 'droplet',
    unit: '%', sensorName: 'Generator wilgotności', mid: 60, amplitude: 20, noise: 2 },
  { name: 'Symulacja: ciśnienie', minValue: 950, maxValue: 1050, color: '#8c564b', icon: 'gauge',
    unit: 'hPa', sensorName: 'Generator ciśnienia', mid: 1013, amplitude: 6, noise: 0.6 },
];

// one value for the given time: sine with a 24 h period plus random noise, kept inside the range
function valueAt(def, time) {
  const day = 24 * 60 * 60 * 1000;
  const cycle = Math.sin((2 * Math.PI * time) / day);
  const noise = (Math.random() * 2 - 1) * def.noise;
  const value = def.mid + def.amplitude * cycle + noise;
  const clipped = Math.min(def.maxValue, Math.max(def.minValue, value));
  return Math.round(clipped * 10) / 10;
}

// times are aligned to the step, so running it twice gives the same timestamps
async function fetchPoints(def) {
  const step = STEP_MINUTES * 60 * 1000;
  const last = Math.floor(Date.now() / step) * step;
  const points = [];
  for (let i = POINTS - 1; i >= 0; i--) {
    const time = last - i * step;
    points.push({ timestamp: new Date(time).toISOString(), value: valueAt(def, time) });
  }
  return points;
}

module.exports = { name: 'synthetic', series, fetchPoints, valueAt };
