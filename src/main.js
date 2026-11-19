
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// ==========================================
// BLOCK OPS — MILESTONE 03
// Movement + Traversal + Weapon + Combat
// ==========================================

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8ca2ad);
scene.fog = new THREE.Fog(0x8ca2ad, 34, 105);

const camera = new THREE.PerspectiveCamera(
  75, innerWidth / innerHeight, 0.1, 180
);
camera.position.set(0, 1.72, 11);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// LIGHTING
scene.add(new THREE.HemisphereLight(0xdcecff, 0x5b503b, 1.35));

const sun = new THREE.DirectionalLight(0xffe4b5, 2);
sun.position.set(-18, 28, 14);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -38;
sun.shadow.camera.right = 38;
sun.shadow.camera.top = 38;
sun.shadow.camera.bottom = -38;
scene.add(sun);

// CONTROLS
const controls = new PointerLockControls(camera, document.body);

const overlay = document.getElementById('overlay');
const startButton = document.getElementById('start');
const menuHeading = document.getElementById('menu-heading');
const menuDescription = document.getElementById('menu-description');

let hasStarted = false;
let pauseStartedAt = null;
const speedEl = document.getElementById('speed');
const actionLabel = document.getElementById('action-label');

// ==========================================
// ENVIRONMENT
// ==========================================

const mats = {
  grass: new THREE.MeshStandardMaterial({ color: 0x667b43, roughness: 1 }),
  dirt: new THREE.MeshStandardMaterial({ color: 0x65513a, roughness: 1 }),
  concrete: new THREE.MeshStandardMaterial({ color: 0x858b89, roughness: 0.95 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x414b4e, roughness: 0.9 }),
  crate: new THREE.MeshStandardMaterial({ color: 0x80603b, roughness: 1 }),
  sand: new THREE.MeshStandardMaterial({ color: 0xb4a078, roughness: 1 }),
  trunk: new THREE.MeshStandardMaterial({ color: 0x55402b, roughness: 1 }),
  leaves: new THREE.MeshStandardMaterial({ color: 0x405c37, roughness: 1 }),
  hill: new THREE.MeshStandardMaterial({ color: 0x78866b, roughness: 1 })
};

const colliders = [];
const obstacleMeshes = [];

function addBox(name, x, y, z, sx, sy, sz, material, collide = true) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(sx, sy, sz),
    material
  );

  mesh.position.set(x, y + sy / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.obstacleName = name;
  scene.add(mesh);

  if (collide) {
    const c = {
      minX: x - sx / 2,
      maxX: x + sx / 2,
      minY: y,
      maxY: y + sy,
      minZ: z - sz / 2,
      maxZ: z + sz / 2,
      mesh,
      name
    };

    colliders.push(c);
    obstacleMeshes.push(mesh);
  }

  return mesh;
}

// Ground
const ground = new THREE.Mesh(
  new THREE.BoxGeometry(90, 1, 90),
  mats.grass
);

ground.position.set(0, -0.5, 0);
ground.receiveShadow = true;
scene.add(ground);

// Ground details
for (let i = 0; i < 12; i++) {
  const x = -24 + i * 4.4;

  addBox(
    'ground detail',
    x, 0, -8 + (i % 3) * 2,
    4.2, 0.13, 4,
    mats.dirt,
    false
  );
}

// Boundary walls
addBox('boundary', 0, 0, -35, 70, 5, 1, mats.dark);
addBox('boundary', 0, 0, 35, 70, 5, 1, mats.dark);
addBox('boundary', -35, 0, 0, 1, 5, 70, mats.dark);
addBox('boundary', 35, 0, 0, 1, 5, 70, mats.dark);

// Outpost
addBox('bunker left', -7, 0, -5, 1, 2.8, 14, mats.concrete);
addBox('bunker back', -1, 0, -12, 13, 2.8, 1, mats.concrete);
addBox('bunker right', 5.5, 0, -5, 1, 2.8, 14, mats.concrete);
addBox('bunker roof', -1, 2.8, -5, 13, 0.45, 14, mats.dark, false);

addBox('tower base', 12, 0, -9, 3, 4.5, 3, mats.concrete);
addBox('tower top', 12, 4.5, -9, 4.2, 0.45, 4.2, mats.dark, false);
addBox('tower rail', 10.1, 4.9, -9, 0.25, 1, 4, mats.dark);
addBox('tower rail', 13.9, 4.9, -9, 0.25, 1, 4, mats.dark);

// Traversal obstacles
addBox('low crate', -2, 0, 5.5, 1.8, 0.78, 1.5, mats.crate);
addBox('low sandbag', 3.5, 0, 2, 2.4, 0.62, 1.15, mats.sand);
addBox('medium barrier', 8, 0, 4.5, 2.8, 1.35, 0.65, mats.sand);
addBox('medium crate stack', -10, 0, 2, 1.7, 1.45, 1.7, mats.crate);
addBox('high wall', 14, 0, 8, 3.2, 2.8, 0.7, mats.concrete);
addBox('crate', -13, 0, -8, 1.5, 1.2, 1.5, mats.crate);
addBox('crate', -11.5, 0, -8, 1.5, 1.2, 1.5, mats.crate);

// Sandbags
for (let i = 0; i < 5; i++) {
  addBox('sandbag', 1 + i * 1.05, 0, -1.2, 1, 0.55, 0.55, mats.sand);
}

// Trees
function tree(x, z, s = 1) {
  addBox('tree trunk', x, 0, z, 0.55 * s, 2.2 * s, 0.55 * s, mats.trunk);

    addBox(
    'tree crown',
    x,
    1.9 * s,
    z,
    2.5 * s,
    2.2 * s,
    2.5 * s,
    mats.leaves
  );
}

tree(-22, -18, 1.2);
tree(-18, 16, 1);
tree(23, -20, 1.2);
tree(24, 17, 1.1);
tree(-25, 3, 0.9);

// Distant hills

// Distant hills
for (let i = 0; i < 9; i++) {
  addBox(
    'distant hill',
    -29 + i * 7,
    0,
    -29 - (i % 2) * 2,
    7,
    2 + (i % 3),
    5,
    mats.hill,
    true
  );
}


// Ammo boxes
for (let i = 0; i < 4; i++) {
  addBox('ammo box', -4 + i * 1.2, 0, -2, 0.8, 0.55, 0.65, mats.crate, false);
}

// ==========================================
// TRAINING TARGETS
// ==========================================

const targets = [];

const targetMat = new THREE.MeshStandardMaterial({
  color: 0x8e4637,
  roughness: 0.8
});

const targetDark = new THREE.MeshStandardMaterial({
  color: 0x30383a,
  roughness: 0.9
});

function addTarget(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  scene.add(group);

  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.9, 0.34),
    targetMat
  );

  torso.position.y = 1.05;
  torso.castShadow = true;
  group.add(torso);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.34, 0.34),
    targetDark
  );

  head.position.y = 1.68;
  head.castShadow = true;
  group.add(head);

  const legs = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.62, 0.3),
    targetDark
  );

  legs.position.y = 0.31;
  legs.castShadow = true;
  group.add(legs);

  group.traverse(object => {
    if (object.isMesh) {
      object.userData.target = group;
    }
  });

  targets.push({
    group,
    health: 100,
    active: true,
    respawnAt: 0
  });

  return group;
}

addTarget(-16, -5);
addTarget(18, -1);
addTarget(20, 12);
addTarget(-18, 10);

// ==========================================
// ENEMY SOLDIERS — MILESTONE 4.1
// ==========================================

const enemies = [];

// ==========================================
// SURVIVAL WAVES — MILESTONE 4.5
// ==========================================

let currentWave = 1;
let waveState = 'active';

let enemiesToSpawn = 0;
let nextSpawnTime = 0;

let nextWaveTime = 0;

const WAVE_INTERMISSION = 8;
const ENEMY_SPAWN_INTERVAL = 1.2;

// Enemy spawn locations around the map.
const enemySpawnPoints = [
  { x: -25, z: -7 },
  { x: 26, z: -10 },
  { x: -25, z: 23 },
  { x: 25, z: 24 },
  { x: 0, z: -27 },
  { x: 0, z: 27 },
  { x: 27, z: 8 },
  { x: -27, z: -27 }
];

const enemyMaterials = {
  uniform: new THREE.MeshStandardMaterial({
    color: 0x3f5140,
    roughness: 1
  }),

  uniformDark: new THREE.MeshStandardMaterial({
    color: 0x29382e,
    roughness: 1
  }),

  helmet: new THREE.MeshStandardMaterial({
    color: 0x354637,
    roughness: 0.9
  }),

  skin: new THREE.MeshStandardMaterial({
    color: 0x98745b,
    roughness: 1
  }),

  boots: new THREE.MeshStandardMaterial({
    color: 0x252a25,
    roughness: 1
  }),

  rifle: new THREE.MeshStandardMaterial({
    color: 0x202725,
    metalness: 0.45,
    roughness: 0.65
  }),

  rifleAccent: new THREE.MeshStandardMaterial({
    color: 0x68736b,
    metalness: 0.35,
    roughness: 0.7
  })
};

