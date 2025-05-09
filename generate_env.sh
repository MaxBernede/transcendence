#!/bin/bash

# Récupère l'adresse IP de l'interface eno1
IP=$(ifconfig eno1 | grep "inet " | awk '{print $2}')

if [ -z "$IP" ]; then
	echo "❌ Aucune IP trouvée pour l'interface eno1"
	exit 1
fi

update_env_file() {
	FILE=$1
	touch "$FILE"

	grep -q "^REACT_APP_BACKEND_IP=" "$FILE" \
		&& sed -i "s|^REACT_APP_BACKEND_IP=.*|REACT_APP_BACKEND_IP=\"http://$IP:3000\"|" "$FILE" \
		|| echo "REACT_APP_BACKEND_IP=\"http://$IP:3000\"" >> "$FILE"

	grep -q "^REACT_APP_FRONTEND_IP=" "$FILE" \
		&& sed -i "s|^REACT_APP_FRONTEND_IP=.*|REACT_APP_FRONTEND_IP=\"http://$IP:3001\"|" "$FILE" \
		|| echo "REACT_APP_FRONTEND_IP=\"http://$IP:3001\"" >> "$FILE"
}


update2_env_file() {
	FILE=$1
	touch "$FILE"

	grep -q "^BACKEND_IP=" "$FILE" \
		&& sed -i "s|^BACKEND_IP=.*|BACKEND_IP=\"http://$IP:3000\"|" "$FILE" \
		|| echo "BACKEND_IP=\"http://$IP:3000\"" >> "$FILE"

	grep -q "^FRONTEND_IP=" "$FILE" \
		&& sed -i "s|^FRONTEND_IP=.*|FRONTEND_IP=\"http://$IP:3001\"|" "$FILE" \
		|| echo "FRONTEND_IP=\"http://$IP:3001\"" >> "$FILE"
}

update_data_paths() {
	FILE=$1
	touch "$FILE"
	BACKEND_PATH="$PWD/nestjs"
	FRONTEND_PATH="$PWD/frontend"

	grep -q "^BACKEND_DATA=" "$FILE" \
		&& sed -i "s|^BACKEND_DATA=.*|BACKEND_DATA=\"$BACKEND_PATH\"|" "$FILE" \
		|| echo "BACKEND_DATA=\"$BACKEND_PATH\"" >> "$FILE"

	grep -q "^FRONTEND_DATA=" "$FILE" \
		&& sed -i "s|^FRONTEND_DATA=.*|FRONTEND_DATA=\"$FRONTEND_PATH\"|" "$FILE" \
		|| echo "FRONTEND_DATA=\"$FRONTEND_PATH\"" >> "$FILE"
}

change_device_paths() {
	sed -i \
		-e 's|device: .*/frontend|device: '"$PWD"'/frontend|' \
		-e 's|device: .*/nestjs|device: '"$PWD"'/nestjs|' \
		docker-compose.yml
}

update_env_file ".env"
update_env_file "frontend/.env"
update2_env_file ".env"
change_device_paths
update_data_paths ".env"

echo "✅ .env and frontend/.env updated with IP $IP"