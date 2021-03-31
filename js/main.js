const lightUpNixies = (delay) => {
    const letters = ["R","O","M","A","I","N"];
    for (let i =0;i<letters.length;i++) {
        const letterSVGon = SVG(`#${letters[i]}-on`);
        const letterSVGoff = SVG(`#${letters[i]}-off`);
        letterSVGon.opacity(0);
        setTimeout(() =>{
            if (letters[i] === letters[getRandomInt(6)])  {
                setTimeout(() =>{
                    letterSVGon.opacity(100);
                    letterSVGoff.opacity(0);
                }, 700);
                setTimeout(() =>{
                    letterSVGon.opacity(0);
                    letterSVGoff.opacity(100);
                }, 900);
                setTimeout(() =>{
                    letterSVGon.opacity(100);
                    letterSVGoff.opacity(0);
                }, 1500 + 100*getRandomInt(6))
            } else {
                setTimeout(() =>{
                    letterSVGon.opacity(100);
                    letterSVGoff.opacity(0);
                }, 100 + 200*getRandomInt(6) + getRandomInt(100))
            }
        }, delay)
    }
}

const animateCayzacOnStart = () => {
    let timer = setInterval(() => {
        writeOnDigitScreen(`  ${getRandomInt(9)}${getRandomInt(9)}  `);
    }, 100);
    setTimeout(() => {
        clearInterval(timer);
        writeOnDigitScreen(`  42  `);
    },1000);
    setTimeout(() => {
        writeOnDigitScreen("CAYZAC");
    },2000);
}

