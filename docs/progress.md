# 🚀 简历优化器小程序 - 开发进度文档

> 本文档实时记录开发进度，随时查看最新状态

---

## 📋 项目概览

| 项目 | 内容 |
|---|---|
| **项目名称** | 简历优化器小程序 |
| **核心目标** | 帮助用户提升简历通过率，验证付费转化能力 |
| **AI 接口** | DeepSeek |
| **支付策略** | 冷启动阶段暂不接入支付，采用「预约解锁弹窗」模式 |
| **用户信息** | 仅记录 openid（最简方案）|

---

## 📊 总体进度

```
阶段一 [██████████] 100%  ✅ 已完成
阶段二 [██████████] 100%  ✅ 已完成
阶段三 [██████████] 100%  ✅ 已完成
阶段四 [██████████] 100%  ✅ 已完成
```

---

## ✅ 阶段一：输入页 + DeepSeek AI 接口对接（已完成）

### 完成时间
2026-05-04

### 已完成文件

| 文件路径 | 说明 |
|---|---|
| `miniprogram/app.json` | 页面路由配置（index + result），标题更新为「简历优化器」|
| `miniprogram/app.js` | 全局数据增加 `optimizeResult` 缓存 |
| `miniprogram/pages/index/index.wxml` | 输入页结构：岗位输入 + 简历输入 + 开始优化按钮 |
| `miniprogram/pages/index/index.js` | 输入页逻辑：表单校验 + 云函数调用 + 跳转结果页 |
| `miniprogram/pages/index/index.wxss` | 输入页样式：卡片式布局 + 渐变按钮 |
| `miniprogram/pages/result/index.wxml` | 结果页基础结构：评分 + 简历 + 问题 + 说明 |
| `miniprogram/pages/result/index.js` | 结果页逻辑：读取全局数据并展示 |
| `miniprogram/pages/result/index.wxss` | 结果页样式：评分圆环 + 问题列表卡片 |
| `miniprogram/pages/result/index.json` | 结果页配置 |
| `cloudfunctions/resumeOptimize/index.js` | DeepSeek AI 云函数：API 调用 + Mock 容错 |
| `cloudfunctions/resumeOptimize/package.json` | 云函数依赖配置 |
| `cloudfunctions/resumeOptimize/config.json` | 云函数权限配置 |

### 功能特性

- [x] 首页输入表单（岗位名称 + 简历内容）
- [x] 表单字数统计
- [x] 提交按钮状态管理（未填完置灰，合法后高亮）
- [x] 调用云函数进行 AI 优化
- [x] 结果页展示：匹配度评分 / 优化后简历 / 存在问题 / 优化说明
- [x] Mock 数据 fallback（未配置 API Key 时也能测试）

### 需要手动配置的事项

- [ ] 填写云开发环境 ID（`app.js` 中 `env` 字段）
- [ ] 上传并部署云函数 `resumeOptimize`
- [ ] 配置 DeepSeek API Key（云函数环境变量，可选）

---

## ✅ 阶段二：结果页截断展示 + 预约解锁弹窗（已完成）

### 完成时间
2026-05-04

### 已完成文件

| 文件路径 | 说明 |
|---|---|
| `miniprogram/components/bookingModal/index` | **预约解锁弹窗组件**：标题/副标题/已完成/未解锁/价格锚点/预约激励/紧迫感/社会证明/主按钮/次按钮 |
| `miniprogram/components/bookingSuccessModal/index` | **预约成功弹窗组件**：成功图标/标题/描述/关闭按钮 |
| `miniprogram/pages/result/index.wxml` | 结果页改造：简历截断（30%）+ 问题仅展示2条 + 锁定覆盖层 + 触发按钮 |
| `miniprogram/pages/result/index.js` | 结果页逻辑：问题列表分离 + 弹窗触发 + 预约调用 + 统计获取 |
| `miniprogram/pages/result/index.wxss` | 结果页样式：渐变遮罩 + 锁定覆盖层 + 问题卡片 |
| `miniprogram/pages/result/index.json` | 引入 bookingModal + bookingSuccessModal 组件 |
| `miniprogram/pages/index/index.wxml` | 增加弹窗组件引用 |
| `miniprogram/pages/index/index.js` | 输入页逻辑：使用次数拦截（第二次触发弹窗）+ 预约功能 |
| `miniprogram/pages/index/index.json` | 引入弹窗组件 |
| `cloudfunctions/createReservation/index.js` | **预约云函数**：创建预约记录 + 查询统计 + 防重复预约 |
| `cloudfunctions/createReservation/package.json` | 云函数依赖配置 |
| `cloudfunctions/createReservation/config.json` | 云函数权限配置 |

### 功能特性

