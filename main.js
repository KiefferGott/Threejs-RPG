var camera, scene, renderer;
var helper, loader;
var controls;
var world, sky;
var boxes = [];
/*var raycaster = new THREE.Raycaster();*/
/*raycaster.far = 100;*/
var ready = false;
/*var rays = [
new THREE.Vector3(0, 0, 1),
new THREE.Vector3(1, 0, 1),
new THREE.Vector3(1, 0, 0),
new THREE.Vector3(1, 0, -1),
new THREE.Vector3(0, 0, -1),
new THREE.Vector3(-1, 0, -1),
new THREE.Vector3(-1, 0, 0),
new THREE.Vector3(-1, 0, 1)
];*/
var mouseVector = {};

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var clock = new THREE.Clock();

var motionStatus = {
	inWalking: false,
	inRunning: false,
	inStartWalking: false,
	inStartRunning: false,
	inStopWalking: false,
	inStopRunning: false,
	inMovingForward: false,
	inMovingBackward: false,
	inRotatingLeft: false,
	inRotatingRight: false,
	direction: 0,
	runFlag: false,
	duration: 0.0,
	elapsedTimeSinceStartWalking: 0.0,
	elapsedTimeSinceStartRunning: 0.0,
	elapsedTimeSinceStopWalking: 0.0,
	elapsedTimeSinceStopRunning: 0.0
};

var modelParams = [{
	name: 'Player',
	file: 'assets/models/Airi/WR_airi.pmd',
	position: new THREE.Vector3(0, 94.5, 0)
}];
var npc = [{
	name: 'PNJ',
	file: 'assets/models/R1N4/R1N4.pmx',
	position: new THREE.Vector3(100, 94.5, 50),
}];

var cameraParams = [{
	name: 'camera',
	position: new THREE.Vector3(0, 0, -25)
}];

var blinkMorphName = 'まばたき';

var stageFile = 'assets/stages/Warship/warship.pmx';

var poses = {};

var motionParams = [{
	name: 'walk',
	isMoving: true,
	files: ['assets/vmd/walk.vmd']
}, {
	name: 'run',
	isMoving: true,
	files: ['assets/vmd/run2.vmd']
}, {
	name: 'standing',
	isMoving: false,
	files: ['assets/vmd/standing.vmd']
}];

var blinkVmd = {
	metadata: {
		name: 'blink',
		coordinateSystem: 'right',
		morphCount: 11,
		cameraCount: 0,
		motionCount: 0
	},
	morphs: [{
		frameNum: 0,
		morphName: blinkMorphName,
		weight: 0.0
	}, {
		frameNum: 10,
		morphName: blinkMorphName,
		weight: 0.0
	}, {
		frameNum: 15,
		morphName: blinkMorphName,
		weight: 1.0
	}, {
		frameNum: 20,
		morphName: blinkMorphName,
		weight: 0.0
	}, {
		frameNum: 40,
		morphName: blinkMorphName,
		weight: 0.0
	}, {
		frameNum: 43,
		morphName: blinkMorphName,
		weight: 1.0
	}, {
		frameNum: 46,
		morphName: blinkMorphName,
		weight: 0.0
	}, {
		frameNum: 49,
		morphName: blinkMorphName,
		weight: 0.0
	}, {
		frameNum: 52,
		morphName: blinkMorphName,
		weight: 1.0
	}, {
		frameNum: 55,
		morphName: blinkMorphName,
		weight: 0.0
	}, {
		frameNum: 200,
		morphName: blinkMorphName,
		weight: 0.0
	}, ],
	cameras: [],
	motions: []
};
var lights = [
{
	position: {
		x: 328.37,
		y: 250.5,
		z: 763.42
	},
	castShadow: true
},
{
	position: {
		x: -278.37,
		y: 505.5,
		z: 763.42
	},
	castShadow: false
},
{
	position: {
		x: 328.37,
		y: 250.5,
		z: -980.62
	},
	castShadow: true
},
{
	position: {
		x: -278.37,
		y: 505.5,
		z: -980.62
	},
	castShadow: false
}
];
var skyParams  = {
	turbidity: 2.5,
	rayleigh: 2.124,
	mieCoefficient: 0.005,
	mieDirectionalG: 0.9,
	luminance: 1.05,
	inclination: 0.0059,
	azimuth: 0.4077
};

