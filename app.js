"use strict";

/*
 * AI.SW 부천연합해커톤 오후 프로젝트 스타터
 *
 * 이 파일의 예시 기능은 실행 환경 확인용입니다.
 * 프로젝트 기획이 승인되면 팀의 핵심 기능으로 교체하세요.
 *
 * 작업 원칙:
 * 1. 한 번에 기능 하나만 구현합니다.
 * 2. AI가 수정한 내용을 두 팀원이 함께 확인합니다.
 * 3. 실행하고 테스트한 뒤 커밋합니다.
 * 4. 개인정보나 API 키를 코드에 입력하지 않습니다.
 */

const slider = document.querySelector("#emission-slider");
const emissionValue = document.querySelector("#emission-value");
const temperatureValue = document.querySelector("#temperature-value");
const seaLevelValue = document.querySelector("#sea-level-value");
const coachMessage = document.querySelector("#coach-message");
const riskLabel = document.querySelector("#risk-label");
const riskScore = document.querySelector("#risk-score");
const riskDot = document.querySelector("#risk-dot");

function updateSimulation() {
  const emissions = Number(slider.value);
  const temperature = 0.8 + emissions * 0.044;
  const seaLevel = 10 + emissions;
  const score = Math.round(emissions * 2);
  let risk = "안정 단계";
  let message = "현재 배출량은 안정적인 수준입니다. 지속 가능한 생활 방식을 유지해 보세요.";

  if (emissions >= 35) {
    risk = "위험 수준";
    message = "현재 배출량은 위험 수준입니다. 재생에너지 사용을 늘리면 예상 온도 상승을 줄일 수 있습니다.";
  } else if (emissions >= 20) {
    risk = "주의 단계";
    message = "배출량을 조금만 낮춰도 미래의 온도 상승과 해수면 변화를 의미 있게 줄일 수 있습니다.";
  }

  emissionValue.textContent = emissions.toFixed(1);
  temperatureValue.firstChild.textContent = `+${temperature.toFixed(1)}`;
  seaLevelValue.firstChild.textContent = `+${Math.round(seaLevel)}`;
  riskLabel.textContent = risk;
  riskScore.textContent = `${score}%`;
  coachMessage.textContent = message;
  riskDot.className = `risk-dot ${emissions >= 35 ? "is-danger" : emissions >= 20 ? "is-warning" : "is-safe"}`;

  if (window.earthMaterial) {
    const climateColor = new THREE.Color(0x2563eb).lerp(new THREE.Color(0xef4444), emissions / 50);
    window.earthMaterial.color.copy(climateColor);
  }
}

function createEarth() {
  const sceneTarget = document.querySelector("#earth-scene");
  if (!window.THREE || !sceneTarget) {
    sceneTarget.textContent = "3D 지구를 불러오는 중입니다.";
    return;
  }

  const scene = new THREE.Scene();
  const skyboxLoader = new THREE.CubeTextureLoader();
  skyboxLoader.setPath("https://threejs.org/examples/textures/cube/MilkyWay/");
  scene.background = skyboxLoader.load([
    "dark-s_px.jpg",
    "dark-s_nx.jpg",
    "dark-s_py.jpg",
    "dark-s_ny.jpg",
    "dark-s_pz.jpg",
    "dark-s_nz.jpg",
  ]);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.z = 3.2;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  sceneTarget.appendChild(renderer.domElement);

  const textureLoader = new THREE.TextureLoader();
  const textureBase = "https://threejs.org/examples/textures/planets/";
  const earthTexture = textureLoader.load(`${textureBase}earth_atmos_2048.jpg`);
  const earthNormal = textureLoader.load(`${textureBase}earth_normal_2048.jpg`);
  const earthSpecular = textureLoader.load(`${textureBase}earth_specular_2048.jpg`);
  const cloudTexture = textureLoader.load(`${textureBase}earth_clouds_1024.png`);
  [earthTexture, cloudTexture].forEach((texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
  });

  const earthMaterial = new THREE.MeshPhongMaterial({
    color: 0x2563eb,
    map: earthTexture,
    normalMap: earthNormal,
    normalScale: new THREE.Vector2(0.55, 0.55),
    specularMap: earthSpecular,
    specular: new THREE.Color(0x789cc4),
    shininess: 24,
  });
  window.earthMaterial = earthMaterial;
  const globe = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 96), earthMaterial);
  scene.add(globe);

  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(1.012, 64, 64),
    new THREE.MeshPhongMaterial({ map: cloudTexture, transparent: true, opacity: 0.58, depthWrite: false })
  );
  scene.add(clouds);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.075, 64, 64),
    new THREE.MeshPhongMaterial({ color: 0x49bff5, transparent: true, opacity: 0.18, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  scene.add(atmosphere);

  const starsGeometry = new THREE.BufferGeometry();
  const starPositions = [];
  for (let index = 0; index < 900; index += 1) {
    const radius = 8 + Math.random() * 12;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPositions.push(radius * Math.sin(phi) * Math.cos(theta), radius * Math.sin(phi) * Math.sin(theta), radius * Math.cos(phi));
  }
  starsGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
  scene.add(new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: 0xb8ddff, size: 0.035, sizeAttenuation: true, transparent: true, opacity: 0.82 })));

  scene.add(new THREE.AmbientLight(0x4c6680, 0.62));
  const keyLight = new THREE.DirectionalLight(0xfff4dc, 2.7);
  keyLight.position.set(-3, 2, 4);
  scene.add(keyLight);

  const controls = window.THREE.OrbitControls ? new THREE.OrbitControls(camera, renderer.domElement) : null;
  if (controls) {
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.minDistance = 2.2;
    controls.maxDistance = 5;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.55;
  }

  function resize() {
    const size = Math.min(sceneTarget.clientWidth, 500);
    renderer.setSize(size, size, false);
    camera.updateProjectionMatrix();
  }

  function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    else globe.rotation.y += 0.0025;
    clouds.rotation.y = globe.rotation.y * 1.08;
    renderer.render(scene, camera);
  }

  resize();
  window.addEventListener("resize", resize);
  animate();
}

slider.addEventListener("input", updateSimulation);
updateSimulation();
createEarth();

/*
 * TODO: 아래 순서로 팀 프로젝트를 구현하세요.
 *
 * 1. PROJECT_PLAN.md에 핵심 기능과 완료 기준을 작성합니다.
 * 2. index.html의 시연 영역을 프로젝트에 맞게 수정합니다.
 * 3. 사용자의 입력을 가져옵니다.
 * 4. 규칙 또는 데이터에 따라 결과를 계산합니다.
 * 5. 계산 결과와 판단 이유를 화면에 표시합니다.
 * 6. 정상 입력, 잘못된 입력, 경계값을 테스트합니다.
 * 7. TEST_CHECKLIST.md와 AI_LOG.md를 작성합니다.
 *
 * 규칙 기반 AI 예시:
 *
 * function makeRecommendation(score) {
 *   if (score >= 80) {
 *     return {
 *       result: "추천",
 *       reason: "안전 기준을 충분히 통과했습니다."
 *     };
 *   }
 *
 *   return {
 *     result: "다시 확인",
 *     reason: "사용자가 직접 검토할 항목이 남아 있습니다."
 *   };
 * }
 */
