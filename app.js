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
const actionNames = { renewable: "재생에너지", transit: "대중교통", forest: "산림 복원", recycle: "재활용", efficiency: "에너지 절약", car: "자동차 사용", flight: "비행기 이용", industry: "산업 배출", meat: "육류 소비", fossil: "화석연료 발전" };

function updateCoach(values, emissions, temperature, seaLevel, co2) {
  const pressureKeys = ["car", "flight", "industry", "meat", "fossil"];
  const reductionKeys = ["renewable", "transit", "forest", "recycle", "efficiency"];
  const pressureConcerns = pressureKeys.map((key) => ({ key, score: values[key] * weights[key] })).sort((a, b) => b.score - a.score);
  const reductionOpportunities = reductionKeys.map((key) => ({ key, score: (100 - values[key]) * weights[key] })).sort((a, b) => b.score - a.score);
  const recommendations = [...pressureConcerns.slice(0, 2).map(({ key }) => ({ key, type: "reduce", amount: 20 })), ...reductionOpportunities.slice(0, 2).map(({ key }) => ({ key, type: "increase", amount: 20 }))].sort((a, b) => weights[b.key] - weights[a.key]).slice(0, 3);
  const topConcerns = pressureConcerns.slice(0, 3).filter(({ score }) => score > 2).map(({ key }) => actionNames[key]);
  const factors = document.querySelector("#coach-factors");
  factors.innerHTML = topConcerns.map((name) => `<span>${name}</span>`).join("");
  if (!topConcerns.length) factors.innerHTML = "<span>배출 압력이 낮은 상태</span>";

  document.querySelector("#coach-recommendation-list").innerHTML = recommendations.map(({ key, type, amount }, index) => {
    const effect = weights[key] * amount * (type === "reduce" ? 1 : 0.82);
    const temperatureEffect = effect * 0.052;
    const seaEffect = effect * 1.12;
    return `<div class="recommendation-item"><span class="recommendation-rank">0${index + 1}</span><div><strong>${type === "reduce" ? `${actionNames[key]} 줄이기` : `${actionNames[key]} 늘리기`}</strong><small>${type === "reduce" ? "배출 압력 완화" : "감축 효과 확대"} · ${amount}%p 제안</small><em>CO₂ −${effect.toFixed(1)}Gt · 온도 −${temperatureEffect.toFixed(1)}°C · 해수면 −${Math.round(seaEffect)}cm</em></div></div>`;
  }).join("");

  const totalEffect = recommendations.reduce((total, { key, type, amount }) => total + weights[key] * amount * (type === "reduce" ? 1 : 0.82), 0);
  const forecastEmissions = Math.max(4, emissions - totalEffect);
  document.querySelector("#forecast-temperature").textContent = `−${(temperature - (0.55 + forecastEmissions * 0.052)).toFixed(1)}°C`;
  document.querySelector("#forecast-co2").textContent = `−${(co2 - (360 + forecastEmissions * 2.25)).toFixed(1)}Gt`;
  document.querySelector("#forecast-sea").textContent = `−${Math.round(seaLevel - (6 + forecastEmissions * 1.12))}cm`;
}

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
  coachMessage.textContent = `${risk}입니다. 현재 연간 배출량은 ${emissions.toFixed(1)}GtCO₂, 평균기온 상승 전망은 +${temperature.toFixed(1)}°C입니다. ${message}`;
  riskDot.className = `risk-dot ${isDanger ? "is-danger" : isWarning ? "is-warning" : "is-safe"}`;
  document.querySelector("#planet-status").textContent = isDanger ? "HIGH PRESSURE" : isWarning ? "IN TRANSITION" : "BALANCED";
  updateCoach(values, emissions, temperature, seaLevel, co2);

  if (window.earthMaterial) {
    const climateColor = new THREE.Color(0x2aa876).lerp(new THREE.Color(0xef5b4f), Math.min(emissions / 48, 1));
      window.earthMaterial.uniforms.climateTint.value.copy(climateColor);
      window.earthMaterial.userData.targetIceCoverage = Math.max(0.38, 1 - iceLoss / 115);
    const emissionLevel = Math.min(1, Math.max(0, (emissions - 4) / 44));
    window.earthMaterial.userData.targetSeaLevel = 0.74 - emissionLevel * 0.34;
    window.earthMaterial.userData.targetSeaIntensity = emissionLevel;
    window.earthAtmosphere.material.color.copy(climateColor);
    window.earthAtmosphere.material.opacity = 0.12 + Math.min(emissions / 160, 0.26);
    window.earthClouds.material.opacity = 0.48 + Math.min(emissions / 180, 0.28);
      window.earthGlobe.scale.setScalar(1);
  }
}