var onProgress = function(xhr) {
	if (xhr.lengthComputable) {
		var percentComplete = xhr.loaded / xhr.total * 100;
		console.log(Math.round(percentComplete, 2) + '% downloaded');
	}
};

var onError = function(xhr) {};

init();

function initSky() {
	sky = new THREE.Sky();
	scene.add(sky.mesh);
	sky.uniforms.turbidity.value = skyParams.turbidity;
	sky.uniforms.rayleigh.value = skyParams.rayleigh;
	sky.uniforms.luminance.value = skyParams.luminance;
	sky.uniforms.mieCoefficient.value = skyParams.mieCoefficient;
	sky.uniforms.mieDirectionalG.value = skyParams.mieDirectionalG;

	var distance = 400000;
	var theta = Math.PI * ( skyParams.inclination - 0.5 );
	var phi = 2 * Math.PI * ( skyParams.azimuth - 0.5 );

	var sunX = distance * Math.cos( phi );
	var sunY = distance * Math.sin( phi ) * Math.sin( theta );
	var sunZ = distance * Math.sin( phi ) * Math.cos( theta );

	sky.uniforms.sunPosition.value.copy(new THREE.Vector3(sunX, sunY, sunZ));
}

function init() {
	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000000);
	scene = new THREE.Scene();

	var ambient = new THREE.AmbientLight(0x444444);
	scene.add(ambient);
	addSpotlight(lights);

	renderer = new THREE.WebGLRenderer({
		antialias: true
	});
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.sortObjects = false;
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	resetPosition();
	controls = new THREE.OrbitControls(camera, renderer.domElement);
	controls.enablePan = false;
	controls.maxPolarAngle = Math.PI/2 - 0.3;
	controls.minDistance = 55;
	controls.maxDistance = 55;

	helper = new THREE.MMDHelper();
	loader = new THREE.MMDLoader();

	loadModels(function() {
		var mesh = helper.meshes[0];
		loadVmds(mesh, function() {
			loader.pourVmdIntoModel(mesh, blinkVmd, 'blink');
			helper.setAnimation(mesh);

			for (var i = 0; i < motionParams.length; i++) {
				var param = motionParams[i];

				var name = param.name;
				mesh.mixer.clipAction(name).weight = 0.0;
				if (mesh.mixer.clipAction(name + 'Morph')) {
					mesh.mixer.clipAction(name + 'Morph').weight = 0.0;
				}
				startMotion(mesh, name);
			}
			startBlink(mesh);
			startStanding(mesh);
			loader.loadModel(npc[0].file, function (npcMesh) {
				npcMesh.castShadow = true;
				npcMesh.receiveShadow = true;
				helper.add(npcMesh);
				npcMesh.position.copy(npc[0].position);
				scene.add(npcMesh);
				npcMesh.rotateY(-1.5707963268);
				npc[0].mesh = npcMesh;
				loadVmds(npcMesh, function() {
					loader.pourVmdIntoModel(npcMesh, blinkVmd, 'blink');
					helper.setAnimation(npcMesh);
					for (var i = 0; i < motionParams.length; i++) {
						var param = motionParams[i];
						var name = param.name;
						npcMesh.mixer.clipAction(name).weight = 0.0;
						if (npcMesh.mixer.clipAction(name + 'Morph')) {
							npcMesh.mixer.clipAction(name + 'Morph').weight = 0.0;
						}
						startMotion(npcMesh, name);
					}
					startBlink(npcMesh);
					startStanding(npcMesh);
				});
			});
			ready = true;
		});
	});
	initSky();
	update();
	document.addEventListener('keydown', onKeydown, false);
	document.addEventListener('keyup', onKeyup, false);
	window.addEventListener('resize', onWindowResize, false);
	/*window.addEventListener( 'mousemove', onMouseMove, false );*/
}

