import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Text } from "@react-three/drei";
import { useEffect } from "react";
import * as THREE from "three";

interface Props {
  modelPath: string;
  colors: Record<string, string>;
  stickerText: string;
  textPosition: [number, number, number];
  textRotation: [number, number, number];
  onPartsDetected?: (parts: string[]) => void;
}

function EmojiModel({
  modelPath,
  colors,
  onPartsDetected,
}: Omit<Props, "stickerText" | "textPosition" | "textRotation">) {
  const { scene } = useGLTF(modelPath);

  useEffect(() => {
    const detectedParts: string[] = [];
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name) {
        detectedParts.push(child.name);
      }
    });
    if (onPartsDetected && detectedParts.length > 0) {
      onPartsDetected(detectedParts);
    }
  }, [scene, modelPath, onPartsDetected]);

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name) {
        const targetColor = colors[child.name];
        if (targetColor) {
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];
          materials.forEach((material) => {
            if (material instanceof THREE.MeshStandardMaterial) {
              material.color.set(targetColor);
            }
          });
        }
      }
    });
  }, [scene, colors]);

  return <primitive object={scene} scale={2} position={[0, -0.3, 0]} />;
}

export default function EmojiViewer({
  modelPath,
  colors,
  stickerText,
  textPosition,
  textRotation,
  onPartsDetected,
}: Props) {
  return (
    <Canvas
      gl={{ alpha: true, preserveDrawingBuffer: true }}
      camera={{ position: [0, 0, 5] }}
      style={{ width: "500px", height: "500px" }} // Sedikit diperkecil agar pas dengan panel kanan
    >
      <ambientLight intensity={2} />
      <directionalLight position={[5, 5, 5]} intensity={2} />

      <EmojiModel
        modelPath={modelPath}
        colors={colors}
        onPartsDetected={onPartsDetected}
      />

      {stickerText && (
        <Text
          position={textPosition}
          rotation={textRotation}
          fontSize={0.4}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineColor="#000000"
          outlineWidth={0.05}
        >
          {stickerText}
        </Text>
      )}

      {/* OrbitControls diaktifkan agar pengguna tetap bisa memutar kamera melihat emoji */}
      <OrbitControls makeDefault />
    </Canvas>
  );
}
