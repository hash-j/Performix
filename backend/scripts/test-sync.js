const http = require('http');

const post = (path, body, token) => new Promise((res, rej) => {
    const data = JSON.stringify(body);
    const headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const req = http.request({ hostname: 'localhost', port: 5000, path, method: 'POST', headers }, r => {
        let d = ''; r.on('data', c => d += c); r.on('end', () => res({ status: r.statusCode, body: JSON.parse(d) }));
    });
    req.on('error', rej);
    req.write(data);
    req.end();
});

const get = (path, token) => new Promise((res, rej) => {
    const headers = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const req = http.request({ hostname: 'localhost', port: 5000, path, method: 'GET', headers }, r => {
        let d = ''; r.on('data', c => d += c); r.on('end', () => res({ status: r.statusCode, body: JSON.parse(d) }));
    });
    req.on('error', rej);
    req.end();
});

async function main() {
    console.log('--- Logging in as johndoe ---');
    const loginRes = await post('/api/auth/login', { username: 'johndoe', password: 'password123' });
    console.log('Login status:', loginRes.status, loginRes.body.error || 'OK');

    if (!loginRes.body.token) {
        console.log('Full response:', JSON.stringify(loginRes.body));
        return;
    }

    const token = loginRes.body.token;
    console.log('\n--- Checking connected integrations ---');
    const intRes = await get('/api/integrations', token);
    console.log('Integrations:', intRes.status, JSON.stringify(intRes.body));

    console.log('\n--- Syncing facebook_ads ---');
    const syncRes = await post('/api/integrations/sync', { platform: 'facebook_ads' }, token);
    console.log('Sync Result:', syncRes.status, JSON.stringify(syncRes.body));

    if (syncRes.status === 200) {
        console.log('\n--- Checking KPI definitions created ---');
        const kpiRes = await get('/api/kpis/definitions', token);
        console.log('KPI Definitions:', kpiRes.status, JSON.stringify(kpiRes.body.map(k => k.name)));
    }
}

main().catch(console.error);
