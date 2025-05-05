// Données pour graphiques
let chartData = {
    ph: [],
    temperature: [],
    ammonia: [],
    nitrite: [],
    nitrate: [],
    oxygen: [],
    conductivity: [],
    hardness: [],
    alkalinity: [],
    turbidity: [],
    light: [],
    fish: [],
    plant: [],
    flow: [],
};

// Chart.js instances
let charts = {};

// Facteurs d’efficacité
function getPhFactor(ph) {
    // Optimal à 6.5-7.5, diminue en dehors
    if (ph < 6.5) return 1 - (6.5 - ph) / 3;
    if (ph > 7.5) return 1 - (ph - 7.5) / 3;
    return 1;
}

function getTempFactor(temp) {
    // Optimal à 20-28°C, diminue en dehors
    if (temp < 20) return 1 - (20 - temp) / 10;
    if (temp > 28) return 1 - (temp - 28) / 10;
    return 1;
}

function getFlowFactor(flow) {
    // Optimal à 500-1000 L/h, diminue en dehors
    if (flow < 500) return flow / 500;
    if (flow > 1000) return 1000 / flow;
    return 1;
}

function getLightFactor(light) {
    // Optimal à 12-16 h/jour, diminue en dehors
    if (light < 12) return light / 12;
    if (light > 16) return 16 / light;
    return 1;
}

function getWaterQualityFactor(ammonia, nitrite) {
    // Pénalité si NH₃ > 0.1 ou NO₂ > 0.1
    let factor = 1;
    if (ammonia > 0.1) factor *= 1 - (ammonia - 0.1) / 0.9;
    if (nitrite > 0.1) factor *= 1 - (nitrite - 0.1) / 0.9;
    return Math.max(0.1, factor);
}

// Initialisation des graphiques
function initCharts() {
    const ctx = {
        ph: document.getElementById('chart-ph').getContext('2d'),
        temperature: document.getElementById('chart-temperature').getContext('2d'),
        ammonia: document.getElementById('chart-ammonia').getContext('2d'),
        nitrite: document.getElementById('chart-nitrite').getContext('2d'),
        nitrate: document.getElementById('chart-nitrate').getContext('2d'),
        oxygen: document.getElementById('chart-oxygen').getContext('2d'),
        conductivity: document.getElementById('chart-conductivity').getContext('2d'),
        hardness: document.getElementById('chart-hardness').getContext('2d'),
        alkalinity: document.getElementById('chart-alkalinity').getContext('2d'),
        turbidity: document.getElementById('chart-turbidity').getContext('2d'),
        light: document.getElementById('chart-light').getContext('2d'),
        fish: document.getElementById('chart-fish').getContext('2d'),
        plant: document.getElementById('chart-plant').getContext('2d'),
        flow: document.getElementById('chart-flow').getContext('2d'),
    };

    const scales = {
        ph: { min: 5.5, max: 8.5 },
        temperature: { min: 15, max: 35 },
        ammonia: { min: 0, max: 1 },
        nitrite: { min: 0, max: 1 },
        nitrate: { min: 0, max: 50 },
        oxygen: { min: 4, max: 10 },
        conductivity: { min: 0, max: 5 },
        hardness: { min: 50, max: 400 },
        alkalinity: { min: 50, max: 300 },
        turbidity: { min: 0, max: 10 },
        light: { min: 0, max: 24 },
        fish: { min: 0, max: 10 },
        plant: { min: 0, max: 10 },
        flow: { min: 100, max: 2000 },
    };

    for (const key in ctx) {
        charts[key] = new Chart(ctx[key], {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: key.charAt(0).toUpperCase() + key.slice(1),
                    data: chartData[key],
                    borderColor: '#00a6a6',
                    fill: false,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        min: scales[key].min,
                        max: scales[key].max,
                    },
                },
            },
        });
    }
}

// Simulation
let isRunning = false;
let time = 0;

