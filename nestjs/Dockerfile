# # Use Node.js image as the base for the build
FROM node:18 AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install
# copy from local machine into docker
COPY . . 
RUN npm run build

CMD ["node", "dist/src/main.js"]
# CMD ["sh", "-c", "tail -f /dev/null"]
