## Starting Out 
For someone developing a game for Ludus, the best way to interact with it is through the command line. I prefer to use Visual Studio Code's Connect to Host feature. Make sure that your admin API key is inside `.bashrc`—this will enable you to use most Ludus commands that target the Ludus API on port 8080. Some commands require you to use `--url localhost:8081`, which is the admin endpoint used for operations such as creating or deleting users. 

```bash
vim /home/xslizik/.bashrc
export LUDUS_API_KEY='J'
```

To log in to Proxmox on port 8006, you can use:
```
ludus user creds get
```

To interact with Ludus ranges, you will need Wireguard VPN. The IP addressing format in Ludus looks like this: 

```bash
10.<user_id>.<vlan>.<ip_last_octet>
```

It is best to create a test user and share it with your main VPN, then create ranges on a non-admin user, or even multiple non-admin users, which can enable you to test things faster. Don't forget to re-download the VPN and import it into Wireguard after sharing.

```bash
ludus user add --name "jan slizik velociraptor" --userid JSV --url https://127.0.0.1:8081
ludus range access grant --target JSV --source JANSLIZIK
ludus users wireguard
```

## Before Deployment

Create your own `topology.yml` [range configuration](https://docs.ludus.cloud/docs/configuration/) and make sure that all needed templates and roles exist. 

```bash
# Get available templates
ludus template list

# Get available roles
ludus ansible roles get

# Add Role from Ansible Galaxy
ludus ansible roles add aleemladha.wazuh_server_install

# Add Collection from Ansible Galaxy
ludus ansible collection add maxhoesel.smallstep 

# Add Role from GitHub
git clone https://github.com/fmurer/ludus_velociraptor_server
ludus ansible role add -d ./ludus_velociraptor_server -f -g
```

You can create your own roles as well:
- [Role Template](https://github.com/badsectorlabs/ludus_ansible_role_template)
- [Ansible Role Guide](https://docs.ansible.com/ansible/latest/playbook_guide/playbooks_reuse_roles.html#role-directory-structure)


## Deploy Range

Refresh components that have been changed and deploy with the updates.

```bash
# always update custom roles after changes
custom_roles=(
    "./roles/ela_apache"
)

for role in "${custom_roles[@]}"; do
    ludus ansible role add -d "$role_location" -f --user "$user"
done

# set the updated config for user
ludus range config set -f "$template" --user "$user"

# deploy range for user
ludus range deploy --user "$user"

# read logs continuously for user
ludus range logs -f --user "$user"
```

## Running Roles After Deployment
Ludus has an option for running roles after deployment. This means that once the lab is built, it can be snapshotted thanks to Testing mode:
```bash
# manage testing
ludus testing start --user "$user"
ludus testing stop --user "$user"
```

Specified roles can be run on specified hosts. If they fail, testing mode can be stopped, the snapshot will revert, and the role can be run again.  

```bash
ludus range deploy -t user-defined-roles \
    --limit "$(IFS=,; echo "${hosts[*]}")" \
    --only-roles "$(IFS=,; echo "${custom_roles[*]}")" \
    --user "$user"

```

- [Default Logins](https://docs.ludus.cloud/docs/passwords/)

## Destroy Range

```bash
# make sure that the deployment process has ended
ludus range status --user "$user"
ludus range abort --user "$user"

# destroy range
ludus range rm --user "$user"
```

## Power Management

```bash
ludus power off -n all --user "$user"
ludus power on -n all --user "$user"
```