/**
 * AQUA-SPECTRA — src/components/base.ts
 * Shared base class + reactive state controller for every custom element.
 */
import { LitElement, type ReactiveController, type ReactiveControllerHost } from 'lit';
import { store, type AppState } from '../state/store';
import { SpringController, SPRING_PRESETS, type SpringConfig, type SpringFrame } from '../controllers/springController';

/** Subscribe a Lit host to a selector of the global store. */
export class StoreController<T> implements ReactiveController {
  private host: ReactiveControllerHost;
  private selector: (s: AppState) => T;
  private unsub: (() => void) | null = null;
  value: T;

  constructor(host: ReactiveControllerHost, selector: (s: AppState) => T) {
    this.host = host;
    this.selector = selector;
    this.value = selector(store.get());
    host.addController(this);
  }

  hostConnected(): void {
    this.unsub = store.subscribe((s) => {
      const next = this.selector(s);
      if (!shallowEqual(next, this.value)) {
        this.value = next;
        this.host.requestUpdate();
      }
    });
  }

  hostDisconnected(): void {
    this.unsub?.();
    this.unsub = null;
  }
}

function shallowEqual<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  const ka = Object.keys(a as object);
  const kb = Object.keys(b as object);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => Object.is((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}

/** Convenience decorator-style helper: `@property() state = ...` alternative. */
export function consumeState<T>(host: ReactiveControllerHost, selector: (s: AppState) => T): StoreController<T> {
  return new StoreController(host, selector);
}

export abstract class AquaElement extends LitElement {
  protected store = store;

  /** Create a spring bound to one numeric visual property. */
  protected spring(
    initial: number,
    onChange: (frame: SpringFrame) => void,
    config: Partial<SpringConfig> = SPRING_PRESETS.meniscus,
  ): SpringController {
    return new SpringController(this, onChange, initial, config);
  }

  protected toast(text: string, tone: 'info' | 'ok' | 'warn' | 'bad' = 'info'): void {
    store.update((s) => {
      s.toast = { id: Date.now(), text, tone };
    });
  }

  protected vibrate(pattern: number | number[]): void {
    const perms = store.get().permissions;
    if (perms.haptics.state === 'active' || perms.haptics.state === 'simulator') {
      try {
        navigator.vibrate?.(pattern);
      } catch {
        /* no-op */
      }
    }
  }

  /** Role gate used by every premium panel. */
  protected hasRole(required: 'household' | 'specialist' | 'director'): boolean {
    const rank = { household: 0, specialist: 1, director: 2 } as const;
    return rank[store.get().role] >= rank[required];
  }
}
