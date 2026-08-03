import sys
import time
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from wxauto import WeChat

def test_send():
    try:
        print("正在初始化本地开源版微信控制对象 (WeChat)...")
        # 初始化 WeChat 实例
        wx = WeChat()
        
        print("微信控制对象初始化成功。")
        
        target = "文件传输助手"
        message = "你好！这是来自系统自动化的微信消息发送测试（使用本地开源版）。"
        
        print(f"正在尝试打开与 '{target}' 的聊天窗口并发送消息...")
        # 切换会话并发送消息
        wx.ChatWith(target)
        # 稍微等待一下确保窗口加载完成
        time.sleep(0.5)
        wx.SendMsg(message)
        
        print("测试消息发送成功！")
        
    except Exception as e:
        print(f"发生错误: {e}")
        print("请确保你的微信电脑版已经打开且处于登录状态，并且窗口未被最小化。")
        sys.exit(1)

if __name__ == '__main__':
    test_send()
