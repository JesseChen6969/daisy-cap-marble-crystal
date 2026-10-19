import tkinter as tk
from tkinter import Label, Frame
import threading
from datetime import datetime as Time
from feature import (
    get_USDCNH,
    get_HSTECH,
    get_hs300_baise,
    get_all_vol,
    get_CN10_ratio,
    sum_hs300,
)

# from backen import start_background_task


def update_info():
    try:
        if root.winfo_exists():  # 检查主窗口是否存在

            data = {
                "time": Time.now().strftime("%m-%d\n%H:%M"),
                "bs": get_hs300_baise(),
                "uc": get_USDCNH(),
                "hk": get_HSTECH(),
                "av": get_all_vol(),
                "cn10": get_CN10_ratio(),
            }
            color_ranges = {
                "bs": {"unit": [-5, 5], "color": ["red", "orange", "green"]},
                "uc": {"unit": [7, 7.1], "color": ["red", "orange", "green"]},
                "hk": {"unit": [-1.5, 1], "color": ["green", "orange", "red"]},
                "cn10": {"unit": [-0.01, 0.01], "color": ["red", "orange", "green"]},
                "av": {"unit": [1, 2], "color": ["black", "black", "black"]},
            }

            def get_color(key, value):
                if value < color_ranges[key]["unit"][0]:
                    return color_ranges[key]["color"][0]
                elif (
                    color_ranges[key]["unit"][0] <= value < color_ranges[key]["unit"][1]
                ):
                    return color_ranges[key]["color"][1]
                else:
                    return color_ranges[key]["color"][2]

            for key, value in data.items():
                if key == "time":
                    label = info_labels[key]
                    label.config(text=str(value))
                    continue
                if key in info_labels:
                    label = info_labels[key]
                    label.config(text=key + ":" + str(value))
                    label.config(fg=get_color(key, value))
                else:
                    pass

            sums = sum_hs300()
            for sum in sums:
                if sum in sum_labels:
                    sum_labels[sum].config(text=str(sum + ":" + str(sums[sum])))
                else:
                    pass
        else:
            return
    # 捕获 RuntimeError，主窗口已被销毁，中断
    except RuntimeError:
        return
    # except Exception as e:
    #    print(f"Error updating info: {e}")

    threading.Timer(10, update_info).start()


# 使窗口可拖动的函数
def on_closing():
    root.destroy()


def on_move(event):
    deltax = event.x - prevx
    deltay = event.y - prevy
    x = root.winfo_x() + deltax
    y = root.winfo_y() + deltay
    root.geometry(f"+{x}+{y}")


def start_move(event):
    global prevx, prevy
    prevx = event.x
    prevy = event.y


def stop_move(event):
    pass  # 可以在这里添加停止拖动时需要执行的代码


# 创建关闭按钮显示函数
def show_close_button(event):
    close_button.place(
        x=event.x_root - root.winfo_rootx(), y=event.y_root - root.winfo_rooty()
    )
    close_button.lift()  # 将关闭按钮置于顶层

    # 启动定时器，5秒后隐藏关闭按钮
    root.after(5000, hide_close_button)


def hide_close_button():
    close_button.place_forget()  # 隐藏关闭按钮


# 创建悬浮窗
root = tk.Tk()
root.overrideredirect(True)  # 移除窗口边框
root.geometry("80x300+100+100")  # 设置窗口大小和位置
root.attributes("-topmost", True)  # 设置窗口始终置顶

# 设置窗口为半透明
root.attributes("-alpha", 0.9)  # 0.8 是透明度，范围是 0.0 到 1.0
# start_background_task()
# 创建字典用于存储标签
info_labels = {}
keys = ["bs", "uc", "hk", "cn10", "av"]  # 假设有4个键

sum_labels = {}
sums = ["tup", "tdn", "t5u", "t5d"]

# 创建标签并添加到字典中
label = Label(root, text="Loading...", font=("Helvetica", 10), bg="white", fg="black")
label.pack(pady=2)
info_labels["time"] = label


line = Frame(root, height=1, width=100, bg="black")
line.pack(pady=3)

for key in keys:
    label = Label(
        root, text="Loading...", font=("Helvetica", 10), bg="white", fg="black"
    )
    label.pack(pady=2)
    info_labels[key] = label

# 二者用线条分割
line = Frame(root, height=1, width=100, bg="black")
line.pack(pady=3)

for sum in sums:
    label = Label(
        root, text="Loading...", font=("Helvetica", 10), bg="white", fg="black"
    )
    label.pack(pady=2)
    sum_labels[sum] = label

# 创建关闭按钮并初始隐藏
close_button = tk.Button(root, text="关闭", command=on_closing, bg="red", fg="white")
close_button.place_forget()

# 绑定鼠标事件，使窗口可拖动
root.bind("<Button-1>", start_move)
root.bind("<B1-Motion>", on_move)
root.bind("<ButtonRelease-1>", stop_move)

# 绑定右键单击事件显示关闭按钮
root.bind("<Button-3>", show_close_button)

# 绑定关闭事件
root.protocol("WM_DELETE_WINDOW", on_closing)

# 启动信息更新线程
update_info()

# 运行 Tkinter 事件循环
root.mainloop()
