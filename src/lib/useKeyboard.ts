"use client";

import { useEffect, useState } from "react";

/**
 * Phát hiện bàn phím điện thoại đang mở.
 * Khi bàn phím hiện, visualViewport thấp hơn hẳn chiều cao cửa sổ.
 */
export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv) return;

    const baseHeight = window.innerHeight;

    function check() {
      if (!vv) return;
      setOpen(baseHeight - vv.height > baseHeight * 0.2);
    }

    vv.addEventListener("resize", check);
    check();
    return () => vv.removeEventListener("resize", check);
  }, []);

  return open;
}
