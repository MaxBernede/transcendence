#!/bin/bash
make

cd frontend && npm start & cd nestjs && npm run start & 

wait