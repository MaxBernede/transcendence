DOCKER_COMPOSE = docker-compose.yml
PROJECT_NAME = ft_transcendence

all: build up

build:
	docker-compose -f $(DOCKER_COMPOSE) -p $(PROJECT_NAME) build

up:
	docker-compose -f $(DOCKER_COMPOSE) -p $(PROJECT_NAME) up

down:
	docker-compose -f $(DOCKER_COMPOSE) -p $(PROJECT_NAME) down


see:
	@echo $(Blue)Containers: $(Color_Off)
	@docker ps -a
	@echo $(Blue)Images: $(Color_Off)
	@docker image ls
	@echo $(Blue)Volumes: $(Color_Off)
	@docker volume ls
# @echo $(Blue)Networks: $(Color_Off)
# @docker network ls
clean:
	@echo $(Yellow)Containers erased$(Color_Off)
	@docker stop $(shell docker ps -qa) 2>/dev/null || true
	@docker rm $(shell docker ps -qa ) 2>/dev/null || true
	@echo $(Yellow)Images erased$(Color_Off)
	@docker rmi -f $(shell docker images -qa) 2>/dev/null || true
	@echo $(Yellow)Networks erased$(Color_Off)
	@docker network rm $(shell docker network ls -q ) 2>/dev/null || true
	@docker network prune -f || true


fclean: clean
	@echo $(Yellow)Volumes erased$(Color_Off)
	@docker volume rm $(shell docker volume ls -q) 2>/dev/null || true


pg:
	docker exec -it pgadmin /bin/sh

post:
	docker exec -it postgres /bin/sh

## Regular Colors ##############################################
Color_Off	=	"\033[0m"			# Text Reset
Black		=	"\033[0;30m"		# Black
Red			=	"\033[0;31m"		# Red
Green		=	"\033[0;32m"		# Green
Yellow		=	"\033[0;33m"		# Yellow
Blue		=	"\033[0;34m"		# Blue
Purple		=	"\033[0;35m"		# Purple
Cyan		=	"\033[0;36m"		# Cyan
White		=	"\033[0;37m"		# White


.PHONY: all build up down see fclean clean nestjs