function addSpotlight(lights) {
	var spotLight;
	for (var i = 0; i < lights.length; i++) {
		spotLight = new THREE.SpotLight( 0xcccccc );
		spotLight.position.set(lights[i].position.x, lights[i].position.y, lights[i].position.z);
		spotLight.penumbra = 0.1;
		spotLight.decay = 0;
		spotLight.castShadow = lights[i].castShadow;

		spotLight.shadow.mapSize.width = 2048;
		spotLight.shadow.mapSize.height = 2048;

		spotLight.target.position.set(0, 95, lights[i].position.z);

		scene.add(spotLight);
		scene.add(spotLight.target);
	}
}

function loadModels(callback) {
	function load(index) {
		if (index >= modelParams.length) {
			callback();
			return;
		}

		var param = modelParams[index];

		loader.loadModel(param.file, function(object) {
			var mesh = object;
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			helper.add(mesh);
			helper.setPhysics(mesh);

			resetPosition();

			world = mesh.physics.world;

			scene.add(mesh);
			createGround();
			createBoxes();

			load(index + 1);
		}, onProgress, onError);
	}

	load(0);
}

function loadVmds(mesh, callback) {
	function load(index) {
		if (index >= motionParams.length) {
			callback();
			return;
		}

		var param = motionParams[index];

		loader.loadVmds(param.files, function(vmd) {
			loader.pourVmdIntoModel(mesh, vmd, param.name);

			load(index + 1);
		}, onProgress, onError);
	}

	load(0);
}

function loadVpds(mesh, callback) {
	function load(index) {
		if (index >= poseParams.length) {
			callback();
			return;
		}

		var param = poseParams[index];

		loader.loadVpd(param.file, function(vpd) {
			poses[param.name] = vpd;

			load(index + 1);
		}, onProgress, onError);
	}

	load(0);
}

function createRigidBody(size, weight, position) {
	var shape = new Ammo.btBoxShape(new Ammo.btVector3(size[0], size[1], size[2]));
	var localInertia = new Ammo.btVector3(0, 0, 0);
	shape.calculateLocalInertia(weight, localInertia);

	var form = new Ammo.btTransform();
	form.setIdentity();
	form.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));

	var state = new Ammo.btDefaultMotionState(form);
	var info = new Ammo.btRigidBodyConstructionInfo(weight, state, shape, localInertia);

	return new Ammo.btRigidBody(info);
}

function createGround() {
	loader.loadModel(stageFile, function (stage) {
		/*stage.position.y = -355.5;*/
		stage.castShadow = true;
		stage.receiveShadow = true;
		var body = createRigidBody([200, 94, 1000], 0, {x: stage.position.x, y: stage.position.y, z: stage.position.z});
		body.setRestitution(0.1);
		body.setFriction(100);
		body.setDamping(0, 0);
		body.setSleepingThresholds(0, 0);
		stage.receiveShadow = true;
		world.addRigidBody(body);

		scene.add(stage);
	}, onProgress, onError);
}

function createBoxes() {
	var geometry = new THREE.BoxBufferGeometry(40, 40, 40);
	var material = new THREE.MeshPhongMaterial({
		color: 0x444444
	});

	for (var i = 0; i < 1; i++) {
		for (var j = 0; j < 1; j++) {
			var mesh = new THREE.Mesh(geometry, material);
			mesh.position.x = -38 + i * 4;
			mesh.position.y = 114 + j * 4;
			mesh.position.z = 40;
			mesh.castShadow = true;

			var body = createRigidBody([20, 20, 20], 10.0, mesh.position);
			body.setSleepingThresholds(0, 0);
			world.addRigidBody(body);

			mesh.body = body;
			mesh.ammoTransform = new Ammo.btTransform();
			mesh.ammoQuaternion = new Ammo.btQuaternion(0, 0, 0, 0);

			boxes.push(mesh);
			scene.add(mesh);
		}
	}
}

function onWindowResize() {
	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
}

function update() {
	requestAnimationFrame(update);

	if (ready) {
		var delta = clock.getDelta();
		manageMove(delta);
		helper.animate(delta);
		updateBoxes();
		var mesh = helper.meshes[0];
		controls.target.set(mesh.position.x, mesh.position.y + 15, mesh.position.z);
	}
	controls.update();
	renderer.render(scene, camera);
}