function enemyPart(parent, size, position, material) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    material
  );

  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  parent.add(mesh);

  return mesh;
}

function createEnemy(x, z, id) {
  const root = new THREE.Group();

  root.position.set(x, 0, z);

  // Face the center of the map.
  root.rotation.y = Math.atan2(-x, -z);

  scene.add(root);

  // BODY
  const torso = enemyPart(
    root,
    [0.58, 0.78, 0.34],
    [0, 1.12, 0],
    enemyMaterials.uniform
  );

  // Chest armor
  enemyPart(
    root,
    [0.62, 0.32, 0.37],
    [0, 1.28, 0],
    enemyMaterials.uniformDark
  );

  // HEAD
  const head = enemyPart(
    root,
    [0.34, 0.38, 0.34],
    [0, 1.72, 0],
    enemyMaterials.skin
  );

  // HELMET
  enemyPart(
    root,
    [0.43, 0.19, 0.43],
    [0, 1.96, 0],
    enemyMaterials.helmet
  );

  // Helmet front visor
  enemyPart(
    root,
    [0.36, 0.055, 0.08],
    [0, 1.89, 0.19],
    enemyMaterials.uniformDark
  );

  // LEGS
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.16, 0.78, 0);
  root.add(leftLeg);

  enemyPart(
    leftLeg,
    [0.22, 0.65, 0.25],
    [0, -0.25, 0],
    enemyMaterials.uniformDark
  );

  enemyPart(
    leftLeg,
    [0.25, 0.16, 0.36],
    [0, -0.59, 0.04],
    enemyMaterials.boots
  );

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.16, 0.78, 0);
  root.add(rightLeg);

  enemyPart(
    rightLeg,
    [0.22, 0.65, 0.25],
    [0, -0.25, 0],
    enemyMaterials.uniformDark
  );

  enemyPart(
    rightLeg,
    [0.25, 0.16, 0.36],
    [0, -0.59, 0.04],
    enemyMaterials.boots
  );

  // ARMS
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.39, 1.42, 0);
  root.add(leftArm);

  enemyPart(
    leftArm,
    [0.22, 0.58, 0.24],
    [0, -0.24, 0],
    enemyMaterials.uniform
  );

  enemyPart(
    leftArm,
    [0.19, 0.18, 0.19],
    [0, -0.54, 0.02],
    enemyMaterials.skin
  );

  const rightArm = new THREE.Group();
  rightArm.position.set(0.39, 1.42, 0);
  root.add(rightArm);

  enemyPart(
    rightArm,
    [0.22, 0.58, 0.24],
    [0, -0.24, 0],
    enemyMaterials.uniform
  );

  enemyPart(
    rightArm,
    [0.19, 0.18, 0.19],
    [0, -0.54, 0.02],
    enemyMaterials.skin
  );

  // RIFLE
  const rifle = new THREE.Group();
  rifle.position.set(0.12, 1.13, 0.28);
  root.add(rifle);

  enemyPart(
    rifle,
    [0.12, 0.13, 0.78],
    [0, 0, 0],
    enemyMaterials.rifle
  );

  enemyPart(
    rifle,
    [0.065, 0.075, 0.48],
    [0, 0.02, 0.57],
    enemyMaterials.rifle
  );

  enemyPart(
    rifle,
    [0.13, 0.17, 0.18],
    [0, -0.13, -0.12],
    enemyMaterials.rifle
  );

  enemyPart(
    rifle,
    [0.07, 0.04, 0.16],
    [0, 0.09, -0.12],
    enemyMaterials.rifleAccent
  );

  // Mark every soldier mesh so the weapon raycast can identify it.
  root.traverse(object => {
    if (object.isMesh) {
      object.userData.enemyRoot = root;
    }
  });

  // Store animation data
  enemies.push({
    root,
    spawnX: x,
    spawnZ: z,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    baseY: 0,
    phase: id * 1.7,

  // Combat
    // Combat
    health: 100,
    active: true,
    respawnAt: 0,
    nextShotTime: performance.now() + 900 + id * 350,

  // Navigation
    nextPathTime: 0,
    path: [],
    pathIndex: 0,

  // Animation
    walking: false
  });

  return root;
}

// Four enemy soldiers around the outpost.
createEnemy(-25, -7, 0);
createEnemy(26, -10, 1);
createEnemy(-25, 23, 2);
createEnemy(25, 24, 3);
const INITIAL_ENEMY_COUNT = enemies.length;
// ==========================================
// SURVIVAL WAVE SYSTEM — MILESTONE 4.5
// ==========================================

function getActiveEnemyCount() {
  return enemies.filter(enemy => enemy.active).length;
}

function spawnWaveEnemy(now) {
  let selectedSpawn = null;
  let bestScore = -Infinity;

  // Find a safe spawn point far from the player
  // and preferably separated from other enemies.
  for (const point of enemySpawnPoints) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const x = point.x + (Math.random() - 0.5) * 1.2;
      const z = point.z + (Math.random() - 0.5) * 1.2;

      if (!enemyCanOccupy(x, z)) continue;

      let nearestEnemyDistance = Infinity;

      for (const enemy of enemies) {
        if (!enemy.active) continue;

        const distance = Math.hypot(
          enemy.root.position.x - x,
          enemy.root.position.z - z
        );

        nearestEnemyDistance = Math.min(
          nearestEnemyDistance,
          distance
        );
      }

      if (nearestEnemyDistance < 2.4) continue;

      const playerDistance = Math.hypot(
        camera.position.x - x,
        camera.position.z - z
      );

      const score =
        playerDistance + Math.min(nearestEnemyDistance, 12) * 0.2;

      if (score > bestScore) {
        bestScore = score;
        selectedSpawn = { x, z };
      }
    }
  }

  // Fallback: use the safest available point,
  // even if it is closer to another enemy.
  if (!selectedSpawn) {
    for (const point of enemySpawnPoints) {
      if (!enemyCanOccupy(point.x, point.z)) continue;

      const distance = Math.hypot(
        camera.position.x - point.x,
        camera.position.z - point.z
      );

      if (distance > bestScore) {
        bestScore = distance;
        selectedSpawn = { x: point.x, z: point.z };
      }
    }
  }

  if (!selectedSpawn) return false;

  // Reuse an inactive enemy when possible.
  let enemy = enemies.find(item => !item.active);

  if (!enemy) {
    createEnemy(
      selectedSpawn.x,
      selectedSpawn.z,
      enemies.length
    );

    enemy = enemies[enemies.length - 1];
  }

  enemy.active = true;
  enemy.health = 100;
  enemy.respawnAt = 0;

  enemy.root.visible = true;
  enemy.root.position.set(
    selectedSpawn.x,
    0,
    selectedSpawn.z
  );

  enemy.root.rotation.y = Math.atan2(
    -selectedSpawn.x,
    -selectedSpawn.z
  );

  enemy.nextPathTime = 0;
  enemy.nextShotTime = now + 900 + Math.random() * 500;

  enemy.path = [];
  enemy.pathIndex = 0;
  enemy.walking = false;

  enemy.leftArm.rotation.set(0, 0, 0);
  enemy.rightArm.rotation.set(0, 0, 0);
  enemy.leftLeg.rotation.set(0, 0, 0);
  enemy.rightLeg.rotation.set(0, 0, 0);

  return true;
}

function updateWaveSystem(now) {
  if (gameOver) return;

  // All enemies have been eliminated.
  if (
    waveState === 'active' &&
    getActiveEnemyCount() === 0 &&
    enemiesToSpawn === 0
  ) {
    addScore(WAVE_CLEAR_BONUS, '+250 WAVE CLEAR');
    waveState = 'intermission';
    nextWaveTime = now + WAVE_INTERMISSION * 1000;
  }

  // Start the next wave after the intermission.
  if (
    waveState === 'intermission' &&
    now >= nextWaveTime
  ) {
    currentWave++;

    // Wave 2 = 6 enemies, Wave 3 = 7, etc.
    enemiesToSpawn = 4 + currentWave;

    nextSpawnTime = now;
    waveState = 'spawning';
  }

  // Spawn enemies gradually.
  if (
    waveState === 'spawning' &&
    enemiesToSpawn > 0 &&
    now >= nextSpawnTime
  ) {
    const spawned = spawnWaveEnemy(now);

    if (spawned) {
      enemiesToSpawn--;

      nextSpawnTime =
        now + ENEMY_SPAWN_INTERVAL * 1000;
    } else {
      // Retry if no safe spawn location was found.
      nextSpawnTime = now + 500;
    }

    if (enemiesToSpawn === 0) {
      waveState = 'active';
    }
  }

  updateWaveHUD(now);
}
// ==========================================
// ENEMY IDLE ANIMATION
// ==========================================


