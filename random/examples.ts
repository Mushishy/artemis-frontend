// Example usage of the DataTable component

import { DataTable } from '$lib/components/ui/data-table';

// Example 1: Basic template data (as you're using)
const templateHeaders = [
	{ key: 'name', label: 'Template Name' },
	{ key: 'status', label: 'Status' },
	{ key: 'type', label: 'Type' },
	{ key: 'os', label: 'OS' }
];

// Example 2: User data with boolean values
interface User {
	name: string;
	email: string;
	active: boolean;
	role: string;
}

const userHeaders = [
	{ key: 'name', label: 'Name' },
	{ key: 'email', label: 'Email' },
	{ key: 'active', label: 'Active' },
	{ key: 'role', label: 'Role' }
];

const users: User[] = [
	{ name: 'John Doe', email: 'john@example.com', active: true, role: 'Admin' },
	{ name: 'Jane Smith', email: 'jane@example.com', active: false, role: 'User' }
];

// Usage in Svelte component:
// <DataTable data={users} headers={userHeaders} itemsPerPage={10} />

export { templateHeaders, userHeaders, users };
