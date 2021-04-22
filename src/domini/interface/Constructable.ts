export default interface Constructable<T> extends Function {
    new(...args: any[]): T;
}