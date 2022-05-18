import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { RefFilter, Tag, toIndex, Type } from '@pixaref/core';
import { PixarefService } from '../pixaref.service';
import { ConfigService } from '../util/config.service';

@Component({
  selector: 'pixaref-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss']
})
export class PixarefFilterComponent implements OnInit {
  readonly separators: number[];

  @ViewChild('tagInput')
  tagInput!: ElementRef;

  refFilter: RefFilter = {};
  tags: Tag[] = [];
  filteredTags: Tag[] = [];
  types: Type[] = [];
  icons: { [name: string]: string | undefined } = {};

  constructor(
    private pixarefService: PixarefService,
    private config: ConfigService
  ) {

    this.separators = this.config.separators;
  }

  isClear(): boolean {
    return !this.refFilter.title
      && !this.refFilter.type
      && !this.refFilter.tags?.length;
  }

  clear(): void {
    this.pixarefService.clearRefFilter();
  }

  changeTitle(title: string): void {
    this.pixarefService.setRefFilterTitle(title);
  }

  changeType(type: string) {
    this.pixarefService.setRefFilterType(type);
  }

  inputTag(event: MatChipInputEvent): void {
    const tag = (event.value || '').trim();

    event.chipInput!.clear();

    this.addTag(tag);
    this.clearTag();
  }

  selectTag(event: MatAutocompleteSelectedEvent): void {
    const tag = event.option.value.trim();

    this.addTag(tag);
    this.clearTag();
  }

  addTag(tag: Tag): void {
    this.pixarefService.addRefFilterTag(tag);
  }

  removeTag(tag: Tag): void {
    this.pixarefService.removeRefFilterTag(tag);
  }

  clearTag(): void {
    this.tagInput.nativeElement.value = '';
  }

  filterTags(value: string) {
    this.filteredTags = value
      ? this.tags.filter(
        (tag) => !this.refFilter.tags?.includes(tag) && tag.toLowerCase().startsWith(value.toLowerCase())
      )
      : this.tags.slice();
  }

  ngOnInit(): void {
    this.pixarefService.refFilter().subscribe((refFilter) => this.refFilter = refFilter);
    this.pixarefService.allTags().subscribe((tags) => this.tags = tags);
    this.pixarefService.allTypes().subscribe((types) => {
      this.types = types;
      this.icons = toIndex(types, 'name', 'icon');
    });
  }
}
