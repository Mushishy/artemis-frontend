// API
export interface ApiResponse {
    message: string;
    success: boolean;
}

// USER
export interface User {
    name: string;
    userID: string;
    dateCreated: string;
    isAdmin: boolean;
}

export interface UserExistsCheck {
    exists: boolean;
    userId: string;
}

export interface UsersCheckResponse {
    allExist: boolean;
    missingUserIds: string[];
}

export interface UserRangeVM {
    ID: number;
    proxmoxID: number;
    rangeNumber: number;
    name: string;
    poweredOn: boolean;
    ip: string;
}

export interface UserRange {
    userID: string;
    rangeNumber: number;
    lastDeployment: string;
    numberOfVMs: number;
    testingEnabled: boolean;
    VMs: UserRangeVM[];
    allowedDomains: string[];
    allowedIPs: string[];
    rangeState: string;
}

// TEMPLATE
export interface LudusTemplate {
    name: string;
    built: boolean;
}

// UI-formatted template for display purposes
export interface TemplateDisplay {
    name: string;
    status: boolean;
}

export interface LudusRole {
    Name: string;
    Version: string;
    Type: string;
    Global: boolean;
}

export interface LudusLogResponse {
    result: string;
    cursor: number;
}

// POOL
export interface PoolUserAndTeam {
    user: string;
    team?: string;
}

export interface PoolRequest {
    type: 'SHARED' | 'INDIVIDUAL';
    usersAndTeams: PoolUserTeam[];
    topologyId: string;
    note?: string;
}

export interface PoolUserTeam {
    team: string;
    user: string;
    userId: string;
    mainUserId: string;
    status?: string;
    userType?: 'regular' | 'main';
}

export interface PoolDetail {
    createdBy: string;
    ctfdData: boolean;
    note: string;
    poolId: string;
    topologyId: string;
    type: string;
    usersAndTeams: PoolUserTeam[];
    createdAt: string;
    mainUsers?: string[]; // Processed array of unique mainUserId values
}

export interface PoolDetailData {
    users: boolean | null;
    topology: boolean | null;
    status: string | null;
    flags: boolean | null;
    isLoading: boolean;
}

export interface PoolHealthCheck {
    users: {
        allExist: boolean;
        missingUserIds: string[];
    } | null;
    topology: {
        matchPoolTopology: boolean;
    } | null;
    status: {
        allDeployed: boolean;
        results: Array<{
            state: string;
            userId: string;
        }>;
    } | null;
    isLoading: boolean;
}

export interface PatchUserRequest {
    user: string;
    team?: string;
}

export interface Pool {
    poolId: string;
    note?: string;
    createdBy: string;
    type: 'INDIVIDUAL' | 'SHARED' | 'CTFD';
    topologyId: string;
    ctfdData: boolean;
    createdAt: string;
    mainUser?: string;
}

export interface StatusCheckResponse {
    allDeployed: boolean;
    results: Array<{
        state: string;
        userId: string;
    }>;
}

// TOPOLOGY
export interface TopologyCheckResponse {
    matchPoolTopology: boolean;
}

export interface Topology {
    topologyId: string;
    topologyName: string;
    createdAt: string;
}

// UI-formatted topology for display purposes
export interface TopologyDisplay {
    ID: string;
    Name: string;
    Created: string;
}

// ROLE
export interface InstallRoleRequest {
    role: string;
    version: string;
    force: boolean;
    action: 'install';
    global: boolean;
}

export interface InstallCollectionRequest {
    collection: string;
    version: string;
    force: boolean;
}

export interface Scenario {
    ID: string;
    Name: string;
    Created: string;
}

export interface ProxmoxStatsResponse {
    users: number
    templates: number 
    vms: number 
    numberOfTopologies: number
    numberOfScenarios: number
    numberOfRoles: number
    numberOfPools: number
    cpuUsagePercentage: number
    maxCpu: number
    memoryUsedGiB: number
    memoryTotalGiB: number
    memoryFreeGiB: number
    diskUsedGiB: number
    diskTotalGiB: number
    uptimeFormatted: string
}

// CTFD
export interface CtfdTopologyRequest {
    topologyName: string;
    scenarioId: string;
    poolId: string;
    usernameConfig?: string;
    passwordConfig?: string;
    adminUsername?: string;
    adminPassword?: string;
    ctfName?: string;
    ctfDescription?: string;
    challengeVisibility?: 'private' | 'public';
    accountVisibility?: 'private' | 'public';
    scoreVisibility?: 'private' | 'public';
    registrationVisibility?: 'private' | 'public';
    allowNameChanges?: 'no' | 'yes';
    allowTeamCreation?: 'no' | 'yes';
    allowTeamDisbanding?: 'no' | 'yes';
    confStartTime?: string;
    confStopTime?: string;
    timeZone?: string;
    allowViewingAfter?: 'no' | 'yes';
}

export interface CtfdTopologyResponse {
    message: string;
    topologyId: string;
    topologyName: string;
}