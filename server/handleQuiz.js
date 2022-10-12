var fs = require('fs');

const sortListPlayer = (listPlayer) => {
    for(let i = 0; i<listPlayer.length-1; i++) {
        for(let j = i+1; j<listPlayer.length; j++) {
            if(listPlayer[i].score < listPlayer[j].score) {
                let temp = listPlayer[i];
                listPlayer[i] = listPlayer[j];
                listPlayer[j] = temp;
            }
        }
    }
}

const handleScore = (order) => {
    if(order >= 1 && order <= 5) {
        return 110 - order * 10;
    }

    if(order >=6 && order <= 10) {
        return 60 - (order - 6) * 5;
    }

    return 30;
}

const loadListWord = async (name) => {
    if(name === 'random') {
        const list = loadAllQuiz();
        return list;
    }
    const list = await fs.readFileSync(`./listquiz/${name}.txt`).toString().split("\n");
    return list;
}

const loadAllQuiz = async () => {
    try {
        const [animal, plant, drink, fish, newyear, object] = await Promise.all([loadListWord("animal"), 
            loadListWord("plant"), loadListWord("drink"), loadListWord("fish"),
            loadListWord("newyear"), loadListWord("object")]);
        const listWord = animal.concat(plant, drink, fish, newyear, object);
        return listWord;
    } catch (error) {
        console.log("error load quiz: ", error)
    }
}

const randomListWord = async (category, memberLength) => {
    try {
        const tempList = {};
        const listWord = await loadListWord(category);
        const listQuiz = [];
        while(listQuiz.length < memberLength) {
            const newQuiz = listWord[Math.floor(Math.random() * listWord.length)];
            if(!tempList[newQuiz]) {
                listQuiz.push(newQuiz.trim());
                tempList[newQuiz] = true;
            } 
        }
        return listQuiz;
    } catch (error) {
        console.log("error to load quiz", error)
    }
}

module.exports = {sortListPlayer, handleScore, randomListWord, loadListWord};