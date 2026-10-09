import { useEffect, useRef } from "react";
import "./GiftingBackground.css";

export default function GiftingBackground() {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!host || motion.matches || navigator.connection?.saveData) return undefined;
    let disposed = false;
    let visible = false;
    let started = false;
    let timer;
    let idle;
    let renderer;
    let geometry;
    let material;
    let resizeObserver;
    let render;
    let angle = 0;
    const stop = () => window.clearTimeout(timer);
    const tick = () => {
      if (disposed || !visible || document.hidden || motion.matches || !render) return;
      angle += 0.007;
      render();
      timer = window.setTimeout(tick, 1000 / 12);
    };
    const synchronize = () => { stop(); tick(); };
    const initialize = async () => {
      if (started || disposed || !visible || motion.matches) return;
      started = true;
      try {
        const THREE = await import("three");
        if (disposed) return;
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
        renderer.setPixelRatio(1);
        renderer.domElement.dataset.testid = "gifting-background-canvas";
        host.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-5, 5, 3, -3, 0.1, 20);
        camera.position.z = 8;
        geometry = new THREE.TorusGeometry(0.9, 0.045, 4, 32);
        material = new THREE.MeshBasicMaterial({ color: 0xd16b8f, transparent: true, opacity: 0.3 });
        const ribbons = new THREE.InstancedMesh(geometry, material, 8);
        const transform = new THREE.Object3D();
        scene.add(ribbons);
        render = () => {
          for (let index = 0; index < 8; index += 1) {
            transform.position.set(index % 2 ? 4.1 : -4.1, 2.7 - Math.floor(index / 2) * 1.8, 0);
            transform.rotation.set(0.7 + index * 0.2, angle + index, index * 0.45);
            transform.scale.set(1.2, 0.75, 1);
            transform.updateMatrix();
            ribbons.setMatrixAt(index, transform.matrix);
          }
          ribbons.instanceMatrix.needsUpdate = true;
          renderer.render(scene, camera);
        };
        resizeObserver = new ResizeObserver(() => {
          renderer.setSize(Math.min(host.clientWidth, 960), Math.min(host.clientHeight, 600), false);
          render();
        });
        resizeObserver.observe(host);
        synchronize();
      } catch {
        renderer?.domElement.remove();
        renderer?.dispose();
        geometry?.dispose();
        material?.dispose();
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !started) {
        if ("requestIdleCallback" in window) idle = window.requestIdleCallback(initialize);
        else initialize();
      }
      synchronize();
    });
    observer.observe(host);
    document.addEventListener("visibilitychange", synchronize);
    motion.addEventListener("change", synchronize);
    return () => {
      disposed = true;
      stop();
      if (idle !== undefined) window.cancelIdleCallback(idle);
      observer.disconnect();
      resizeObserver?.disconnect();
      document.removeEventListener("visibilitychange", synchronize);
      motion.removeEventListener("change", synchronize);
      geometry?.dispose();
      material?.dispose();
      renderer?.dispose();
      renderer?.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} className="gifting-background" aria-hidden="true" />;
}