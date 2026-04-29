const serializeBigInt = (value: any): any => {
  const seen = new WeakSet();
  const walk = (val: any): any => {
    if (typeof val === "bigint") {
      return val.toString();
    }
    if (val === null || val === undefined) return val;
    if (Array.isArray(val)) return val.map(walk);
    if (val instanceof Date) return val; // keep Date default JSON behavior
    if (typeof val === "object") {
      if (seen.has(val)) return null; // avoid circular
      seen.add(val);
      const out: any = {};
      for (const k of Object.keys(val)) {
        out[k] = walk(val[k]);
      }
      return out;
    }
    return val;
  };
  return walk(value);
};

export const success = (data: any, message: string = "success") => {
  return {
    c: 200,
    m: message,
    d: serializeBigInt(data),
  };
};

export const error = (message: string, data: any = null) => {
  return {
    c: 500,
    m: message,
    d: serializeBigInt(data),
  };
};

/**
 * 服务端内部错误：将原始异常打印到服务端日志，
 * 客户端只收到通用提示消息，不暴露任何内部细节。
 */
export const serverError = (message: string, err?: unknown, context?: string) => {
  const tag = context ? `[${context}]` : "[API]";
  console.error(`${tag} ${message}`, err ?? "");
  return {
    c: 500,
    m: message,
    d: null,
  };
};

export const result = (c: number, m: string, d: any) => {
  return {
    c: c,
    m: m,
    d: serializeBigInt(d),
  };
};

export const noLogin = (message: string = "not login") => {
  return {
    c: 403,
    m: message,
    d: null,
  };
};

export const expiredToken = (message: string = "expired login") => {
  return {
    c: 401,
    m: message,
    d: null,
  };
};
