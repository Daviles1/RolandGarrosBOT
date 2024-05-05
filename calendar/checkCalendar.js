const fs = require('fs');
const { getCalendar } = require('./getCalendar.js');

async function checkCalendar() {
    let initialData = JSON.parse(fs.readFileSync('JSON/disponibiliteCalendar.json', 'utf8'));

    // Attend que getCalendar() termine la mise à jour
    await getCalendar(); 

    let updatedData = JSON.parse(fs.readFileSync('JSON/disponibiliteCalendar.json', 'utf8'));

    let changes = [];

    if (isEmptyObject(initialData)) {
        console.log("L'ancien fichier JSON est vide. Aucune comparaison n'est effectuée.");
        return;
    }

    updatedData.rounds.forEach((updatedRound) => {
        updatedRound.days.forEach((updatedDay) => {
            const initialRound = initialData.rounds.find(round => round.name === updatedRound.name);
            if (initialRound) {
                const initialDay = initialRound.days.find(day => day.date === updatedDay.date);
                if (initialDay && ((!initialDay.available && updatedDay.available) || 
                         (initialDay.available && updatedDay.available))) {
                    changes.push({
                        date: updatedDay.date,
                        round: updatedRound.name,
                        from: initialDay.available,
                        to: updatedDay.available
                    });
                }
            }
        });
    });

    if (changes.length > 0) {
        console.log("Changements de disponibilité détectés pour les jours suivants :", changes);
    } else {
        console.log("Aucun changement de disponibilité détecté.");
    }

    return changes;
}

function isEmptyObject(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}


module.exports = {
    checkCalendar
};

