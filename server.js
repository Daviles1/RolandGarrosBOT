const express = require('express');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
app.use(express.json());

const { addToCart } = require('./cart/addToCart.js')

const { client } = require('./index.js');

const mongoUri = "mongodb+srv://David:" + process.env.PASSWORD + "@clusterdiscord.uqld2dy.mongodb.net/?retryWrites=true&w=majority&appName=ClusterDiscord"; // Assurez-vous que MONGO_URI est défini dans votre fichier .env
const DBclient = new MongoClient(mongoUri);

async function connectDb() {
    try {
        await DBclient.connect();
        console.log("Connected to MongoDB");
    } catch (e) {
        console.error("Could not connect to MongoDB", e);
    }
}

app.post('/api/cookies', async (req, res) => {
    console.log("Received body for /api/cookies:", req.body); // Log pour diagnostiquer
    const { userId, cookie, fromLogin } = req.body;
    try {
        connectDb();
        const database = DBclient.db("ClusterDiscord");
        const cookies = database.collection("cookies");
        const sessions = database.collection("sessions");

        // Vérifiez d'abord si le document existe
        const existingCookie = await cookies.findOne({ userId: userId, 'cookies.name': cookie.name });
        
        if (existingCookie) {
            // Si le cookie existe, mettez à jour
            const result = await cookies.updateOne(
                { userId: userId, 'cookies.name': cookie.name },
                { $set: { 'cookies.$': cookie } }
            );
            res.json({ message: "Cookie updated", result: result });
        } else {
            // Si le cookie n'existe pas, ajoutez-le
            const result = await cookies.updateOne(
                { userId: userId },
                { $push: { cookies: cookie } },
                { upsert: true }
            );
            res.json({ message: "Cookie inserted", result: result });
        }

        // Si la mise à jour vient d'une reconnexion, exécutez addToCart
        if (fromLogin) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            const session = await sessions.findOne({ userId });
            if (session && session.productId && session.cartIntent) {
                await addToCart(userId, session.productId, cookies);
            }
            // Réinitialiser le flag après l'ajout au panier
            await sessions.updateOne({ userId }, { $unset: { cartIntent: "" } });
        }

    } catch (error) {
        console.error("Failed to update cookie:", error);
        if (error.message === "NotEnoughTickets") {
            connectDb();
            const database = DBclient.db("ClusterDiscord");
            const sessions = database.collection("sessions");
            await sessions.updateOne({ userId }, { $unset: { cartIntent: "" } });
        }
    }
});

app.post('/api/save-product-id', async (req, res) => {
    console.log("Received body for /api/save-product-id:", req.body); // Log pour diagnostiquer
    const { userId, priceId } = req.body;
    try {
        connectDb();
        const database = DBclient.db("ClusterDiscord");
        const sessions = database.collection("sessions");

        const productId = {
            quantity: 1,
            priceId: priceId,
            zoneId: null, 
            isVoucher: false
        }

        // Stocker ou mettre à jour l'ID du produit pour cet utilisateur
        await sessions.updateOne(
            { userId },
            { $set: { productId: productId, cartIntent: true } },
            { upsert: true }
        );

        res.json({ message: "Product ID saved successfully." });
    } catch (error) {
        console.error("Failed to save product ID:", error);
        res.status(500).json({ error: "Failed to save product ID" });
    }
});



app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});

client.login(process.env.TOKEN_ID);