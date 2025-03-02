import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const ThreeScene = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return; 
    // Remove any existing renderer
    while (mountRef.current.firstChild) {
        mountRef.current.removeChild(mountRef.current.firstChild);
    }
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0XCDCDCD);

    const parentGroup = new THREE.Group();
    parentGroup.position.set(0,0,0);

    scene.add(parentGroup);
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      5000
    );
    camera.position.set(500, 800, 1500);
    camera.lookAt(500, 0, 500);
    // camera.lookAt(parentGroup.position)

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;

    const ambientLight = new THREE.AmbientLight(0xffffff, 2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(500, 1000, 500);
    scene.add(directionalLight);

    const wallHeight = 300;
    const wallThickness = 20;
    const floorTextureURL = 'https://threejs.org/examples/textures/brick_diffuse.jpg';//stock texture from threejs

    const input = `
4
0 0 1000 0
1000 0 1000 1000
1000 1000 0 1000
0 1000 0 0`.trim().split('\n');
//test input
// const input = `
// 6
// 200 300 700 100
// 700 100 1100 400
// 1100 400 900 900
// 900 900 400 1100
// 400 1100 100 700
// 100 700 200 300
// `.trim().split('\n');
    const n = parseInt(input[0]);
    const walls = input.slice(1).map(line => line.split(' ').map(Number));

    if (walls.length !== n) {
        console.error("Wall count mismatch!");
    }

    function createWall(x1, y1, x2, y2) {
        if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
            console.error("Invalid wall coordinates:", x1, y1, x2, y2);
            return null;
        }
      const length = Math.hypot(x2 - x1, y2 - y1)+wallThickness;//fpr walls to merge perfectly
      const geometry = new THREE.BoxGeometry(length, wallHeight, wallThickness);
      //To have black color on top face of wall
      const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const topMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
      const materials = [wallMaterial, wallMaterial, topMaterial, wallMaterial, wallMaterial, wallMaterial];

      const wall = new THREE.Mesh(geometry, materials);
      const midX = (x1 + x2) / 2;
      const midZ = (y1 + y2) / 2;
      wall.position.set(midX, wallHeight / 2, midZ);
      wall.rotation.y = -Math.atan2(y2 - y1, x2 - x1);
      parentGroup.add(wall);
    }

    walls.forEach(([x1, y1, x2, y2]) => createWall(x1, y1, x2, y2));

    const shape = new THREE.Shape();
    walls.forEach(([x, y], i) => {
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });
    shape.lineTo(walls[0][0], walls[0][1]);

    const floorGeometry = new THREE.ShapeGeometry(shape);
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(floorTextureURL, (floorTexture) => {
      floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
      floorTexture.repeat.set(0.005, 0.005);
      const floorMaterial = new THREE.MeshStandardMaterial({ map: floorTexture, side: THREE.DoubleSide });
      const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.rotation.x = Math.PI / 2;
      floor.position.set(0, -1, 0);
      parentGroup.add(floor);
    });

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);


    return () => {
        if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
            mountRef.current.removeChild(renderer.domElement);
        }
        window.removeEventListener('resize', handleResize);
        renderer.dispose(); // Cleanup
    };
}, []);


  return <div ref={mountRef} style={{ width: '100vw', height: '100vh' }} />;
};

export default ThreeScene;
