# 外包报销管理系统 - MVP 设计文档

> 版本：v0.4.0
> 最后更新：2026-04-20
> 状态：已上线（Netlify + Supabase 部署）

---

## 一、项目概述

### 1.1 项目目标
搭建一个轻量级外包报销管理系统 MVP，支持员工在线提交报销申请，系统自动生成邮件模板，由上级审批。最终部署上线。

### 1.2 用户角色

| 角色 | 权限 |
|------|------|
| 员工 | 提交报销、查看自己的报销记录、预览邮件 |
| 审批人 | 审批下属报销（通过/驳回）、查看审批历史 |
| 管理员 | 管理用户、配置上下级关系 |

---

## 二、核心功能（MVP Scope）

### 2.1 用户模块
- [x] 邮箱 + 密码 注册/登录
- [x] 角色分配（员工/审批人/管理员）
- [x] 上下级关系绑定（每个员工指定一个审批人）

### 2.2 报销申请模块（月度日历模式）

#### 交互方式：
报销以**月度**为单位提交。页面分为左右两栏：
- **左侧**：月份日历网格（按天平铺），用户可拖拽连续选择多天出差日期
- **右侧**：已选日期的逐日明细编辑面板，每天可独立填写

#### 月度报销主字段：

| 字段名 | 字段key | 类型 | 说明 |
|--------|---------|------|------|
| 报销月份 | month | YYYY-MM | 当前操作月份 |
| 每日明细 | dailyDetails | 数组 | 选中日期的逐日明细 |
| 住宿费总额 | totalHotelFee | 自动计算 | 所有天的住宿费之和 |
| 交通费总额 | totalTransportFee | 自动计算 | 所有天的交通费之和 |
| 报销总额 | totalAmount | 自动计算 | 住宿费总额 + 交通费总额 |

#### 每日明细字段（DailyDetail）：

| 字段名 | 字段key | 类型 | 必填 | 说明 |
|--------|---------|------|------|------|
| 日期 | date | YYYY-MM-DD | ✅ | 由日历选择确定 |
| 出差地 | destination | 文本 | ✅ | 出差目的地 |
| 出差原因 | reason | 文本 | ✅ | 简述出差目的 |
| 交通方式 | transportTypes | 多选标签 | ❌ | 高铁/飞机/自驾/打车/大巴（支持多选，选填） |
| 差旅往返交通费（含高速） | transportFee | 数字 | ✅ | 当天交通费，单位：元 |
| 出差地住宿费 | hotelFee | 数字 | ✅ | 当天住宿费，单位：元 |
| 备注 | remark | 文本 | ❌ | 补充说明 |

#### 日历交互要点：
- 月份切换：顶部年月选择器
- 拖拽选择：鼠标按下拖拽连续选天，或点击单日
- 已选日期高亮显示，已填写的日期标记绿色圆点
- 点击已选日期可在右侧编辑/删除该天明细
- 底部汇总栏实时显示三项总额

#### 功能要点：
- 以月度为单位提交报销
- 支持日历拖拽多选出差日期
- 逐日独立编辑明细
- 实时统计：住宿费总额、交通费总额、全部总额
- 查看个人报销历史列表
- 查看报销详情
- 审批前可撤回

### 2.3 邮件自动生成模块

提交报销后，系统按模板自动生成邮件内容，支持预览和一键复制。

#### 邮件模板（v0.4.0 更新）：

```text
主题：【报销申请】{姓名} - {月份}月报销 - {报销总额}元

姓名：{姓名}
团队：{团队名称}
出差时间：{第一天日期}-{最后一天日期}
出差地点：{所有出差地去重，用/连接}
出差总天数：{选中天数}天
非字节工区出差总天数：{选中天数}天
加班天数：{加班天数}天
差旅往返交通总费用：{交通费总额}
差旅地住宿总费用：{住宿费总额}
出差事由：{按日期段归组的出差原因}
{M/D-M/D}
{出差原因1}
{M/D-M/D}
{出差原因2}
...
```

**出差事由自动归组逻辑**：系统将连续日期中相同/相近的出差原因合并为日期段展示，每段显示日期范围 + 该段内的出差原因列表。

### 2.4 审批流程模块

#### 状态流转：

