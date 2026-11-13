# Baseline walkthrough

A guided tour of the original simulation in `src/`: what each file does, what happens in one frame, and how a
car goes from "sees a wall" to "turns left". It is written so you can explain every part out loud.

**How to read it.** A reference like `src/car.js:56-61` means file `src/car.js`, lines 56 to 61. The line
numbers are valid for the baseline as imported (upstream commit `8b87236`, see [NOTICE.md](../NOTICE.md)).
`src/visualizer.js` is stored as UTF-16, so its line numbers are those of the decoded text, which is what an
editor shows. Design-level notes live in [ARCHITECTURE.md](ARCHITECTURE.md) §2. Behaviour that the tests pin,
including odd behaviour, is in the Log of [TASKS.md](TASKS.md) (the T-003 rows, 2026-11-08).

## 1. The big picture

The page shows a three-lane road. Seven slow "traffic" cars drive up it in a fixed pattern. A hundred "AI"
cars start together at the bottom. Each AI car is steered by a tiny neural network (its "brain") that reads
five distance sensors and decides, every frame, whether to accelerate, turn left, turn right or reverse.

Nothing learns on its own. You watch the cars, press the save button when you like the best one, and reload
the page. Car 0 then starts with an exact copy of the saved brain and the other 99 cars with a copy that is
slightly changed at random. Repeating that is the "evolution".

What one car does in one frame, in the order `Car.update` runs it (`src/car.js:43-63`):

```text
move ──► collision check ──► sensor rays ──► network ──► controls
(uses the     (damaged?)      (what is       (decides)    (4 flags, used by the
 flags from                    ahead?)                     NEXT frame's move)
 last frame)
```

The move and the collision check run only while the car is undamaged (`src/car.js:44-48`). The loop that
calls `Car.update` for every car, once per frame, is `animate` (`src/main.js:53-87`).

## 2. `index.html` and `style.css`

`src/index.html` is short.

- Two canvases (drawing areas): `carCanvas` for the road and cars, `networkCanvas` for the brain picture
  (`src/index.html:9-14`).
- Two buttons whose `onclick` calls `save()` and `discard()` (`src/index.html:11-12`). Those are plain global
  functions defined in `main.js`.
- Eight script tags (`src/index.html:15-22`). They share one global scope, meaning one common set of names, so
  the classes in one file can be used by the others without imports. `main.js` is last because it starts the simulation.

`src/style.css` only does layout and looks: the page is a centred row (`src/style.css:1-8`), the buttons stack
in a column (`src/style.css:10-13`) and have a rounded look with a blue hover (`src/style.css:15-24`), and the
canvases get their background colours (`src/style.css:26-31`).

## 3. `visualizer.js` — drawing the brain

A teaching aid. It draws the best car's network with live values, so you can watch it think. The file is
UTF-16 (a text encoding that uses two bytes per character) with a byte-order mark (two marker bytes at the
start of the file), which is why `vite.config.js` has a small plugin, a piece of code that hooks into the dev
server, to decode it when serving.

- `Visualizer.drawNetwork` stacks the levels (layers) on the canvas, input level at the bottom and output
  level at the top (`src/visualizer.js:2-30`).
- `drawLevel` draws one level (`src/visualizer.js:32-99`):
  - every weight is a line, yellow if positive and blue if negative, more opaque when larger
    (`src/visualizer.js:38-53`);
  - every input and output is a circle whose inner dot shows its current value
    (`src/visualizer.js:55-77`);
  - the dashed ring around an output shows its bias (`src/visualizer.js:79-85`).
- The four output arrows read up, left, right, down, which are forward, left, right, reverse
  (`src/visualizer.js:26`).
- `#getNodeX` spreads the circles evenly across the width (`src/visualizer.js:101-109`).
- The colours come from `getRGBA` in `src/utils.js:42-48`.

## 4. `network.js` — the brain