function updateEnemyAnimations(now) {
  const time = now * 0.001;

  for (const enemy of enemies) {
    const t = time * (enemy.walking ? 9 : 2) + enemy.phase;

    if (enemy.walking) {
      // Walking animation
      enemy.leftLeg.rotation.x = Math.sin(t) * 0.48;
      enemy.rightLeg.rotation.x = -Math.sin(t) * 0.48;

      enemy.leftArm.rotation.x = -Math.sin(t) * 0.25;
      enemy.rightArm.rotation.x = Math.sin(t) * 0.25;

      enemy.root.position.y = Math.abs(Math.sin(t)) * 0.035;
    } else {
      // Idle breathing
      enemy.leftLeg.rotation.x = 0;
      enemy.rightLeg.rotation.x = 0;

      enemy.leftArm.rotation.x = Math.sin(t) * 0.025;
      enemy.rightArm.rotation.x = Math.sin(t + 0.5) * 0.025;

      enemy.root.position.y = Math.sin(t) * 0.025;
    }
  }
}

 // ==========================================
 // ENEMY AI — DETECTION & CHASE
 // ==========================================


const ENEMY_DETECTION_RANGE = 20;
const ENEMY_STOP_DISTANCE = 1.65;
const ENEMY_SPEED = 2.3;
const ENEMY_RADIUS = 0.48;
const ENEMY_HEIGHT = 2.15;
// ==========================================
// ENEMY LINE OF SIGHT
// ==========================================

const ENEMY_ATTACK_RANGE = 16;
const enemySightRay = new THREE.Raycaster();

function enemyHasLineOfSight(enemy) {
  enemy.root.updateMatrixWorld(true);

  // Approximate rifle muzzle position in world space.
  const origin = new THREE.Vector3(
    0.12,
    1.13,
    0.95
  );

  origin.applyMatrix4(enemy.root.matrixWorld);

  // Aim toward the player's upper body.
  const target = camera.position.clone();
  target.y -= 0.35;

  const direction = target.clone().sub(origin);
  const distance = direction.length();

  if (distance <= 0.001) return true;

  direction.normalize();

  enemySightRay.set(origin, direction);
  enemySightRay.near = 0;
  enemySightRay.far = distance;

  const hits = enemySightRay.intersectObjects(
    obstacleMeshes,
    false
  );

  // A wall or another obstacle blocks the enemy's view.
  return (
    hits.length === 0 ||
    hits[0].distance >= distance - 0.2
  );
}

// Check whether a soldier can stand at a world position.

function enemyCanOccupy(x, z) {
  const enemyMinY = 0;
  const enemyMaxY = ENEMY_HEIGHT;

  // Extra clearance around the soldier's body.
  const radius = ENEMY_RADIUS + 0.10;

  for (const c of colliders) {
    // Ignore obstacles that do not overlap the soldier vertically.
    const noVerticalOverlap =
      enemyMaxY <= c.minY + 0.015 ||
      enemyMinY >= c.maxY - 0.015;

    if (noVerticalOverlap) continue;

    // Check the soldier's full horizontal footprint.
    const overlaps =
      x + radius > c.minX &&
      x - radius < c.maxX &&
      z + radius > c.minZ &&
      z - radius < c.maxZ;

    if (overlaps) {
      return false;
    }
  }

  return true;
}


// Move a soldier while respecting obstacles.
function moveEnemyAxis(enemy, axis, amount) {
  const position = enemy.root.position;

  const steps = Math.max(1, Math.ceil(Math.abs(amount) / 0.1));
  const stepAmount = amount / steps;

  for (let i = 0; i < steps; i++) {
    const nextX =
      position.x + (axis === 'x' ? stepAmount : 0);

    const nextZ =
      position.z + (axis === 'z' ? stepAmount : 0);

    if (enemyCanOccupy(nextX, nextZ)) {
      position[axis] += stepAmount;
    } else {
      break;
    }
  }
}

// Grid-based navigation.
const ENEMY_GRID_MIN = -34;
const ENEMY_GRID_SIZE = 69;
const ENEMY_GRID_CELL = 1;

function worldToEnemyCell(value) {
  return Math.max(
    0,
    Math.min(
      ENEMY_GRID_SIZE - 1,
      Math.round((value - ENEMY_GRID_MIN) / ENEMY_GRID_CELL)
    )
  );
}

function enemyCellToWorld(index) {
  return ENEMY_GRID_MIN + index * ENEMY_GRID_CELL;
}

function enemyCellId(x, z) {
  return z * ENEMY_GRID_SIZE + x;
}

function findNearestWalkableCell(worldX, worldZ) {
  const centerX = worldToEnemyCell(worldX);
  const centerZ = worldToEnemyCell(worldZ);

  for (let radius = 0; radius <= 8; radius++) {
    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (
          Math.max(Math.abs(dx), Math.abs(dz)) !== radius
        ) {
          continue;
        }

        const x = centerX + dx;
        const z = centerZ + dz;

        if (
          x < 0 || z < 0 ||
          x >= ENEMY_GRID_SIZE ||
          z >= ENEMY_GRID_SIZE
        ) {
          continue;
        }

        const wx = enemyCellToWorld(x);
        const wz = enemyCellToWorld(z);

        if (enemyCanOccupy(wx, wz)) {
          return { x, z };
        }
      }
    }
  }

  return null;
}

function findEnemyPath(startX, startZ, goalX, goalZ) {
  const start = findNearestWalkableCell(startX, startZ);
  const goal = findNearestWalkableCell(goalX, goalZ);

  if (!start || !goal) return [];

  const total = ENEMY_GRID_SIZE * ENEMY_GRID_SIZE;
  const parent = new Int32Array(total);
  parent.fill(-2);

  const queue = new Int32Array(total);
  let read = 0;
  let write = 0;

  const startId = enemyCellId(start.x, start.z);
  const goalId = enemyCellId(goal.x, goal.z);

  queue[write++] = startId;
  parent[startId] = -1;

  const directions = [
    [1, 0], [-1, 0],
    [0, 1], [0, -1],
    [1, 1], [1, -1],
    [-1, 1], [-1, -1]
  ];

  while (read < write && parent[goalId] === -2) {
    const currentId = queue[read++];

    const currentX = currentId % ENEMY_GRID_SIZE;
    const currentZ = Math.floor(currentId / ENEMY_GRID_SIZE);

    for (const [dx, dz] of directions) {
      const nx = currentX + dx;
      const nz = currentZ + dz;

      if (
        nx < 0 || nz < 0 ||
        nx >= ENEMY_GRID_SIZE ||
        nz >= ENEMY_GRID_SIZE
      ) {
        continue;
      }

      const nextId = enemyCellId(nx, nz);

      if (parent[nextId] !== -2) continue;

      const wx = enemyCellToWorld(nx);
      const wz = enemyCellToWorld(nz);

      if (!enemyCanOccupy(wx, wz)) continue;

      // Prevent diagonal movement through obstacle corners.
      if (dx !== 0 && dz !== 0) {
        if (
          !enemyCanOccupy(
            enemyCellToWorld(currentX + dx),
            enemyCellToWorld(currentZ)
          ) ||
          !enemyCanOccupy(
            enemyCellToWorld(currentX),
            enemyCellToWorld(currentZ + dz)
          )
        ) {
          continue;
        }
      }

      parent[nextId] = currentId;
      queue[write++] = nextId;
    }
  }

  if (parent[goalId] === -2) return [];

  const reversed = [];
  let current = goalId;

  while (current !== -1) {
    reversed.push({
      x: enemyCellToWorld(current % ENEMY_GRID_SIZE),
      z: enemyCellToWorld(
        Math.floor(current / ENEMY_GRID_SIZE)
      )
    });

    current = parent[current];
  }

  return reversed.reverse();
}

