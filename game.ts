// Game object interfaces

interface GameObject {
  node: HTMLElement;
  x: number;
  y: number;
  dx: number; // horizontal speed
  dy: number; // vertical speed
  width: number;
  height: number;
  viewportWidth: number;
  viewportHeight: number;
  container: HTMLElement;
}

interface GameObjectProps {
  container: HTMLElement;
  className?: string;
  width: number;
  height: number;
  dy: number;
  dx: number;
  x: number;
  y: number;
  nodeId?: string;
}

interface CollisionProps {
  barX: number;
  barY: number;
  barWidth: number;
  barHeight: number;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Constants
const COLLISION_COEFF = 0.5;

// Helper functions
const sides = ({ x, y, width, height }: Rect) => {
  return [x, x + width, y, y + height];
};

const overlaps = (a: Rect, b: Rect) => {
  const [La, Ra, Ta, Ba] = sides(a);
  const [Lb, Rb, Tb, Bb] = sides(b);
  return !(Ra < Lb || Rb < La || Ba < Tb || Bb < Ta);
};

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max + 1)) + min;
}

// Game container
const gameContainer = document.getElementById("box");

// Game object class
class GameObject {
  constructor({
    container,
    className,
    width,
    height,
    dx,
    dy,
    x,
    y,
    nodeId,
  }: GameObjectProps) {
    this.node;
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.width = width;
    this.height = height;
    this.viewportWidth;
    this.viewportHeight;
    this.container = container;

    const spawn = () => {
      const object = document.createElement("div");
      object.className = className;
      object.id = nodeId;
      object.style.width = `${this.width}px`;
      object.style.height = `${this.height}px`;
      object.style.top = `${y}px`;
      object.style.left = `${x}px`;

      this.viewportWidth = this.container.clientWidth;
      this.viewportHeight = this.container.clientHeight;

      this.container.appendChild(object);

      this.node = object;
    };

    spawn();
  }
}

class HitBar extends GameObject {
  constructor(input: {
    x: number;
    y: number;
    className: string;
    id: string;
    width: number;
  }) {
    const { x, y, className, id, width } = input;
    super({
      container: gameContainer,
      nodeId: id,
      className: className,
      width: width,
      height: 10,
      dy: 0,
      dx: 0,
      x,
      y,
    });
  }

  destroy() {
    this.node.remove();
  }
}

class Ball extends GameObject {
  constructor(input: { x: number; y: number; width: number; height: number }) {
    const { x, y, width, height } = input;
    super({
      container: gameContainer,
      className: "ball",
      width: width,
      height: 30,
      dy: 3,
      dx: 0,
      x: x,
      y: y,
    });
  }

  update(bar: Bar, hitBars: HitBar[]) {
    // Keep previous position so collision code can infer impact direction.
    const prevX = this.x;
    const prevY = this.y;

    this.x += this.dx;
    this.y += this.dy;

    this.collision([bar, ...hitBars], prevX, prevY);

    this.updatePosition();
  }

  collision(bars: GameObject[], prevX: number, prevY: number) {
    // Left and right container borders collision detection
    if (this.x <= 0 || this.x + this.width >= this.viewportWidth) {
      this.dx *= -1;
    }

    // Top and bottom container borders collision detection
    if (this.y <= 0 || this.y + this.height >= this.viewportHeight) {
      this.dy *= -1;
    }

    // Bar collision detection
    for (const bar of bars) {
      // Skip already removed hit bars that still exist in the array.
      if (bar instanceof HitBar && !bar.node.isConnected) {
        continue;
      }

      if (!overlaps(this, bar)) {
        continue;
      }

      // Determine where the ball was in the previous frame relative to the bar.
      // This lets us resolve side hits differently from top/bottom hits.
      const wasAbove = prevY + this.height <= bar.y;
      const wasBelow = prevY >= bar.y + bar.height;
      const wasLeft = prevX + this.width <= bar.x;
      const wasRight = prevX >= bar.x + bar.width;

      if (wasAbove) {
        // Hit the top of the bar: move ball out and force upward movement.
        this.y = bar.y - this.height;
        this.dy = -Math.abs(this.dy);

        // Inherit part of paddle horizontal speed for angle control.
        if (bar.dx !== 0) {
          this.dx = bar.dx * COLLISION_COEFF;
        }
      } else if (wasBelow) {
        // Hit from below: move ball out and force downward movement.
        this.y = bar.y + bar.height;
        this.dy = Math.abs(this.dy);
      } else if (wasLeft) {
        // Hit left edge: move ball out and force movement to the left.
        this.x = bar.x - this.width;
        this.dx = -Math.abs(this.dx);
      } else if (wasRight) {
        // Hit right edge: move ball out and force movement to the right.
        this.x = bar.x + bar.width;
        this.dx = Math.abs(this.dx);
      } else {
        // Fallback for deep overlap where entry side is ambiguous.
        this.dy *= -1;
      }

      if (bar instanceof HitBar) {
        bar.destroy();
      }

      // Resolve a single bar per frame to avoid double flips.
      break;
    }
  }

