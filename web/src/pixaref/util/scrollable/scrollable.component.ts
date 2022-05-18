import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { Subscription, timer } from 'rxjs';

@Component({
  selector: 'pixaref-scrollable',
  templateUrl: './scrollable.component.html',
  styleUrls: ['./scrollable.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScrollableComponent implements AfterViewInit, OnInit, OnChanges {
  private static SCROLL_INTERVAL = 1000 / 30; // 30 FPS
  private static SCROLL_STEP = 10;

  @ViewChild('content', { read: ElementRef })
  private content!: ElementRef;

  constructor(private changeDetectorRef: ChangeDetectorRef) { }

  Direction = Direction;

  live = false;
  scrolling: Subscription | null = null;

  get clientWidth() {
    return this.content.nativeElement.clientWidth;
  }

  get scrollWidth() {
    return this.content.nativeElement.scrollWidth;
  }

  get scrollOffset() {
    return this.content.nativeElement.scrollLeft;
  }

  get scrollMax() {
    return this.scrollWidth - this.clientWidth;
  }

  get scrollable() {
    return this.live && this.scrollWidth > this.clientWidth;
  }

  startScrolling(direction: Direction) {
    if (!this.scrolling) {
      this.scrolling = timer(0, ScrollableComponent.SCROLL_INTERVAL).subscribe(() => {
        switch(direction) {
          case Direction.LEFT:
            this.scrollLeft(ScrollableComponent.SCROLL_STEP);

            if (this.scrollOffset <= 0) {
              this.stopScrolling();
            }

            break;
          case Direction.RIGHT:
            this.scrollRight(ScrollableComponent.SCROLL_STEP);

            if (this.scrollOffset >= this.scrollMax) {
              this.stopScrolling()
            }

            break;
        }
      });
    }
  }

  stopScrolling() {
    if (this.scrolling && !this.scrolling.closed) {
      this.scrolling.unsubscribe();
      this.scrolling = null;
    }
  }

  scrollLeft(delta: number) {
    this.content.nativeElement.scrollLeft = this.scrollOffset - delta;
    this.update();
  }

  scrollRight(delta: number) {
    this.content.nativeElement.scrollLeft = this.scrollOffset + delta;
    this.update();
  }

  update(): void {
    this.changeDetectorRef.detectChanges();
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.live = true;
    this.changeDetectorRef.detectChanges()
  }

  ngOnChanges(changes: SimpleChanges): void {
  }
}

enum Direction { LEFT, RIGHT }
