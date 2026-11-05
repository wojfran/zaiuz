// Small client of our own REST API (Node 18+ has fetch built in)

class ApiError extends Error {
  constructor(status, body) {
    super(`${status} ${(body && (body.detail || body.title)) || ''}`.trim());
    this.status = status;
    this.body = body;
  }
}

function createClient(baseUrl) {
  const base = baseUrl.replace(/\/+$/, '');

  async function request(method, path, { body, token, apiKey } = {}) {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    if (apiKey) headers['X-API-Key'] = apiKey;

    const res = await fetch(base + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : undefined;
    } catch {
      data = undefined;
    }
    if (!res.ok) throw new ApiError(res.status, data);
    return data;
  }

  return {
    async login(username, password) {
      const data = await request('POST', '/api/auth/login', { body: { username, password } });
      return data.accessToken;
    },
    logout: (token) => request('POST', '/api/auth/logout', { token }),
    listSeries: () => request('GET', '/api/series'),
    createSeries: (token, series) => request('POST', '/api/series', { token, body: series }),
    createSensor: (token, sensor) => request('POST', '/api/sensors', { token, body: sensor }),
    sendMeasurement: (apiKey, measurement) =>
      request('POST', '/api/measurements', { apiKey, body: measurement }),
    listMeasurements: (query) =>
      request('GET', `/api/measurements?${new URLSearchParams(query)}`),
  };
}

module.exports = { createClient, ApiError };
