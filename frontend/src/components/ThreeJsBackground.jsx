import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ThreeJsBackground = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Simple Book Page Geometry (Plane)
    const geometry = new THREE.PlaneGeometry(3, 4, 32, 32);

    // Material with custom shader for the 'bend' effect during turn
    const material = new THREE.MeshPhongMaterial({
        color: 0xfbf9f4, // Matching design system surface
        side: THREE.DoubleSide,
        shininess: 10
    });

    const page = new THREE.Mesh(geometry, material);
    scene.add(page);

    // Animation logic
    let time = 0;
    let animationFrameId;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      time += 0.02; // Auto-turn animation for the splash screen
      page.rotation.y = Math.sin(time) * (Math.PI / 2);
      
      const scale = 1 + Math.abs(Math.sin(time)) * 0.1;
      page.scale.set(scale, scale, 1);
      
      renderer.render(scene, camera);
    };

    const handleResize = () => {
        if (!container) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full z-0 opacity-50" />;
};

export default ThreeJsBackground;
