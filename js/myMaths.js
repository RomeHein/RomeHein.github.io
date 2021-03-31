let sin = Math.sin;
let cos = Math.cos;

const getRandomInt = (max) => {
    return Math.floor(Math.random() * Math.floor(max));
}

let translationMatrix = (x,y,z) => [
    1,    0,    0,   0,
    0,    1,    0,   0,
    0,    0,    1,   0,
    x,    y,    z,   1
];

let scaleMatrix = (w,h,d) => [
    w,    0,    0,   0,
    0,    h,    0,   0,
    0,    0,    d,   0,
    0,    0,    0,   1
];

const rotateAroundXAxis = (a) => [
    1, 0, 0, 0,
    0, cos(a), -sin(a), 0,
    0, sin(a), cos(a), 0,
    0, 0, 0, 1
];

const rotateAroundYAxis = (a) => [
    cos(a), 0, sin(a), 0,
    0, 1, 0, 0,
    -sin(a), 0, cos(a), 0,
    0, 0, 0, 1
];

const rotateAroundZAxis = (a) => [
    cos(a), -sin(a), 0, 0,
    sin(a), cos(a), 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
];

const multiplyMatrixAndPoint = (matrix, point) => {
    let c0r0 = matrix[0], c1r0 = matrix[1], c2r0 = matrix[2], c3r0 = matrix[3];
    let c0r1 = matrix[4], c1r1 = matrix[5], c2r1 = matrix[6], c3r1 = matrix[7];
    let c0r2 = matrix[8], c1r2 = matrix[9], c2r2 = matrix[10], c3r2 = matrix[11];
    let c0r3 = matrix[12], c1r3 = matrix[13], c2r3 = matrix[14], c3r3 = matrix[15];

    let x = point[0];
    let y = point[1];
    let z = point[2];
    let w = point[3];

    let resultX = (x * c0r0) + (y * c0r1) + (z * c0r2) + (w * c0r3);
    let resultY = (x * c1r0) + (y * c1r1) + (z * c1r2) + (w * c1r3);
    let resultZ = (x * c2r0) + (y * c2r1) + (z * c2r2) + (w * c2r3);
    let resultW = (x * c3r0) + (y * c3r1) + (z * c3r2) + (w * c3r3);

    return [resultX, resultY, resultZ, resultW];
}

const multiplyMatrices = (matrixA, matrixB) => {
    // Slice the second matrix up into rows
    let row0 = [matrixB[0], matrixB[1], matrixB[2], matrixB[3]];
    let row1 = [matrixB[4], matrixB[5], matrixB[6], matrixB[7]];
    let row2 = [matrixB[8], matrixB[9], matrixB[10], matrixB[11]];
    let row3 = [matrixB[12], matrixB[13], matrixB[14], matrixB[15]];

    // Multiply each row by matrixA
    let result0 = multiplyMatrixAndPoint(matrixA, row0);
    let result1 = multiplyMatrixAndPoint(matrixA, row1);
    let result2 = multiplyMatrixAndPoint(matrixA, row2);
    let result3 = multiplyMatrixAndPoint(matrixA, row3);

    // Turn the result rows back into a single matrix
    return [
        result0[0], result0[1], result0[2], result0[3],
        result1[0], result1[1], result1[2], result1[3],
        result2[0], result2[1], result2[2], result2[3],
        result3[0], result3[1], result3[2], result3[3]
    ];
}