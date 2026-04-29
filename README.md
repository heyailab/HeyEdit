# HeyEdit

<p align="center">
  <img src="app-icon.svg" alt="HeyEdit Logo" width="120" />
</p>

<p align="center">
  <a href="https://github.com/heyailab/HeyEdit/releases">
    <img src="https://img.shields.io/github/v/release/heyailab/HeyEdit?color=blue" alt="Release" />
  </a>
  <a href="https://github.com/heyailab/HeyEdit/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/heyailab/HeyEdit" alt="License" />
  </a>
  <a href="https://github.com/heyailab/HeyEdit/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/heyailab/HeyEdit/release.yml" alt="Build" />
  </a>
</p>

<p align="center">
  <b>一款传统桌面风格的 Markdown 编辑器</b><br />
  专注于纯粹的本地写作体验
</p>

---

## ✨ 功能特性

- **预览 / 编辑双模式** — 默认预览模式，点击按钮一键切换编辑，Markdown 实时渲染
- **多编码支持** — 自动检测 GBK、UTF-16 等编码，打开旧文件不再乱码
- **语法高亮** — 代码块自动高亮，支持主流编程语言
- **本地优先** — 所有文件存储在本地，无需注册、无需联网
- **中英双语界面** — 内置 i18n，支持中英文切换
- **文件侧边栏** — 快速切换最近打开的文件
- **字数统计** — 实时显示字数和字符数

## 📦 安装

### Windows

下载 `.msi` 安装包，双击安装即可。

### macOS

下载 `.dmg` 文件，拖动到 Applications 文件夹。

### Linux

下载 `.AppImage` 或 `.deb` 包安装。

👉 **[前往 Releases 页面下载最新版本](https://github.com/heyailab/HeyEdit/releases)**

## 🛠 技术栈

| 类别 | 技术 |
|------|------|
| 桌面框架 | [Tauri 2](https://v2.tauri.app/) |
| 前端框架 | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| 构建工具 | [Vite 6](https://vitejs.dev/) |
| 样式方案 | [Tailwind CSS 4](https://tailwindcss.com/) |
| 编辑器 | [Tiptap v3](https://tiptap.dev/) |
| Markdown 渲染 | [markdown-it](https://github.com/markdown-it/markdown-it) |
| 状态管理 | [Zustand](https://github.com/pmndrs/zustand) |

## 🚀 开发

### 环境要求

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 10
- [Rust](https://www.rust-lang.org/) >= 1.77
- [Tauri CLI](https://v2.tauri.app/start/prerequisites/)

### 克隆项目

```bash
git clone https://github.com/heyailab/HeyEdit.git
cd HeyEdit
```

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm tauri dev
```

### 构建生产版本

```bash
pnpm tauri build
```

构建产物在 `src-tauri/target/release/bundle/` 目录下。

## 📸 截图

> 暂无截图，欢迎贡献 🙏

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 📄 开源协议

本项目采用 MIT 协议开源 — 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 相关链接

- [GitHub Repository](https://github.com/heyailab/HeyEdit)
- [Issue Tracker](https://github.com/heyailab/HeyEdit/issues)
- [Releases](https://github.com/heyailab/HeyEdit/releases)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/heyailab">heyailab</a>
</p>
