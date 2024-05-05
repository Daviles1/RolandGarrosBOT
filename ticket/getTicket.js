const axios = require('axios');
const fs = require('fs').promises;

require('dotenv').config();

async function getTicket(offerId, date, sessionId, round) {
    const headers = {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'fr,fr-FR;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
        'Cookie': process.env.COOKIE,
        'Sec-Ch-Device-Memory': '8',
        'Sec-Ch-Ua': '"Microsoft Edge";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
        'Sec-Ch-Ua-Arch': '"x86"',
        'Sec-Ch-Ua-Full-Version-List': '"Microsoft Edge";v="123.0.2420.65", "Not:A-Brand";v="8.0.0.0", "Chromium";v="123.0.6312.87"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Model': '""',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0',
    };
    try {
        // Lis et parse le contenu actuel du fichier
        const currentDataContent = await fs.readFile('JSON/disponibiliteTicket.json', 'utf8');
        let currentData = JSON.parse(currentDataContent || '{}'); 

        const response = await axios.get(`https://tickets.rolandgarros.com/api/v2/fr/ticket/category/page/offer/${offerId}/date/${date}/sessions/${sessionId}?nightSession=false`, { headers: headers })
        const newData = response.data.categories;

        // Assure-toi que currentData[date] est initialisé comme un objet avant d'assigner une valeur à une sous-clé
        if (!currentData[date]) {
            currentData[date] = {}; // Initialise currentData[date] comme un objet s'il n'existe pas déjà
        }     
    
        // Écrit la chaîne JSON dans un fichier de manière asynchrone
        currentData[date][round] = newData;
        await fs.writeFile('JSON/disponibiliteTicket.json', JSON.stringify(currentData, null, 2), 'utf8');
        console.log(`Fichier disponibiliteTicket.json complété avec succès pour Date: ${date},Round: ${round}`);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    catch (error) {
        // Gestion des erreurs
        console.error('Erreur lors de la requête ou de l\'écriture du fichier:', error);
    }
}

module.exports = {
    getTicket
}