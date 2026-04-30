/**
 * 将用户或接口传入的 colors（字符串或已解析对象）解析后紧凑序列化入库，去掉换行与多余空白。
 */
export function normalizeJsonForStorage(colors: string | unknown): string {
  const parsed = typeof colors === "string" ? JSON.parse(colors) : colors;
  return JSON.stringify(parsed);
}
