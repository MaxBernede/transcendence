// IBaseService.ts
export interface IBaseService<T> {
	getAll(): Promise<T[]>;
	getOne(id: number): Promise<T>;
	delete(id: number): Promise<void>;
	create(entity: T): Promise<T>;
}
