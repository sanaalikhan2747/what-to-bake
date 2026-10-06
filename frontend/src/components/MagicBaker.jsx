import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Sparkles } from "lucide-react";

export default function MagicBaker({ onActivate, context = "match", speaking = false }) {
  const canvasRef = useRef(null);
  const speakingRef = useRef(speaking);

  useEffect(() => {
    speakingRef.current = speaking;
  }, [speaking]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch {
      return undefined;
    }

    const width = 320;
    const height = 266;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1.7, 1.7, 1.42, -1.42, 0.1, 30);
    camera.position.set(0, 0.05, 8);

    scene.add(new THREE.HemisphereLight(0xfff8ee, 0x8f7360, 2.1));
    const keyLight = new THREE.DirectionalLight(0xfff2d8, 3.4);
    keyLight.position.set(-3, 5, 6);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xd5e5d2, 1.5);
    fillLight.position.set(4, 1, 3);
    scene.add(fillLight);

    const mat = (color, roughness = 0.68, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
    const skin = mat(0xeeb98f);
    const skinLight = mat(0xf3c8a2);
    const hair = mat(0x594238);
    const hat = mat(0xfffdf7);
    const hatTrim = mat(0xd89191);
    const apron = mat(0xd9899c);
    const apronLight = mat(0xf4c5ce);
    const shirt = mat(0xf6eee2);
    const ink = mat(0x44332e, 0.42);
    const blush = new THREE.MeshStandardMaterial({ color: 0xe58f86, roughness: 0.72, transparent: true, opacity: 0.72 });
    const gold = mat(0xe6b650, 0.28, 0.58);

    const baker = new THREE.Group();
    scene.add(baker);

    const ellipsoid = (parent, material, position, scale, geometry = new THREE.SphereGeometry(1, 32, 24)) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...position);
      mesh.scale.set(...scale);
      parent.add(mesh);
      return mesh;
    };

    const ground = new THREE.Mesh(new THREE.CircleGeometry(0.83, 48), new THREE.MeshBasicMaterial({ color: 0x9d8075, transparent: true, opacity: 0.13 }));
    ground.position.set(0, -1.08, -0.45);
    ground.scale.set(1.25, 0.22, 1);
    baker.add(ground);

    ellipsoid(baker, shirt, [0, -0.54, 0], [0.46, 0.62, 0.32]);
    ellipsoid(baker, apron, [0, -0.57, 0.307], [0.34, 0.57, 0.055]);
    const heartPocket = new THREE.Shape();
    heartPocket.moveTo(0, -0.1);
    heartPocket.bezierCurveTo(-0.04, -0.06, -0.17, 0.02, -0.13, 0.11);
    heartPocket.bezierCurveTo(-0.1, 0.17, -0.03, 0.15, 0, 0.09);
    heartPocket.bezierCurveTo(0.04, 0.15, 0.12, 0.17, 0.14, 0.1);
    heartPocket.bezierCurveTo(0.17, 0.02, 0.04, -0.06, 0, -0.1);
    const pocket = new THREE.Mesh(new THREE.ShapeGeometry(heartPocket), apronLight);
    pocket.position.set(0, -0.31, 0.363);
    pocket.scale.set(0.8, 0.8, 1);
    baker.add(pocket);
    [-0.12, 0, 0.12].forEach((x) => ellipsoid(baker, gold, [x, -0.48, 0.337], [0.018, 0.018, 0.012]));
    ellipsoid(baker, skin, [0, 0.1, 0], [0.16, 0.17, 0.15]);

    const legs = new THREE.Group();
    baker.add(legs);
    ellipsoid(legs, hair, [-0.16, -1.03, 0.01], [0.16, 0.17, 0.24]);
    ellipsoid(legs, hair, [0.16, -1.03, 0.01], [0.16, 0.17, 0.24]);

    const leftArm = new THREE.Group();
    leftArm.position.set(-0.37, -0.22, 0.04);
    leftArm.rotation.z = 0.3;
    baker.add(leftArm);
    ellipsoid(leftArm, shirt, [0, -0.23, 0], [0.11, 0.33, 0.12], new THREE.CapsuleGeometry(0.08, 0.29, 5, 12));
    ellipsoid(leftArm, skinLight, [-0.03, -0.48, 0.01], [0.11, 0.115, 0.105]);

    const wandArm = new THREE.Group();
    wandArm.position.set(0.37, -0.2, 0.06);
    wandArm.rotation.z = -0.5;
    baker.add(wandArm);
    ellipsoid(wandArm, shirt, [0, -0.22, 0], [0.11, 0.34, 0.12], new THREE.CapsuleGeometry(0.08, 0.31, 5, 12));
    ellipsoid(wandArm, skinLight, [0.015, -0.48, 0.025], [0.11, 0.115, 0.11]);

    const wand = new THREE.Group();
    wand.position.set(0.03, -0.5, 0.02);
    wand.rotation.z = -0.52;
    wandArm.add(wand);
    const wandStick = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.036, 0.53, 12), gold);
    wandStick.position.y = 0.29;
    wand.add(wandStick);
    const wandStar = new THREE.Mesh(new THREE.OctahedronGeometry(0.15, 0), gold);
    wandStar.position.y = 0.59;
    wandStar.rotation.z = Math.PI / 4;
    wand.add(wandStar);
    const wandGlow = new THREE.PointLight(0xffd678, 2.3, 1.8);
    wandGlow.position.copy(wandStar.position);
    wand.add(wandGlow);

    const head = new THREE.Group();
    head.position.set(0, 0.63, 0.02);
    baker.add(head);
    ellipsoid(head, hair, [0, -0.025, -0.09], [0.43, 0.53, 0.36]);
    ellipsoid(head, skinLight, [0, -0.045, 0.13], [0.37, 0.46, 0.33]);
    ellipsoid(head, hair, [-0.28, 0.22, 0.22], [0.12, 0.24, 0.14]);
    ellipsoid(head, hair, [0.26, 0.23, 0.22], [0.12, 0.23, 0.14]);

    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.09, 40), hat);
    brim.position.set(0, 0.39, 0.08);
    head.add(brim);
    ellipsoid(head, hat, [0, 0.51, 0.02], [0.29, 0.23, 0.27]);
    ellipsoid(head, hat, [-0.17, 0.49, 0.03], [0.14, 0.15, 0.16]);
    ellipsoid(head, hat, [0.17, 0.49, 0.03], [0.14, 0.15, 0.16]);
    const hatBand = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.018, 8, 48), hatTrim);
    hatBand.position.set(0, 0.385, 0.08);
    hatBand.rotation.x = Math.PI / 2;
    head.add(hatBand);
    ellipsoid(head, hatTrim, [-0.29, 0.47, 0.31], [0.09, 0.06, 0.035]);
    ellipsoid(head, hatTrim, [-0.2, 0.47, 0.31], [0.09, 0.06, 0.035]);
    ellipsoid(head, gold, [-0.245, 0.47, 0.35], [0.035, 0.035, 0.025]);

    const eyes = [];
    [-0.14, 0.14].forEach((x) => {
      const eye = ellipsoid(head, ink, [x, 0.0, 0.449], [0.038, 0.055, 0.024]);
      eyes.push(eye);
      ellipsoid(head, hat, [x - 0.012, 0.023, 0.473], [0.012, 0.017, 0.008]);
    });
    ellipsoid(head, blush, [-0.235, -0.13, 0.414], [0.072, 0.036, 0.014]);
    ellipsoid(head, blush, [0.235, -0.13, 0.414], [0.072, 0.036, 0.014]);
    ellipsoid(head, skin, [0, -0.08, 0.47], [0.06, 0.067, 0.05]);
    const mouth = ellipsoid(head, mat(0xa95c5a), [0, -0.215, 0.451], [0.052, 0.012, 0.018]);

    const sparkles = [];
    [[0.95, 0.85, 0.25], [1.22, 0.52, 0.05], [-0.95, 0.55, -0.15]].forEach((position, index) => {
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(index === 1 ? 0.07 : 0.095, 0), index === 2 ? hatTrim : gold);
      star.position.set(...position);
      star.rotation.set(0.2, 0.3, 0.2);
      baker.add(star);
      sparkles.push(star);
    });

    let animationFrame = 0;
    const timer = new THREE.Timer();
    timer.connect(document);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animate = (timestamp) => {
      animationFrame = window.requestAnimationFrame(animate);
      timer.update(timestamp);
      const time = timer.getElapsed();
      baker.position.y = reducedMotion ? 0 : Math.sin(time * 2.2) * 0.045;
      baker.rotation.y = reducedMotion ? 0 : Math.sin(time * 0.9) * 0.045;
      wandArm.rotation.z = reducedMotion ? -0.5 : -0.5 + Math.sin(time * 2.7) * 0.11;
      mouth.scale.y = speakingRef.current ? 0.02 + Math.abs(Math.sin(time * 15)) * 0.055 : 0.012;
      eyes.forEach((eye, index) => {
        const blink = Math.pow(Math.max(0, Math.sin(time * 0.8 + index * 2.7) - 0.985) / 0.015, 2);
        eye.scale.y = 0.063 * (reducedMotion ? 1 : 1 - Math.min(blink, 0.92));
      });
      sparkles.forEach((star, index) => {
        if (!reducedMotion) {
          star.rotation.y = time * (index % 2 ? 1 : -1);
          star.position.y += Math.sin(time * 2.2 + index) * 0.0007;
        }
      });
      renderer.render(scene, camera);
    };
    animate();

    const observer = new ResizeObserver(() => {
      if (!canvas.clientWidth || !canvas.clientHeight) return;
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    });
    observer.observe(canvas);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      timer.dispose();
      observer.disconnect();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
    };
  }, []);

  return (
    <button
      type="button"
      className={`match-mascot-button ${context === "chat" ? "match-mascot-chat" : ""}${speaking ? " is-speaking" : ""}`}
      onClick={onActivate}
      aria-label={context === "chat" ? "Tap Pippa to hear her latest reply" : "Ask the baker for a magical surprise bake"}
      aria-pressed={context === "chat" ? speaking : undefined}
      data-testid="match-mascot-surprise"
    >
      <span className="match-mascot-canvas-wrap" aria-hidden="true">
        <canvas ref={canvasRef} className="match-mascot-canvas" />
        <Sparkles className="match-mascot-sparkle sparkle-one" size={17} />
        <Sparkles className="match-mascot-sparkle sparkle-two" size={12} />
      </span>
      <span className="match-mascot-copy">
        {context === "chat" ? (
          <>
            <small>{speaking ? "PIPPA IS TALKING" : "YOUR LITTLE BAKER"}</small>
            <b>{speaking ? "Here’s the scoop…" : "Need a hand?"}</b>
            <span>Tap Pippa to hear her latest reply <Sparkles size={13} /></span>
          </>
        ) : (
          <>
            <small>YOUR LITTLE BAKER</small>
            <b>Tap her wand for a<br />magical bake match</b>
            <span>Let’s make a little magic <Sparkles size={13} /></span>
          </>
        )}
      </span>
    </button>
  );
}
