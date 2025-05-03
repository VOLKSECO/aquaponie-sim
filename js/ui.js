// Définitions des modules et variables (adaptées pour une famille de 4 personnes)
const modules = {
    poissons: {
        title: 'Réservoir à poissons',
        variables: [
            {
                name: 'nombre_poissons',
                label: 'Nombre de poissons',
                type: 'number',
                default: 30,
                min: 10,
                max: 50,
                unit: 'unités',
                description: 'Nombre de poissons dans le réservoir (ex. tilapias). Chaque poisson produit des déchets (ammoniac) qui nourrissent les plantes. Trop de poissons peuvent polluer l’eau.'
            },
            {
                name: 'alimentation_jour',
                label: 'Alimentation par jour',
                type: 'number',
                default: 300,
                min: 100,
                max: 600,
                unit: 'g/jour',
                description: 'Quantité de nourriture donnée aux poissons chaque jour. Plus de nourriture augmente les déchets, mais favorise la croissance.'
            },
            {
                name: 'temperature_eau',
                label: 'Température de l’eau',
                type: 'number',
                default: 26,
                min: 20,
                max: 30,
                unit: '°C',
                description: 'Température de l’eau dans le réservoir. Les tilapias aiment 22-30°C. Une eau trop froide ou chaude peut stresser les poissons.'
            },
            {
                name: 'oxygenation',
                label: 'Oxygène dissous',
                type: 'number',
                default: 7,
                min: 4,
                max: 10,
                unit: 'mg/L',
                description: 'Quantité d’oxygène dans l’eau. Les poissons ont besoin de >5 mg/L pour être en bonne santé. Une pompe à air peut aider.'
            }
        ],
        explication: 'Le réservoir à poissons est l’endroit où vivent les poissons. Ils mangent, grandissent, et produisent des déchets (ammoniac) qui sont transformés en nutriments pour les plantes. <br><strong>Calcul :</strong> Ammoniac = 3% de la nourriture, Croissance = 40% de la nourriture.'
    },
    biofiltre: {
        title: 'Biofiltre',
        variables: [
            {
                name: 'surface_biofiltre',
                label: 'Surface du biofiltre',
                type: 'number',
                default: 1.5,
                min: 0.5,
                max: 3,
                unit: 'm²',
                description: 'Surface où les bactéries vivent pour transformer l’ammoniac en nitrates. Plus la surface est grande, plus la transformation est efficace.'
            },
            {
                name: 'debit_biofiltre',
                label: 'Débit du biofiltre',
                type: 'number',
                default: 1500,
                min: 500,
                max: 3000,
                unit: 'L/h',
                description: 'Vitesse à laquelle l’eau passe à travers le biofiltre. Un bon débit assure que les bactéries reçoivent assez de déchets à traiter.'
            }
        ],
        explication: 'Le biofiltre contient des bactéries qui convertissent l’ammoniac toxique (des poissons) en nitrates utiles pour les plantes. C’est le cœur du système. <br><strong>Calcul :</strong> Nitrification = 0.5 g/m²/jour * surface.'
    },
    plantes: {
        title: 'Bacs de plantes',
        variables: [
            {
                name: 'nombre_plantes',
                label: 'Nombre de plantes',
                type: 'number',
                default: 40,
                min: 20,
                max: 100,
                unit: 'unités',
                description: 'Nombre de plantes (ex. laitues, basilic) dans les bacs. Elles absorbent les nitrates pour grandir et nettoient l’eau.'
            },
            {
                name: 'type_culture',
                label: 'Type de culture',
                type: 'select',
                options: ['NFT', 'Radeau', 'Substrat'],
                default: 'NFT',
                unit: '',
                description: 'Méthode de culture. NFT (eau qui coule) est léger, Radeau (plantes flottantes) est simple, Substrat (graviers) est stable.'
            },
            {
                name: 'lumiere',
                label: 'Intensité lumineuse',
                type: 'number',
                default: 250,
                min: 100,
                max: 400,
                unit: 'µmol/m²/s',
                description: 'Quantité de lumière reçue par les plantes. 200-300 µmol/m²/s est idéal pour les laitues (lumière naturelle ou lampes LED).'
            }
        ],
        explication: 'Les plantes poussent dans des bacs en absorbant les nitrates de l’eau, ce qui la purifie pour les poissons. <br><strong>Calcul :</strong> Croissance = 0.01 * nombre de plantes * nitrates * lumière / 250.'
    },
    circuit_eau: {
        title: 'Circuit d’eau',
        variables: [
            {
                name: 'volume_eau',
                label: 'Volume d’eau',
                type: 'number',
                default: 1500,
                min: 1000,
                max: 3000,
                unit: 'L',
                description: 'Quantité totale d’eau dans le système (réservoir + circuit). Plus de volume stabilise la qualité de l’eau.'
            },
            {
                name: 'debit_eau',
                label: 'Débit d’eau',
                type: 'number',
                default: 3000,
                min: 1000,
                max: 5000,
                unit: 'L/h',
                description: 'Vitesse de circulation de l’eau dans le système. Un débit élevé assure un bon mélange des nutriments.'
            },
            {
                name: 'ajout_eau',
                label: 'Ajout d’eau',
                type: 'number',
                default: 15,
                min: 0,
                max: 50,
                unit: 'L/jour',
                description: 'Eau ajoutée chaque jour pour compenser l’évaporation et l’absorption par les plantes.'
            }
        ],
        explication: 'Le circuit d’eau transporte les déchets des poissons vers le biofiltre, puis les nutriments vers les plantes, avant de revenir aux poissons. <br><strong>Calcul :</strong> Perte d’eau = 1% du volume + 5% des plantes.'
    }
};

