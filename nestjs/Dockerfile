FROM node:18 AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

RUN npm install -g @nestjs/cli

# Debug: List files after npm install
RUN ls -la /app

# Copy source code
COPY . . 

# Debug: List files after copying source code
RUN ls -la /app

# Run build
RUN npm run build

# Debug: List files after build
RUN ls -la /app/dist

CMD ["node", "dist/src/main.js"]
# CMD ["sh", "-c", "tail -f /dev/null"]
