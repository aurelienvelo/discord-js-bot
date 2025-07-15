const fs = require('fs');
const path = require('path');

class TranslationManager {
  constructor(options = {}) {
    this.options = {
      defaultLocale: 'fr',
      fallbackLocale: 'en',
      translationsDir: options.translationsDir
        ? path.resolve(options.translationsDir)
        : path.join(__dirname, 'translations'),
      strictMode: false,
      logMissingTranslations: true,
      caseSensitive: true,
      cacheEnabled: true,
      autoReload: false,
      logger: console,
      ...options
    };

    // Corrige le path
    this.options.translationsDir = path.resolve(this.options.translationsDir);

    // Stockage des traductions par locale
    this.translations = new Map();

    // Cache pour les performances
    this.cache = new Map();

    // Suivi des problèmes et statistiques
    this.missingTranslations = new Set();
    this.invalidTranslations = new Set();
    this.stats = {
      hits: 0,
      misses: 0,
      total: 0,
      errors: 0,
      filesLoaded: 0,
      lastReload: null
    };

    // Surveillant de fichiers pour le rechargement automatique
    this.watchers = new Map();

    this.logger = this.options.logger;
    this.loadAllTranslations();

    if (this.options.autoReload) {
      this.setupFileWatchers();
    }
  }

  // === GESTION DES FICHIERS DE TRADUCTION ===

  loadAllTranslations() {
    try {
      if (!fs.existsSync(this.options.translationsDir)) {
        this.logger.warn(`Dossier de traductions introuvable: ${this.options.translationsDir}`);
        return;
      }

      const files = fs.readdirSync(this.options.translationsDir);

      files.forEach(file => {
        if (file.endsWith('.json')) {
          this.loadTranslationFile(file);
        }
      });

      this.stats.lastReload = new Date();
      this.logger.info(`${this.stats.filesLoaded} fichiers de traduction chargés`);
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Erreur lors du chargement des traductions:', error.message);
    }
  }

  loadTranslationFile(filename) {
    try {
      const locale = path.basename(filename, '.json');
      const filePath = path.join(this.options.translationsDir, filename);
      const content = fs.readFileSync(filePath, 'utf8');

      // Validation JSON
      let translations;
      try {
        translations = JSON.parse(content);
      } catch (parseError) {
        this.invalidTranslations.add(`${filename}: JSON invalide - ${parseError.message}`);
        this.logger.error(`Erreur JSON dans ${filename}:`, parseError.message);
        return;
      }

      // Validation de la structure
      const validationErrors = this.validateTranslationStructure(translations, filename);
      if (validationErrors.length > 0) {
        validationErrors.forEach(error => {
          this.invalidTranslations.add(`${filename}: ${error}`);
          this.logger.warn(`${filename}: ${error}`);
        });
      }

      this.translations.set(locale, translations);
      this.stats.filesLoaded++;

      // Vider le cache pour cette locale
      this.clearCacheForLocale(locale);

      this.logger.debug(`Fichier de traduction chargé: ${filename}`);
    } catch (error) {
      this.stats.errors++;
      this.invalidTranslations.add(`${filename}: Erreur de chargement - ${error.message}`);
      this.logger.error(`Erreur lors du chargement de ${filename}:`, error.message);
    }
  }

  setupFileWatchers() {
    try {
      if (!fs.existsSync(this.options.translationsDir)) {
        return;
      }

      const watcher = fs.watch(this.options.translationsDir, (eventType, filename) => {
        if (filename && filename.endsWith('.json')) {
          this.logger.info(`Rechargement de ${filename} (${eventType})`);
          setTimeout(() => {
            this.loadTranslationFile(filename);
          }, 100); // Délai pour éviter les multiples événements
        }
      });

      this.watchers.set(this.options.translationsDir, watcher);
    } catch (error) {
      this.logger.error('Erreur lors de la configuration du surveillant de fichiers:', error.message);
    }
  }

  // === VALIDATION ===