A network here is a list of levels. `new NeuralNetwork([5, 6, 4])` builds two levels (`src/network.js:2-9`):
five inputs to six hidden neurons (the middle layer, neither input nor output), then six to four outputs. Each level stores a grid of weights (one per
input-output pair) and one bias per output (`src/network.js:44-55`). All start random in the range -1 to 1
(`src/network.js:57-67`).

**Thinking (`feedForward`).** For each output neuron: multiply every input by its weight, add them up, and
compare with the bias. If the sum is greater than the bias the output is 1, otherwise 0
(`src/network.js:69-88`, the comparison is at line 80). That is a "step" decision: only 0 or 1, never in
between. The network passes through the first level, then feeds those 0/1 results into the next
(`src/network.js:11-19`).

**Changing (`mutate`).** For every bias and weight, move it a fraction `amount` of the way towards a fresh
random value in -1 to 1 (`src/network.js:21-40`, the move is `lerp` at lines 24-28 and 32-36). With
`amount = 0` nothing changes, with `amount = 1` everything is replaced. The game uses 0.1.

Quirks, such as `NeuralNetwork([n])` building no levels and the order in which random numbers are drawn, are
pinned by tests and listed in the Log (T-003, 2026-11-08). The `quirk:` tests in `tests/network.test.js`, and
the draw-order tests at `tests/network.test.js:49` and `tests/network.test.js:201`, show each one.

## 5. `sensor.js` — what the car sees

Each AI car owns a `Sensor` with five rays (lines), each 150 pixels long, spread over 90 degrees
(`src/sensor.js:4-6`).

- `#castRays` builds the rays (`src/sensor.js:65-83`). Ray 0 points 45 degrees to the left of the car, ray 2
  straight ahead, ray 4 45 degrees to the right (`src/sensor.js:68-72`). They turn with the car.
- `#getReading` checks one ray against the two road borders and against every edge of every traffic car, and
  keeps the closest hit (`src/sensor.js:26-63`). The reading is the hit point plus `offset`, the fraction of
  the ray's length at which it hit: 0 means touching the car, 1 means at the tip. No hit gives `null`.
- Other AI cars are invisible to the sensor: only borders and traffic are checked.
- `update` runs both steps (`src/sensor.js:12-24`); `draw` paints each ray yellow up to the hit and black
  beyond it (`src/sensor.js:85-118`).

## 6. `utils.js` — small helpers

- `lerp(A, B, t)` slides from A to B: `t = 0` gives A, `t = 1` gives B (`src/utils.js:1-3`).
- `getIntersection` decides whether two line segments cross and, if so, returns the point and the offset along
  the first segment (`src/utils.js:5-23`).
- `polysIntersect` says whether two shapes touch, by testing every edge of one against every edge of the other
  (`src/utils.js:25-40`). It looks at edges only, so a shape fully inside another does not count.
- `getRGBA` turns a number in -1 to 1 into a colour: negative blue, positive yellow, opacity by size
  (`src/utils.js:42-48`).
- `getRandomColor` picks a bright colour for traffic cars (`src/utils.js:50-53`).

The `quirk:` tests in `tests/utils.test.js` pin the odd cases (collinear segments, a shape inside a shape).

## 7. `road.js` — the road

`new Road(100, 180)` is called in `src/main.js:9`: centred at x = 100, 180 pixels wide, three lanes
(`src/road.js:2-8`). So the road runs from x = 10 to x = 190, and each lane is 60 wide.

- The two borders are vertical lines at the left and right edge, running from y = -1,000,000 to
  y = 1,000,000, so the road never ends in practice (`src/road.js:10-21`).
- `getLaneCenter(i)` returns the middle of lane `i`: 40, 100 or 160. An index past the last lane is clamped
  (`src/road.js:24-28`).
- `draw` paints dashed lane lines and solid borders (`src/road.js:30-55`).

## 8. `controls.js` — four on/off switches

`Controls` holds four on/off flags: forward, left, right, reverse (`src/controls.js:3-6`). For AI cars they
hold the network's 0 or 1 instead of `true` or `false`, which works the same way in an `if`. The type picks
who sets them:

