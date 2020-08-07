import { PhysicsViewer, Nullable, AbstractMesh, Scene, Mesh, PhysicsImpostor } from "babylonjs"

export class ExposedPhysicsViewer extends PhysicsViewer {
  _meshes: Array<Nullable<AbstractMesh>> = []
  
  constructor(scene: Scene) {
    super(scene)
  }
  
  showImpostor(impostor: PhysicsImpostor, targetMesh?: Mesh): Nullable<AbstractMesh> {
    const mesh = super.showImpostor(impostor, targetMesh)
    return mesh
  }
}