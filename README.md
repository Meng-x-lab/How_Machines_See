# 机器是怎么识别图像的？

一个面向儿童的 AI 教育静态前端作品，主题围绕“机器如何识别图像”。项目当前包含 3 个互相关联的页面：

- 主体科普页
- 图像识别知识测验
- 人脸合规测验

本次重构的目标不是重写内容，而是在尽量保留原有页面内容、互动方式和奶油黄卡通风格的前提下，整理成一个适合 GitHub 管理、并可直接部署到 Vercel 的清晰前端项目。

## 项目结构

```text
How_Machines_See/
├─ assets/
│  ├─ css/
│  │  ├─ common.css
│  │  └─ quiz-theme.css
│  ├─ images/
│  │  └─ logo.png
│  └─ media/
│     └─ intro-video.mp4
├─ quizzes/
│  ├─ image-recognition/
│  │  └─ index.html
│  └─ face-compliance/
│     └─ index.html
├─ index.html
├─ README.md
└─ .gitignore
```

## 重构说明

### 1. 页面与资源重新归类

- 主体页面作为站点入口，统一放在根目录 `index.html`
- 两个测验页面整理到 `quizzes/` 子目录下，便于后续继续扩展更多互动页
- 公共图片、视频、样式统一归档到 `assets/` 下，避免页面直接依赖杂乱的导出附件目录

### 2. 部署相关路径修复

- 已移除 `file:///` 本地绝对链接
- 主体页视频已改为 `./assets/media/intro-video.mp4`
- 页面跳转已统一改成适合 GitHub Pages / Vercel 的相对路径
- 已去掉浏览器导出页面里直接暴露的来源页跳转和无意义底部来源按钮

### 3. 统一页面关系

- 首页结尾新增两个明显入口按钮，分别进入两个测验页面
- 两个测验页都加入返回首页和跳转到另一个测验页的导航
- 三个页面现在形成完整的互相跳转闭环

## 页面跳转关系

- 首页：`/` 或 `index.html`
- 图像识别知识测验：`/quizzes/image-recognition/`
- 人脸合规测验：`/quizzes/face-compliance/`

相对路径设计如下：

- 首页到图像识别测验：`./quizzes/image-recognition/`
- 首页到人脸合规测验：`./quizzes/face-compliance/`
- 测验页返回首页：`../../`
- 两个测验页之间互跳：
  - `../image-recognition/`
  - `../face-compliance/`

## 本地预览

这是一个纯静态项目，不依赖打包工具。你可以直接使用任意静态服务器预览，例如：

```powershell
python -m http.server 8000
```

然后访问：

- `http://localhost:8000/`

## GitHub 与 Vercel 部署建议

### GitHub

- 直接将当前目录初始化为 Git 仓库
- 推送到 GitHub 后，可用 GitHub Pages 做静态托管
- `.gitignore` 已排除本地缓存、原始导出备份和无关辅助文件

### Vercel

- 作为静态站点可直接导入仓库部署
- 不需要额外的构建命令
- 输出目录保持仓库根目录即可

## 保留与优化原则

- 保留原有主体页面的奶油黄、温暖、儿童化、动画感风格
- 保留原有主要互动逻辑，尤其是两个测验页的答题逻辑
- 用少量共享样式把两个测验页往主体风格上统一
- 优先做结构清理、路径修复和可维护性提升，不过度工程化