function updateEnemyAI(dt) {
  const playerPosition = camera.position;
  const now = performance.now();

  for (const enemy of enemies) {
    if (!enemy.active) {
      enemy.walking = false;
      continue;
    }

    const position = enemy.root.position;

    const dx = playerPosition.x - position.x;
    const dz = playerPosition.z - position.z;

    const distance = Math.hypot(dx, dz);

    if (distance > ENEMY_DETECTION_RANGE) {
      enemy.walking = false;
      enemy.path = [];
      enemy.pathIndex = 0;
      continue;
    }

    enemy.root.rotation.y = Math.atan2(dx, dz);

// Stop and prepare to shoot when the player is visible.
    if (
      distance <= ENEMY_ATTACK_RANGE &&
      enemyHasLineOfSight(enemy)
    ) {
      enemy.walking = false;
      enemy.path = [];
      enemy.pathIndex = 0;
      continue;
    }

    if (distance <= ENEMY_STOP_DISTANCE) {
      enemy.walking = false;
      enemy.path = [];
      enemy.pathIndex = 0;
      continue;
    }

    // Recalculate the path periodically.
    if (
      now >= enemy.nextPathTime ||
      enemy.pathIndex >= enemy.path.length
    ) {
      const goalX =
        playerPosition.x -
        (dx / distance) * ENEMY_STOP_DISTANCE;

      const goalZ =
        playerPosition.z -
        (dz / distance) * ENEMY_STOP_DISTANCE;

      enemy.path = findEnemyPath(
        position.x,
        position.z,
        goalX,
        goalZ
      );

      enemy.pathIndex =
        enemy.path.length > 1 ? 1 : 0;

      enemy.nextPathTime = now + 650;
    }

    if (
      !enemy.path.length ||
      enemy.pathIndex >= enemy.path.length
    ) {
      enemy.walking = false;
      continue;
    }

    let waypoint = enemy.path[enemy.pathIndex];

    let toX = waypoint.x - position.x;
    let toZ = waypoint.z - position.z;

    let waypointDistance = Math.hypot(toX, toZ);

    if (waypointDistance < 0.22) {
      enemy.pathIndex++;

      if (enemy.pathIndex >= enemy.path.length) {
        enemy.walking = false;
        continue;
      }

      waypoint = enemy.path[enemy.pathIndex];

      toX = waypoint.x - position.x;
      toZ = waypoint.z - position.z;

      waypointDistance = Math.hypot(toX, toZ);
    }

    if (waypointDistance <= 0.001) {
      enemy.walking = false;
      continue;
    }

    const step = Math.min(
      ENEMY_SPEED * dt,
      waypointDistance
    );

    const beforeX = position.x;
    const beforeZ = position.z;

    moveEnemyAxis(
      enemy,
      'x',
      (toX / waypointDistance) * step
    );

    moveEnemyAxis(
      enemy,
      'z',
      (toZ / waypointDistance) * step
    );

    const actualMovement = Math.hypot(
      position.x - beforeX,
      position.z - beforeZ
    );

    enemy.walking = actualMovement > 0.001;

    // If blocked, request a new route.
    if (actualMovement < step * 0.25) {
      enemy.nextPathTime = 0;
    }
  }
}

// ==========================================
// ENEMY SHOOTING & PROJECTILES
// ==========================================

const enemyProjectiles = [];

const enemyBulletGeometry = new THREE.SphereGeometry(
  0.075,
  8,
  6
);

const enemyBulletMaterial = new THREE.MeshBasicMaterial({
  color: 0xff633d
});

const enemyProjectileSpeed = 22;
const enemyProjectileLifetime = 2.2;
const ENEMY_FIRE_INTERVAL = 1400;

// Damage waiting to be applied by the player health system.
// The health system will consume this value in Milestone 4.4.

let pendingPlayerDamage = 0;
let playerHitUntil = 0;

let playerHealth = 100;
let gameOver = false;

// ==========================================
// SCORE & KILL SYSTEM — MILESTONE 4.6
// ==========================================

let score = 0;
let kills = 0;
let bestScore = 0;

const KILL_SCORE = 100;
const WAVE_CLEAR_BONUS = 250;

// Load saved best score.
try {
  bestScore = Number(localStorage.getItem('blockOpsBestScore')) || 0;
} catch (error) {
  bestScore = 0;
}

// ==========================================
// PLAYER HEALTH HUD
// ==========================================

const healthHUD = document.createElement('div');

healthHUD.style.position = 'fixed';
healthHUD.style.left = '20px';
healthHUD.style.bottom = '24px';
healthHUD.style.width = '190px';
healthHUD.style.zIndex = '25';
healthHUD.style.color = 'white';
healthHUD.style.fontFamily = 'Arial, sans-serif';
healthHUD.style.textShadow = '0 2px 5px #000';
healthHUD.style.pointerEvents = 'none';

healthHUD.innerHTML = `
  <div style="
    display:flex;
    justify-content:space-between;
    align-items:center;
    margin-bottom:7px;
    font-size:13px;
    font-weight:bold;
    letter-spacing:2px;
  ">
    <span>HEALTH</span>
    <span id="health-value">100</span>
  </div>

  <div style="
    width:100%;
    height:12px;
    background:rgba(0,0,0,0.65);
    border:1px solid rgba(255,255,255,0.5);
    overflow:hidden;
  ">
    <div id="health-fill" style="
      width:100%;
      height:100%;
      background:#65c65b;
      transition:width 150ms linear, background 150ms linear;
    "></div>
  </div>
`;

document.body.appendChild(healthHUD);

const healthValue = healthHUD.querySelector('#health-value');
const healthFill = healthHUD.querySelector('#health-fill');

function updateHealthUI() {
  healthValue.textContent = Math.ceil(playerHealth);

  healthFill.style.width = `${playerHealth}%`;

  if (playerHealth > 60) {
    healthFill.style.background = '#65c65b';
  } else if (playerHealth > 30) {
    healthFill.style.background = '#e6b84c';
  } else {
    healthFill.style.background = '#e34b3d';
  }
}
// ==========================================
// SURVIVAL WAVE HUD
// ==========================================

const waveHUD = document.createElement('div');

waveHUD.style.position = 'fixed';
waveHUD.style.top = '22px';
waveHUD.style.left = '50%';
waveHUD.style.transform = 'translateX(-50%)';
waveHUD.style.zIndex = '25';
waveHUD.style.minWidth = '210px';
waveHUD.style.padding = '12px 20px';
waveHUD.style.background = 'rgba(0,0,0,0.58)';
waveHUD.style.border = '1px solid rgba(255,255,255,0.25)';
waveHUD.style.color = 'white';
waveHUD.style.fontFamily = 'Arial, sans-serif';
waveHUD.style.textAlign = 'center';
waveHUD.style.textShadow = '0 2px 5px #000';
waveHUD.style.pointerEvents = 'none';

waveHUD.innerHTML = `
  <div style="
    font-size:11px;
    letter-spacing:3px;
    color:#b8c5b5;
    margin-bottom:5px;
  ">
    SURVIVAL
  </div>

  <div id="wave-number" style="
    font-size:27px;
    font-weight:900;
    letter-spacing:2px;
    margin-bottom:5px;
  ">
    WAVE 1
  </div>

  <div id="wave-enemies" style="
    font-size:12px;
    letter-spacing:1px;
    color:#e5e5e5;
  ">
    ENEMIES: 4
  </div>

  <div id="wave-status" style="
    font-size:11px;
    letter-spacing:1px;
    color:#e6b84c;
    margin-top:7px;
  ">
    ELIMINATE ALL ENEMIES
  </div>
`;

document.body.appendChild(waveHUD);

const waveNumberEl = waveHUD.querySelector('#wave-number');
const waveEnemiesEl = waveHUD.querySelector('#wave-enemies');
const waveStatusEl = waveHUD.querySelector('#wave-status');

function updateWaveHUD(now) {
  waveNumberEl.textContent = `WAVE ${currentWave}`;

  const remaining =
    getActiveEnemyCount() + enemiesToSpawn;

  waveEnemiesEl.textContent = `ENEMIES: ${remaining}`;

  if (waveState === 'intermission') {
    const seconds = Math.max(
      0,
      Math.ceil((nextWaveTime - now) / 1000)
    );

    waveStatusEl.textContent =
      `NEXT WAVE IN ${seconds}s`;

  } else if (waveState === 'spawning') {
    waveStatusEl.textContent = 'ENEMIES DEPLOYING';

  } else {
    waveStatusEl.textContent = 'ELIMINATE ALL ENEMIES';
  }
}

updateWaveHUD(performance.now());
// ==========================================
// SCORE HUD
// ==========================================

const scoreHUD = document.createElement('div');

scoreHUD.style.position = 'fixed';
scoreHUD.style.top = '22px';
scoreHUD.style.right = '20px';
scoreHUD.style.zIndex = '25';
scoreHUD.style.minWidth = '155px';
scoreHUD.style.padding = '12px 16px';
scoreHUD.style.background = 'rgba(0,0,0,0.58)';
scoreHUD.style.border = '1px solid rgba(255,255,255,0.25)';
scoreHUD.style.color = 'white';
scoreHUD.style.fontFamily = 'Arial, sans-serif';
scoreHUD.style.textAlign = 'right';
scoreHUD.style.textShadow = '0 2px 5px #000';
scoreHUD.style.pointerEvents = 'none';

scoreHUD.innerHTML = `
  <div style="
    font-size:10px;
    letter-spacing:3px;
    color:#b8c5b5;
    margin-bottom:7px;
  ">
    COMBAT RECORD
  </div>

  <div style="
    font-size:25px;
    font-weight:900;
    letter-spacing:1px;
  ">
    <span id="score-value">0</span>
  </div>

  <div style="
    font-size:11px;
    margin-top:7px;
    color:#e5e5e5;
    letter-spacing:1px;
  ">
    KILLS: <span id="kill-value">0</span>
  </div>

  <div style="
    font-size:11px;
    margin-top:5px;
    color:#e6b84c;
    letter-spacing:1px;
  ">
    BEST: <span id="best-value">0</span>
  </div>
`;

