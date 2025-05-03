// État initial du système (adapté pour une famille de 4 personnes)
let systemState = {
    poissons: {
        nombre_poissons: 30, // 30 tilapias, ~0.5-1 kg chacun à maturité
        alimentation_jour: 300, // 300 g/jour (1-2% du poids total)
        temperature_eau: 26, // Idéal pour tilapia
        oxygenation: 7 // mg/L, bon pour la santé des poissons
    },
    biofiltre: {
        surface_biofiltre: 1.5, // m², suffisant pour 30 poissons
        debit_biofiltre: 1500 // L/h, circulation adéquate
    },
    plantes: {
        nombre_plantes: 40, // 40 laitues/basilic, ~2-3 m²
        type_culture: 'NFT', // Système courant pour domestique
        lumiere: 250 // µmol/m²/s, lumière artificielle ou naturelle
    },
    circuit_eau: {
        volume_eau: 1500, // L, taille raisonnable pour domestique
        debit_eau: 3000, // L/h, bonne circulation
        ajout_eau: 15 // L/jour, pour compenser l’évaporation
    },
    water_quality: {
        ammonia: 0, // mg/L, départ à 0
        nitrite: 0, // mg/L
        nitrate: 0, // mg/L
        pH: 7.0, // Neutre, idéal au démarrage
        oxygen: 7 // mg/L, aligné avec oxygenation
    }
};

// Données pour les graphiques
let timeData = [];
let ammoniaData = [];
let nitriteData = [];
let nitrateData = [];
let pHData = [];
let fishGrowthData = [];
let plantGrowthData = [];

let simulationRunning = false;
let time = 0;
let charts = {};

// Modèle de simulation
function updateSimulation() {
    if (!simulationRunning) return;

    const state = systemState;

    // Production d'ammoniac par les poissons
    const ammoniaProduction = state.poissons.alimentation_jour * 0.03; // 3% de la nourriture
    state.water_quality.ammonia += ammoniaProduction / state.circuit_eau.volume_eau;

    // Nitrification (ammoniac -> nitrite -> nitrate)
    const nitrificationRate = state.biofiltre.surface_biofiltre * 0.5 * (state.water_quality.pH > 6.5 ? 1 : 0.5);
    const ammoniaToNitrite = Math.min(state.water_quality.ammonia, nitrificationRate / state.circuit_eau.volume_eau);
    state.water_quality.ammonia -= ammoniaToNitrite;
    state.water_quality.nitrite += ammoniaToNitrite;

    const nitriteToNitrate = Math.min(state.water_quality.nitrite, nitrificationRate / state.circuit_eau.volume_eau);
    state.water_quality.nitrite -= nitriteToNitrate;
    state.water_quality.nitrate += nitriteToNitrate;

    // Absorption des nitrates par les plantes
    const nitrateUptake = state.plantes.nombre_plantes * 0.01 * (state.plantes.lumiere / 250);
    state.water_quality.nitrate = Math.max(0, state.water_quality.nitrate - nitrateUptake / state.circuit_eau.volume_eau);

    // Croissance des poissons et plantes
    const fishGrowth = state.poissons.alimentation_jour * 0.4 / state.poissons.nombre_poissons; // 40% convertis en biomasse
    const plantGrowth = nitrateUptake * 0.1; // Simplifié

    // Mise à jour du pH (simplifié)
    state.water_quality.pH -= ammoniaToNitrite * 0.01; // Nitrification acidifie légèrement
    state.water_quality.pH = Math.max(5, Math.min(9, state.water_quality.pH));

    // Mise à jour des données pour les graphiques
    timeData.push(time);
    ammoniaData.push(state.water_quality.ammonia);
    nitriteData.push(state.water_quality.nitrite);
    nitrateData.push(state.water_quality.nitrate);
    pHData.push(state.water_quality.pH);
    fishGrowthData.push(fishGrowth * state.poissons.nombre_poissons);
    plantGrowthData.push(plantGrowth * state.plantes.nombre_plantes);

    // Limiter les données pour éviter une surcharge
    if (timeData.length > 100) {
        timeData.shift();
        ammoniaData.shift();
        nitriteData.shift();
        nitrateData.shift();
        pHData.shift();
        fishGrowthData.shift();
        plantGrowthData.shift();
    }

    time += 1;
    updateCharts();
    updateRapport();

    // Continuer la simulation
    setTimeout(updateSimulation, 1000); // 1 jour = 1 seconde
}

