import {ElMessage} from "element-plus";
import * as XLSX from "xlsx";


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
 * @param {object} config 额外配置（如：是否弹窗错误提示 showError）
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
          ElMessage({
            message: data.message || "未登录或登录已过期，请重新登录",
            type: "error",
            duration: 3000,
          });
          ElMessage({
            message: "正在重定向至登录页面...",
            type: "success",
            duration: 3000,
          });
          await new Promise((resolve) => setTimeout(resolve, 3000));
          window.location.href = loginUrl;
        }
        throw new Error(data.message);
      } else {
        throw new Error(data.message || data.msg || "请求失败");
      }
    } else if (response.status !== 200) {
      throw new Error(`网络或系统错误：${response.status}`);
    } else if (contentType.startsWith("text/html")) {
      // HTML 内容可能是404错误页面
      // 目前后端接口暂时没有返回HTML的情况
      console.error("request: response is HTML, 可能是404错误页面");
      throw new Error(`后端可能返回了HTML 404页面，请确认后端API地址是否正确：${url}`);
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

/**
 * 从 Content-Disposition 标头解析文件名
 * @param {string | null} contentDisposition
 * @returns {string}
 */
export function parseFilenameFromContentDisposition(contentDisposition) {
  let fileName = ""; // 默认文件名

  if (contentDisposition) {
    // 优先匹配 RFC 5987 的 filename*
    const fileNameStarMatch = contentDisposition.match(
      /filename\*\s*=\s*([^;]+)/i
    );
    if (fileNameStarMatch) {
      try {
        let value = fileNameStarMatch[1].trim();
        // 格式如: UTF-8''%E4%B8%AD%E6%96%87.cc
        const parts = value.split("''");
        if (parts.length === 2) {
          fileName = decodeURIComponent(parts[1]);
        } else {
          fileName = decodeURIComponent(value);
        }
        return fileName;
      } catch (e) {
        console.error("Error decoding filename*:", e);
      }
    }

    // 兼容 filename="xxx"
    const fileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/);
    if (fileNameMatch && fileNameMatch[1]) {
      fileName = fileNameMatch[1];
    }
  }

  return fileName;
}

//
/**
 * 获取图片并转为 blob url（内部使用统一 request 封装）
 * @param {string} url 图片请求地址
 * @param {object} options fetch 选项（可选）
 * @returns {Promise<{blobUrl: string, filename: string}|null>} 成功返回 blob url 和文件名，失败或无图片返回 null
 * @description 用法示例：const img = await fetchImageBlobUrl(url)
 */
export async function fetchImageBlobUrl(url, options = {}) {
  try {
    // 只允许 GET
    const mergedOptions = {method: "GET", ...options};
    // 使用 request 封装，它会返回原始 response
    const response = await request(url, mergedOptions);

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

    const contentDisposition = response.headers.get("Content-Disposition");
    const filename = parseFilenameFromContentDisposition(contentDisposition);
    return {
      blobUrl: URL.createObjectURL(blob),
      filename: filename,
    };
  } catch (e) {
    console.error("fetchImageBlobUrl: exception", e, url);
    return null;
  }
}

/**
 * 通用导出Excel工具函数
 * @param {Array} data - 要导出的原始数据数组
 * @param {Object} options - 配置项
 * @param {function} options.formatter - (row, index) => object，格式化每一行数据
 * @param {string} options.sheetName - 工作表名称，默认"Sheet1"
 * @param {string} options.fileName - 文件名（不含扩展名），默认"导出数据"
 * @param {Array} options.colWidths - 列宽数组（可选）
 */
export function exportDataToExcel(data, options = {}) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("当前没有数据可导出");
  }
  const {
    formatter = (row) => row,
    sheetName = "Sheet1",
    fileName = "导出数据",
    colWidths = undefined,
  } = options;

  // 格式化数据
  const exportData = data.map((row, idx) => formatter(row, idx));
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  if (colWidths) {
    worksheet["!cols"] = colWidths;
  }
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // 生成带时间戳的文件名
  const timestamp = new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/[:-]/g, "")
    .replace("T", "_");
  const fullFileName = `${fileName}_${timestamp}.xlsx`;
  XLSX.writeFile(workbook, fullFileName);
  return fullFileName;
}
