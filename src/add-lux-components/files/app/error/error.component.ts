import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.scss']
})
export class ErrorComponent implements OnInit {
  url404 = '';

  constructor(private readonly router: Router) {}

  ngOnInit(): void {
    this.url404 = this.router.routerState.snapshot.url;
  }
}
