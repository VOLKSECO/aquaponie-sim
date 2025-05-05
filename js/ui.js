// État du système
let systemState = {
    poissons: {
        fishCount: 10, // unités
        temperature: 24, // °C
        ammonia: 0.1, // mg/L
        oxygen: 7, // mg/L
        fishGrowth: 2, // kg
    },
    biofiltre: {
        nitrite: 0.05, // mg/L
        nitrate: 20, // mg/L
    },
    plantes: {
        ph: 7, // pH
        light: 14, // h/jour
        plantGrowth: 1.5, // kg
    },
    circuit_eau: {
        conductivity: 2, // mS/cm
        hardness: 150, // ppm
        alkalinity: 120, // ppm
        turbidity: 2, // échelle qualitative
        flow: 750, // L/h
    },
};

// Définition des modules et paramètres
const modules = {
    poissons: {
        name: 'Réservoir à poissons',
        image: 'assets/poissons.svg',
        variables: [
            { id: 'fishCount', label: 'Nombre de poissons', unit: 'unités', min: 1, max: 50, step: 1, description: 'Nombre de poissons, idéal 10-20. Plus de poissons = plus d’ammoniac.' },
            { id: 'temperature', label: 'Température', unit: '°C', min: 15, max: 35, step: 0.1, description: 'Température de l’eau, idéale 20-28°C pour poissons et bactéries.' },
            { id: 'ammonia', label: 'Ammoniac (NH₃)', unit: 'mg/L', min: 0, max: 1, step: 0.01, description: 'Déchet des poissons, toxique >0.1 mg/L.' },
            { id: 'oxygen', label: 'Oxygène dissous (DO)', unit: 'mg/L', min: 4, max: 10, step: 0.1, description: 'Oxygène, idéal 6-8 mg/L pour poissons.' },
            { id: 'fishGrowth', label: 'Croissance des poissons', unit: 'kg', min: 0, max: 10, step: 0.01, description: 'Poids des poissons, dépend de l’eau propre.' },
        ],
        description: 'Contient les poissons qui produisent des déchets riches en ammoniac, convertis par le biofiltre.'
    },
    biofiltre: {
        name: 'Biofiltre',
        image: 'assets/biofiltre.svg',
        variables: [
            { id: 'nitrite', label: 'Nitrites (NO₂)', unit: 'mg/L', min: 0, max: 1, step: 0.01, description: 'Toxiques, doivent être convertis en nitrates.' },
            { id: 'nitrate', label: 'Nitrates (NO₃)', unit: 'mg/L', min: 0, max: 50, step: 0.1, description: 'Nutriments pour plantes, idéal 10-30 mg/L.' },
        ],
        description: 'Convertit l’ammoniac en nitrites puis nitrates, selon pH, température, et débit.'
    },
    plantes: {
        name: 'Bacs de plantes',
        image: 'assets/plantes.svg',
        variables: [
            { id: 'ph', label: 'pH', unit: '', min: 5.5, max: 8.5, step: 0.1, description: 'Acidité, idéale 6.5-7.5 pour plantes et bactéries.' },
            { id: 'light', label: 'Luminosité', unit: 'h/jour', min: 0, max: 24, step: 0.1, description: 'Lumière, idéale 12-16 h/jour pour plantes.' },
            { id: 'plantGrowth', label: 'Croissance des plantes', unit: 'kg', min: 0, max: 10, step: 0.01, description: 'Poids des plantes, dépend des nitrates.' },
        ],
        description: 'Les plantes absorbent les nitrates pour croître, purifiant l’eau.'
    },
    circuit_eau: {
        name: 'Circuit d’eau',
        image: 'assets/circuit_eau.svg',
        variables: [
            { id: 'conductivity', label: 'Conductivité (EC)', unit: 'mS/cm', min: 0, max: 5, step: 0.01, description: 'Mesure des nutriments, idéale 1-3 mS/cm.' },
            { id: 'hardness', label: 'Dureté (GH)', unit: 'ppm', min: 50, max: 400, step: 1, description: 'Dureté, idéale 100-300 ppm.' },
            { id: 'alkalinity', label: 'Alcalinité (KH)', unit: 'ppm', min: 50, max: 300, step: 1, description: 'Stabilise le pH, idéale 100-200 ppm.' },
            { id: 'turbidity', label: 'Turbidité', unit: '', min: 0, max: 10, step: 0.1, description: 'Clarté de l’eau, doit être faible.' },
            { id: 'flow', label: 'Débit d’eau', unit: 'L/h', min: 100, max: 2000, step: 10, description: 'Débit, idéal 500-1000 L/h pour oxygène et nutriments.' },
        ],
        description: 'Circule l’eau, transporte nutriments et oxygène.'
    },
};

function renderModules() {
    const modulesDiv = document.getElementById('modules');
    modulesDiv.innerHTML = '';

    for (const moduleId in modules) {
        const module = modules[moduleId];
        const vcard = document.createElement('div');
        vcard.className = 'vcard';
        vcard.id = moduleId;

        vcard.innerHTML = `
            <div class="vcard-image">
                <object data="${module.image}" type="image/svg+xml"></object>
            </div>
            <h2>${module.name}</h2>
            <div class="variables"></div>
            <button class="edit-btn">Modifier</button>
            <button class="validate-btn" style="display: none;">Valider</button>
        `;

        modulesDiv.appendChild(vcard);
        updateVariables(moduleId);
    }
}

