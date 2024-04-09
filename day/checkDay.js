const fs = require('fs').promises;
const { getDay } = require('./getDay.js');

async function checkDay(changesCalendar) {
    let changesDayFromFalseToTrue = []
    let changesDayFromTrueToTrue = []
    for (const change of changesCalendar) {
        if (change.from === false && change.to === true) {
            // Changement de false à true
            console.log(`Nouveaux billets disponibles le ${change.date}. Vérification des types de billets...`);
            await getDay(change.date);
            let data = await fs.readFile('JSON/disponibiliteDay.json', 'utf8');
            // Parse le contenu en objet JavaScript
            const dataForDate = JSON.parse(data)[change.date];
            if (dataForDate && dataForDate.isOfferTypeAvailable) {
                // Parcours chaque offre pour vérifier 'isAvailable'
                dataForDate.offers.forEach((offer) => {
                if (offer.isAvailable) {
                    // console.log(`Offre disponible: ${change.date}`);
                    
                    // Ajoute les détails de l'offre au tableau changesDayFromFalseToTrue
                    changesDayFromFalseToTrue.push({
                        date: change.date,
                        round: change.round,
                        court: offer.court,
                        offerId: offer.offerId,
                        offerTitle: offer.title,
                        offerType: offer.offerType,
                        offerDetails: offer.sessions[0].longDescription, // Ajoute d'autres détails si nécessaire
                        sessionIds: offer.sessionIds,
                        minPrice: offer.minPrice,
                        imageUrl: offer.imageUrl,
                        sessionType: offer.sessions[0].sessionType,
                        dateDescription: offer.sessions[0].dateLongDescription,
                    });
                }
            });

            }

        } else if (change.from === true && change.to === true) {
            // Changement de true à true
            console.log(`Billets toujours disponibles le ${change.date}. Vérification des nouveaux types de billets...`);

            let oldDataContent = await fs.readFile('JSON/disponibiliteDay.json', 'utf8');
            let oldData = JSON.parse(oldDataContent)[change.date];
            await getDay(change.date);

            let newDataContent = await fs.readFile('JSON/disponibiliteDay.json', 'utf8')
            let newData = JSON.parse(newDataContent)[change.date];
            if (oldData && newData && newData.isOfferTypeAvailable) {
                newData.offers.forEach((newOffer) => {
                    const oldOffer = oldData.offers.find(offer => offer.offerId === newOffer.offerId);
        
                    // Vérifie les conditions et ajoute les changements au tableau
                    if (oldOffer && !oldOffer.isAvailable && newOffer.isAvailable) {
                        // De false à true
                        changesDayFromTrueToTrue.push({
                            date: change.date,
                            round: change.round,
                            court: newOffer.court,
                            offerId: newOffer.offerId,
                            offerTitle: newOffer.title,
                            offerType: newOffer.offerType,
                            offerDetails: newOffer.sessions[0].longDescription, // Ajoute d'autres détails si nécessaire
                            sessionIds: newOffer.sessionIds,
                            minPrice: newOffer.minPrice,
                            imageUrl: newOffer.imageUrl,
                            sessionType: newOffer.sessions[0].sessionType,
                            dateDescription: newOffer.sessions[0].dateLongDescription,
                            from: false,
                            to: true
                        });
                    } else if (oldOffer && oldOffer.isAvailable && newOffer.isAvailable) {
                        // De true à true
                        changesDayFromTrueToTrue.push({ 
                            date: change.date,
                            round: change.round,
                            court: newOffer.court,
                            offerId: newOffer.offerId,
                            offerTitle: newOffer.title,
                            offerType: newOffer.offerType,
                            offerDetails: newOffer.sessions[0].longDescription, // Ajoute d'autres détails si nécessaire
                            sessionIds: newOffer.sessionIds,
                            minPrice: newOffer.minPrice,
                            imageUrl: newOffer.imageUrl,
                            sessionType: newOffer.sessions[0].sessionType,
                            dateDescription: newOffer.sessions[0].dateLongDescription,
                            from: true,
                            to: true
                        });
                    }
                });
            }
        }
    }
    // console.log('Changements pour les jours passés de false à true:', changesDayFromFalseToTrue);
    // console.log('Changements pour les jours passés de true à true:', changesDayFromTrueToTrue);

    return {
        changesDayFromFalseToTrue, 
        changesDayFromTrueToTrue
    };
}

module.exports = {
    checkDay
}