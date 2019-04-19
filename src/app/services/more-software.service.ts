import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Software} from '../classes/software';
import {Observable, ReplaySubject, Subject} from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class MoreSoftwareService {

    private index: Software[] = null;

    constructor(
        private httpClient: HttpClient
    ) {}

    getIndex(): Observable<Software[]> {
        const subject = new ReplaySubject<Software[]>();
        if (!this.index) {
            const service = this;
            this.httpClient.get("assets/carts/index.json", {responseType: "json"}).subscribe(
                (carts: any[]) => {
                    const sortedCarts: Software[] = [];
                    for (let i = 0; i < carts.length; i++) {
                        const cart = carts[i];
                        const software = new Software();
                        software.url = "carts/" + cart.url;
                        software.name = cart.name || this.createName(cart);
                        sortedCarts.push(software);
                    }
                    sortedCarts.sort((s1: Software, s2: Software) => {
                        return s1.name > s2.name ? 1 : (s1.name > s2.name ? -1 : 0);
                    });
                    service.index = sortedCarts;
                    subject.next(sortedCarts);
                },
                subject.error
            );
        } else {
            subject.next(this.index);
        }
        return subject.asObservable();
    }

    getByName(name: string): Observable<Software> {
        const subject = new ReplaySubject<Software>();
        this.getIndex().subscribe(
            (carts: Software[]) => {
                let found = false;
                carts.forEach((cart) => {
                    if (cart.name.toLowerCase() === name.toLowerCase()) {
                        subject.next(cart);
                        found = true;
                    }
                });
                if (!found) {
                    subject.error("Cart not found: " + name);
                }
            },
            subject.error
        );
        return subject.asObservable();
    }

    private createName(cart: Software) {
        let filename = cart.url.replace(".rpk", "");
        filename = filename.replace(/^(ag|as|aw|co|cy|db|dc|de|dlm|dv|fw|im|jp|mb|mi|na|ni|pb|ro|se|sf|sm|so|sp|ss|th|tv|vm|wd|wl)_/, "");
        filename = filename.replace(/_/g, " ");
        filename = filename.substr(0, 1).toUpperCase() + filename.substr(1);
        return filename;
    }
}
