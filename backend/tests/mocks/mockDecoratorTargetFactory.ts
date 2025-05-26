/* eslint-disable @typescript-eslint/no-explicit-any */
import "reflect-metadata";

//#region Class Decorator

type Constructor = new (...args: any[]) => any;
type ClassDecoratorFactory = (...args: any[]) => ClassDecorator;

/**
 * Creates a test target class with a class decorator applied.
 *
 * @param decorator The class decorator factory to apply.
 * @param decoratorArgs The arguments to pass to the decorator factory.
 * @returns The test target class with the applied decorator.
 */
export function createMockClassDecoratorTestTarget<
    T extends ClassDecoratorFactory,
>(decorator: T, ...decoratorArgs: Parameters<T>): Constructor {
    @decorator(...decoratorArgs)
    // eslint-disable-next-line @typescript-eslint/no-extraneous-class
    class TestTarget {}

    return TestTarget;
}

//#endregion

//#region Method Decorator

type MethodDecoratorFactory = (...args: any[]) => MethodDecorator;

interface MockMethodDecoratorTest {
    /**
     * The prototype of the class where the method decorator is applied.
     */
    readonly prototype: object;

    /**
     * The instance of the class where the method decorator is applied.
     */
    readonly instance: object;

    /**
     * The name of the method that has the decorator applied.
     */
    readonly methodName: string;
}

/**
 * Creates a test target class with a method decorator applied to one of its methods.
 *
 * @param decorator The method decorator factory to apply.
 * @param decoratorArgs The arguments to pass to the decorator factory.
 * @returns An object containing the prototype of the class, an instance of the class,
 * and the method name that has the decorator applied.
 */
export function createMockMethodDecoratorTestTarget<
    T extends MethodDecoratorFactory,
>(decorator: T, ...decoratorArgs: Parameters<T>): MockMethodDecoratorTest {
    const methodName = "testMethod";

    class TestTarget {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        [methodName]() {}
    }

    decorator(...decoratorArgs)(
        TestTarget.prototype,
        methodName,
        Object.getOwnPropertyDescriptor(TestTarget.prototype, methodName)!
    );

    return {
        prototype: TestTarget.prototype,
        instance: new TestTarget(),
        methodName,
    };
}

//#endregion
