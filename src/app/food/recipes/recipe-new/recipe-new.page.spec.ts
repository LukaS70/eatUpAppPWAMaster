import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { RecipeNewPage } from './recipe-new.page';

describe('RecipeNewPage', () => {
  let component: RecipeNewPage;
  let fixture: ComponentFixture<RecipeNewPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RecipeNewPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeNewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
