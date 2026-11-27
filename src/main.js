import { Road } from './road.js';
import { Car } from './car.js';
import { NeuralNetwork } from './network.js';
import { getRandomColor } from './utils.js';
import { Visualizer } from './visualizer.js';
import { createRng, parseSeed } from './sim/rng.js';

const carCanvas = document.getElementById('carCanvas');
carCanvas.width = 200;
const networkCanvas = document.getElementById('networkCanvas');
networkCanvas.width = 300;

const carCtx = carCanvas.getContext('2d');
const networkCtx = networkCanvas.getContext('2d');

const road = new Road(carCanvas.width / 2, carCanvas.width * 0.9);

// One generator for the whole run (ADR-0012). `??`, not `||`: seed 0 is valid.
const seed =
  parseSeed(new URLSearchParams(location.search).get('seed')) ??
  crypto.getRandomValues(new Uint32Array(1))[0];
console.log(`seed ${seed} (open ?seed=${seed} to repeat this run)`);
const random = createRng(seed);

const N = 100;
export const cars = generateCars(N);
export let bestCar = cars[0];
if (localStorage.getItem('bestBrain')) {
  for (let i = 0; i < cars.length; i++) {
    cars[i].brain = JSON.parse(localStorage.getItem('bestBrain'));
    if (i != 0) {
      NeuralNetwork.mutate(cars[i].brain, 0.1, random);
    }
  }
}

export const traffic = [
  new Car(road.getLaneCenter(1), -100, 30, 50, 'DUMMY', 2, getRandomColor(random)),
  new Car(road.getLaneCenter(0), -300, 30, 50, 'DUMMY', 2, getRandomColor(random)),
  new Car(road.getLaneCenter(2), -300, 30, 50, 'DUMMY', 2, getRandomColor(random)),
  new Car(road.getLaneCenter(0), -500, 30, 50, 'DUMMY', 2, getRandomColor(random)),
  new Car(road.getLaneCenter(1), -500, 30, 50, 'DUMMY', 2, getRandomColor(random)),
  new Car(road.getLaneCenter(1), -700, 30, 50, 'DUMMY', 2, getRandomColor(random)),
  new Car(road.getLaneCenter(2), -700, 30, 50, 'DUMMY', 2, getRandomColor(random)),
];

document.getElementById('saveButton').addEventListener('click', save);
document.getElementById('discardButton').addEventListener('click', discard);

animate();

export function save() {
  localStorage.setItem('bestBrain', JSON.stringify(bestCar.brain));
}

export function discard() {
  localStorage.removeItem('bestBrain');
}

function generateCars(N) {
  const cars = [];
  for (let i = 1; i <= N; i++) {
    cars.push(new Car(road.getLaneCenter(1), 100, 30, 50, 'AI', 3, 'blue', random));
  }
  return cars;
}

function animate(time) {
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].update(road.borders, []);
  }
  for (let i = 0; i < cars.length; i++) {
    cars[i].update(road.borders, traffic);
  }
  bestCar = cars.find((c) => c.y == Math.min(...cars.map((c) => c.y)));

  carCanvas.height = window.innerHeight;
  networkCanvas.height = window.innerHeight;

  carCtx.save();
  carCtx.translate(0, -bestCar.y + carCanvas.height * 0.7);

  road.draw(carCtx);
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].draw(carCtx);
  }
  carCtx.globalAlpha = 0.2;
  for (let i = 0; i < cars.length; i++) {
    cars[i].draw(carCtx);
  }
  carCtx.globalAlpha = 1;
  bestCar.draw(carCtx, true);

  carCtx.restore();

  networkCtx.lineDashOffset = -time / 50;
  Visualizer.drawNetwork(networkCtx, bestCar.brain);
  requestAnimationFrame(animate);
}
