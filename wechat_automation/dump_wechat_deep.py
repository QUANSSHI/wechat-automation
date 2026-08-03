import sys
import uiautomation as uia

def scan_controls(control, depth=0, max_depth=6):
    if depth > max_depth:
        return
    
    # 过滤一些我们感兴趣的控件类型进行展示
    interesting_types = ['EditControl', 'ButtonControl', 'ListControl', 'ListItemControl', 'TextControl', 'GroupControl']
    
    control_type = control.ControlTypeName
    name = control.Name
    class_name = control.ClassName
    auto_id = control.AutomationId
    
    # 缩进表示层级
    indent = "  " * depth
    
    # 如果是有意义的控件，打印出来
    if control_type in interesting_types or name or auto_id:
        print(f"{indent}└─ {control_type} | Class: '{class_name}' | Name: '{name}' | AutoId: '{auto_id}'")
        
    for child in control.GetChildren():
        scan_controls(child, depth + 1, max_depth)

def main():
    print("正在定位微信主窗口...")
    wechat_wnd = uia.WindowControl(ClassName='Qt51514QWindowIcon')
    if not wechat_wnd.Exists(3):
        wechat_wnd = uia.WindowControl(Name='微信')
    
    if not wechat_wnd.Exists(1):
        print("未找到微信窗口。")
        return
    
    print(f"找到微信窗口: Title='{wechat_wnd.Name}'。开始扫描控件树（最大深度6）...")
    scan_controls(wechat_wnd)
    print("扫描完成！")

if __name__ == '__main__':
    main()
