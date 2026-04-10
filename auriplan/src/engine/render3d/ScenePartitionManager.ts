/**
 * Scene Partition Manager for AuriPlan
 * Implements spatial partitioning for efficient culling and rendering
 */

import * as THREE from 'three';

export interface PartitionCell {
  x: number;
  y: number;
  z: number;
  objects: THREE.Object3D[];
  boundingBox: THREE.Box3;
}

export interface PartitionConfig {
  cellSize: number;
  maxObjectsPerCell: number;
  maxDepth: number;
}

export class ScenePartitionManager {
  private cells = new Map<string, PartitionCell>();
  private config: PartitionConfig;
  private objectToCell = new Map<THREE.Object3D, string>();

  constructor(config: Partial<PartitionConfig> = {}) {
    this.config = {
      cellSize: 5,
      maxObjectsPerCell: 50,
      maxDepth: 5,
      ...config,
    };
  }

  /**
   * Get cell key from position
   */
  private getCellKey(x: number, y: number, z: number): string {
    const cx = Math.floor(x / this.config.cellSize);
    const cy = Math.floor(y / this.config.cellSize);
    const cz = Math.floor(z / this.config.cellSize);
    return `${cx},${cy},${cz}`;
  }

  /**
   * Get cell coordinates from key
   */
  private getCellCoords(key: string): { x: number; y: number; z: number } {
    const [cx, cy, cz] = key.split(',').map(Number);
    return { x: cx, y: cy, z: cz };
  }

  /**
   * Create a new cell
   */
  private createCell(x: number, y: number, z: number): PartitionCell {
    const minX = x * this.config.cellSize;
    const minY = y * this.config.cellSize;
    const minZ = z * this.config.cellSize;
    
    const boundingBox = new THREE.Box3(
      new THREE.Vector3(minX, minY, minZ),
      new THREE.Vector3(minX + this.config.cellSize, minY + this.config.cellSize, minZ + this.config.cellSize)
    );

    return {
      x,
      y,
      z,
      objects: [],
      boundingBox,
    };
  }

  /**
   * Get or create cell at position
   */
  private getOrCreateCell(x: number, y: number, z: number): PartitionCell {
    const key = this.getCellKey(x, y, z);
    
    if (!this.cells.has(key)) {
      const coords = this.getCellCoords(key);
      this.cells.set(key, this.createCell(coords.x, coords.y, coords.z));
    }
    
    return this.cells.get(key)!;
  }

  /**
   * Add object to partition
   */
  addObject(object: THREE.Object3D): void {
    const position = new THREE.Vector3();
    object.getWorldPosition(position);
    
    const key = this.getCellKey(position.x, position.y, position.z);
    const cell = this.getOrCreateCell(position.x, position.y, position.z);
    
    // Remove from previous cell if exists
    this.removeObject(object);
    
    cell.objects.push(object);
    this.objectToCell.set(object, key);
  }

  /**
   * Remove object from partition
   */
  removeObject(object: THREE.Object3D): void {
    const key = this.objectToCell.get(object);
    if (key) {
      const cell = this.cells.get(key);
      if (cell) {
        const index = cell.objects.indexOf(object);
        if (index !== -1) {
          cell.objects.splice(index, 1);
        }
      }
      this.objectToCell.delete(object);
    }
  }

  /**
   * Update object position in partition
   */
  updateObject(object: THREE.Object3D): void {
    this.removeObject(object);
    this.addObject(object);
  }

  /**
   * Get objects in cell at position
   */
  getObjectsAt(x: number, y: number, z: number): THREE.Object3D[] {
    const key = this.getCellKey(x, y, z);
    const cell = this.cells.get(key);
    return cell ? [...cell.objects] : [];
  }

  /**
   * Get objects in cells intersecting with frustum
   */
  getObjectsInFrustum(frustum: THREE.Frustum): THREE.Object3D[] {
    const objects: THREE.Object3D[] = [];
    const checked = new Set<THREE.Object3D>();

    for (const cell of this.cells.values()) {
      if (frustum.intersectsBox(cell.boundingBox)) {
        for (const obj of cell.objects) {
          if (!checked.has(obj)) {
            checked.add(obj);
            objects.push(obj);
          }
        }
      }
    }

    return objects;
  }

  /**
   * Get objects in radius from position
   */
  getObjectsInRadius(center: THREE.Vector3, radius: number): THREE.Object3D[] {
    const objects: THREE.Object3D[] = [];
    const radiusSquared = radius * radius;

    for (const cell of this.cells.values()) {
      // Quick check: cell center distance
      const cellCenter = new THREE.Vector3(
        cell.x * this.config.cellSize + this.config.cellSize / 2,
        cell.y * this.config.cellSize + this.config.cellSize / 2,
        cell.z * this.config.cellSize + this.config.cellSize / 2
      );

      if (cellCenter.distanceToSquared(center) <= radiusSquared + this.config.cellSize * this.config.cellSize * 3) {
        for (const obj of cell.objects) {
          const objPos = new THREE.Vector3();
          obj.getWorldPosition(objPos);
          if (objPos.distanceToSquared(center) <= radiusSquared) {
            objects.push(obj);
          }
        }
      }
    }

    return objects;
  }

  /**
   * Get all objects
   */
  getAllObjects(): THREE.Object3D[] {
    const objects: THREE.Object3D[] = [];
    const checked = new Set<THREE.Object3D>();

    for (const cell of this.cells.values()) {
      for (const obj of cell.objects) {
        if (!checked.has(obj)) {
          checked.add(obj);
          objects.push(obj);
        }
      }
    }

    return objects;
  }

  /**
   * Get partition statistics
   */
  getStats(): {
    totalCells: number;
    totalObjects: number;
    averageObjectsPerCell: number;
    maxObjectsInCell: number;
  } {
    let totalObjects = 0;
    let maxObjects = 0;

    for (const cell of this.cells.values()) {
      totalObjects += cell.objects.length;
      maxObjects = Math.max(maxObjects, cell.objects.length);
    }

    const totalCells = this.cells.size;

    return {
      totalCells,
      totalObjects,
      averageObjectsPerCell: totalCells > 0 ? totalObjects / totalCells : 0,
      maxObjectsInCell: maxObjects,
    };
  }

  /**
   * Clear all cells
   */
  clear(): void {
    this.cells.clear();
    this.objectToCell.clear();
  }
}

export default ScenePartitionManager;