function updateBoxes() {
	for (var i = 0, il = boxes.length; i < il; i++) {
		var box = boxes[i];
		var body = box.body;
		var form = box.ammoTransform;
		var q = box.ammoQuaternion;

		body.getMotionState().getWorldTransform(form);

		var o = form.getOrigin();
		form.getBasis().getRotation(q);

		box.position.set(o.x(), o.y(), o.z());
		box.quaternion.set(q.x(), q.y(), q.z(), q.w());
	}
}

function startMotion(mesh, key) {
	var name = key;
	mesh.mixer.clipAction(name).play();
	if (mesh.mixer.clipAction(name + 'Morph')) {
		mesh.mixer.clipAction(name + 'Morph').play();
	}
}

function stopMotion(mesh, key) {
	var name = key;
	mesh.mixer.clipAction(name).stop();
	if (mesh.mixer.clipAction(name + 'Morph')) {
		mesh.mixer.clipAction(name + 'Morph').stop();
	}
}

function startBlink(mesh) {
	mesh.mixer.clipAction('blinkMorph').play();
}

function stopBlink(mesh) {
	mesh.mixer.clipAction('blinkMorph').stop();
}

function startStanding(mesh) {
	var standing = mesh.mixer.clipAction('standing').play();
	standing.weight = 1.0;
}

function stopStanding(mesh) {
	mesh.mixer.clipAction('standing').stop();
}

function startWalking(mesh) {
	motionStatus.inStartWalking = true;
	motionStatus.inStopWalking = false;
	motionStatus.elapsedTimeSinceStartWalking = 0.0;
}

function startRunning(mesh) {
	motionStatus.inStartRunning = true;
	motionStatus.inStopRunning = false;
	motionStatus.elapsedTimeSinceStartRunning = 0.0;
}

function stopWalking(mesh) {
	motionStatus.inStartWalking = false;
	motionStatus.inStopWalking = true;
	motionStatus.elapsedTimeSinceStopWalking = 0.0;
}

function stopRunning(mesh) {
	motionStatus.inStartRunning = false;
	motionStatus.inStopRunning = true;
	motionStatus.elapsedTimeSinceStopRunning = 0.0;
}

