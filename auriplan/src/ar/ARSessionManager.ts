/**
 * AR Session Manager
 * Gerencia sessões WebXR AR para escaneamento de ambientes
 */

import { EventEmitter } from '../utils/EventEmitter';
import { RoomScanner, RoomScanResult } from './RoomScanner';
import { RoomScanConverter } from './RoomScanConverter';
import { FloorPlanData } from './RoomScanConverter';

export interface ARSessionConfig {
  requiredFeatures: string[];
  optionalFeatures: string[];
  domOverlay?: { root: HTMLElement };
}

export interface ARSessionState {
  isSupported: boolean;
  isInitialized: boolean;
  isScanning: boolean;
  hasPermissions: boolean;
  error: string | null;
}

export type ARSessionPhase = 
  | 'idle'
  | 'initializing'
  | 'requesting-permissions'
  | 'scanning'
  | 'processing'
  | 'converting'
  | 'completed'
  | 'error';

export interface ARProgressUpdate {
  phase: ARSessionPhase;
  progress: number;
  message: string;
  details?: any;
}

export class ARSessionManager extends EventEmitter {
  private static instance: ARSessionManager;
  private roomScanner: RoomScanner;
  private scanConverter: RoomScanConverter;
  private sessionState: ARSessionState;
  private currentPhase: ARSessionPhase = 'idle';
  private xrSession: XRSession | null = null;
  private xrReferenceSpace: XRReferenceSpace | null = null;
  private scanResult: RoomScanResult | null = null;
  private floorPlanResult: FloorPlanData | null = null;

  // Configuration
  private readonly defaultConfig: ARSessionConfig = {
    requiredFeatures: ['hit-test', 'dom-overlay'],
    optionalFeatures: ['light-estimation', 'anchors'],
  };

  private constructor() {
    super();
    this.roomScanner = new RoomScanner();
    this.scanConverter = new RoomScanConverter();
    this.sessionState = {
      isSupported: false,
      isInitialized: false,
      isScanning: false,
      hasPermissions: false,
      error: null,
    };

    this.setupEventListeners();
  }

  static getInstance(): ARSessionManager {
    if (!ARSessionManager.instance) {
      ARSessionManager.instance = new ARSessionManager();
    }
    return ARSessionManager.instance;
  }

  private setupEventListeners(): void {
    // Forward scanner events
    this.roomScanner.on('progress', (progress) => {
      this.emit('scanProgress', progress);
    });

    this.roomScanner.on('wallDetected', (wall) => {
      this.emit('wallDetected', wall);
    });

    this.roomScanner.on('cornerDetected', (corner) => {
      this.emit('cornerDetected', corner);
    });

    this.roomScanner.on('scanComplete', (result) => {
      this.scanResult = result;
      this.emit('scanComplete', result);
    });

    this.roomScanner.on('error', (error) => {
      this.setError(error.message);
    });
  }

  /**
   * Check if WebXR AR is supported
   */
  async checkSupport(): Promise<boolean> {
    if (!navigator.xr) {
      this.sessionState.isSupported = false;
      return false;
    }

    try {
      const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
      this.sessionState.isSupported = isSupported;
      return isSupported;
    } catch (error) {
      this.sessionState.isSupported = false;
      return false;
    }
  }

  /**
   * Initialize AR session
   */
  async initialize(config?: Partial<ARSessionConfig>): Promise<boolean> {
    this.setPhase('initializing');
    this.emit('progress', {
      phase: 'initializing',
      progress: 0,
      message: 'Initializing AR session...',
    } as ARProgressUpdate);

    // Check support first
    const isSupported = await this.checkSupport();
    if (!isSupported) {
      this.setError('WebXR AR is not supported on this device');
      return false;
    }

    this.emit('progress', {
      phase: 'initializing',
      progress: 50,
      message: 'AR is supported',
    } as ARProgressUpdate);

    // Check camera permissions
    this.setPhase('requesting-permissions');
    this.emit('progress', {
      phase: 'requesting-permissions',
      progress: 60,
      message: 'Requesting camera permissions...',
    } as ARProgressUpdate);

    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) {
      this.setError('Camera permissions denied');
      return false;
    }

    this.sessionState.hasPermissions = true;
    this.sessionState.isInitialized = true;

    this.emit('progress', {
      phase: 'initializing',
      progress: 100,
      message: 'AR session initialized successfully',
    } as ARProgressUpdate);

