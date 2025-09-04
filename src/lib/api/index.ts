/**
 * Centralized API exports
 * Import from here for consistent API access across the application
 */

// Core API client factory
export { 
    ApiClientFactory,
    getDulusClient,
    getLudusClient,
    getLudusAdminClient,
    getInternalApiClient,
    isServerEnvironment
} from './api-client';

// All shared types
export * from './types';

// API functions organized by domain
export * as Users from './users.client';
export * as Pools from './pools.client';
export * as Roles from './roles.client';
export * as Topology from './topology.client';
export * as CTFDScenario from './ctfd_scenario.client';
export * as Ranges from './ranges.client';
export * as Ludus from './ludus';

// Settings
export * from './settings';
