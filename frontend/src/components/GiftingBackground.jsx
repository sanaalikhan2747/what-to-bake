import { useEffect, useRef } from "react";
import "./GiftingBackground.css";

export default function GiftingBackground() {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || navigator.connection?.saveData) return undefined;
    let disposed = false;
    let visible = false;
    let started = false;
    let idle;
    let renderer;
    const geometries = [];
    const materials = [];
    let resizeObserver;
    let render;
    let frame;
    let detachInteraction;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stop = () => window.cancelAnimationFrame(frame);
    const synchronize = () => {
      stop();
      if (!disposed && visible && !document.hidden && render) render();
    };
    const initialize = async () => {
      if (started || disposed || !visible) return;
      started = true;
      try {
        const [THREE, { RoundedBoxGeometry }, { ParametricGeometry }] = await Promise.all([
          import("three"),
          import("three/addons/geometries/RoundedBoxGeometry.js"),
          import("three/addons/geometries/ParametricGeometry.js"),
        ]);
        if (disposed) return;
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.25;
        renderer.domElement.dataset.testid = "gifting-background-canvas";
        host.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-5, 5, 3, -3, 0.1, 40);
        camera.position.z = 15;
        scene.add(new THREE.HemisphereLight(0xffffff, 0x89948e, 2.1));
        const light = new THREE.DirectionalLight(0xfff7ed, 3.5);
        light.position.set(-3, 5, 8);
        light.castShadow = true;
        light.shadow.mapSize.set(1024, 1024);
        light.shadow.camera.left = -7;
        light.shadow.camera.right = 7;
        light.shadow.camera.top = 12;
        light.shadow.camera.bottom = -12;
        light.shadow.camera.far = 40;
        light.shadow.normalBias = 0.025;
        light.shadow.bias = -0.0001;
        scene.add(light);
        const fill = new THREE.DirectionalLight(0xe7efff, 1.6);
        fill.position.set(4, 1, 6);
        scene.add(fill);
        const boxGeometry = new RoundedBoxGeometry(1, 1, 1, 3, 0.035);
        const bowCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0.16, 0.19, -0.03),
          new THREE.Vector3(0.35, 0.16, 0),
          new THREE.Vector3(0.27, 0.015, 0.04),
          new THREE.Vector3(0, 0, 0.015),
        ]);
        const bowGeometry = new ParametricGeometry((along, across, target) => {
          const point = bowCurve.getPoint(along);
          target.set(point.x, point.y, point.z + (across - 0.5) * 0.15);
        }, 32, 6);
        const tailGeometry = new ParametricGeometry((along, across, target) => {
          target.set(0.06 + along * 0.31, -along * 0.26, (across - 0.5) * 0.12 + Math.sin(along * Math.PI) * 0.06);
        }, 20, 4);
        const shadowGeometry = new THREE.PlaneGeometry(2.1, 2.1);
        const shadowMaterial = new THREE.ShadowMaterial({ opacity: 0.12, depthWrite: false });
        geometries.push(boxGeometry, bowGeometry, tailGeometry, shadowGeometry);
        materials.push(shadowMaterial);
        const colors = [0x678f82, 0xd2a0a5, 0x7e9ead, 0xf1e6d7, 0x9d555e];
        const parcelMaterials = colors.map((color) =>
          new THREE.MeshPhysicalMaterial({ color, roughness: 0.48, metalness: 0.06, clearcoat: 0.25 })
        );
        const ribbonMaterials = [0xd5b777, 0xf4e9d9, 0xc6aa72, 0x789486, 0xd8b8a2].map((color) =>
          new THREE.MeshPhysicalMaterial({ color, roughness: 0.27, metalness: 0.55, clearcoat: 0.6, side: THREE.DoubleSide })
        );
        materials.push(...parcelMaterials, ...ribbonMaterials);
        const gifts = [];
        const createGift = (index) => {
          const gift = new THREE.Group();
          const lid = new THREE.Group();
          const addPart = (scale, position, partMaterial, parent = gift) => {
            const part = new THREE.Mesh(boxGeometry, partMaterial);
            part.scale.set(...scale);
            part.position.set(...position);
            part.castShadow = true;
            part.receiveShadow = true;
            parent.add(part);
          };
          const parcelMaterial = parcelMaterials[index % parcelMaterials.length];
          const ribbonMaterial = ribbonMaterials[index % ribbonMaterials.length];
          addPart([0.82, 0.65, 0.72], [0, 0, 0], parcelMaterial);
          addPart([0.085, 0.66, 0.73], [0, 0, 0], ribbonMaterial);
          addPart([0.83, 0.66, 0.085], [0, 0, 0], ribbonMaterial);
          addPart([0.88, 0.11, 0.78], [0, 0.35, 0], parcelMaterial, lid);
          addPart([0.09, 0.12, 0.79], [0, 0.35, 0], ribbonMaterial, lid);
          addPart([0.89, 0.12, 0.09], [0, 0.35, 0], ribbonMaterial, lid);
          for (const side of [-1, 1]) {
            const loop = new THREE.Mesh(bowGeometry, ribbonMaterial);
            loop.position.set(0, 0.42, 0);
            loop.scale.x = side;
            loop.rotation.x = -0.18;
            loop.castShadow = true;
            lid.add(loop);
            const tail = new THREE.Mesh(tailGeometry, ribbonMaterial);
            tail.position.set(0, 0.42, 0.1);
            tail.scale.x = side;
            tail.castShadow = true;
            lid.add(tail);
          }
          addPart([0.12, 0.08, 0.17], [0, 0.43, 0], ribbonMaterial, lid);
          gift.add(lid);
          gift.userData.lid = lid;
          const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
          shadow.rotation.x = -Math.PI / 2;
          shadow.position.y = -0.36;
          shadow.receiveShadow = true;
          gift.add(shadow);
          scene.add(gift);
          return gift;
        };
        const confettiGeometry = new THREE.PlaneGeometry(1, 1);
        geometries.push(confettiGeometry);
        const confettiMaterial = new THREE.MeshStandardMaterial({ color: 0xcab17c, metalness: 0.65, roughness: 0.35, side: THREE.DoubleSide });
        materials.push(confettiMaterial);
        const confetti = new THREE.InstancedMesh(confettiGeometry, confettiMaterial, 160);
        confetti.frustumCulled = false;
        scene.add(confetti);
        const transform = new THREE.Object3D();
        const scatter = (index, seed) => {
          const value = Math.sin(index * 127.1 + seed * 311.7) * 43758.5453;
          return value - Math.floor(value);
        };
        const section = host.parentElement;
        const pointer = new THREE.Vector2();
        const targetPointer = new THREE.Vector2();
        const raycaster = new THREE.Raycaster();
        let hoveredGift;
        let interactionActive = false;
        const onPointerMove = (event) => {
          if (motion.matches) return;
          const bounds = host.getBoundingClientRect();
          targetPointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, 1 - (event.clientY - bounds.top) / bounds.height * 2);
          interactionActive = true;
          raycaster.setFromCamera(targetPointer, camera);
          const hits = raycaster.intersectObjects(gifts, true).filter((hit) => hit.object.material !== shadowMaterial);
          hoveredGift = hits[0]?.object;
          while (hoveredGift && !gifts.includes(hoveredGift)) hoveredGift = hoveredGift.parent;
        };
        const onPointerLeave = () => {
          targetPointer.set(0, 0);
          hoveredGift = undefined;
          interactionActive = false;
        };
        section.addEventListener("pointermove", onPointerMove, { passive: true });
        section.addEventListener("pointerleave", onPointerLeave);
        section.addEventListener("pointerup", onPointerLeave);
        detachInteraction = () => {
          section.removeEventListener("pointermove", onPointerMove);
          section.removeEventListener("pointerleave", onPointerLeave);
          section.removeEventListener("pointerup", onPointerLeave);
        };
        const layout = () => {
          const worldHeight = camera.top - camera.bottom;
          const pixelScale = 10 / Math.max(host.clientWidth, 1);
          const mobile = host.clientWidth < 760;
          const bounds = host.getBoundingClientRect();
          const heading = section.querySelector(".festive-heading")?.getBoundingClientRect();
          const headingBottom = heading ? heading.bottom - bounds.top : 310;
          const headingRight = heading ? heading.right - bounds.left : host.clientWidth * 0.5;
          const topSpace = heading ? heading.top - bounds.top : 66;
          const lowerRows = Math.max(1, Math.ceil((host.clientHeight - headingBottom) / 400));
          const giftCount = (mobile ? 2 : 3) + lowerRows * 2;
          while (gifts.length < giftCount) gifts.push(createGift(gifts.length));
          gifts.forEach((gift, index) => {
            gift.visible = index < giftCount;
            if (!gift.visible) return;
            const heroCount = mobile ? 2 : 3;
            let horizontal;
            let vertical;
            let size;
            if (index < heroCount) {
              const available = host.clientWidth - headingRight;
              horizontal = mobile ? (index === 0 ? 0.77 : 0.24) : (headingRight + available * [0.37, 0.72, 0.16][index]) / host.clientWidth;
              vertical = mobile ? topSpace * 0.45 / host.clientHeight : (headingBottom * [0.44, 0.65, 0.83][index]) / host.clientHeight;
              size = mobile ? [45, 32][index] : Math.min([164, 112, 76][index], available * [0.34, 0.24, 0.16][index]);
            } else {
              const edgeIndex = index - heroCount;
              horizontal = edgeIndex % 2 === 0 ? 0.025 : 0.975;
              vertical = (headingBottom + 180 + Math.floor(edgeIndex / 2) * 400) / host.clientHeight;
              size = mobile ? 44 : 72 + scatter(index, 3) * 20;
            }
            gift.position.set(horizontal * 10 - 5, camera.top - vertical * worldHeight, 0);
            gift.scale.setScalar(pixelScale * size);
            gift.userData.rotation = { x: 0.4, y: index % 2 ? -0.5 : 0.55, z: (scatter(index, 4) - 0.5) * 0.2 };
            gift.rotation.set(gift.userData.rotation.x, gift.userData.rotation.y, gift.userData.rotation.z);
          });
          let count = 0;
          for (let index = 0; index < (mobile ? 65 : 150); index += 1) {
            const horizontal = scatter(index, 5);
            const vertical = scatter(index, 6);
            const inHeading = heading && horizontal * host.clientWidth > heading.left - bounds.left - 20
              && horizontal * host.clientWidth < headingRight + 20
              && vertical * host.clientHeight > topSpace - 20
              && vertical * host.clientHeight < headingBottom + 20;
            if (inHeading) continue;
            transform.position.set(horizontal * 10 - 5, camera.top - vertical * worldHeight, -0.8);
            const size = 2 + scatter(index, 7) * 2;
            transform.scale.set(pixelScale * size, pixelScale * size * 2.8, pixelScale);
            transform.rotation.set(scatter(index, 9), scatter(index, 10), scatter(index, 8) * Math.PI * 2);
            transform.updateMatrix();
            confetti.setMatrixAt(count, transform.matrix);
            count += 1;
          }
          confetti.count = count;
          confetti.instanceMatrix.needsUpdate = true;
        };
        render = () => {
          if (disposed) return;
          pointer.lerp(targetPointer, 0.065);
          const time = performance.now() * 0.001;
          gifts.forEach((gift, index) => {
            if (!gift.visible) return;
            const base = gift.userData.rotation;
            const animated = !motion.matches;
            const active = interactionActive ? 1 : 0;
            gift.rotation.x = base.x + (animated ? pointer.y * 0.12 * active + Math.sin(time * 0.45 + index) * 0.025 : 0);
            gift.rotation.y = base.y + (animated ? pointer.x * 0.26 * active + Math.sin(time * 0.35 + index) * 0.055 : 0);
            const target = gift === hoveredGift && animated ? 0.14 : 0;
            gift.userData.lid.position.y = THREE.MathUtils.lerp(gift.userData.lid.position.y, target, 0.075);
          });
          fill.position.x = 4 + pointer.x * 1.5;
          renderer.render(scene, camera);
          if (visible && !document.hidden && !motion.matches) frame = window.requestAnimationFrame(render);
        };
        resizeObserver = new ResizeObserver(() => {
          const width = host.clientWidth;
          const height = host.clientHeight;
          if (!width || !height) return;
          camera.top = 5 * height / width;
          camera.bottom = -camera.top;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height, false);
          layout();
          stop();
          render();
        });
        resizeObserver.observe(host);
      } catch (error) {
        console.error("Unable to initialize gifting background", error);
        stop();
        detachInteraction?.();
        renderer?.domElement.remove();
        renderer?.dispose();
        geometries.forEach((geometry) => geometry.dispose());
        materials.forEach((material) => material.dispose());
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !started) {
        if ("requestIdleCallback" in window) idle = window.requestIdleCallback(initialize, { timeout: 1200 });
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
      detachInteraction?.();
      if (idle !== undefined) window.cancelIdleCallback(idle);
      observer.disconnect();
      resizeObserver?.disconnect();
      document.removeEventListener("visibilitychange", synchronize);
      motion.removeEventListener("change", synchronize);
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      renderer?.dispose();
      renderer?.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} className="gifting-background" aria-hidden="true" />;
}