document.body.appendChild(scoreHUD);

const scoreValueEl = scoreHUD.querySelector('#score-value');
const killValueEl = scoreHUD.querySelector('#kill-value');
const bestValueEl = scoreHUD.querySelector('#best-value');

function updateScoreUI() {
  scoreValueEl.textContent = score.toLocaleString();
  killValueEl.textContent = kills;
  bestValueEl.textContent = bestScore.toLocaleString();
}

// ==========================================
// SCORE FEEDBACK
// ==========================================

const scorePopup = document.createElement('div');

scorePopup.style.position = 'fixed';
scorePopup.style.top = '115px';
scorePopup.style.left = '50%';
scorePopup.style.transform = 'translate(-50%, 10px)';
scorePopup.style.zIndex = '35';
scorePopup.style.fontFamily = 'Arial, sans-serif';
scorePopup.style.fontSize = '25px';
scorePopup.style.fontWeight = '900';
scorePopup.style.letterSpacing = '2px';
scorePopup.style.textShadow = '0 2px 8px #000';
scorePopup.style.pointerEvents = 'none';
scorePopup.style.opacity = '0';
scorePopup.style.transition = 'opacity 180ms ease, transform 180ms ease';

document.body.appendChild(scorePopup);

let scorePopupTimer = null;

function showScorePopup(message, color = '#e6b84c') {
  scorePopup.textContent = message;
  scorePopup.style.color = color;
  scorePopup.style.opacity = '1';
  scorePopup.style.transform = 'translate(-50%, 0)';

  if (scorePopupTimer) {
    clearTimeout(scorePopupTimer);
  }

  scorePopupTimer = setTimeout(() => {
    scorePopup.style.opacity = '0';
    scorePopup.style.transform = 'translate(-50%, -10px)';
  }, 950);
}

// ==========================================
// ADD SCORE
// ==========================================

function addScore(points, message) {
  score += points;

  if (score > bestScore) {
    bestScore = score;

    try {
      localStorage.setItem(
        'blockOpsBestScore',
        String(bestScore)
      );
    } catch (error) {
      // Continue playing if browser storage is unavailable.
    }
  }

  updateScoreUI();
  showScorePopup(message);
}

updateScoreUI();
// ==========================================
// GAME OVER SCREEN
// ==========================================

const gameOverScreen = document.createElement('div');

gameOverScreen.style.position = 'fixed';
gameOverScreen.style.inset = '0';
gameOverScreen.style.zIndex = '50';
gameOverScreen.style.display = 'none';
gameOverScreen.style.flexDirection = 'column';
gameOverScreen.style.alignItems = 'center';
gameOverScreen.style.justifyContent = 'center';
gameOverScreen.style.background = 'rgba(0,0,0,0.82)';
gameOverScreen.style.color = 'white';
gameOverScreen.style.fontFamily = 'Arial, sans-serif';

gameOverScreen.innerHTML = `
  <div style="
    font-size:42px;
    font-weight:900;
    letter-spacing:5px;
    color:#e34b3d;
    text-shadow:0 3px 15px #000;
    margin-bottom:12px;
  ">
    YOU DIED
  </div>

  <div style="
    font-size:14px;
    letter-spacing:3px;
    color:#bbb;
    margin-bottom:32px;
  ">
    MISSION FAILED
  </div>
    <div id="game-over-stats" style="
    display:flex;
    gap:35px;
    margin-bottom:35px;
    text-align:center;
  ">
    <div>
      <div style="font-size:11px;color:#aaa;letter-spacing:2px;">
        SCORE
      </div>
      <div id="final-score" style="font-size:27px;font-weight:bold;margin-top:7px;">
        0
      </div>
    </div>

    <div>
      <div style="font-size:11px;color:#aaa;letter-spacing:2px;">
        KILLS
      </div>
      <div id="final-kills" style="font-size:27px;font-weight:bold;margin-top:7px;">
        0
      </div>
    </div>

    <div>
      <div style="font-size:11px;color:#aaa;letter-spacing:2px;">
        WAVE
      </div>
      <div id="final-wave" style="font-size:27px;font-weight:bold;margin-top:7px;">
        1
      </div>
    </div>
  </div>
  <button id="restart-game" style="
    padding:14px 34px;
    background:#344b38;
    color:white;
    border:1px solid #8da18b;
    font-size:15px;
    font-weight:bold;
    letter-spacing:3px;
    cursor:pointer;
  ">
    RESTART
  </button>
`;

document.body.appendChild(gameOverScreen);
const finalScoreEl = gameOverScreen.querySelector('#final-score');
const finalKillsEl = gameOverScreen.querySelector('#final-kills');
const finalWaveEl = gameOverScreen.querySelector('#final-wave');

function triggerGameOver() {
  if (gameOver) return;

  gameOver = true;

  finalScoreEl.textContent = score.toLocaleString();
  finalKillsEl.textContent = kills;
  finalWaveEl.textContent = currentWave;

  controls.unlock();

  gameOverScreen.style.display = 'flex';
}


// Temporary hit indicator.
const enemyHitOverlay = document.createElement('div');

enemyHitOverlay.style.position = 'fixed';
enemyHitOverlay.style.inset = '0';
enemyHitOverlay.style.pointerEvents = 'none';
enemyHitOverlay.style.zIndex = '20';
enemyHitOverlay.style.opacity = '0';
enemyHitOverlay.style.background =
  'radial-gradient(ellipse at center, transparent 35%, rgba(220,25,15,0.48) 100%)';
enemyHitOverlay.style.transition = 'opacity 80ms linear';

document.body.appendChild(enemyHitOverlay);

function spawnEnemyProjectile(enemy) {
  enemy.root.updateMatrixWorld(true);

  // Projectile starts at the enemy rifle muzzle.
  const origin = new THREE.Vector3(
    0.12,
    1.13,
    0.95
  );

  origin.applyMatrix4(enemy.root.matrixWorld);

  // Aim toward the player's upper body.
  const target = camera.position.clone();
  target.y -= 0.35;

  // Add slight inaccuracy to the shot.
  const distance = origin.distanceTo(target);
  const spread = 0.025 + distance * 0.0025;

  target.x += (Math.random() - 0.5) * spread * 2;
  target.y += (Math.random() - 0.5) * spread * 2;
  target.z += (Math.random() - 0.5) * spread * 2;

  const direction = target.sub(origin).normalize();

  const bullet = new THREE.Mesh(
    enemyBulletGeometry,
    enemyBulletMaterial
  );

  bullet.position.copy(origin);
  scene.add(bullet);

  enemyProjectiles.push({
    mesh: bullet,
    velocity: direction.multiplyScalar(enemyProjectileSpeed),
    life: enemyProjectileLifetime,
    damage: 12
  });
}

function updateEnemyShooting(now) {
  for (const enemy of enemies) {
    if (!enemy.active) continue;

    const distance = enemy.root.position.distanceTo(
      camera.position
    );

    if (distance > ENEMY_ATTACK_RANGE) continue;

    if (!enemyHasLineOfSight(enemy)) continue;

    // Face the player while firing.
    const dx = camera.position.x - enemy.root.position.x;
    const dz = camera.position.z - enemy.root.position.z;

    enemy.root.rotation.y = Math.atan2(dx, dz);
    enemy.walking = false;

    if (now >= enemy.nextShotTime) {
      spawnEnemyProjectile(enemy);

      enemy.nextShotTime =
        now + ENEMY_FIRE_INTERVAL + Math.random() * 350;
    }
  }
}

// Find the closest point on a line segment to a position.
function closestPointOnSegment(point, start, end) {
  const segment = end.clone().sub(start);
  const lengthSquared = segment.lengthSq();

  if (lengthSquared <= 0.000001) {
    return start.clone();
  }

  const t = THREE.MathUtils.clamp(
    point.clone().sub(start).dot(segment) / lengthSquared,
    0,
    1
  );

  return start.clone().add(segment.multiplyScalar(t));
}

const projectileObstacleRay = new THREE.Raycaster();


