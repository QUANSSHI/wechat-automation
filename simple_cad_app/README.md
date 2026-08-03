# 📐 Simple CAD App - 纯前端轻量级 2D 矢量 CAD 绘图系统

Simple CAD App 是一款基于 HTML5 Canvas 和原生 JavaScript 开发的轻量级 Web 2D CAD 绘图交互应用，具备高度响应式的现代暗黑视觉设计。

---

## 🎨 核心功能与亮点

- **矢量图形绘制**：支持直线 (Line)、矩形 (Rectangle)、圆/圆弧 (Circle/Arc)、折线与多边形 (Polyline)。
- **智能辅助网格与捕抓**：提供背景极坐标网格背景与端点/中点吸附捕抓 (Object Snap)。
- **实时尺寸测量**：自动计算绘制线段的长度、角度与坐标位置。
- **暗黑极客主题 (Dark Theme)**：基于 CSS 变量的高质感暗黑界面与高阶毛玻璃控制工具栏。
- **纯前端零依赖**：无任何第三方包或框架，直接双击 \index.html\ 即可启动使用。

---

## 🚀 启动与使用

直接在浏览器中打开项目目录下的 index.html 文件：

`ash
# 或者使用 Python 启动轻量 HTTP 本地服务
cd simple_cad_app
python -m http.server 8080
`
在浏览器中访问：[http://localhost:8080](http://localhost:8080)

---

## 📂 文件结构

- **index.html**：CAD 页面视图与工具栏 DOM 结构
- **style.css**：暗黑毛玻璃风格与 Canvas 画布自适应样式
- **pp.js**：2D 矢量渲染引擎、事件监听及图元管理核心逻辑
