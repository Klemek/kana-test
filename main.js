/* exported app, utils */

const kanas = {
  columns: ["A", "I", "U", "E", "O"],
  rows: ["", "K", "S", "T", "N", "H", "M", "Y", "R", "W", "(N)"],
  hiraganas: [
    ["あ", "い", "う", "え", "お"],
    ["か", "き", "く", "け", "こ"],
    ["さ", "し", "す", "せ", "そ"],
    ["た", "ち", "つ", "て", "と"],
    ["な", "に", "ぬ", "ね", "の"],
    ["は", "ひ", "ふ", "へ", "ほ"],
    ["ま", "み", "む", "め", "も"],
    ["や", "", "ゆ", "", "よ"],
    ["ら", "り", "る", "れ", "ろ"],
    ["わ", "", "", "", "を"],
    ["ん"],
  ],
  katakanas: [
    ["ア", "イ", "ウ", "エ", "オ"],
    ["カ", "キ", "ク", "ケ", "コ"],
    ["サ", "シ", "ス", "セ", "ソ"],
    ["タ", "チ", "ツ", "テ", "ト"],
    ["ナ", "ニ", "ヌ", "ネ", "ノ"],
    ["ハ", "ヒ", "フ", "ヘ", "ホ"],
    ["マ", "ミ", "ム", "メ", "モ"],
    ["ヤ", "", "ユ", "", "ヨ"],
    ["ラ", "リ", "ル", "レ", "ロ"],
    ["ワ", "", "", "", "ヲ"],
    ["ン"],
  ],
  exceptions: {
    SI: "SHI",
    TI: "CHI",
    TU: "TSU",
    HU: "FU",
  },
};

const utils = {
  randint: function (min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  },
  randindex: function (array, ...toIgnore) {
    let index;
    do {
      index = this.randint(0, array.length);
    } while (this.contains(toIgnore, index));
    return index;
  },
  randitem: function (array) {
    return array[this.randindex(array)];
  },
  randindexes: function (array, number, ...toIgnore) {
    const output = [];
    for (let i = 0; i < number; i++) {
      output.push(this.randindex(array, ...output, ...toIgnore));
    }
    return output;
  },
  shuffle: function (array) {
    const output = [...array];
    for (let i = 0; i < array.length; i++) {
      const i1 = this.randindex(array);
      const i2 = this.randindex(array, i1);
      [output[i1], output[i2]] = [output[i2], output[i1]];
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
  el: "#app",
  data: {
    title: "Kana Test",
    score: 0,
    options: {
      available: kanas.rows,
      selected: kanas.rows,
      rh: true,
      hr: true,
      rk: false,
      kr: false,
      hk: false,
      kh: false,
      answers: 6,
    },
    kanas: [],
    question: "あ",
    answers: ["A", "I", "U", "O"],
    wrongAnswers: [],
  },
  watch: {
    options: {
      handler: "changeOption",
      deep: true,
    },
  },
  methods: {
    buildKanas: function () {
      const self = this;
      self.kanas = [];
      self.options.selected.forEach((prefix) => {
        const row = kanas.rows.indexOf(prefix);
        if (prefix === "(N)") {
          self.kanas.push([
            "N",
            kanas.hiraganas[row][0],
            kanas.katakanas[row][0],
          ]);
        } else {
          kanas.columns.forEach((suffix, column) => {
            const text = kanas.exceptions[prefix + suffix]
              ? kanas.exceptions[prefix + suffix]
              : prefix + suffix;
            if (kanas.hiraganas[row][column] || kanas.katakanas[row][column]) {
              self.kanas.push([
                text,
                kanas.hiraganas[row][column],
                kanas.katakanas[row][column],
              ]);
            }
          });
        }
      });
    },
    generateQuestion: function () {
      const self = this;
      const questionIndex = utils.randindex(self.kanas);
      const answerIndexes = utils.randindexes(
        self.kanas,
        self.options.answers - 1,
        questionIndex
      );
      //TODO add difficulty

      const mappings = [];
      if (self.options.rh) { mappings.push([0, 1]); }
      if (self.options.hr) { mappings.push([1, 0]); }
      if (self.options.rk) { mappings.push([0, 2]); }
      if (self.options.kr) { mappings.push([2, 0]); }
      if (self.options.hk) { mappings.push([1, 2]); }
      if (self.options.kh) { mappings.push([2, 1]); }
      const mapping = utils.randitem(mappings);

      self.question = self.kanas[questionIndex][mapping[0]];
      self.answers = [questionIndex]
        .concat(answerIndexes)
        .map((index) => self.kanas[index][mapping[1]]);
      self.answers = self.answers.shuffle();
      self.wrongAnswers = [];
    },
    answer: function (v) {
      const self = this;

      const question = self.kanas.filter((kana) => {
        return kana.contains(self.question);
      })[0];

      if (question.contains(v)) {
        self.score += 1;
        self.generateQuestion();
      } else {
        self.score = 0;
        self.wrongAnswers.push(v);
      }

      document.activeElement.blur();
    },
    changeOption: function (v) {
      const self = this;
      if (!self.options.rh && !self.options.rk && !self.options.hk) {
        self.options.rh = true;
      }
      if (self.options.selected.length === 0) {
        self.options.selected.push("");
      }
      self.score = 0;
      self.buildKanas();
      self.generateQuestion();
    },
  },
  mounted: function () {
    const self = this;
    console.log("app mounted");
    setTimeout(() => {
      self.$el.setAttribute("style", "");
    });
    self.buildKanas();
    self.generateQuestion();
  },
};

window.onload = () => {
  app = new Vue(app);
};
