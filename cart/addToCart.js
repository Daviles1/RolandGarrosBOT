const axios = require('axios');
require('dotenv').config();

async function getUserCookies(userId, cookies) {
    const user = await cookies.findOne({ userId: userId });
    return user ? user.cookies : null;
}

function cleanCookies(cookieString) {
    // Remplacer les retours à la ligne et les retours chariot
    return cookieString.replace(/[\r\n]/g, '');
}

async function addToCart(userId, productId, cookies) {
        const cookiesOfUser = await getUserCookies(userId, cookies);
        if (!cookiesOfUser) {
            console.log("No valid cookies. User needs to re-login.");
            throw new Error("NoValidCookies");  // Lancer une erreur personnalisée
        }
    
        // Use these cookies to make a request to the Roland Garros site
        // Example: You might need to use a library like axios and set the `Cookie` header
        const cookieHeader = cookiesOfUser.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
        const cleanedCookieHeader = cleanCookies(cookieHeader);
    
        try {
            const response = await axios.post('https://tickets.rolandgarros.com/api/v2/ticket/cart/ticket-products', productId, {
                headers : {
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Encoding': 'gzip, deflate, br, zstd',
                    'Accept-Language': 'fr,fr-FR;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
                    'Cookie': cleanedCookieHeader,
                    'Content-Type': 'application/json',
                    'Origin': 'https://tickets.rolandgarros.com',
                    'Priority': 'u=1, i',
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
                    }
            });
            console.log('Added to cart:', response.data);
        } catch (error) {
            console.error('Failed to add to cart:', error);
            if (error.response.data === 'product.insufficient.availability') {
                throw new Error("NotEnoughTickets");  // Lancer une erreur personnalisée
            } else {
                throw new Error("NoValidCookies");
            }
        }
}

module.exports = {
    addToCart
}