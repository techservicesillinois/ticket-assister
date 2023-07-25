/**
 * Prefixes each key of {@param record} with {@param prefix}
 */
export function prefixRecordWith<V>(record: Record<string, V>, prefix: string): Record<string, V> {
	return Object.fromEntries(
		Object.entries(record).map(([key, value]) => [`${prefix}${key}`, value])
	);
}

/**
 * Determines if both sets are equal
 * i.e. have the same values
 * 
 * @remarks
 * Order does not matter in {@link Set}s.
 */
export function setsAreEqual<T>(set1: Set<T>, set2: Set<T>): boolean {
	if (set1.size !== set2.size) {
		return false;
	}
	for (const item of set1) {
		if (!set2.has(item)) {
			return false;
		}
	}

	return true;	
}