function updateSimulation() {
    if (!isRunning) return;

    // Constantes basées sur la littérature aquaponique
    const k_ammoniac = 0.001; // mg/L par poisson par kg par jour
    const k_nitrosomonas = 0.9; // Taux de conversion NH₃ → NO₂
    const k_nitrobacter = 0.95; // Taux de conversion NO₂ → NO₃
    const k_plantes = 0.1; // mg/L de NO₃ consommé par kg de plantes
    const k_fish_growth = 0.01; // kg/jour
    const k_plant_growth = 0.015; // kg/jour
    const k_oxygen_temp = 0.1; // mg/L par °C au-dessus de 20°C
    const k_oxygen_flow = 0.002; // mg/L par L/h
    const DO_max = 9; // mg/L, oxygène max à 20°C

    // Facteurs d’efficacité
    const f_ph = getPhFactor(systemState.plantes.ph);
    const f_temp = getTempFactor(systemState.poissons.temperature);
    const f_flow = getFlowFactor(systemState.circuit_eau.flow);
    const f_light = getLightFactor(systemState.plantes.light);
    const f_water_quality = getWaterQualityFactor(systemState.poissons.ammonia, systemState.biofiltre.nitrite);

    // 1. Ammoniac produit par les poissons
    const ammonia_produced = k_ammoniac * systemState.poissons.fishCount * systemState.poissons.fishGrowth;
    systemState.poissons.ammonia += ammonia_produced;

    // 2. Conversion ammoniac → nitrites
    const ammonia_converted = k_nitrosomonas * systemState.poissons.ammonia * f_ph * f_temp * f_flow;
    systemState.poissons.ammonia -= ammonia_converted;
    systemState.biofiltre.nitrite += ammonia_converted;

    // 3. Conversion nitrites → nitrates
    const nitrite_converted = k_nitrobacter * systemState.biofiltre.nitrite * f_ph * f_temp * f_flow;
    systemState.biofiltre.nitrite -= nitrite_converted;
    systemState.biofiltre.nitrate += nitrite_converted;

    // 4. Absorption des nitrates par les plantes
    const nitrate_consumed = k_plantes * systemState.plantes.plantGrowth * f_light * f_ph;
    systemState.biofiltre.nitrate -= nitrate_consumed;

    // 5. Croissance des poissons
    systemState.poissons.fishGrowth += k_fish_growth * f_temp * f_water_quality * systemState.poissons.oxygen / 8;

    // 6. Croissance des plantes
    systemState.plantes.plantGrowth += k_plant_growth * systemState.biofiltre.nitrate / 20 * f_light * f_ph;

    // 7. Oxygène dissous
    systemState.poissons.oxygen = DO_max - k_oxygen_temp * (systemState.poissons.temperature - 20) + k_oxygen_flow * systemState.circuit_eau.flow;

    // 8. pH (légère baisse due à la nitrification)
    systemState.plantes.ph -= 0.01 * (1 - systemState.circuit_eau.alkalinity / 200);

    // 9. Conductivité (proportionnelle aux nitrates)
    systemState.circuit_eau.conductivity = 1 + systemState.biofiltre.nitrate / 20;

    // 10. Dureté et alcalinité (légère variation)
    systemState.circuit_eau.hardness += (Math.random() - 0.5) * 0.5;
    systemState.circuit_eau.alkalinity += (Math.random() - 0.5) * 0.5;

    // 11. Turbidité (augmente avec poissons, diminue avec débit)
    systemState.circuit_eau.turbidity += 0.01 * systemState.poissons.fishCount - 0.005 * systemState.circuit_eau.flow / 500;

    // 12. Luminosité et débit (entrées utilisateur, varient légèrement)
    systemState.plantes.light += (Math.random() - 0.5) * 0.05;
    systemState.circuit_eau.flow += (Math.random() - 0.5) * 5;

    // 13. Nombre de poissons (variation lente)
    systemState.poissons.fishCount += Math.round((Math.random() - 0.5) * 0.1);

    // Limites réalistes
    systemState.poissons.fishCount = Math.max(1, Math.min(50, systemState.poissons.fishCount));
    systemState.plantes.ph = Math.max(5.5, Math.min(8.5, systemState.plantes.ph));
    systemState.poissons.temperature = Math.max(15, Math.min(35, systemState.poissons.temperature));
    systemState.poissons.ammonia = Math.max(0, Math.min(1, systemState.poissons.ammonia));
    systemState.biofiltre.nitrite = Math.max(0, Math.min(1, systemState.biofiltre.nitrite));
    systemState.biofiltre.nitrate = Math.max(0, Math.min(50, systemState.biofiltre.nitrate));
    systemState.poissons.oxygen = Math.max(4, Math.min(10, systemState.poissons.oxygen));
    systemState.circuit_eau.conductivity = Math.max(0, Math.min(5, systemState.circuit_eau.conductivity));
    systemState.circuit_eau.hardness = Math.max(50, Math.min(400, systemState.circuit_eau.hardness));
    systemState.circuit_eau.alkalinity = Math.max(50, Math.min(300, systemState.circuit_eau.alkalinity));
    systemState.circuit_eau.turbidity = Math.max(0, Math.min(10, systemState.circuit_eau.turbidity));
    systemState.plantes.light = Math.max(0, Math.min(24, systemState.plantes.light));
    systemState.poissons.fishGrowth = Math.max(0, Math.min(10, systemState.poissons.fishGrowth));
    systemState.plantes.plantGrowth = Math.max(0, Math.min(10, systemState.plantes.plantGrowth));
    systemState.circuit_eau.flow = Math.max(100, Math.min(2000, systemState.circuit_eau.flow));

    // Mise à jour des données
    chartData.ph.push(systemState.plantes.ph);
    chartData.temperature.push(systemState.poissons.temperature);
    chartData.ammonia.push(systemState.poissons.ammonia);
    chartData.nitrite.push(systemState.biofiltre.nitrite);
    chartData.nitrate.push(systemState.biofiltre.nitrate);
    chartData.oxygen.push(systemState.poissons.oxygen);
    chartData.conductivity.push(systemState.circuit_eau.conductivity);
    chartData.hardness.push(systemState.circuit_eau.hardness);
    chartData.alkalinity.push(systemState.circuit_eau.alkalinity);
    chartData.turbidity.push(systemState.circuit_eau.turbidity);
    chartData.light.push(systemState.plantes.light);
    chartData.fish.push(systemState.poissons.fishGrowth);
    chartData.plant.push(systemState.plantes.plantGrowth);
    chartData.flow.push(systemState.circuit_eau.flow);

    // Limiter les données à 50 points
    for (const key in chartData) {
        if (chartData[key].length > 50) {
            chartData[key].shift();
            charts[key].data.labels.shift();
        }
        charts[key].data.labels.push(time);
        charts[key].update();
    }

    time++;
    if (typeof updateReport === 'function') {
        updateReport();
    } else {
        console.warn('updateReport is not defined');
    }
    setTimeout(updateSimulation, 1000);
}

function startSimulation() {
    isRunning = true;
    updateSimulation();
}

function pauseSimulation() {
    isRunning = false;
}

// Initialisation
initCharts();
if (typeof updateReport === 'function') {
    updateReport();
} else {
    console.warn('updateReport is not defined at initialization');
}