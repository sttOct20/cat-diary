import { del } from '@vercel/blob';

function getDeviceId(req) {
  const id = req.headers['x-device-id'] || req.headers.get?.('x-device-id');
  if (!id || id.length < 8) return null;
  return id;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const deviceId = getDeviceId(req);
  if (!deviceId) {
    return res.status(400).json({ error: '缺少设备标识' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '不支持的请求方法' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { url } = body;

    if (!url) {
      return res.status(400).json({ error: '缺少图片URL' });
    }

    // 安全校验：只允许删除属于该设备的照片
    if (!url.includes(`catdiary/${deviceId}/`)) {
      return res.status(403).json({ error: '无权删除此文件' });
    }

    await del(url);
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Photo delete error:', error);
    res.status(500).json({ error: '删除失败' });
  }
}