function updateEnemyProjectiles(now, dt) {
  const playerHitPoint = camera.position.clone();
  playerHitPoint.y -= 0.35;

  for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
    const projectile = enemyProjectiles[i];

    const start = projectile.mesh.position.clone();
    const movement = projectile.velocity.clone().multiplyScalar(dt);
    const segmentLength = movement.length();

    if (segmentLength <= 0.0001) continue;

    const direction = movement.clone().normalize();
    const end = start.clone().add(movement);

    // Check obstacle collision along the entire projectile segment.
    projectileObstacleRay.set(start, direction);
    projectileObstacleRay.near = 0;
    projectileObstacleRay.far = segmentLength;

    const obstacleHits =
      projectileObstacleRay.intersectObjects(
        obstacleMeshes,
        false
      );

    const obstacleDistance =
      obstacleHits.length > 0
        ? obstacleHits[0].distance
        : Infinity;

    // Project the player position onto the projectile path.
    const toPlayer = playerHitPoint.clone().sub(start);

    const playerAlongDistance = toPlayer.dot(direction);

    const closestDistance = THREE.MathUtils.clamp(
      playerAlongDistance,
      0,
      segmentLength
    );

    const closestPoint = start.clone().add(
      direction.clone().multiplyScalar(closestDistance)
    );

    const playerDistance = closestPoint.distanceTo(
      playerHitPoint
    );

    const playerIsOnSegment =
      playerAlongDistance >= 0 &&
      playerAlongDistance <= segmentLength;

    const hitsPlayer =
      playerIsOnSegment &&
      playerDistance <= 0.48;

    // An obstacle blocks the projectile if it is before the player.
    const obstacleBlocksPlayer =
      obstacleDistance < playerAlongDistance - 0.03;

    if (hitsPlayer && !obstacleBlocksPlayer) {
      pendingPlayerDamage += projectile.damage;
      playerHitUntil = now + 180;

      scene.remove(projectile.mesh);
      enemyProjectiles.splice(i, 1);
      continue;
    }

    // Remove the projectile immediately when it hits an obstacle.
    if (obstacleDistance <= segmentLength) {
      scene.remove(projectile.mesh);
      enemyProjectiles.splice(i, 1);
      continue;
    }

    projectile.mesh.position.copy(end);
    projectile.life -= dt;

    if (projectile.life <= 0) {
      scene.remove(projectile.mesh);
      enemyProjectiles.splice(i, 1);
    }
  }

  enemyHitOverlay.style.opacity =
    now < playerHitUntil ? '1' : '0';
}

// ==========================================
// WEAPON MODEL
// ==========================================

const weapon = new THREE.Group();
camera.add(weapon);

weapon.position.set(0.34, -0.31, -0.62);

const gunMat = new THREE.MeshStandardMaterial({
  color: 0x252d2e,
  metalness: 0.65,
  roughness: 0.42
});

const gunDark = new THREE.MeshStandardMaterial({
  color: 0x111718,
  metalness: 0.35,
  roughness: 0.65
});

const gunAccent = new THREE.MeshStandardMaterial({
  color: 0x68736b,
  metalness: 0.5,
  roughness: 0.5
});

function gunPart(size, position, material) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    material
  );

  mesh.position.set(...position);
  weapon.add(mesh);
  return mesh;
}

// Rifle body
gunPart([0.16, 0.17, 0.66], [0, 0, 0], gunMat);

// Magazine
gunPart([0.12, 0.12, 0.3], [0, -0.13, -0.05], gunDark);

// Barrel
gunPart([0.085, 0.09, 0.45], [0, 0.015, -0.48], gunDark);

// Stock
gunPart([0.12, 0.13, 0.22], [0, -0.04, 0.39], gunMat);

// Grip
gunPart([0.12, 0.24, 0.15], [0, -0.2, 0.19], gunDark);

// Top rail
gunPart([0.08, 0.035, 0.24], [0, 0.105, -0.13], gunAccent);

// Sight
gunPart([0.035, 0.07, 0.045], [0, 0.14, -0.47], gunDark);

// Muzzle flash
const muzzle = new THREE.PointLight(0xffb45a, 0, 3);
muzzle.position.set(0, 0, -0.76);
weapon.add(muzzle);

const flash = new THREE.Mesh(
  new THREE.SphereGeometry(0.075, 8, 6),
  new THREE.MeshBasicMaterial({ color: 0xffc36a })
);

flash.position.copy(muzzle.position);
flash.visible = false;
weapon.add(flash);

// ==========================================
// PLAYER PHYSICS
// ==========================================

const PLAYER_RADIUS = 0.34;
const STAND_HEIGHT = 1.72;
const CROUCH_HEIGHT = 1.12;
const EYE_STAND = 1.62;
const EYE_CROUCH = 1.02;

const WALK_SPEED = 5.2;
const SPRINT_SPEED = 8;
const CROUCH_SPEED = 2.7;

const ACCEL = 22;
const FRICTION = 18;
const GRAVITY = 22;
const JUMP_VELOCITY = 7.2;

let feetY = 0;
let verticalVelocity = 0;
let grounded = true;
let crouching = false;
let sprinting = false;
let moving = false;
let bobTime = 0;
let currentEyeHeight = EYE_STAND;
let vault = null;

const keys = Object.create(null);
const velocity = { x: 0, z: 0 };

// ==========================================
// WEAPON STATE
// ==========================================

const ammoEl = document.getElementById('ammo');
const reserveEl = document.getElementById('reserve');
const reloadLabel = document.getElementById('reload-label');
const hitMarker = document.getElementById('hit-marker');

const MAG_SIZE = 30;
const FIRE_INTERVAL = 105;
const RELOAD_MS = 1550;

let ammo = MAG_SIZE;
let reserve = 120;
let isReloading = false;
let reloadEnd = 0;
let lastShot = 0;
let weaponKick = 0;
let flashUntil = 0;
let hitUntil = 0;

function updateAmmo() {
  ammoEl.textContent = ammo;
  reserveEl.textContent = reserve;
}

updateAmmo();

// ==========================================
// INPUT
// ==========================================

addEventListener('keydown', event => {
  keys[event.code] = true;

  if (
    ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)
  ) {
    event.preventDefault();
  }

  if (event.code === 'Space' && controls.isLocked && !vault) {
    if (!tryMantle()) {
      if (grounded && !crouching) {
        verticalVelocity = JUMP_VELOCITY;
        grounded = false;
      }
    }
  }

  if (event.code === 'KeyR' && controls.isLocked) {
    startReload();
  }
});

addEventListener('keyup', event => {
  keys[event.code] = false;
});

// ==========================================
// MAIN MENU / TRUE PAUSE SYSTEM
// ==========================================

startButton.addEventListener('click', () => {
    controls.lock();
});

controls.addEventListener('lock', () => {

    // Resume game: compensate for paused time.
    if (pauseStartedAt !== null) {

        const pausedDuration =
            performance.now() - pauseStartedAt;

        // Freeze wave timers during pause.
        if (waveState === 'intermission') {
            nextWaveTime += pausedDuration;
        }

        if (waveState === 'spawning') {
            nextSpawnTime += pausedDuration;
        }

        // Freeze enemy shooting timers.
        for (const enemy of enemies) {
            if (Number.isFinite(enemy.nextShotTime)) {
                enemy.nextShotTime += pausedDuration;
            }
        }

        pauseStartedAt = null;
    }

    hasStarted = true;
    overlay.classList.remove('visible');
});

controls.addEventListener('unlock', () => {

    // Do not show pause menu after Game Over.
    if (gameOver) return;

    overlay.classList.add('visible');

    if (hasStarted) {

        // Record the exact pause start time.
        pauseStartedAt = performance.now();

        menuHeading.textContent = 'MISSION PAUSED';

        menuDescription.textContent =
            'Your mission is on hold. Return to the combat zone when you are ready.';

        startButton.textContent = 'RESUME MISSION';

    } else {

        menuHeading.textContent = 'READY FOR DEPLOYMENT?';

        menuDescription.textContent =
            'Enter the combat zone. Eliminate enemy forces. Survive every incoming wave.';

        startButton.textContent = 'DEPLOY';
    }
});

// ==========================================
// COLLISION
// ==========================================

function horizontalOverlap(x, z, c, padding = PLAYER_RADIUS) {
  return (
    x + padding > c.minX &&
    x - padding < c.maxX &&
    z + padding > c.minZ &&
    z - padding < c.maxZ
  );
}

function collidesAt(x, z, feet, height, ignore = null) {
  for (const c of colliders) {
    if (c === ignore) continue;

    if (
      feet < c.maxY - 0.015 &&
      feet + height > c.minY + 0.015 &&
      horizontalOverlap(x, z, c)
    ) {
      return c;
    }
  }

  return null;
}

