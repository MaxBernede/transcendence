# Transcendence

## Requirements
	Make sure you have nestjs installed on your computer and npm.
	As well, you will need to download typeorm. Also docker is a need in case you work from home

	```npm install react-router-dom typeorm class-validator class-transformer ```
## How to run the project
	make (even if the make is finished, it takes around 1 minute for the project to but up and ready, docker ps pgadmin to check)
	cd nestjs and npm run start:dev (npm command start dev to reload the project at every change in the code)
	After that, you will have access to the project port 3000 (default nestjs) and you will have access to the database on pgadmin on port 5050 (localhost:5050)
	
### Things to know
	Any passwords can be found in the .env file, I didn't add the .env file in the .gitignore but in professionals projects it should be done

	If you don't have access to localhost:5050. docker logs pgadmin, if it's pgAdmin 4 - Application Initialisation. Wait until the process is finished. 

	If you can login to pgadmin but the database is not linked (happen sometimes), make down and make again. I don't know why it happens sometimes

	NestJs will create the tables that you can find in pgadmin on Schemas, public, Tables. if nestJs not run yet, you wont find anything (or just find the previous ones).



## Useful tools
### Postman
	I started to use Postman to create API calls to our endpoints for easier testing than clicking buttons on the website and checking the replies
### Notion
	I will start using Notion to take notes on the project and have an easy documentation of it. Please let's try to keep it up to date so we can easily find the relevent informations
### Trello
	Should we start using Trello for the project ?

## Random notes
	max: For the moment there is 2 .env files, its on the todo list to remove one of them. I am also checking the communication between nestjs and postgres. I correclty linked the DBB with NestJs (quite proud of it haha) but I'm not sure how to correctly make them communicate
	


