import { TestBed } from '@angular/core/testing';

import { ImagePickerService } from './image-picker.service';

describe('ImagePickerService', () => {
  let service: ImagePickerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImagePickerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
