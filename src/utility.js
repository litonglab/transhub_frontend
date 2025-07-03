import {ElMessage} from "element-plus";

/**
 * 时间格式化
 * @param dateString
 * @param {boolean} [onlyTime=false] - 是否只显示时间部分
 * @returns {string}
 */
export function formatDateTime(dateString, onlyTime = false) {
  const date = new Date(Date.parse(dateString));
  const baseOptions = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  };
  const options = onlyTime
    ? baseOptions
    : {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      ...baseOptions,
    };
  const formatted = new Intl.DateTimeFormat("zh-CN", options).format(date);
  if (onlyTime) {
    // 只返回 HH:mm:ss
    return formatted.replace(/[^0-9:]/g, "");
  } else {
    return formatted.replace(/\//g, "-").replace(",", "");
  }
}

/**
 * 统一后端请求封装
 * @param {string} url 请求地址
 * @param {object} options fetch 选项
 * @param {object} config 额外配置（如：是否返回原始 response、是否弹窗错误提示 showError）
 */
export async function request(url, options = {}, config = {}) {
  // 判断是否是 FormData
  const isFormData = options.body instanceof FormData;
  // 默认 method/post，Content-Type/json
  const defaultOptions = {
    method: "POST",
    ...(isFormData ? {} : {headers: {"Content-Type": "application/json"}}),
  };
  // 合并 headers
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: isFormData
      ? options.headers || undefined // 不加 Content-Type
      : {...defaultOptions.headers, ...(options.headers || {})},
  };
  const showError = config.showError !== false;
  try {
    const response = await fetch(url, mergedOptions);
    // if (config.raw) return response;
    const contentType = response.headers.get("Content-Type") || "";
    if (contentType.startsWith("application/json")) {
      const data = await response.json();
      // 2xx状态码均为成功
      if (data.code >= 200 && data.code < 300) {
        return data;
      } else if (data.code === 401) {
        // 防止一直跳转
        const loginUrl = "/login";
        if (window.location.pathname !== loginUrl) {
          window.location.href = loginUrl;
        }
        throw new Error(data.message);
      } else {
        throw new Error(data.message || data.msg || "请求失败");
      }
    } else if (response.status !== 200) {
      throw new Error(`网络或系统错误：${response.status}`);
    } else {
      return response;
    }
  } catch (error) {
    if (showError && error) {
      ElMessage({
        message: error.message || "请求异常",
        type: "error",
        duration: 5000,
      });
    }
    throw error;
  }
}

//
/**
 * 获取图片并转为 blob url（内部使用统一 request 封装）
 * @param {string} url 图片请求地址
 * @param {object} options fetch 选项（可选）
 * @returns {Promise<string|null>} 成功返回 blob url，失败或无图片返回 null
 * @description 用法示例：const imgUrl = await fetchImageBlobUrl(url)
 */
export async function fetchImageBlobUrl(url, options = {}) {
  try {
    // 只允许 GET
    const mergedOptions = {method: "GET", ...options};
    // 使用 request 封装，传 raw:true 返回原始 response
    const response = await request(url, mergedOptions, {
      raw: true,
    });
    if (!response.ok) {
      console.error("fetchImageBlobUrl: response not ok", response.status, url);
      return null;
    }
    const contentType = response.headers.get("Content-Type");
    if (!contentType || !contentType.startsWith("image/")) {
      console.error(
        "fetchImageBlobUrl: not an image, contentType =",
        contentType,
        url
      );
      return null;
    }
    const blob = await response.blob();
    if (!blob || blob.size === 0) {
      console.error("fetchImageBlobUrl: blob is empty", url);
      return null;
    }
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error("fetchImageBlobUrl: exception", e, url);
    return null;
  }
}
