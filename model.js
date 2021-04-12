function initialize()
{
    // Setting screen dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;
    // Creating scene, camera, light in the scene
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(-45, width/height, 0.1, 100); // Using perspective camera
    const light_color = 0xffffff; // Light color is white
    const intensity = 1;
    light = new THREE.AmbientLight(light_color, intensity);
    scene.add(light);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0x000000, 1 )
    renderer.setSize( width, height );
    document.body.appendChild( renderer.domElement );
}
let scene, camera, light, renderer;
initialize();

camera.position.z = 5;


const gltfLoader = new THREE.GLTFLoader();
const path = "./plane.glb";
gltfLoader.load(path, gltf => {
    const root = gltf.scene;
    root.rotation.x = 90; 
    root.scale.set(0.05, 0.05, 0.05);
    root.position.set(0, 0, 0);
    scene.add(root);
});

function animate() {
    requestAnimationFrame( animate );
    renderer.render(scene, camera);


}

animate();