```text
[待审批] → [已通过]
         → [已驳回]（附驳回原因）
[待审批] → [已撤回]（申请人主动撤回）
```

#### 审批人操作：
- 查看待审批列表
- 查看报销详情
- 通过 / 驳回（驳回需填写原因）
- 查看审批历史

#### 通知方式（MVP）：
- 站内状态变更（申请人可在列表中看到最新状态）
- 邮件内容支持预览和复制（手动发送）

---

## 三、技术架构

### 3.1 技术栈

| 层级 | 选型 | 说明 |
|------|------|------|
| 前端 | Next.js 16 (App Router) + Ant Design 5 + Tailwind CSS | SSR + 丰富组件库 |
| 后端 | Next.js API Routes | 全栈一体，减少部署复杂度 |
| 数据库 | PostgreSQL (Supabase) | 免费托管 |
| 认证 | JWT (jsonwebtoken + bcryptjs) + HttpOnly Cookie | 自主实现，灵活可控 |
| ORM | Prisma 6 (prisma-client-js) | 类型安全，迁移方便 |
| 部署 | Netlify + Supabase | 免费，GitHub 推送自动部署 |

### 3.2 项目目录结构

```text
reimbursement-system/
├── docs/
│   └── DESIGN.md              # 本设计文档
├── prisma/
│   └── schema.prisma          # 数据库模型定义
├── src/
│   ├── app/
│   │   ├── layout.tsx         # 全局布局
│   │   ├── page.tsx           # 首页（重定向到 dashboard）
│   │   ├── login/
│   │   │   └── page.tsx       # 登录页
│   │   ├── register/
│   │   │   └── page.tsx       # 注册页
│   │   ├── dashboard/
│   │   │   └── page.tsx       # 仪表盘
│   │   ├── reimbursement/
│   │   │   ├── new/
│   │   │   │   └── page.tsx   # 新建报销
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx   # 报销详情
│   │   │   └── list/
│   │   │       └── page.tsx   # 报销列表
│   │   ├── approval/
│   │   │   ├── pending/
│   │   │   │   └── page.tsx   # 待审批列表
│   │   │   └── history/
│   │   │       └── page.tsx   # 审批历史
│   │   ├── admin/
│   │   │   └── users/
│   │   │       └── page.tsx   # 用户管理
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/
│   │       │   │   └── route.ts
│   │       │   └── register/
│   │       │       └── route.ts
│   │       ├── reimbursement/
│   │       │   └── route.ts
│   │       └── approval/
│   │           └── route.ts
│   ├── components/
│   │   ├── Layout/
│   │   │   └── MainLayout.tsx # 主布局（侧边栏+顶栏）
│   │   ├── ReimbursementForm.tsx
│   │   ├── ReimbursementTable.tsx
│   │   ├── ApprovalTable.tsx
│   │   └── EmailPreview.tsx
│   ├── lib/
│   │   ├── supabase.ts        # Supabase 客户端
│   │   ├── prisma.ts          # Prisma 客户端
│   │   ├── auth.ts            # JWT 认证（从数据库实时读取角色）
│   │   ├── email-template.ts  # 邮件模板生成（v0.4.0 新格式）
│   │   └── locations.ts       # 全国 300+ 城市数据（模糊搜索用）
│   └── types/
│       └── index.ts           # TypeScript 类型定义
├── public/
├── .env.local                 # 环境变量（不提交到git）
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

### 3.3 数据库模型设计

```text
┌─────────────────────┐
│       User          │
├─────────────────────┤
│ id         String PK│
│ email      String   │
│ name       String   │
│ password   String   │ (hashed)
│ role       Enum     │ (EMPLOYEE / APPROVER / ADMIN)
│ department String?  │
│ phone      String?  │
│ approverId String?  │ → FK to User.id
│ createdAt  DateTime │
│ updatedAt  DateTime │
└─────────┬───────────┘
          │ 1:N
          ▼
┌───────────────────────────────┐
│    Reimbursement（月度报销单）  │
├───────────────────────────────┤
│ id               String PK   │
│ userId           String FK   │ → User.id
│ month            String      │ (YYYY-MM 格式)
│ totalHotelFee    Decimal     │ (住宿费总额)
│ totalTransportFee Decimal    │ (交通费总额)
│ totalAmount      Decimal     │ (auto-calculated)
│ status           Enum        │ (PENDING/APPROVED/REJECTED/WITHDRAWN)
│ emailContent     String?     │ (生成的邮件内容)
│ createdAt        DateTime    │
│ updatedAt        DateTime    │
└─────────┬────────────────────┘
          │ 1:N
          ▼
