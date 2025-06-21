# Transhub Frontend
本仓库是Transhub的前端代码仓库，使用Vue框架开发  
后端链接：[Transhub Backend](https://github.com/litonglab/transhub_backend)
## 1.  依赖
- Node.js v22.5.1
- Vue 3.4.37


组件库：
- Element Plus
- Vuetify



## 2. Config

配置后端API地址：位于`.env.developmen`t和`.env.production`中，分别对应开发环境后端地址和生产环境后端地址，配置后端地址时不要以斜杠/结尾。
- 本地开发（开发环境）：
```javascript
// 本地开发环境部署时，为解决跨域问题，需使用代理方式请求后端接口
// VITE_APP_API_HOST必须填写为/api，无需修改，使用VITE_APP_PROXY_API_HOST填写后端地址
VITE_APP_API_HOST='/api'  // 请勿修改
VITE_APP_PROXY_API_HOST='http://localhost:54321'  //填写后端地址，请勿使用斜杠/结尾
```
- 正式部署（生产环境）：
```javascript
VITE_APP_API_HOST=''
```
~~除此之外，正式部署时还需要对 **nginx** 进行设置，详见本目录下的 **nginx.md** 文件~~



## 3.  安装依赖

```
npm install
```



## 4. 开发环境运行

```bash
npm run dev
```
使用上述命令运行时，即开发环境。开发环境仅用于开发测试，性能较差，不能直接用此方法部署到现网。

当以开发环境运行时，将使用`.env.development`中指定的后端地址。



## 5.  生产环境打包

```bash
npm run build
```
使用上述命令打包后，生成的`dist`文件夹用于生产环境。

当正式部署到服务器时，需使用以上命令打包。生产环境将使用`.env.production`中指定的后端地址。

在重新打包之前以及更新现网`dist`文件夹时，请先删除此前的`dist`文件夹，以免出现问题。

打包好后生成的dist文件夹不能独立运行，需依赖其他的服务器程序。

有两种部署方式，简便起见，建议直接用第二种方法部署：

- 一种方法是前端和后端分别部署：前端部署在nginx或其他类似服务器程序中，后端单独启动Flask框架。此时需要在`.env.production`中填写对应的后端地址。

- 另一种方法是前端直接随后端部署（推荐）：当前端打包好后，只需把打包产生的`dist`文件夹复制到后端的`app_frontend_dist`文件夹中，此时`.env.production`中后端地址不用填写，使用默认的空字符串即可。
