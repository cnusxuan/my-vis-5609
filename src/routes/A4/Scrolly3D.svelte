<script lang="ts">
    import { Scroll } from "$lib";
    import * as THREE from "three";
    import { onMount } from "svelte";
    import { onWindowResize, loadModels } from "$lib/Helper-3D";

    let progress: number = $state(0);
    let threeJSContainer: HTMLElement;
    let camera: THREE.PerspectiveCamera; // The camera used to view the scene, typically a perspective camera for 3D rendering
    let scene: THREE.Scene; // The scene where all the objects are added
    let renderer: THREE.WebGLRenderer; // The renderer used to render the scene
    const bars: THREE.Mesh[] = [];
    const FLOOR = -250; // The floor level of the scene

    const morphs: Array<THREE.Mesh> = []; // Array to store the morphs (animated models: horse, flamingo, parrot)
    let mixer: THREE.AnimationMixer; // The mixer used to animate the morphs

    const clock = new THREE.Clock(); // Clock to keep track of time for animations

    onMount(
        // // once the component mounts, initialize the Three.js scene
        () => {
            init(window.innerWidth * 0.6, window.innerHeight * 0.9);
        },
    );

    let hasAnimation = false;

    $effect(() => {
        if (!camera || !renderer || !scene || bars.length < 3) return;
        // update the camera position based on the progress
        if (progress < 50) {
            camera.position.set(0, FLOOR + 200, 300 + progress * 20);
            if (hasAnimation) {
                renderer.setAnimationLoop(() => {
                    renderer.render(scene, camera);
                });
                hasAnimation = false;
            }
        } else if (!hasAnimation) {
            renderer.setAnimationLoop(animate);
            hasAnimation = true;
        }
        function segment(p, start, end) {
            if (p <= start) return 0;
            if (p >= end) return 1;
            return (p - start) / (end - start);
        }

        const p1 = segment(progress, 10, 30);
        bars[0].scale.y = 0.001 + p1 * 5;
        bars[0].position.y = FLOOR + (bars[0].scale.y * 10) / 2;

        const p2 = segment(progress, 30, 50);
        bars[1].scale.y = 0.001 + p2 * 8;
        bars[1].position.y = FLOOR + (bars[1].scale.y * 10) / 2;

        const p3 = segment(progress, 50, 70);
        bars[2].scale.y = 0.001 + p3 * 6;
        bars[2].position.y = FLOOR + (bars[2].scale.y * 10) / 2;
    });

    function init(SCREEN_WIDTH: number, SCREEN_HEIGHT: number) {
        // Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        threeJSContainer.appendChild(renderer.domElement);

        // Camera
        camera = new THREE.PerspectiveCamera(
            23,
            SCREEN_WIDTH / SCREEN_HEIGHT,
            10,
            3000,
        );
        camera.position.set(0, 50, 900);

        // Scene
        scene = new THREE.Scene();
        // scene.background = new THREE.Color(0x87ceeb); // Sky color (light blue)
        new THREE.TextureLoader().load("3d/sky.jpg", (texture) => {
            texture.repeat.set(0.8, 1); // repeat the texture
            scene.background = texture;
        });

        // Ambient Light
        const ambient = new THREE.AmbientLight(0xffffff);
        scene.add(ambient);

        // Directional Light
        const light = new THREE.DirectionalLight(0xffffff, 3);
        light.position.set(0, 1500, 1000);
        light.castShadow = true;
        Object.assign(light.shadow.camera, {
            top: 2000,
            bottom: -2000,
            left: -2000,
            right: 2000,
            near: 1200,
            far: 2500,
        });
        light.shadow.bias = 0.0001;
        light.shadow.mapSize.width = 2048;
        light.shadow.mapSize.height = 1024;
        scene.add(light);

        // Add ground
        // addGround(scene, FLOOR, "3d/grasslight-big.jpg");

        // Load Models
        const models = [
            {
                path: "3d/Flamingo.glb",
                speed: 350,
                duration: 1,
                x: 0,
                y: FLOOR + 250,
                z: 100,
                scale: 0.5,
            },
            {
                path: "3d/Flamingo.glb",
                speed: 350,
                duration: 1,
                x: -30,
                y: FLOOR + 200,
                z: 110,
                scale: 0.5,
            },
        ];

        mixer = loadModels(models, scene, mixer, morphs);

        // Handle resize
        window.addEventListener("resize", () =>
            onWindowResize(
                camera,
                renderer,
                window.innerWidth / 4,
                window.innerHeight / 2,
            ),
        );

        renderer.setAnimationLoop(() => {
            renderer.render(scene, camera);
        });
        

        function createBar(x, height, color) {
            const geometry = new THREE.BoxGeometry(20, height, 20);
            const material = new THREE.MeshStandardMaterial({ color });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(x, FLOOR + height / 2, 0);
            scene.add(mesh);
            bars.push(mesh);
        }
        createBar(-60, 10, 0xff0000);
        createBar(0, 10, 0x00ff00);
        createBar(60, 10, 0x0000ff);
    }

    function animate() {
        // this function will be called every frame
        const delta = clock.getDelta();
        mixer.update(delta);

        renderer.render(scene, camera);
        // controls.update(delta);
    }

    function segmentProgress(p: number, start: number, end: number) {
        if (p <= start) return 0;
        if (p >= end) return 1;
        return (p - start) / (end - start);
    }

    function lerp(start: number, end: number, t: number) {
    return start + (end - start) * t;
    }
    
</script>

<h2>The Scrolly element can also be used to control 3D Visualizations</h2>

<Scroll bind:progress>

    <section class="step">
      <h2>Introducing the Data</h2>
      <p>The first bar shows a simple visual of data rep, showing the data visualization in 3D.</p>
    </section>
  
    <section class="step">
      <h2>More Categories</h2>
      <p>More other genres pop up which allows numerical and trend comparison.</p>
    </section>
  
    <section class="step">
      <h2>Animated Elements</h2>
      <p>Animated birds enhance the Scrolly and interative experience.</p>
    </section>
  
    <section class="step">
      <h2>Final View</h2>
      <p>All elements combine into a full 3D narrative scenec after the progress hits 50.</p>
    </section>
  
    <div slot="viz" bind:this={threeJSContainer}></div>
  
  </Scroll>

<style>
    div.threejsSection {
        text-align: center;
        color: #666;
        height: 200vh; /* Make the div scrollable with a 200% view height */
        border: 2px solid #aaa;
        padding: 10px;
        margin: 10px;
    }
</style>
