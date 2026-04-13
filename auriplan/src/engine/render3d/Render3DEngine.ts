// Dentro da classe Render3DEngine, adicione:

public raycastGround(normalizedX: number, normalizedY: number): [number, number] | null {
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(normalizedX, normalizedY), this.camera);
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const target = new THREE.Vector3();
  const ray = raycaster.ray;
  if (ray.intersectPlane(plane, target)) {
    return [target.x, target.z];
  }
  return null;
}

public setControlsEnabled(enabled: boolean): void {
  if (this.controls) {
    this.controls.enabled = enabled;
  }
}
