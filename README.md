# Transhub Frontend

本仓库是Transhub的前端代码仓库，使用Vue框架开发  
后端链接：[Transhub Backend](https://github.com/litonglab/transhub_backend)

## 1. 依赖

- Node.js v22.5.1
- Vue 3.4.37

组件库：

- Vuetify（后续新增组件建议统一使用Vuetify，保持风格一致）
- Element Plus（目前主要用于榜单展示、历史记录页面及一些顶部消息提示）

## 2. Config

配置后端API地址：位于`.env.developmen`t和`.env.production`中，分别对应开发环境后端地址和生产环境后端地址，配置后端地址时不要以斜杠/结尾。

- 本地开发（开发环境）：

```javascript
// 本地开发环境部署时，为解决跨域问题，需使用代理方式请求后端接口
// VITE_APP_API_HOST必须填写为/api，无需修改，使用VITE_APP_PROXY_API_HOST填写后端地址
VITE_APP_API_HOST = '/api'  // 请勿修改
VITE_APP_PROXY_API_HOST = 'http://localhost:54321'  //填写后端地址，请勿使用斜杠/结尾
```

- 正式部署（生产环境）：

```javascript
VITE_APP_API_HOST = ''
```

~~除此之外，正式部署时还需要对 **nginx** 进行设置，详见本目录下的 **nginx.md** 文件~~

## 3. 安装依赖

```
npm install
```

## 4. 开发环境运行

```bash
npm run dev
```

使用上述命令运行时，即开发环境。当以开发环境运行时，将使用`.env.development`中指定的后端地址。
开发环境仅用于开发测试，性能较差，如需正式部署，请参考第5节-生产环境打包。

## 5. 生产环境打包

```bash
npm run build
```

使用上述命令打包后，生成的`dist`文件夹用于生产环境，生产环境将使用`.env.production`中指定的后端地址。
当正式部署到服务器时，需使用以上命令将开发环境的代码打包、优化并准备好部署到生产环境。

在重新打包之前以及更新现网`dist`文件夹时，请先删除或覆盖此前的`dist`文件夹，以免出现问题。

打包的`dist`文件夹不能独立运行，需依赖其他的服务器程序。
有两种部署方式，简便起见，建议直接用第二种方法部署：

- 一种方法是前端和后端分别部署：前端部署在nginx或其他类似服务器程序中，后端单独启动Flask框架。此时需要在`.env.production`
  中填写对应的后端地址。

- 另一种方法是前端直接随后端部署（推荐）：当前端打包好后，只需把打包生成的`dist`文件夹复制到后端的`app_frontend_dist`文件夹中，此时
  `.env.production`中后端地址不用填写，使用默认的空字符串即可。

## 6. 二次开发

### 6.1 后端接口地址

后端接口地址统一配置在`src/config.js`中，后续新增接口请在此文件中添加。

### 6.2 统一封装函数

在`src/utility.js`中封装了常用的函数，具体开发使用可阅读源码。这些函数包括：

- `formatDateTime(dateString, onlyTime = false)`：用于转换后端返回的原始时间字符串为本地时间格式，`onlyTime`
  参数用于控制是否只显示时间部分。
- `request(url, options = {}, config = {})`：用于发送HTTP请求，支持GET、POST等方法，自动处理JSON数据和错误提示。
  如不需要自动显示错误提示，可以设置`config = { showError: false }`。
  在错误情况下，函数会抛出错误，如有需要可在调用处捕获继续处理业务逻辑。
  后端返回`{"code": 401}`时表示未登录或登录已失效，会自动重定向到登录页面。
- `fetchImageBlobUrl(url, options = {})`：用于下载图片并转换为Blob URL。可以在需要显示图片的地方使用此函数获取Blob
  URL后再设置到`<img>`标签的`src`属性中。
- `exportDataToExcel(data, options = {})`：用于将数据导出为Excel文件。支持自定义文件名、工作表名称等选项。

### 6.3 区分用户角色

用户登录时，后端会返回用户角色信息，前端会根据角色信息显示不同的页面内容。具体代码可以在`src/store/app.js`中查看，
其中提供了`is_admin()`和`is_super_admin()`函数用于判断当前用户是否为管理员或超级管理员，
可以在需要判断用户角色的地方使用这些函数来控制页面显示或执行不同逻辑。