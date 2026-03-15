// Game object interfaces
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
// Constants
var COLLISION_COEFF = 0.5;
// Helper functions
var sides = function (_a) {
    var x = _a.x, y = _a.y, width = _a.width, height = _a.height;
    return [x, x + width, y, y + height];
};
var overlaps = function (a, b) {
    var _a = sides(a), La = _a[0], Ra = _a[1], Ta = _a[2], Ba = _a[3];
    var _b = sides(b), Lb = _b[0], Rb = _b[1], Tb = _b[2], Bb = _b[3];
    return !(Ra < Lb || Rb < La || Ba < Tb || Bb < Ta);
};
function rand(min, max) {
    return Math.floor(Math.random() * (max + 1)) + min;
}
// Game container
var gameContainer = document.getElementById("box");
// Game object class
var GameObject = /** @class */ (function () {
    function GameObject(_a) {
        var container = _a.container, className = _a.className, width = _a.width, height = _a.height, dx = _a.dx, dy = _a.dy, x = _a.x, y = _a.y, nodeId = _a.nodeId;
        var _this = this;
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
        var spawn = function () {
            var object = document.createElement("div");
            object.className = className;
            object.id = nodeId;
            object.style.width = "".concat(_this.width, "px");
            object.style.height = "".concat(_this.height, "px");
            object.style.top = "".concat(y, "px");
            object.style.left = "".concat(x, "px");
            _this.viewportWidth = _this.container.clientWidth;
            _this.viewportHeight = _this.container.clientHeight;
            _this.container.appendChild(object);
            _this.node = object;
        };
        spawn();
    }
    return GameObject;
}());
var HitBar = /** @class */ (function (_super) {
    __extends(HitBar, _super);
    function HitBar(input) {
        var x = input.x, y = input.y, className = input.className, id = input.id, width = input.width;
        return _super.call(this, {
            container: gameContainer,
            nodeId: id,
            className: className,
            width: width,
            height: 10,
            dy: 0,
            dx: 0,
            x: x,
            y: y,
        }) || this;
    }
    HitBar.prototype.destroy = function () {
        this.node.remove();
    };
    return HitBar;
}(GameObject));
var Ball = /** @class */ (function (_super) {
    __extends(Ball, _super);
    function Ball(input) {
        var x = input.x, y = input.y, width = input.width, height = input.height;
        return _super.call(this, {
            container: gameContainer,
            className: "ball",
            width: width,
            height: 30,
            dy: 3,
            dx: 0,
            x: x,
            y: y,
        }) || this;
    }
    Ball.prototype.update = function (bar, hitBars) {
        // Keep previous position so collision code can infer impact direction.
        var prevX = this.x;
        var prevY = this.y;
        this.x += this.dx;
        this.y += this.dy;
        this.collision(__spreadArray([bar], hitBars, true), prevX, prevY);
        this.updatePosition();
    };
    Ball.prototype.collision = function (bars, prevX, prevY) {
        // Left and right container borders collision detection
        if (this.x <= 0 || this.x + this.width >= this.viewportWidth) {
            this.dx *= -1;
        }
        // Top and bottom container borders collision detection
        if (this.y <= 0 || this.y + this.height >= this.viewportHeight) {
            this.dy *= -1;
        }
        // Bar collision detection
        for (var _i = 0, bars_1 = bars; _i < bars_1.length; _i++) {
            var bar = bars_1[_i];
            // Skip already removed hit bars that still exist in the array.
            if (bar instanceof HitBar && !bar.node.isConnected) {
                continue;
            }
            if (!overlaps(this, bar)) {
                continue;
            }
            // Determine where the ball was in the previous frame relative to the bar.
            // This lets us resolve side hits differently from top/bottom hits.
            var wasAbove = prevY + this.height <= bar.y;
            var wasBelow = prevY >= bar.y + bar.height;
            var wasLeft = prevX + this.width <= bar.x;
            var wasRight = prevX >= bar.x + bar.width;
            if (wasAbove) {
                // Hit the top of the bar: move ball out and force upward movement.
                this.y = bar.y - this.height;
                this.dy = -Math.abs(this.dy);
                // Inherit part of paddle horizontal speed for angle control.
                if (bar.dx !== 0) {
                    this.dx = bar.dx * COLLISION_COEFF;
                }
            }
            else if (wasBelow) {
                // Hit from below: move ball out and force downward movement.
                this.y = bar.y + bar.height;
                this.dy = Math.abs(this.dy);
            }
            else if (wasLeft) {
                // Hit left edge: move ball out and force movement to the left.
                this.x = bar.x - this.width;
                this.dx = -Math.abs(this.dx);
            }
            else if (wasRight) {
                // Hit right edge: move ball out and force movement to the right.
                this.x = bar.x + bar.width;
                this.dx = Math.abs(this.dx);
            }
            else {
                // Fallback for deep overlap where entry side is ambiguous.
                this.dy *= -1;
            }
            if (bar instanceof HitBar) {
                bar.destroy();
            }
            // Resolve a single bar per frame to avoid double flips.
            break;
        }
    };
    Ball.prototype.updatePosition = function () {
        this.node.style.left = "".concat(this.x, "px");
        this.node.style.top = "".concat(this.y, "px");
    };
    return Ball;
}(GameObject));
var Bar = /** @class */ (function (_super) {
    __extends(Bar, _super);
    function Bar() {
        var _this = _super.call(this, {
            container: gameContainer,
            nodeId: "bar",
            width: 100,
            height: 5,
            dy: 0,
            dx: 0,
            x: 0,
            y: 0,
        }) || this;
        _this.right = false;
        _this.left = false;
        _this.acceleration = 1;
        _this.maxSpeed = 10;
        _this.rightKey = "d";
        _this.leftKey = "a";
        _this.viewportWidth = _this.container.clientWidth;
        _this.y = _this.container.clientHeight - 100;
        _this.x = _this.viewportWidth / 2 - _this.width / 2;
        var moveToDefaultPosition = function () {
            _this.node.style.top = "".concat(_this.y, "px");
        };
        moveToDefaultPosition();
        addEventListener("keydown", function (e) { return _this.handleKeyPress(e); });
        addEventListener("keyup", function (e) { return _this.handleKeyRelease(e); });
        return _this;
    }
    Bar.prototype.handleKeyPress = function (e) {
        if (e.key === this.rightKey) {
            this.right = true;
            this.left = false;
        }
        else if (e.key === this.leftKey) {
            this.left = true;
            this.right = false;
        }
    };
    Bar.prototype.handleKeyRelease = function (e) {
        if (e.key === this.rightKey) {
            this.right = false;
        }
        else if (e.key === this.leftKey) {
            this.left = false;
        }
    };
    Bar.prototype.update = function () {
        if (this.right) {
            this.dx = Math.min(this.dx + this.acceleration, this.maxSpeed);
        }
        else if (this.left) {
            this.dx = Math.max(this.dx - this.acceleration, -this.maxSpeed);
        }
        else {
            this.dx = 0;
        }
        this.x = Math.max(0, Math.min(this.x + this.dx, this.viewportWidth - this.width));
        this.updatePosition();
    };
    Bar.prototype.updatePosition = function () {
        this.node.style.transform = "translateX(".concat(this.x, "px)");
    };
    return Bar;
}(GameObject));
var spawnHitBarsLine = function (input) {
    var y = input.y, barsCount = input.barsCount;
    var offset = 120;
    var hitBarWidth = 100;
    var containerWidth = gameContainer ? gameContainer.clientWidth : 0;
    var rowWidth = (barsCount - 1) * offset + hitBarWidth;
    var commonOffset = Math.max((containerWidth - rowWidth) / 2, 0);
    var hitBars = [];
    for (var i = 0; i < barsCount; i++) {
        var hitBar = new HitBar({
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
var spawnHitBars = function () {
    var hitBarsLines = [
        { y: 100, barsCount: 10 },
        { y: 150, barsCount: 9 },
        { y: 200, barsCount: 8 },
        { y: 250, barsCount: 7 },
        { y: 300, barsCount: 6 },
    ];
    var hitBars = [];
    hitBarsLines.forEach(function (line) {
        var lineHitBars = spawnHitBarsLine(line);
        hitBars.push.apply(hitBars, lineHitBars);
    });
    return hitBars;
};
// Update game
var updateGame = function (bar, ball, hitBars) {
    bar.update();
    ball.update(bar, hitBars);
    requestAnimationFrame(function () { return updateGame(bar, ball, hitBars); });
};
// Initialize game
var init = function () {
    var ballSize = 30;
    var ballX = Math.max((gameContainer.clientWidth - ballSize) / 2, 0);
    var ballY = Math.max((gameContainer.clientHeight - ballSize) / 2, 0) + 50;
    var bar = new Bar();
    var ball = new Ball({
        x: ballX,
        y: ballY,
        width: ballSize,
        height: ballSize,
    });
    var hitBars = spawnHitBars();
    updateGame(bar, ball, hitBars);
};
init();
