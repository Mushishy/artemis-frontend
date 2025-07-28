# DataTable Component

A reusable, paginated data table component for SvelteKit with TypeScript support.

## Features

- **Generic Type Support**: Works with any data type
- **Pagination**: Built-in pagination with configurable items per page
- **Sorting**: Click column headers to sort (with visual indicators)
- **Scrollable**: Fixed height with scrollable content area
- **Sticky Headers**: Headers remain visible while scrolling
- **Boolean Highlighting**: Automatically highlights boolean values (true = green, false = red)
- **Status Highlighting**: Automatically highlights "Built"/"Not Built" status values
- **Responsive Design**: Mobile-friendly with horizontal scrolling
- **Dark Mode Support**: Full Tailwind CSS dark mode compatibility

## Usage

```svelte
<script lang="ts">
	import { DataTable } from '$lib/components/ui/data-table';

	interface MyData {
		name: string;
		status: "Built" | "Not Built";
		active: boolean;
	}

	const headers = [
		{ key: 'name', label: 'Name', sortable: true },
		{ key: 'status', label: 'Status', sortable: true },
		{ key: 'active', label: 'Active', sortable: false }
	];

	const data: MyData[] = [
		{ name: 'Item 1', status: 'Built', active: true },
		{ name: 'Item 2', status: 'Not Built', active: false }
	];
</script>

<DataTable {data} {headers} itemsPerPage={10} maxHeight="400px" />
```

## Props

- `data`: Array of objects to display
- `headers`: Array of header definitions with `key`, `label`, and optional `sortable`
- `itemsPerPage` (optional): Number of items per page (default: 8)
- `currentPage` (optional): Current page number (default: 1)
- `maxHeight` (optional): Maximum height of the scrollable area (default: "400px")

## Header Configuration

```typescript
{
  key: keyof T;        // The property key from your data
  label: string;       // Display name for the column
  sortable?: boolean;  // Whether the column is sortable (default: true)
}
```

## Sorting

- Click any column header to sort by that column
- Click again to reverse the sort direction
- Visual indicators show current sort column and direction
- Sorting resets pagination to page 1

## Highlighting Rules

The component automatically applies styling to:

1. **Boolean values**: `true` values are highlighted in green, `false` values in red
2. **Status values**: "Built" is highlighted in green, "Not Built" in red
3. **First column**: Always styled as a table header (bold font)
4. **Boolean/Status columns**: Content is centered, other content is left-aligned

## Scrolling

- Table has a fixed height with scrollable content
- Headers are sticky and remain visible while scrolling
- Horizontal scrolling available for narrow screens