  validateTranslationStructure(translations, filename) {
    const errors = [];

    if (typeof translations !== 'object' || translations === null) {
      errors.push('Le fichier doit contenir un objet JSON');
      return errors;
    }

    // Valider la structure imbriquée
    Object.keys(translations).forEach(api => {
      if (typeof translations[api] !== 'object' || translations[api] === null) {
        errors.push(`L'API "${api}" doit être un objet`);
        return;
      }

      Object.keys(translations[api]).forEach(type => {
        if (typeof translations[api][type] !== 'object' || translations[api][type] === null) {
          errors.push(`Le type "${api}.${type}" doit être un objet`);
          return;
        }

        Object.entries(translations[api][type]).forEach(([key, value]) => {
          if (value === null || value === undefined) {
            errors.push(`Traduction vide pour "${api}.${type}.${key}"`);
          } else if (typeof value !== 'string') {
            errors.push(`Traduction non-string pour "${api}.${type}.${key}": ${typeof value}`);
          } else if (value.trim() === '') {
            errors.push(`Traduction vide (chaîne blanche) pour "${api}.${type}.${key}"`);
          }
        });
      });
    });

    return errors;
  }

  // === TRADUCTION AVEC CACHE ===

  translate(api, type, constant, locale = this.options.defaultLocale) {
    this.stats.total++;

    // Validation des paramètres
    if (!this.isValidInput(api, type, constant)) {
      return constant;
    }

    const cacheKey = `${locale}:${api}:${type}:${constant}`;

    // Vérifier le cache si activé
    if (this.options.cacheEnabled && this.cache.has(cacheKey)) {
      this.stats.hits++;
      return this.cache.get(cacheKey);
    }

    this.stats.misses++;

    // Recherche de la traduction avec fallbacks
    let translation = this.findTranslationWithFallbacks(api, type, constant, locale);

    // Gestion des traductions manquantes
    if (translation === constant) {
      this.handleMissingTranslation(api, type, constant, locale);
    }

    // Mise en cache si activé et traduction trouvée
    if (this.options.cacheEnabled && translation !== constant) {
      this.cache.set(cacheKey, translation);
    }

    return translation;
  }

  findTranslationWithFallbacks(api, type, constant, locale) {
    // 1. Essayer avec la locale demandée
    let translation = this.findTranslation(api, type, constant, locale);
    if (translation !== constant) {
      return translation;
    }

    // 2. Fallback vers la locale par défaut si différente
    if (locale !== this.options.defaultLocale) {
      translation = this.findTranslation(api, type, constant, this.options.defaultLocale);
      if (translation !== constant) {
        return translation;
      }
    }

    // 3. Fallback vers la locale de secours
    if (locale !== this.options.fallbackLocale && this.options.defaultLocale !== this.options.fallbackLocale) {
      translation = this.findTranslation(api, type, constant, this.options.fallbackLocale);
      if (translation !== constant) {
        return translation;
      }
    }

    return constant;
  }

  findTranslation(api, type, constant, locale) {
    try {
      const localeTranslations = this.translations.get(locale);
      if (!localeTranslations) {
        return constant;
      }

      const apiTranslations = localeTranslations[api];
      if (!apiTranslations) {
        return constant;
      }

      const typeTranslations = apiTranslations[type];
      if (!typeTranslations) {
        return constant;
      }

      // Essayer avec la clé telle quelle
      if (typeTranslations.hasOwnProperty(constant)) {
        return typeTranslations[constant];
      }

      // Si pas en mode sensible à la casse, essayer avec recherche insensible
      if (!this.options.caseSensitive) {
        const lowerConstant = constant.toString().toLowerCase();
        for (const [key, value] of Object.entries(typeTranslations)) {
          if (key.toLowerCase() === lowerConstant) {
            return value;
          }
        }
      }

      return constant;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Erreur lors de la recherche de traduction:', error);
      return constant;
    }
  }

  // === VALIDATION ET UTILITAIRES ===

  isValidInput(api, type, constant) {
    if (api === null || api === undefined || api === '') {
      this.logger.warn('Paramètre API null ou vide');
      return false;
    }

    if (type === null || type === undefined || type === '') {
      this.logger.warn('Paramètre type null ou vide');
      return false;
    }

    if (constant === null || constant === undefined) {
      this.logger.warn('Paramètre constant null ou undefined');
      return false;
    }

    return true;
  }

  handleMissingTranslation(api, type, constant, locale) {
    const missingKey = `${locale}.${api}.${type}.${constant}`;

    if (!this.missingTranslations.has(missingKey)) {
      this.missingTranslations.add(missingKey);

      if (this.options.logMissingTranslations) {
        this.logger.warn(`Traduction manquante: ${missingKey}`);
      }
    }

    if (this.options.strictMode) {
      throw new Error(`Traduction manquante pour: ${missingKey}`);
    }
  }

  // === MÉTHODES DE GESTION DU CACHE ===

