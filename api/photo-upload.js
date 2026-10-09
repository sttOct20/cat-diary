import { put } from '@vercel/blob';

function getDeviceId(req) {
  const id = req.headers['x-device-id'] || req.headers.get?.('x-device-id');
  if (!id || id.length < 8) return null;
  return id;
}

export const config = {
  runtime: 'nodejs',
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

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
    // 解析请求体：支持 JSON body 中的 base64 图片
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { filename, data: base64Data, contentType } = body;

    if (!base64Data) {
      return res.status(400).json({ error: '缺少图片数据' });
    }

    // base64 转 Buffer
    const buffer = Buffer.from(base64Data, 'base64');
    const safeFilename = filename || `photo-${Date.now()}.jpg`;
    const pathname = `catdiary/${deviceId}/${Date.now()}-${safeFilename}`;

    const blob = await put(pathname, buffer, {
      access: 'public',
      contentType: contentType || 'image/jpeg',
    });

    res.status(200).json({
      url: blob.url,
      pathname: blob.pathname,
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ error: '上传失败' });
  }
}
