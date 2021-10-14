/* exported app, utils */

const kanas = {
    columns: [ 'A', 'I', 'U', 'E', 'O' ],
    rows: [
        '',
        'K',
        'S',
        'T',
        'N',
        'H',
        'M',
        'Y',
        'R',
        'W',
        '(N)',
    ],
    hiraganas: [
        [ 'あ', 'い', 'う', 'え', 'お' ],
        [ 'か', 'き', 'く', 'け', 'こ' ],
        [ 'さ', 'し', 'す', 'せ', 'そ' ],
        [ 'た', 'ち', 'つ', 'て', 'と' ],
        [ 'な', 'に', 'ぬ', 'ね', 'の' ],
        [ 'は', 'ひ', 'ふ', 'へ', 'ほ' ],
        [ 'ま', 'み', 'む', 'め', 'も' ],
        [ 'や', '', 'ゆ', '', 'よ' ],
        [ 'ら', 'り', 'る', 'れ', 'ろ' ],
        [ 'わ', '', '', '', 'を' ],
        [ 'ん' ],
    ],
    katakanas: [
        [ 'ア', 'イ', 'ウ', 'エ', 'オ' ],
        [ 'カ', 'キ', 'ク', 'ケ', 'コ' ],
        [ 'サ', 'シ', 'ス', 'セ', 'ソ' ],
        [ 'タ', 'チ', 'ツ', 'テ', 'ト' ],
        [ 'ナ', 'ニ', 'ヌ', 'ネ', 'ノ' ],
        [ 'ハ', 'ヒ', 'フ', 'ヘ', 'ホ' ],
        [ 'マ', 'ミ', 'ム', 'メ', 'モ' ],
        [ 'ヤ', '', 'ユ', '', 'ヨ' ],
        [ 'ラ', 'リ', 'ル', 'レ', 'ロ' ],
        [ 'ワ', '', '', '', 'ヲ' ],
        [ 'ン' ],
    ],
    exceptions: {
        SI: 'SHI',
        TI: 'CHI',
        TU: 'TSU',
        HU: 'FU',
    },
    traps: {
        hiraganas: {
            //TODO
        },
        katakanas: {
            //TODO
        },
    },
    mappings: [
        [ 0, 1 ],
        [ 1, 0 ],
        [ 0, 2 ],
        [ 2, 0 ],
        [ 1, 2 ],
        [ 2, 1 ],
    ],
};

const utils = {
    randint: function (min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    },
    randindex: function (array, ...toIgnore) {
        if (array.length === 0 || toIgnore.length >= array.length) {
            return -1;
        }
        let index;
        do {
            index = this.randint(0, array.length);
        } while (this.contains(toIgnore, index));
        return index;
    },
    randitem: function (array) {
        if (array.length === 0) {
            return undefined;
        }
        return array[this.randindex(array)];
    },
    randindexes: function (array, number, ...toIgnore) {
        if (array.length === 0 || toIgnore.length >= array.length) {
            return [];
        }
        const output = [];
        for (let i = 0; i < number; i++) {
            output.push(this.randindex(array, ...output, ...toIgnore));
        }
        return output;
    },
    shuffle: function (array) {
        const output = [ ...array ];
        for (let i = 0; i < array.length; i++) {
            const i1 = this.randindex(array);
            const i2 = this.randindex(array, i1);
            [ output[i1], output[i2] ] = [ output[i2], output[i1] ];
        }
        return output;
    },
    contains: function (array, item) {
        return array.indexOf(item) >= 0;
    },
};

Array.prototype.shuffle = function () {
    return utils.shuffle(this);
};
Array.prototype.contains = function (item) {
    return utils.contains(this, item);
};

