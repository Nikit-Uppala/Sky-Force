const models_dir = "./models/"; // models folder
// Checking if high score field exists in the localstorage
if (localStorage.getItem("HighScore") == undefined) {
    localStorage.setItem("HighScore", 0);
}
class FireBall {
    static speed = 0.03;
    constructor(x1, y1, x2, y2) {
        this.object = enemy_fire.clone();
        this.object.position.set(x1, y1-0.03, 0);
        this.velocity = new THREE.Vector3(x2-x1, y2-y1, 0); // Getting direction of velocity vector
        this.velocity.normalize(); // Converting it to unit vector
    }
    updatePosition() {
        this.object.position.x += this.velocity.x * FireBall.speed; // update x position of fireball
        this.object.position.y += this.velocity.y * FireBall.speed; // update y position of fireball
    }
}
class Enemy {
    static speed = 0.003;
    constructor() {
        let x = -x_max + 2*x_max * Math.random();
        let offset = -0.5 + Math.random();
        this.prev_time = new Date();
        this.object = enemy.clone();
        this.object.position.set(x, (y_max-0.4) + offset);
    }
    updatePosition() {
        this.object.position.y -= Enemy.speed;
    }
    shootFireBall(x, y) {
        let new_fireball = new FireBall(
            this.object.position.x,
            this.object.position.y,
            x, y); // Create a new fireball 
        this.prev_time = new Date(); // updating the prev_time of enemy shot
        return new_fireball;
    }
}
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
    light = new THREE.DirectionalLight(light_color, intensity); // Chosen directional lighting
    light.position.set(0, 0, 2);
    light.target.position.set(0, 0, 0)
    scene.add(light); // adding light to our scene
    renderer = new THREE.WebGLRenderer({ antialias: true }); // Creating a webgl renderer
    renderer.setSize( width, height ); // Setting the size of screen
    document.body.appendChild( renderer.domElement );
    document.addEventListener("keydown", onKeyPress, false); // Adding event listener to detect key press for movement
    document.addEventListener("mousedown", mousePress, false); // Adding event listener to detect mouse click
    score_element = document.getElementById("score"); // This element has score in HUD
    health_element = document.getElementById("health"); // Element to display health of the player
    game_over_element = document.getElementById("game-over"); // Used to display when game is over
    updateScore();
    updateHealth();
}

function initializeObjects() {
    const gltfLoader = new THREE.GLTFLoader(); // using gltfloader to import blender objects
    const jet_path = models_dir + "plane.glb"; // plane object
    gltfLoader.load(jet_path, gltf => {
        jet = gltf.scene;
        jet.rotation.x = 90;
        jet.rotation.y = Math.PI; 
        let scale = 0.025;
        jet.scale.set(scale, scale, scale);
        jet.position.set(0, -1, 0);
        scene.add(jet);
    });
    const missile_path = models_dir + "missile.glb"; // missile object which player shoots
    gltfLoader.load(missile_path, gltf => {
        missile = gltf.scene;
        let scale = 0.1;
        missile.scale.set(scale, scale, scale);
        missile.scale.z = 0.05;
        missile.rotation.y = Math.PI;
        missile.rotation.x = Math.PI/2;
    });
    const fire_path = models_dir + "enemy_fire.glb"; // fireball object
    gltfLoader.load(fire_path, gltf => {
        enemy_fire = gltf.scene;
        let scale = 0.06;
        enemy_fire.scale.set(scale, scale, scale);
    });
    const enemy_path = models_dir + "ufo.glb"; // enemy object
    gltfLoader.load(enemy_path, gltf => {
        enemy = gltf.scene;
        let scale = 0.1;
        enemy.scale.set(scale, scale, scale);
    });
    const star_path = models_dir + "star.glb"; // star object
    gltfLoader.load(star_path, gltf => {
        star = gltf.scene;
        let scale = 0.07;
        star.scale.set(scale, scale, scale);
        star.rotation.y = Math.PI/2;
    });
}

function setBackground() {
    const textureLoader = new THREE.TextureLoader(); // creating a texture loader
    const background_path = models_dir + "background.jpg"
    textureLoader.load(background_path, texture => {
        scene.background = texture; // setting background for the scene
    });
}

let scene, camera, light, renderer, jet, missile, enemy, star, enemy_fire;
let score_element, health_element, game_over_element;
let missiles = [];
let enemies = [];
let stars = [];
let fireballs = [];
const movement = 0.06; // speed of fighter jet
const missile_movement = 0.05; // speed of missile upward
const star_rotation = 0.05; // speed of rotation of stars
const star_movement = 0.005; // speed of starts downards
const max_enemies = 2; // max number of enemies at a time
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
const shoot_interval = 3; // time interval between 2 consecutive fireballs from an enemy
const damage = 20; // damage done by the fireball by the UFO's fireball
let game_over = false;

camera.position.z = 5;

