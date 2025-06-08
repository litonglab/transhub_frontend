import {ElMessage} from "element-plus";

export function formatDateTime(dateString) {
  const date = new Date(Date.parse(dateString));
  const options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
  };

  const formattedDate = new Intl.DateTimeFormat("zh-CN", options).format(date);
  return formattedDate.replace(/\//g, "-").replace(",", "");
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
      ? (options.headers || undefined) // 不加 Content-Type
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
