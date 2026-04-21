"""Flood-fill the outer white background of pixel-art PNGs into transparency.

Usage: python3 scripts/strip_white_bg.py <path.png> [<path2.png> ...]
Overwrites each input in place. Only fills contiguous light pixels touching the
image border, so interior highlights are preserved.
"""

import sys
from collections import deque
from PIL import Image


def is_bg(p, ref, tol=8):
    return all(abs(p[i] - ref[i]) <= tol for i in range(3)) and p[3] == 255


def strip(path: str) -> None:
    img = Image.open(path).convert("RGBA")
    w, h = img.size
    px = img.load()
    ref = px[0, 0]
    if ref[3] == 0:
        print(f"{path}: already transparent corner, skipping")
        return

    visited = [[False] * h for _ in range(w)]
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_bg(px[x, y], ref):
                q.append((x, y))
                visited[x][y] = True
    for y in range(h):
        for x in (0, w - 1):
            if is_bg(px[x, y], ref) and not visited[x][y]:
                q.append((x, y))
                visited[x][y] = True

    while q:
        x, y = q.popleft()
        px[x, y] = (0, 0, 0, 0)
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not visited[nx][ny] and is_bg(px[nx, ny], ref):
                visited[nx][ny] = True
                q.append((nx, ny))

    img.save(path)
    print(f"{path}: background stripped")


if __name__ == "__main__":
    for p in sys.argv[1:]:
        strip(p)
