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

    const headers = {};
    for (const [k, v] of request.headers) headers[k] = v;
    const init = { method: request.method, headers };
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = await request.arrayBuffer();
    }
    const resp = await fetch(target, init);
    const out = new Headers(resp.headers);
    out.set('Access-Control-Allow-Origin', '*');
    out.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    out.set('Access-Control-Allow-Headers', '*');
    return new Response(resp.body, { status: resp.status, headers: out });
  }
};
