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
    light = new THREE.AmbientLight(light_color, intensity); // Chosen ambient lighting
    scene.add(light);
    renderer = new THREE.WebGLRenderer({ antialias: true }); // Creating a webgl renderer
    renderer.setSize( width, height ); // Setting the size of screen
    const gltfLoader = new THREE.GLTFLoader(); // using gltfloader to import blender objects
    const path = "./plane.glb";
    gltfLoader.load(path, gltf => {
        jet = gltf.scene;
        jet.rotation.x = 90; 
        jet.scale.set(0.03, 0.03, 0.03);
        jet.position.set(0, 0, 0);
        scene.add(jet);
    });
    document.body.appendChild( renderer.domElement );
    document.addEventListener("keydown", onPress, false); // Adding event listener to detect key press
}
let scene, camera, light, renderer, jet, missile;
let missiles = [];
const movement = 0.06;
const missile_movement = 0.02;
initialize(); // initialising scene and objects

camera.position.z = 5;

function animate() {
    requestAnimationFrame( animate );
    renderer.render(scene, camera);
    let length = missiles.length;
    console.log(length);
    for(let i=0; i<length; i++) {
        missiles[i].position.y -= missile_movement;
        if(missiles[i].position.y <= -2) {
            scene.remove(missiles[i]);
            missiles.splice(i, i)
        }
    }
}

function onPress(event) {
    let key = event.key;
    switch(key) {
        case 'W': case 'w': jet.position.y -= movement; break;
        case 'S': case 's': jet.position.y += movement; break;
        case 'A': case 'a': jet.position.x += movement; break;
        case 'D': case 'd': jet.position.x -= movement; break;
        case " ":
            const geometry = new THREE.BoxGeometry();
            const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            missile = new THREE.Mesh(geometry, material);
            missile.scale.set(0.1, 0.1, 0.1);
            scene.add(missile); 
            missiles.push(missile);
            missiles[missiles.length-1].position.set(
                jet.position.x, jet.position.y-0.3, jet.position.z);
            break;
    }
}

animate();