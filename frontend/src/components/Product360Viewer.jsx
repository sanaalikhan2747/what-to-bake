import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RotateCcw, X } from "lucide-react";
import "./Product360Viewer.css";

const PALETTE = {
  loaf: { crust: 0xb77a4c, crumb: 0xe2b877, accent: 0xf1d9a8 },
  cheesecake: { crust: 0xb77954, crumb: 0xf3dfb3, accent: 0xe4a0a3 },
  batch: { crust: 0x80503d, crumb: 0x9b6347, accent: 0xf0d2a2 },
  cookie: { crust: 0xb87948, crumb: 0xdba267, accent: 0x59382d },
};

export default function Product360Viewer({ product, onClose }) {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const draggingRef = useRef(false);
  const reducedMotion = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch {
      return undefined;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 40);
    camera.position.set(3.3, 2.7, 5.4);
    camera.lookAt(0, 0.22, 0);

    scene.add(new THREE.HemisphereLight(0xfff8ed, 0x866d5e, 2.1));
    const keyLight = new THREE.DirectionalLight(0xfff1d7, 2.8);
    keyLight.position.set(-3, 6, 5);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xe7b5bd, 1.25);
    fillLight.position.set(4, 2, -3);
    scene.add(fillLight);

    const material = (color, roughness = 0.82) => new THREE.MeshStandardMaterial({ color, roughness });
    const palette = PALETTE[product.category] || PALETTE.batch;
    const stage = new THREE.Group();
    stageRef.current = stage;
    scene.add(stage);

    const platter = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.4, 0.16, 64), material(0xf6ece0, 0.42));
    platter.position.y = -0.08;
    stage.add(platter);
    const platterRim = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.035, 10, 64), material(0xd9b9a0, 0.36));
    platterRim.rotation.x = Math.PI / 2;
    platterRim.position.y = 0.005;
    stage.add(platterRim);

    const addMesh = (geometry, color, position, scale, parent = stage, roughness = 0.82) => {
      const mesh = new THREE.Mesh(geometry, material(color, roughness));
      mesh.position.set(...position);
      if (scale) mesh.scale.set(...scale);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };

    const addBerry = (x, z, size = 0.075) => {
      addMesh(new THREE.SphereGeometry(size, 16, 12), 0xc96069, [x, 0.69, z], [1, 0.86, 1]);
      addMesh(new THREE.SphereGeometry(size * 0.25, 8, 6), 0x71905d, [x, 0.76, z], [1, 0.5, 1]);
    };

    if (product.category === "cookie") {
      const count = product.id.includes("pack") ? 4 : 1;
      for (let index = 0; index < count; index += 1) {
        const angle = count === 1 ? 0 : (index / count) * Math.PI * 2;
        const x = count === 1 ? 0 : Math.cos(angle) * 0.52;
        const z = count === 1 ? 0 : Math.sin(angle) * 0.42;
        addMesh(new THREE.CylinderGeometry(0.47, 0.49, 0.14, 40), palette.crust, [x, 0.12, z]);
        addMesh(new THREE.CylinderGeometry(0.43, 0.45, 0.035, 40), palette.crumb, [x, 0.205, z]);
        [[-0.17, -0.12], [0.13, -0.16], [-0.02, 0.13], [0.22, 0.09], [-0.23, 0.08]].forEach(([dx, dz]) => {
          addMesh(new THREE.SphereGeometry(0.055, 10, 8), palette.accent, [x + dx, 0.235, z + dz], [1, 0.55, 1]);
        });
      }
    } else if (product.category === "cheesecake") {
      addMesh(new THREE.CylinderGeometry(0.98, 1.02, 0.2, 64), palette.crust, [0, 0.11, 0]);
      addMesh(new THREE.CylinderGeometry(0.94, 0.97, 0.48, 64), palette.crumb, [0, 0.43, 0]);
      addMesh(new THREE.CylinderGeometry(0.94, 0.94, 0.08, 64), palette.accent, [0, 0.71, 0]);
      for (let index = 0; index < 7; index += 1) {
        const angle = (index / 7) * Math.PI * 2;
        addBerry(Math.cos(angle) * 0.68, Math.sin(angle) * 0.68, 0.085);
      }
    } else if (product.category === "loaf") {
      const pack = product.id.includes("mini-loaves");
      const count = pack ? 4 : 1;
      for (let index = 0; index < count; index += 1) {
        const x = pack ? (index % 2 ? 0.47 : -0.47) : 0;
        const z = pack ? (index > 1 ? 0.32 : -0.32) : 0;
        const scale = pack ? 0.57 : 1;
        const loaf = new THREE.Mesh(new THREE.CapsuleGeometry(0.39, 0.78, 8, 24), material(palette.crust));
        loaf.rotation.x = Math.PI / 2;
        loaf.scale.set(1.15 * scale, 0.82 * scale, 0.92 * scale);
        loaf.position.set(x, 0.42 * scale, z);
        loaf.castShadow = true;
        stage.add(loaf);
        for (const offset of [-0.24, 0, 0.24]) {
          const score = addMesh(new THREE.BoxGeometry(0.035 * scale, 0.012 * scale, 0.36 * scale), palette.accent, [x, 0.78 * scale, z + offset * scale]);
          score.rotation.y = -0.16;
        }
      }
    } else {
      const brownies = product.id.includes("brownie");
      const count = product.id.includes("pack") || brownies || product.id.includes("roll") || product.id.includes("bun") ? 4 : 1;
      for (let index = 0; index < count; index += 1) {
        const x = count === 1 ? 0 : (index % 2 ? 0.42 : -0.42);
        const z = count === 1 ? 0 : (index > 1 ? 0.36 : -0.36);
        if (product.unit === "cup") {
          addMesh(new THREE.CylinderGeometry(0.34, 0.3, 0.68, 32), 0xf4ded0, [x, 0.36, z]);
          addMesh(new THREE.SphereGeometry(0.31, 24, 16), palette.accent, [x, 0.75, z], [1, 0.46, 1]);
        } else if (brownies) {
          addMesh(new THREE.BoxGeometry(0.52, 0.28, 0.46), palette.crust, [x, 0.2, z]);
          addMesh(new THREE.BoxGeometry(0.5, 0.05, 0.44), palette.accent, [x, 0.36, z]);
        } else {
          addMesh(new THREE.CylinderGeometry(0.32, 0.38, 0.38, 32), palette.crumb, [x, 0.25, z]);
          addMesh(new THREE.TorusGeometry(0.18, 0.095, 12, 32), palette.accent, [x, 0.48, z]);
        }
      }
    }

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.68, 0.42, 48), material(0xe8d6c5, 0.42));
    base.position.y = -0.36;
    scene.add(base);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.76, 0.09, 48), material(0xd7bba5, 0.4));
    foot.position.y = -0.61;
    scene.add(foot);

    const observer = new ResizeObserver(() => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    });
    observer.observe(host);

    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let animationFrame;
    const animate = () => {
      animationFrame = window.requestAnimationFrame(animate);
      if (!draggingRef.current && !reducedMotion.current) stage.rotation.y += 0.004;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((item) => item.dispose());
        }
      });
      renderer.dispose();
      stageRef.current = null;
    };
  }, [product]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const dragStart = (event) => {
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const dragMove = (event) => {
    if (!draggingRef.current || !stageRef.current) return;
    stageRef.current.rotation.y += event.movementX * 0.012;
    stageRef.current.rotation.x = THREE.MathUtils.clamp(stageRef.current.rotation.x + event.movementY * 0.008, -0.32, 0.32);
  };
  const dragEnd = () => { draggingRef.current = false; };

  return (
    <div className="product360-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="product360-dialog" role="dialog" aria-modal="true" aria-labelledby="product360-title" data-testid="product-360-dialog">
        <header className="product360-header">
          <div><p className="eyebrow">INTERACTIVE 3D PREVIEW</p><h2 id="product360-title">{product.name}</h2></div>
          <button type="button" onClick={onClose} aria-label="Close 3D preview" className="product360-close"><X size={20} /></button>
        </header>
        <div className="product360-stage" onPointerDown={dragStart} onPointerMove={dragMove} onPointerUp={dragEnd} onPointerCancel={dragEnd} onLostPointerCapture={dragEnd}>
          <canvas ref={canvasRef} aria-label={`Rotating 3D model of ${product.name}`} data-testid="product-360-canvas" />
          <span className="product360-orbit-label"><RotateCcw size={14} /> Drag to rotate</span>
          <img className="product360-photo" src={product.image} alt={`${product.name} menu photo`} />
        </div>
        <footer className="product360-footer"><span>Illustrated turntable preview</span><strong>Rs. {product.price.toLocaleString()} <small>/ {product.unit}</small></strong></footer>
      </section>
    </div>
  );
}
