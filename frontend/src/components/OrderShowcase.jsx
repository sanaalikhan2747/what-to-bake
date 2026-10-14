import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import "./OrderShowcase.css";

export default function OrderShowcase({ image, alt, caption, gallery = [] }) {
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const cardRef = useRef(null);
  const renderRef = useRef(null);
  const dragRef = useRef(null);
  const galleryRef = useRef([]);
  const selectPhotoRef = useRef(null);
  const photoMaterialRef = useRef(null);
  const textureLoaderRef = useRef(null);
  const currentTextureRef = useRef(null);
  const threeRef = useRef(null);
  const [activePhoto, setActivePhoto] = useState(0);
  galleryRef.current = [...new Set([image, ...gallery].filter(Boolean))];

  const selectPhoto = (requestedIndex) => {
    const photos = galleryRef.current;
    if (!photos.length) return;
    const nextIndex = (requestedIndex + photos.length) % photos.length;
    if (nextIndex === activePhotoRef.current) return;
    activePhotoRef.current = nextIndex;
    setActivePhoto(nextIndex);
    if (!photoMaterialRef.current || !textureLoaderRef.current || !threeRef.current) return;
    textureLoaderRef.current.load(photos[nextIndex], (nextTexture) => {
      if (activePhotoRef.current !== nextIndex) {
        nextTexture.dispose();
        return;
      }
      nextTexture.colorSpace = threeRef.current.SRGBColorSpace;
      nextTexture.anisotropy = Math.min(8, rendererRef.current?.capabilities.getMaxAnisotropy() || 1);
      const previousTexture = currentTextureRef.current;
      photoMaterialRef.current.map = nextTexture;
      photoMaterialRef.current.needsUpdate = true;
      currentTextureRef.current = nextTexture;
      previousTexture?.dispose();
      renderRef.current?.();
    });
  };
  const activePhotoRef = useRef(activePhoto);
  const rendererRef = useRef(null);
  activePhotoRef.current = activePhoto;
  selectPhotoRef.current = selectPhoto;

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
        threeRef.current = THREE;
        renderer = new THREE.WebGLRenderer({
          canvas: canvasRef.current,
          alpha: true,
          antialias: true,
          powerPreference: "low-power",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        rendererRef.current = renderer;
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
        textureLoaderRef.current = loader;
        texture = await new Promise((resolve, reject) => loader.load(galleryRef.current[0] || image, resolve, undefined, reject));
        if (disposed) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
        const imageGeometry = new THREE.PlaneGeometry(4.34, 2.75);
        const imageMaterial = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
        photoMaterialRef.current = imageMaterial;
        currentTextureRef.current = texture;
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
          renderer.render(scene, camera);
        };
        const resize = () => {
          if (disposed || !stageRef.current) return;
          const { clientWidth, clientHeight } = stageRef.current;
          if (!clientWidth || !clientHeight) return;
          renderer.setSize(clientWidth, clientHeight, false);
          camera.aspect = clientWidth / clientHeight;
          camera.updateProjectionMatrix();
          render();
        };
        renderRef.current = render;
        observer = new ResizeObserver(resize);
        observer.observe(stageRef.current);
        resize();
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
      photoMaterialRef.current = null;
      textureLoaderRef.current = null;
      currentTextureRef.current = null;
      rendererRef.current = null;
      threeRef.current = null;
    };
  }, [image]);

  const handlePointerMove = (event) => {
    const bounds = stageRef.current?.getBoundingClientRect();
    if (!bounds || !cardRef.current) return;
    if (dragRef.current) return;
    const x = (event.clientX - bounds.left) / bounds.width * 2 - 1;
    const y = (event.clientY - bounds.top) / bounds.height * 2 - 1;
    cardRef.current.rotation.y = x * 0.13;
    cardRef.current.rotation.x = -y * 0.07;
    renderRef.current?.();
  };

  const resetCard = () => {
    if (dragRef.current) return;
    if (!cardRef.current) return;
    cardRef.current.rotation.x = 0;
    cardRef.current.rotation.y = 0;
    renderRef.current?.();
  };

  const startDrag = (event) => {
    if (event.target.closest("button")) return;
    const drag = { pointerId: event.pointerId, lastX: event.clientX, rotation: 0 };
    drag.move = (pointerEvent) => {
      if (pointerEvent.pointerId !== drag.pointerId || !cardRef.current) return;
      const bounds = stageRef.current?.getBoundingClientRect();
      if (!bounds?.width) return;
      const deltaX = pointerEvent.clientX - drag.lastX;
      drag.lastX = pointerEvent.clientX;
      const rotationDelta = deltaX / bounds.width * Math.PI * 2;
      drag.rotation += rotationDelta;
      cardRef.current.rotation.y += rotationDelta;
      cardRef.current.rotation.x = Math.max(-0.2, Math.min(0.2, cardRef.current.rotation.x + pointerEvent.movementY * 0.003));
      const rotationThreshold = Math.PI * 2 * 0.35;
      while (drag.rotation >= rotationThreshold) {
        drag.rotation -= rotationThreshold;
        cardRef.current.rotation.y -= Math.PI * 2;
        selectPhotoRef.current?.(activePhotoRef.current + 1);
      }
      while (drag.rotation <= -rotationThreshold) {
        drag.rotation += rotationThreshold;
        cardRef.current.rotation.y += Math.PI * 2;
        selectPhotoRef.current?.(activePhotoRef.current - 1);
      }
      renderRef.current?.();
    };
    drag.end = (pointerEvent) => {
      if (pointerEvent.pointerId !== drag.pointerId) return;
      window.removeEventListener("pointermove", drag.move);
      window.removeEventListener("pointerup", drag.end);
      window.removeEventListener("pointercancel", drag.end);
      dragRef.current = null;
      renderRef.current?.();
    };
    dragRef.current = drag;
    window.addEventListener("pointermove", drag.move);
    window.addEventListener("pointerup", drag.end);
    window.addEventListener("pointercancel", drag.end);
  };

  return (
    <figure className="order-showcase" aria-label={alt}>
      <div
        className="order-showcase-stage"
        ref={stageRef}
        style={{ "--order-showcase-image": `url("${image}")` }}
        onPointerMove={handlePointerMove}
        onPointerDown={startDrag}
        onPointerLeave={resetCard}
        data-testid="order-showcase-stage"
      >
        <canvas ref={canvasRef} aria-hidden="true" />
        <div className="order-showcase-controls" aria-label="Menu photo controls">
          <button type="button" className="order-showcase-arrow" onClick={() => selectPhoto(activePhotoRef.current - 1)} aria-label="Previous menu photo" data-testid="order-photo-previous"><ChevronLeft size={17} /></button>
          <span className="order-showcase-count" aria-live="polite" data-testid="order-photo-count">{activePhoto + 1} / {galleryRef.current.length}</span>
          <button type="button" className="order-showcase-arrow" onClick={() => selectPhoto(activePhotoRef.current + 1)} aria-label="Next menu photo" data-testid="order-photo-next"><ChevronRight size={17} /></button>
          <span className="order-showcase-rotation-hint"><RotateCw size={13} /><span>Turn to browse</span></span>
        </div>
        <span className="order-showcase-interaction">Drag the frame to browse the next bake</span>
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
