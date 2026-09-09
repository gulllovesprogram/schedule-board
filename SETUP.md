# 日程看板 · WPS 多维表格同步 配置说明

本页（index.html）是一个日程管理看板（工作 / 备考 / 理财），数据默认存在浏览器 localStorage。
要让它在**多设备、多平台**共享同一份数据，需要把它连到你的金山文档多维表格。

## 三种方式（任选）

### 方式 A：仅用本地（最简单，单设备）
什么都不用配。数据存在你当前浏览器里。换浏览器/设备不会同步。

### 方式 B：连 WPS 多维表格（多端同步，推荐）
浏览器直连金山文档会被跨域(CORS)拦截，所以分三步：

**第 1 步：在多维表格里建脚本**
1. 打开你的金山文档多维表格，把第一个工作表改名为 `日程`（或在 `airscript-glue.js` 顶部改 `SHEET_NAME`）。
2. 在该表里建一个【多行文本】字段，字段名必须叫 `数据`。
3. 进入「脚本 / AirScript」→ 新建脚本 → 把 `airscript-glue.js` 的内容整段粘贴进去 → 保存。
4. 在脚本编辑器的「更多」菜单里：
   - 复制 **webhook 链接**（形如 `https://www.kdocs.cn/api/v3/ide/file/.../script/.../sync_task`）
   - 生成 **脚本令牌(APIToken)**

**第 2 步：部署一个免费 CORS 代理（Cloudflare Worker）**
浏览器无法直接访问 kdocs，需要一个服务端转发：
1. 打开 https://workers.cloudflare.com/ 登录（免费）。
2. 新建 Worker，把 `cors-proxy-worker.js` 内容粘贴进去，保存。
3. 记下地址，形如 `https://schedule-proxy.你的子域.workers.dev`。

**第 3 步：在看板网页里填**
打开本页 → 侧栏「☁️ WPS 多维表格同步」开关 → 填入：
- ① Webhook 地址：第 1 步复制的 webhook 链接
- ② AirScript 令牌：第 1 步生成的 APIToken
- ③ 表名：日程（默认）
- ④ CORS 代理地址：`https://schedule-proxy.你的子域.workers.dev/?target=`
点「连接测试」。成功后，任何增删改都会实时写进你的多维表格；换设备打开同一链接即同步。

> 本地模式始终保留兜底：代理或网络异常时，数据先存浏览器，不丢。

### 方式 C：直接用多维表格原生视图（零代码）
不嵌网页，直接在多维表格里按字段建任务（任务名/分类/状态/截止日期/子任务/进度/Obsidian路径…），
切「看板视图」按状态分组、「日历视图」按截止日期排。多端由金山文档原生同步。
缺点：失去本页精致的自动倒排 / Obsidian 链接界面。

## 文件说明
- `index.html` —— 看板本体（已部署到 GitHub Pages）
- `airscript-glue.js` —— 粘贴进多维表格的 AirScript 同步脚本
- `cors-proxy-worker.js` —— 解决浏览器跨域的 Cloudflare Worker
- `SETUP.md` —— 本说明
