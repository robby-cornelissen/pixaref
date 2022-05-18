import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PixarefEditComponent } from './edit/edit.component';
import { PixarefFilterComponent } from './filter/filter.component';
import { PixarefGalleryComponent } from './gallery/gallery.component';
import { PixarefComponent } from './pixaref.component';
import { ConfigService } from './util/config.service';
import { DragAndDropDirective } from './util/drag-and-drop.directive';
import { ResizeObserverDirective } from './util/resize-observer.directive';
import { ScrollableComponent } from './util/scrollable/scrollable.component';
import { PixarefViewComponent } from './view/view.component';
import { PixarefSettingsComponent } from './settings/settings.component';


@NgModule({
  declarations: [
    DragAndDropDirective,
    ScrollableComponent,
    ResizeObserverDirective,
    PixarefComponent,
    PixarefEditComponent,
    PixarefGalleryComponent,
    PixarefViewComponent,
    PixarefFilterComponent,
    PixarefSettingsComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FlexLayoutModule,
    FormsModule,
    HttpClientModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSidenavModule,
    MatSliderModule,
    MatSnackBarModule,
    MatToolbarModule
  ],
  providers: [{
    provide: APP_INITIALIZER,
    multi: true,
    deps: [ConfigService],
    useFactory: (configService: ConfigService) => () => configService.load()
  }],
  bootstrap: [PixarefComponent]
})
export class PixarefModule { }
