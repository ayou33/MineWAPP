---
name: mock-api
description: '接口集成工作流：为指定模块生成 *.api.ts 类型定义与 *.mock.ts 模拟数据。USE FOR: 新增接口定义、从 mock 数据反推类型、根据业务需求生成接口+mock。DO NOT USE FOR: 修改已有接口协议、优化已有模块代码。'
argument-hint: '<模块路径>，例如: src/module/game'
---

# 接口集成工作流

## 角色定位

你是一名熟悉 SolidJS/TypeScript 项目规范的后端集成工程师。  
目标是为指定模块生成**类型安全的 API 定义**和**与之匹配的 Mock 数据**，遵循项目的 `get/post` 工厂函数规范和 mock 系统约定。

## 核心约束

- API 定义统一使用 `get`/`post` 工厂函数，禁止直接使用 axios
- Mock 数据必须覆盖 API 响应类型的**所有必选字段**
- `*.api.ts` 中的 mock 标记：需要 mock 的接口在 URL 加 `$` 前缀
- 生成的类型与 mock 数据必须**双向一致**：类型由数据推导，数据匹配类型
- 每次只操作一个模块目录

## 执行步骤

### 第一步：探查模块现状

1. 读取目标模块目录（`<模块路径>/`）的文件列表
2. 检查是否存在：
   - `*.api.ts` — 现有接口定义
   - `*.mock.ts` — 现有 mock 数据
3. 根据检查结果选择**分支 A**或**分支 B**

---

### 分支 A：已有 Mock 数据 → 反推 API 类型

> 适用场景：模块已有 `*.mock.ts`，但接口类型定义不完整或未建立

#### A1. 解析 mock handler 的返回值

读取 `*.mock.ts` 中所有 `defineMock` 调用，提取：
- **接口路径**（第一个参数，如 `/api/game/player`）
- **返回数据结构**（handler 函数的 return 对象）
- **入参结构**（handler 函数的参数，如有）

#### A2. 推导 TypeScript 类型

根据 mock 返回值推导响应类型，遵循以下规则：

| mock 值 | 推导类型 |
|---------|---------|
| 字符串字面量 | `string` |
| 数字字面量 | `number` |
| `true`/`false` | `boolean` |
| 对象 `{}` | 具名 interface，字段名与 mock 保持一致 |
| 数组 `[]` | `T[]`，元素类型由数组首项推导 |
| `null` / `undefined` | 标注为可选（`?`）或联合 `T \| null` |
| 函数调用或 `Date.now()` | 推导为其返回类型（如 `number`） |

- 为每个接口建立独立的命名类型（`interface` 或 `type`）
- 若多个接口共享相同子结构，提取为共享类型

#### A3. 生成/更新 `*.api.ts`

- 写入推导出的类型定义
- 用 `$` 前缀标记这些接口（已有 mock handler 的一律加 `$`）
- 格式参考：

```typescript
export type GamePlayer = {
  userId: number
  nickname: string
  amount: number
}

export const readPlayer = get<GamePlayer, { roomId: string }>('$/app/game/operation/user/v2')
```

#### A4. 自我检查

- [ ] 所有 `defineMock` 调用都有对应的 `api.ts` 类型
- [ ] `api.ts` 中的 `$` 前缀数量 = `mock.ts` 中的 `defineMock` 数量
- [ ] 类型中无 `any`（除非 mock 数据本身无法推导）
- [ ] mock 返回值满足类型的所有必选字段

---

### 分支 B：无 Mock 数据 → 按业务需求建立接口与 Mock

> 适用场景：全新接口，或尚无任何 mock 文件

#### B1. 收集接口需求

询问或从上下文/需求描述中提取：
- 接口路径（`/api/...` 或 `/app/...`）
- HTTP 方法（GET / POST）
- 入参字段名、类型和是否必填
- 响应数据字段名、类型和语义
- 是否需要 mock（建议 dev 阶段均开启）

若信息不足，**优先询问**，不要猜测字段含义。

#### B2. 定义 API 类型（`*.api.ts`）

按接口粒度建立独立类型：

```typescript
// src/module/game/game.api.ts
import { get, post } from '@/tools/request'

export type GameRoom = {
  roomId: string
  title: string
  prizeId: number
  status: 0 | 1    // 0=关闭 1=开启
}

export type RoomParams = {
  roomId: string
}

// 加 $ 前缀标记为可 mock
export const readRoom = get<GameRoom, RoomParams>('$/app/game/room/detail')
export const joinRoom = post<null, { roomId: string }>('$/api/game/room/join')
```

#### B3. 生成 Mock 数据（`*.mock.ts`）

为每个 `$` 前缀接口创建 mock handler：

```typescript
// src/module/game/game.mock.ts
import { defineMock } from '@/tools/mock'
import { GameRoom } from './game.api'

defineMock<GameRoom>('/app/game/room/detail', (params) => ({
  roomId: params?.roomId ?? 'room_001',
  title: 'Mock Gaming Room',
  prizeId: 1001,
  status: 1,
}))

defineMock<null>('/api/game/room/join', () => null)
```

Mock 数据质量要求：
- 字符串字段给有意义的占位值，不要留空字符串
- 数组字段至少提供 2 条数据，以便 UI 列表调试
- 数字 ID 用容易识别的占位值（如 `9001`、`99999`）
- 枚举字段覆盖最常用的状态值

#### B4. 自我检查

- [ ] 每个 `$` 前缀接口都有对应的 `defineMock` 调用
- [ ] mock 数据满足类型的所有必选字段，无编译报错
- [ ] `defineMock` 的泛型参数 `<R>` 与 `api.ts` 中的响应类型一致
- [ ] 数组类型字段至少包含 2 条 mock 数据

---

### 第二步（通用）：验证编译

完成 A 或 B 分支后，检查以下文件有无 TypeScript 错误：
- 生成/修改的 `*.api.ts`
- 生成/修改的 `*.mock.ts`

若有报错，逐一修复后再输出结果。

---

## 文件命名规范

| 目标 | 文件名 |
|------|--------|
| 接口定义 | `<module>.api.ts`，与模块主文件同目录 |
| Mock 数据 | `<module>.mock.ts`，与 `api.ts` 同目录 |

## URL 前缀规范

| 前缀 | 用途 |
|------|------|
| `/api/...` | 用户相关、业务逻辑接口 |
| `/app/...` | 游戏/房间等应用核心接口 |
| `/news/...` | 资讯类接口 |
| `$/...` | 同上，dev 环境下被 mock 拦截 |

## 参考资料

- [src/tools/mock/index.ts](../../../src/tools/mock/index.ts) — `defineMock` API
- [src/tools/request/index.ts](../../../src/tools/request/index.ts) — `get`/`post` 工厂函数
