# Artemis Admin Guide 

## Access 
To interact with the FE, an API key must be entered. All requests to the Ludus API are made using this API key, meaning all user actions are logged and can be traced to a specific user.

![](./img/1_login.png)

Once logged in, all features of the FE are accessible. The dashboard displays basic statistics regarding Proxmox, Ludus, and the Scenario Manager API, as well as useful links to Ludus Documentation, the School GitLab, and Proxmox itself.

![](./img/2_dashboard.png)

## Prerequisites to Pool Creation
### 1. Topology
Before creating a pool topology, a blueprint for the range containing information about VMs and roles must be uploaded. Blueprints can be created, deleted, or patched.

![](./img/3_topologies.png)

### 2. Templates
The creator can verify that all VM templates are accessible on the server. If they are not, they can be built via the command line according to the [Ludus documentation](https://docs.ludus.cloud/docs/templates/).

![](./img/4_templates.png)

### 3. Roles
The same applies to Roles. They can be imported as a file or installed from [Ansible Galaxy](https://galaxy.ansible.com/ui/) directly through the FE. 

![](./img/5_roles.png)

## Creating a Pool
When creating a pool, a Note (maximum 15 characters) is used as a human-readable identifier. A `topologyId` is selected along with a pool type, which determines the input required from users. Pool users can be assigned to teams, which serves as a reference for creating users in CTFd. There is also an option to `Search Users` to ensure they are available. 

### 1. Individual
Each user has their own range which they can access. It is possible to create teams and assign users to them, but it is not mandatory.

![](./img/6_create_individual.png)

![](./img/6_create_individual_teams.png)

![](./img/6_create_individual_assign.png)

### 2. Shared
Each user is assigned to a main user whose range is shared with them. First, main users are chosen from a list of available users not currently in pools. Then, users are assigned to these main users. The creator can also choose to create teams and assign users to them. 

![](./img/7_create_shared.png)

![](./img/7_select_main.png)

![](./img/7_assign_main.png)

![](./img/7_create_teams.png)

![](./img/7_assign_teams.png)

### 3. CTFd
The final type is CTFd, which is explained in more detail in [CTFd Web deploy](../03-ctfd-guide/web-deploy/README.md). The creator can select a main user from the CTFd users list (designated for CTFd deployments; their names start with "CTFD"), whose range will be shared with other users. It is also possible to create a CTFd dev pool, which creates an Individual pool for the current user for the CTFd development process.

![](./img/7_create_ctfd.png)

![](./img/7_select_ctfd.png)


## Pool Management
Once a pool is created, its Note can be changed, and the pool can be deleted or further managed. 

![](./img/8_pools.png)

There are multiple indicator lights signifying the state of each category. Green indicates that the function is enabled; red indicates that the particular function is disabled. 

![](./img/9_pool.png)


### Users
Users entered while creating the pool only exist within the pool definition and must be created in Ludus itself, which can take some time. However, this process is only done once. Once a user is created in Ludus, they can be used in other pools. Users can be added to a pool but cannot be deleted or modified. For the indicator light to turn green, all users must exist.

![](./img/10_manage_users.png)

### Topology
Pool topology can either be changed in the pool definition or set directly in Ludus for every main user concurrently. For the indicator light to be green, the topology of all main users must match the pool topology.

![](./img/11_manage_topology.png)

### Status
Ranges are deployed from this section. A range will be created for each main user. Ranges can be redeployed if errors occur; in this case, the affected ranges will be destroyed and redeployed. If a deployment needs to be canceled, it can be aborted. Once all ranges are in an "errored," "aborted," or "deployed" state, they can be destroyed. The number of concurrent requests can be configured, meaning only a specified number of ranges (e.g., 4) will be deployed simultaneously. The green light indicates all ranges were successfully deployed.

![](./img/12_manage_status.png)


### Sharing
In the case of SHARED ranges, a main user's range can be shared with other users. This allows their VPN to grant access to VMs from their assigned main user's IP range. This process can be time-consuming; the indicator turns green once all ranges are successfully shared. 

![](./img/13_manage_sharing.png)


### Access
VPN configurations for all users can be downloaded here, and CTFd data can be fetched and downloaded. This allows dynamic flags, user logins, and usernames for CTFd to be retrieved from the deployed main users' logs. The indicator light turns green if CTFd data was successfully fetched. 

![](./img/14_manage_access.png)


### Testing
Within the pool topology, testing mode behavior can be specified, such as blocking internet connections or creating snapshots after deployment. See the [Ludus Documentation](https://docs.ludus.cloud/docs/quick-start/testing-mode/) for more details. This takes some time to enable, but once active for all ranges, the indicator light turns green. 

![](./img/15_manage_testing.png)


## Pool Information 

### Pool Logs
The pool creator can inspect logs that are continuously fetched while the range is being deployed and download them to a file.

![](./img/16_pool_logs.png)


### Pool Visualization
Once the pool is deployed, information about the range VMs is visualized in a clear graph. 

![](./img/17_pool_visualization.png)


## Manage Observer Users
Once the pool is deployed, an observer account for the manager can be created, and all main users inside a pool can be shared with it. This allows an administrator to access all main users' ranges. The Users page also provides options to create, destroy, and download user VPN configurations. 

![](./img/18_observer.png)

## Create CTFd

### Create CTFd Scenario
To create a CTFd instance, a scenario that was exported from an existing CTFd with the same version and plugins as the one in the role needs to be uploaded to scenarios. It can be created, deleted and patched. 

![](./img/19_ctfd_scenarios.png)

### Create CTFd Topology
After deployment of a pool (more can be found in [Artemis Admin Guide](../../04-artemis-admin-guide/README.md)), a CTFd topology definition can be created. Make sure that CTFd data was fetched from logs and that scenarios exist.

![](./img/20_create_ctfd.png)

### Create CTFd Pool

After the CTFd topology is created, a pool with the same users can be created and deployed with one main user who will have the newly created CTFd topology set. Learn more about interacting with Artemis in [Artemis Admin Guide](../../04-artemis-admin-guide/README.md).

![](./img/7_create_ctfd.png)

![](./img/7_select_ctfd.png)