// Initialisation des vCards
function initVCards() {
    Object.keys(modules).forEach(moduleId => {
        const module = modules[moduleId];
        const variablesDiv = document.querySelector(`#${moduleId} .variables`);
        variablesDiv.innerHTML = ''; // Vider avant de remplir
        module.variables.forEach(variable => {
            const div = document.createElement('div');
            div.className = 'variable';
            div.innerHTML = `
                <div class="view-mode">${variable.label}: <span data-variable="${variable.name}">${systemState[moduleId][variable.name]}</span> ${variable.unit}</div>
                <div class="edit-mode" style="display: none;">
                    <label>${variable.label} (${variable.unit}):</label>
                    <p>${variable.description}</p>
                    ${variable.type === 'select' ? 
                        `<select data-module="${moduleId}" data-variable="${variable.name}">
                            ${variable.options.map(opt => `<option value="${opt}" ${opt === systemState[moduleId][variable.name] ? 'selected' : ''}>${opt}</option>`).join('')}
                        </select>` :
                        `<input type="number" data-module="${moduleId}" data-variable="${variable.name}" value="${systemState[moduleId][variable.name]}" min="${variable.min}" max="${variable.max}"/>`
                    }
                </div>
            `;
            variablesDiv.appendChild(div);
        });

        // Gestion des boutons Modifier/Valider
        const editBtn = document.querySelector(`#${moduleId} .edit-btn`);
        const validateBtn = document.querySelector(`#${moduleId} .validate-btn`);
        editBtn.addEventListener('click', () => toggleEdit(moduleId));
        validateBtn.addEventListener('click', () => toggleEdit(moduleId));
    });

    // Initialiser les explications
    const explicationsDiv = document.getElementById('explications-content');
    explicationsDiv.innerHTML = '';
    Object.values(modules).forEach(module => {
        const div = document.createElement('div');
        div.innerHTML = `<h3>${module.title}</h3><p>${module.explication}</p>`;
        explicationsDiv.appendChild(div);
    });

    // Initialiser le schéma interactif
    const svg = document.getElementById('schema-svg');
    svg.addEventListener('load', () => {
        const svgDoc = svg.contentDocument;
        Object.keys(modules).forEach(moduleId => {
            const element = svgDoc.getElementById(moduleId);
            if (element) {
                element.style.cursor = 'pointer';
                element.addEventListener('click', () => {
                    document.getElementById(moduleId).scrollIntoView({ behavior: 'smooth' });
                });
            }
        });
    });
}

// Basculer entre mode édition et affichage
function toggleEdit(moduleId) {
    const vcard = document.getElementById(moduleId);
    const isEditing = vcard.classList.toggle('edit');
    const editBtn = vcard.querySelector('.edit-btn');
    const validateBtn = vcard.querySelector('.validate-btn');
    editBtn.style.display = isEditing ? 'none' : 'inline-block';
    validateBtn.style.display = isEditing ? 'inline-block' : 'none';

    vcard.querySelectorAll('.variable').forEach(variable => {
        const viewMode = variable.querySelector('.view-mode');
        const editMode = variable.querySelector('.edit-mode');
        viewMode.style.display = isEditing ? 'none' : 'block';
        editMode.style.display = isEditing ? 'block' : 'none';
    });

    if (!isEditing) {
        // Sauvegarder les modifications
        vcard.querySelectorAll('input, select').forEach(input => {
            const moduleId = input.dataset.module;
            const variableName = input.dataset.variable;
            systemState[moduleId][variableName] = input.type === 'number' ? parseFloat(input.value) : input.value;
            const span = vcard.querySelector(`.variable span[data-variable="${variableName}"]`);
            if (span) {
                span.textContent = systemState[moduleId][variableName];
            }
        });
    }
}

// Initialiser l’interface
document.addEventListener('DOMContentLoaded', initVCards);