/**
 * Shared interfaces and types for API responses
 */

// Common User interface
export interface User {
    name: string;
    userID: string;
    dateCreated: string;
    isAdmin: boolean;
}

// Ludus Templates
export interface LudusTemplate {
    name: string;
    built: boolean;
}

// Ludus Roles - using consistent casing
export interface LudusRole {
    Name: string;
    Version: string;
    Type: string;
    Global: boolean;
}

// Factory function to create LudusRole with version normalization
export function createLudusRole(item: any): LudusRole {
    return {
        Name: item.Name,
        Version: item.Version === '(unknown version)' ? 'custom' : item.Version,
        Type: item.Type,
        Global: item.Global
    };
}

// API Response wrappers
export interface ApiResponse {
    message: string;
    success: boolean;
}

// Pool related interfaces
export interface PoolUserAndTeam {
    user: string;
    team?: string;
}

export interface PoolRequest {
    type: 'SHARED' | 'INDIVIDUAL';
    mainUser?: string;
    usersAndTeams?: PoolUserAndTeam[];
    topologyId: string;
    note?: string;
}

// Dulus specific interfaces
export interface UsersCheckResponse {
    allExist: boolean;
    missingUserIds: string[];
}

export interface TopologyCheckResponse {
    matchPoolTopology: boolean;
}

export interface StatusCheckResponse {
    allDeployed: boolean;
    results: Array<{
        state: string;
        userId: string;
    }>;
}

export interface Topology {
    topologyId: string;
    topologyName: string;
    createdAt: string;
}

// User existence check
export interface UserExistsCheck {
    exists: boolean;
    userId: string;
}

export interface UserCheckResult {
    userId: string;
    exists: boolean;
}

export interface UserCheckResponse {
    results: UserCheckResult[];
}

// Roles interfaces
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

// Ludus logs
export interface LudusLogResponse {
    result: string;
    cursor: number;
}

// Range interfaces
export interface RangeRequest {
    name: string;
    description?: string;
    type: 'INDIVIDUAL' | 'SHARED' | 'CTFD';
    topology_id: string;
    users?: string[];
    adminPassword?: string;
}

export interface Range {
    id: string;
    name: string;
    description: string;
    status: string;
    topology_id: string;
    users: string[];
    created_at: string;
    updated_at: string;
}

// Pool detail interfaces
export interface PoolUserTeam {
    team: string;
    user: string;
    userId: string;
    status?: string;
    userType?: 'regular' | 'main';
}

export interface PoolDetail {
    createdBy: string;
    ctfdData: boolean;
    mainUser: string;
    note: string;
    poolId: string;
    topologyId: string;
    type: string;
    usersAndTeams: PoolUserTeam[];
    createdAt: string;
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

// User patch interface for pool user operations
export interface PatchUserRequest {
    user: string;
    team?: string;
}

// Scenario interfaces
export interface Scenario {
    ID: string;
    Name: string;
    Created: string;
}
