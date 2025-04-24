#!/bin/bash

clear

make

cd nestjs

npm run start:dev &

cd ../frontend

npm start &

wait