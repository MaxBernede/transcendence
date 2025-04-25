FROM node:18 AS build

WORKDIR /app

COPY . .

RUN npm i
RUN npm run build

# Serve the build folder with 'serve'
FROM node:18

WORKDIR /app

# Corrected to install serve
RUN npm i -g serve

COPY --from=build /app/build ./build

EXPOSE 3001

# Corrected CMD to use an environment variable for the host
CMD ["serve", "-s", "build", "-l", "3001"]

# CMD ["npm", "start"]