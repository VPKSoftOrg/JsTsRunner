const a = 0==0;
const b = 0>>a;
const c = true + ("Bar" == "Bar");
const d = c ^ 0;
const e = [0] + [d];
const f = 1000000 - Math.pow(10, 6);
const g = f ^ [(true + (false == false))];
const h = g + [0];
const i = ("Foo" == "Foo") << 1;
const omega = e * h + i;
omega;