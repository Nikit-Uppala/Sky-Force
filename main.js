const models_dir = "./";
function initialize()
{
    // Setting screen dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;
    // Creating scene, camera, light in the scene
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, width/height, 0.1, 100); // Using perspective camera
    const light_color = 0xffffff; // Light color is white
    const intensity = 1;
    light = new THREE.DirectionalLight(light_color, intensity); // Chosen ambient lighting
    light.position.set(0, 0, 2);
    light.target.position.set(0, 0, 0)
    scene.add(light);
    renderer = new THREE.WebGLRenderer({ antialias: true }); // Creating a webgl renderer
    renderer.setSize( width, height ); // Setting the size of screen
    document.body.appendChild( renderer.domElement );
    document.addEventListener("keydown", onPress, false); // Adding event listener to detect key press for movement
    document.addEventListener("mousedown", mousePress, false);
}

function initializeObjects() {
    const gltfLoader = new THREE.GLTFLoader(); // using gltfloader to import blender objects
    const jet_path = models_dir + "plane.glb";
    gltfLoader.load(jet_path, gltf => {
        jet = gltf.scene;
        jet.rotation.x = 90;
        jet.rotation.y = Math.PI; 
        jet.scale.set(0.03, 0.03, 0.03);
        jet.position.set(0, -1, 0);
        scene.add(jet);
    });
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    missile = new THREE.Mesh(geometry, material);
    missile.scale.set(0.1, 0.1, 0.1);
    const enemy_path = models_dir + "ufo.glb";
    gltfLoader.load(enemy_path, gltf => {
        enemy = gltf.scene;
        enemy.rotation.x = 90;
        enemy.scale.set(0.1, 0.1, 0.1)
    });
}

let scene, camera, light, renderer, jet, missile, enemy;
let missiles = [];
let enemies = [];
const movement = 0.06; // speed of fighter jet
const enemy_movement = 0.005; // speed of ufo downward
const missile_movement = 0.05; // speed of missile upward
const enemy_interval = 1;
const max_enemies = 3;
initialize(); // initialising scene and objects
initializeObjects();
const y_max = 1.75; // max y
const x_max = camera.aspect * y_max; // max x

camera.position.z = 5;

function animate() {
    requestAnimationFrame( animate );
    renderer.render(scene, camera);
    handle_missiles();
    handle_enemies();
}

function handle_missiles() {
    let length = missiles.length;
    for(let i=0; i<length; i++) {
        missiles[i].position.y += missile_movement;
        if(missiles[i].position.y >= 2) {
            scene.remove(missiles[i]);
            missiles.splice(i, i)
        }
    }
}

function handle_enemies() {
    let length = enemies.length;
    if (length < max_enemies) {
        if (enemy == undefined) return;
        let new_enemy = enemy.clone();
        new_enemy.position.x = -x_max + 2*x_max * Math.random();
        let off_set = -0.5 + Math.random();
        new_enemy.position.y = (y_max-0.4) + off_set;
        new_enemy.position.z = 0;
        enemies.push(new_enemy);
        scene.add(enemies[enemies.length-1]);
        length += 1;
    }
    for(let i=0; i<length; i++) {
        enemies[i].position.y -= enemy_movement;
        if (enemies[i].position.y <= -y_max) {
            scene.remove(enemies[i]);
            enemies.splice(i, i);
        }
    }
}

function onPress(event) {
    let key = event.key;
    switch(key) {
        case 'W': case 'w':
            if (jet.position.y + movement <= -0.1)
                jet.position.y += movement;
            break;
        case 'S': case 's':
            if (jet.position.y - movement >= -y_max) 
                jet.position.y -= movement; 
                break;
        case 'A': case 'a':
            if (jet.position.x - movement >= -x_max)
                jet.position.x -= movement;
            break;
        case 'D': case 'd':
            if (jet.position.x + movement <= x_max)
                jet.position.x += movement;
            break;
    }
}

function mousePress(event) {
    if (event.button == 0) {
        missiles.push(missile.clone());
        missiles[missiles.length-1].position.set(
            jet.position.x, jet.position.y+0.3, jet.position.z
        );
        scene.add(missiles[missiles.length-1]);
    }
} 

animate();