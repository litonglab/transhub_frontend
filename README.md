# Transhub Frontend
本仓库是Transhub的前端代码仓库，使用Vue框架开发  
后端链接：[Transhub Backend](https://github.com/litonglab/transhub_backend)
## 1.  依赖
- Node.js v22.5.1
- Vue 3.4.37

## 2. Config
位于src/config.js中，配置后端API地址
- 本地部署：
```javascript
const hostname='https://localhost:{your backend port}/api'
```
- 远程部署：
```javascript
const hostname='https://{remote server ip}:{your nginx port}/api'
```
除此之外，远端部署时还需要对 **nginx** 进行设置，详见本目录下的 **nginx.md** 文件

## 3.  安装 & 运行
```bash
npm install
npm run dev
```
## 4.  打包
```bash
npm run build
```
