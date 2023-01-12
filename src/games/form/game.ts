import { Init } from "../../init";
import settings from "../../settings";
import { settings as formGame, FormGameDifficulty  } from "./settings";
import { AbstractGame, WordWithImage } from "..";
import { EndGameStats } from "..";
import OneForm from "./oneForm";
import { drawStatusText, drawStatusTextFail, drawStatusTextSuccess, prepareStatusText } from "../../gui/status";

const calculateCardSize = (init: Init, words: WordWithImage[]) => {
  let minHeight = 0;
  let minWidth = 0;
  words.forEach((word) => {
    minHeight = Math.max(minHeight, word.toLearnImg.height + settings.gui.button.padding * 2);
    minWidth = Math.max(minWidth, word.toLearnImg.width + settings.gui.button.padding * 2);
  });
  return { minHeight, minWidth };
}

const calcForm = (init: Init, words: WordWithImage[]) => {
  return {
    card: calculateCardSize(init, words),
  };
}

const calcFormPos = (init: Init) => {
  return {
    ...prepareStatusText(init),
  };
}

class Form extends AbstractGame<{ words: WordWithImage[], dif: FormGameDifficulty }, ReturnType<typeof calcForm>, ReturnType<typeof calcFormPos>, EndGameStats> {
  constructor(init: Init, content: Form["content"]) {
    super(init, content, true);
    this.onGameStart();
  }
  private _curForm: OneForm;
  private _wonForms: OneForm[] = [];
  private _lostForms: OneForm[] = [];
  private score = {
    total: 0, health: 3,
    required: 
      (this.content.dif.endCount + 1 - this.content.dif.startCount) 
        * this.content.dif.stepCount * this.content.words.length,
  }
  private wordsStats() {
    const allForms = [ ...this._wonForms, ...this._lostForms ];
    return this.content.words.map((word) => {
      const forms = allForms.filter((form) => form.answers.includes(word));
      const answerForms = forms.filter((form) => form.answer === word);
      const answerFormsSuccess = answerForms.filter((form) => form.clickedWord === word);
      const falseAnswers = forms.filter((form) => form.falseAnswers.includes(word));
      return { word, asAnswers: forms.length, asAnswer: answerForms.length, asSuccessfullAnswer: answerFormsSuccess.length, asFalseAnswers: falseAnswers.length };
    });
  }
  private async loseAnimation() {
    for (const form of this._lostForms) {
      this._curForm = form;
      form.redraw();
      await new Promise((resolve) => {
        setTimeout(resolve, formGame.endAnimationTime / this._lostForms.length);
      });
    }
    this.gameEnder({ isSuccess: false });
  }
  private async winAnimation() {
    await new Promise((resolve) => setTimeout(resolve, formGame.endAnimationTime / this._wonForms.length));
    for (const form of this._wonForms) {
      this._curForm = form;
      form.redraw();
      await new Promise((resolve) => setTimeout(resolve, formGame.endAnimationTime / this._wonForms.length));
    }
    this.gameEnder({ isSuccess: true });
  }
  private showNextForm() {
    const wordsStats = this.wordsStats().sort((a, b) => a.asAnswer - b.asAnswer);
    const nextAnswerCandidates = wordsStats.filter((word) => word.asSuccessfullAnswer === wordsStats[0].asSuccessfullAnswer);
    const nextAnswerStat = nextAnswerCandidates[Math.floor(Math.random() * nextAnswerCandidates.length)];
    const nextAnswer = nextAnswerStat.word;
    const nextFalseAnswersCount = nextAnswerStat.asSuccessfullAnswer < this.content.dif.stepCount ? this.content.dif.startCount - 1 : this.content.dif.endCount - 1;
    const nextFalseAnswers = wordsStats.filter((wordStat) => wordStat.word !== nextAnswer).sort((a, b) => a.asAnswers - b.asAnswers).slice(0, nextFalseAnswersCount).map((stat) => stat.word);
    const this2 = this;
    this._curForm = new OneForm(this.init, nextAnswer, nextFalseAnswers, function(word) {
      if (word !== nextAnswer) {
        this2.score.health -= 1;
        this2._lostForms.unshift(this);
      } else {
        this2.score.total += 1;
        this2._wonForms.unshift(this);
      }
    }, function() {
      if (this2.score.health <= 0) this2.loseAnimation();
      else if (this2.score.total >= this2.score.required) this2.winAnimation();
      else this2.showNextForm();
    }, this.prepared.card.minWidth, this.prepared.card.minHeight, () => this.drawStatus(), true);
    this._curForm.glue();
  }
  private drawStatus() {
    if (!this._curForm.clickedWord) {
      drawStatusText(this.init, this._curForm.answer.toLearnText, this.score.total, this.score.required, this.score.health, this.preparedPos);
    } else if (this._curForm.clickedWord === this._curForm.answer) {
      drawStatusTextSuccess(this.init, this._curForm.answer.toLearnText, this.score.health, this.preparedPos);
    } else {
      drawStatusTextFail(this.init, this._curForm.answer.toLearnText, this.score.health, this.preparedPos);
    }
  }

  protected onGameStart(): void {
    this.showNextForm();
  }
  protected onGameEnd(): void {
    
  }
  protected prepare() {
    return calcForm(this.init, this.content.words);
  }
  protected preparePos() {
    return calcFormPos(this.init);
  }
  protected redraw(): void {
    this._curForm.redraw();
  }
  protected scrollOptions(): { oneStep: number; maxHeight: number; } {
    return { maxHeight: 0, oneStep: 0 };
  }
  protected update(): void {
    this._curForm.reposition();
    for (const form of this._wonForms) form.reposition();
    for (const form of this._lostForms) form.reposition();
  }
}

export default Form;
