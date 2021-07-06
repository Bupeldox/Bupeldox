// Taken from https://codepen.io/Bupeldox/pen/rNVQpMy?editors=1010


class ChunkGenWorld {
    constructor(chunkSize, chunkCount, superChunkSize, isSuper = false) {
        this.chunkGrid = [];
        this.chunkCount = chunkCount;
        this.chunkSize = chunkSize;
        this.superChunkSize = superChunkSize;

        for (var x = 0; x < chunkCount; x++) {
            this.chunkGrid[x] = [];
            for (var y = 0; y < chunkCount; y++) {
                var a, b, c, d;
                d = -3;
                var lowNum = function() {
                    return Math.random() * (2 / 5);
                };

                if (!this.isSuper) {
                    if (x == 0) {
                        c = lowNum();
                        a = lowNum();
                    }
                    if (y == 0) {
                        b = lowNum();
                        d = lowNum();
                    }
                    if (x >= chunkCount - 1) {
                        b = lowNum();
                        d = lowNum();
                    }
                    if (y >= chunkCount - 1) {
                        c = lowNum();
                        d = lowNum();
                    }
                } else {
                    if (x == 0) {
                        c = Math.random();
                    }
                    if (y == 0) {
                        b = Math.random();
                        if (x == 0) {
                            a = Math.random();
                        }
                    }
                }

                if (d == -3) {
                    d = Math.random();
                }

                if (x > 0) {
                    a = this.chunkGrid[x - 1][y].b;
                    c = this.chunkGrid[x - 1][y].d;
                }
                if (y > 0) {
                    a = this.chunkGrid[x][y - 1].c;
                    b = this.chunkGrid[x][y - 1].d;
                }

                this.chunkGrid[x][y] = new Chunk(chunkSize, a, b, c, d);
            }
        }
    }
    GetMap() {
        var map = [];
        for (var x = 0; x < this.chunkCount; x++) {
            for (var y = 0; y < this.chunkCount; y++) {
                var theChunk = this.chunkGrid[x][y];
                var mapStartx = x * this.chunkSize;
                var mapStarty = y * this.chunkSize;

                for (var cx = 0; cx < theChunk.size; cx++) {
                    for (var cy = 0; cy < theChunk.size; cy++) {
                        if (!map[mapStartx + cx]) {
                            map[mapStartx + cx] = [];
                        }
                        map[mapStartx + cx][mapStarty + cy] = theChunk.grid[cx][cy];
                    }
                }
            }
        }
        if (this.isSuper) {
            var SuperGen = new ChunkGenWorld(this.chunkSize, this.superChunkSize);
            var superChunkMap = SuperGen.GetMap();
            for (var x = 0; x < map.length; x++) {
                for (var y = 0; y < map[0].length; y++) {
                    var sx = Math.floor((superChunkMap.length * x) / map.length);
                    var sy = Math.floor((superChunkMap.length * y) / map[0].length);

                    var mod = superChunkMap[sx][sy];

                    map[x][y] *= mod * 1.5;
                }
            }
        }
        return map;
    }
}
class Chunk {
    constructor(size, a, b, c, d) {
        this.grid = [];
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;

        for (var x = 0; x < size; x++) {
            this.grid[x] = [];
            for (var y = 0; y < size; y++) {
                this.grid[x][y] = undefined;
            }
        }
        this.size = size;
        this.edge = size - 1;
        this.grid[0][0] = a;
        this.grid[this.edge][0] = b;
        this.grid[0][this.edge] = c;
        this.grid[this.edge][this.edge] = d;

        this.Interpolate();
    }

    Interpolate() {
        for (var x = 1; x < this.size - 1; x++) {
            var p = x / this.size;
            this.grid[x][0] = this.InterpValues(this.a, this.b, p);
            this.grid[x][this.edge] = this.InterpValues(this.c, this.d, p);
        }
        for (var x = 0; x < this.size; x++) {
            for (var y = 1; y < this.size - 1; y++) {
                var p = y / this.size;
                this.grid[x][y] = this.InterpValues(
                    this.grid[x][0],
                    this.grid[x][this.edge],
                    p
                );
            }
        }
    }
    InterpValues(a, b, p) {
        return (b - a) * p + a;
    }
}


class BubbleWorldGen {
    constructor(resolution, bubbleCount, bubbleStrength) {
        this.bubbles = [];
        this.bubbleAmps = [];
        this.resolution = resolution;
        this.bubbleStrength = bubbleStrength;
        for (var i = 0; i < bubbleCount; i++) {
            this.bubbles[i] = new Vec2(
                0.1 + Math.random() * 0.8,
                0.1 + Math.random() * 0.8
            );
            //this.bubbleAmps[i] = Math.random();
        }
    }

    GetMap() {
        var output = [];
        for (var x = 0; x < this.resolution; x++) {
            output[x] = [];
            for (var y = 0; y < this.resolution; y++) {
                var value = 1;
                var point = new Vec2(x / this.resolution, y / this.resolution);
                for (var i = 0; i < this.bubbles.length; i++) {
                    value *= this.bubbleStrength / point.distance(this.bubbles[i]); //*this.bubbleAmps[i];
                }

                output[x][y] = value * 0.8;
            }
        }
        return output;
    }
}


class worleyAndChunkGen {
    constructor(resolution) {
        var numberOfChunks = 10;
        var numberOfSuperChunks = 2;
        this.chunkGen = new ChunkGenWorld(resolution / numberOfChunks,numberOfChunks);
        this.bubble = new BubbleWorldGen(resolution, 2, 0.3);
    }
    GetMap() {
        var map = this.chunkGen.GetMap();
        var superChunkMap = this.bubble.GetMap();
        for (var x = 0; x < map.length; x++) {
            for (var y = 0; y < map[0].length; y++) {
                var sx = Math.floor((superChunkMap.length * x) / map.length);
                var sy = Math.floor((superChunkMap.length * y) / map[0].length);

                var mod = superChunkMap[sx][sy];

                map[x][y] *= mod;
            }
        }
        return map;
    }
}