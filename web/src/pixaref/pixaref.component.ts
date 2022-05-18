import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { ConnectionStatus, Ref, Type } from '@pixaref/core';
import { PixarefEditComponent } from './edit/edit.component';
import { PixarefGalleryComponent } from './gallery/gallery.component';
import { PixarefService } from './pixaref.service';

@Component({
  selector: 'pixaref',
  templateUrl: './pixaref.component.html',
  styleUrls: ['./pixaref.component.scss']
})
export class PixarefComponent implements OnInit {
  title = 'Pixaref';

  minZoomFactor = 7;
  stdZoomFactor = 5;
  maxZoomFactor = 3;

  zoomFactor?: number;

  connectionStatus: ConnectionStatus = { status: 'DISCONNECTED' };
  refs: Ref[] = [];

  pageSize = 25;
  page?: PageEvent;

  constructor(
    private pixarefService: PixarefService,
    private dialog: MatDialog,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  get connected(): boolean {
    return this.connectionStatus.status === 'CONNECTED';
  }

  get pageRefs() {
    const startIndex = (this.page?.pageIndex || 0) * (this.page?.pageSize || this.pageSize);
    const endIndex = startIndex + (this.page?.pageSize || this.pageSize);

    return this.refs.slice(startIndex, endIndex);
  }

  connect() {
    this.pixarefService.connect();
  }

  add() {
    this.dialog.open(PixarefEditComponent, {});
  }

  edit(ref: Ref) {
    this.dialog.open(PixarefEditComponent, {
      data: ref
    });
  }

  scale(e: ReadonlyArray<ResizeObserverEntry>) {
    const updateZoomFactors = (width: number) => {
      this.minZoomFactor = Math.round(width / PixarefGalleryComponent.SMALL_SIZE);
      this.stdZoomFactor = Math.round(width / PixarefGalleryComponent.STANDARD_SIZE);
      this.maxZoomFactor = Math.round(width / PixarefGalleryComponent.LARGE_SIZE);

      if (!this.zoomFactor) {
        this.zoomFactor = this.stdZoomFactor;
      }

      if (this.zoomFactor > this.minZoomFactor) {
        this.zoomFactor = this.minZoomFactor;
        this.changeDetectorRef.detectChanges();
      }

      if (this.zoomFactor < this.maxZoomFactor) {
        this.zoomFactor = this.maxZoomFactor;
        this.changeDetectorRef.detectChanges();
      }
    };

    e.forEach(({ contentRect: { width } }) => {
      updateZoomFactors(width);
    });
  }

  zoomIn(): void {
    if (this.zoomFactor) this.zoomFactor--;
  }

  zoomOut(): void {
    if (this.zoomFactor) this.zoomFactor++;
  }

  ngOnInit(): void {
    this.pixarefService.connectionStatus().subscribe(
      (connectionStatus) => {
        this.connectionStatus = connectionStatus;
      }
    );
    this.pixarefService.filteredRefs().subscribe((refs) => this.refs = refs);
  }
}