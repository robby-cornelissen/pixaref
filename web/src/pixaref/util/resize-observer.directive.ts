import { AfterContentInit, Directive, ElementRef, EventEmitter, NgZone, OnDestroy, Output } from '@angular/core';
import { Observable, Observer, Subscription } from 'rxjs';

@Directive({
  selector: '[pixarefResizeObserver]'
})
export class ResizeObserverDirective implements AfterContentInit, OnDestroy {
  private observer!: ResizeObserver;
  private subscription: Subscription | null = null;

  @Output()
  resized = new EventEmitter<ReadonlyArray<ResizeObserverEntry>>();

  constructor(private element: ElementRef, private zone: NgZone) { }

  ngAfterContentInit(): void {
    if (!this.subscription) {
      this.subscribe();
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe();
  }

  private subscribe() {
    this.unsubscribe();

    const stream = new Observable((observer: Observer<ReadonlyArray<ResizeObserverEntry>>) => {
        this.observer = new ResizeObserver((e: ReadonlyArray<ResizeObserverEntry>) => observer.next(e));
        this.observer.observe(this.element.nativeElement);
      });

      this.zone.runOutsideAngular(() => {
        this.subscription = stream.subscribe(this.resized);
      });
  }

  private unsubscribe() {
    this.observer?.disconnect();
    this.subscription?.unsubscribe();
  }
}
