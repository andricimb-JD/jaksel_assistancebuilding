import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Building2, 
  Layers, 
  Clock, 
  Flame, 
  Zap, 
  ShieldCheck, 
  Maximize2, 
  Minimize2, 
  RotateCw, 
  Eye, 
  Sliders, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Sparkles,
  Check,
  FileText
} from 'lucide-react';

export const JAKSEL_4D_BIM_IMG = '/src/assets/images/jaksel_building_4d_bim_1793189277129.jpg';

interface Building4DViewerProps {
  buildingName: string;
  buildingType: string;
  companyName?: string;
  nib?: string;
  address?: string;
  permitStates?: Record<string, { name: string; selected: boolean; fileName: string | null; validity?: string; reklameJenis?: string }>;
  onOpenConsultation?: () => void;
  className?: string;
}

type TimePhase = 'phase1' | 'phase2' | 'phase3' | 'phase4';

export const Building4DViewer: React.FC<Building4DViewerProps> = ({
  buildingName,
  permitStates,
  className = ''
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeTab] = useState<'3d_interactive' | 'bim_4d'>('3d_interactive');
  
  // 4D Time Dimension State (Construction -> SLF 1 -> Periodic Audit -> 2026 Real-Time)
  const [currentPhase] = useState<TimePhase>('phase4');
  
  // Layer visibility
  const [showStructure] = useState<boolean>(true);
  const [showFireSystem] = useState<boolean>(true);
  const [showMEP] = useState<boolean>(true);
  const [showFacade] = useState<boolean>(true);
  
  // Exploded view slider (0 = normal, 1 = fully exploded)
  const [explodeFactor, setExplodeFactor] = useState<number>(0);
  const [isRotating, setIsRotating] = useState<boolean>(true);

  // Three.js Scene Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const buildingGroupRef = useRef<THREE.Group | null>(null);
  const floorMeshesRef = useRef<{ mesh: THREE.Object3D; originalY: number; level: number }[]>([]);
  const facadeMeshesRef = useRef<THREE.Mesh[]>([]);
  const fireMeshesRef = useRef<THREE.Object3D[]>([]);
  const mepMeshesRef = useRef<THREE.Object3D[]>([]);
  const structureMeshesRef = useRef<THREE.Object3D[]>([]);
  const animFrameId = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const prevMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (activeTab !== '3d_interactive' || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 240;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x070d18); // Modern deep technical slate

    // Ambient & Directional Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x60a5fa, 2.0); // Cool cyan accent
    dirLight1.position.set(15, 25, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf59e0b, 1.5); // Warm gold accent
    dirLight2.position.set(-20, 15, -15);
    scene.add(dirLight2);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(15, 9, 21);
    camera.lookAt(0, 3.5, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Ground Grid & City Base
    const gridHelper = new THREE.GridHelper(30, 30, 0x0284c7, 0x1e293b);
    gridHelper.position.y = -2.2;
    scene.add(gridHelper);

    // Ground reflective circular platform
    const platformGeo = new THREE.CylinderGeometry(8, 8.5, 0.4, 32);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.8
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = -2.4;
    scene.add(platform);

    // 5. Build Procedural 4D Skyscraper Model
    const buildingGroup = new THREE.Group();
    buildingGroupRef.current = buildingGroup;
    scene.add(buildingGroup);

    floorMeshesRef.current = [];
    facadeMeshesRef.current = [];
    fireMeshesRef.current = [];
    mepMeshesRef.current = [];
    structureMeshesRef.current = [];

    // Materials
    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
      metalness: 0.3
    });

    const steelColumnMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.2,
      metalness: 0.9,
      wireframe: false
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.8,
      ior: 1.52,
      depthWrite: false
    });

    const fireRiserMat = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Red Fire System
      emissive: 0x7f1d1d,
      roughness: 0.3,
      metalness: 0.7
    });

    const mepCoreMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Amber MEP Electricity/Lift
      emissive: 0x78350f,
      roughness: 0.4,
      metalness: 0.6
    });

    // A. Central Concrete Elevator / Stair Core (Runs through all floors)
    const coreGeo = new THREE.BoxGeometry(2.2, 12, 2.2);
    const coreMesh = new THREE.Mesh(coreGeo, concreteMat);
    coreMesh.position.set(0, 3.8, 0);
    buildingGroup.add(coreMesh);
    structureMeshesRef.current.push(coreMesh);

    // B. Fire Riser Pipe (Vertical Red Pipe along core)
    const riserGeo = new THREE.CylinderGeometry(0.12, 0.12, 12, 12);
    const riserMesh = new THREE.Mesh(riserGeo, fireRiserMat);
    riserMesh.position.set(1.2, 3.8, 1.2);
    buildingGroup.add(riserMesh);
    fireMeshesRef.current.push(riserMesh);

    // C. MEP Elevator Shaft & Lift Car
    const liftShaftGeo = new THREE.BoxGeometry(1.4, 11.5, 1.4);
    const liftShaftWireMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, wireframe: true });
    const liftShaftMesh = new THREE.Mesh(liftShaftGeo, liftShaftWireMat);
    liftShaftMesh.position.set(-0.2, 3.8, -0.2);
    buildingGroup.add(liftShaftMesh);
    mepMeshesRef.current.push(liftShaftMesh);

    // Dynamic Lift Car
    const liftCarGeo = new THREE.BoxGeometry(1.1, 0.9, 1.1);
    const liftCarMesh = new THREE.Mesh(liftCarGeo, mepCoreMat);
    liftCarMesh.name = 'liftCar';
    liftCarMesh.position.set(-0.2, 1, -0.2);
    buildingGroup.add(liftCarMesh);
    mepMeshesRef.current.push(liftCarMesh);

    // D. Multi-Tier Floor Slabs (7 main distinct sectional floors for 4D Inspection)
    const totalFloors = 7;
    const floorHeight = 1.4;

    for (let i = 0; i < totalFloors; i++) {
      const floorGroup = new THREE.Group();
      const currentY = (i - 1) * floorHeight; // Basement at -1, podium at 0, towers up to 5

      // Width tapers slightly as height increases (architectural aesthetic)
      const sizeScale = i <= 1 ? 5.2 : i <= 4 ? 4.4 : 3.8;

      // 1. Concrete Slab
      const slabGeo = new THREE.BoxGeometry(sizeScale, 0.18, sizeScale);
      const slabMesh = new THREE.Mesh(slabGeo, concreteMat);
      floorGroup.add(slabMesh);

      // 2. Structural Corner Columns
      const colOffset = sizeScale / 2 - 0.3;
      const colGeo = new THREE.BoxGeometry(0.22, floorHeight - 0.18, 0.22);
      const colPositions = [
        [colOffset, (floorHeight - 0.18) / 2, colOffset],
        [-colOffset, (floorHeight - 0.18) / 2, colOffset],
        [colOffset, (floorHeight - 0.18) / 2, -colOffset],
        [-colOffset, (floorHeight - 0.18) / 2, -colOffset]
      ];

      colPositions.forEach(([cx, cy, cz]) => {
        const colMesh = new THREE.Mesh(colGeo, steelColumnMat);
        colMesh.position.set(cx, cy, cz);
        floorGroup.add(colMesh);
        structureMeshesRef.current.push(colMesh);
      });

      // 3. Glass Exterior Facade Wall (per floor for exploded view)
      const glassGeo = new THREE.BoxGeometry(sizeScale + 0.08, floorHeight, sizeScale + 0.08);
      const facadeMesh = new THREE.Mesh(glassGeo, glassMat);
      facadeMesh.position.y = floorHeight / 2;
      floorGroup.add(facadeMesh);
      facadeMeshesRef.current.push(facadeMesh);

      // 4. Fire Sprinkler Ring (per floor)
      const sprinklerRingGeo = new THREE.TorusGeometry(sizeScale / 2 - 0.6, 0.04, 8, 24);
      const sprinklerMesh = new THREE.Mesh(sprinklerRingGeo, fireRiserMat);
      sprinklerMesh.rotation.x = Math.PI / 2;
      sprinklerMesh.position.y = floorHeight - 0.1;
      floorGroup.add(sprinklerMesh);
      fireMeshesRef.current.push(sprinklerMesh);

      floorGroup.position.y = currentY;
      buildingGroup.add(floorGroup);

      floorMeshesRef.current.push({
        mesh: floorGroup,
        originalY: currentY,
        level: i
      });
    }

    // E. Rooftop Crown & Helipad
    const roofCrownGeo = new THREE.CylinderGeometry(1.6, 2.0, 0.6, 16);
    const roofCrownMesh = new THREE.Mesh(roofCrownGeo, steelColumnMat);
    roofCrownMesh.position.y = 8.2;
    buildingGroup.add(roofCrownMesh);

    // Lightning Rod / Penangkal Petir at Top
    const rodGeo = new THREE.CylinderGeometry(0.04, 0.08, 1.8, 8);
    const rodMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.95 });
    const rodMesh = new THREE.Mesh(rodGeo, rodMat);
    rodMesh.position.y = 9.4;
    buildingGroup.add(rodMesh);

    // F. Izin Penyelenggaraan Reklame (IPR) - 3D Commercial Billboard / Videotron on Podium Facade
    const reklameGroup = new THREE.Group();
    // Heavy steel frame
    const frameGeo = new THREE.BoxGeometry(3.2, 1.4, 0.16);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b,
      metalness: 0.85,
      roughness: 0.25
    });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    reklameGroup.add(frameMesh);

    // Glowing LED Screen Face
    const screenGeo = new THREE.PlaneGeometry(3.0, 1.2);
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      emissive: 0x6b21a8,
      emissiveIntensity: 0.9,
      roughness: 0.2
    });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.z = 0.085;
    reklameGroup.add(screenMesh);

    // Mounting Brackets
    const bracketGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 8);
    const bracketMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 });
    const b1 = new THREE.Mesh(bracketGeo, bracketMat);
    b1.rotation.x = Math.PI / 2;
    b1.position.set(-1.1, 0, -0.16);
    reklameGroup.add(b1);
    const b2 = new THREE.Mesh(bracketGeo, bracketMat);
    b2.rotation.x = Math.PI / 2;
    b2.position.set(1.1, 0, -0.16);
    reklameGroup.add(b2);

    reklameGroup.position.set(0, 1.2, 2.75);
    buildingGroup.add(reklameGroup);

    // Mouse drag rotation & interaction
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !buildingGroupRef.current) return;
      const deltaX = e.clientX - prevMousePos.current.x;
      const deltaY = e.clientY - prevMousePos.current.y;

      buildingGroupRef.current.rotation.y += deltaX * 0.008;
      
      if (cameraRef.current) {
        cameraRef.current.position.y = Math.max(3, Math.min(22, cameraRef.current.position.y + deltaY * 0.04));
        cameraRef.current.lookAt(0, 3, 0);
      }

      prevMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      const zoomDelta = e.deltaY * 0.02;
      cameraRef.current.position.z = Math.max(12, Math.min(38, cameraRef.current.position.z + zoomDelta));
      cameraRef.current.position.x = Math.max(8, Math.min(30, cameraRef.current.position.x + zoomDelta * 0.7));
      cameraRef.current.lookAt(0, 3, 0);
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('wheel', onWheel, { passive: false });

    // Touch support for mobile
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        prevMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || !buildingGroupRef.current || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - prevMousePos.current.x;
      buildingGroupRef.current.rotation.y += deltaX * 0.008;
      prevMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
    };

    domElement.addEventListener('touchstart', onTouchStart);
    domElement.addEventListener('touchmove', onTouchMove);
    domElement.addEventListener('touchend', onTouchEnd);

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Slow idle rotation if enabled and not dragging
      if (isRotating && !isDraggingRef.current && buildingGroupRef.current) {
        buildingGroupRef.current.rotation.y += 0.003;
      }

      // Animate Lift Car traveling up and down
      const lift = buildingGroup.getObjectByName('liftCar');
      if (lift) {
        lift.position.y = 1.0 + Math.sin(elapsedTime * 0.8) * 3.5;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight || 240;
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('mousedown', onMouseDown);
      domElement.removeEventListener('wheel', onWheel);
      domElement.removeEventListener('touchstart', onTouchStart);
      domElement.removeEventListener('touchmove', onTouchMove);
      domElement.removeEventListener('touchend', onTouchEnd);
      renderer.dispose();
    };
  }, [activeTab, isRotating]);

  // Update exploded view when explodeFactor changes
  useEffect(() => {
    floorMeshesRef.current.forEach(({ mesh, originalY, level }) => {
      mesh.position.y = originalY + (level - 3) * explodeFactor * 1.5;
    });
  }, [explodeFactor]);

  // Toggle Visibility Layers
  useEffect(() => {
    facadeMeshesRef.current.forEach(m => (m.visible = showFacade));
    structureMeshesRef.current.forEach(m => (m.visible = showStructure));
    fireMeshesRef.current.forEach(m => (m.visible = showFireSystem));
    mepMeshesRef.current.forEach(m => (m.visible = showMEP));
  }, [showFacade, showStructure, showFireSystem, showMEP]);

  return (
    <div className={`bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl flex flex-col ${className}`}>
      {/* Main Visual Display Area: Pure 3D Interactive WebGL */}
      <div className="relative h-[210px] sm:h-[240px] bg-slate-950 overflow-hidden flex flex-col justify-between">
        <div className="relative w-full h-[210px] sm:h-[240px]">
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
        </div>
      </div>
    </div>
  );
};
