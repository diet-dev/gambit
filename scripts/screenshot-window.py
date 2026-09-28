#!/usr/bin/env python3
"""Скриншот окна приложения вместе с рамкой оконного менеджера.

Находит окно по части заголовка, поднимает его поверх остальных,
снимает клиентскую область + рамку (по _NET_FRAME_EXTENTS) и сохраняет в PNG.

Зависимости: python3, Pillow (pip install pillow), утилиты X11:
xprop, xwininfo (пакет x11-utils).

Примеры:
  python3 scripts/screenshot-window.py
  python3 scripts/screenshot-window.py --title "Гамбит" --output shots/main.png
"""

import argparse
import ctypes
import subprocess
import sys
import time
from ctypes import (
    Structure,
    c_bool,
    c_byte,
    c_char_p,
    c_int,
    c_long,
    c_ulong,
    c_void_p,
)

def run(command: str) -> str:
    return subprocess.run(
        command, shell=True, check=True, capture_output=True, text=True
    ).stdout

def find_window_id(title: str) -> int:
    listing = run("xprop -root _NET_CLIENT_LIST")
    ids = listing.split(":", 1)[1].split("#")[-1].split(",")
    for raw_id in ids:
        window_id = int(raw_id.strip(), 16)
        try:
            output = run(f"xprop -id {window_id} _NET_WM_NAME")
        except subprocess.CalledProcessError:
            continue
        if title in output:
            return window_id
    sys.exit(f"Окно с заголовком, содержащим «{title}», не найдено")

def activate(window_id: int, display: str) -> None:
    x11 = ctypes.cdll.LoadLibrary("libX11.so.6")
    x11.XOpenDisplay.restype = c_void_p
    x11.XOpenDisplay.argtypes = [c_char_p]
    x11.XDefaultRootWindow.restype = c_ulong
    x11.XDefaultRootWindow.argtypes = [c_void_p]
    x11.XInternAtom.restype = c_ulong
    x11.XInternAtom.argtypes = [c_void_p, c_char_p, c_int]
    x11.XSendEvent.argtypes = [c_void_p, c_ulong, c_bool, c_long, c_void_p]
    x11.XFlush.argtypes = [c_void_p]

    class ClientMessage(Structure):
        _fields_ = [
            ("type", c_int),
            ("serial", c_ulong),
            ("send_event", c_bool),
            ("display", c_void_p),
            ("window", c_ulong),
            ("message_type", c_ulong),
            ("format", c_int),
            ("data", c_byte * 20),
        ]

    display_ptr = x11.XOpenDisplay(display.encode())
    if not display_ptr:
        sys.exit(f"Не удалось открыть дисплей {display}")
    root = x11.XDefaultRootWindow(display_ptr)

    event = ClientMessage()
    event.type = 33  # ClientMessage
    event.window = window_id
    event.message_type = x11.XInternAtom(display_ptr, b"_NET_ACTIVE_WINDOW", False)
    event.format = 32
    ctypes.memmove(event.data, (c_ulong * 5)(1, 0, 0, 0, 0), 20)
    x11.XSendEvent(
        display_ptr, root, False, 0x20000 | 0x10000, ctypes.byref(event)
    )  # SubstructureRedirect | SubstructureNotify
    x11.XFlush(display_ptr)
    time.sleep(1.5)  # ждём завершения анимации подъёма окна

def window_geometry(window_id: int) -> tuple[int, int, int, int]:
    info = run(f"xwininfo -id {window_id}")
    values = {}
    for line in info.splitlines():
        stripped = line.strip()
        if stripped.startswith("Absolute upper-left X:"):
            values["x"] = int(stripped.rsplit(":", 1)[1])
        elif stripped.startswith("Absolute upper-left Y:"):
            values["y"] = int(stripped.rsplit(":", 1)[1])
        elif stripped.startswith("Width:"):
            values["width"] = int(stripped.rsplit(":", 1)[1])
        elif stripped.startswith("Height:"):
            values["height"] = int(stripped.rsplit(":", 1)[1])
    return values["x"], values["y"], values["width"], values["height"]

def frame_extents(window_id: int) -> tuple[int, int, int, int]:
    extents = run(f"xprop -id {window_id} _NET_FRAME_EXTENTS")
    left, right, top, bottom = (
        int(value) for value in extents.split("=")[1].split(",")
    )
    return left, right, top, bottom

def main() -> None:
    parser = argparse.ArgumentParser(description="Скриншот окна с рамкой")
    parser.add_argument("--title", default="Гамбит", help="часть заголовка окна")
    parser.add_argument("--display", default=":0", help="X-дисплей")
    parser.add_argument("--output", default="gambit-main.png", help="путь к PNG")
    args = parser.parse_args()

    window_id = find_window_id(args.title)
    activate(window_id, args.display)

    x, y, width, height = window_geometry(window_id)
    left, right, top, bottom = frame_extents(window_id)
    box = (
        x - left,
        y - top,
        x - left + width + left + right,
        y - top + height + top + bottom,
    )

    from PIL import ImageGrab

    ImageGrab.grab(xdisplay=args.display).crop(box).save(args.output)
    print(f"Сохранено: {args.output}")

if __name__ == "__main__":
    main()