const writeOnDigitScreen = (string) => {
    const drawOnDigit = (i,string) => {
        switch (string) {
            case "1":
                SVG(`#t${i}`).opacity(0);
                SVG(`#b${i}`).opacity(0);
                SVG(`#m${i}`).opacity(0);
                SVG(`#lt${i}`).opacity(0);
                SVG(`#lb${i}`).opacity(0);
                SVG(`#rt${i}`).opacity(100);
                SVG(`#rb${i}`).opacity(100);
                break;
            case "2":
                SVG(`#t${i}`).opacity(100);
                SVG(`#b${i}`).opacity(100);
                SVG(`#m${i}`).opacity(100);
                SVG(`#lt${i}`).opacity(0);
                SVG(`#lb${i}`).opacity(100);
                SVG(`#rt${i}`).opacity(100);
                SVG(`#rb${i}`).opacity(0);
                break;
            case "3":
                SVG(`#t${i}`).opacity(100);
                SVG(`#b${i}`).opacity(100);
                SVG(`#m${i}`).opacity(100);
                SVG(`#lt${i}`).opacity(0);
                SVG(`#lb${i}`).opacity(0);
                SVG(`#rt${i}`).opacity(100);
                SVG(`#rb${i}`).opacity(100);
                break;
            case "4":
                SVG(`#t${i}`).opacity(0);
                SVG(`#b${i}`).opacity(0);
                SVG(`#m${i}`).opacity(100);
                SVG(`#lt${i}`).opacity(100);
                SVG(`#lb${i}`).opacity(0);
                SVG(`#rt${i}`).opacity(100);
                SVG(`#rb${i}`).opacity(100);
                break;
            case "5":
                SVG(`#t${i}`).opacity(100);
                SVG(`#b${i}`).opacity(100);
                SVG(`#m${i}`).opacity(100);
                SVG(`#lt${i}`).opacity(100);
                SVG(`#lb${i}`).opacity(0);
                SVG(`#rt${i}`).opacity(0);
                SVG(`#rb${i}`).opacity(100);
                break;
            case "6":
                SVG(`#t${i}`).opacity(100);
                SVG(`#b${i}`).opacity(100);
                SVG(`#m${i}`).opacity(100);
                SVG(`#lt${i}`).opacity(100);
                SVG(`#lb${i}`).opacity(100);
                SVG(`#rt${i}`).opacity(0);
                SVG(`#rb${i}`).opacity(100);
                break;
            case "7":
                SVG(`#t${i}`).opacity(100);
                SVG(`#b${i}`).opacity(0);
                SVG(`#m${i}`).opacity(0);
                SVG(`#lt${i}`).opacity(0);
                SVG(`#lb${i}`).opacity(0);
                SVG(`#rt${i}`).opacity(100);
                SVG(`#rb${i}`).opacity(100);
                break;
            case "8":
                SVG(`#t${i}`).opacity(100);
                SVG(`#b${i}`).opacity(100);
                SVG(`#m${i}`).opacity(100);
                SVG(`#lt${i}`).opacity(100);
                SVG(`#lb${i}`).opacity(100);
                SVG(`#rt${i}`).opacity(100);
                SVG(`#rb${i}`).opacity(100);
                break;
            case "9":
                SVG(`#t${i}`).opacity(100);
                SVG(`#b${i}`).opacity(100);
                SVG(`#m${i}`).opacity(100);
                SVG(`#lt${i}`).opacity(100);
                SVG(`#lb${i}`).opacity(0);
                SVG(`#rt${i}`).opacity(100);
                SVG(`#rb${i}`).opacity(100);
                break;
            case "0":
                SVG(`#t${i}`).opacity(100);
                SVG(`#b${i}`).opacity(100);
                SVG(`#m${i}`).opacity(0);
                SVG(`#lt${i}`).opacity(100);
                SVG(`#lb${i}`).opacity(100);
                SVG(`#rt${i}`).opacity(100);
                SVG(`#rb${i}`).opacity(100);
                break;
            case "A":
                SVG(`#t${i}`).opacity(100);
                SVG(`#b${i}`).opacity(0);
                SVG(`#m${i}`).opacity(100);
                SVG(`#lt${i}`).opacity(100);
                SVG(`#lb${i}`).opacity(100);
                SVG(`#rt${i}`).opacity(100);
                SVG(`#rb${i}`).opacity(100);
                break;
            case "B":
                SVG(`#t${i}`).opacity(100);
                SVG(`#b${i}`).opacity(100);
                SVG(`#m${i}`).opacity(100);
                SVG(`#lt${i}`).opacity(100);
                SVG(`#lb${i}`).opacity(100);
                SVG(`#rt${i}`).opacity(100);
                SVG(`#rb${i}`).opacity(100);
                break;
            case "C":
                SVG(`#t${i}`).opacity(100);
                SVG(`#b${i}`).opacity(100);
                SVG(`#m${i}`).opacity(0);
                SVG(`#lt${i}`).opacity(100);
                SVG(`#lb${i}`).opacity(100);
                SVG(`#rt${i}`).opacity(0);
                SVG(`#rb${i}`).opacity(0);
                break;
            case "D":
                SVG(`#t${i}`).opacity(100);
                SVG(`#b${i}`).opacity(100);
                SVG(`#m${i}`).opacity(0);
                SVG(`#lt${i}`).opacity(100);
                SVG(`#lb${i}`).opacity(100);
                SVG(`#rt${i}`).opacity(100);
                SVG(`#rb${i}`).opacity(100);
                break;
            case "E":
                SVG(`#t${i}`).opacity(100);
                SVG(`#b${i}`).opacity(100);
                SVG(`#m${i}`).opacity(100);
                SVG(`#lt${i}`).opacity(100);
                SVG(`#lb${i}`).opacity(100);
                SVG(`#rt${i}`).opacity(0);
                SVG(`#rb${i}`).opacity(0);
                break;
            case "F":
                SVG(`#t${i}`).opacity(100);
                SVG(`#b${i}`).opacity(0);
                SVG(`#m${i}`).opacity(100);
                SVG(`#lt${i}`).opacity(100);
                SVG(`#lb${i}`).opacity(100);
                SVG(`#rt${i}`).opacity(0);
                SVG(`#rb${i}`).opacity(0);
                break;
            case "G":
                SVG(`#t${i}`).opacity(100);
                SVG(`#b${i}`).opacity(100);
                SVG(`#m${i}`).opacity(100);
                SVG(`#lt${i}`).opacity(100);
                SVG(`#lb${i}`).opacity(100);
                SVG(`#rt${i}`).opacity(0);
                SVG(`#rb${i}`).opacity(100);
                break;
            case "H":
                SVG(`#t${i}`).opacity(0);
                SVG(`#b${i}`).opacity(0);
                SVG(`#m${i}`).opacity(100);
                SVG(`#lt${i}`).opacity(100);
                SVG(`#lb${i}`).opacity(100);
                SVG(`#rt${i}`).opacity(100);
                SVG(`#rb${i}`).opacity(100);
                break;
            case "I":
                SVG(`#t${i}`).opacity(0);
                SVG(`#b${i}`).opacity(0);
                SVG(`#m${i}`).opacity(0);
                SVG(`#lt${i}`).opacity(0);
                SVG(`#lb${i}`).opacity(0);
                SVG(`#rt${i}`).opacity(100);
                SVG(`#rb${i}`).opacity(100);
                break;
            case "J":
                SVG(`#t${i}`).opacity(0);
                SVG(`#b${i}`).opacity(100);
                SVG(`#m${i}`).opacity(0);
                SVG(`#lt${i}`).opacity(0);
                SVG(`#lb${i}`).opacity(0);
                SVG(`#rt${i}`).opacity(100);
                SVG(`#rb${i}`).opacity(100);
                break;
            case "K":
                SVG(`#t${i}`).opacity(0);
                SVG(`#b${i}`).opacity(0);
                SVG(`#m${i}`).opacity(100);
                SVG(`#lt${i}`).opacity(100);
                SVG(`#lb${i}`).opacity(100);
                SVG(`#rt${i}`).opacity(100);
                SVG(`#rb${i}`).opacity(100);
                break;
            case "L":
                SVG(`#t${i}`).opacity(0);
                SVG(`#b${i}`).opacity(100);
                SVG(`#m${i}`).opacity(0);
                SVG(`#lt${i}`).opacity(100);
                SVG(`#lb${i}`).opacity(100);
                SVG(`#rt${i}`).opacity(0);
                SVG(`#rb${i}`).opacity(0);
                break;
            case "M":
                SVG(`#t${i}`).opacity(100);
                SVG(`#b${i}`).opacity(0);
                SVG(`#m${i}`).opacity(0);
                SVG(`#lt${i}`).opacity(100);
                SVG(`#lb${i}`).opacity(100);
                SVG(`#rt${i}`).opacity(100);
                SVG(`#rb${i}`).opacity(100);
                break;
            case "N":
                SVG(`#t${i}`).opacity(0);
                SVG(`#b${i}`).opacity(0);
                SVG(`#m${i}`).opacity(0);
                SVG(`#lt${i}`).opacity(100);
                SVG(`#lb${i}`).opacity(100);
                SVG(`#rt${i}`).opacity(100);
                SVG(`#rb${i}`).opacity(100);
                break;
            case "O":
                SVG(`#t${i}`).opacity(100);
                SVG(`#b${i}`).opacity(100);
                SVG(`#m${i}`).opacity(0);
                SVG(`#lt${i}`).opacity(100);
                SVG(`#lb${i}`).opacity(100);
                SVG(`#rt${i}`).opacity(100);
                SVG(`#rb${i}`).opacity(100);
                break;
            case "P":
                SVG(`#t${i}`).opacity(100);
                SVG(`#b${i}`).opacity(0);
                SVG(`#m${i}`).opacity(100);
                SVG(`#lt${i}`).opacity(100);
                SVG(`#lb${i}`).opacity(100);
                SVG(`#rt${i}`).opacity(100);
                SVG(`#rb${i}`).opacity(0);
                break;
            case "Q":
                SVG(`#t${i}`).opacity(100);
                SVG(`#b${i}`).opacity(100);
                SVG(`#m${i}`).opacity(0);
                SVG(`#lt${i}`).opacity(100);
                SVG(`#lb${i}`).opacity(100);
                SVG(`#rt${i}`).opacity(100);
                SVG(`#rb${i}`).opacity(100);
                break;
            case "R":
                SVG(`#t${i}`).opacity(100);
                SVG(`#b${i}`).opacity(0);
                SVG(`#m${i}`).opacity(100);
                SVG(`#lt${i}`).opacity(100);
                SVG(`#lb${i}`).opacity(100);
                SVG(`#rt${i}`).opacity(100);
                SVG(`#rb${i}`).opacity(100);
                break;
            case "U":
                SVG(`#t${i}`).opacity(0);
                SVG(`#b${i}`).opacity(100);
                SVG(`#m${i}`).opacity(0);
                SVG(`#lt${i}`).opacity(100);
                SVG(`#lb${i}`).opacity(100);
                SVG(`#rt${i}`).opacity(100);
                SVG(`#rb${i}`).opacity(100);
                break;
            case "Y":
                SVG(`#t${i}`).opacity(0);
                SVG(`#b${i}`).opacity(0);
                SVG(`#m${i}`).opacity(100);
                SVG(`#lt${i}`).opacity(100);
                SVG(`#lb${i}`).opacity(0);
                SVG(`#rt${i}`).opacity(100);
                SVG(`#rb${i}`).opacity(100);
                break;
            case "Z":
                SVG(`#t${i}`).opacity(100);
                SVG(`#b${i}`).opacity(100);
                SVG(`#m${i}`).opacity(100);
                SVG(`#lt${i}`).opacity(0);
                SVG(`#lb${i}`).opacity(100);
                SVG(`#rt${i}`).opacity(100);
                SVG(`#rb${i}`).opacity(0);
                break;
            default:
                SVG(`#t${i}`).opacity(0);
                SVG(`#b${i}`).opacity(0);
                SVG(`#m${i}`).opacity(0);
                SVG(`#lt${i}`).opacity(0);
                SVG(`#lb${i}`).opacity(0);
                SVG(`#rt${i}`).opacity(0);
                SVG(`#rb${i}`).opacity(0);
        }
    }
    for (let i =1;i<7;i++) {
        drawOnDigit(i,string[i-1]);
    }
}

