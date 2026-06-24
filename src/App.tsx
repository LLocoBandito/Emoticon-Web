import { useState, useRef } from "react";
import EmojiViewer from "./components/EmojiViewer";

const EMOJI_LIST = [
  { id: "happy", name: "Happy Emoji", file: "/models/happy.glb" },
  { id: "drunk", name: "Drunk Emoji", file: "/models/drunk_emoji.glb" },
  { id: "horn", name: "Horn Emoji", file: "/models/horn_emoji.glb" },
  { id: "money", name: "Money Emoji", file: "/models/money_emoji.glb" },
  { id: "angel", name: "Angel Emoji", file: "/models/angel_emoji.glb" },
  { id: "love", name: "Love Emoji", file: "/models/love_emoji.glb" },
  { id: "confuse", name: "Confused Emoji", file: "/models/confuse_emoji.glb" },
  { id: "mad", name: "Mad Emoji", file: "/models/mad_emoji.glb" },
  { id: "cool", name: "Cool Emoji", file: "/models/cool_emoji.glb" },
  { id: "smile", name: "Smile Emoji", file: "/models/smile_emoji.glb" },
  { id: "sad", name: "Sad Emoji", file: "/models/sad_emoji.glb" },
  { id: "blush", name: "Blush Emoji", file: "/models/blush_emoji.glb" },
  {
    id: "rolleyes",
    name: "Roll Eyes Emoji",
    file: "/models/rolleyes_emoji.glb",
  },
];

const DEFAULT_PICKER_COLOR = "#ffffff";

// Nilai Y awal diatur kecil karena di EmojiViewer akan ditambahkan dengan tinggi model emoji
const INITIAL_POSITION: [number, number, number] = [0, 0.2, 0];
const INITIAL_ROTATION: [number, number, number] = [0, 0, 0];

const MOVE_STEP = 0.05; // Halus untuk long press
const ROTATE_STEP = 0.05; // Halus untuk long press

// Komponen Kustom Tombol Mandiri dengan Fitur Long Press
interface LongPressButtonProps {
  onAction: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

function LongPressButton({ onAction, children, style }: LongPressButtonProps) {
  // Menggunakan 'number' standar browser agar terhindar dari error NodeJS namespace
  const timerRef = useRef<number | null>(null);

  const startAction = () => {
    onAction(); // Eksekusi langsung sekali saat pertama ditekan

    // Jalankan interval berulang setiap 80ms jika terus ditahan
    timerRef.current = window.setInterval(() => {
      onAction();
    }, 80);
  };

  const stopAction = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <button
      style={style}
      onMouseDown={startAction}
      onMouseUp={stopAction}
      onMouseLeave={stopAction}
      onTouchStart={startAction} // Dukungan Mobile/HP
      onTouchEnd={stopAction}
    >
      {children}
    </button>
  );
}