- [x] 结果页简历截断展示（固定高度 + 渐变遮罩 + 锁定覆盖层）
- [x] 结果页问题仅展示前2条，剩余显示「还有 X 条关键问题未展示」
- [x] 点击「解锁完整优化」触发预约弹窗
- [x] 点击「查看更多问题」触发预约弹窗
- [x] 第二次使用功能时触发弹窗（本地 storage 记录 usageCount）
- [x] 预约弹窗完整 UI：焦虑文案 + 价格锚点 + 预约激励 + 紧迫感 + 社会证明
- [x] 预约成功反馈弹窗
- [x] 云函数记录预约 openid + 来源页面 + 时间（自动防重复）
- [x] 云函数查询总预约数（用于社会证明动态显示）
- [x] 已预约用户本地标记（`has_booked`），避免重复弹窗

### 需要手动配置的事项

- [ ] 上传并部署云函数 `createReservation`
- [ ] 云数据库自动创建 `reservations` 集合（首次调用时自动创建）

### 预计内容

#### 结果页改造
- [ ] 优化后简历仅展示 **30%**，剩余内容锁定
- [ ] 存在问题仅展示 **2条**，剩余隐藏
- [ ] 增加「查看完整优化」按钮（触发弹窗）
- [ ] 增加「查看更多内容」按钮（触发弹窗）

#### 预约解锁弹窗
- [ ] 弹窗结构：标题 + 副标题 + 已完成提示 + 未解锁内容
- [ ] 价格锚点展示：单次 1.9元 / 全天 6.9元
- [ ] 预约激励：免费解锁1次 或 专属5折
- [ ] 紧迫感设计：内测名额仅限前100人
- [ ] 社会证明：已有 XXX 人预约解锁完整版
- [ ] 主按钮：🔥 立即预约（上线优先解锁）
- [ ] 次按钮：再看看（弱化）
- [ ] 预约成功反馈弹窗

#### 触发逻辑
- [ ] 点击「解锁完整优化」触发弹窗
- [ ] 点击「查看更多内容」触发弹窗
- [ ] 第二次使用功能时触发弹窗（免费次数用完）

---

## ✅ 阶段三：云函数后端（预约记录、用户标签、埋点统计）（已完成）

### 完成时间
2026-05-04

### 已完成文件

| 文件路径 | 说明 |
|---|---|
| `cloudfunctions/trackEvent/index.js` | **埋点云函数**：记录所有用户行为事件到 `events` 集合 |
| `cloudfunctions/getUserTag/index.js` | **用户标签云函数**：获取/更新用户标签和 usageCount |
| `cloudfunctions/getDashboard/index.js` | **统计面板云函数**：计算转化率等核心指标 |
| `miniprogram/app.js` | 增加全局方法 `trackEvent()` 和 `updateUserTag()` |
| `miniprogram/pages/index/index.js` | 集成埋点：submit_resume / show_modal / click_book / click_cancel |
| `miniprogram/pages/result/index.js` | 集成埋点：click_unlock / show_modal / click_book / click_cancel + 标签更新 |

### 数据库集合设计

| 集合名 | 用途 | 字段 |
|---|---|---|
| `reservations` | 预约记录（阶段二已创建）| _openid, source, createTime |
| `users` | 用户标签 | _openid, tag, usageCount, firstVisitTime, lastVisitTime |
| `events` | 埋点事件 | _openid, eventType, page, extraData, createTime |

### 埋点事件清单

| eventType | 触发时机 | 页面 |
|---|---|---|
| `submit_resume` | 点击「开始优化」| index |
| `show_modal` | 弹窗展示 | index/result |
| `click_unlock` | 点击「解锁完整优化」或「查看更多问题」| result |
| `click_book` | 点击「立即预约」| index/result |
| `click_cancel` | 点击「再看看」或关闭弹窗 | index/result |

### 用户标签流转

```
normal（普通用户）
  → 点击解锁/查看更多/第二次使用开始优化 → clicked_pay（点击过付费用户）
    → 点击立即预约 → booked（已预约用户）
```

### 统计指标

| 指标 | 计算方式 |
|---|---|
| 总用户数 | users 集合总数 |
| 点击过付费用户数 | tag = 'clicked_pay' 或 'booked' |
| 已预约用户数 | tag = 'booked' |
| 弹窗展示次数 | events 中 eventType = 'show_modal' |
| 解锁点击次数 | events 中 eventType = 'click_unlock' |
| 预约点击次数 | events 中 eventType = 'click_book' |
| 解锁→预约转化率 | bookClicks / unlockClicks × 100% |
| 弹窗→预约转化率 | bookClicks / modalShows × 100% |

### 需要手动配置的事项

- [ ] 上传并部署云函数 `trackEvent`
- [ ] 上传并部署云函数 `getUserTag`
- [ ] 上传并部署云函数 `getDashboard`
- [ ] 云数据库自动创建 `users` 和 `events` 集合（首次调用时自动创建）

### 预计内容

