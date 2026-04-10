// ============================================
// Interaction Engine - User input handling
// ============================================

import type { Vec2 } from '@auriplan-types';

export type MouseButton = 'left' | 'middle' | 'right';
export type KeyboardModifier = 'shift' | 'ctrl' | 'alt' | 'meta';

export interface InteractionState {
  isMouseDown: boolean;
  isDragging: boolean;
  isPanning: boolean;
  isZooming: boolean;
  mousePosition: Vec2;
  mouseDownPosition: Vec2;
  lastMousePosition: Vec2;
  dragDelta: Vec2;
  activeButton: MouseButton | null;
  pressedKeys: Set<string>;
  modifiers: Set<KeyboardModifier>;
}

export interface InteractionEvent {
  type: 'mousedown' | 'mousemove' | 'mouseup' | 'click' | 'dblclick' | 'wheel' | 'keydown' | 'keyup';
  position: Vec2;
  delta?: Vec2;
  button?: MouseButton;
  key?: string;
  modifiers: KeyboardModifier[];
  preventDefault: () => void;
  stopPropagation: () => void;
}

export type InteractionHandler = (event: InteractionEvent) => void | boolean;

export class InteractionEngine {
  private state: InteractionState;
  private handlers: Map<string, Set<InteractionHandler>> = new Map();
  private element: HTMLElement | null = null;
  private boundListeners: { [key: string]: EventListener } = {};

  constructor() {
    this.state = {
      isMouseDown: false,
      isDragging: false,
      isPanning: false,
      isZooming: false,
      mousePosition: [0, 0],
      mouseDownPosition: [0, 0],
      lastMousePosition: [0, 0],
      dragDelta: [0, 0],
      activeButton: null,
      pressedKeys: new Set(),
      modifiers: new Set(),
    };
  }

  // Attach to DOM element
  attach(element: HTMLElement): void {
    this.detach();
    this.element = element;

    // Bind event listeners
    this.boundListeners = {
      mousedown: this.handleMouseDown.bind(this) as EventListener,
      mousemove: this.handleMouseMove.bind(this) as EventListener,
      mouseup: this.handleMouseUp.bind(this) as EventListener,
      wheel: this.handleWheel.bind(this) as EventListener,
      contextmenu: this.handleContextMenu.bind(this) as EventListener,
      keydown: this.handleKeyDown.bind(this) as EventListener,
      keyup: this.handleKeyUp.bind(this) as EventListener,
    };

    // Add listeners
    Object.entries(this.boundListeners).forEach(([event, handler]) => {
      element.addEventListener(event, handler, { passive: false });
    });

    // Focus element for keyboard events
    element.tabIndex = 0;
    element.focus();
  }

  // Detach from DOM element
  detach(): void {
    if (!this.element) return;

    Object.entries(this.boundListeners).forEach(([event, handler]) => {
      this.element?.removeEventListener(event, handler);
    });

    this.element = null;
    this.boundListeners = {};
  }

  // Register event handler
  on(event: string, handler: InteractionHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    return () => this.off(event, handler);
  }

  // Remove event handler
  off(event: string, handler: InteractionHandler): void {
    this.handlers.get(event)?.delete(handler);
  }

  // Emit event to handlers
  private emit(event: string, interactionEvent: InteractionEvent): boolean {
    const handlers = this.handlers.get(event);
    if (!handlers) return true;

    let shouldPropagate = true;

    for (const handler of handlers) {
      const result = handler(interactionEvent);
      if (result === false) {
        shouldPropagate = false;
      }
    }

    return shouldPropagate;
  }

  // Get current state
  getState(): InteractionState {
    return { ...this.state };
  }

  // Check if key is pressed
  isKeyPressed(key: string): boolean {
    return this.state.pressedKeys.has(key.toLowerCase());
  }

  // Check if modifier is active
  isModifierActive(modifier: KeyboardModifier): boolean {
    return this.state.modifiers.has(modifier);
  }

  // Check if any modifier is active
  hasAnyModifier(): boolean {
    return this.state.modifiers.size > 0;
  }

  // Get mouse position
  getMousePosition(): Vec2 {
    return [...this.state.mousePosition];
  }

  // Get drag delta
  getDragDelta(): Vec2 {
    return [...this.state.dragDelta];
  }

  // Check if dragging
  isDragging(): boolean {
    return this.state.isDragging;
  }

