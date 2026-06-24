import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PerfilPsicologoPage } from './perfil-psicologo.page';

describe('PerfilPsicologoPage', () => {
  let component: PerfilPsicologoPage;
  let fixture: ComponentFixture<PerfilPsicologoPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [PerfilPsicologoPage]
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilPsicologoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});