- [ ] 数据库集合设计：`reservations`（预约记录）、`users`（用户标签）、`events`（埋点事件）
- [ ] 用户标签系统：普通用户 / 点击过付费用户 / 已预约用户
- [ ] 预约记录云函数：记录 openid + 预约时间 + 来源页面
- [ ] 数据埋点云函数：
  - [ ] 记录「解锁」按钮点击
  - [ ] 记录弹窗展示次数
  - [ ] 记录「立即预约」按钮点击
- [ ] 统计接口：预约转化率计算

---

## ✅ 阶段四：测试优化 + 上线准备（已完成）

### 完成时间
2026-05-04

### 已完成文件

| 文件路径 | 说明 |
|---|---|
| `miniprogram/pages/admin/index` | **数据看板页面**：总用户数/提交数/解锁数/预约数/转化率/用户分布 |
| `miniprogram/app.json` | 增加 `pages/admin/index` 路由 |
| `miniprogram/pages/index/index.wxml` | 增加字数过长警告 + 数据看板入口 |
| `miniprogram/pages/index/index.js` | 增加超长内容二次确认 + 长按标题清除缓存 + 跳转看板 |
| `miniprogram/pages/index/index.wxss` | 增加警告文字样式 |
| `miniprogram/pages/result/index.js` | 增加数据兼容处理（防止 AI 返回字段缺失报错）|
| `docs/checklist.md` | **上线检查清单**：环境/云函数/API/功能/数据库/合规/性能 |

### 优化内容

- [x] 输入页：简历内容超过 5000 字显示警告，超过 8000 字提交时二次确认
- [x] 输入页：长按标题可清除本地缓存（方便测试重置）
- [x] 输入页：底部增加「📊 数据看板」入口
- [x] 结果页：AI 返回数据做兼容处理，防止字段缺失导致白屏
- [x] 网络异常提示优化：「网络异常，请检查网络后重试」
- [x] 数据看板：实时展示核心转化指标，带颜色判断（绿/黄/红）
- [x] 数据看板：用户分布可视化条形图
- [x] 上线检查清单文档

### 需要手动配置的事项

- [ ] 上传并部署云函数 `trackEvent`、`getUserTag`、`getDashboard`
- [ ] 按 `docs/checklist.md` 逐项检查

### 预计内容

- [ ] 全流程测试（输入 → AI 优化 → 结果展示 → 弹窗 → 预约）
- [ ] 边界情况处理（空内容、超长内容、网络异常）
- [ ] 体验优化（加载状态、错误提示、返回逻辑）
- [ ] 性能优化（减少 setData、图片压缩）
- [ ] 上线前检查清单

---

## 📁 项目结构

```
mini_jlscq/
├── cloudfunctions/
│   ├── quickstartFunctions/          # 原有云函数
│   └── resumeOptimize/               # 🆕 简历优化 AI 云函数（阶段一）
│       ├── config.json
│       ├── index.js
│       └── package.json
├── docs/
│   ├── req.md                        # 需求文档
│   └── progress.md                   # 📌 本文档
├── miniprogram/
│   ├── components/
│   ├── images/
│   ├── pages/
│   │   ├── index/                    # 🆕 输入页（阶段一）
│   │   │   ├── index.js
│   │   │   ├── index.json
│   │   │   ├── index.wxml
│   │   │   └── index.wxss
│   │   └── result/                   # 🆕 结果页（阶段一基础版）
│   │       ├── index.js
│   │       ├── index.json
│   │       ├── index.wxml
│   │       └── index.wxss
│   ├── app.js
│   ├── app.json
│   ├── app.wxss
│   ├── envList.js
│   └── sitemap.json
├── project.config.json
├── project.private.config.json
└── README.md
```

---

## 🔧 关键配置备忘

### 云开发环境 ID
```javascript
// miniprogram/app.js
env: "你的云开发环境ID",
```

### DeepSeek API Key
```bash
# 云函数环境变量配置
变量名: DEEPSEEK_API_KEY
变量值: sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 📈 核心指标目标

| 指标 | 目标值 | 当前状态 |
|---|---|---|
| 预约转化率 | ≥ 10% | 未上线 |
| 弹窗展示 → 预约点击 | ≥ 20% | 未上线 |
| 用户完成输入 → 触发弹窗 | - | 未上线 |

---

## 📝 更新日志

| 日期 | 内容 | 负责人 |
|---|---|---|
| 2026-05-04 | 阶段一完成：输入页 + DeepSeek AI 接口对接 | Kimi |
| 2026-05-04 | 阶段二完成：结果页截断展示 + 预约解锁弹窗 | Kimi |
| 2026-05-04 | 阶段三开始：用户标签 + 埋点统计 + 数据面板 | Kimi |
| 2026-05-04 | 创建开发进度文档 | Kimi |

---

> **下一步动作**：完成阶段一手动配置（环境 ID + 云函数部署 + API Key），测试通过后进入阶段二开发。
