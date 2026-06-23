import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Text, Center } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";

interface Props {
  modelPath: string;
  colors: Record<string, string>;
  stickerText: string;
  textPosition: [number, number, number];
  textRotation: [number, number, number];
  onPartsDetected?: (parts: string[]) => void;
  resetTrigger?: number;
}

// Shader kustom untuk gradasi bodi emoji
const CustomGradientShader = {
  uniforms: {
    uColorTop: { value: new THREE.Color("#ffcc00") },
    uColorBottom: { value: new THREE.Color("#e67e22") },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uColorTop;
    uniform vec3 uColorBottom;
    varying vec2 vUv;
    void main() {
      vec3 finalColor = mix(uColorBottom, uColorTop, vUv.y);
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
};

// Pengendali Kamera & Target OrbitControls
function CameraController({
  groupRef,
  controlsRef,
  resetTrigger,
  modelPath,
}: {
  groupRef: React.RefObject<THREE.Group | null>;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  resetTrigger?: number;
  modelPath: string;
}) {
  const { camera } = useThree();

  useEffect(() => {
    if (!groupRef.current) return;

    const box = new THREE.Box3().setFromObject(groupRef.current);
    const center = new THREE.Vector3();
    const sizeBox = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(sizeBox);

    const maxDim = Math.max(sizeBox.x, sizeBox.y, sizeBox.z);
    const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 1.5;

    camera.position.set(0, center.y, cameraZ);
    camera.lookAt(0, center.y, 0);
    camera.updateProjectionMatrix();

    if (controlsRef.current) {
      controlsRef.current.target.set(0, center.y, 0);
      controlsRef.current.update();
    }
  }, [groupRef, camera, controlsRef, modelPath, resetTrigger]);

  return null;
}

// Komponen Loader Model Emoji + Kalkulasi Posisi Atas Kepala Dinamis
function EmojiModel({
  modelPath,
  colors,
  onPartsDetected,
  groupRef,
  stickerText,
  textPosition,
  textRotation,
}: Props & {
  groupRef: React.RefObject<THREE.Group | null>;
}) {
  const { scene } = useGLTF(modelPath);
  const [modelTopY, setModelTopY] = useState(0.8);

  // Efek Kloning Material & Deteksi Komponen Mesh
  useEffect(() => {
    const detectedParts: string[] = [];
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name) {
        detectedParts.push(child.name);
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material = child.material.map((mat) => mat.clone());
          } else {
            child.material = child.material.clone();
          }
        }
      }
    });

    if (onPartsDetected && detectedParts.length > 0) {
      onPartsDetected(detectedParts);
    }
  }, [scene, modelPath, onPartsDetected]);

  // BERSIH DARI ERROR 6133: Parameter dikosongkan karena tidak dibaca,
  // kalkulasi Box3 langsung menembak objek reference scene yang stabil.
  const handleCentered = () => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);

    const topY = size.y / 2;
    setModelTopY(topY);
  };

  // Efek Pengaplikasian Warna Model
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name) {
        if (
          child.name.toLowerCase().includes("body") ||
          child.name.toLowerCase().includes("sphere")
        ) {
          if (!(child.material instanceof THREE.ShaderMaterial)) {
            child.material = new THREE.ShaderMaterial({
              vertexShader: CustomGradientShader.vertexShader,
              fragmentShader: CustomGradientShader.fragmentShader,
              uniforms: THREE.UniformsUtils.clone(
                CustomGradientShader.uniforms,
              ),
            });
          }

          const targetColor = colors[child.name];
          if (targetColor && targetColor !== "") {
            const shaderMat = child.material as THREE.ShaderMaterial;
            shaderMat.uniforms.uColorTop.value.set(targetColor);
            const darkColor = new THREE.Color(targetColor).multiplyScalar(0.5);
            shaderMat.uniforms.uColorBottom.value.copy(darkColor);
          }
        } else {
          const targetColor = colors[child.name];
          if (targetColor && targetColor !== "") {
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
      }
    });
  }, [scene, colors]);

  const dynamicTextPosition: [number, number, number] = [
    textPosition[0],
    modelTopY + textPosition[1],
    textPosition[2],
  ];

  return (
    <group ref={groupRef} scale={1.5}>
      <Center onCentered={handleCentered}>
        <primitive object={scene} />
      </Center>

      {stickerText && (
        <Text
          position={dynamicTextPosition}
          rotation={textRotation}
          fontSize={0.25}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineColor="#000000"
          outlineWidth={0.035}
        >
          {stickerText}
          <meshBasicMaterial depthTest={true} color="#ffffff" />
        </Text>
      )}
    </group>
  );
}

// Komponen Utama Canvas Viewer
export default function EmojiViewer({
  modelPath,
  colors,
  stickerText,
  textPosition,
  textRotation,
  onPartsDetected,
  resetTrigger,
}: Props) {
  const mainGroupRef = useRef<THREE.Group>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);

  return (
    <div style={{ position: "relative", width: "500px", height: "500px" }}>
      <Canvas
        gl={{ alpha: true, preserveDrawingBuffer: true }}
        camera={{ position: [0, 0, 4], fov: 50 }}
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={2.5} />
        <directionalLight position={[5, 5, 5]} intensity={2.5} />

        <EmojiModel
          modelPath={modelPath}
          colors={colors}
          onPartsDetected={onPartsDetected}
          groupRef={mainGroupRef}
          stickerText={stickerText}
          textPosition={textPosition}
          textRotation={textRotation}
        />

        <CameraController
          groupRef={mainGroupRef}
          controlsRef={controlsRef}
          resetTrigger={resetTrigger}
          modelPath={modelPath}
        />

        <OrbitControls ref={controlsRef} makeDefault />
      </Canvas>
    </div>
  );
}
