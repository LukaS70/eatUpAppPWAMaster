import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { IngredientEditPage } from './ingredient-edit.page';

describe('IngredientEditPage', () => {
  let component: IngredientEditPage;
  let fixture: ComponentFixture<IngredientEditPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IngredientEditPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(IngredientEditPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
