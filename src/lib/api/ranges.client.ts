import axios from 'axios';

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

export async function createRange(rangeData: RangeRequest): Promise<Range> {
	const response = await axios.post('/api/ranges', rangeData);
	return response.data;
}
