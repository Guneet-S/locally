import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Locally — clothing stores near you";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0F6E56",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#FFFFFF",
        }}
      >
        <div style={{ fontSize: 80, fontWeight: 700, letterSpacing: "-2px" }}>
          Locally
        </div>
        <div style={{ fontSize: 32, marginTop: 16, color: "#E1F5EE" }}>
          Clothing stores near you
        </div>
      </div>
    ),
    { ...size }
  );
}
