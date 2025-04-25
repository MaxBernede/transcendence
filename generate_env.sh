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

update_env_file ".env"
update_env_file "frontend/.env"

echo "✅ .env et frontend/.env mis à jour avec l'IP $IP"