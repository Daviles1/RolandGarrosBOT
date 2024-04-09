function htmlToMarkdown(html) {
    // Convertit les <br> en sauts de ligne
    let markdown = html.replace(/<br\s*\/?>/gi, '\n');

    // Supprime les balises <u> (Discord ne supporte pas le soulignement)
    markdown = markdown.replace(/<\/?u>/gi, '');

    // Remplace les <span> en texte brut, en ignorant les styles
    markdown = markdown.replace(/<\/?span[^>]*>/gi, '');

    // Remplace &amp; par &
    markdown = markdown.replace(/&amp;/gi, '&');

    // Supprime les autres balises HTML restantes
    markdown = markdown.replace(/<\/?[^>]+(>|$)/gi, '');

    // Nettoie les doubles sauts de ligne
    markdown = markdown.replace(/\n\n+/g, '\n\n');

    // Trim les espaces et sauts de ligne en trop
    markdown = markdown.trim();

    return markdown;
}

function formatDate(dateString) {
    // Crée un objet Date à partir de la chaîne de date
    const date = new Date(dateString);

    // Options pour toLocaleDateString()
    const options = { year: 'numeric', month: 'long', day: 'numeric' };

    // Formate la date en français, ajuste selon la langue souhaitée
    const formattedDate = date.toLocaleDateString('fr-FR', options);

    return formattedDate;
}

module.exports = {
    htmlToMarkdown,
    formatDate,
}