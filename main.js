const models_dir = "./models/";
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
    document.addEventListener("keydown", onKeyPress, false); // Adding event listener to detect key press for movement
    document.addEventListener("mousedown", mousePress, false);
}

function initializeObjects() {
    const gltfLoader = new THREE.GLTFLoader(); // using gltfloader to import blender objects
    const jet_path = models_dir + "plane.glb";
    gltfLoader.load(jet_path, gltf => {
        jet = gltf.scene;
        jet.rotation.x = 90;
        jet.rotation.y = Math.PI; 
        let scale = 0.025;
        jet.scale.set(scale, scale, scale);
        jet.position.set(0, -1, 0);
        scene.add(jet);
    });
    const missile_path = models_dir + "missile.glb";
    gltfLoader.load(missile_path, gltf => {
        missile = gltf.scene;
        let scale = 0.1;
        missile.scale.set(scale, scale, scale);
        missile.scale.z = 0.05;
        missile.rotation.y = Math.PI;
        missile.rotation.x = Math.PI/2;
    });
    const enemy_path = models_dir + "ufo.glb";
    gltfLoader.load(enemy_path, gltf => {
        enemy = gltf.scene;
        let scale = 0.1;
        enemy.scale.set(scale, scale, scale);
    });
    const star_path = models_dir + "star.glb";
    gltfLoader.load(star_path, gltf => {
        star = gltf.scene;
        let scale = 0.07;
        star.scale.set(scale, scale, scale);
        star.rotation.y = Math.PI/2;
    });
}

function setBackground() {
    const textureLoader = new THREE.TextureLoader();
    const background_path = models_dir + "background.jpg"
    textureLoader.load(background_path, texture => {
        scene.background = texture;
    })
}

let scene, camera, light, renderer, jet, missile, enemy, star;
let missiles = [];
let enemies = [];
let stars = []
const movement = 0.06; // speed of fighter jet
const enemy_movement = 0.003; // speed of ufo downward
const missile_movement = 0.05; // speed of missile upward
const star_rotation = 0.05;
const star_movement = 0.005;
const enemy_interval = 1;
const max_enemies = 2;
const star_probability = 0.6;
let health = 100;
let score = 0;
const enemy_destroy_score = 1000;
const star_collect_score = 500;
initialize(); // initialising scene, camera and lighting
initializeObjects(); // initializing game objects
setBackground();
const y_max = 1.75; // max y
const x_max = camera.aspect * y_max; // max x

camera.position.z = 5;

function animate() {
    requestAnimationFrame( animate );
    renderer.render(scene, camera);
    handle_missiles();
    handle_enemies();
    handle_stars();
    detect_collisions_missiles_enemies();
    detect_collisions_player_star();
}

function destroy_enemy(i, j) {
    let random_number = Math.random();
    if (random_number <= star_probability) {
        stars.push(star.clone());
        scene.add(stars[stars.length-1]);
        stars[stars.length-1].position.set(
            enemies[i].position.x,
            enemies[i].position.y,
            enemies[i].position.z
        );
    }
    scene.remove(enemies[i]);
    enemies.splice(i, 1);
    scene.remove(missiles[j]);
    missiles.splice(j, 1);
}

function detect_collisions_missiles_enemies() {
    for(let i=0; i<enemies.length; i++) {
        for(let j=0; j<missiles.length; j++) {
            const dist = enemies[i].position.distanceTo(missiles[j].position);
            if (dist <= 0.4) {
                destroy_enemy(i, j);
                score += enemy_destroy_score;
                i--; j--;
            }
        }
    }
}

function collect_star(index) {
    score += star_collect_score;
    scene.remove(stars[index]);
    stars.splice(index, 1);
}

function detect_collisions_player_star() {
    for(let i=0; i<stars.length; i++) {
        const dist = jet.position.distanceTo(stars[i].position);
        if (dist <= 0.3) {
            collect_star(i);
            i--;
        }
    }
}

function handle_missiles() {
    for(let i=0; i<missiles.length; i++) {
        missiles[i].position.y += missile_movement;
        if(missiles[i].position.y >= 2) {
            scene.remove(missiles[i]);
            missiles.splice(i, 1);
            i--;
        }
    }
}

function handle_stars() {
    for (let i=0; i<stars.length; i++) {
        stars[i].rotation.y += star_rotation;
        stars[i].position.y -= star_movement;
        if (stars[i].position.y <= -y_max) {
            scene.remove(stars[i]);
            stars.splice(i, 1);
            i--;
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
    }
    for(let i=0; i<enemies.length; i++) {
        enemies[i].position.y -= enemy_movement;
        if (enemies[i].position.y <= -y_max) {
            scene.remove(enemies[i]);
            enemies.splice(i, 1);
            i--;
        }
    }
}

function onKeyPress(event) {
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
        let new_missile = missile.clone();
        new_missile.position.set(
            jet.position.x, jet.position.y+0.3, jet.position.z
        );
        missiles.push(new_missile);
        scene.add(missiles[missiles.length-1]);
    }
} 

animate();