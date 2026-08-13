"use client";

import { useT } from "@/i18n/useT";

export default function Footer() {
  const t = useT();
  return (
    <footer className="py-4 text-center text-xs text-faded/50 font-mono tracking-widest">
      {t("footer")}
    </footer>
  );
}
