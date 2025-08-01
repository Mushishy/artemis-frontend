--

prichadzam - zadaj ip, port, apikey 


---
CTFD1
CTFD2
CTFD3

---
It would be best if my current selection was remembered and everytime I return to that page I will be able to choose if continue or start again localstorage ?

Create Range

CTFD
- topologyid
- ctfd user select (allow selecting only CTFD*)

ctfd 
- [ctfd] topologyID
    - scenario_definition_id 
    - scenario_data_id 

NOT SHARED
- topologyid
- rest of the users select (allow selecting only BATCH*)


users check
users import [are you sure ?]
range abort their ranges [are you sure ?]
range remove
range set
range deploy


SHARED 
- topologyid
- main user select (allow selecting only BATCH*)
- rest of the users select (allow selecting only BATCH*)

range share 
range lshare


END

ctfd_data without flags will be createad - if all are deployed correctly flags can be retreived through games

----
Games [ctfd_data]
if contains CTFD user than it is not displayed 

range flags [if not deployed completely return error to wait] | range access [download wireguard.conf]  | users generate [ctfd passwords]  


range check [search-check]
range redeploy [refresh-ccw]
range logs [todo] you press v and than underneath logs will appear
range remove
users delete
---
CTFD Instances

maybe if I filtered List summary information for all ranges by ctfd user id I could retreive
ip, from when to when, team/personal, ctfd data download, delete (vymaze ctfd instanciu)

I can retreive these from range config




you can create new route /range if you need new components you can download more from https://www.shadcn-svelte.com/docs/components

I want you to create a menu where you can do all this stuff which I will list and your current selection was remembered and everytime I return to that page I will be able to choose if continue or start again - use localstorage

so yeah the header will be Create Range

first you get to choose between SOLO | CTFD | SHARED based on what you choose your options will show which you can fill I have already created functions to get all topologies or to get all users so you can reuse those

### CTFD
combobox with topologyid and next to it topology name and you can choose specific topology id
combobox with list of users all other users are filtered out than CTFD*

### SOLO
combobox with topologyid and next to it topology name and you can choose specific topology id
textbox where you can put username [required], team[optional]

### SHARED
combobox with topologyid and next to it topology name and you can choose specific topology id
combobox with list of users all other users main user
textbox where you can put username [required], team[optional]


range share
range lshare

users check
users import [are you sure ?]
range abort their ranges [are you sure ?]
range remove
range set
range deploy














users ? should this be done through ui ?
- delete admin user (you cannot delete if he has running topology ? and game ?)
- create admin user returns apikey!! which can be retreived only by resetting it again

\- get proxmox creds for yourself - this would be best in a user menu
\- reset apikey for yourself - this would be best in a user menu


roles 
- add role from ansible galaxy / collection from ansible galaxy / add from folder would be nice 
- remove role

templates are created during install 



































Create Pool

pool.json - id
{
    "createdBy": "KWAZ",
    "type": "INDIVIDUAL",
    "mainUser": "KWAZ",  
    "usersAndTeams": [   
        {
            "user": "JSV"
        },
        {
            "user": "alicedan"
        }
    ],
    "topologyId": "6UfU9T",
    "ctfdDataId": "5tdebW",
    "note": "PENTEST WIN1"
}


	// Pool route
	r.POST("/pool", validateAPIKey, handlers.PostPool)
	r.PATCH("/pool/users", validateAPIKey, handlers.PatchPoolUsers)
	r.PATCH("/pool/topology", validateAPIKey, handlers.PatchPoolTopology)
	r.PATCH("/pool/ctfd", validateAPIKey, handlers.PatchPoolCtfdData)
	r.PATCH("/pool/note", validateAPIKey, handlers.PatchPoolNote)
	r.GET("/pool", validateAPIKey, handlers.GetPool)
	r.DELETE("/pool", validateAPIKey, handlers.DeletePool)


---

add endpoint retreive ctfdData lol :DD -> question of BATCH babies



### Pools
id [hidden] | note | createdBy | topologyId | ctfdDataId | ACTIONS: pool detail | download ctfdData.json | download logins.csv | download all wireguard configs.zip





### Pool detail 

SHARED
(if shared the main user is at the top and there is action next to him -> to share to all other users - lshare unshare all others and share new)
does user have active range ? allow destroy only if it is destroyed


NOT SHARED


- ACTIONS: change note | changeTopologyId |  add user | deploy all | remove all ranges | delete all users (check if user has an existing pool for him) | you will be able to see if they have all the same topology or not
pre kazdeho usera tam budes mat 

name | topology state | ACTIONS: redeploy | logs (viem si rozkliknut ten idividualny a vidim logy) | remove


are all topologies of users the same ? 

is user in other pool ?



in case of shared have all users shared their topology - show button to share  if not



### Pool detail logs
action download logs | reload icon (or longpool)

    delete users
    check users
    remove ranges
    deploy
    redeploy

### CTFDs

I want the check users button to first do check users from this script those users that dont exist I want them to be a popup there and I should be able to create those dont exist yet you can again user /src/lib/api/settings for that 

instead of reading usernames from file I want you to read them from form - just usernames

creating users can take time so you should visualize it in ui like creating and when they are created alert

Initiate
Cain
Cyrus
Nadia
Patty
Alice
Bob

##### USERID FUCKUP
--
/poll create
 what I can do is provide user and save it on backend as userId

 /pool get should be changed

 /pool/users same as /pool/create


and then I should remove the existing userId generating logic on the fornetend -> 

parse logs to retreive ctfd data!
--




### CREATE CTFD USER ? ADMIN USER ? - not really baby but user menu would be nice

\- get proxmox creds for yourself - this would be best in a user menu
\- reset apikey for yourself - this would be best in a user menu