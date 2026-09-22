import type { SVGProps } from "react";

const paths = {
  mountain: "m2 19 7-13 4 7 3-5 6 11H2Zm5-9 2 3 2-3M16 8l2 5",
  explore: "m16.5 7.5-3 6-6 3 3-6 6-3ZM12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z",
  bag: "M6 7h12l2 14H4L6 7Zm3 0V5a3 3 0 0 1 6 0v2M9 12h6",
  tech: "M5 3h12a3 3 0 0 1 3 3v14H7a3 3 0 0 1-3-3V4m3 11h13M9 7h7M9 10h5M7 15v5",
  craft: "M7 4h10M9 4v5l-5 9a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-5-9V4M7 15h10M11 17h2",
  market:
    "M3 10h18l-2-6H5l-2 6Zm2 0v11h14V10M9 21v-7h6v7M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0",
  trade: "M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4",
  dex: "M12 5c-4-3-8-2-9-1v15c3-2 6-2 9 1 3-3 6-3 9-1V4c-1-1-5-2-9 1Zm0 0v15",
  wanling: "m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1 3-6Z",
  rank: "M8 3h8v7a4 4 0 0 1-8 0V3Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4M12 14v7m-4 0h8",
  sect: "m2 9 10-7 10 7H2Zm2 12h16M6 9v12m6-12v12m6-12v12",
  lotus:
    "M12 20c-7 0-10-5-10-10 5 0 8 3 10 10Zm0 0c7 0 10-5 10-10-5 0-8 3-10 10Zm0-1c-5-5-5-10 0-16 5 6 5 11 0 16Z",
  moon: "M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "m6 6 12 12M6 18 18 6",
  help: "M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3m0 3h.01M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z",
  logout: "M9 3H4v18h5m5-14 5 5-5 5m-6-5h13",
  gem: "m12 2 9 10-9 10L3 12l9-10Zm0 0-3 10 3 10 3-10-3-10ZM3 12h18",
  spark: "m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z",
} as const;

export type GameIconName = keyof typeof paths;

export default function GameIcon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: GameIconName }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
