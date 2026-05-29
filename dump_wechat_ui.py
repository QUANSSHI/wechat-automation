import sys
import uiautomation as uia

def dump_ui():
    print("正在寻找微信主窗口...")
    # 通过类名或标题匹配微信 4.0 窗口
    wechat_wnd = uia.WindowControl(ClassName='Qt51514QWindowIcon')
    if not wechat_wnd.Exists(3):
        # 尝试通过标题匹配 (繁体/简体/英文)
        wechat_wnd = uia.WindowControl(Name='微信')
    
    if not wechat_wnd.Exists(1):
        print("未找到微信窗口，请确保微信已启动且未最小化。")
        return
    
    print(f"找到微信窗口: Title='{wechat_wnd.Name}'")
    
    # 打印前两层子控件以分析其结构
    print("\n--- 微信窗口子控件结构 ---")
    for i, child in enumerate(wechat_wnd.GetChildren()):
        print(f"[{i}] ControlType: {child.ControlTypeName}, Class: '{child.ClassName}', Name: '{child.Name}', AutomationId: '{child.AutomationId}'")
        for j, grand_child in enumerate(child.GetChildren()):
            print(f"    └─ [{i}.{j}] ControlType: {grand_child.ControlTypeName}, Class: '{grand_child.ClassName}', Name: '{grand_child.Name}', AutomationId: '{grand_child.AutomationId}'")

if __name__ == '__main__':
    dump_ui()
