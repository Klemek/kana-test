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
        'あいうえお',
        'かきくけこ',
        'さしすせそ',
        'たちつてと',
        'なにぬねの',
        'はひふへほ',
        'まみむめも',
        'や ゆ よ',
        'らりるれろ',
        'わ   を',
        'ん',
    ],
    katakanas: [
        'アイウエオ',
        'カキクケコ',
        'サシスセソ',
        'タチツテト',
        'ナニヌネノ',
        'ハヒフヘホ',
        'マミムメモ',
        'ヤ ユ ヨ',
        'ラリルレロ',
        'ワ   ヲ',
        'ン',
    ],
    exceptions: {
        SI: 'SHI',
        TI: 'CHI',
        TU: 'TSU',
        HU: 'FU',
    },
    traps: {
        hiraganas: [
            'うえふら',
            'いりにけはほ',
            'あおぬめ',
            'れねわ',
            'しも',
            'つてと',
            'るろそ',
            'まはほよ',
            'くへ',
            'たなを',
            'えん',
            'きさち',
        ],
        katakanas: [
            'ンソシ',
            'ノメ',
            'クケタ',
            'コロヨ',
            'ワウフ',
            'ヌフ',
            'ネホオ',
            'チテ',
            'エニ',
            'コユ',
            'ラテ',
            'セヒ',
        ],
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
    randitem: function (array, ...toIgnore) {
        if (array.length === 0) {
            return undefined;
        }
        return array[this.randindex(array, ...toIgnore)];
    },
    randindexes: function (array, number, ...toIgnore) {
        number = Math.min(number, array.length - toIgnore.length);
        const output = [];
        for (let i = 0; i < number; i++) {
            output.push(this.randindex(array, ...output, ...toIgnore));
        }
        return output;
    },
    randitems: function (array, number) {
        const indexes = this.randindexes(array, number);
        return indexes.map(i => array[i]);
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
    unique: function (array) {
        return [ ...new Set(array) ];
    },
};

Array.prototype.shuffle = function () {
    return utils.shuffle(this);
};
Array.prototype.contains = function (item) {
    return utils.contains(this, item);
};
Array.prototype.unique = function () {
    return utils.unique(this);
};

const cookies = {
    set: function (name, value, days = undefined) {
        const maxAge = !days ? undefined : days * 864e2;
        document.cookie = `${name}=${encodeURIComponent(value)}${maxAge ? `;max-age=${maxAge};` : ''}`;
    },
    get: function (name) {
        return document.cookie.split('; ').reduce(function (r, v) {
            const parts = v.split('=');
            return parts[0] === name ? decodeURIComponent(parts[1]) : r;
        }, '');
    },
};

let app = {
    el: '#app',
    data: {
        title: 'Kana Test',
        score: 0,
        highscore: 0,
        savedHighscores: {},
        options: {
            available: kanas.rows,
            selected: kanas.rows,
            mappings: [ 0, 1 ],
            answers: 6,
        },
        kanas: [],
        question: 'あ',
        lastQuestions: [ '', '', '' ],
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
                    self.kanas.push([ 'N', kanas.hiraganas[row][0], kanas.katakanas[row][0], row, 0 ]);
                } else {
                    kanas.columns.forEach((suffix, column) => {
                        const text = kanas.exceptions[prefix + suffix]
                            ? kanas.exceptions[prefix + suffix]
                            : prefix + suffix;
                        if (kanas.hiraganas[row][column] !== ' ') {
                            self.kanas.push([ text, kanas.hiraganas[row][column], kanas.katakanas[row][column], row, column ]);
                        }
                    });
                }
            });
        },
        findSimilars: function(kanaIndex, mapping) {
            const self = this;
            const kana = self.kanas[kanaIndex];
            const similarIndexes = [];
            if (mapping.contains(1)) {
                const traps = kanas.traps.hiraganas.filter(line => line.includes(kana[1]));
                utils.randitems(traps, 2).forEach(line => {
                    const trapKana = utils.randitem(line.split(''), line.indexOf(kana[1]));
                    similarIndexes.push(self.kanas.indexOf(self.findKana(trapKana)));
                });
            }
            if (mapping.contains(2)) {
                const traps = kanas.traps.katakanas.filter(line => line.includes(kana[2]));
                utils.randitems(traps, 2).forEach(line => {
                    const trapKana = utils.randitem(line.split(''), line.indexOf(kana[2]));
                    similarIndexes.push(self.kanas.indexOf(self.findKana(trapKana)));
                });
            }
            if (kana[0] !== 'N') {
                const sameRow = self.kanas.filter((kana2, i) => !similarIndexes.contains(i) && kana2 !== kana && kana2[3] === kana[3]);
                if (sameRow.length > 0) {
                    similarIndexes.push(self.kanas.indexOf(utils.randitem(sameRow)));
                }
                const sameColumn = self.kanas.filter((kana2, i) => !similarIndexes.contains(i) && kana2 !== kana && kana2[4] === kana[4]);
                if (sameColumn.length > 0) {
                    similarIndexes.push(self.kanas.indexOf(utils.randitem(sameColumn)));
                }
            }
            return similarIndexes.unique();
        },
        generateQuestion: function () {
            const self = this;

            const mapping = kanas.mappings[utils.randitem(self.options.mappings)];

            const questionIndex = utils.randindex(self.kanas, self.lastQuestions);

            self.lastQuestions.pop(0);
            self.lastQuestions.push(questionIndex);

            const similarIndexes = self.findSimilars(questionIndex, mapping);
            const otherIndexes = utils.randindexes(self.kanas, Math.max(0, self.options.answers - similarIndexes.length - 1), questionIndex, ...similarIndexes );

            self.question = self.kanas[questionIndex][mapping[0]];
            self.answers = [ questionIndex ]
                .concat(similarIndexes)
                .concat(otherIndexes)
                .map((index) => self.kanas[index][mapping[1]]);
            self.answers = self.answers.shuffle();
            self.wrongAnswers = [];

            /*
             * setTimeout(() => {
             *     this.answer(self.question);
             * });
             */
        },
        answer: function (v) {
            const self = this;

            const question = self.findKana(self.question);

            if (question.contains(v)) {
                self.score += 1;
                if (self.score > self.highscore) {
                    self.highscore = self.score;
                    self.savedHighscores[btoa(JSON.stringify(self.options))] = self.highscore;
                    cookies.set('highscores', btoa(JSON.stringify(self.savedHighscores)));
                }
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

            cookies.set('options', btoa(JSON.stringify(self.options)));

            self.highscore = self.savedHighscores[btoa(JSON.stringify(self.options))] ?? 0;
            self.score = 0;
            self.buildKanas();
            self.generateQuestion();
        },
        readCookies: function() {
            const self = this;

            const savedOptions = cookies.get('options');
            if (savedOptions) {
                try {
                    self.options = JSON.parse(atob(savedOptions));
                } catch (e) { /* ignored */ }
            }

            const savedHighscores = cookies.get('highscores');
            if (savedHighscores) {
                try {
                    self.savedHighscores = JSON.parse(atob(savedHighscores));
                    self.highscore = self.savedHighscores[btoa(JSON.stringify(self.options))] ?? 0;
                } catch (e) { /* ignored */ }
            }
        },
    },
    mounted: function () {
        const self = this;
        console.log('app mounted');
        setTimeout(() => {
            self.$el.setAttribute('style', '');
        });
        self.buildKanas();
        self.readCookies();
        self.generateQuestion();
    },
};

window.onload = () => {
    app = new Vue(app);
};
