const fs = require('fs');
const path = require('path');

class TranslationManager {
    constructor(options = {}) {
        this.translations = new Map();
        this.defaultLocale = options.defaultLocale || 'en';
        this.dir = options.translationsDir || path.join(__dirname, '../translations');
        this.logger = options.logger || console;
        
        this.loadTranslations();
    }

    /**
     * Charge tous les fichiers JSON du dossier de traduction
     */
    loadTranslations() {
        try {
            const files = fs.readdirSync(this.dir).filter(f => f.endsWith('.json'));
            for (const file of files) {
                const locale = file.replace('.json', '');
                const content = fs.readFileSync(path.join(this.dir, file), 'utf-8');
                this.translations.set(locale, JSON.parse(content));
            }
            this.logger.info(`[i18n] ${this.translations.size} langues chargées.`);
        } catch (error) {
            this.logger.error(`[i18n] Erreur chargement: ${error.message}`);
        }
    }

    /**
     * Récupère une traduction
     * @param {string} path Chemin (ex: 'messages.GUILD_COOLDOWN')
     * @param {Object} replace Variables à remplacer (ex: { cooldown: 5 })
     * @param {string} locale Langue forcée
     */
    translate(path, replace = {}, locale = this.defaultLocale) {
        let content = this._getNestedProperty(this.translations.get(locale), path);

        // Fallback sur la langue par défaut si non trouvé
        if (!content && locale !== this.defaultLocale) {
            content = this._getNestedProperty(this.translations.get(this.defaultLocale), path);
        }

        if (!content) return path; // Retourne la clé si rien n'est trouvé

        // Remplacement des variables %variable%
        Object.entries(replace).forEach(([key, value]) => {
            content = content.replace(new RegExp(`%${key}%`, 'g'), value);
        });

        return content;
    }

    /**
     * Helper pour naviguer dans l'objet JSON avec un string "a.b.c"
     */
    _getNestedProperty(obj, path) {
        return path.split('.').reduce((prev, curr) => {
            return prev ? prev[curr] : null;
        }, obj);
    }
}

module.exports = TranslationManager;