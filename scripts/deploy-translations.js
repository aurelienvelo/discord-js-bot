// const fs = require('fs');
// const path = require('path');
// const { translator, validateTranslationFile, integrateTranslationFile } = require('../app');

// class TranslationDeployment {
//   constructor() {
//     this.incomingDir = './incoming-translations';
//     this.backupDir = './translation-backups';
//     this.reportDir = './translation-reports';
    
//     // Créer les dossiers nécessaires
//     [this.incomingDir, this.backupDir, this.reportDir].forEach(dir => {
//       if (!fs.existsSync(dir)) {
//         fs.mkdirSync(dir, { recursive: true });
//       }
//     });
//   }

//   // Sauvegarder les traductions actuelles
//   backupCurrentTranslations() {
//     const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
//     const backupPath = path.join(this.backupDir, `backup-${timestamp}`);
    
//     fs.mkdirSync(backupPath, { recursive: true });
    
//     const translationsDir = './translations';
//     const files = fs.readdirSync(translationsDir);
    
//     files.forEach(file => {
//       if (file.endsWith('.json')) {
//         const srcPath = path.join(translationsDir, file);
//         const destPath = path.join(backupPath, file);
//         fs.copyFileSync(srcPath, destPath);
//       }
//     });
    
//     console.log(`✅ Sauvegarde créée: ${backupPath}`);
//     return backupPath;
//   }

//   // Restaurer depuis une sauvegarde  
//   restoreFromBackup(backupPath) {
//     if (!fs.existsSync(backupPath)) {
//       throw new Error(`Sauvegarde introuvable: ${backupPath}`);
//     }
    
//     const files = fs.readdirSync(backupPath);
//     const translationsDir = './translations';
    
//     files.forEach(file => {
//       if (file.endsWith('.json')) {
//         const srcPath = path.join(backupPath, file);
//         const destPath = path.join(translationsDir, file);
//         fs.copyFileSync(srcPath, destPath);
//       }
//     });
    
//     translator.reloadTranslations();
//     console.log(`✅ Restauration depuis: ${backupPath}`);
//   }

//   // Traiter les fichiers de traduction entrants
//   processIncomingTranslations() {
//     const files = fs.readdirSync(this.incomingDir);
//     const results = {
//       processed: 0,
//       errors: 0,
//       warnings: 0,
//       details: []
//     };
    
//     files.forEach(file => {
//       if (file.endsWith('.json')) {
//         const filePath = path.join(this.incomingDir, file);
//         const result = this.processFile(filePath);
        
//         results.details.push({
//           file: file,
//           ...result
//         });
        
//         if (result.success) {
//           results.processed++;
//         } else {
//           results.errors++;
//         }
        
//         if (result.warnings && result.warnings.length > 0) {
//           results.warnings++;
//         }
//       }
//     });
    
//     return results;
//   }

//   processFile(filePath) {
//     try {
//       console.log(`🔍 Traitement: ${path.basename(filePath)}`);
      
//       // 1. Validation
//       const validation = validateTranslationFile(filePath);
//       if (!validation.valid) {
//         return {
//           success: false,
//           errors: validation.errors,
//           step: 'validation'
//         };
//       }
      
//       // 2. Analyse des différences
//       const diff = this.analyzeChanges(filePath);
      
//       // 3. Sauvegarde avant intégration
//       const backupPath = this.backupCurrentTranslations();
      
//       // 4. Intégration
//       const integrated = integrateTranslationFile(filePath);
      
//       if (integrated) {
//         // 5. Déplacer le fichier traité
//         const processedPath = path.join(this.incomingDir, 'processed', path.basename(filePath));
//         fs.mkdirSync(path.dirname(processedPath), { recursive: true });
//         fs.renameSync(filePath, processedPath);
        
