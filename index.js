const { Client, Intents, MessageEmbed } = require('discord.js')

require('dotenv').config()

const { checkCalendar } = require('./calendar/checkCalendar.js');
const { checkDay } = require('./day/checkDay.js')
const { checkTicket } = require('./ticket/checkTicket.js')

const { htmlToMarkdown, formatDate } = require('./format.js')

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS] });

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
            .setURL(generateLinkURL(ticket))
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
                
                
                member.send({ embeds: [embed] }).catch(error => {
                    console.error(`Impossible d'envoyer un DM à ${member.user.tag}.`, error);
                });
            });
    });
}

function generateLinkURL(ticket) {
    const url = `https://tickets.rolandgarros.com/fr/ticket/categorie?date=${ticket.date}&offerId=${ticket.offerId}&sessionIds=${ticket.sessionIds[0]}&sessionTypes=${ticket.sessionType}&court=${ticket.court}&dateDescription=${encodeURIComponent(ticket.dateDescription)}&offerType=${ticket.offerType}`;
    return url
}

client.login(process.env.TOKEN_ID);