function animate() {
    requestAnimationFrame( animate );
    renderer.render(scene, camera);
    if(!game_over) {
        handle_missiles();
        handle_enemies();
        handle_stars();
        detect_collisions_missiles_enemies();
        detect_collisions_player_star();
        detect_collisions_player_fireballs();
        handle_fireballs();
    }
}

function destroy_enemy(i, j) {
    let random_number = Math.random(); // generating a number to decide whether a star comes or not
    if (random_number <= star_probability) {
        stars.push(star.clone());
        scene.add(stars[stars.length-1]);
        stars[stars.length-1].position.set(
            enemies[i].object.position.x,
            enemies[i].object.position.y,
            enemies[i].object.position.z
        ); // spawning stars at the location of the enemy
    }
    score += enemy_destroy_score;
    updateScore();
    removeEnemy(i); // removing enemy from the scene
    removeMissile(j); // removing the missile from the scene
}

function updateScore() {
    score_element.innerHTML = "Score: " + score;
}

function updateHealth() {
    health_element.innerHTML = "Health: " + health;
}

function detect_collisions_missiles_enemies() {
    for(let i=0; i<enemies.length; i++) {
        for(let j=0; j<missiles.length; j++) {
            const dist = enemies[i].object.position.distanceTo(missiles[j].position);
            if (dist <= 0.2) {
                destroy_enemy(i, j);
                i--; j--;
            }
        }
    }
}

function updateHighScore() {
    let high_score = localStorage.getItem("HighScore");
    if(score > high_score) {
        high_score = score;
        localStorage.setItem("HighScore", score);
    }
    game_over_element.innerHTML = "<p>Game Over</p><p>High Score: " + high_score + "</p>";
}

function gameOver() {
    scene.remove(jet);
    while(enemies.length != 0) {
        scene.remove(enemies[enemies.length-1].object);
        enemies.pop();
    }
    while(missiles.length != 0) {
        scene.remove(missiles[missiles.length-1]);
        missiles.pop();
    }
    while(fireballs.length != 0) {
        scene.remove(fireballs[fireballs.length-1].object);
        fireballs.pop();
    }
    while(stars.length != 0) {
        scene.remove(stars[stars.length-1]);
        stars.pop();
    }
    updateHighScore();
}

function reduce_health(index) {
    health -= damage;
    console.log(health);
    updateHealth();
    if (health <= 0) {
        game_over = true;
        gameOver();
    }
    scene.remove(fireballs[index].object);
    fireballs.splice(index, 1);
}

function detect_collisions_player_fireballs() {
    for(let i=0; i<fireballs.length; i++) {
        const dist = fireballs[i].object.position.distanceTo(jet.position);
        if(dist <= 0.2) {
            reduce_health(i);
            i--;
        }
    }
}

function collect_star(index) {
    score += star_collect_score;
    updateScore();
    removeStar(index);
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

function removeMissile(index) {
    scene.remove(missiles[index]);
    missiles.splice(index, 1);
}

function handle_missiles() {
    for(let i=0; i<missiles.length; i++) {
        missiles[i].position.y += missile_movement;
        if(missiles[i].position.y >= y_max) {
            removeMissile(i); // if missile is not visible in the camera then remove
            i--;
        }
    }
}

function removeStar(index) {
    scene.remove(stars[index]);
    stars.splice(index, 1);
}

function handle_stars() {
    for (let i=0; i<stars.length; i++) {
        stars[i].rotation.y += star_rotation;
        stars[i].position.y -= star_movement;
        if (stars[i].position.y <= -y_max) {
            removeStar(i); // if star not visible in the camera then remove
            i--;
        }
    }
}

function removeFireBall(index) {
    scene.remove(fireballs[index].object);
    fireballs.splice(index, 1);
}

function handle_fireballs() {
    for (let i=0; i<fireballs.length; i++) {
        fireballs[i].updatePosition();
        if(Math.abs(fireballs[i].object.position.x) > x_max || Math.abs(fireballs[i].object.position.y) > y_max) {
            removeFireBall(i); // if fireball not visible in the camera then remove
            i--;
        }
    }
}

function removeEnemy(index) {
    scene.remove(enemies[index].object);
    enemies.splice(index, 1);
}

function handle_enemies() {
    let length = enemies.length;
    if (length < max_enemies) {
        if (enemy == undefined) return;
        let new_enemy = new Enemy();
        enemies.push(new_enemy); // adding enemies if number < 2
        scene.add(enemies[enemies.length-1].object);
    }
    const present = new Date();
    for(let i=0; i<enemies.length; i++) {
        enemies[i].updatePosition();
        if (enemies[i].object.position.y <= -y_max) {
            removeEnemy(i); // if enemies not visible from the camera then remove
            i--;
        }
        else {
            if ((present-enemies[i].prev_time)/1000 > shoot_interval) {
                let new_fireball = enemies[i].shootFireBall(jet.position.x, jet.position.y);
                fireballs.push(new_fireball);
                scene.add(fireballs[fireballs.length-1].object);
            }
        }
    }
}


// This function handles user input
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

// this function handles mouse click
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