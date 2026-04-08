// True 3D WebGL Scroll Assembly using Three.js
function setupThreeJsAssembly() {
    const container = document.getElementById("scroll-assembly-container");
    const canvas = document.getElementById("three-canvas");
    if (!container || !canvas) return;

    // Load Three JS dynamically
    if (typeof THREE === 'undefined') {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
        script.onload = initScene;
        document.head.appendChild(script);
    } else {
        initScene();
    }

    function initScene() {
        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Lighting (Cinematic)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(5, 5, 5);
        scene.add(dirLight);

        const redLight = new THREE.PointLight(0xb70100, 3, 20);
        redLight.position.set(-2, 0, 2);
        scene.add(redLight);
        
        const blueLight = new THREE.PointLight(0x0040a0, 3, 20);
        blueLight.position.set(2, -2, 2);
        scene.add(blueLight);

        // Phone Group
        const phoneGroup = new THREE.Group();
        scene.add(phoneGroup);

        // Generate a rounded shape for the phone
        const length = 3.2;
        const width = 1.5;
        const radius = 0.3;
        
        const shape = new THREE.Shape();
        shape.moveTo(-width/2 + radius, -length/2);
        shape.lineTo(width/2 - radius, -length/2);
        shape.quadraticCurveTo(width/2, -length/2, width/2, -length/2 + radius);
        shape.lineTo(width/2, length/2 - radius);
        shape.quadraticCurveTo(width/2, length/2, width/2 - radius, length/2);
        shape.lineTo(-width/2 + radius, length/2);
        shape.quadraticCurveTo(-width/2, length/2, -width/2, length/2 - radius);
        shape.lineTo(-width/2, -length/2 + radius);
        shape.quadraticCurveTo(-width/2, -length/2, -width/2 + radius, -length/2);

        const extrudeSettings = { depth: 0.15, bevelEnabled: true, bevelSegments: 4, steps: 1, bevelSize: 0.03, bevelThickness: 0.03 };
        
        // 1. Titanium Body
        const bodyGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a, 
            roughness: 0.3, 
            metalness: 0.9 
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        
        bodyGeo.computeBoundingBox();
        const centerOffset = -0.5 * (bodyGeo.boundingBox.max.z - bodyGeo.boundingBox.min.z);
        body.position.z = centerOffset;
        phoneGroup.add(body);

        // 2. Logic Board & Internals (floating)
        const internalsGroup = new THREE.Group();
        internalsGroup.position.z = -1; // float behind initially
        phoneGroup.add(internalsGroup);

        const boardGeo = new THREE.PlaneGeometry(width * 0.85, length * 0.85);
        const boardMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.8, roughness: 0.5 });
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.z = 0.08;
        internalsGroup.add(board);

        // Glowing chip
        const chipGeo = new THREE.BoxGeometry(0.5, 0.5, 0.05);
        const chipMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1 });
        const chip = new THREE.Mesh(chipGeo, chipMat);
        chip.position.set(0, 0.5, 0.1);
        internalsGroup.add(chip);

        // 3. Screen (floating glass)
        const screenGeo = new THREE.PlaneGeometry(width * 0.9, length * 0.9);
        const screenMat = new THREE.MeshPhysicalMaterial({ 
            color: 0x000000, 
            metalness: 0.1, 
            roughness: 0.1, 
            transmission: 0.9, // glass
            transparent: true,
            opacity: 0.8
        });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.z = 1.0; // float in front initially
        phoneGroup.add(screen);

        const screenLight = new THREE.PointLight(0xffffff, 0, 5);
        screenLight.position.set(0, 0, 0.5);
        phoneGroup.add(screenLight);

        // Initial positions
        camera.position.set(0, 0, 8);

        // Handle Resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Scroll Animation Logic
        let currentProgress = 0;
        let targetProgress = 0;
        
        window.addEventListener("scroll", () => {
            const rect = container.getBoundingClientRect();
            const scrollable = rect.height - window.innerHeight;
            let p = -rect.top / scrollable;
            targetProgress = Math.max(0, Math.min(1, p));
        }, { passive: true });

        // Animation Loop
        function animate() {
            requestAnimationFrame(animate);

            currentProgress += (targetProgress - currentProgress) * 0.07;

            // 1. Assembling
            const assemblingP = Math.min(1, currentProgress / 0.4);
            internalsGroup.position.z = THREE.MathUtils.lerp(-1.5, 0.0, assemblingP);
            screen.position.z = THREE.MathUtils.lerp(1.5, 0.16, assemblingP);

            // 2. Rotation and zooming
            const rotP = Math.min(1, currentProgress / 0.8);
            phoneGroup.rotation.x = THREE.MathUtils.lerp(Math.PI / 4, 0, rotP);
            phoneGroup.rotation.y = THREE.MathUtils.lerp(-Math.PI / 4, 0, rotP);
            camera.position.z = THREE.MathUtils.lerp(8, 4.5, rotP);

            phoneGroup.rotation.z = Math.sin(Date.now() * 0.001) * 0.05;

            // 3. Screen Turn ON
            let powerP = 0;
            if(currentProgress > 0.8) {
                 powerP = (currentProgress - 0.8) / 0.2;
            }
            if (powerP > 0.5) {
                screenMat.color.setHex(0xffffff);
                screenMat.transmission = 0.0;
                screenLight.intensity = 1.0;
            } else {
                screenMat.color.setHex(0x000000);
                screenMat.transmission = 0.9;
                screenLight.intensity = 0.0;
            }

            // Sync HTML UI text
            const text1 = document.getElementById("text-step-1");
            const text2 = document.getElementById("text-step-2");
            const finalUi = document.getElementById("phone-final-ui");

            if (text1 && text2 && finalUi) {
                text1.style.opacity = Math.max(0, 1 - (currentProgress * 3));
                text2.style.opacity = (currentProgress > 0.3 && currentProgress < 0.7) ? 1 : 0;
                finalUi.style.opacity = (currentProgress > 0.9) ? 1 : 0;
            }

            renderer.render(scene, camera);
        }
        animate();
    }
}

