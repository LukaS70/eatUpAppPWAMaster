import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { IngredientNewPage } from './ingredient-new.page';

describe('IngredientNewPage', () => {
  let component: IngredientNewPage;
  let fixture: ComponentFixture<IngredientNewPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IngredientNewPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(IngredientNewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