function updateVariables(moduleId) {
    const module = modules[moduleId];
    const vcard = document.getElementById(moduleId);
    const variablesDiv = vcard.querySelector('.variables');
    variablesDiv.innerHTML = '';

    module.variables.forEach((variable) => {
        const div = document.createElement('div');
        const value = systemState[moduleId][variable.id];
        div.innerHTML = `
            <div class="view-mode">${variable.label}: ${value.toFixed(2)} ${variable.unit}</div>
            <div class="edit-mode">
                <label for="${moduleId}-${variable.id}">${variable.label}</label>
                <div class="slider-container">
                    <input type="range" id="${moduleId}-${variable.id}" value="${value}" min="${variable.min}" max="${variable.max}" step="${variable.step}">
                    <span class="slider-value">${value.toFixed(2)} ${variable.unit}</span>
                </div>
                <p>${variable.description}</p>
            </div>
        `;
        variablesDiv.appendChild(div);

        // Mettre à jour la valeur affichée en temps réel
        const input = div.querySelector(`#${moduleId}-${variable.id}`);
        const valueDisplay = div.querySelector('.slider-value');
        input.addEventListener('input', () => {
            valueDisplay.textContent = `${parseFloat(input.value).toFixed(2)} ${variable.unit}`;
        });
    });

    vcard.querySelector('.edit-btn').addEventListener('click', () => {
        vcard.classList.add('edit');
        vcard.querySelector('.edit-btn').style.display = 'none';
        vcard.querySelector('.validate-btn').style.display = 'block';
    });

    vcard.querySelector('.validate-btn').addEventListener('click', () => {
        module.variables.forEach((variable) => {
            const input = document.getElementById(`${moduleId}-${variable.id}`);
            systemState[moduleId][variable.id] = parseFloat(input.value);
        });
        vcard.classList.remove('edit');
        vcard.querySelector('.edit-btn').style.display = 'block';
        vcard.querySelector('.validate-btn').style.display = 'none';
        updateVariables(moduleId);
        updateReport();
    });
}

function updateReport() {
    const rapportContent = document.getElementById('rapport-content');
    rapportContent.innerHTML = '<h3>Valeurs actuelles des paramètres</h3>';

    const params = [
        { label: 'Nombre de poissons', value: systemState.poissons.fishCount, unit: 'unités', ideal: '10-20' },
        { label: 'pH', value: systemState.plantes.ph, unit: '', ideal: '6.5-7.5' },
        { label: 'Température', value: systemState.poissons.temperature, unit: '°C', ideal: '20-28' },
        { label: 'Ammoniac (NH₃)', value: systemState.poissons.ammonia, unit: 'mg/L', ideal: '0' },
        { label: 'Nitrites (NO₂)', value: systemState.biofiltre.nitrite, unit: 'mg/L', ideal: '0' },
        { label: 'Nitrates (NO₃)', value: systemState.biofiltre.nitrate, unit: 'mg/L', ideal: '10-30' },
        { label: 'Oxygène dissous (DO)', value: systemState.poissons.oxygen, unit: 'mg/L', ideal: '6-8' },
        { label: 'Conductivité (EC)', value: systemState.circuit_eau.conductivity, unit: 'mS/cm', ideal: '1-3' },
        { label: 'Dureté (GH)', value: systemState.circuit_eau.hardness, unit: 'ppm', ideal: '100-300' },
        { label: 'Alcalinité (KH)', value: systemState.circuit_eau.alkalinity, unit: 'ppm', ideal: '100-200' },
        { label: 'Turbidité', value: systemState.circuit_eau.turbidity, unit: '', ideal: 'Faible' },
        { label: 'Luminosité', value: systemState.plantes.light, unit: 'h/jour', ideal: '12-16' },
        { label: 'Croissance des poissons', value: systemState.poissons.fishGrowth, unit: 'kg', ideal: '0-10' },
        { label: 'Croissance des plantes', value: systemState.plantes.plantGrowth, unit: 'kg', ideal: '0-10' },
        { label: 'Débit d’eau', value: systemState.circuit_eau.flow, unit: 'L/h', ideal: '500-1000' },
    ];

    params.forEach((param) => {
        const p = document.createElement('p');
        p.className = 'param';
        p.innerHTML = `${param.label}: ${param.value.toFixed(2)} ${param.unit} (Idéal: ${param.ideal})`;
        rapportContent.appendChild(p);
    });
}

function updateExplanations() {
    const explicationsContent = document.getElementById('explications-content');
    explicationsContent.innerHTML = '';

    for (const moduleId in modules) {
        const module = modules[moduleId];
        const p = document.createElement('p');
        p.innerHTML = `<strong>${module.name}</strong>: ${module.description}`;
        explicationsContent.appendChild(p);
    }
}

function initSvgInteractions() {
    const svgObject = document.getElementById('schema-svg');
    if (!svgObject) {
        console.warn('SVG object not found');
        return;
    }
    svgObject.addEventListener('load', () => {
        const svgDoc = svgObject.contentDocument;
        if (!svgDoc) {
            console.warn('SVG document not loaded');
            return;
        }
        for (const moduleId in modules) {
            const element = svgDoc.getElementById(moduleId);
            if (element) {
                element.style.cursor = 'pointer';
                element.addEventListener('click', () => {
                    const target = document.getElementById(moduleId);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                    } else {
                        console.warn(`Element with ID ${moduleId} not found in DOM`);
                    }
                });
            } else {
                console.warn(`Element with ID ${moduleId} not found in SVG`);
            }
        }
    });
}

// Initialisation
renderModules();
updateExplanations();
updateReport();
initSvgInteractions();