import { useState } from "react";
import EmojiViewer from "./components/EmojiViewer";

const EMOJI_LIST = [
  { id: "happy", name: "Happy Emoji", file: "/models/happy.glb" },
  { id: "drunk", name: "Drunk Emoji", file: "/models/drunk_emoji.glb" },
  { id: "angry", name: "Angry Emoji", file: "/models/angry.glb" },
];

const DEFAULT_COLOR = "#666666";  
const INITIAL_POSITION: [number, number, number] = [0, 1.8, 0];
const INITIAL_ROTATION: [number, number, number] = [0, 0, 0];

// Nilai sensitivitas perubahan data per sekali klik tombol
const MOVE_STEP = 0.1;
const ROTATE_STEP = 0.1;

export default function App() {
  const [currentModel, setCurrentModel] = useState(EMOJI_LIST[0]);
  const [emojiColors, setEmojiColors] = useState<Record<string, string>>({});
  const [stickerText, setStickerText] = useState("MAS HERI NYAWIT");

  // State untuk koordinat posisi dan rotasi tulisan
  const [textPosition, setTextPosition] =
    useState<[number, number, number]>(INITIAL_POSITION);
  const [textRotation, setTextRotation] =
    useState<[number, number, number]>(INITIAL_ROTATION);

  const handlePartsDetected = (parts: string[]) => {
    setEmojiColors((prevColors) => {
      const updatedColors = { ...prevColors };
      let hasChange = false;
      parts.forEach((partName) => {
        if (!updatedColors[partName]) {
          updatedColors[partName] = DEFAULT_COLOR;
          hasChange = true;
        }
      });
      return hasChange ? updatedColors : prevColors;
    });
  };

  const handleSelectModel = (model: (typeof EMOJI_LIST)[0]) => {
    setCurrentModel(model);
    setEmojiColors({});
    setTextPosition(INITIAL_POSITION);
    setTextRotation(INITIAL_ROTATION);
  };

  const handleColorChange = (partName: string, newColor: string) => {
    setEmojiColors((prev) => ({ ...prev, [partName]: newColor }));
  };

  // Fungsi pengubah posisi teks secara dinamis via Button
  const updatePosition = (index: number, val: number) => {
    setTextPosition((prev) => {
      const next = [...prev] as [number, number, number];
      next[index] += val;
      return next;
    });
  };

  // Fungsi pengubah rotasi teks secara dinamis via Button
  const updateRotation = (index: number, val: number) => {
    setTextRotation((prev) => {
      const next = [...prev] as [number, number, number];
      next[index] += val;
      return next;
    });
  };

  // Reset teks ke posisi awal semula
  const handleResetTransform = () => {
    setTextPosition(INITIAL_POSITION);
    setTextRotation(INITIAL_ROTATION);
  };

  const handleDownloadSticker = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const imageURL = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = imageURL;
    downloadLink.download = `${currentModel.id}-sticker.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Desain komponen tombol kecil agar seragam
  const btnStyle = {
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    backgroundColor: "#fff",
    border: "1px solid #ccc",
    borderRadius: "4px",
  };

  return (
    <div style={{ fontFamily: "sans-serif", padding: "20px" }}>
      <h1 style={{ textAlign: "center" }}>3D Sticker Studio</h1>

      <div
        style={{
          display: "flex",
          gap: "20px",
          marginTop: "20px",
          minHeight: "600px",
        }}
      >
        {/* PANEL KIRI: Pilihan Model */}
        <div
          style={{
            width: "200px",
            borderRight: "1px solid #eee",
            paddingRight: "15px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <h3 style={{ margin: "0 0 5px 0" }}>Pilih Emoji:</h3>
          {EMOJI_LIST.map((emoji) => {
            const isActive = emoji.id === currentModel.id;
            return (
              <button
                key={emoji.id}
                onClick={() => handleSelectModel(emoji)}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: isActive ? "2px solid #007bff" : "1px solid #ccc",
                  backgroundColor: isActive ? "#e6f2ff" : "#fff",
                  color: isActive ? "#007bff" : "#333",
                  fontWeight: isActive ? "bold" : "normal",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                {emoji.name}
              </button>
            );
          })}
        </div>

        {/* AREA TENGAH: Editor & Canvas */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "15px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              maxWidth: "400px",
              gap: "5px",
            }}
          >
            <label style={{ fontWeight: "bold", fontSize: "14px" }}>
              Tambahkan Tulisan Stiker:
            </label>
            <input
              type="text"
              value={stickerText}
              onChange={(e) => setStickerText(e.target.value)}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "16px",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {Object.keys(emojiColors).map((partName) => (
              <div
                key={partName}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  border: "1px solid #ddd",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  backgroundColor: "#fafafa",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "bold",
                    marginBottom: "4px",
                    textTransform: "capitalize",
                  }}
                >
                  {partName}
                </span>
                <input
                  type="color"
                  value={emojiColors[partName]}
                  onChange={(e) => handleColorChange(partName, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <EmojiViewer
              modelPath={currentModel.file}
              colors={emojiColors}
              stickerText={stickerText}
              textPosition={textPosition}
              textRotation={textRotation}
              onPartsDetected={handlePartsDetected}
            />
          </div>

          <button
            onClick={handleDownloadSticker}
            style={{
              padding: "12px 30px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            💾 Unduh Stiker PNG
          </button>
        </div>

        {/* PANEL KANAN: Tombol Controller Posisi & Rotasi */}
        <div
          style={{
            width: "240px",
            borderLeft: "1px solid #eee",
            paddingLeft: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <h3 style={{ margin: "0" }}>🎛️ Kontrol Tulisan</h3>

          {/* SEKSI POSISI */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              borderBottom: "1px solid #eee",
              paddingBottom: "15px",
            }}
          >
            <span
              style={{ fontWeight: "bold", fontSize: "14px", color: "#555" }}
            >
              📍 Mengatur Posisi
            </span>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "13px" }}>Kanan / Kiri (X):</span>
              <div style={{ display: "flex", gap: "5px" }}>
                <button
                  style={btnStyle}
                  onClick={() => updatePosition(0, -MOVE_STEP)}
                >
                  ◀
                </button>
                <button
                  style={btnStyle}
                  onClick={() => updatePosition(0, MOVE_STEP)}
                >
                  ▶
                </button>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "13px" }}>Atas / Bawah (Y):</span>
              <div style={{ display: "flex", gap: "5px" }}>
                <button
                  style={btnStyle}
                  onClick={() => updatePosition(1, -MOVE_STEP)}
                >
                  ▼
                </button>
                <button
                  style={btnStyle}
                  onClick={() => updatePosition(1, MOVE_STEP)}
                >
                  ▲
                </button>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "13px" }}>Maju / Mundur (Z):</span>
              <div style={{ display: "flex", gap: "5px" }}>
                <button
                  style={btnStyle}
                  onClick={() => updatePosition(2, -MOVE_STEP)}
                >
                  👁️‍🗨️-
                </button>
                <button
                  style={btnStyle}
                  onClick={() => updatePosition(2, MOVE_STEP)}
                >
                  👁️‍🗨️+
                </button>
              </div>
            </div>
          </div>

          {/* SEKSI ROTASI */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <span
              style={{ fontWeight: "bold", fontSize: "14px", color: "#555" }}
            >
              🔄 Mengatur Rotasi
            </span>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "13px" }}>Tunduk / Dongak (X):</span>
              <div style={{ display: "flex", gap: "5px" }}>
                <button
                  style={btnStyle}
                  onClick={() => updateRotation(0, -ROTATE_STEP)}
                >
                  ↷
                </button>
                <button
                  style={btnStyle}
                  onClick={() => updateRotation(0, ROTATE_STEP)}
                >
                  ↶
                </button>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "13px" }}>Hadap Kanan/Kiri (Y):</span>
              <div style={{ display: "flex", gap: "5px" }}>
                <button
                  style={btnStyle}
                  onClick={() => updateRotation(1, -ROTATE_STEP)}
                >
                  ⤾
                </button>
                <button
                  style={btnStyle}
                  onClick={() => updateRotation(1, ROTATE_STEP)}
                >
                  ⤿
                </button>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "13px" }}>Miring Kanan/Kiri (Z):</span>
              <div style={{ display: "flex", gap: "5px" }}>
                <button
                  style={btnStyle}
                  onClick={() => updateRotation(2, -ROTATE_STEP)}
                >
                  ↻
                </button>
                <button
                  style={btnStyle}
                  onClick={() => updateRotation(2, ROTATE_STEP)}
                >
                  ↺
                </button>
              </div>
            </div>
          </div>

          {/* TOMBOL RESET */}
          <button
            onClick={handleResetTransform}
            style={{
              marginTop: "10px",
              padding: "8px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            🔄 Reset Posisi Teks
          </button>
        </div>
      </div>
    </div>
  );
}
