# 050 主题 colors JSON 入库紧凑序列化

**日期：** 2026-04-30

**变更：** 用户提交主题（`api/entry/themes`）及后台创建/更新主题时，`colors` 在校验通过后以 `JSON.parse` + `JSON.stringify`（默认紧凑、无缩进）写入数据库，去掉用户粘贴时的换行与多余空白。

**涉及文件：** `home/server/utils/json-storage.ts`（新增）、`home/server/api/entry/themes.post.ts`、`home/server/api/admin/themes.post.ts`、`home/server/api/admin/themes/[id].patch.ts`