function moveAxis(axis, amount) {
  if (Math.abs(amount) < 0.00001) return;

  const p = camera.position;
  const height = crouching ? CROUCH_HEIGHT : STAND_HEIGHT;
  const radius = PLAYER_RADIUS;

  const current = axis === 'x' ? p.x : p.z;
  const target = current + amount;

  let allowed = target;

  for (const c of colliders) {
    if (
      feetY >= c.maxY - 0.015 ||
      feetY + height <= c.minY + 0.015
    ) {
      continue;
    }

    if (axis === 'x') {
      const overlap =
        p.z + radius > c.minZ &&
        p.z - radius < c.maxZ;

      if (!overlap) continue;

      if (
        amount > 0 &&
        current + radius <= c.minX &&
        target + radius > c.minX
      ) {
        allowed = Math.min(allowed, c.minX - radius);
      }

      if (
        amount < 0 &&
        current - radius >= c.maxX &&
        target - radius < c.maxX
      ) {
        allowed = Math.max(allowed, c.maxX + radius);
      }
    } else {
      const overlap =
        p.x + radius > c.minX &&
        p.x - radius < c.maxX;

      if (!overlap) continue;

      if (
        amount > 0 &&
        current + radius <= c.minZ &&
        target + radius > c.minZ
      ) {
        allowed = Math.min(allowed, c.minZ - radius);
      }

      if (
        amount < 0 &&
        current - radius >= c.maxZ &&
        target - radius < c.maxZ
      ) {
        allowed = Math.max(allowed, c.maxZ + radius);
      }
    }
  }

  if (axis === 'x') {
    p.x = allowed;
  } else {
    p.z = allowed;
  }
}

// ==========================================
// VAULT & MANTLE
// ==========================================

function getForward() {
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  direction.y = 0;
  return direction.normalize();
}

function getObstacleAhead(maxDistance = 1.35) {
  const direction = getForward();

  const origin = new THREE.Vector3(
    camera.position.x,
    feetY + 0.72,
    camera.position.z
  );

  const ray = new THREE.Raycaster(origin, direction, 0, maxDistance);
  const hits = ray.intersectObjects(obstacleMeshes, false);

  for (const hit of hits) {
    const c = colliders.find(v => v.mesh === hit.object);

    if (
      c &&
      feetY < c.maxY - 0.05 &&
      feetY + STAND_HEIGHT > c.minY
    ) {
      return c;
    }
  }

  return null;
}

function freeLanding(x, z, feet, height, ignore) {
  if (collidesAt(x, z, feet, height, ignore)) return false;

  return Math.abs(x) < 33 && Math.abs(z) < 33;
}

function beginTraversal(c, kind) {
  const direction = getForward();

  const depth =
    Math.abs(direction.x) * (c.maxX - c.minX) / 2 +
    Math.abs(direction.z) * (c.maxZ - c.minZ) / 2;

  const distance = depth + PLAYER_RADIUS + 0.55;

  const targetX = camera.position.x + direction.x * distance;
  const targetZ = camera.position.z + direction.z * distance;

  const landingFeet = feetY;

  if (!freeLanding(targetX, targetZ, landingFeet, STAND_HEIGHT, c)) {
    return false;
  }

  const start = new THREE.Vector3(
    camera.position.x,
    feetY + currentEyeHeight,
    camera.position.z
  );

  const end = new THREE.Vector3(
    targetX,
    landingFeet + EYE_STAND,
    targetZ
  );

  const duration = kind === 'vault' ? 0.52 : 0.82;
  const arc = kind === 'vault' ? 0.72 : 1.05;

  vault = {
    kind,
    c,
    start,
    end,
    elapsed: 0,
    duration,
    arc,
    endFeet: landingFeet
  };

  actionLabel.textContent = kind === 'vault' ? 'VAULTING' : 'MANTLING';
  actionLabel.classList.add('show');

  return true;
}

function tryMantle() {
  if (!grounded || crouching) return false;

  const c = getObstacleAhead(1.55);
  if (!c) return false;

  const height = c.maxY - feetY;

  if (height > 1.8 || height < 0.35) return false;

  return beginTraversal(c, 'mantle');
}

function tryAutoVault() {
  if (!sprinting || !grounded || crouching || vault) return false;

  const c = getObstacleAhead(1.05);
  if (!c) return false;

  const height = c.maxY - feetY;

  if (height > 0.95 || height < 0.25) return false;

  return beginTraversal(c, 'vault');
}

function updateTraversal(dt) {
  if (!vault) return;

  vault.elapsed += dt;

  const t = Math.min(vault.elapsed / vault.duration, 1);
  const smooth = t * t * (3 - 2 * t);

  const x = THREE.MathUtils.lerp(vault.start.x, vault.end.x, smooth);
  const z = THREE.MathUtils.lerp(vault.start.z, vault.end.z, smooth);

  const baseY = THREE.MathUtils.lerp(vault.start.y, vault.end.y, smooth);
  const arcY = Math.sin(Math.PI * t) * vault.arc;

  camera.position.set(x, baseY + arcY, z);

  if (t >= 1) {
    feetY = vault.endFeet;
    currentEyeHeight = EYE_STAND;

    camera.position.set(
      vault.end.x,
      feetY + EYE_STAND,
      vault.end.z
    );

    verticalVelocity = 0;
    grounded = true;
    crouching = false;
    vault = null;

    actionLabel.classList.remove('show');
  }
}

// ==========================================
// PLAYER UPDATE
// ==========================================

function updatePlayer(dt) {
  if (vault) {
    updateTraversal(dt);
    return;
  }

  const p = camera.position;
  const forward = getForward();

  const right = new THREE.Vector3()
    .crossVectors(forward, new THREE.Vector3(0, 1, 0))
    .normalize();

  let ix = 0;
  let iz = 0;

  if (keys.KeyW) {
    ix += forward.x;
    iz += forward.z;
  }

  if (keys.KeyS) {
    ix -= forward.x;
    iz -= forward.z;
  }

  if (keys.KeyD) {
    ix += right.x;
    iz += right.z;
  }

  if (keys.KeyA) {
    ix -= right.x;
    iz -= right.z;
  }

  const inputLen = Math.hypot(ix, iz);

  if (inputLen > 0) {
    ix /= inputLen;
    iz /= inputLen;
  }

  crouching = !!(keys.ControlLeft || keys.ControlRight);

  sprinting =
    !!(keys.ShiftLeft || keys.ShiftRight) &&
    inputLen > 0 &&
    !crouching;

  const targetSpeed = crouching
    ? CROUCH_SPEED
    : (sprinting ? SPRINT_SPEED : WALK_SPEED);

  const targetVX = ix * targetSpeed;
  const targetVZ = iz * targetSpeed;

  const rate = inputLen > 0 ? ACCEL : FRICTION;

  velocity.x = THREE.MathUtils.damp(
    velocity.x, targetVX, rate, dt
  );

  velocity.z = THREE.MathUtils.damp(
    velocity.z, targetVZ, rate, dt
  );

  moving = Math.hypot(velocity.x, velocity.z) > 0.35;

  if (tryAutoVault()) return;

  moveAxis('x', velocity.x * dt);
  moveAxis('z', velocity.z * dt);

  
  if (!grounded) {
    const previousFeet = feetY;
    const previousHead = feetY + STAND_HEIGHT;

    verticalVelocity -= GRAVITY * dt;

    const nextFeet = feetY + verticalVelocity * dt;
    const nextHead = nextFeet + STAND_HEIGHT;

    let collisionY = null;

    // Falling: detect landing on top of an obstacle.
    if (verticalVelocity <= 0) {
      for (const c of colliders) {
        if (!horizontalOverlap(p.x, p.z, c)) continue;

        const crossedTop =
          previousFeet >= c.maxY - 0.02 &&
          nextFeet <= c.maxY;

        if (crossedTop && (collisionY === null || c.maxY > collisionY)) {
          collisionY = c.maxY;
        }
      }

      if (collisionY !== null) {
        feetY = collisionY;
        verticalVelocity = 0;
        grounded = true;
      } else {
        feetY = nextFeet;
      }

      // Ground floor collision.
      if (feetY <= 0) {
        feetY = 0;
        verticalVelocity = 0;
        grounded = true;
      }
    }

    // Rising: prevent the player's head from entering an obstacle.
    else {
      let ceilingY = null;

      for (const c of colliders) {
        if (!horizontalOverlap(p.x, p.z, c)) continue;

        const crossedBottom =
          previousHead <= c.minY + 0.02 &&
          nextHead >= c.minY;

        if (
          crossedBottom &&
          (ceilingY === null || c.minY < ceilingY)
        ) {
          ceilingY = c.minY;
        }
      }

      if (ceilingY !== null) {
        feetY = ceilingY - STAND_HEIGHT;
        verticalVelocity = 0;
      } else {
        feetY = nextFeet;
      }
    }
  }


  currentEyeHeight = THREE.MathUtils.damp(
    currentEyeHeight,
    crouching ? EYE_CROUCH : EYE_STAND,
    14,
    dt
  );

  bobTime += dt * (sprinting ? 15 : 9);

  const bob = grounded && moving
    ? Math.sin(bobTime) * (sprinting ? 0.055 : 0.028)
    : 0;

  camera.position.y = feetY + currentEyeHeight + bob;

  speedEl.textContent = sprinting
    ? 'SPRINT'
    : (crouching ? 'CROUCH' : (moving ? 'MOVE' : 'READY'));
}

// ==========================================
// WEAPON & COMBAT SYSTEM
// ==========================================