let app = {
    el: '#app',
    data: {
        title: 'Kana Test',
        score: 0,
        options: {
            available: kanas.rows,
            selected: kanas.rows,
            mappings: [ 0, 1 ],
            answers: 6,
        },
        kanas: [],
        question: 'あ',
        answers: [ 'A', 'I', 'U', 'O' ],
        wrongAnswers: [],
    },
    watch: {
        options: {
            handler: 'changeOption',
            deep: true,
        },
    },
    methods: {
        findKana: function(v) {
            const self = this;
            return self.kanas.filter((kana) => {
                return kana.contains(v);
            })[0];
        },
        buildKanas: function () {
            const self = this;
            self.kanas = [];
            self.options.selected.forEach((prefix) => {
                const row = kanas.rows.indexOf(prefix);
                if (prefix === '(N)') {
                    self.kanas.push([ 'N', kanas.hiraganas[row][0], kanas.katakanas[row][0] ]);
                } else {
                    kanas.columns.forEach((suffix, column) => {
                        const text = kanas.exceptions[prefix + suffix]
                            ? kanas.exceptions[prefix + suffix]
                            : prefix + suffix;
                        if (kanas.hiraganas[row][column] || kanas.katakanas[row][column]) {
                            self.kanas.push([ text, kanas.hiraganas[row][column], kanas.katakanas[row][column] ]);
                        }
                    });
                }
            });
        },
        findSimilars: function(kanaIndex, mapping) {
            const self = this;
            const kana = self.kanas[kanaIndex];
            const similarIndexes = [];
            if (mapping.contains(1) && kanas.traps.hiraganas[kana[1]]) {
                const trap = self.findKana(utils.randitem(kanas.traps.hiraganas[kana[1]]));
                const trapIndex = self.kanas.indexOf(trap);
                similarIndexes.push(trapIndex);
            }
            if (mapping.contains(2) && kanas.traps.katakanas[kana[2]]) {
                const trap = self.findKana(utils.randitem(kanas.traps.hiraganas[kana[1]]));
                const trapIndex = self.kanas.indexOf(trap);

                if (!similarIndexes.contains(trapIndex)) {
                    similarIndexes.push(self.kanas.indexOf(trap));
                }
            }
            if (kana[0].length === 1) {
                if (kana[0] !== 'N') { // !== (N)
                    const sameRow = self.kanas.filter((kana2, i) => !similarIndexes.contains(i) && kana2 !== kana && kana2[0].length === 1);
                    similarIndexes.push(self.kanas.indexOf(utils.randitem(sameRow)));
                    const sameColumn = self.kanas.filter((kana2, i) => !similarIndexes.contains(i) && kana2 !== kana && kana2[0].substr(-1, 1) === kana[0].substr(-1, 1));
                    if (sameColumn.length > 0) {
                        similarIndexes.push(self.kanas.indexOf(utils.randitem(sameColumn)));
                    }
                }
            } else {
                const sameRow = self.kanas.filter((kana2, i) => !similarIndexes.contains(i) && kana2 !== kana && kana2[0].substr(0, 1) === kana[0].substr(0, 1));
                similarIndexes.push(self.kanas.indexOf(utils.randitem(sameRow)));
                const sameColumn = self.kanas.filter((kana2, i) => !similarIndexes.contains(i) && kana2 !== kana && kana2[0].substr(-1, 1) === kana[0].substr(-1, 1));
                if (sameColumn.length > 0) {
                    similarIndexes.push(self.kanas.indexOf(utils.randitem(sameColumn)));
                }
            }
            return similarIndexes;
        },
        generateQuestion: function () {
            const self = this;

            const mapping = kanas.mappings[utils.randitem(self.options.mappings)];

            const questionIndex = utils.randindex(self.kanas);
            const similarIndexes = self.findSimilars(questionIndex, mapping);
            const otherIndexes = utils.randindexes(self.kanas, Math.max(0, self.options.answers - similarIndexes.length - 1), questionIndex );

            self.question = self.kanas[questionIndex][mapping[0]];
            self.answers = [ questionIndex ]
                .concat(similarIndexes)
                .concat(otherIndexes)
                .map((index) => self.kanas[index][mapping[1]]);
            self.answers = self.answers.shuffle();
            self.wrongAnswers = [];
        },
        answer: function (v) {
            const self = this;

            const question = self.findKana(self.question);

            if (question.contains(v)) {
                self.score += 1;
                self.generateQuestion();
            } else {
                self.score = 0;
                self.wrongAnswers.push(v);
            }

            document.activeElement.blur();
        },
        changeOption: function () {
            const self = this;
            if (self.options.mappings.length === 0) {
                self.options.mappings.push(0);
            }
            if (self.options.selected.length === 0) {
                self.options.selected.push('');
            }
            self.score = 0;
            self.buildKanas();
            self.generateQuestion();
        },
    },
    mounted: function () {
        const self = this;
        console.log('app mounted');
        setTimeout(() => {
            self.$el.setAttribute('style', '');
        });
        self.buildKanas();
        self.generateQuestion();
    },
};

window.onload = () => {
    app = new Vue(app);
};