  updatePosition() {
    this.node.style.left = `${this.x}px`;
    this.node.style.top = `${this.y}px`;
  }
}

class Bar extends GameObject {
  right = false;
  left = false;
  acceleration = 1;
  maxSpeed = 10;
  rightKey = "d";
  leftKey = "a";

  constructor() {
    super({
      container: gameContainer,
      nodeId: "bar",
      width: 100,
      height: 5,
      dy: 0,
      dx: 0,
      x: 0,
      y: 0,
    });

    this.viewportWidth = this.container.clientWidth;
    this.y = this.container.clientHeight - 100;
    this.x = this.viewportWidth / 2 - this.width / 2;

    const moveToDefaultPosition = () => {
      this.node.style.top = `${this.y}px`;
    };

    moveToDefaultPosition();

    addEventListener("keydown", (e) => this.handleKeyPress(e));
    addEventListener("keyup", (e) => this.handleKeyRelease(e));
  }

  handleKeyPress(e: KeyboardEvent) {
    if (e.key === this.rightKey) {
      this.right = true;
      this.left = false;
    } else if (e.key === this.leftKey) {
      this.left = true;
      this.right = false;
    }
  }

  handleKeyRelease(e: KeyboardEvent) {
    if (e.key === this.rightKey) {
      this.right = false;
    } else if (e.key === this.leftKey) {
      this.left = false;
    }
  }

  update() {
    if (this.right) {
      this.dx = Math.min(this.dx + this.acceleration, this.maxSpeed);
    } else if (this.left) {
      this.dx = Math.max(this.dx - this.acceleration, -this.maxSpeed);
    } else {
      this.dx = 0;
    }

    this.x = Math.max(
      0,
      Math.min(this.x + this.dx, this.viewportWidth - this.width),
    );

    this.updatePosition();
  }

  updatePosition() {
    this.node.style.transform = `translateX(${this.x}px)`;
  }
}

const spawnHitBarsLine = (input: { y: number; barsCount: number }) => {
  const { y, barsCount } = input;
  const offset = 120;
  const hitBarWidth = 100;
  const containerWidth = gameContainer ? gameContainer.clientWidth : 0;
  const rowWidth = (barsCount - 1) * offset + hitBarWidth;
  const commonOffset = Math.max((containerWidth - rowWidth) / 2, 0);

  const hitBars = [];

  for (let i = 0; i < barsCount; i++) {
    const hitBar = new HitBar({
      x: i * offset + commonOffset,
      y: y,
      className: "hit-bar",
      id: "hit-bar-" + y + "-" + i,
      width: hitBarWidth,
    });

    hitBars.push(hitBar);
  }

  return hitBars;
};

// Spawn hit bars
const spawnHitBars = () => {
  const hitBarsLines = [
    { y: 100, barsCount: 10 },
    { y: 150, barsCount: 9 },
    { y: 200, barsCount: 8 },
    { y: 250, barsCount: 7 },
    { y: 300, barsCount: 6 },
  ];

  const hitBars = [];

  hitBarsLines.forEach((line) => {
    const lineHitBars = spawnHitBarsLine(line);
    hitBars.push(...lineHitBars);
  });

  return hitBars;
};

// Update game
const updateGame = (bar: Bar, ball: Ball, hitBars: HitBar[]) => {
  bar.update();
  ball.update(bar, hitBars);

  requestAnimationFrame(() => updateGame(bar, ball, hitBars));
};

// Initialize game
const init = () => {
  const ballSize = 30;
  const ballX = Math.max((gameContainer.clientWidth - ballSize) / 2, 0);
  const ballY = Math.max((gameContainer.clientHeight - ballSize) / 2, 0) + 50;

  const bar = new Bar();
  const ball = new Ball({
    x: ballX,
    y: ballY,
    width: ballSize,
    height: ballSize,
  });

  const hitBars = spawnHitBars();

  updateGame(bar, ball, hitBars);
};

init();
