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

const emissionValue = document.querySelector("#emission-value");
const temperatureValue = document.querySelector("#temperature-value");
const seaLevelValue = document.querySelector("#sea-level-value");
const coachMessage = document.querySelector("#coach-message");
const riskLabel = document.querySelector("#risk-label");
const riskScore = document.querySelector("#risk-score");
const riskDot = document.querySelector("#risk-dot");
const sliders = [...document.querySelectorAll(".behavior-slider")];
const weights = { renewable: 0.15, transit: 0.09, forest: 0.12, recycle: 0.06, efficiency: 0.1, car: 0.12, flight: 0.1, industry: 0.16, meat: 0.05, fossil: 0.15 };

function updateSimulation() {
  const values = Object.fromEntries(sliders.map((input) => [input.dataset.key, Number(input.value)]));
  const reductionKeys = ["renewable", "transit", "forest", "recycle", "efficiency"];
  const pressureKeys = ["car", "flight", "industry", "meat", "fossil"];
  const reduction = reductionKeys.reduce((total, key) => total + values[key] * weights[key], 0);
  const pressure = pressureKeys.reduce((total, key) => total + values[key] * weights[key], 0);
  const reductionAverage = Math.round(reductionKeys.reduce((total, key) => total + values[key], 0) / 5);
  const pressureAverage = Math.round(pressureKeys.reduce((total, key) => total + values[key], 0) / 5);
  const emissions = Math.max(4, 18 + pressure - reduction * 0.82);
  const temperature = 0.55 + emissions * 0.052;
  const seaLevel = 6 + emissions * 1.12;
  const co2 = 360 + emissions * 2.25;
  const iceLoss = Math.max(3, emissions * 0.82 - reduction * 0.12);
  const score = Math.min(100, Math.round(emissions * 2.1));
  const isDanger = emissions >= 34;
  const isWarning = emissions >= 24;
  const risk = isDanger ? "위험 수준" : isWarning ? "주의 단계" : "안정 단계";
  const message = isDanger
    ? "자동차와 화석연료 사용이 높아 목표 온도를 초과합니다. 재생에너지와 대중교통을 함께 늘려보세요."
    : reductionAverage > pressureAverage
      ? "재생에너지와 산림 복원을 늘리면 1.5°C 목표에 가까워집니다."
      : "자동차와 산업 배출을 조금 낮추면 1.5°C 목표에 가까워질 수 있습니다.";

  document.querySelector("#reduce-total").textContent = `${reductionAverage}%`;
  document.querySelector("#increase-total").textContent = `${pressureAverage}%`;
  sliders.forEach((input) => {
    document.querySelector(`[data-value-for="${input.dataset.key}"]`).textContent = `${input.value}%`;
    const fillColor = input.classList.contains("reduce-slider") ? "#39bf75" : "#e65d58";
    const trackColor = input.classList.contains("reduce-slider") ? "rgba(116, 210, 158, .18)" : "rgba(239, 124, 115, .18)";
    input.style.background = `linear-gradient(90deg, ${fillColor} ${input.value}%, ${trackColor} ${input.value}%)`;
  });
  emissionValue.firstChild.textContent = emissions.toFixed(1);
  temperatureValue.firstChild.textContent = `+${temperature.toFixed(1)}`;
  seaLevelValue.firstChild.textContent = `+${Math.round(seaLevel)}`;
  document.querySelector("#co2-value").firstChild.textContent = Math.round(co2);
  document.querySelector("#ice-value").firstChild.textContent = Math.round(iceLoss);
  riskLabel.textContent = risk;
  riskScore.textContent = `${score}%`;
  coachMessage.textContent = message;
  riskDot.className = `risk-dot ${isDanger ? "is-danger" : isWarning ? "is-warning" : "is-safe"}`;
  document.querySelector("#planet-status").textContent = isDanger ? "HIGH PRESSURE" : isWarning ? "IN TRANSITION" : "BALANCED";

  if (window.earthMaterial) {
    const climateColor = new THREE.Color(0x2aa876).lerp(new THREE.Color(0xef5b4f), Math.min(emissions / 48, 1));
    window.earthMaterial.color.copy(climateColor);
    window.earthAtmosphere.material.color.copy(climateColor);
    window.earthAtmosphere.material.opacity = 0.12 + Math.min(emissions / 160, 0.26);
    window.earthClouds.material.opacity = 0.48 + Math.min(emissions / 180, 0.28);
    if (window.earthGlaciers) {
      const glacierScale = Math.max(0.42, 1 - iceLoss / 115);
      window.earthGlaciers.forEach((glacier) => glacier.scale.set(glacierScale, glacierScale, glacierScale));
      window.earthSea.material.opacity = 0.08 + Math.min(iceLoss / 260, 0.12);
      const seaScale = 1 + Math.min(iceLoss / 380, 0.08);
      window.earthSea.scale.setScalar(seaScale);
      const landScale = 1 - Math.min(iceLoss / 520, 0.06);
      window.earthGlobe.scale.setScalar(landScale);
    }
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
  window.earthGlobe = globe;

  const glacierMaterial = new THREE.MeshPhongMaterial({
    color: 0xe9f8ff,
    transparent: true,
    opacity: 0.92,
    shininess: 80,
  });
  const northGlacier = new THREE.Mesh(
    new THREE.SphereGeometry(1.009, 64, 32, 0, Math.PI * 2, 0, 0.34),
    glacierMaterial
  );
  const southGlacier = new THREE.Mesh(
    new THREE.SphereGeometry(1.009, 64, 32, 0, Math.PI * 2, Math.PI - 0.34, 0.34),
    glacierMaterial.clone()
  );
  scene.add(northGlacier, southGlacier);
  window.earthGlaciers = [northGlacier, southGlacier];

  const sea = new THREE.Mesh(
    new THREE.SphereGeometry(1.016, 64, 64),
    new THREE.MeshPhongMaterial({ color: 0x45b9d8, transparent: true, opacity: 0.1, side: THREE.FrontSide, depthWrite: false })
  );
  scene.add(sea);
  window.earthSea = sea;

  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(1.012, 64, 64),
    new THREE.MeshPhongMaterial({ map: cloudTexture, transparent: true, opacity: 0.58, depthWrite: false })
  );
  scene.add(clouds);
  window.earthClouds = clouds;

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.075, 64, 64),
    new THREE.MeshPhongMaterial({ color: 0x49bff5, transparent: true, opacity: 0.18, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  scene.add(atmosphere);
  window.earthAtmosphere = atmosphere;

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

sliders.forEach((input) => input.addEventListener("input", updateSimulation));
createEarth();
updateSimulation();

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