- `"KEYS"` listens to the arrow keys (`src/controls.js:9-11`, `src/controls.js:18-51`). `main.js` never uses
  it, so the baseline cannot be driven by hand.
- `"DUMMY"` sets forward on permanently (`src/controls.js:12-14`). Traffic cars use this.
- There is no `"AI"` case here. For AI cars `Car.update` writes the four flags itself from the network
  (`src/car.js:56-61`).

## 9. `car.js` — the car

**Creating a car** (`src/car.js:2-41`). Position, size, speed 0, acceleration 0.2, friction 0.05, angle 0,
not damaged (`src/car.js:8-13`). Only cars that are not `"DUMMY"` get a sensor and a brain of shape
`[5, 6, 4]`, five rays in and four outputs out (`src/car.js:17-22`). The rest builds a picture of the car in
its own colour (`src/car.js:25-40`).

**One update** (`src/car.js:43-63`):

1. While the car is not damaged: move, rebuild its collision shape, then check for damage
   (`src/car.js:44-48`).
2. If the car has a sensor, always: cast the rays, turn each reading into a number (0 for no hit, otherwise
   `1 - offset`, so closer things give bigger numbers), and run the network (`src/car.js:49-54`, the input
   rule is at lines 51-53).
3. AI cars copy the four outputs into the controls: output 0 is forward, 1 left, 2 right, 3 reverse
   (`src/car.js:56-61`). The move in step 1 has already happened, so these flags take effect in the next
   frame's move.

**Damage.** `#assessDamage` returns true if the car's shape touches either road border or any traffic car
(`src/car.js:65-77`). The shape is four corners placed around the centre, turned by the car's angle
(`src/car.js:79-100`). Damage is permanent: a damaged car stops moving (`src/car.js:44`) but its sensor and
network keep running.

**Moving** (`src/car.js:102-139`), in this order each frame:

1. Forward adds the acceleration to the speed, reverse subtracts it (`src/car.js:103-108`).
2. The speed is held between `-maxSpeed/2` and `maxSpeed` (`src/car.js:110-115`).
3. Friction pulls the speed towards 0, and a speed smaller than the friction becomes exactly 0
   (`src/car.js:117-125`).
4. If moving, left or right changes the angle by 0.03 radians; the direction flips when reversing
   (`src/car.js:127-135`).
5. The position moves along the angle: `x -= sin(angle) * speed`, `y -= cos(angle) * speed`
   (`src/car.js:137-138`).

`draw` paints the tinted car, or the plain picture if damaged (`src/car.js:141-164`).

## 10. `main.js` — setup and the frame loop

**Setup** (`src/main.js:1-34`):

- Set the canvas widths, 200 and 300 pixels (`src/main.js:2`, `src/main.js:4`), and build the road
  (`src/main.js:9`).
- Build `N = 100` AI cars, all at the middle of lane 1, y = 100 (`src/main.js:11-12`, `src/main.js:45-51`).
- If a saved brain exists, give every car its own copy, and mutate every car except car 0 by 0.1
  (`src/main.js:14-22`).
- Build seven traffic cars (`src/main.js:24-32`): in lanes 1, 0, 2, 0, 1, 1, 2 at y = -100, -300, -300, -500,
  -500, -700, -700, each with top speed 2.
- Call `animate()` once to start (`src/main.js:34`).

**The frame loop.** The browser calls `animate` before each screen refresh, normally 60 times a second. In
order (`src/main.js:53-87`):

1. Update every traffic car, passing the road borders and an empty traffic list, so traffic cars never collide
   with each other (`src/main.js:54-56`).
2. Update every AI car, passing the borders and the traffic (`src/main.js:57-59`).
3. Find the best car: the one with the smallest `y`, meaning furthest up the road (`src/main.js:60-63`).
4. Set both canvases to the window height (`src/main.js:65-66`). In browsers this also wipes the canvas, which
   is how each frame starts blank (standard canvas behaviour; not run here).
