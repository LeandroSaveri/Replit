/**
 * MaterialSystem - wrapper for engine materials
 */
import { PBRMaterialFactory } from './PBRMaterialFactory';

export class MaterialSystem extends PBRMaterialFactory {
  constructor() {
    super();
  }

  dispose(): void {
    // Cleanup material resources - PBRMaterialFactory may not have dispose
    const parent = Object.getPrototypeOf(Object.getPrototypeOf(this));
    if (parent && typeof parent.dispose === 'function') {
      parent.dispose.call(this);
    }
  }
}

export { PBRMaterialFactory };
