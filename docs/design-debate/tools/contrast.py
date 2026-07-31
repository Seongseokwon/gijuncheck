#!/usr/bin/env python3
"""
WCAG 2.1 대비비 계산기.
accessibility-critic 에이전트가 색상 제안을 검증할 때 반드시 실행한다.

사용법:
    python3 contrast.py "#087E8B" "#FFFFFF"
    python3 contrast.py --palette palette.json
"""
import sys
import json


def _linearize(channel: int) -> float:
    c = channel / 255
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def luminance(hex_color: str) -> float:
    h = hex_color.lstrip("#")
    if len(h) == 3:
        h = "".join(ch * 2 for ch in h)
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return 0.2126 * _linearize(r) + 0.7152 * _linearize(g) + 0.0722 * _linearize(b)


def contrast(fg: str, bg: str) -> float:
    l1, l2 = luminance(fg), luminance(bg)
    if l1 < l2:
        l1, l2 = l2, l1
    return (l1 + 0.05) / (l2 + 0.05)


def verdict(ratio: float, large_text: bool = False) -> str:
    """large_text: 18.66px+ bold 또는 24px+"""
    aa = 3.0 if large_text else 4.5
    aaa = 4.5 if large_text else 7.0
    if ratio >= aaa:
        return "AAA"
    if ratio >= aa:
        return "AA"
    return "실패"


def report(pairs):
    """pairs: [(라벨, 전경, 배경, is_large), ...]"""
    print(f"{'조합':<34}{'대비':>9}  {'판정':<6} {'여유':>7}")
    print("-" * 60)
    failures = []
    for label, fg, bg, large in pairs:
        r = contrast(fg, bg)
        v = verdict(r, large)
        threshold = 3.0 if large else 4.5
        margin = r - threshold
        print(f"{label:<34}{r:>8.2f}:1  {v:<6} {margin:>+7.2f}")
        if v == "실패":
            failures.append((label, r, threshold))
        elif margin < 0.3:
            failures.append((label, r, threshold))
    print()
    if failures:
        print("검토 필요 (실패 또는 여유 0.3 미만):")
        for label, r, th in failures:
            print(f"  - {label}: {r:.2f}:1 (기준 {th})")
    else:
        print("전 항목 통과, 여유 충분.")
    return failures


if __name__ == "__main__":
    args = sys.argv[1:]
    if len(args) == 2:
        r = contrast(args[0], args[1])
        print(f"{args[0]} on {args[1]}: {r:.2f}:1")
        print(f"  본문(4.5):   {verdict(r)}")
        print(f"  큰글씨(3.0): {verdict(r, large_text=True)}")
    elif len(args) == 2 and args[0] == "--palette":
        with open(args[1]) as f:
            data = json.load(f)
        report([(p["label"], p["fg"], p["bg"], p.get("large", False)) for p in data])
    else:
        print(__doc__)
        sys.exit(1)
