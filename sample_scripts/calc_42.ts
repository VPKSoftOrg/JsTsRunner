// The script's intention is to get 42 as a result.
const num1: number = 1.5;
const num2: number = 2.5;

const semi1: number = num1 * 30;
const semi2: number = num2 * 15;

let result: number = semi1 + semi2;
result -= Number.parseInt("7");
result -= -2.5;
result /= 4;

result += -(3 << 1);

result = result + 0.5 - Number.parseFloat("3.5");

result *= 4;

result;