  clearCache() {
    this.cache.clear();
    this.logger.debug('Cache vidé');
  }

  clearCacheForLocale(locale) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${locale}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  preloadCache(locale = this.options.defaultLocale) {
    const localeTranslations = this.translations.get(locale);
    if (!localeTranslations) {
      return;
    }

    Object.keys(localeTranslations).forEach(api => {
      Object.keys(localeTranslations[api]).forEach(type => {
        Object.keys(localeTranslations[api][type]).forEach(constant => {
          this.translate(api, type, constant, locale);
        });
      });
    });

    this.logger.info(`Cache pré-chargé pour la locale: ${locale}`);
  }

  // === RAPPORTS ET STATISTIQUES ===

  getStats() {
    return {
      ...this.stats,
      hitRate: this.stats.total > 0 ? (this.stats.hits / this.stats.total * 100).toFixed(2) + '%' : '0%',
      cacheSize: this.cache.size,
      localesLoaded: this.translations.size,
      missingCount: this.missingTranslations.size,
      invalidCount: this.invalidTranslations.size
    };
  }

  getMissingTranslationsReport() {
    const report = {};

    this.missingTranslations.forEach(key => {
      const [locale, api, type, constant] = key.split('.');

      if (!report[locale]) {
        report[locale] = {};
      }
      if (!report[locale][api]) {
        report[locale][api] = {};
      }
      if (!report[locale][api][type]) {
        report[locale][api][type] = [];
      }

      report[locale][api][type].push(constant);
    });

    return report;
  }

  getInvalidTranslationsReport() {
    return Array.from(this.invalidTranslations);
  }

  // === EXPORT ET GÉNÉRATION DE TEMPLATES ===

  exportMissingTranslationsTemplate(locale = this.options.defaultLocale) {
    const report = this.getMissingTranslationsReport();
    const localeReport = report[locale];

    if (!localeReport) {
      return JSON.stringify({}, null, 2);
    }

    const template = {};

    Object.keys(localeReport).forEach(api => {
      template[api] = {};
      Object.keys(localeReport[api]).forEach(type => {
        template[api][type] = {};
        localeReport[api][type].forEach(constant => {
          template[api][type][constant] = `TODO: Traduire "${constant}"`;
        });
      });
    });

    return JSON.stringify(template, null, 2);
  }

  exportFullReport() {
    return {
      stats: this.getStats(),
      missingTranslations: this.getMissingTranslationsReport(),
      invalidTranslations: this.getInvalidTranslationsReport(),
      availableLocales: Array.from(this.translations.keys()),
      timestamp: new Date().toISOString()
    };
  }

  // === MÉTHODES DE TRADUCTION EN LOT ===

  translateBatch(items, locale = this.options.defaultLocale) {
    return items.map(item => ({
      ...item,
      translated: this.translate(item.api, item.type, item.constant, locale)
    }));
  }

  getAllTranslations(api, type, locale = this.options.defaultLocale) {
    const localeTranslations = this.translations.get(locale);
    return localeTranslations?.[api]?.[type] || {};
  }

  hasTranslation(api, type, constant, locale = this.options.defaultLocale) {
    const localeTranslations = this.translations.get(locale);
    return !!(localeTranslations?.[api]?.[type]?.[constant]);
  }

  // === GESTION DES LOCALES ===

  getAvailableLocales() {
    return Array.from(this.translations.keys());
  }

  isLocaleAvailable(locale) {
    return this.translations.has(locale);
  }

  // === RECHARGEMENT ET NETTOYAGE ===

  reloadTranslations() {
    this.translations.clear();
    this.clearCache();
    this.missingTranslations.clear();
    this.invalidTranslations.clear();
    this.stats.filesLoaded = 0;
    this.stats.errors = 0;

    this.loadAllTranslations();
    this.logger.info('Traductions rechargées');
  }

  clearMissingTranslations() {
    this.missingTranslations.clear();
  }

  clearInvalidTranslations() {
    this.invalidTranslations.clear();
  }

  // === NETTOYAGE ===

  destroy() {
    // Fermer les surveillants de fichiers
    this.watchers.forEach(watcher => {
      watcher.close();
    });
    this.watchers.clear();

    // Vider les données
    this.translations.clear();
    this.clearCache();
    this.missingTranslations.clear();
    this.invalidTranslations.clear();

    this.logger.info('TranslationManager détruit');
  }
}

module.exports = TranslationManager;