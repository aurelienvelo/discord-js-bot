class ConstantTranslator {
    constructor() {
      this.translationMap = {
        overseerr: {
          media_request_status: {
            0: 'Inconnu',
            1: "En attente d'approbation",
            2: 'Approuvé',
            3: 'Refusé',
          },
          media_info_status: {
            1: "Inconnu",
            2: 'En attente',
            3: 'En cours de traitement',
            4: 'Partiellement disponible',
            5: 'Disponible',
          },
          media_status: {
            'PENDING': 'En attente',
            'AVAILABLE': 'Disponible',
          },
          event: {
            'Movie Request Now Available': 'Demande de film maintenant disponible',
            'Series Request Now Available': 'Demande de série maintenant disponible',
            'Movie Request Automatically Approved': 'Demande de film automatiquement approuvée',
            'Series Request Automatically Approved': 'Demande de série automatiquement approuvée',
          }
        },
        radarr: {
          quality: {
            'HD-1080p': 'High Definition (1080p)',
            'HD-720p': 'High Definition (720p)',
            'SD': 'Standard Definition',
          },
        },
        sonarr: {
          status: {
            continuing: 'La série est en cours',
            ended: 'La série est terminée',
          },
        },
      };
    }
  
    translate(api, type, constant) {
      return this.translationMap[api]?.[type]?.[constant] || constant;
    }
  }
  
  module.exports = ConstantTranslator;
  