function manageMove(delta) {
	var mesh = helper.meshes[0];

	var isMoving = motionStatus.inMovingForward || motionStatus.inMovingBackward;
	var isRotating = motionStatus.inRotatingLeft || motionStatus.inRotatingRight;

	var isWalking = motionStatus.inMovingForward || motionStatus.inMovingBackward;

	var isRunning = isWalking && motionStatus.runFlag;
	var standing = mesh.mixer.clipAction('standing');
	var action;

	if (isMoving) {
		var speed = (motionStatus.runFlag ? 0.63 : 0.12) * delta * 60;
		var dz = speed * Math.cos(motionStatus.direction);
		var dx = speed * Math.sin(motionStatus.direction);

		if (motionStatus.inMovingForward) {
			mesh.position.z += dz;
			mesh.position.x += dx;
		}
		if (motionStatus.inMovingBackward) {
			mesh.position.z -= dz;
			mesh.position.x -= dx;
		}
	}

	if (isRotating) {
		var dr = Math.PI * 2 / 360 * 5 * delta * 60;

		if (motionStatus.inRotatingLeft) {
			motionStatus.direction += dr;
			mesh.rotateY(dr);
		}

		if (motionStatus.inRotatingRight) {
			motionStatus.direction -= dr;
			mesh.rotateY(-dr);
		}
	}

	if (motionStatus.inStartWalking) {
		motionStatus.elapsedTimeSinceStartWalking += delta;
		action = mesh.mixer.clipAction('walk');
		action.weight += delta * 3;
		standing.weight -= delta * 3;

		if (action.weight > 1.0) {
			action.weight = 1.0;
			standing.weight = 0.0;
			motionStatus.inStartWalking = false;
		}
	}

	if (motionStatus.inStopWalking) {
		motionStatus.elapsedTimeSinceStopWalking += delta;
		action = mesh.mixer.clipAction('walk');
		action.weight -= delta * 2;
		if (!isMoving) {
			standing.weight += delta * 2;
		}

		if (action.weight < 0.0) {
			action.weight = 0.0;
			if (!isMoving) {
				standing.weight = 1.0;
			}
			motionStatus.inStopWalking = false;
		}
	}

	if (motionStatus.inStartRunning) {
		motionStatus.elapsedTimeSinceStartRunning += delta;
		action = mesh.mixer.clipAction('run');
		action.weight += delta * 4;
		standing.weight -= delta * 4;

		if (action.weight > 1.0) {
			action.weight = 1.0;
			standing.weight = 0.0;
			motionStatus.inStartRunning = false;
		}
	}

	if (motionStatus.inStopRunning) {
		motionStatus.elapsedTimeSinceStopRunning += delta;
		action = mesh.mixer.clipAction('run');
		action.weight -= delta * 3;
		if (!isMoving) {
			standing.weight += delta * 3;
		}

		if (action.weight < 0.0) {
			action.weight = 0.0;
			if (!isMoving) {
				standing.weight = 1.0;
			}
			motionStatus.inStopRunning = false;
		}
	}

	if (!motionStatus.inWalking && isWalking) {
		if (isRunning) {
			startRunning(mesh);
		}
		else {
			startWalking(mesh);
		}
	}

	if (motionStatus.inWalking && !isWalking) {
		stopWalking(mesh);

		if (motionStatus.inRunning) {
			stopRunning(mesh);
		}
	}

	if (motionStatus.inWalking && isWalking) {
		if (isRunning && !motionStatus.inRunning) {
			stopWalking(mesh);
			startRunning(mesh);
		}

		if (!isRunning && motionStatus.inRunning) {
			stopRunning(mesh);
			startWalking(mesh);
		}
	}

	motionStatus.inWalking = isWalking;
	motionStatus.inRunning = isRunning;
}

function interact() {
/*	var raysLength = rays.length;
	raycaster.setFromCamera( mouseVector, camera );
	console.log(raycaster.intersectObject(scene.children, false));*/
	var playerPos = helper.meshes[0].position;
	console.log(playerPos);
	var deltaX = npc[0].position.x - playerPos.x;
	var deltaY = npc[0].position.y - playerPos.y;
	var deltaZ = npc[0].position.z - playerPos.z;

	var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
	if (distance < 50) {
		console.log('Hey');
	}
}

/*function onMouseMove(e) {
	mouseVector.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouseVector.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}*/

function onKeydown(event) {
	if (!ready) {
		return;
	}

	switch (event.keyCode) {
        case 16: // shift
        motionStatus.runFlag = true;
        break;

        case 32: // space
        interact();
        break;

        case 37: // left
        motionStatus.inRotatingLeft = true;
        break;

        case 38: // up
        motionStatus.inMovingForward = true;
        break;

        case 39: // right
        motionStatus.inRotatingRight = true;
        break;

        case 40: // down
        motionStatus.inMovingBackward = true;
        break;

        default:
        break;
    }
}

function onKeyup(event) {
	if (!ready) {
		return;
	}
	switch (event.keyCode) {
        case 16: // shift
        motionStatus.runFlag = false;
        break;

        case 37: // left
        motionStatus.inRotatingLeft = false;
        break;

        case 38: // up
        motionStatus.inMovingForward = false;
        break;

        case 39: // right
        motionStatus.inRotatingRight = false;
        break;

        case 40: // down
        motionStatus.inMovingBackward = false;
        break;

        default:
        break;
    }
}


function resetPosition() {
	if (camera) {
		camera.position.copy(cameraParams[0].position);
		camera.up.set(0, 1, 0);
		camera.rotation.set(0, 0, 0);
	}

	if (helper && helper.meshes.length > 0) {
		var mesh = helper.meshes[0];
		mesh.position.copy(modelParams[0].position);

		motionStatus.direction = 0;
		mesh.rotation.set(0, 0, 0);

		if (mesh.physics) {
			mesh.updateMatrixWorld(true);
			mesh.physics.reset();
		}
	}
}