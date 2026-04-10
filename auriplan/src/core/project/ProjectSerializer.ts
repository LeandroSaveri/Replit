import type { Project, Wall, Room, Furniture } from '@auriplan-types';
import * as THREE from 'three';
// Helper to access Vec2 tuple as x/y
function v2x(v: any): number { return Array.isArray(v) ? v[0] : v.x; }
function v2y(v: any): number { return Array.isArray(v) ? v[1] : v.y; }


// GLTFExporter/OBJExporter - dynamic import only

export class ProjectSerializer {
  // JSON serialization
  public serialize(project: Project): string {
    return JSON.stringify(project, null, 2);
  }

  public deserialize(json: string): Project {
    return JSON.parse(json);
  }

  // OBJ export
  public toOBJ(project: Project): string {
    const { floorPlan } = project;
    let obj = '# AuriPlan Export\n';
    obj += `# Project: ${project.name}\n`;
    obj += `# Created: ${project.createdAt}\n`;
    obj += '\n';

    let vertexOffset = 1;
    const vertices: string[] = [];
    const normals: string[] = [];
    const uvs: string[] = [];
    const faces: string[] = [];

    // Export walls
    (floorPlan?.walls ?? []).forEach((wall, index) => {
      obj += `# Wall ${index + 1}\n`;
      obj += `g wall_${index + 1}\n`;

      const wallMesh = this.createWallMesh(wall);
      const { v, n, u, f, offset } = this.meshToOBJ(wallMesh, vertexOffset);
      
      vertices.push(...v);
      normals.push(...n);
      uvs.push(...u);
      faces.push(...f);
      vertexOffset = offset;
    });

    // Export rooms (floors)
    (floorPlan?.rooms ?? []).forEach((room, index) => {
      obj += `# Room ${index + 1}\n`;
      obj += `g room_${index + 1}\n`;

      const roomMesh = this.createRoomMesh(room);
      const { v, n, u, f, offset } = this.meshToOBJ(roomMesh, vertexOffset);
      
      vertices.push(...v);
      normals.push(...n);
      uvs.push(...u);
      faces.push(...f);
      vertexOffset = offset;
    });

    // Export furniture
    (floorPlan?.furniture ?? []).forEach((furniture, index) => {
      obj += `# Furniture ${index + 1}\n`;
      obj += `g furniture_${index + 1}\n`;

      const furnitureMesh = this.createFurnitureMesh(furniture);
      const { v, n, u, f, offset } = this.meshToOBJ(furnitureMesh, vertexOffset);
      
      vertices.push(...v);
      normals.push(...n);
      uvs.push(...u);
      faces.push(...f);
      vertexOffset = offset;
    });

    // Combine all
    obj += vertices.join('');
    obj += '\n';
    obj += normals.join('');
    obj += '\n';
    obj += uvs.join('');
    obj += '\n';
    obj += faces.join('');

    return obj;
  }

  private meshToOBJ(mesh: THREE.Mesh, vertexOffset: number): { 
    v: string[]; 
    n: string[]; 
    u: string[]; 
    f: string[]; 
    offset: number 
  } {
    const vertices: string[] = [];
    const normals: string[] = [];
    const uvs: string[] = [];
    const faces: string[] = [];

    const geometry = mesh.geometry as THREE.BufferGeometry;
    const positionAttribute = geometry.getAttribute('position');
    const normalAttribute = geometry.getAttribute('normal');
    const uvAttribute = geometry.getAttribute('uv');
    const indexAttribute = geometry.getIndex();

    // Transform vertices by mesh matrix
    mesh.updateMatrixWorld();

    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      const z = positionAttribute.getZ(i);
      
      const vector = new THREE.Vector3(x, y, z);
      vector.applyMatrix4(mesh.matrixWorld);
      
      vertices.push(`v ${vector.x.toFixed(6)} ${vector.y.toFixed(6)} ${vector.z.toFixed(6)}\n`);
    }

