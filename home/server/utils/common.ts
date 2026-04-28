import crypto from "crypto";

/** 生成指定长度的随机字符串（hex） */
export const getUUID = (len = 32): string =>
  crypto.randomBytes(Math.ceil(len / 2)).toString("hex").slice(0, len);

/** SHA-256 加密（用户名+密码加盐，保留兼容性） */
export const encryptBySHA256 = (userName: string, password: string): string => {
  const hash = crypto.createHash("sha256");
  hash.update(userName + password);
  return hash.digest("hex");
};