// Call on ready
document.addEventListener('DOMContentLoaded', setupThreeJsAssembly);

window.tailwind = window.tailwind || {};
window.tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "inverse-primary": "#ffb4a8",
                        "on-secondary-fixed": "#1c1b1b",
                        "on-error": "#ffffff",
                        "secondary-fixed": "#e5e2e1",
                        "on-surface-variant": "#5f3f3a",
                        "on-primary-fixed-variant": "#930100",
                        "on-primary": "#ffffff",
                        "surface-container-high": "#ebe7e7",
                        "tertiary": "#0051c6",
                        "on-secondary": "#ffffff",
                        "inverse-surface": "#313030",
                        "primary-container": "#e60000",
                        "outline": "#946e68",
                        "on-tertiary-fixed": "#001847",
                        "on-tertiary-fixed-variant": "#0040a0",
                        "on-secondary-fixed-variant": "#474746",
                        "error-container": "#ffdad6",
                        "outline-variant": "#e9bcb5",
                        "on-tertiary": "#ffffff",
                        "surface-container": "#f0edec",
                        "tertiary-container": "#0068f9",
                        "secondary-fixed-dim": "#c8c6c5",
                        "on-background": "#1c1b1b",
                        "secondary": "#5f5e5e",
                        "secondary-container": "#e2dfde",
                        "on-tertiary-container": "#f8f7ff",
                        "background": "#fcf9f8",
                        "tertiary-fixed-dim": "#b2c5ff",
                        "surface-tint": "#c00000",
                        "surface-container-low": "#f6f3f2",
                        "inverse-on-surface": "#f3f0ef",
                        "on-primary-container": "#fff7f5",
                        "error": "#ba1a1a",
                        "on-error-container": "#93000a",
                        "tertiary-fixed": "#dae2ff",
                        "surface-variant": "#e5e2e1",
                        "surface-dim": "#dcd9d9",
                        "primary": "#b70100",
                        "surface-container-highest": "#e5e2e1",
                        "primary-fixed": "#ffdad4",
                        "primary-fixed-dim": "#ffb4a8",
                        "surface": "#fcf9f8",
                        "surface-bright": "#fcf9f8",
                        "on-surface": "#1c1b1b",
                        "on-secondary-container": "#636262",
                        "surface-container-lowest": "#ffffff",
                        "on-primary-fixed": "#410000"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.125rem",
                        "lg": "0.25rem",
                        "xl": "0.5rem",
                        "full": "0.75rem"
                    },
                    "fontFamily": {
                        "headline": ["Plus Jakarta Sans"],
                        "body": ["Manrope"],
                        "label": ["Manrope"]
                    }
                },
            },
        }

// Simple Router
function handleRouting() {
    const hash = window.location.hash || '#view-index';
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(sec => {
        if ('#' + sec.id === hash) {
            sec.classList.remove('hidden');
            sec.classList.add('block');
        } else {
            sec.classList.remove('block');
            sec.classList.add('hidden');
        }
    });
    window.scrollTo(0, 0);
}

window.addEventListener('hashchange', handleRouting);
window.addEventListener('DOMContentLoaded', handleRouting);
