# nginx部署指南
nginx是一个高性能的HTTP反向代理服务器，部署在前端服务器上，用于转发请求到后端服务器。
在Transhub中，前后端在一个服务器上，nginx主要有两个功能：  
- 用户访问服务器的端口时，转发到前端页面
- 用户访问服务器的/api路径时，转发到后端API，因此需要配置生产环境环境变量中的`VITE_APP_API_HOST`为`/api`

(202505补充说明：为便于部署，可以直接将打包好的前端dist文件夹放到flask后端指定文件夹中，随后端一起部署，不需要单独部署前端)

## 1. 安装
```bash
sudo apt-get update
sudo apt-get install nginx
```

## 2. 配置
nginx的配置文件位于`/etc/nginx/nginx.conf`，修改该文件，配置如下：
```nginx
server {
        listen 4000 ssl;
        listen [::]:4000 ssl;
        server_name tranhub;  # You can specify the server_name if needed
        root /home/liuwei/new_transhub/dist;  # 生成的前端dist文件夹路径，Replace with the actual path to your Vite dist folder
        index index.html;

        # 指定 SSL 证书路径
        ssl_certificate /etc/nginx/cert.pem;
        ssl_certificate_key /etc/nginx/key.pem;

        # 其他 SSL 配置（推荐使用强加密）
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        location / {
            try_files $uri $uri/ /index.html;  # Correct routing for the Vite SPA
        }

            location /api {
                rewrite ^/api/?(.*)$ /$1 break;   # Strip /api prefix before proxying
                proxy_pass http://localhost:12345;  # 后端的访问地址，Backend API running on port 12345

                # Ensure the headers for session and client information are forwarded
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;

                # Support cookies and session persistence
                proxy_cookie_path / "/;";  # Adjust flags if necessary (e.g., Secure if using HTTPS)

                # Allow cookies to be passed through
                proxy_pass_header Set-Cookie;
            }
	}
```
- 这段配置文件放在`http{}`块中，可以根据实际情况修改端口号、证书路径、后端API地址等
- `ssl_certificate`和`ssl_certificate_key`是SSL证书的路径，可以使用Let's Encrypt等工具生成
- `proxy_pass`指定后端API的地址，这里是`http://localhost:12345`，可以根据后端设置的端口号进行修改
## 3. 重启nginx
```bash
sudo systemctl restart nginx
```