//         return {
//           success: true,
//           backupPath: backupPath,
//           changes: diff,
//           warnings: diff.warnings || []
//         };
//       } else {
//         return {
//           success: false,
//           errors: ['Échec de l\'intégration'],
//           step: 'integration'
//         };
//       }
      
//     } catch (error) {
//       return {
//         success: false,
//         errors: [error.message],
//         step: 'processing'
//       };
//     }
//   }

//   analyzeChanges(filePath) {
//     try {
//       const newTranslations = JSON.parse(fs.readFileSync(filePath, 'utf8'));
//       const locale = path.basename(filePath, '.json');
//       const currentTranslations = translator.translations.get(locale) || {};
      
//       const changes = {
//         added: [],
//         modified: [],
//         removed: [],
//         warnings: []
//       };
      
//       // Analyser les changements
//       this.compareTranslations('', currentTranslations, newTranslations, changes);
      
//       return changes;
//     } catch (error) {
//       return {
//         added: [],
//         modified: [],
//         removed: [],
//         warnings: [`Erreur d'analyse: ${error.message}`]
//       };
//     }
//   }

//   compareTranslations(prefix, current, incoming, changes) {
//     const currentKeys = new Set(Object.keys(current));
//     const incomingKeys = new Set(Object.keys(incoming));
    
//     // Nouvelles clés
//     for (const key of incomingKeys) {
//       const fullKey = prefix + key;
      
//       if (!currentKeys.has(key)) {
//         changes.added.push(fullKey);
//       } else if (typeof current[key] === 'object' && typeof incoming[key] === 'object') {
//         // Comparaison récursive
//         this.compareTranslations(fullKey + '.', current[key], incoming[key], changes);
//       } else if (current[key] !== incoming[key]) {
//         changes.modified.push({
//           key: fullKey,
//           old: current[key],
//           new: incoming[key]
//         });
//       }
//     }
    
//     // Clés supprimées
//     for (const key of currentKeys) {
//       if (!incomingKeys.has(key)) {
//         changes.removed.push(prefix + key);
//       }
//     }
//   }

//   // Générer un rapport de déploiement
//   generateDeploymentReport(results) {
//     const timestamp = new Date().toISOString();
//     const report = {
//       timestamp: timestamp,
//       summary: {
//         processed: results.processed,
//         errors: results.errors,
//         warnings: results.warnings
//       },
//       details: results.details,
//       systemStats: translator.getStats()
//     };
    
//     const reportPath = path.join(this.reportDir, `deployment-${timestamp.split('T')[0]}.json`);
//     fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
//     console.log(`📄 Rapport de déploiement: ${reportPath}`);
//     return reportPath;
//   }

//   // Déploiement complet
//   deploy() {
//     console.log('🚀 Début du déploiement des traductions...');
    
//     try {
//       // 1. Vérifier l'état actuel
//       const currentStats = translator.getStats();
//       console.log(`📊 État actuel: ${currentStats.localesLoaded} locales, ${currentStats.missingCount} manquantes`);
      
//       // 2. Traiter les fichiers entrants
//       const results = this.processIncomingTranslations();
      
//       // 3. Générer le rapport
//       const reportPath = this.generateDeploymentReport(results);
      
//       // 4. Afficher le résumé
//       console.log(`
// 📋 Résumé du déploiement:
//   ✅ Fichiers traités: ${results.processed}
//   ❌ Erreurs: ${results.errors}
//   ⚠️  Avertissements: ${results.warnings}
//   📄 Rapport: ${reportPath}
//       `);
      
//       // 5. Statistiques finales
//       const finalStats = translator.getStats();
//       console.log(`📊 État final: ${finalStats.localesLoaded} locales, ${finalStats.missingCount} manquantes`);
      
//       return {
//         success: results.errors === 0,
//         results: results,
//         reportPath: reportPath
//       };
      
//     } catch (error) {
//       console.error('❌ Erreur lors du déploiement:', error.message);
//       return {
//         success: false,
//         error: error.message
//       };
//     }
//   }
// }
