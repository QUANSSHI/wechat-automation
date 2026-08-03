import sys
import time
import pyperclip
import uiautomation as uia
import win32gui
import win32con

def find_wechat_window():
    # 查找可能的微信类名
    classes = ['Qt51514QWindowIcon', 'WeChatMainWndForPC']
    for cls in classes:
        hwnd = win32gui.FindWindow(cls, None)
        if hwnd:
            # 确保窗口标题确实包含微信相关字样，防止误判
            title = win32gui.GetWindowText(hwnd)
            if '微信' in title or 'Weixin' in title or 'WeChat' in title:
                return hwnd, cls
            
    # 如果类名找不到，尝试按窗口标题搜索
    titles = ['微信', 'Weixin', 'WeChat']
    for title in titles:
        hwnd = win32gui.FindWindow(None, title)
        if hwnd:
            return hwnd, None
            
    return None, None

def send_message(target, message):
    hwnd, cls = find_wechat_window()
    if not hwnd:
        print("未直接找到微信窗口，尝试使用快捷键 Ctrl+Alt+W 唤醒微信...")
        # 模拟全局唤醒微信快捷键
        uia.SendKeys('{Ctrl}{Alt}w')
        time.sleep(1.0)
        hwnd, cls = find_wechat_window()
        
    if not hwnd:
        print("错误: 未找到微信窗口。请确保微信已启动且已登录。")
        return False
        
    print(f"成功找到微信窗口: HWND={hwnd}, ClassName={cls}")
    
    # 1. 激活并显示微信窗口
    # 恢复窗口如果它被最小化了
    if win32gui.IsIconic(hwnd):
        win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
    else:
        win32gui.ShowWindow(hwnd, win32con.SW_SHOW)
    
    # 将窗口置顶并聚焦
    try:
        win32gui.SetForegroundWindow(hwnd)
    except Exception as e:
        print(f"窗口置顶提示: {e}")
        
    time.sleep(0.3)
    
    # 用 uiautomation 确保激活
    title = win32gui.GetWindowText(hwnd)
    wnd_ctrl = uia.WindowControl(searchDepth=1, ClassName=cls) if cls else uia.WindowControl(searchDepth=1, Name=title)
    wnd_ctrl.SwitchToThisWindow()
    time.sleep(0.3)
    
    # 2. 模拟 Ctrl+F 聚焦搜索框
    print("正在定位搜索框...")
    uia.SendKeys('{Ctrl}f')
    time.sleep(0.3)
    
    # 3. 复制联系人姓名到剪贴板并粘贴
    print(f"正在搜索联系人: {target}...")
    pyperclip.copy(target)
    uia.SendKeys('{Ctrl}v')
    time.sleep(0.8) # 给微信一点时间来过滤搜索列表
    
    # 4. 回车确定，进入聊天窗口
    print("正在进入聊天窗口...")
    uia.SendKeys('{Enter}')
    time.sleep(0.6) # 等待聊天窗口加载并聚焦输入框
    
    # 5. 复制消息内容到剪贴板并粘贴
    print(f"正在输入消息: {message}...")
    pyperclip.copy(message)
    uia.SendKeys('{Ctrl}v')
    time.sleep(0.3)
    
    # 6. 发送消息
    print("正在发送消息...")
    uia.SendKeys('{Enter}')
    print("消息发送完成！")
    return True

if __name__ == '__main__':
    # 支持命令行参数
    # python send_via_keys.py "接收者" "消息"
    if len(sys.argv) >= 3:
        target = sys.argv[1]
        message = sys.argv[2]
    else:
        target = "文件传输助手"
        message = "你好！这是使用键盘模拟方式自动发送的微信测试消息。"
        
    send_message(target, message)
