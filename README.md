# Aliyun DNS Auto Updater

一个基于 Express 的 Web 服务，用于自动更新阿里云 DNS 记录。该服务特别适用于需要动态 DNS 更新的场景，支持 IPv4 (A记录) 和 IPv6 (AAAA记录) 的更新。


## 功能特点

- 支持 IPv4 和 IPv6 记录更新
- 基于 API Key 的安全认证
- 自动检测已存在的 DNS 记录
- 智能判断是否需要更新（避免重复更新相同IP）
- 详细的日志记录
- 低 TTL (60秒) 设置，确保 DNS 记录快速更新

## 环境要求

- Node.js
- npm
- 阿里云账号及 DNS 解析权限

## 环境变量配置

在项目根目录创建 `.env` 文件，配置以下环境变量： 

```env
PORT=3000 # 服务运行端口
API_KEY=your-api-key # API 访问密钥
ACCESS_KEY_ID=your-key-id # 阿里云 AccessKey ID
ACCESS_KEY_SECRET=your-secret # 阿里云 AccessKey Secret
DOMAIN=example.com # 要管理的域名
```


## 开发和运行

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```
此命令会启动 TypeScript 编译器的监听模式，自动编译变更的文件。

### 构建项目
```bash
npm run build
```
此命令会将 TypeScript 代码编译为 JavaScript。

### 运行服务
```bash
npm start
```
此命令会启动编译后的服务。


## API 使用说明

### 更新 DNS 记录

**端点:** `/change-ip`

**方法:** GET

**参数:**
- `key`: API 密钥（必需）
- `server`: 子域名前缀（必需）
- `ip`: 新的 IP 地址（必需）
- `type`: 记录类型（可选，默认为 'ipv6'）
  - 可选值: 'ipv4' 或 'ipv6'

**示例请求:**

```bash
# IPv6 更新
curl "http://localhost:3000/change-ip?key=your-api-key&server=test&ip=2001:db8::1"

# IPv4 更新
curl "http://localhost:3000/change-ip?key=your-api-key&server=test&ip=192.168.1.1&type=ipv4"
```

**成功响应:**
```json
{
  "success": true,
  "message": "DNS record updated successfully",
  "details": {
    "domain": "test.example.com",
    "ip": "2001:db8::1",
    "type": "AAAA",
    "operation": "update"
  }
}
```

## 安全考虑

- 使用环境变量存储敏感信息
- API Key 认证机制
- 详细的日志记录，包含操作时间和持续时间
- 参数验证和错误处理

## 部署建议

1. 确保服务器安全性
2. 使用反向代理（如 Nginx）
3. 启用 HTTPS
4. 设置适当的防火墙规则
5. 定期更新依赖包

## 开发提示词

如果您想要复制或修改此项目，以下是关键的开发要点：

1. 创建一个 Express 服务器，用于处理动态 DNS 更新请求
2. 集成阿里云 DNS API，实现域名记录的增删改查
3. 实现以下核心功能：
   - API 密钥验证
   - IPv4/IPv6 支持
   - DNS 记录管理（查询、添加、更新）
   - 错误处理和日志记录
4. 使用环境变量进行配置管理
5. 实现请求参数验证
6. 添加详细的日志记录功能

## 错误处理

服务会返回适当的 HTTP 状态码和错误消息：

- 400: 缺少必需参数或参数无效
- 401: API 密钥无效
- 500: 服务器内部错误

## 日志记录

服务会记录以下信息：
- 请求开始时间
- 操作类型和详情
- 执行时长
- 错误信息（如果有）
- DNS 记录变更详情

## 许可证

[添加适当的许可证信息]

## 贡献指南

[添加贡献指南信息]