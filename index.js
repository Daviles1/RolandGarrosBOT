const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js')
const { MongoClient } = require('mongodb');

require('dotenv').config()

const { checkCalendar } = require('./calendar/checkCalendar.js');
const { checkDay } = require('./day/checkDay.js')
const { checkTicket } = require('./ticket/checkTicket.js')

const  { addToCart } = require('./cart/addToCart.js');

const { htmlToMarkdown, formatDate } = require('./format.js')

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS] });

const mongoUri = "mongodb+srv://David:" + process.env.PASSWORD + "@clusterdiscord.uqld2dy.mongodb.net/?retryWrites=true&w=majority&appName=ClusterDiscord"; // Assurez-vous que MONGO_URI est défini dans votre fichier .env
const DBclient = new MongoClient(mongoUri);

async function connectDb() {
    try {
        await DBclient.connect();
        const database = DBclient.db("ClusterDiscord");
        const cookies = database.collection("cookies");
        const sessions = database.collection("sessions");
        console.log("Connected to MongoDB");
        return {cookies, sessions};
    } catch (e) {
        console.error("Could not connect to MongoDB", e);
        return  [];
    }
}


const categoryToRoleMap = {
    'LOG': 'loge',
    'Cat. OR': 'catégorie Or',
    'Cat.1': 'catégorie 1',
    'Cat.2': 'catégorie 2',
    'Cat.3': 'catégorie 3',
    'Cat. VR': 'visibilité réduite',
    'ANN': 'court annexe',
    'ANN 1/2': 'court annexe'
};

const roundToRoleMap = {
    'Opening Week': 'Opening Week',
    'Journée Y. Noah': 'Journée Y. Noah',
    '1er Tour': '1er-4e tour',
    '2e Tour': '1er-4e tour',
    '3e Tour': '1er-4e tour',
    '4e Tour': '1er-4e tour',
    '1/4 Finales': '1/4 Finales',
    '1/2 Finales': '1/2 Finales',
    'Finales': 'Finales',
};


client.once('ready', () => {
    console.log('\nLe bot est prêt ! Début du programme....\n');
    start();
    setInterval(() => {
        start().catch(console.error);
    }, 60000);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const priceId = interaction.customId.split('_')[1];
    const userId = interaction.user.id;

    // Appeler l'API pour enregistrer l'ID du produit
    fetch('https://rolandgarrosbot-09a83b535625.herokuapp.com/api/save-product-id', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userId,
            priceId
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('API Response:', data);
    })
    .catch(error => {
        console.error('Failed to save product ID:', error);
    });

    if (interaction.customId.startsWith('addToCart_')) {
        try {
            const {cookies, sessions} = await connectDb();
            const cartUrl = 'https://tickets.rolandgarros.com/fr/ticket/panier'

            const productId = {
                quantity: 1,
                priceId: interaction.customId.split('_')[1],
                zoneId: null, 
                isVoucher: false
            }
            await addToCart(interaction.user.id, productId, cookies);
            // Réinitialiser le flag après l'ajout au panier
            await sessions.updateOne({ userId }, { $unset: { cartIntent: ""} });
            await interaction.reply({ content: `L'article a été ajouté à votre panier. [Voir le panier](${cartUrl})`, ephemeral: true });
        } catch (error) {
            console.error('Erreur lors de l\'ajout au panier:', error);
            if (error.message === "NotEnoughTickets") {
                await interaction.reply({
                    content: "Le billet que vous essayez d'ajouter n'existe plus ou n'est plus en stock",
                    ephemeral: true
                })
            } else {
                await interaction.reply({
                    content: "Il semble que votre session ait expiré ou que vos cookies ne soient plus valides. Veuillez vous reconnecter à Roland Garros pour que nous puissions mettre à jour votre session.",
                    components: [getLoginButton()],
                    ephemeral: true
                });
            }
        }
    }
});

