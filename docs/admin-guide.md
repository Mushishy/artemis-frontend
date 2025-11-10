## Access 
To interact with the FE, an API key needs to be inputted. All requests to the Ludus API are made using this API key. This means that all user actions are logged and can be traced to a specific user.

![](./img/1_login.png)

Once logged in, all features of the FE are accessible. Stating with basic statistics about Proxmox, Ludus and Scenario Manager API as well as useful links to Ludus Documentation, School Gitlab and Proxmox itself.

![](./img/2_dashboard.png)

## Prerequisites to Pool Creation
### 1. Topology
Before creating a pool topology, a blueprint for the range containing information about VMs and roles must be uploaded. It can be created deleted and patched.

![](./img/3_topologies.png)

### 2. Templates
The creator can verify that all VM templates are accessible on the server. If not, they can be built through the command line according to the [Ludus documentation](https://docs.ludus.cloud/docs/templates/).

![](./img/4_templates.png)

### 3. Roles

The same applies to Roles. They can be imported as a file or installed from [Ansible Galaxy](https://galaxy.ansible.com/ui/) directly through the FE. 

![](./img/5_roles.png)

## Creating a Pool
When creating a pool, a Note with a maximum of 15 characters is used as a human-readable identifier, and a topologyId is selected along with a pool type, which determines the input for users. Team inside Users and Teams input serves as a reference for creating users in CTFd, which will be explained in detail later.

### 1. Individual
Each user has their own range, which they can access. 

![](./img/6_create_individual.png)

### 2. Shared
Each user has a main user whose range is shared with them. There is an option to search for available main users who are not currently assigned as main users in other pools. 

![](./img/7_create_shared.png)


## Pool Management

Once the pool is created, its Note can be changed, it can be deleted, or it can be further managed. 

![](./img/8_pools.png)

There are multiple indicator lights signifying the state of each category. Green means that it is enabled; red means that the particular function is disabled. 

![](./img/9_pool.png)


### Users

Users inputted while creating the pool only exist within the pool definition and need to be created in Ludus itself, which can take some time. However, this process is done only once. Once a user is created in Ludus, they can be used in other pools as well. Users can be added to a pool but cannot be deleted or changed. For the indicator light to be green, all users must exist.

![](./img/10_manage_users.png)

### Topology

Pool topology can either be changed in the pool definition or set directly in Ludus for every main user concurrently. For the indicator light to be green, the topology of all main users must match the pool topology.

![](./img/11_manage_topology.png)

### Status

Here, ranges can be deployed. A range for each main user will be created. Ranges can be redeployed if there are errors; in this case, those ranges will be destroyed and redeployed. If for some reason a deployment needs to be canceled, it can be aborted. Once all ranges are errored, aborted, or deployed, they can be destroyed. The number of concurrent requests can be set, meaning that only a specified number of ranges (e.g., 4) will be deployed at the same time. The green light is lit if all ranges are successfully deployed.

![](./img/12_manage_status.png)


### Sharing

In the case of SHARED ranges, a main user's ranges can be shared with other users within the range. This means that their VPN will enable them to access VMs from their assigned main user's IP range. This process can take a long time, and for the indicator to be green, all ranges need to be successfully shared. 

![](./img/13_manage_sharing.png)


### Access
Here, VPN configs for all users can be downloaded, or CTFd data can be fetched and downloaded. This means dynamic flags, user logins, and usernames for CTFd can be retrieved from deployed main users' logs. The indicator light is green if CTFd data was successfully fetched. 

![](./img/14_manage_access.png)


### Testing
Within the pool topology, testing mode behavior can be specified, such as blocking internet connections or creating snapshots after deployment. See the [Ludus Documentation](https://docs.ludus.cloud/docs/quick-start/testing-mode/) for more details. It takes some time to enable, but once it is enabled for all ranges, the indicator light is green. 

![](./img/15_manage_testing.png)


## Pool Information 

### Pool Logs
The pool creator can inspect logs that are continuously fetched while the range is being deployed and download them to a file.

![](./img/16_pool_logs.png)


### Pool Visualization

Once the pool is deployed, information about range VMs is visualized in a clear graph. 
![](./img/17_pool_visualization.png)


## Manage Observer Users

Once the pool is deployed, an observer account for the manager can be created, and all main users inside a pool can be shared with it. This means an administrator can access all main users' ranges. Users page enables the option to create, destroy and download user VPN configs as well. 

![](./img/18_observer.png)

## Create CTFd


### Scenarios
To create a CTFd instance, a scenario that was exported from an existing CTFd with the same version and plugins as the one in the role needs to be uploaded. This scenario contains all of the challenges and correct answers. It can be created deleted and patched. 

![](./img/19_ctfd_scenarios.png)

### CTFd Topology
After deployment of a pool, a CTFd topology definition can be created. Make sure that CTFd data was fetched from logs and that scenarios exist. All of these options will be automatically set in the CTFd, along with all challenges and users imported with their dynamic flags. 

![](./img/20_create_ctfd.png)

After the CTFd topology is created, a pool with the same users can be created and deployed with one main user who will have the newly created CTFd topology set. 