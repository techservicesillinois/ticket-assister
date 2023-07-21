/**
 * Prefixes each key of {@param record} with {@param prefix}
 */
export function prefixRecordWith<V>(record: Record<string, V>, prefix: string): Record<string, V> {
	return Object.fromEntries(
		Object.entries(record).map(([key, value]) => [`${prefix}${key}`, value])
	);
}