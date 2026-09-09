// ===== Cloudflare Worker：为 WPS AirScript webhook 提供 CORS 代理 =====
// 为什么需要它：浏览器从 GitHub Pages 直接请求 www.kdocs.cn 会被跨域(CORS)拦截，
// 本 Worker 在服务端转发请求并补上 Access-Control-Allow-Origin，使浏览器可以正常读写。
//
// 部署（免费，无需服务器）：
//   1) 打开 https://workers.cloudflare.com/ 并登录（免费套餐即可）
//   2) 新建一个 Worker，把本文件内容粘贴进去，保存
//   3) 记下分配的地址，形如 https://schedule-proxy.你的子域.workers.dev
//
// 在看板网页「④ CORS 代理地址」填：https://schedule-proxy.你的子域.workers.dev/?target=
//   Worker 会把请求转发到 ?target= 指向的 kdocs webhook，并转发你的 AirScript-Token。
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = url.searchParams.get('target');
    if (!target) return new Response('missing target param', { status: 400 });

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': '*'
        }
      });
    }

    // 读取 body（非 GET/HEAD 请求）
    let body = null;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      body = await request.arrayBuffer();
    }

    // 重建 headers：只过滤 hop-by-hop 头，其余原样转发
    const skip = new Set(['host', 'content-length', 'connection', 'keep-alive', 'transfer-encoding', 'upgrade']);
    const headers = {};
    for (const [k, v] of request.headers) {
      if (!skip.has(k.toLowerCase())) headers[k] = v;
    }

    // 调试信息（会返回给浏览器，方便排查）
    const debug = {
      method: request.method,
      target: target,
      hasToken: !!headers['airscript-token'],
      hasContentType: !!headers['content-type'],
      bodyLen: body ? body.byteLength : 0
    };

    let resp;
    let fetchErr = '';
    try {
      resp = await fetch(target, { method: request.method, headers, body });
    } catch (e) {
      fetchErr = String(e.message || e);
      return new Response('Worker fetch error: ' + fetchErr, {
        status: 502,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'X-Proxy-Debug': JSON.stringify(debug),
          'X-Proxy-Error': fetchErr
        }
      });
    }

    // 先完整读取 body，确保错误响应体也能被浏览器看到
    const respBody = await resp.arrayBuffer();
    const out = new Headers(resp.headers);
    out.set('Access-Control-Allow-Origin', '*');
    out.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    out.set('Access-Control-Allow-Headers', '*');
    out.set('X-Proxy-Status', resp.status.toString());
    out.set('X-Proxy-Debug', JSON.stringify(debug));
    return new Response(respBody, { status: resp.status, headers: out });
  }
};
