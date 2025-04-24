# Use Node.js image as the base for the build
FROM node:18 AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy all files including src and tsconfig.json for the build step
# This ensures that everything is copied into the container
COPY . .
# COPY ../.env .
# RUN ls
# Build the app (make sure this works correctly and outputs to dist)
RUN npm run build

# Production image
FROM node:18

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy the built dist folder from the previous stage
COPY --from=build /app/dist /app/dist

EXPOSE 3000

# Update this to point to dist/src/main.js instead of dist/main.js
CMD ["node", "dist/src/main.js"]
# CMD ["node", "dist/main.js"]
# CMD ["npm run start:dev"]

