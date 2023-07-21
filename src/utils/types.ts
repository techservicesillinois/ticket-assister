/**
 * A Partial<{@param T}> that requires at the key(s) specified
 * in {@param K}
 * 
 * @remarks
 * from https://stackoverflow.com/a/57390160/8804293
 */
export type AtLeast<T, K extends keyof T> = Partial<T> & Pick<T, K>;
