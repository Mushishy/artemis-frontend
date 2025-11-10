# Deploy Ludus

1. update 

```
sudo apt update -y
sudo apt-get update -y
sudo apt-get upgrade -y
#sudo apt install unattended-upgrades
#sudo dpkg-reconfigure unattended-upgrades

apt install nano curl net-tools locales
apt-get install net-tools vim tmux ssh

echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen
```

2. install ludus

https://docs.ludus.cloud/docs/quick-start/install-ludus

create regular user with admin privileges

```
sudo adduser xslizik sudo
LUDUS_API_KEY='ROOT.' ludus user add --name "Jan Slizik" --userid "JSLIZIK" --admin --url https://localhost:8081


vim /home/xslizik/.bashrc
# export LUDUS_API_KEY='J'

ludus user creds get
```


3. generate key pair 

```
ssh-keygen -f ~/.ssh/ludus
ssh-copy-id -i ~/.ssh/ludus.pub user@hostname
```

4. /etc/sshd_config

```
ChallengeResponseAuthentication no
PasswordAuthentication no
UsePAM no
PermitRootLogin no
```

5. /etc/host.conf

```rb
order bind,hosts
multi on
nospoof on
```

6. /etc/resolv.conf

```
nameserver <>
```

6. ufw
```
sudo apt-get install ufw

sudo ufw limit 22/tcp    # SSH limit 6 in 30 seconds
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 8080/tcp  # LUDUS
sudo ufw allow 8081/tcp  # LUDUS ADMIN
sudo ufw allow 8006/tcp  # PROXMOX
sudo ufw allow 51820/tcp # Wireguard
sudo ufw allow from <zabbix-server-ip> to any port 10050/tcp
# disable unused 

sudo ufw default deny incoming  # Deny all incoming traffic by default
sudo ufw default allow outgoing # Allow all outgoing traffic
sudo ufw enable
sudo ufw status
```

7. docker setup

```
curl -fsSL get.docker.com -o get-docker.sh && sh get-docker.sh
sudo apt install docker-compose
```

8. git clone all of the repositories into /opt change docker-compose variables and move it to /opt set proper permissions to not reveal any secrets 

```
docker compose up -d 
```


9. blksnap veeam zabbix breakglass elastic ?