    if (normalAttribute) {
      for (let i = 0; i < normalAttribute.count; i++) {
        const nx = normalAttribute.getX(i);
        const ny = normalAttribute.getY(i);
        const nz = normalAttribute.getZ(i);
        normals.push(`vn ${nx.toFixed(6)} ${ny.toFixed(6)} ${nz.toFixed(6)}\n`);
      }
    }

    if (uvAttribute) {
      for (let i = 0; i < uvAttribute.count; i++) {
        const u = uvAttribute.getX(i);
        const v = uvAttribute.getY(i);
        uvs.push(`vt ${u.toFixed(6)} ${v.toFixed(6)}\n`);
      }
    }

    if (indexAttribute) {
      for (let i = 0; i < indexAttribute.count; i += 3) {
        const i1 = indexAttribute.getX(i) + vertexOffset;
        const i2 = indexAttribute.getX(i + 1) + vertexOffset;
        const i3 = indexAttribute.getX(i + 2) + vertexOffset;
        faces.push(`f ${i1}/${i1}/${i1} ${i2}/${i2}/${i2} ${i3}/${i3}/${i3}\n`);
      }
    } else {
      for (let i = 0; i < positionAttribute.count; i += 3) {
        const i1 = i + vertexOffset;
        const i2 = i + 1 + vertexOffset;
        const i3 = i + 2 + vertexOffset;
        faces.push(`f ${i1}/${i1}/${i1} ${i2}/${i2}/${i2} ${i3}/${i3}/${i3}\n`);
      }
    }

