// ===== 日程看板 · 数据同步脚本（粘贴到金山文档多维表格的 AirScript） =====
// 步骤：
// 1) 在多维表格里，把第一个工作表改名为「日程」（或在下面改 SHEET_NAME）
// 2) 在该表里建一个【多行文本】字段，字段名必须叫：数据
// 3) 新建 AirScript 脚本，粘贴本代码，保存
// 4) 在脚本编辑器的「更多」菜单里复制 webhook 链接，并生成「脚本令牌(APIToken)」
// 5) 把 webhook 链接和令牌填进看板网页侧栏的「☁️ WPS 多维表格同步」
//
// 注意：AirScript 为同步脚本，禁止使用 async/await。

const SHEET_NAME = "日程";

function getSheetId() {
  const sheets = Application.Sheet.GetSheets();
  let sid = null;
  for (let i = 0; i < sheets.length; i++) {
    if (sheets[i].name === SHEET_NAME) { sid = sheets[i].id; break; }
  }
  if (sid === null && sheets.length > 0) sid = sheets[0].id;
  return sid;
}

function main(ctx) {
  const argv = (ctx && ctx.argv) || {};
  const sid = getSheetId();
  if (sid === null) return "NO_SHEET";

  // 读取：把所有任务（存于「数据」字段）回传
  if (argv.action === "load") {
    let all = [];
    let offset = null;
    let guard = 0;
    do {
      const res = Application.Record.GetRecords({ SheetId: sid, Offset: offset, PageSize: 1000 });
      const recs = res.records || [];
      for (let i = 0; i < recs.length; i++) {
        const f = recs[i].fields || {};
        const raw = f["数据"];
        if (raw) {
          try { const o = JSON.parse(raw); if (o && o.id) all.push(o); } catch (e) {}
        }
      }
      offset = res.offset || null;
      guard++;
    } while (offset && guard < 30);
    return JSON.stringify(all);
  }

  // 保存：清空后整体重写
  if (argv.action === "save") {
    const tasks = argv.tasks || [];
    let offset = null, guard = 0;
    do {
      const res = Application.Record.GetRecords({ SheetId: sid, Offset: offset, PageSize: 1000 });
      const recs = res.records || [];
      if (recs.length > 0) {
        const ids = recs.map(function (r) { return r.id; });
        Application.Record.DeleteRecords({ SheetId: sid, RecordIds: ids });
      }
      offset = res.offset || null;
      guard++;
    } while (offset && guard < 30);

    if (tasks.length > 0) {
      const records = tasks.map(function (t) { return { fields: { "数据": JSON.stringify(t) } }; });
      Application.Record.CreateRecords({ SheetId: sid, Records: records });
    }
    return "SAVED:" + tasks.length;
  }

  return "UNKNOWN_ACTION";
}

return main(Context);