┌───────────────────────────────┐
│  ReimbursementDetail（每日明细）│
├───────────────────────────────┤
│ id               String PK   │
│ reimbursementId  String FK   │ → Reimbursement.id
│ date             DateTime    │ (具体日期)
│ destination      String      │
│ reason           String      │
│ transportTypes   String      │ (逗号分隔: "高铁,飞机")
│ transportFee     Decimal     │
│ hotelFee         Decimal     │
│ remark           String?     │
└───────────────────────────────┘
          │
          ▼ (Reimbursement 1:N)

┌─────────────────────────┐
│    Approval             │
├─────────────────────────┤
│ id               String PK│
│ reimbursementId  String FK│ → Reimbursement.id
│ approverId       String FK│ → User.id
│ status           Enum     │ (APPROVED / REJECTED)
│ comment          String?  │ (驳回原因)
│ createdAt        DateTime │
└─────────────────────────┘
```

---

## 四、页面与路由

| 页面 | 路由 | 角色 | 功能 |
|------|------|------|------|
| 登录 | `/login` | 所有 | 邮箱密码登录 |
| 注册 | `/register` | 所有 | 新用户注册 |
| 仪表盘 | `/dashboard` | 所有 | 概览：待办数量、最近报销 |
| 新建报销 | `/reimbursement/new` | 员工 | 填写报销表单 |
| 报销详情 | `/reimbursement/[id]` | 所有 | 查看详情 + 邮件预览 |
| 我的报销 | `/reimbursement/list` | 员工 | 个人报销列表 |
| 待审批 | `/approval/pending` | 审批人 | 待处理的报销申请 |
| 审批历史 | `/approval/history` | 审批人 | 已处理记录 |
| 用户管理 | `/admin/users` | 管理员 | 用户增删改、绑定上下级 |

---

## 五、API 设计

### 5.1 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/logout` | 退出登录 |
| GET  | `/api/auth/me` | 获取当前用户信息 |

### 5.2 报销

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/reimbursement` | 创建报销申请 |
| GET  | `/api/reimbursement` | 获取当前用户的报销列表 |
| GET  | `/api/reimbursement/[id]` | 获取报销详情 |
| PATCH| `/api/reimbursement/[id]` | 更新报销（撤回） |
| GET  | `/api/reimbursement/[id]/email` | 获取生成的邮件内容 |

### 5.3 审批

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/api/approval/pending` | 获取待审批列表 |
| GET  | `/api/approval/history` | 获取审批历史 |
| POST | `/api/approval/[reimbursementId]` | 审批操作（通过/驳回） |

### 5.4 用户管理（管理员）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/api/admin/users` | 获取用户列表 |
| PATCH| `/api/admin/users/[id]` | 修改用户角色/审批人 |

---

## 六、MVP 开发计划

### Phase 1：项目基础搭建 ✅
- [x] 初始化 Next.js 项目
- [x] 集成 Ant Design 5 + @ant-design/nextjs-registry
- [x] 配置 Prisma 6 ORM + Schema 定义
- [x] 搭建主布局（侧边栏 + 顶栏 + 角色菜单）

### Phase 2：用户模块 ✅
- [x] 注册页面 + API
- [x] 登录页面 + API
- [x] JWT + HttpOnly Cookie 登录态管理
- [x] 路由守卫（未登录重定向到 /login）

### Phase 3：报销模块 ✅
- [x] 报销表单页面（8个字段 + 自动计算总额）
- [x] 报销列表页面（含状态标签、撤回操作）
- [x] 报销详情页面（含审批记录时间线）
- [x] 撤回功能
- [x] 邮件模板自动生成 + 预览弹窗 + 一键复制

### Phase 4：审批模块 ✅
- [x] 待审批列表页面（通过/驳回操作）
- [x] 驳回原因弹窗
- [x] 审批历史页面

### Phase 5：管理员模块 ✅
- [x] 用户列表管理（角色切换、审批人绑定）

