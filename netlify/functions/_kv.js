const BASE = process.env.UPSTASH_REST_URL;
const TOKEN = process.env.UPSTASH_REST_TOKEN;

async function upstash(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!res.ok) throw new Error(`Upstash ${res.status}`);
  return res.json();
}

exports.kvSet = (key, value, exSeconds) => {
  const q = exSeconds ? `?EX=${exSeconds}` : '';
  return upstash(`/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}${q}`);
};
exports.kvGet = async (key) => {
  const data = await upstash(`/get/${encodeURIComponent(key)}`);
  return data.result ?? null;
};
exports.kvDel = (key) => upstash(`/del/${encodeURIComponent(key)}`);