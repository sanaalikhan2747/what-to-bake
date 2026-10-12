import { useEffect, useRef } from "react";
import "./OrderShowcase.css";

export default function OrderShowcase({ image, alt, caption }) {
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const cardRef = useRef(null);
  const renderRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    let disposed = false;
    let renderer;
    let observer;
    let texture;
    const geometries = [];
    const materials = [];
    const initialize = async () => {
      try {
        const [THREE, { RoundedBoxGeometry }] = await Promise.all([
          import("three"),
          import("three/addons/geometries/RoundedBoxGeometry.js"),
        ]);
        if (disposed || !stageRef.current || !canvasRef.current) return;
        renderer = new THREE.WebGLRenderer({
          canvas: canvasRef.current,
          alpha: true,
          antialias: true,
          powerPreference: "low-power",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.setClearColor(0x000000, 0);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 30);
        camera.position.set(0, 0.15, 8.8);
        camera.lookAt(0, 0, 0);
        scene.add(new THREE.HemisphereLight(0xfff9f4, 0x8a6b6a, 2.1));
        const key = new THREE.DirectionalLight(0xfff7eb, 3.1);
        key.position.set(-3.5, 5, 7);
        scene.add(key);
        const roseFill = new THREE.DirectionalLight(0xf0a9c0, 1.2);
        roseFill.position.set(4, 1, 4);
        scene.add(roseFill);

        const card = new THREE.Group();
        cardRef.current = card;
        scene.add(card);

        const frameGeometry = new RoundedBoxGeometry(4.55, 2.98, 0.16, 5, 0.08);
        const frameMaterial = new THREE.MeshPhysicalMaterial({ color: 0xfffcf8, roughness: 0.42, clearcoat: 0.34 });
        geometries.push(frameGeometry);
        materials.push(frameMaterial);
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.z = 0;
        frame.castShadow = true;
        card.add(frame);

        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin("anonymous");
        texture = await new Promise((resolve, reject) => loader.load(image, resolve, undefined, reject));
        if (disposed) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
        const imageGeometry = new THREE.PlaneGeometry(4.34, 2.75);
        const imageMaterial = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
        geometries.push(imageGeometry);
        materials.push(imageMaterial);
        const photo = new THREE.Mesh(imageGeometry, imageMaterial);
        photo.position.z = 0.091;
        card.add(photo);

        const plinthGeometry = new RoundedBoxGeometry(2.2, 0.19, 1.45, 4, 0.08);
        const plinthMaterial = new THREE.MeshPhysicalMaterial({ color: 0xe8c8c8, roughness: 0.34, metalness: 0.12, clearcoat: 0.5 });
        geometries.push(plinthGeometry);
        materials.push(plinthMaterial);
        const plinth = new THREE.Mesh(plinthGeometry, plinthMaterial);
        plinth.position.set(0, -1.62, -0.12);
        plinth.castShadow = true;
        card.add(plinth);

        const footGeometry = new RoundedBoxGeometry(1.55, 0.18, 1.1, 4, 0.07);
        const footMaterial = new THREE.MeshStandardMaterial({ color: 0xf4e9dd, roughness: 0.5 });
        geometries.push(footGeometry);
        materials.push(footMaterial);
        const foot = new THREE.Mesh(footGeometry, footMaterial);
        foot.position.set(0, -1.8, -0.12);
        card.add(foot);

        const render = () => {
          if (disposed || !stageRef.current) return;
          const { clientWidth, clientHeight } = stageRef.current;
          if (!clientWidth || !clientHeight) return;
          renderer.setSize(clientWidth, clientHeight, false);
          camera.aspect = clientWidth / clientHeight;
          camera.updateProjectionMatrix();
          renderer.render(scene, camera);
        };
        renderRef.current = render;
        observer = new ResizeObserver(render);
        observer.observe(stageRef.current);
        render();
        stageRef.current.dataset.ready = "true";
      } catch {
        if (stageRef.current) stageRef.current.dataset.ready = "fallback";
      }
    };
    initialize();

    return () => {
      disposed = true;
      observer?.disconnect();
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      texture?.dispose();
      renderer?.dispose();
      cardRef.current = null;
      renderRef.current = null;
    };
  }, [image]);

  const handlePointerMove = (event) => {
    const bounds = stageRef.current?.getBoundingClientRect();
    if (!bounds || !cardRef.current) return;
    if (dragRef.current) {
      cardRef.current.rotation.y += event.movementX * 0.006;
      cardRef.current.rotation.x = Math.max(-0.2, Math.min(0.2, cardRef.current.rotation.x + event.movementY * 0.004));
      renderRef.current?.();
      return;
    }
    const x = (event.clientX - bounds.left) / bounds.width * 2 - 1;
    const y = (event.clientY - bounds.top) / bounds.height * 2 - 1;
    cardRef.current.rotation.y = x * 0.13;
    cardRef.current.rotation.x = -y * 0.07;
    renderRef.current?.();
  };

  const resetCard = () => {
    dragRef.current = null;
    if (!cardRef.current) return;
    cardRef.current.rotation.x = 0;
    cardRef.current.rotation.y = 0;
    renderRef.current?.();
  };

  const startDrag = (event) => {
    dragRef.current = { pointerId: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const endDrag = (event) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    renderRef.current?.();
  };

  return (
    <figure className="order-showcase" aria-label={alt}>
      <div
        className="order-showcase-stage"
        ref={stageRef}
        style={{ "--order-showcase-image": `url("${image}")` }}
        onPointerMove={handlePointerMove}
        onPointerDown={startDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        onPointerLeave={resetCard}
        data-testid="order-showcase-stage"
      >
        <canvas ref={canvasRef} aria-hidden="true" />
        <span className="order-showcase-interaction">Move to explore</span>
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