5. Shift the picture so the best car sits 70% of the way down the screen (`src/main.js:68-69`).
6. Draw the road, the traffic, then all AI cars faint (opacity 0.2), then the best car solid with its sensor
   rays (`src/main.js:71-80`).
7. Undo the shift (`src/main.js:82`).
8. Animate the dashed lines and draw the best car's brain in the side panel (`src/main.js:84-85`).
9. Ask the browser to call `animate` again next frame (`src/main.js:86`).

## 11. From a wall to a turn: two frames, end to end

An illustration with made-up numbers. Suppose the middle ray (ray 2) of an AI car touches a traffic car 40%
of the way along the ray. Steps 1 to 4 happen in one frame, steps 5 and 6 in the next.

1. `#getReading` returns that hit with `offset = 0.4` (`src/sensor.js:26-63`).
2. `Car.update` turns it into the input `1 - 0.4 = 0.6` for that ray. Rays with no hit give 0
   (`src/car.js:51-53`).
3. The five inputs go through two levels of weighted sums against biases, each neuron giving 0 or 1
   (`src/network.js:69-88`).
4. Suppose the outputs are `[1, 0, 1, 0]`: forward on, left off, right on, reverse off
   (`src/car.js:57-60`).
5. On the next frame `#move` uses those flags: it raises the speed, then turns the car right by 0.03 radians
   and steps it forward (`src/car.js:102-139`). The decision always acts one frame late, because `update`
   moves the car first and sets the controls last (`src/car.js:45`, `src/car.js:57-60`).
6. That frame's rays are cast from the new position, and the loop repeats.

## 12. The learning cycle

There is no automatic scoring or breeding.

1. **Watch.** The best car is always the one with the smallest `y`.
2. **Save.** The 💾 button runs `save()`, which stores the best car's brain in the browser's `localStorage`
   under the key `bestBrain` (`src/main.js:36-39`).
3. **Reload.** On the next page load every car gets a fresh copy of that brain; every car except car 0 is then
   nudged 10% towards random values (`src/main.js:14-22`). Car 0 is an exact copy, so at least one car starts
   exactly like the saved brain. The saved brain itself stays in `localStorage` until you save again or
   discard.
4. **Discard.** The 🗑️ button runs `discard()`, which removes the saved brain (`src/main.js:41-43`). The next
   reload starts from fully random brains.

A saved brain is stored as plain text and read back as plain data: just numbers and lists, with no methods
attached. That works because the network's functions are `static`, which means they take the network as an
argument instead of living on it (`src/network.js:11-19`, `src/network.js:69-88`).

## 13. Coordinates and units

- Pixels on the canvas. `y` grows downwards, and cars drive towards negative `y` (`src/car.js:138`).
- Angle 0 points up the screen. A positive angle turns left, because `x` decreases with `sin(angle)`
  (`src/car.js:130`, `src/car.js:137`). Rays use the same rule (`src/sensor.js:76-79`).
- Speeds are pixels per frame, not per second. The physics is tied to the screen refresh: on a faster screen
  the cars would move faster (not run here; it follows from the code, which has no clock).

See [ARCHITECTURE.md](ARCHITECTURE.md) §6 for the project-wide conventions.

## 14. Things worth knowing

Behaviour you may be asked about. The first group is pinned by tests and described in the Log; the second
comes from reading the code and is not covered by a test.

**Pinned by tests (see the Log, T-003, 2026-11-08):** `getIntersection` ignores collinear overlaps;
`polysIntersect` misses a shape fully inside another; `NeuralNetwork([n])` has no levels and then throws;
`feedForward` returns the level's own output array, which the next call overwrites; random numbers are drawn
in a fixed order in `Level` and in `mutate`.

**From reading the code:**

- **The best car can be a crashed one.** The pick is the smallest `y` over all cars, damaged or not
  (`src/main.js:60-63`). A car that drove far and then crashed keeps that `y`, so the camera and `save()` can
  follow a car that is no longer moving.
