import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { RecipeEditPage } from './recipe-edit.page';

describe('RecipeEditPage', () => {
  let component: RecipeEditPage;
  let fixture: ComponentFixture<RecipeEditPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RecipeEditPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeEditPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
