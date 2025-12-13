# 🚀 Receipt App 部署指南 (VPS + 宝塔面板)

本指南将帮助您将应用部署到生产环境。

## 🌐 生产环境地址

| 服务 | 域名 |
|------|------|
| **Frontend** | https://receipe2.khtain.com |
| **Admin Dashboard** | https://receipe2admin.khtain.com |
| **API** | https://receipe2api.khtain.com |

## 1. 准备工作

确保您的 VPS 已安装：
*   **Node.js** (建议 v18 或 v20)
*   **PM2** (用于后台运行服务: `npm install pm2 -g`)
*   **Nginx** (宝塔面板自带)

---

## 2. 前端部署 (receipe2.khtain.com)

### A. 修改生产环境配置
在项目根目录创建一个名为 `.env.production` 的文件，内容如下：
```ini
VITE_API_BASE_URL=https://receipe2api.khtain.com
```

### B. 构建项目
在本地终端运行：
```bash
npm run build
```
这将生成一个 `dist` 文件夹，里面是编译好的静态文件。

### C. 上传到宝塔
1.  在宝塔面板 -> **网站** -> 添加站点 -> 域名填 `receipe2.khtain.com`。
2.  进入该站点的根目录。
3.  将本地 `dist` 文件夹里的**所有文件**（index.html, assets等）上传到该目录。
4.  **重要**: 配置伪静态（防止刷新 404）。
    在网站设置 -> 配置文件 -> 添加：
    ```nginx
    location / {
      try_files $uri $uri/ /index.html;
    }
    ```

---

## 3. 后端部署 (receipe2api.khtain.com)

### A. 上传代码
1.  在 VPS 上创建一个目录，例如 `/www/wwwroot/receipe-api`。
2.  将本地 `server` 文件夹内的所有内容上传上去。
    *   **注意**: 不要上传 `node_modules`。
    *   **必须上传**: `package.json`, `index.js`, `.env` (包含您的真实 Key)。

### B. 安装依赖并启动
在 VPS 终端（或宝塔终端）执行：
```bash
cd /www/wwwroot/receipe-api
npm install
pm2 start index.js --name "receipt-api"
```

### C. 配置反向代理 (宝塔)
1.  在宝塔面板 -> **网站** -> 添加站点 -> 域名填 `receipe2api.khtain.com`。
2.  进入网站设置 -> **反向代理** -> 添加反向代理。
    *   代理名称: `api`
    *   目标 URL: `http://127.0.0.1:3001`
    *   发送域名: `$host`
3.  **重要**: 开启 **SSL (HTTPS)**，因为前端是 HTTPS，后端也必须是 HTTPS，否则会被浏览器拦截。

---

## 4. Admin 面板部署 (receipe2admin.khtain.com)

与前端类似：

1. 在 `apps/admin/` 目录运行 `npm run build`
2. 将生成的 `dist` 文件夹上传到对应站点目录
3. 配置伪静态 (同前端)

## 5. 验证

1.  访问前端: `https://receipe2.khtain.com`
2.  访问后台: `https://receipe2admin.khtain.com`
3.  如果顶部状态栏全是绿色，说明前后端通信成功！

---

**常见问题**:
*   **CORS 错误**: 确保后端 `.env` 中的配置正确，且前端请求的是 `https` 的 API 地址。
*   **502 Bad Gateway**: 检查 PM2 是否正在运行 (`pm2 list`)，以及端口 3001 是否被防火墙放行（反向代理通常不需要放行端口，只需要 Nginx 能访问即可）。