function startReload() {
  if (
    isReloading ||
    ammo === MAG_SIZE ||
    reserve <= 0
  ) {
    return;
  }

  isReloading = true;
  reloadEnd = performance.now() + RELOAD_MS;
  reloadLabel.textContent = 'RELOADING';
}

function finishReload() {
  const needed = MAG_SIZE - ammo;
  const amount = Math.min(needed, reserve);

  ammo += amount;
  reserve -= amount;

  isReloading = false;
  reloadLabel.textContent = '';

  updateAmmo();
}

const shotRay = new THREE.Raycaster();
const center = new THREE.Vector2(0, 0);



function shoot() {
  const now = performance.now();

  if (!controls.isLocked || isReloading) return;
  if (now - lastShot < FIRE_INTERVAL) return;

  if (ammo <= 0) {
    startReload();
    return;
  }

  lastShot = now;
  ammo--;

  updateAmmo();

  weaponKick = Math.min(weaponKick + 0.075, 0.16);

  flashUntil = now + 55;
  muzzle.intensity = 2.8;
  flash.visible = true;

  shotRay.setFromCamera(center, camera);
  shotRay.far = 85;

  const damageableMeshes = [];

  // Add active training targets.
  for (const target of targets) {
    if (!target.active) continue;

    target.group.traverse(object => {
      if (object.isMesh) {
        damageableMeshes.push(object);
      }
    });
  }

  // Add active enemy soldiers.
  for (const enemy of enemies) {
    if (!enemy.active) continue;

    enemy.root.traverse(object => {
      if (object.isMesh) {
        damageableMeshes.push(object);
      }
    });
  }

  // Obstacles block bullets.
  const hits = shotRay.intersectObjects(
    [...damageableMeshes, ...obstacleMeshes],
    false
  );

  if (hits.length === 0) return;

  const hit = hits[0];

  const targetGroup = hit.object.userData.target;
  const enemyRoot = hit.object.userData.enemyRoot;

  // Hit a red training target.
  if (targetGroup) {
    const data = targets.find(
      target => target.group === targetGroup
    );

    if (data && data.active) {
      data.health -= 34;
      hitUntil = now + 180;

      if (data.health <= 0) {
        data.active = false;
        data.group.visible = false;
        data.respawnAt = now + 4500;
      }
    }
  }

  // Hit an armed enemy soldier.
  else if (enemyRoot) {
    const enemy = enemies.find(
      item => item.root === enemyRoot
    );

    if (enemy && enemy.active) {
      enemy.health -= 34;
      hitUntil = now + 180;

      if (enemy.health <= 0) {
        enemy.active = false;
        enemy.walking = false;
        enemy.root.visible = false;

        // Award points exactly once per enemy kill.
        kills++;
        addScore(KILL_SCORE, '+100 KILL');

        // Individual respawn is disabled.
        // The next wave will deploy new enemies.
        enemy.respawnAt = 0;

        enemy.path = [];
        enemy.pathIndex = 0;
      }
    }
  }
}



addEventListener('mousedown', event => {
  if (event.button === 0) {
    shoot();
  }
});


function updateCombat(now, dt) {
  // Stop combat updates after game over.
  if (gameOver) return;

  // ==========================================
  // PLAYER DAMAGE & HEALTH
  // ==========================================

  if (pendingPlayerDamage > 0) {
    playerHealth = Math.max(
      0,
      playerHealth - pendingPlayerDamage
    );

    pendingPlayerDamage = 0;

    updateHealthUI();

    if (playerHealth <= 0) {
      triggerGameOver();
      return;
    }
  }

  // ==========================================
  // RELOAD
  // ==========================================

  if (isReloading && now >= reloadEnd) {
    finishReload();
  }

  // ==========================================
  // MUZZLE FLASH
  // ==========================================

  if (now > flashUntil) {
    flash.visible = false;
    muzzle.intensity = 0;
  }

  // ==========================================
  // WEAPON RECOIL
  // ==========================================

  weaponKick = THREE.MathUtils.damp(
    weaponKick,
    0,
    18,
    dt
  );

  const walkingBob = grounded && moving
    ? Math.sin(bobTime) * 0.012
    : 0;

  weapon.position.set(
    0.34 + walkingBob,
    -0.31 - Math.abs(walkingBob),
    -0.62 + weaponKick
  );

  weapon.rotation.x = weaponKick * 1.8;
  weapon.rotation.z = -walkingBob * 1.5;

  // ==========================================
  // HIT MARKER
  // ==========================================

  hitMarker.style.opacity =
    now < hitUntil ? '1' : '0';

  // ==========================================
  // TRAINING TARGET RESPAWN
  // ==========================================

  for (const target of targets) {
    if (
      !target.active &&
      target.respawnAt &&
      now >= target.respawnAt
    ) {
      target.active = true;
      target.health = 100;
      target.group.visible = true;
      target.respawnAt = 0;
    }
  }
}


function restartGame() {
  gameOver = false;
    // Reset current score and kills.
  // Keep the saved best score.
  score = 0;
  kills = 0;

  updateScoreUI();

  scorePopup.style.opacity = '0';

  if (scorePopupTimer) {
    clearTimeout(scorePopupTimer);
    scorePopupTimer = null;
  }
  // Reset player health.
  playerHealth = 100;
  pendingPlayerDamage = 0;
  playerHitUntil = 0;
  updateHealthUI();

  // Reset player position and movement.
  feetY = 0;
  verticalVelocity = 0;
  grounded = true;
  crouching = false;
  sprinting = false;
  moving = false;
  currentEyeHeight = EYE_STAND;
  vault = null;

  velocity.x = 0;
  velocity.z = 0;

  camera.position.set(0, EYE_STAND, 11);
  camera.rotation.set(0, 0, 0);

  for (const key in keys) {
    keys[key] = false;
  }

  // Reset weapon and ammunition.
  ammo = MAG_SIZE;
  reserve = 120;
  isReloading = false;
  reloadEnd = 0;
  lastShot = 0;
  weaponKick = 0;
  flash.visible = false;
  muzzle.intensity = 0;

  reloadLabel.textContent = '';
  updateAmmo();

  // Remove existing enemy projectiles.
  for (const projectile of enemyProjectiles) {
    scene.remove(projectile.mesh);
  }

  enemyProjectiles.length = 0;

  // Reset training targets.
  for (const target of targets) {
    target.active = true;
    target.health = 100;
    target.respawnAt = 0;
    target.group.visible = true;
  }

  // Reset enemy soldiers.
  // ==========================================
// RESET SURVIVAL WAVES & ENEMIES
// ==========================================

const now = performance.now();

// Reset wave state.
currentWave = 1;
waveState = 'active';

enemiesToSpawn = 0;
nextSpawnTime = 0;
nextWaveTime = 0;

// Hide and deactivate every enemy.
for (const enemy of enemies) {
  enemy.active = false;
  enemy.health = 100;
  enemy.respawnAt = 0;

  enemy.root.visible = false;

  enemy.nextPathTime = 0;
  enemy.nextShotTime = now + 1000;

  enemy.path = [];
  enemy.pathIndex = 0;
  enemy.walking = false;
}

// Restore the original four enemies.
for (let i = 0; i < INITIAL_ENEMY_COUNT; i++) {
  const enemy = enemies[i];

  enemy.active = true;
  enemy.health = 100;
  enemy.respawnAt = 0;

  enemy.root.visible = true;

  enemy.root.position.set(
    enemy.spawnX,
    0,
    enemy.spawnZ
  );

  enemy.root.rotation.y = Math.atan2(
    -enemy.spawnX,
    -enemy.spawnZ
  );

  enemy.nextPathTime = 0;
  enemy.nextShotTime = now + 1000;

  enemy.path = [];
  enemy.pathIndex = 0;
  enemy.walking = false;

  enemy.leftArm.rotation.set(0, 0, 0);
  enemy.rightArm.rotation.set(0, 0, 0);
  enemy.leftLeg.rotation.set(0, 0, 0);
  enemy.rightLeg.rotation.set(0, 0, 0);
}

updateWaveHUD(now);

  enemyHitOverlay.style.opacity = '0';
  gameOverScreen.style.display = 'none';

  controls.lock();
}

gameOverScreen
  .querySelector('#restart-game')
  .addEventListener('click', restartGame);

// ==========================================
// GAME LOOP
// ==========================================

let previous = performance.now();

function animate(now) {
  requestAnimationFrame(animate);

  const dt = Math.min((now - previous) / 1000, 0.033);
  previous = now;

  if (controls.isLocked && !gameOver) {
    // Player movement
    updatePlayer(dt);

    // Player combat
    updateCombat(now, dt);

    // Survival wave system
    updateWaveSystem(now);

    // Enemy AI
    updateEnemyAI(dt);

    // Enemy weapon system
    updateEnemyShooting(now);
    updateEnemyProjectiles(now, dt);

    // Enemy animations
    updateEnemyAnimations(now);
  }

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);

// RESIZE
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