// Komponen Utama Aplikasi
export default function App() {
  const [currentModel, setCurrentModel] = useState(EMOJI_LIST[0]);
  const [emojiColors, setEmojiColors] = useState<Record<string, string>>({});
  const [stickerText, setStickerText] = useState("MAS HERI NYAWIT");

  const [textPosition, setTextPosition] =
    useState<[number, number, number]>(INITIAL_POSITION);
  const [textRotation, setTextRotation] =
    useState<[number, number, number]>(INITIAL_ROTATION);
  const [resetCount, setResetCount] = useState(0);

  const handlePartsDetected = (parts: string[]) => {
    setEmojiColors((prevColors) => {
      const updatedColors = { ...prevColors };
      let hasChange = false;
      parts.forEach((partName) => {
        if (updatedColors[partName] === undefined) {
          updatedColors[partName] = "";
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

  const updatePosition = (index: number, val: number) => {
    setTextPosition((prev) => {
      const next = [...prev] as [number, number, number];
      next[index] += val;
      return next;
    });
  };

  const updateRotation = (index: number, val: number) => {
    setTextRotation((prev) => {
      const next = [...prev] as [number, number, number];
      next[index] += val;
      return next;
    });
  };

  const handleResetTransform = () => {
    setTextPosition(INITIAL_POSITION);
    setTextRotation(INITIAL_ROTATION);
  };

  const handleResetEmojiPosition = () => {
    setResetCount((prev) => prev + 1);
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

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🎨 3D Sticker Studio</h1>

      <div style={styles.workspace}>
        {/* PANEL KIRI: Pilihan Model */}
        <div style={styles.sidebarLeft}>
          <h3 style={styles.sectionTitle}>Pilih Emoji</h3>
          <div style={styles.buttonGroupVertical}>
            {EMOJI_LIST.map((emoji) => {
              const isActive = emoji.id === currentModel.id;
              return (
                <button
                  key={emoji.id}
                  onClick={() => handleSelectModel(emoji)}
                  style={{
                    ...styles.modelButton,
                    ...(isActive ? styles.modelButtonActive : {}),
                  }}
                >
                  {emoji.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* AREA TENGAH: Editor & Canvas */}
        <div style={styles.mainContent}>
          <div style={styles.inputWrapper}>
            <label style={styles.label}>Tambahkan Tulisan Stiker:</label>
            <input
              type="text"
              value={stickerText}
              onChange={(e) => setStickerText(e.target.value)}
              style={styles.textInput}
              placeholder="Ketik teks stiker..."
            />
          </div>

          {/* Color Pickers */}
          <div style={styles.colorPickerContainer}>
            {Object.keys(emojiColors).map((partName) => (
              <div key={partName} style={styles.colorCard}>
                <span style={styles.colorLabel}>{partName}</span>
                <input
                  type="color"
                  value={emojiColors[partName] || DEFAULT_PICKER_COLOR}
                  onChange={(e) => handleColorChange(partName, e.target.value)}
                  style={styles.colorInput}
                />
              </div>
            ))}
          </div>

          {/* 3D Canvas Box */}
          <div style={styles.canvasContainer}>
            <EmojiViewer
              modelPath={currentModel.file}
              colors={emojiColors}
              stickerText={stickerText}
              textPosition={textPosition}
              textRotation={textRotation}
              onPartsDetected={handlePartsDetected}
              resetTrigger={resetCount}
            />
          </div>

          <button onClick={handleDownloadSticker} style={styles.downloadButton}>
            💾 Unduh Stiker PNG
          </button>
        </div>

        {/* PANEL KANAN: Tombol Controller */}
        <div style={styles.sidebarRight}>
          <h3 style={styles.sectionTitle}>🎛️ Kontrol Tulisan</h3>

          {/* SEKSI POSISI */}
          <div style={styles.controlGroup}>
            <span style={styles.controlGroupTitle}>📍 Mengatur Posisi</span>

            <div style={styles.controlRow}>
              <span style={styles.controlLabel}>Kiri / Kanan (X)</span>
              <div style={styles.btnRow}>
                <LongPressButton
                  style={styles.controlBtn}
                  onAction={() => updatePosition(0, -MOVE_STEP)}
                >
                  ◀
                </LongPressButton>
                <LongPressButton
                  style={styles.controlBtn}
                  onAction={() => updatePosition(0, MOVE_STEP)}
                >
                  ▶
                </LongPressButton>
              </div>
            </div>

            <div style={styles.controlRow}>
              <span style={styles.controlLabel}>Atas / Bawah (Y)</span>
              <div style={styles.btnRow}>
                <LongPressButton
                  style={styles.controlBtn}
                  onAction={() => updatePosition(1, -MOVE_STEP)}
                >
                  ▼
                </LongPressButton>
                <LongPressButton
                  style={styles.controlBtn}
                  onAction={() => updatePosition(1, MOVE_STEP)}
                >
                  ▲
                </LongPressButton>
              </div>
            </div>

            <div style={styles.controlRow}>
              <span style={styles.controlLabel}>Maju / Mundur (Z)</span>
              <div style={styles.btnRow}>
                <LongPressButton
                  style={styles.controlBtn}
                  onAction={() => updatePosition(2, -MOVE_STEP)}
                >
                  👁️‍🗨️-
                </LongPressButton>
                <LongPressButton
                  style={styles.controlBtn}
                  onAction={() => updatePosition(2, MOVE_STEP)}
                >
                  👁️‍🗨️+
                </LongPressButton>
              </div>
            </div>
          </div>

          {/* SEKSI ROTASI */}
          <div style={styles.controlGroup}>
            <span style={styles.controlGroupTitle}>🔄 Mengatur Rotasi</span>

            <div style={styles.controlRow}>
              <span style={styles.controlLabel}>Tunduk / Dongak (X)</span>
              <div style={styles.btnRow}>
                <LongPressButton
                  style={styles.controlBtn}
                  onAction={() => updateRotation(0, -ROTATE_STEP)}
                >
                  ↷
                </LongPressButton>
                <LongPressButton
                  style={styles.controlBtn}
                  onAction={() => updateRotation(0, ROTATE_STEP)}
                >
                  ↶
                </LongPressButton>
              </div>
            </div>

            <div style={styles.controlRow}>
              <span style={styles.controlLabel}>Hadap Ka/Ki (Y)</span>
              <div style={styles.btnRow}>
                <LongPressButton
                  style={styles.controlBtn}
                  onAction={() => updateRotation(1, -ROTATE_STEP)}
                >
                  ⤾
                </LongPressButton>
                <LongPressButton
                  style={styles.controlBtn}
                  onAction={() => updateRotation(1, ROTATE_STEP)}
                >
                  ⤿
                </LongPressButton>
              </div>
            </div>

            <div style={styles.controlRow}>
              <span style={styles.controlLabel}>Miring Ka/Ki (Z)</span>
              <div style={styles.btnRow}>
                <LongPressButton
                  style={styles.controlBtn}
                  onAction={() => updateRotation(2, -ROTATE_STEP)}
                >
                  ↻
                </LongPressButton>
                <LongPressButton
                  style={styles.controlBtn}
                  onAction={() => updateRotation(2, ROTATE_STEP)}
                >
                  ↺
                </LongPressButton>
              </div>
            </div>
          </div>

          <button onClick={handleResetTransform} style={styles.resetButton}>
            🔄 Reset Posisi Teks
          </button>

          <button
            onClick={handleResetEmojiPosition}
            style={styles.resetEmojiButton}
          >
            🤖 Reset Posisi Emoji
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    padding: "30px",
    backgroundColor: "#f4f6f9",
    minHeight: "100vh",
    color: "#333",
  },
  title: {
    textAlign: "center",
    margin: "0 0 30px 0",
    color: "#2c3e50",
    fontWeight: 700,
  },
  workspace: {
    display: "flex",
    gap: "25px",
    maxWidth: "1200px",
    margin: "0 auto",
    alignItems: "flex-start",
  },
  sidebarLeft: {
    width: "220px",
    backgroundColor: "#ffffff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
  },
  sectionTitle: {
    margin: "0 0 15px 0",
    fontSize: "16px",
    color: "#4a5568",
    borderBottom: "2px solid #edf2f7",
    paddingBottom: "8px",
  },
  buttonGroupVertical: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  modelButton: {
    padding: "12px 15px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    backgroundColor: "#ffffff",
    color: "#4a5568",
    fontWeight: "500",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.2s ease",
    userSelect: "none",
  },
  modelButtonActive: {
    border: "2px solid #3182ce",
    backgroundColor: "#ebf8ff",
    color: "#2b6cb0",
    fontWeight: "bold",
  },
  mainContent: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: "25px",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px",
  },
  inputWrapper: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    maxWidth: "450px",
    gap: "8px",
  },
  label: {
    fontWeight: "600",
    fontSize: "14px",
    color: "#4a5568",
  },
  textInput: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e0",
    fontSize: "16px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  colorPickerContainer: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
  },
  colorCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    border: "1px solid #e2e8f0",
    padding: "8px 14px",
    borderRadius: "8px",
    backgroundColor: "#f7fafc",
    minWidth: "70px",
  },
  colorLabel: {
    fontSize: "11px",
    fontWeight: "bold",
    marginBottom: "6px",
    textTransform: "capitalize",
    color: "#718096",
  },
  colorInput: {
    border: "none",
    width: "35px",
    height: "35px",
    borderRadius: "50%",
    cursor: "pointer",
    backgroundColor: "transparent",
  },
  canvasContainer: {
    border: "2px solid #e2e8f0",
    borderRadius: "16px",
    overflow: "hidden",
    backgroundColor: "#edf2f7",
    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.06)",
  },
  downloadButton: {
    padding: "14px 40px",
    backgroundColor: "#38a169",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 6px rgba(56, 161, 105, 0.2)",
    transition: "background-color 0.2s",
  },
  sidebarRight: {
    width: "260px",
    backgroundColor: "#ffffff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  controlGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    borderBottom: "1px solid #edf2f7",
    paddingBottom: "15px",
  },
  controlGroupTitle: {
    fontWeight: "700",
    fontSize: "14px",
    color: "#4a5568",
    marginBottom: "4px",
  },
  controlRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
  },
  controlLabel: {
    fontSize: "12px",
    color: "#718096",
    fontWeight: "500",
  },
  btnRow: {
    display: "flex",
    gap: "6px",
  },
  controlBtn: {
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e0",
    borderRadius: "6px",
    transition: "all 0.15s ease",
    color: "#4a5568",
    userSelect: "none",
    WebkitUserSelect: "none",
  },
  resetButton: {
    marginTop: "5px",
    padding: "10px",
    backgroundColor: "#e53e3e",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(229, 62, 62, 0.2)",
  },
  resetEmojiButton: {
    padding: "10px",
    backgroundColor: "#3182ce",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(49, 130, 206, 0.2)",
    transition: "background-color 0.15s",
  },
};