function createIceTexture(THREE) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#f9fdff");
  gradient.addColorStop(0.45, "#dcecf2");
  gradient.addColorStop(1, "#7eabbc");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let index = 0; index < 620; index += 1) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const radius = 4 + Math.random() * 34;
    const color = Math.random() > 0.52 ? "rgba(255,255,255,.18)" : "rgba(63,129,153,.12)";
    context.fillStyle = color;
    context.beginPath();
    context.ellipse(x, y, radius * 1.8, radius, Math.random() * Math.PI, 0, Math.PI * 2);
    context.fill();
  }

  context.lineCap = "round";
  for (let index = 0; index < 38; index += 1) {
    let x = Math.random() * canvas.width;
    let y = 90 + Math.random() * 340;
    context.beginPath();
    context.moveTo(x, y);
    context.strokeStyle = Math.random() > 0.35 ? "rgba(58,112,135,.48)" : "rgba(255,255,255,.58)";
    context.lineWidth = 1 + Math.random() * 2.5;
    for (let segment = 0; segment < 5; segment += 1) {
      x += 18 + Math.random() * 60;
      y += (Math.random() - 0.5) * 44;
      context.lineTo(x, y);
    }
    context.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function createEarth() {
  const sceneTarget = document.querySelector("#earth-scene");
  if (!window.THREE || !sceneTarget) {
    sceneTarget.textContent = "3D 지구를 불러오는 중입니다.";
    return;
  }

  const scene = new THREE.Scene();
  const planet = new THREE.Group();
  scene.add(planet);
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

  const iceTexture = createIceTexture(THREE);
  const earthMaterial = new THREE.ShaderMaterial({
    uniforms: {
      earthMap: { value: earthTexture },
      iceMap: { value: iceTexture },
      iceCoverage: { value: 1 },
      seaLevel: { value: 0.74 },
      seaIntensity: { value: 0 },
      climateTint: { value: new THREE.Color(0x2aa876) },
      lightDirection: { value: new THREE.Vector3(-0.45, 0.82, 0.9).normalize() },
    },
    vertexShader: `varying vec2 vUv; varying vec3 vNormal; void main() { vUv = uv; vNormal = normalize(normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying vec2 vUv; varying vec3 vNormal; uniform sampler2D earthMap; uniform sampler2D iceMap; uniform float iceCoverage; uniform float seaLevel; uniform float seaIntensity; uniform vec3 climateTint; uniform vec3 lightDirection; void main() { vec3 normal = normalize(vNormal); vec3 earthColor = texture2D(earthMap, vUv).rgb; vec3 iceTextureColor = texture2D(iceMap, vUv).rgb; float noise = texture2D(iceMap, vec2(vUv.x * 1.7, vUv.y * 1.25)).b; float northPolar = smoothstep(0.68, 0.94, vUv.y); float southPolar = smoothstep(0.68, 0.94, 1.0 - vUv.y); float northIrregular = smoothstep(0.28, 0.72, noise + (1.0 - vUv.y) * 0.22); float southIrregular = smoothstep(0.24, 0.62, noise * 0.8 + (1.0 - vUv.y) * 0.2); float northIce = northPolar * northIrregular * smoothstep(0.48, 0.94, iceCoverage); float southIce = southPolar * southIrregular * smoothstep(0.34, 0.9, iceCoverage); float iceMask = clamp(northIce + southIce, 0.0, 1.0); float landness = smoothstep(0.025, 0.16, earthColor.r - earthColor.b); float southernLatitude = 1.0 - vUv.y; float floodBoundary = smoothstep(seaLevel - 0.035, seaLevel + 0.035, southernLatitude); float floodMask = landness * floodBoundary; float shoreline = landness * (1.0 - smoothstep(0.0, 0.055, abs(southernLatitude - seaLevel))); vec3 shallowOcean = vec3(0.22, 0.8, 0.92); vec3 deepOcean = vec3(0.07, 0.46, 0.74); vec3 oceanColor = mix(shallowOcean, deepOcean, seaIntensity * 0.58); vec3 floodedLandColor = vec3(0.4, 0.521569, 0.607843); vec3 surfaceColor = mix(earthColor, floodedLandColor, floodMask * 0.96); vec3 shorelineColor = mix(floodedLandColor, oceanColor, 0.35); surfaceColor = mix(surfaceColor, shorelineColor, shoreline * 0.28); vec3 coldIce = mix(vec3(0.48, 0.7, 0.78), iceTextureColor, 0.74); surfaceColor = mix(surfaceColor, coldIce, iceMask); float light = 0.62 + 0.38 * max(dot(normal, normalize(lightDirection)), 0.0); float sparkle = pow(max(dot(reflect(-normalize(lightDirection), normal), vec3(0.0, 0.0, 1.0)), 0.0), 30.0) * iceMask; surfaceColor *= light; surfaceColor += vec3(0.24, 0.36, 0.42) * sparkle; surfaceColor = mix(surfaceColor, surfaceColor * climateTint, 0.08); gl_FragColor = vec4(surfaceColor, 1.0); }`,
  });
  earthMaterial.userData.targetIceCoverage = 1;
  earthMaterial.userData.targetSeaLevel = 0.74;
  earthMaterial.userData.targetSeaIntensity = 0;
  window.earthMaterial = earthMaterial;
  const globe = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 96), earthMaterial);
  planet.add(globe);
  window.earthGlobe = globe;
  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(1.012, 64, 64),
    new THREE.MeshPhongMaterial({ map: cloudTexture, transparent: true, opacity: 0.58, depthWrite: false })
  );
  clouds.renderOrder = 2;
  planet.add(clouds);
  window.earthClouds = clouds;

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.075, 64, 64),
    new THREE.MeshPhongMaterial({ color: 0x49bff5, transparent: true, opacity: 0.18, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  planet.add(atmosphere);
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

  let isDragging = false;
  let previousPointer = { x: 0, y: 0 };
  renderer.domElement.style.cursor = "grab";
  renderer.domElement.addEventListener("pointerdown", (event) => {
    isDragging = true;
    previousPointer = { x: event.clientX, y: event.clientY };
    renderer.domElement.setPointerCapture(event.pointerId);
    renderer.domElement.style.cursor = "grabbing";
  });
  renderer.domElement.addEventListener("pointermove", (event) => {
    if (!isDragging) return;
    const deltaX = event.clientX - previousPointer.x;
    const deltaY = event.clientY - previousPointer.y;
    planet.rotation.y += deltaX * 0.008;
    planet.rotation.x = Math.max(-0.55, Math.min(0.55, planet.rotation.x + deltaY * 0.004));
    previousPointer = { x: event.clientX, y: event.clientY };
  });
  const stopDragging = (event) => {
    isDragging = false;
    if (event.pointerId !== undefined && renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
    renderer.domElement.style.cursor = "grab";
  };
  renderer.domElement.addEventListener("pointerup", stopDragging);
  renderer.domElement.addEventListener("pointercancel", stopDragging);

  function resize() {
    const size = Math.min(sceneTarget.clientWidth, 500);
    renderer.setSize(size, size, false);
    camera.updateProjectionMatrix();
  }

  function animate() {
    requestAnimationFrame(animate);
    if (!isDragging) planet.rotation.y += 0.0025;
    clouds.rotation.y += 0.0008;
    if (window.earthMaterial) {
      const { uniforms, userData } = window.earthMaterial;
      uniforms.iceCoverage.value += (userData.targetIceCoverage - uniforms.iceCoverage.value) * 0.045;
      uniforms.seaLevel.value += (userData.targetSeaLevel - uniforms.seaLevel.value) * 0.045;
      uniforms.seaIntensity.value += (userData.targetSeaIntensity - uniforms.seaIntensity.value) * 0.045;
    }
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