    return {
      v: vertices,
      n: normals,
      u: uvs,
      f: faces,
      offset: vertexOffset + positionAttribute.count,
    };
  }

  // DAE (Collada) export
  public toDAE(project: Project): string {
    const { floorPlan } = project;
    
    let dae = `<?xml version="1.0" encoding="utf-8"?>\n`;
    dae += `<COLLADA xmlns="http://www.collada.org/2005/11/COLLADASchema" version="1.4.1">\n`;
    dae += `  <asset>\n`;
    dae += `    <created>${new Date().toISOString()}</created>\n`;
    dae += `    <modified>${new Date().toISOString()}</modified>\n`;
    dae += `    <unit name="meter" meter="1"/>\n`;
    dae += `    <up_axis>Y_UP</up_axis>\n`;
    dae += `  </asset>\n`;

    // Library of geometries
    dae += `  <library_geometries>\n`;

    let geometryId = 0;

    // Wall geometries
    (floorPlan?.walls ?? []).forEach((wall, index) => {
      const wallMesh = this.createWallMesh(wall);
      dae += this.meshToDAE(wallMesh, `wall_${index}_geometry`, geometryId++);
    });

    // Room geometries
    (floorPlan?.rooms ?? []).forEach((room, index) => {
      const roomMesh = this.createRoomMesh(room);
      dae += this.meshToDAE(roomMesh, `room_${index}_geometry`, geometryId++);
    });

    // Furniture geometries
    (floorPlan?.furniture ?? []).forEach((furniture, index) => {
      const furnitureMesh = this.createFurnitureMesh(furniture);
      dae += this.meshToDAE(furnitureMesh, `furniture_${index}_geometry`, geometryId++);
    });

    dae += `  </library_geometries>\n`;

    // Library of visual scenes
    dae += `  <library_visual_scenes>\n`;
    dae += `    <visual_scene id="Scene" name="Scene">\n`;

    // Add nodes for each object
    let nodeId = 0;

    (floorPlan?.walls ?? []).forEach((_, index) => {
      dae += `      <node id="wall_${index}_node" name="Wall ${index + 1}" type="NODE">\n`;
      dae += `        <instance_geometry url="#wall_${index}_geometry"/>\n`;
      dae += `      </node>\n`;
    });

    (floorPlan?.rooms ?? []).forEach((_, index) => {
      dae += `      <node id="room_${index}_node" name="Room ${index + 1}" type="NODE">\n`;
      dae += `        <instance_geometry url="#room_${index}_geometry"/>\n`;
      dae += `      </node>\n`;
    });

    (floorPlan?.furniture ?? []).forEach((_, index) => {
      dae += `      <node id="furniture_${index}_node" name="Furniture ${index + 1}" type="NODE">\n`;
      dae += `        <instance_geometry url="#furniture_${index}_geometry"/>\n`;
      dae += `      </node>\n`;
    });

    dae += `    </visual_scene>\n`;
    dae += `  </library_visual_scenes>\n`;

    dae += `  <scene>\n`;
    dae += `    <instance_visual_scene url="#Scene"/>\n`;
    dae += `  </scene>\n`;
    dae += `</COLLADA>\n`;

    return dae;
  }

  private meshToDAE(mesh: THREE.Mesh, name: string, id: number): string {
    const geometry = mesh.geometry as THREE.BufferGeometry;
    const positionAttribute = geometry.getAttribute('position');
    const normalAttribute = geometry.getAttribute('normal');
    const indexAttribute = geometry.getIndex();

    let dae = `    <geometry id="${name}" name="${name}">\n`;
    dae += `      <mesh>\n`;

    // Vertices
    dae += `        <source id="${name}-positions">\n`;
    dae += `          <float_array id="${name}-positions-array" count="${positionAttribute.count * 3}">`;
    
    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      const z = positionAttribute.getZ(i);
      dae += `${x} ${y} ${z} `;
    }
    
    dae += `</float_array>\n`;
    dae += `          <technique_common>\n`;
    dae += `            <accessor source="#${name}-positions-array" count="${positionAttribute.count}" stride="3">\n`;
    dae += `              <param name="X" type="float"/>\n`;
    dae += `              <param name="Y" type="float"/>\n`;
    dae += `              <param name="Z" type="float"/>\n`;
    dae += `            </accessor>\n`;
    dae += `          </technique_common>\n`;
    dae += `        </source>\n`;

    // Normals
    if (normalAttribute) {
      dae += `        <source id="${name}-normals">\n`;
      dae += `          <float_array id="${name}-normals-array" count="${normalAttribute.count * 3}">`;
      
      for (let i = 0; i < normalAttribute.count; i++) {
        const nx = normalAttribute.getX(i);
        const ny = normalAttribute.getY(i);
        const nz = normalAttribute.getZ(i);
        dae += `${nx} ${ny} ${nz} `;
      }
      
      dae += `</float_array>\n`;
      dae += `          <technique_common>\n`;
      dae += `            <accessor source="#${name}-normals-array" count="${normalAttribute.count}" stride="3">\n`;
      dae += `              <param name="X" type="float"/>\n`;
      dae += `              <param name="Y" type="float"/>\n`;
      dae += `              <param name="Z" type="float"/>\n`;
      dae += `            </accessor>\n`;
      dae += `          </technique_common>\n`;
      dae += `        </source>\n`;
    }

    // Vertices element
    dae += `        <vertices id="${name}-vertices">\n`;
    dae += `          <input semantic="POSITION" source="#${name}-positions"/>\n`;
    dae += `        </vertices>\n`;

    // Triangles
    const triangleCount = indexAttribute ? indexAttribute.count / 3 : positionAttribute.count / 3;
    dae += `        <triangles count="${triangleCount}">\n`;
    dae += `          <input semantic="VERTEX" source="#${name}-vertices" offset="0"/>\n`;
    
    if (normalAttribute) {
      dae += `          <input semantic="NORMAL" source="#${name}-normals" offset="1"/>\n`;
    }

    dae += `          <p>`;
    
    if (indexAttribute) {
      for (let i = 0; i < indexAttribute.count; i++) {
        dae += `${indexAttribute.getX(i)} `;
        if (normalAttribute) {
          dae += `${indexAttribute.getX(i)} `;
        }
      }
    } else {
      for (let i = 0; i < positionAttribute.count; i++) {
        dae += `${i} `;
        if (normalAttribute) {
          dae += `${i} `;
        }
      }
    }
    
    dae += `</p>\n`;
    dae += `        </triangles>\n`;
    dae += `      </mesh>\n`;
    dae += `    </geometry>\n`;

    return dae;
  }

  // GLTF export
  public async toGLTF(project: Project): Promise<Blob> {
    const scene = new THREE.Scene();
    scene.name = project.name;

    // Add walls
    (project.floorPlan?.walls ?? []).forEach(wall => {
      scene.add(this.createWallMesh(wall));
    });

    // Add rooms
    (project.floorPlan?.rooms ?? []).forEach(room => {
      scene.add(this.createRoomMesh(room));
    });

    // Add furniture
    (project.floorPlan?.furniture ?? []).forEach(furniture => {
      scene.add(this.createFurnitureMesh(furniture));
    });

    const GLTFExporter = (typeof THREE !== 'undefined' && (THREE as any).GLTFExporter) || class { parse(s: any, cb: any, err: any, opts: any) { err(new Error('GLTFExporter not available')); } };
    const exporter = new GLTFExporter();
    
    return new Promise((resolve, reject) => {
      exporter.parse(
        scene,
        (gltf: any) => {
          const blob = new Blob([JSON.stringify(gltf)], { type: 'application/json' });
          resolve(blob);
        },
        (error: any) => {
          reject(error);
        },
        { binary: false }
      );
    });
  }

  // Helper methods for creating meshes
  private createWallMesh(wall: Wall): THREE.Mesh {
    const start = new THREE.Vector3(v2x(wall.start), 0, v2y(wall.start));
    const end = new THREE.Vector3(v2x(wall.end), 0, v2y(wall.end));
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    const angle = Math.atan2(direction.z, direction.x);

    const geometry = new THREE.BoxGeometry(length, 2.8, 0.15);
    const material = new THREE.MeshStandardMaterial({ color: 0xf5f5f5 });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(
      (v2x(wall.start) + v2x(wall.end)) / 2,
      1.4,
      (v2y(wall.start) + v2y(wall.end)) / 2
    );
    mesh.rotation.y = -angle;

    return mesh;
  }

  private createRoomMesh(room: Room): THREE.Mesh {
    if (room.points.length < 3) {
      return new THREE.Mesh();
    }

    const shape = new THREE.Shape();
    shape.moveTo(v2x(room.points[0]), v2y(room.points[0]));
    for (let i = 1; i < room.points.length; i++) {
      shape.lineTo(v2x(room.points[i]), v2y(room.points[i]));
    }
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.1,
      bevelEnabled: false,
    });

    const color = (room as any).material?.color ? parseInt((room as any).material.color.replace('#', ''), 16) : 0xd4a574;
    const material = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0;

    return mesh;
  }

  private createFurnitureMesh(furniture: Furniture): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(
      furniture.width,
      furniture.height,
      furniture.depth
    );

    const color = furniture.color ? parseInt(furniture.color.replace('#', ''), 16) : 0x8b4513;
    const material = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);

    const fPos = furniture.position;
    const fx = Array.isArray(fPos) ? fPos[0] : (fPos as any).x ?? 0;
    const fy = Array.isArray(fPos) ? fPos[1] : (fPos as any).y ?? 0;
    const fz = Array.isArray(fPos) ? fPos[2] : (fPos as any).z ?? 0;
    mesh.position.set(
      fx,
      (furniture.height ?? 0) / 2 + fz,
      fy
    );
    const fRot = furniture.rotation;
    mesh.rotation.y = -(Array.isArray(fRot) ? fRot[1] : typeof fRot === 'number' ? fRot : (fRot as any).y ?? 0);

    return mesh;
  }
}
