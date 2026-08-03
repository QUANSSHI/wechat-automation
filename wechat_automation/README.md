# 💬 WeChat Automation - 微信 UI 自动化工具箱

本模块包含了基于 Windows UIAutomation 和 Win32 接口构建的微信（PC 桌面版）自动化控制工具与脚本，支持自动发送消息、提取聊天记录及分析控件结构。

---

## 📂 文件与工具结构

- **\wxauto/\**：核心 UI 自动化驱动包（封装了微信窗口定位、消息监听、聊天记录抓取、文件发送等 API）。
- **\send_test.py\**：简单的微信消息发送与接收测试脚本。
- **\send_via_keys.py\**：基于 Win32 虚拟按键与剪贴板绑定的仿真消息发送辅助工具。
- **\dump_wechat_ui.py\**：微信桌面端 UI 控件树抓取与层级分析脚本。
- **\dump_wechat_deep.py\**：深度递归探测微信消息列表与富文本结构的调试工具。

---

## 🚀 快速使用指南

### 1. 依赖安装
在使用本模块前，请确保安装以下 Python 扩展库：

\\ash
pip install uiautomation pywin32 pynput
\
### 2. 运行发送测试
运行前请确保 PC 版微信已打开并处于登录状态：

\\ash
cd wechat_automation
python send_test.py
\
### 3. UI 结构分析调试
用于分析微信客户端 UI 控件更新与窗口层次：

\\ash
python dump_wechat_ui.py
\
---

## ⚠️ 注意事项与环境要求

1. **Windows 系统环境**：本模块基于 Windows UIAutomation 框架，仅适用于 Windows 10 / 11 操作系统。
2. **管理员权限**：部分控件抓取（如深层 Handle 操作）可能需要以管理员身份运行 Python 命令行。
3. **分辨率与缩放**：建议系统显示缩放保持为 100% 或 125%，避免系统 DPI 异常缩放导致句柄坐标偏离。
