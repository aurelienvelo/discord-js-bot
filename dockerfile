# Étape 1 : Utilisation d'une image légère pour la construction
FROM node:18-alpine AS builder

# Variables d'environnement pour une meilleure sécurité et performance
ENV NODE_ENV=production

# Création du répertoire de l'application
WORKDIR /app

# Installation des dépendances
COPY package*.json ./
RUN npm install --omit=dev

# Copie du code source
COPY . .

# Étape 2 : Image finale minimaliste
FROM node:18-alpine

# Variables d'environnement
ENV NODE_ENV=production

# Création du répertoire de l'application
WORKDIR /app

# Copie des fichiers nécessaires depuis l'étape de build
COPY --from=builder /app .

# Suppression des fichiers inutiles
RUN apk add --no-cache tini \
  && rm -rf /var/cache/apk/* /root/.npm /tmp/*

# Exposition du port (si le bot offre une API ou une interface web)
EXPOSE 3000

# Démarrer PM2 avec l'API activée
ENTRYPOINT ["/sbin/tini", "--", "npm", "run", "start"]
