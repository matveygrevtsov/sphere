import * as THREE from 'three'
import * as dat from 'dat.gui'
import image from '../../images/text.png'

const mediaBreakPoint = 1024

const config = {
  radius: 4.5,
  cardSize: 1,
  rotationSpeed: 1,
  color: '#6101AF',
  mouseSensitivity: 1,
}

interface CubeProps {
  sizeX: number
  sizeY: number
  sizeZ: number
  positionX: number
  positionY: number
  positionZ: number
  rotation: number | undefined
}

interface AnimatorProps {
  containerHtmlElement: HTMLElement
}

export class Animator {
  private readonly containerHtmlElement: HTMLElement
  private readonly scene: THREE.Scene
  private readonly camera: THREE.PerspectiveCamera
  private readonly renderer: THREE.WebGLRenderer
  private readonly textureLoader: THREE.TextureLoader
  private readonly group: THREE.Group
  private texture: THREE.Texture | undefined
  private requestAnimation: number

  constructor(props: AnimatorProps) {
    this.containerHtmlElement = props.containerHtmlElement

    // Объявляем сцену
    this.scene = new THREE.Scene()
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.9))

    // Объявляем камеру
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.containerHtmlElement.clientWidth /
        this.containerHtmlElement.clientHeight,
      0.1,
      1000,
    )
    this.camera.position.z = 10

    // Объявляем renderer
    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = true

    // Объявляем группу
    this.group = new THREE.Group()
    this.scene.add(this.group)

    this.requestAnimation = 0

    // Объявляем свет
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(ambientLight)
    const pointLight = new THREE.PointLight(0xffffff, 0.5)
    pointLight.position.x = 2
    pointLight.position.y = 3
    pointLight.position.z = 4
    this.scene.add(pointLight)

    // Объявляем TextureLoader
    this.textureLoader = new THREE.TextureLoader()

    window.addEventListener('resize', () => this.resize())
    window.addEventListener('mousemove', (event) => this.handleMouseMove(event))
  }

  private handleMouseMove(event: MouseEvent) {
    if (window.innerWidth < mediaBreakPoint) {
      return undefined
    }
    this.rotateGroup(
      (event.y - this.containerHtmlElement.clientHeight / 2) *
        config.mouseSensitivity,
      (event.x - this.containerHtmlElement.clientWidth / 2) *
        config.mouseSensitivity,
    )
  }

  private refreshScene() {
    this.group.clear()
    this.addObjectsToScene()
  }

  private initDebugUi() {
    const gui = new dat.GUI()
    gui
      .add(config, 'radius')
      .min(1)
      .max(7)
      .step(0.01)
      .name('Radius')
      .onChange(() => this.refreshScene())

    gui
      .add(config, 'cardSize')
      .min(0.7)
      .max(5)
      .step(0.01)
      .name('cardSize')
      .onChange(() => this.refreshScene())

    gui
      .add(config, 'mouseSensitivity')
      .min(0.01)
      .max(2)
      .step(0.01)
      .name('mouseSensitivity')

    gui
      .add(config, 'rotationSpeed')
      .min(1)
      .max(10)
      .step(0.001)
      .name('mobileRotation')

    gui.addColor(config, 'color').onChange(() => this.refreshScene())
  }

  private resize() {
    const width = this.containerHtmlElement.clientWidth
    const height = this.containerHtmlElement.clientHeight

    // Update camera
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()

    // Update renderer
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  private addObjectsToScene() {
    // Количество субсфер
    const subSphereNumber =
      1 + Math.floor((config.radius - config.cardSize / 2) / config.cardSize)
    for (
      let subSphereIndex = 0;
      subSphereIndex < subSphereNumber;
      subSphereIndex++
    ) {
      const subSphereRadius = (subSphereIndex + 0.5) * config.cardSize

      if (config.cardSize > 2 * subSphereRadius) {
        continue
      }

      // Количество окружностей на субсфере
      const circlesNumber = Math.floor(
        Math.PI / (2 * Math.asin(config.cardSize / (2 * subSphereRadius))),
      )
      for (let circleIndex = 0; circleIndex <= circlesNumber; circleIndex++) {
        const y =
          subSphereRadius * Math.cos((Math.PI / circlesNumber) * circleIndex)

        const circleRadius = Math.sqrt(
          Math.max(subSphereRadius * subSphereRadius - y * y, 0),
        )

        // Количество объектов, которые уместятся на окружности
        const itemsNumber =
          config.cardSize > 2 * circleRadius
            ? 1
            : Math.floor(
                Math.PI / Math.asin(config.cardSize / (2 * circleRadius)),
              )

        for (let itemIndex = 0; itemIndex < itemsNumber; itemIndex++) {
          this.addCubeToScene({
            sizeX: config.cardSize / Math.sqrt(2),
            sizeY: config.cardSize / Math.sqrt(2),
            sizeZ: config.cardSize / Math.sqrt(2) / 20,
            positionX:
              circleRadius * Math.cos((2 * Math.PI * itemIndex) / itemsNumber),
            positionY: y,
            positionZ:
              circleRadius * Math.sin((2 * Math.PI * itemIndex) / itemsNumber),
            rotation: itemIndex + Math.random(),
          })
        }
      }
    }
  }

  private addCubeToScene({
    sizeX,
    sizeY,
    sizeZ,
    positionX,
    positionY,
    positionZ,
    rotation,
  }: CubeProps) {
    const geometry = new THREE.BoxGeometry(sizeX, sizeY, sizeZ)
    const material = []

    material.push(new THREE.MeshLambertMaterial({ color: config.color }))
    material.push(new THREE.MeshLambertMaterial({ color: config.color }))
    material.push(new THREE.MeshLambertMaterial({ color: config.color }))
    material.push(new THREE.MeshLambertMaterial({ color: config.color }))
    material.push(
      new THREE.MeshLambertMaterial({
        color: config.color,
        map: this.texture,
      }),
    )
    material.push(
      new THREE.MeshLambertMaterial({
        color: config.color,
        map: this.texture,
      }),
    )

    const cube = new THREE.Mesh(geometry, material)
    cube.position.x = positionX
    cube.position.y = positionY
    cube.position.z = positionZ
    if (rotation !== undefined) {
      cube.rotation.x = rotation
      cube.rotation.y = rotation
    }
    cube.castShadow = true
    this.group.add(cube)
  }

  private incrementRotation() {
    this.group.rotation.x += config.rotationSpeed / 1000
    this.group.rotation.y += config.rotationSpeed / 1000
  }

  private rotateGroup(x: number, y: number) {
    this.group.rotation.x = x / 1000
    this.group.rotation.y = y / 1000
  }

  private animate = (): void => {
    this.renderer.render(this.scene, this.camera)
    if (window.innerWidth < mediaBreakPoint) {
      this.incrementRotation()
    }
    this.requestAnimation = requestAnimationFrame(this.animate)
  }

  public start() {
    this.textureLoader.load(image, (texture) => {
      this.texture = texture
      this.containerHtmlElement.appendChild(this.renderer.domElement)
      this.addObjectsToScene()
      this.initDebugUi()
      this.requestAnimation = requestAnimationFrame(this.animate)
    })
  }

  public destroy() {
    cancelAnimationFrame(this.requestAnimation)
  }
}