    this.setPhase('idle');
    return true;
  }

  /**
   * Request camera and AR permissions
   */
  private async requestPermissions(): Promise<boolean> {
    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  /**
   * Start AR session with WebXR
   */
  async startARSession(canvas: HTMLCanvasElement, config?: Partial<ARSessionConfig>): Promise<boolean> {
    if (!this.sessionState.isInitialized) {
      const initialized = await this.initialize(config);
      if (!initialized) return false;
    }

    try {
      const sessionConfig: ARSessionConfig = {
        ...this.defaultConfig,
        ...config,
      };

      // Request XR session
      this.xrSession = await navigator.xr!.requestSession('immersive-ar', {
        requiredFeatures: sessionConfig.requiredFeatures as string[],
        optionalFeatures: sessionConfig.optionalFeatures as string[],
        domOverlay: sessionConfig.domOverlay,
      });

      // Setup session event listeners
      this.xrSession.addEventListener('end', () => {
        this.handleSessionEnd();
      });

      // Get reference space
      this.xrReferenceSpace = await this.xrSession.requestReferenceSpace('local-floor');

      // Setup WebGL context for rendering
      const gl = canvas.getContext('webgl2', { xrCompatible: true });
      if (!gl) {
        throw new Error('WebGL2 not supported');
      }

      // Make XR session use this context
      // @ts-ignore - WebXR API
      await this.xrSession.updateRenderState({
        baseLayer: new XRWebGLLayer(this.xrSession, gl),
      });

      // Start render loop
      this.xrSession.requestAnimationFrame(this.onXRFrame.bind(this));

      this.emit('sessionStarted', { session: this.xrSession });
      return true;

    } catch (error) {
      this.setError(`Failed to start AR session: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  /**
   * XR frame callback
   */
  private onXRFrame(time: DOMHighResTimeStamp, frame: XRFrame): void {
    if (!this.xrSession) return;

    const session = frame.session;
    const pose = frame.getViewerPose(this.xrReferenceSpace!);

    if (pose) {
      // Get camera position and orientation
      const cameraTransform = pose.transform;
      const position = cameraTransform.position;
      const orientation = cameraTransform.orientation;

      // Emit camera update for scanner
      this.emit('cameraUpdate', {
        position: { x: position.x, y: position.y, z: position.z },
        orientation: { x: orientation.x, y: orientation.y, z: orientation.z, w: orientation.w },
      });
    }

    // Continue render loop
    session.requestAnimationFrame(this.onXRFrame.bind(this));
  }

  /**
   * Start room scanning
   */
  async startScanning(): Promise<void> {
    if (!this.sessionState.isInitialized) {
      throw new Error('AR session not initialized');
    }

    this.setPhase('scanning');
    this.sessionState.isScanning = true;

    this.emit('progress', {
      phase: 'scanning',
      progress: 0,
      message: 'Starting room scan...',
    } as ARProgressUpdate);

    // Start the room scanner
    await this.roomScanner.startScanning();

    this.emit('scanningStarted');
  }

  /**
   * Stop room scanning and process results
   */
  async stopScanning(): Promise<RoomScanResult> {
    if (!this.sessionState.isScanning) {
      throw new Error('Not currently scanning');
    }

    this.setPhase('processing');
    this.emit('progress', {
      phase: 'processing',
      progress: 0,
      message: 'Processing scan data...',
    } as ARProgressUpdate);

    const result = await this.roomScanner.stopScanning();
    this.sessionState.isScanning = false;

    this.emit('progress', {
      phase: 'processing',
      progress: 100,
      message: 'Scan processing complete',
    } as ARProgressUpdate);

    if (!result) throw new Error('Scan produced no result');
    return result;
  }

  /**
   * Convert scan to floor plan
   */
  async convertToFloorPlan(scanResult?: RoomScanResult): Promise<FloorPlanData> {
    const scan = scanResult || this.scanResult;
    
    if (!scan) {
      throw new Error('No scan result available');
    }

    this.setPhase('converting');
    this.emit('progress', {
      phase: 'converting',
      progress: 0,
      message: 'Converting scan to floor plan...',
    } as ARProgressUpdate);

    try {
      const floorPlan = await this.scanConverter.convertScanToFloorPlan(scan);
      this.floorPlanResult = floorPlan;

      this.setPhase('completed');
      this.emit('progress', {
        phase: 'converting',
        progress: 100,
        message: 'Floor plan created successfully',
      } as ARProgressUpdate);

      this.emit('floorPlanReady', floorPlan);
      return floorPlan;

    } catch (error) {
      this.setError(`Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Complete scan workflow: scan + convert
   */
  async completeScanWorkflow(): Promise<FloorPlanData> {
    // Stop scanning and get result
    const scanResult = await this.stopScanning();
    
    // Convert to floor plan
    const floorPlan = await this.convertToFloorPlan(scanResult);
    
    return floorPlan;
  }

  /**
   * End AR session
   */
  async endSession(): Promise<void> {
    if (this.xrSession) {
      await this.xrSession.end();
    }
    this.handleSessionEnd();
  }

  /**
   * Handle session end
   */
  private handleSessionEnd(): void {
    this.xrSession = null;
    this.xrReferenceSpace = null;
    this.sessionState.isScanning = false;
    this.setPhase('idle');
    this.emit('sessionEnded');
  }

  /**
   * Set current phase
   */
  private setPhase(phase: ARSessionPhase): void {
    this.currentPhase = phase;
    this.emit('phaseChange', phase);
  }

  /**
   * Set error state
   */
  private setError(message: string): void {
    this.sessionState.error = message;
    this.setPhase('error');
    this.emit('error', new Error(message));
  }

  /**
   * Get current session state
   */
  getState(): ARSessionState {
    return { ...this.sessionState };
  }

  /**
   * Get current phase
   */
  getCurrentPhase(): ARSessionPhase {
    return this.currentPhase;
  }

  /**
   * Get last scan result
   */
  getLastScanResult(): RoomScanResult | null {
    return this.scanResult;
  }

  /**
   * Get last floor plan result
   */
  getLastFloorPlan(): FloorPlanData | null {
    return this.floorPlanResult;
  }

  /**
   * Check if currently scanning
   */
  isScanning(): boolean {
    return this.sessionState.isScanning;
  }

  /**
   * Reset session state
   */
  reset(): void {
    this.scanResult = null;
    this.floorPlanResult = null;
    this.sessionState.error = null;
    this.setPhase('idle');
    this.emit('reset');
  }

  /**
   * Get scanning guidance tips
   */
  getScanningTips(): string[] {
    return [
      'Move slowly around the room',
      'Keep the camera pointed at walls and corners',
      'Scan all walls for best results',
      'Avoid sudden movements',
      'Ensure good lighting conditions',
      'Start from one corner and work your way around',
      'Hold device steady when detecting corners',
    ];
  }

  /**
   * Check if device has required sensors
   */
  async checkDeviceCapabilities(): Promise<{
    hasCamera: boolean;
    hasGyroscope: boolean;
    hasAccelerometer: boolean;
    isCompatible: boolean;
  }> {
    const capabilities = {
      hasCamera: false,
      hasGyroscope: false,
      hasAccelerometer: false,
      isCompatible: false,
    };

    // Check camera
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      capabilities.hasCamera = devices.some(d => d.kind === 'videoinput');
    } catch (e) {
      // Camera check failed
    }

    // Check motion sensors
    if ('DeviceOrientationEvent' in window) {
      capabilities.hasGyroscope = true;
    }
    
    if ('DeviceMotionEvent' in window) {
      capabilities.hasAccelerometer = true;
    }

    // Device is compatible if it has camera and at least one motion sensor
    capabilities.isCompatible = capabilities.hasCamera && 
      (capabilities.hasGyroscope || capabilities.hasAccelerometer);

    return capabilities;
  }

  /**
   * Fallback mode for non-WebXR devices
   */
  async startFallbackMode(videoElement: HTMLVideoElement): Promise<boolean> {
    this.setPhase('initializing');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      videoElement.srcObject = stream;
      await videoElement.play();

      // Initialize scanner in fallback mode
      await this.roomScanner.initialize(videoElement);

      this.sessionState.isInitialized = true;
      this.setPhase('idle');
      
      this.emit('fallbackModeStarted', { videoElement });
      return true;

    } catch (error) {
      this.setError(`Fallback mode failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.endSession();
    this.roomScanner.dispose();
    this.removeAllListeners();
    ARSessionManager.instance = null as any;
  }
}

// Export singleton instance
export const arSessionManager = ARSessionManager.getInstance();