function startSimulation() {
    simulationRunning = true;
    updateSimulation();
}

function pauseSimulation() {
    simulationRunning = false;
}

function updateRapport() {
    const rapport = `
        <p><strong>Rendement :</strong> Poissons : ${fishGrowthData.slice(-1)[0]?.toFixed(2) || 0} kg, Plantes : ${plantGrowthData.slice(-1)[0]?.toFixed(2) || 0} kg</p>
        <p><strong>Qualité de l’eau :</strong> Ammoniac : ${systemState.water_quality.ammonia.toFixed(2)} mg/L, Nitrites : ${systemState.water_quality.nitrite.toFixed(2)} mg/L, Nitrates : ${systemState.water_quality.nitrate.toFixed(2)} mg/L, pH : ${systemState.water_quality.pH.toFixed(2)}</p>
        <p><strong>Recommandations :</strong> ${systemState.water_quality.ammonia > 0.5 ? 'Réduisez l’alimentation ou augmentez le biofiltre.' : 'Système stable.'}</p>
    `;
    document.getElementById('rapport-content').innerHTML = rapport;
}

function initCharts() {
    const chartConfigs = [
        {
            id: 'chart-ammonia',
            label: 'Ammoniac (mg/L)',
            data: ammoniaData,
            color: 'red',
            yMin: 0,
            yMax: 2 // Plage réaliste pour ammoniac
        },
        {
            id: 'chart-nitrite',
            label: 'Nitrites (mg/L)',
            data: nitriteData,
            color: 'orange',
            yMin: 0,
            yMax: 1 // Plage réaliste pour nitrites
        },
        {
            id: 'chart-nitrate',
            label: 'Nitrates (mg/L)',
            data: nitrateData,
            color: 'green',
            yMin: 0,
            yMax: 50 // Plage réaliste pour nitrates
        },
        {
            id: 'chart-ph',
            label: 'pH',
            data: pHData,
            color: 'blue',
            yMin: 5,
            yMax: 9 // Plage réaliste pour pH
        },
        {
            id: 'chart-fish',
            label: 'Croissance Poissons (kg)',
            data: fishGrowthData,
            color: 'purple',
            yMin: 0,
            yMax: 20 // Plage pour 30 poissons
        },
        {
            id: 'chart-plant',
            label: 'Croissance Plantes (kg)',
            data: plantGrowthData,
            color: 'brown',
            yMin: 0,
            yMax: 50 // Plage pour 40 plantes
        }
    ];

    chartConfigs.forEach(config => {
        const ctx = document.getElementById(config.id).getContext('2d');
        charts[config.id] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: timeData,
                datasets: [{
                    label: config.label,
                    data: config.data,
                    borderColor: config.color,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { title: { display: true, text: 'Temps (jours)' } },
                    y: {
                        title: { display: true, text: config.label },
                        min: config.yMin,
                        max: config.yMax
                    }
                }
            }
        });
    });
}

function updateCharts() {
    charts['chart-ammonia'].data.labels = timeData;
    charts['chart-ammonia'].data.datasets[0].data = ammoniaData;
    charts['chart-nitrite'].data.labels = timeData;
    charts['chart-nitrite'].data.datasets[0].data = nitriteData;
    charts['chart-nitrate'].data.labels = timeData;
    charts['chart-nitrate'].data.datasets[0].data = nitrateData;
    charts['chart-ph'].data.labels = timeData;
    charts['chart-ph'].data.datasets[0].data = pHData;
    charts['chart-fish'].data.labels = timeData;
    charts['chart-fish'].data.datasets[0].data = fishGrowthData;
    charts['chart-plant'].data.labels = timeData;
    charts['chart-plant'].data.datasets[0].data = plantGrowthData;

    Object.values(charts).forEach(chart => chart.update());
}

// Initialiser les graphiques au chargement
document.addEventListener('DOMContentLoaded', initCharts);