import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'pixaref-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss']
})
export class PixarefViewComponent implements OnInit {
  url: string;

  constructor(@Inject(MAT_DIALOG_DATA) url: string) {
    this.url = url;
  }

  ngOnInit(): void {
  }
}
