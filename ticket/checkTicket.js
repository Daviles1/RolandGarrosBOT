const fs = require('fs').promises;
const { getTicket } = require('./getTicket.js');

async function checkTicket(changesDayFromFalseToTrue, changesDayFromTrueToTrue) {
    let finalChanges = [];
    for (const change of changesDayFromFalseToTrue) {
        await getTicket(change.offerId, change.date, change.sessionIds[0], change.round);
        let data = await fs.readFile('JSON/disponibiliteTicket.json', 'utf8');
        // Parse le contenu en objet JavaScript
        const dataForTickets = JSON.parse(data)[change.date][change.round];
        dataForTickets.forEach(ticket => {
            if (ticket.hasStock) {
                finalChanges.push({
                    date: change.date, 
                    round: change.round,
                    court: change.court,
                    offerId: change.offerId,
                    offerDetails: change.offerDetails,
                    imageUrl: change.imageUrl,
                    sessionIds: change.sessionIds,
                    sessionType: change.sessionType,
                    offerType: change.offerType,
                    dateDescription: change.dateDescription,
                    price: ticket.price,
                    color: ticket.color,
                    longName: ticket.longName,
                    priceId: ticket.priceId,
                    categorie: ticket.code,
                })
            }
        })
    }
    for (const change of changesDayFromTrueToTrue) {
        if (change.from === false && change.to === true) {
            await getTicket(change.offerId, change.date, change.sessionIds[0], change.round);
            let data = await fs.readFile('JSON/disponibiliteTicket.json', 'utf8');
            // Parse le contenu en objet JavaScript
            const dataForTickets = JSON.parse(data)[change.date][change.round];
            dataForTickets.forEach(ticket => {
                if (ticket.hasStock) {
                    finalChanges.push({
                        date: change.date, 
                        round: change.round,
                        court: change.court,
                        offerId: change.offerId,
                        offerDetails: change.offerDetails,
                        imageUrl: change.imageUrl,
                        sessionIds: change.sessionIds,
                        sessionType: change.sessionType,
                        offerType: change.offerType,
                        dateDescription: change.dateDescription,
                        price: ticket.price,
                        color: ticket.color,
                        longName: ticket.longName,
                        priceId: ticket.priceId,
                        categorie: ticket.code
                    })
                }
            })
        } else if (change.from === true && change.to === true) {
            let oldDataContent = await fs.readFile('JSON/disponibiliteTicket.json', 'utf8');
            let oldData = JSON.parse(oldDataContent)?.[change.date]?.[change.round];
            if (!oldData) {
                oldData = null
            }

            await getTicket(change.offerId, change.date, change.sessionIds[0], change.round);

            let newDataContent = await fs.readFile('JSON/disponibiliteTicket.json', 'utf8')
            let newData = JSON.parse(newDataContent)[change.date][change.round];
            if (oldData && newData) {
                newData.forEach((newTicket) => {
                    const oldTicket = oldData.find(ticket => ticket.priceId === newTicket.priceId);
                    if (oldTicket && !oldTicket.hasStock && newTicket.hasStock) {
                        finalChanges.push({
                            date: change.date, 
                            round: change.round,
                            court: change.court,
                            offerId: change.offerId,
                            offerDetails: change.offerDetails,
                            imageUrl: change.imageUrl,
                            sessionIds: change.sessionIds,
                            sessionType: change.sessionType,
                            offerType: change.offerType,
                            dateDescription: change.dateDescription,
                            price: newTicket.price,
                            color: newTicket.color,
                            longName: newTicket.longName,
                            priceId: newTicket.priceId,
                            categorie: newTicket.code
                        })
                    }
                })
            }
            
        }
    }

    console.log("\nChangements finaux: ", finalChanges);

    return finalChanges;
}

module.exports = {
    checkTicket
}