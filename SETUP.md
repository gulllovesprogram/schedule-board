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
浏览器出于安全策略（CORS）无法直接访问 kdocs，需要一个服务端帮我们转发请求。
Cloudflare Worker 是免费、无服务器的方案（免费套餐每天 10 万次请求，个人完全够用）。

> 代码已备好：仓库里的 `cors-proxy-worker.js`。

**① 注册 / 登录**
- 打开 https://workers.cloudflare.com/ → 点右上角「登录 / Sign in」。
- 没有账号就点「注册 / Sign up」（用邮箱即可，免费版不需要绑卡）。

**② 设置你的 workers.dev 子域（仅第一次需要）**
- 首次进入会让设置一个**子域前缀**，例如填 `my-schedule`，确认后你会拥有 `my-schedule.workers.dev` 这个域名空间。
- 以后每个 Worker 都会挂在这个域下，如 `https://某个名字.my-schedule.workers.dev`。

**③ 新建 Worker**
- 在控制台首页点 **「Create Worker」/「创建 Worker」**（或「Workers 」→「Create Application」→「Worker」）。
- 给 Worker 起个名字，例如 `schedule-proxy`，点 **「部署 / Deploy」**（先随便部署一版占位也行）。

**④ 粘贴代码**
- 进入该 Worker 的 **「编辑代码 / Quick Edit / Code」** 页面。
- 左侧代码编辑器里默认有一段 `export default { ... }` 的示例，把它**整段删除**。
- 打开本仓库的 `cors-proxy-worker.js`，**全选复制**其全部内容，粘贴进编辑器。
- 右上角点 **「保存并部署 / Save and Deploy」**。

**⑤ 拿到你的代理地址**
- 部署成功后，页面会显示类似：
  `https://schedule-proxy.<你的子域>.workers.dev`
- 这就是你的 CORS 代理地址，复制保存好。

**⑥ 先验证代理活着（可选但推荐）**
- 浏览器直接打开：`https://schedule-proxy.<你的子域>.workers.dev/`
- 若显示 `missing target param` 字样，说明 Worker 已正常启动（它要求带 `target=` 参数，空跑就报这个，属正常）。

**第 3 步：在看板网页里填**
打开本页 → 侧栏「☁️ WPS 多维表格同步」开关 → 填入：
- ① Webhook 地址：第 1 步复制的 webhook 链接
- ② AirScript 令牌：第 1 步生成的 APIToken
- ③ 表名：日程（默认）
- ④ CORS 代理地址：`https://schedule-proxy.你的子域.workers.dev/`（末尾带不带 `?target=` 均可，代码会自动处理）
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
