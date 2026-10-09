import { kv } from '@vercel/kv';

const KV_PREFIX = 'catdiary:';

function getDeviceId(req) {
  const id = req.headers['x-device-id'] || req.headers.get?.('x-device-id');
  if (!id || id.length < 8) return null;
  return id;
}

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const deviceId = getDeviceId(req);
  if (!deviceId) {
    return res.status(400).json({ error: '缺少设备标识' });
  }

  const key = `${KV_PREFIX}${deviceId}:data`;

  try {
    if (req.method === 'GET') {
      const data = await kv.get(key);
      if (!data) {
        return res.status(200).json({
          catName: '小奶油',
          sandRecords: [],
          dewormRecords: [],
          hairballRecords: [],
          canRecords: [],
          weightRecords: [],
          photos: []
        });
      }
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      // 只保存合法字段
      const validData = {
        catName: body.catName || '小奶油',
        sandRecords: Array.isArray(body.sandRecords) ? body.sandRecords : [],
        dewormRecords: Array.isArray(body.dewormRecords) ? body.dewormRecords : [],
        hairballRecords: Array.isArray(body.hairballRecords) ? body.hairballRecords : [],
        canRecords: Array.isArray(body.canRecords) ? body.canRecords : [],
        weightRecords: Array.isArray(body.weightRecords) ? body.weightRecords : [],
        photos: Array.isArray(body.photos) ? body.photos : []
      };
      await kv.set(key, validData);
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: '不支持的请求方法' });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
}