### Phase 6：部署上线 ✅
- [x] 配置 Supabase PostgreSQL 数据库
- [x] 运行 Prisma 数据库迁移
- [x] 配置线上环境变量（DATABASE_URL, DIRECT_URL, JWT_SECRET）
- [x] Netlify 部署（GitHub 自动部署）
- [ ] 域名绑定（可选）
- [x] 基本测试与验收

### Phase 7：UI/UX 优化 ✅

#### 7.1 品牌与视觉风格
- [x] 系统名称改为 "Bytedance 报销系统"，侧边栏展示字节跳动 Logo
- [x] 整体页面风格升级为 OpenAI 官网风格简约设计
  - 渐变背景（灰蓝色渐变）
  - 毛玻璃效果侧边栏和头部（backdrop-filter: blur）
  - 半透明内容区域（glassmorphism 风格）
  - 圆角卡片 + 悬浮阴影
  - 自定义滚动条
  - 页面切换淡入动画（fadeSlideIn）
- [x] 登录/注册页面：居中卡片布局 + 背景渐变动画 + 毛玻璃卡片

#### 7.2 交互体验
- [x] 菜单页面跳转增加顶部 loading 进度条（蓝紫渐变，2px 固定顶部）
- [x] 防止重复点击：同一路由不重复导航
- [x] 页面切换时自动重置进度条

#### 7.3 工作台优化
- [x] 最近报销记录增加 **月份筛选**（DatePicker month 模式）
- [x] 最近报销记录增加 **状态筛选**（Select 下拉，支持清空）
- [x] 筛选项位于卡片右上角，小尺寸不占空间

#### 7.4 新建报销页面优化
- [x] 出差地改为 **AutoComplete 组件**，支持全国 300+ 城市模糊搜索
  - 数据来源：`src/lib/locations.ts`，涵盖全国地级市 + 特别行政区 + 自定义地点
  - 支持中文模糊匹配（输入部分城市名即可筛选）
- [x] 交通方式改为 **选填**（非必填），仅出差地和出差原因为必填项
- [x] 新增 **团队名称** 输入框（用于邮件模板）
- [x] 新增 **加班天数** 输入框（用于邮件模板）

#### 7.5 邮件模板格式优化
- [x] 邮件正文格式调整为字节跳动内部报销邮件规范格式
  - 包含字段：姓名、团队、出差时间、出差地点、出差总天数、非字节工区出差总天数、加班天数、差旅往返交通总费用、差旅地住宿总费用
  - 出差事由自动按连续日期段归组展示（日期范围 + 原因列表）
  - 出差地点自动去重合并（用 `/` 连接）

#### 7.6 Bug 修复
- [x] `getCurrentUser()` 改为从数据库实时读取用户角色，修复在 Supabase 中修改角色后 JWT 缓存导致权限不生效的问题
- [x] `/api/auth/me` 路由简化，复用 `getCurrentUser()` 的数据库查询逻辑

---

## 七、变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v0.1.0 | 2026-04-20 | 初始 MVP 设计文档 | AI Assistant |
| v0.2.0 | 2026-04-20 | MVP 代码完成：Phase 1-5 全部实现，构建通过。技术栈调整：Prisma 6 + JWT 自主认证 | AI Assistant |
| v0.3.0 | 2026-04-20 | **重大变更**：报销表单从单条改为月度日历模式。新增日历拖拽选日、逐日明细编辑、交通方式多选、三项费用独立汇总。新增 ReimbursementDetail 模型。 | AI Assistant |
| v0.3.1 | 2026-04-20 | 项目部署上线。Supabase 数据库配置 + Prisma 迁移 + Netlify 自动部署。修复 getCurrentUser 角色缓存 Bug。 | AI Assistant |
| v0.4.0 | 2026-04-20 | **UI/UX 全面优化**：① 品牌升级为 Bytedance 报销系统 + Logo ② OpenAI 风格毛玻璃简约 UI ③ 页面跳转 loading 进度条 ④ 工作台筛选（月份+状态）⑤ 出差地全国城市模糊搜索 ⑥ 交通方式改为选填 ⑦ 邮件模板调整为字节内部格式（含团队/加班天数/出差事由按日期段归组）| AI Assistant |

---

> 本文档为系统设计的唯一真相来源（Single Source of Truth），每次需求变更或技术调整请更新本文档并在变更记录中注明。
