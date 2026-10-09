import { put, list, head } from '@vercel/blob';

function getDeviceId(req) {
  const id = req.headers['x-device-id'] || req.headers.get?.('x-device-id');
  if (!id || id.length < 8) return null;
  return id;
}

function getDefaultData() {
  return {
    catName: '小奶油',
    sandRecords: [],
    dewormRecords: [],
    hairballRecords: [],
    canRecords: [],
    weightRecords: [],
    photos: []
  };
}

async function findDataBlob(deviceId) {
  const prefix = `catdiary/${deviceId}/data.json`;
  try {
    const { blobs } = await list({ prefix, limit: 1 });
    if (blobs.length > 0) return blobs[0];
  } catch (e) {
    console.error('list blob error:', e);
  }
  return null;
}

async function readDataFromBlob(deviceId) {
  const blob = await findDataBlob(deviceId);
  if (!blob) return null;
  try {
    const res = await fetch(blob.url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (e) {
    console.error('read data blob error:', e);
    return null;
  }
}

async function writeDataToBlob(deviceId, data) {
  const pathname = `catdiary/${deviceId}/data.json`;
  const jsonStr = JSON.stringify(data);
  const blob = await put(pathname, jsonStr, {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  });
  return blob;
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

  try {
    if (req.method === 'GET') {
      const data = await readDataFromBlob(deviceId);
      if (!data) {
        return res.status(200).json(getDefaultData());
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
      await writeDataToBlob(deviceId, validData);
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: '不支持的请求方法' });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: '服务器错误: ' + error.message });
  }
}
