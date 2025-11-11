# Deploy Ludus

1. update 

```bash
sudo apt update -y
sudo apt-get update -y
sudo apt-get upgrade -y
#sudo apt install unattended-upgrades
#sudo dpkg-reconfigure unattended-upgrades

apt install nano curl net-tools locales
apt-get install net-tools vim tmux ssh

dpkg-reconfigure tzdata
echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen
```

2. install ludus

https://docs.ludus.cloud/docs/quick-start/install-ludus

create regular user with admin privileges

```bash
sudo adduser xslizik sudo
LUDUS_API_KEY='ROOT.' ludus user add --name "Jan Slizik" --userid "JSLIZIK" --admin --url https://localhost:8081


vim /home/xslizik/.bashrc
# export LUDUS_API_KEY='J'

ludus user creds get
```


3. generate key pair 

```bash
ssh-keygen -f ~/.ssh/ludus
ssh-copy-id -i ~/.ssh/ludus.pub user@hostname
```

4. /etc/sshd_config

```bash
ChallengeResponseAuthentication no
PasswordAuthentication no
UsePAM no
PermitRootLogin no
```

5. /etc/host.conf

```bash
order bind,hosts
multi on
nospoof on
```

6. /etc/resolv.conf

```bash
nameserver <>
```

6. iptables
```bash
# Allow loopback
sudo iptables -A INPUT -i lo -j ACCEPT
sudo iptables -A OUTPUT -o lo -j ACCEPT

# Allow established and related connections
sudo iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# SSH rate limiting (max 6 connections per 30 seconds)
sudo iptables -A INPUT -p tcp --dport 22 -m conntrack --ctstate NEW -m recent --set
sudo iptables -A INPUT -p tcp --dport 22 -m conntrack --ctstate NEW -m recent --update --seconds 30 --hitcount 7 -j DROP
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Allow HTTP, HTTPS
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Allow Ludus
sudo iptables -A INPUT -p tcp --dport 8080 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 8081 -j ACCEPT # only if admin port is global

# Allow Proxmox
sudo iptables -A INPUT -p tcp --dport 8006 -j ACCEPT

# Allow Wireguard
sudo iptables -A INPUT -p tcp --dport 51820 -j ACCEPT
```

7. docker setup

```bash
curl -fsSL get.docker.com -o get-docker.sh && sh get-docker.sh
sudo apt install docker-compose
```

8. git clone all of the repositories into /opt change docker-compose variables and move it to /opt set proper permissions to not reveal any secrets 

```bash
docker compose up -d 
```


9. blksnap veeam zabbix breakglass elastic ?