- **The pick is slow.** `find` runs `Math.min` over all cars for each car it tests, up to 100 x 100 checks per
  frame (`src/main.js:60-63`).
- **Damaged cars keep thinking.** Their sensor and network still run, though the result is not used because
  the car no longer moves (`src/car.js:44-62`).
- **AI cars ignore each other.** They neither see nor hit other AI cars (`src/main.js:57-59`,
  `src/sensor.js:41-54`).
- **The first call has no timestamp.** `animate()` is called without an argument (`src/main.js:34`) while the
  loop reads `time` (`src/main.js:84`), so the very first dash offset is computed from `undefined`. Later calls
  get the browser's timestamp. What the browser does with that first value was not observed here.
- **`"KEYS"` is unused.** The code exists but `main.js` never creates a keyboard-driven car.
- **Saved brains depend on the shape.** A saved brain replaces the new car's brain as it is
  (`src/main.js:14-17`), so a saved brain would not fit a network with a different number of rays or neurons.
  This follows from the code and has not been run.

## 15. Constants

| Item | Value | Where |
| --- | --- | --- |
| Canvas widths | car canvas 200, network canvas 300 | `src/main.js:2`, `src/main.js:4` |
| Road | centre x 100, width 180, 3 lanes, from x 10 to 190 | `src/main.js:9`, `src/road.js:7-8` |
| Lane centres | 40, 100, 160 (lane width 60) | `src/road.js:25-27` |
| Fleet | `N = 100` AI cars, 30 x 50 pixels, start x 100, y 100 | `src/main.js:11`, `src/main.js:48` |
| Traffic | 7 cars, 30 x 50, top speed 2 | `src/main.js:25-31` |
| Acceleration, friction | 0.2 and 0.05 per frame | `src/car.js:9`, `src/car.js:11` |
| Top speed | 3 for AI cars (default), 2 for traffic; reverse is half | `src/car.js:2`, `src/car.js:110-115` |
| Turn rate | 0.03 radians per frame | `src/car.js:130` |
| Settled speed | `maxSpeed - friction`: 2.95 for AI, 1.95 for traffic (the cap is applied before friction) | `src/car.js:110-125` |
| Sensor | 5 rays, 150 long, spread 90 degrees | `src/sensor.js:4-6` |
| Network | `[5, 6, 4]` | `src/car.js:19-21` |
| Mutation amount | 0.1, all cars except car 0 | `src/main.js:18-20` |
| Camera | best car at 70% of the canvas height | `src/main.js:69` |
| Opacity | 0.2 for all cars, 1 for the best | `src/main.js:75`, `src/main.js:79` |
| Storage key | `bestBrain` | `src/main.js:14`, `src/main.js:37`, `src/main.js:42` |

## 16. Glossary

- **Frame.** One call of `animate`, one picture. There is no separate "tick" yet: physics runs once per
  frame.
- **Ray.** A 150-pixel line from the car that stops where it meets something.
- **Reading, offset.** A ray's hit, and how far along the ray it was (0 near, 1 far).
- **Brain, network.** The small decision-maker in each AI car.
- **Level.** One layer of a network: a grid of weights and a list of biases.
- **Weight, bias.** Numbers the network multiplies by and compares against. They are what "learning" changes.
- **Step activation.** An output of exactly 0 or 1: 1 if the weighted sum beats the bias.
- **Mutation.** Nudging every weight and bias a bit towards random values.
- **`lerp`.** Linear interpolation: a point `t` of the way from A to B.
- **Polygon.** The four-corner outline used for collisions.
- **Damaged.** A crashed car. It stops for good.
- **Best car.** The car with the smallest `y`.
- **Traffic, DUMMY.** The seven slow cars with no brain that always drive forward.
- **Control type.** `"KEYS"` (keyboard), `"DUMMY"` (always forward), `"AI"` (network).
- **`localStorage`.** Small storage in the browser. It keeps the saved brain between page loads.