  // Mouse event handlers
  private handleMouseDown(event: MouseEvent): void {
    const position: Vec2 = [event.clientX, event.clientY];
    const button = this.getMouseButton(event.button);

    this.state.isMouseDown = true;
    this.state.mouseDownPosition = position;
    this.state.lastMousePosition = position;
    this.state.mousePosition = position;
    this.state.activeButton = button;
    this.state.dragDelta = [0, 0];

    this.updateModifiers(event);

    const interactionEvent = this.createInteractionEvent('mousedown', event, position, { button });

    if (!this.emit('mousedown', interactionEvent)) {
      event.preventDefault();
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    const position: Vec2 = [event.clientX, event.clientY];
    const delta: Vec2 = [
      position[0] - this.state.lastMousePosition[0],
      position[1] - this.state.lastMousePosition[1],
    ];

    this.state.mousePosition = position;
    this.state.dragDelta = delta;

    // Check if dragging
    if (this.state.isMouseDown) {
      const dragDistance = Math.sqrt(
        Math.pow(position[0] - this.state.mouseDownPosition[0], 2) +
        Math.pow(position[1] - this.state.mouseDownPosition[1], 2)
      );

      if (dragDistance > 3) {
        this.state.isDragging = true;
      }
    }

    this.updateModifiers(event);

    const interactionEvent = this.createInteractionEvent('mousemove', event, position, { delta });

    if (!this.emit('mousemove', interactionEvent)) {
      event.preventDefault();
    }

    this.state.lastMousePosition = position;
  }

  private handleMouseUp(event: MouseEvent): void {
    const position: Vec2 = [event.clientX, event.clientY];
    const delta: Vec2 = [
      position[0] - this.state.mouseDownPosition[0],
      position[1] - this.state.mouseDownPosition[1],
    ];

    this.updateModifiers(event);

    // Emit click if not dragging
    if (!this.state.isDragging) {
      const clickEvent = this.createInteractionEvent('click', event, position, {
        button: this.state.activeButton || undefined,
      });
      this.emit('click', clickEvent);
    }

    const interactionEvent = this.createInteractionEvent('mouseup', event, position, {
      button: this.state.activeButton || undefined,
      delta,
    });

    if (!this.emit('mouseup', interactionEvent)) {
      event.preventDefault();
    }

    // Reset state
    this.state.isMouseDown = false;
    this.state.isDragging = false;
    this.state.activeButton = null;
    this.state.dragDelta = [0, 0];
  }

  private handleWheel(event: WheelEvent): void {
    const position: Vec2 = [event.clientX, event.clientY];
    const delta: Vec2 = [event.deltaX, event.deltaY];

    this.updateModifiers(event);

    const interactionEvent = this.createInteractionEvent('wheel', event, position, { delta });

    if (!this.emit('wheel', interactionEvent)) {
      event.preventDefault();
    }
  }

  private handleContextMenu(event: MouseEvent): void {
    event.preventDefault();
  }

  // Keyboard event handlers
  private handleKeyDown(event: KeyboardEvent): void {
    this.state.pressedKeys.add(event.key.toLowerCase());
    this.updateModifiers(event);

    const interactionEvent = this.createInteractionEvent('keydown', event, [0, 0], {
      key: event.key,
    });

    if (!this.emit('keydown', interactionEvent)) {
      event.preventDefault();
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    this.state.pressedKeys.delete(event.key.toLowerCase());
    this.updateModifiers(event);

    const interactionEvent = this.createInteractionEvent('keyup', event, [0, 0], {
      key: event.key,
    });

    if (!this.emit('keyup', interactionEvent)) {
      event.preventDefault();
    }
  }

  // Helper methods
  private getMouseButton(button: number): MouseButton {
    switch (button) {
      case 0: return 'left';
      case 1: return 'middle';
      case 2: return 'right';
      default: return 'left';
    }
  }

  private updateModifiers(event: MouseEvent | KeyboardEvent): void {
    this.state.modifiers.clear();
    if (event.shiftKey) this.state.modifiers.add('shift');
    if (event.ctrlKey) this.state.modifiers.add('ctrl');
    if (event.altKey) this.state.modifiers.add('alt');
    if (event.metaKey) this.state.modifiers.add('meta');
  }

  private createInteractionEvent(
    type: InteractionEvent['type'],
    originalEvent: Event,
    position: Vec2,
    extras: Partial<InteractionEvent> = {}
  ): InteractionEvent {
    return {
      type,
      position,
      modifiers: Array.from(this.state.modifiers),
      preventDefault: () => originalEvent.preventDefault(),
      stopPropagation: () => originalEvent.stopPropagation(),
      ...extras,
    };
  }

  // Reset state
  reset(): void {
    this.state = {
      isMouseDown: false,
      isDragging: false,
      isPanning: false,
      isZooming: false,
      mousePosition: [0, 0],
      mouseDownPosition: [0, 0],
      lastMousePosition: [0, 0],
      dragDelta: [0, 0],
      activeButton: null,
      pressedKeys: new Set(),
      modifiers: new Set(),
    };
  }
}
