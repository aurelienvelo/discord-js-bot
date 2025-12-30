# ÉTAPE 1 : Construction (Build)
FROM node:20-alpine AS builder

# Installation des outils de build pour les dépendances natives (si besoin)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copie uniquement les fichiers de dépendances pour profiter du cache Docker
COPY package*.json ./
RUN npm ci --only=production

# ÉTAPE 2 : Image Finale
FROM node:20-alpine

# Sécurité : Création d'un utilisateur non-root pour l'exécution
RUN addgroup -S botgroup && adduser -S botuser -G botgroup

WORKDIR /app

# Copie des fichiers depuis l'étape de build
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Création du dossier data pour le volume PVC et gestion des permissions
RUN mkdir -p /app/data && chown -R botuser:botgroup /app

# Utilisation de l'utilisateur non-root
USER botuser

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV DATABASE_PATH=/app/data/database.yml

# Exposition du port utilisé par les webhooks
EXPOSE 3000

VOLUME [ "/app/data" ]

# Commande de démarrage
CMD ["node", "src/index.js"]
