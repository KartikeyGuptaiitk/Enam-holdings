import { ImageResponse } from "next/og";
export const alt = "FINN — the investor’s desk";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#0a0c0d",
        color: "#ece9e2",
        padding: 70,
        width: "100%",
        height: "100%",
      }}
    >
      <div style={{ fontSize: 44, color: "#c6f432" }}>FINN / INVESTOR DESK</div>
      <div style={{ fontSize: 100, letterSpacing: -5 }}>Signal over noise.</div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 28,
          borderTop: "1px solid #303630",
          paddingTop: 24,
        }}
      >
        <span>Today · Ask · Watch</span>
        <span>Primary evidence. Independent judgment.</span>
      </div>
    </div>,
    size,
  );
}