const transformElementById = (id, matrix) => {
    let moveMe = document.getElementById(id);
    let matrix3dRule = `matrix3d(${matrix.join(',')})`;
    moveMe.style.transform = matrix3dRule;
    return moveMe
}

SVG.on(document, 'DOMContentLoaded', () => {
    animateCayzacOnStart();
    lightUpNixies(1000);

    const cube = SVG("#cube");
    const homeface = SVG("#home-face");
    homeface.on('mouseover', () => {
        const transformMatrixe = translationMatrix(0,-10,0);
        transformElementById('cube',transformMatrixe);
    })
    homeface.on('mouseout', () => {
        const transformMatrixe = translationMatrix(0,10,0);
        transformElementById('cube',transformMatrixe);
    })
    const backendButton = SVG("#button-frontend");
    backendButton.on('click', () => {
        const rotationMatrice = multiplyMatrices(scaleMatrix(1.05,0.8,1),rotateAroundZAxis(-Math.PI*0.65));
        const rotationMatrice2 = multiplyMatrices(rotateAroundXAxis(Math.PI*0.26),rotateAroundZAxis(-Math.PI*0.65));
        transformElementById('cube',rotationMatrice);

        // let moveMe = document.getElementById("cube");
        // moveMe.style['webkitTransform'] = 'rotateX(' + 45 + 'deg) rotateY(' + 0 + 'deg) rotateZ(' + 117 + 'deg)';	
    })
})