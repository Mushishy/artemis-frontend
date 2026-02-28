#!/bin/bash

if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    curl -fsSL https://nodejs.org/dist/v25.6.0/node-v25.6.0-linux-x64.tar.xz -o node-v25.6.0-linux-x64.tar.xz
    sudo tar -C /usr/local --strip-components 1 -xJf node-v25.6.0-linux-x64.tar.xz
    rm node-v25.6.0-linux-x64.tar.xz
fi

if [ ! -d "/opt/artemis-frontend" ]; then
    sudo git clone https://github.com/Mushishy/artemis-frontend.git /opt/artemis-frontend
fi

cd /opt/artemis-frontend
sudo rm -rf .svelte-kit/ node_modules/ build/

cp .env.example .env
npm install --legacy-peer-deps
npm run build
sudo chown -R www-data:www-data /opt/artemis-frontend

sudo cp ./artemis-frontend.service /etc/systemd/system
sudo systemctl daemon-reload

sudo systemctl start artemis-frontend.service
sudo systemctl enable artemis-frontend.service