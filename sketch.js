let tiles = [];
const tileImages = [];

let grid = [];

const DIM = 20;

function preload() {
  // const path = 'rail';
  // for (let i = 0; i < 7; i++) {
  //   tileImages[i] = loadImage(`${path}/tile${i}.png`);
  // }

  const path = 'tiles/fantasy-landscape';
  for (let i = 0; i < 13; i++) {
    tileImages[i] = loadImage(`${path}/${i + 1}.png`);
  }
}

function removeDuplicatedTiles(tiles) {
  const uniqueTilesMap = {};
  for (const tile of tiles) {
    const key = tile.edges.join(','); // ex: "ABB,BCB,BBA,AAA"
    uniqueTilesMap[key] = tile;
  }
  return Object.values(uniqueTilesMap);
}

function setup() {
  createCanvas(400, 400);
  //randomSeed(15);

  // Loaded and created the tiles
  tiles[0] = new Tile(tileImages[0], ['AAAA', 'AAAA', 'AAAA', 'AAAA']);
  tiles[1] = new Tile(tileImages[1], ['ABBA', 'AAAA', 'ABBA', 'AAAA']);
  tiles[2] = new Tile(tileImages[2], ['AAAA', 'ABBA', 'ABBA', 'AAAA']);
  tiles[3] = new Tile(tileImages[3], ['ABBA', 'ABBA', 'ABBA', 'AAAA']);
  tiles[4] = new Tile(tileImages[4], ['ABBA', 'ABBA', 'ABBA', 'ABBA']);
  tiles[5] = new Tile(tileImages[5], ['CCCC', 'CCCC', 'CCCC', 'CCCC']);
  tiles[6] = new Tile(tileImages[6], ['ACCC', 'CCCC', 'CCCA', 'AAAA']);
  tiles[7] = new Tile(tileImages[7], ['AACC', 'CCCC', 'CCAA', 'AAAA']);
  tiles[8] = new Tile(tileImages[8], ['AAAA', 'ACCC', 'CCCA', 'AAAA']);
  tiles[9] = new Tile(tileImages[9], ['AAAA', 'AACC', 'CCAA', 'AAAA']);
  tiles[10] = new Tile(tileImages[10], ['ACCA', 'AAAA', 'ACCA', 'AAAA']);
  tiles[11] = new Tile(tileImages[11], ['ACCA', 'ACCA', 'ACCA', 'AAAA']);
  tiles[12] = new Tile(tileImages[12], ['AAAA', 'ACCA', 'ACCA', 'AAAA']);

  for (let i = 0; i < 12; i++) {
    tiles[i].index = i;
  }

  const initialTileCount = tiles.length;
  for (let i = 0; i < initialTileCount; i++) {
    let tempTiles = [];
    for (let j = 0; j < 4; j++) {
      tempTiles.push(tiles[i].rotate(j));
    }
    tempTiles = removeDuplicatedTiles(tempTiles);
    tiles = tiles.concat(tempTiles);
  }
  console.log(tiles.length);

  // Generate the adjacency rules based on edges
  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    tile.analyze(tiles);
  }

  startOver();
}

function startOver() {
  // Create cell for each spot on the grid
  for (let i = 0; i < DIM * DIM; i++) {
    grid[i] = new Cell(tiles.length);
  }
}

function checkValid(arr, valid) {
  //console.log(arr, valid);
  for (let i = arr.length - 1; i >= 0; i--) {
    // VALID: [BLANK, RIGHT]
    // ARR: [BLANK, UP, RIGHT, DOWN, LEFT]
    // result in removing UP, DOWN, LEFT
    let element = arr[i];
    // console.log(element, valid.includes(element));
    if (!valid.includes(element)) {
      arr.splice(i, 1);
    }
  }
  // console.log(arr);
  // console.log("----------");
}

function mousePressed() {
  redraw();
}

function draw() {
  background(0);

  const w = width / DIM;
  const h = height / DIM;
  for (let j = 0; j < DIM; j++) {
    for (let i = 0; i < DIM; i++) {
      let cell = grid[i + j * DIM];
      if (cell.collapsed) {
        let index = cell.options[0];
        image(tiles[index].img, i * w, j * h, w, h);
      } else {
        noFill();
        stroke(51);
        rect(i * w, j * h, w, h);
      }
    }
  }

  // Pick cell with least entropy
  let gridCopy = grid.slice();
  gridCopy = gridCopy.filter((a) => !a.collapsed);
  // console.table(grid);
  // console.table(gridCopy);

  if (gridCopy.length == 0) {
    return;
  }
  gridCopy.sort((a, b) => {
    return a.options.length - b.options.length;
  });

  let len = gridCopy[0].options.length;
  let stopIndex = 0;
  for (let i = 1; i < gridCopy.length; i++) {
    if (gridCopy[i].options.length > len) {
      stopIndex = i;
      break;
    }
  }

  if (stopIndex > 0) gridCopy.splice(stopIndex);
  const cell = random(gridCopy);
  cell.collapsed = true;
  const pick = random(cell.options);
  if (pick === undefined) {
    startOver();
    return;
  }
  cell.options = [pick];

  const nextGrid = [];
  for (let j = 0; j < DIM; j++) {
    for (let i = 0; i < DIM; i++) {
      let index = i + j * DIM;
      if (grid[index].collapsed) {
        nextGrid[index] = grid[index];
      } else {
        let options = new Array(tiles.length).fill(0).map((x, i) => i);
        // Look up
        if (j > 0) {
          let up = grid[i + (j - 1) * DIM];
          let validOptions = [];
          for (let option of up.options) {
            let valid = tiles[option].down;
            validOptions = validOptions.concat(valid);
          }
          checkValid(options, validOptions);
        }
        // Look right
        if (i < DIM - 1) {
          let right = grid[i + 1 + j * DIM];
          let validOptions = [];
          for (let option of right.options) {
            let valid = tiles[option].left;
            validOptions = validOptions.concat(valid);
          }
          checkValid(options, validOptions);
        }
        // Look down
        if (j < DIM - 1) {
          let down = grid[i + (j + 1) * DIM];
          let validOptions = [];
          for (let option of down.options) {
            let valid = tiles[option].up;
            validOptions = validOptions.concat(valid);
          }
          checkValid(options, validOptions);
        }
        // Look left
        if (i > 0) {
          let left = grid[i - 1 + j * DIM];
          let validOptions = [];
          for (let option of left.options) {
            let valid = tiles[option].right;
            validOptions = validOptions.concat(valid);
          }
          checkValid(options, validOptions);
        }

        // I could immediately collapse if only one option left?
        nextGrid[index] = new Cell(options);
      }
    }
  }

  grid = nextGrid;
}