async function start() {
    const guild = client.guilds.cache.get('1158822915266068601');
    if (!guild) {
        console.error('Guilde non trouvée. Vérifiez que l\'ID de la guilde est correct et que le bot a accès à la guilde.');
        return;
    }

    // Obtient la référence au salon "général" en utilisant son ID
    const generalChannel = guild.channels.cache.get('1226926099381092452');
    if (!generalChannel) {
        console.error('Salon général non trouvé. Vérifiez que l\'ID du salon est correct.');
        return;
    }

    try {
        const fetchedMembers = await guild.members.fetch();
        console.log(`${fetchedMembers.size} membres fetchés. Il y a donc 2 bots et ${fetchedMembers.size-2} utilisateurs sur le serveur.\n`);
    } catch (error) {
        console.error('Erreur lors du fetching des membres:', error);
    }

    let changesCalendar = await checkCalendar();
    let {changesDayFromFalseToTrue, changesDayFromTrueToTrue} = await checkDay(changesCalendar); 
    let finalChanges = await checkTicket(changesDayFromFalseToTrue, changesDayFromTrueToTrue);

    // Pour chaque billet détecté
    finalChanges.forEach(ticket => {
        const roundRoleName = roundToRoleMap[ticket.round]; // Utilise le mappage pour obtenir le nom du rôle Discord
        const categoryRoleName = categoryToRoleMap[ticket.categorie]; // Utilise le mappage pour obtenir le nom du rôle Discord

        const roundRole = guild.roles.cache.find(role => role.name === roundRoleName);
        const categoryRole = guild.roles.cache.find(role => role.name === categoryRoleName);

        if (!roundRole || !categoryRole) {
            console.error(`L'un des rôles requis n'a pas été trouvé : Round - ${roundRoleName}, Catégorie - ${categoryRoleName}`);
            return;
        }

        // Filtre les membres qui ont les deux rôles
        const usersToNotify = guild.members.cache.filter(member =>
            member.roles.cache.has(roundRole.id) && member.roles.cache.has(categoryRole.id)
        );

        
        usersToNotify.forEach(member => {
            if (member.user.bot) return; // Ignorer les bot
            
            // Envoie une notification à chaque utilisateur filtré
            console.log(`Envoi du message pour le billet ${ticket.round}, Catégorie: ${ticket.categorie} le ${ticket.date} à ${member}`)

            const embed = new MessageEmbed()
            .setTitle(`Nouveau billet disponible !`)
            .setDescription(htmlToMarkdown(ticket.offerDetails))
            .addFields(
                {name: 'Round', value: ticket.round, inline: true},
                {name: 'Catégorie', value: ticket.categorie, inline: true },
                {name: 'Date', value: formatDate(ticket.date), inline: true},
                {name: 'Prix', value: `${ticket.price} €`, inline: true}
                )
            .setThumbnail(ticket.imageUrl)
            .setColor(ticket.color) // Utilise une couleur correspondant à ton thème
            .setTimestamp();
                
            // Création du bouton
            const button = new MessageButton()
                .setCustomId(`addToCart_${ticket.priceId}`) // Identifiant unique pour reconnaître ce bouton lorsqu'il est cliqué
                .setLabel('Ajouter au Panier') // Texte affiché sur le bouton
                .setStyle('PRIMARY') // Style du bouton (PRIMARY, SECONDARY, SUCCESS, DANGER, ou LINK)

            // Création d'une ligne d'actions pour ajouter le bouton
            const row = new MessageActionRow()
                .addComponents(button);

                member.send({ embeds: [embed], components: [row] }).catch(error => {
                    console.error(`Impossible d'envoyer un DM à ${member.user.tag}.`, error);
                });
            });
    });
}

function getLoginButton() {
    const row = new MessageActionRow();
    const button = new MessageButton()
        .setLabel('Se connecter à Roland Garros')
        .setStyle('LINK')
        .setURL('https://tickets.rolandgarros.com/fr');  // Assurez-vous que l'URL est correcte

    row.addComponents(button);
    return row;
}

module.exports = {
    client
}