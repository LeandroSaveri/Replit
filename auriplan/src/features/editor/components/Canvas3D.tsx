// ============================================
// CANVAS 3D - Visualização 3D com Three.js
// ============================================

import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Grid, 
  Environment, 
  ContactShadows,
  PerspectiveCamera,
  Box as DreiBox,
  Plane
} from '@react-three/drei';
import { useEditorStore, selectCurrentScene } from '@store/editorStore';
import * as THREE from 'three';

// Wall Component
function Wall3D({ wall }: { wall: import('@auriplan-types').Wall }) {
  const start = new THREE.Vector3(wall.start[0], 0, wall.start[1]);
  const end = new THREE.Vector3(wall.end[0], 0, wall.end[1]);
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const angle = Math.atan2(direction.z, direction.x);

  const position = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  position.y = wall.height / 2;

  return (
    <DreiBox
      position={position}
      rotation={[0, -angle, 0]}
      args={[length, wall.height, wall.thickness]}
    >
      <meshStandardMaterial color={wall.color} />
    </DreiBox>
  );
}

// Door Component
function Door3D({ door, walls }: { door: import('@auriplan-types').Door; walls: import('@auriplan-types').Wall[] }) {
  const wall = walls.find(w => w.id === door.wallId);
  if (!wall) return null;

  const start = new THREE.Vector3(wall.start[0], 0, wall.start[1]);
  const end = new THREE.Vector3(wall.end[0], 0, wall.end[1]);
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const angle = Math.atan2(direction.z, direction.x);

  const doorPosition = new THREE.Vector3()
    .copy(start)
    .add(direction.clone().multiplyScalar(door.position / length));
  doorPosition.y = door.height / 2;

  return (
    <group position={doorPosition} rotation={[0, -angle, 0]}>
      <DreiBox args={[door.width, door.height, door.depth]}>
        <meshStandardMaterial color={door.panelColor} />
      </DreiBox>
      {/* Frame */}
      <DreiBox args={[door.width + 0.1, door.height + 0.05, (door.depth ?? 0.1) + 0.02]} position={[0, 0, 0]}>
        <meshStandardMaterial color={door.frameColor} />
      </DreiBox>
    </group>
  );
}

// Window Component
function Window3D({ window: win, walls }: { window: import('@auriplan-types').Window; walls: import('@auriplan-types').Wall[] }) {
  const wall = walls.find(w => w.id === win.wallId);
  if (!wall) return null;

  const start = new THREE.Vector3(wall.start[0], 0, wall.start[1]);
  const end = new THREE.Vector3(wall.end[0], 0, wall.end[1]);
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const angle = Math.atan2(direction.z, direction.x);

  const windowPosition = new THREE.Vector3()
    .copy(start)
    .add(direction.clone().multiplyScalar(win.position / length));
  windowPosition.y = (win.sillHeight ?? 0.9) + win.height / 2;

  return (
    <group position={windowPosition} rotation={[0, -angle, 0]}>
      {/* Glass */}
      <DreiBox args={[win.width, win.height, 0.02]}>
        <meshPhysicalMaterial 
          color="#87CEEB" 
          transparent 
          opacity={0.3} 
          transmission={0.9}
          roughness={0}
          metalness={0}
        />
      </DreiBox>
      {/* Frame */}
      <DreiBox args={[win.width + 0.08, win.height + 0.08, 0.06]}>
        <meshStandardMaterial color={win.frameColor} />
      </DreiBox>
    </group>
  );
}

// Room Component
function Room3D({ room }: { room: import('@auriplan-types').Room }) {
  if (room.points.length < 3) return null;

  const shape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(room.points[0][0], room.points[0][1]);
    for (let i = 1; i < room.points.length; i++) {
      shape.lineTo(room.points[i][0], room.points[i][1]);
    }
    shape.closePath();
    return shape;
  }, [room.points]);

  const floorGeometry = useMemo(() => {
    return new THREE.ShapeGeometry(shape);
  }, [shape]);

  return (
    <group>
      {/* Floor */}
      <mesh geometry={floorGeometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <meshStandardMaterial color={room.floorColor} />
      </mesh>
      {/* Ceiling */}
      <mesh geometry={floorGeometry} rotation={[Math.PI / 2, 0, 0]} position={[0, room.height ?? 2.8, 0]}>
        <meshStandardMaterial color={room.ceilingColor} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// Furniture Component
function Furniture3D({ item }: { item: import('@auriplan-types').Furniture }) {
  return (
    <group 
      position={Array.isArray(item.position) ? item.position as [number,number,number] : [(item.position as any).x, (item.position as any).y, (item.position as any).z]} 
      rotation={Array.isArray(item.rotation) ? item.rotation as [number,number,number] : typeof item.rotation === 'number' ? [0, item.rotation, 0] : [(item.rotation as any).x, (item.rotation as any).y, (item.rotation as any).z]}
      scale={(item.scale ?? [1, 1, 1]) as [number, number, number]}
    >
      <DreiBox args={[(item.dimensions?.width ?? 1), (item.dimensions?.height ?? 1), (item.dimensions?.depth ?? 1)]}>
        <meshStandardMaterial color={item.color} />
      </DreiBox>
    </group>
  );
}

// Scene Content
function SceneContent() {
  const currentScene = useEditorStore(selectCurrentScene);
  const { camera } = useThree();

  if (!currentScene) return null;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[10, 20, 10]} 
        intensity={1} 
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-10, 10, -10]} intensity={0.5} />

      {/* Environment */}
      <Environment preset="apartment" />

      {/* Grid */}
      <Grid
        infiniteGrid
        fadeDistance={50}
        fadeStrength={1}
        cellSize={1}
        sectionSize={5}
        cellColor="#475569"
        sectionColor="#64748b"
      />

      {/* Rooms */}
      {currentScene.rooms.map(room => (
        <Room3D key={room.id} room={room} />
      ))}

      {/* Walls */}
      {currentScene.walls.map(wall => (
        <Wall3D key={wall.id} wall={wall} />
      ))}

      {/* Doors */}
      {currentScene.doors.map(door => (
        <Door3D key={door.id} door={door} walls={currentScene.walls} />
      ))}

      {/* Windows */}
      {currentScene.windows.map(window => (
        <Window3D key={window.id} window={window} walls={currentScene.walls} />
      ))}

      {/* Furniture */}
      {currentScene.furniture.map(item => (
        <Furniture3D key={item.id} item={item} />
      ))}

      {/* Ground */}
      <ContactShadows 
        position={[0, 0, 0]} 
        opacity={0.4} 
        scale={50} 
        blur={2} 
        far={10} 
      />
    </>
  );
}

// Camera Controller
function CameraController() {
  const controlsRef = useRef<any>(null);
  const { camera } = useEditorStore();

  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.05}
      minDistance={1}
      maxDistance={100}
      maxPolarAngle={Math.PI / 2 - 0.05}
    />
  );
}

export function Canvas3D() {
  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{ position: [15, 15, 15], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <SceneContent />
          <CameraController />
        </Suspense>
      </Canvas>
    </div>
  );
}
