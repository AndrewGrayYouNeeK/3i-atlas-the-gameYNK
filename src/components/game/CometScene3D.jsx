import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Three.js 3D comet scene — renders Atlas as a glowing nucleus with
 * a sparkly multi-colour particle tail (blue CO₂, red dust, green ion).
 * Exposed ref: { getPosition() → {x,y} in canvas-normalised coords }
 */
export default function CometScene3D({ engineRef, onReady }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ── Scene / Camera ────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 80);

    // ── Stars ─────────────────────────────────────────────────────────────────
    const starCount = 600;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3]     = (Math.random() - 0.5) * 400;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 400;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 200 - 50;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, transparent: true, opacity: 0.7 });
    scene.add(new THREE.Points(starGeo, starMat));

    // ── Comet nucleus ─────────────────────────────────────────────────────────
    const comet = new THREE.Group();
    scene.add(comet);
    comet.position.set(0, 0, 0);

    // Core glow sphere
    const nucleusGeo = new THREE.SphereGeometry(2.8, 32, 32);
    const nucleusMat = new THREE.MeshStandardMaterial({
      color: 0xddeeff,
      emissive: 0x8877bb,
      emissiveIntensity: 1.2,
      roughness: 0.6,
      metalness: 0.1,
    });
    const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
    comet.add(nucleus);

    // Bloom halo (sprite)
    const haloTex = (() => {
      const size = 128;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0, 'rgba(200,220,255,0.9)');
      g.addColorStop(0.3, 'rgba(140,100,255,0.5)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      return new THREE.CanvasTexture(canvas);
    })();
    const haloMat = new THREE.SpriteMaterial({ map: haloTex, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.65 });
    const halo = new THREE.Sprite(haloMat);
    halo.scale.set(28, 28, 1);
    comet.add(halo);

    // Lights
    const pointLight = new THREE.PointLight(0xaabbff, 3, 80);
    comet.add(pointLight);
    scene.add(new THREE.AmbientLight(0x112233, 0.8));

    // ── Sparkly gas tail ──────────────────────────────────────────────────────
    const particleCount = 1200;
    const positions = new Float32Array(particleCount * 3);
    const colors    = new Float32Array(particleCount * 3);
    const sizes     = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      const frac = Math.random();
      positions[idx]     = (Math.random() - 0.5) * (2 + frac * 6); // wider toward end
      positions[idx + 1] = (Math.random() - 0.5) * (2 + frac * 4);
      positions[idx + 2] = -frac * 50; // trail extends behind

      const r = Math.random();
      if (r < 0.4) {        // blue CO2
        colors[idx] = 0.2; colors[idx + 1] = 0.8; colors[idx + 2] = 1.0;
      } else if (r < 0.7) { // red dust
        colors[idx] = 1.0; colors[idx + 1] = 0.4; colors[idx + 2] = 0.1;
      } else {              // green ion
        colors[idx] = 0.1; colors[idx + 1] = 0.9; colors[idx + 2] = 0.3;
      }
      sizes[i] = 0.8 + Math.random() * 2;
    }

    const tailGeo = new THREE.BufferGeometry();
    tailGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    tailGeo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
    tailGeo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

    // Circular sprite texture for round particles
    const makeCircleTex = () => {
      const c = document.createElement('canvas');
      c.width = c.height = 32;
      const cx = c.getContext('2d');
      const g = cx.createRadialGradient(16, 16, 0, 16, 16, 16);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.4, 'rgba(255,255,255,0.8)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      cx.fillStyle = g;
      cx.fillRect(0, 0, 32, 32);
      return new THREE.CanvasTexture(c);
    };
    const circleTex = makeCircleTex();

    const tailMat = new THREE.PointsMaterial({
      vertexColors: true,
      size: 0.8,
      map: circleTex,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const tail = new THREE.Points(tailGeo, tailMat);
    comet.add(tail);

    // ── Sublimation jets (orange streaks) ─────────────────────────────────────
    const jetCount = 60;
    const jetPos = new Float32Array(jetCount * 3);
    const jetCol = new Float32Array(jetCount * 3);
    for (let i = 0; i < jetCount; i++) {
      const idx = i * 3;
      const spread = (Math.random() - 0.5) * 3;
      jetPos[idx] = spread;
      jetPos[idx + 1] = spread * 0.5;
      jetPos[idx + 2] = -Math.random() * 10;
      const t = Math.random();
      jetCol[idx] = 1.0; jetCol[idx + 1] = 0.5 + t * 0.3; jetCol[idx + 2] = 0.05;
    }
    const jetGeo = new THREE.BufferGeometry();
    jetGeo.setAttribute('position', new THREE.BufferAttribute(jetPos, 3));
    jetGeo.setAttribute('color', new THREE.BufferAttribute(jetCol, 3));
    const jetMat = new THREE.PointsMaterial({ vertexColors: true, size: 0.6, map: circleTex, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
    comet.add(new THREE.Points(jetGeo, jetMat));

    sceneRef.current = { comet, scene, camera, renderer, tailGeo, particleCount };

    if (onReady) onReady(sceneRef.current);

    // ── Tail particle drift update ─────────────────────────────────────────────
    const updateTail = () => {
      const pos = tailGeo.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        pos[idx + 2] -= 1.2; // drift backward
        if (pos[idx + 2] < -100) {
          pos[idx]     = (Math.random() - 0.5) * 3;
          pos[idx + 1] = (Math.random() - 0.5) * 3;
          pos[idx + 2] = 0; // reset to front
        }
      }
      tailGeo.attributes.position.needsUpdate = true;
    };

    // ── Animate ───────────────────────────────────────────────────────────────
    let animId;
    let t = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      t += 0.016;

      // Sync comet position with game engine (2D → 3D coords)
      const eng = engineRef?.current;
      if (eng && eng.canvas) {
        const W = eng.canvas.width || 1;
        const H = eng.canvas.height || 1;
        const nx = ((eng.atlas.x / W) - 0.5) * 2;
        const ny = -((eng.atlas.y / H) - 0.5) * 2;
        const aspect = W / H;
        // Map to Three.js world space (camera at z=80, fov=60)
        const halfH = Math.tan((60 * Math.PI / 180) / 2) * 80;
        const halfW = halfH * aspect;
        comet.position.x += (nx * halfW - comet.position.x) * 0.15;
        comet.position.y += (ny * halfH - comet.position.y) * 0.15;

        // Rotate comet to face direction of travel
        const vx = eng.atlas.vx || 0;
        const vy = eng.atlas.vy || 0;
        if (Math.abs(vx) + Math.abs(vy) > 0.05) {
          comet.rotation.z = Math.atan2(vy, vx) + Math.PI;
        }
      }

      // Nucleus slow tumble
      nucleus.rotation.y += 0.004;
      nucleus.rotation.x += 0.002;

      // Halo pulse
      halo.material.opacity = 0.5 + 0.15 * Math.sin(t * 2.1);

      updateTail();
      renderer.render(scene, camera);
    };
    animate();

    // ── Resize ────────────────────────────────────────────────────────────────
    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 5 }}
    />
  );
}