import { take, exhaustMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpHandler, HttpRequest, HttpParams, HttpHeaders } from '@angular/common/http';

@Injectable()
export class AuthInterceptorService implements HttpInterceptor {
    constructor(private authService: AuthService) { }

    intercept(req: HttpRequest<any>, next: HttpHandler) {
        return this.authService.user.pipe(take(1), exhaustMap(user => {
            if (!user) {
                return next.handle(req);
            }
            const modifiedReq = req.clone({/* params: new HttpParams().set('auth', user.userToken) */
                headers: new HttpHeaders().set('Authorization', 'Bearer ' + user.userToken)
            });
            return next.handle(modifiedReq);
        }));
    }
}
