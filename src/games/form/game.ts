import { Init } from "../../init";
import settings from "../../settings";
import { formSettings as formGame, FormGameSetup  } from "./settings";
import { AbstractGame, Word, WordWithImage } from "..";
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

class Form extends AbstractGame<{ words: WordWithImage[], setup: FormGameSetup }, ReturnType<typeof calcForm>, ReturnType<typeof calcFormPos>, EndGameStats> {
  private _curForm: OneForm;
  private _wonForms: OneForm[] = [];
  private _lostForms: OneForm[] = [];
  private score = {
    total: 0, health: 3,
    required: 
      (this.content.setup.endCount + 1 - this.content.setup.startCount) 
        * this.content.setup.stepCount * this.content.words.length,
  }
  private wordsStats() {
    const allForms = [ ...this._wonForms, ...this._lostForms ];
    return this.content.words.map((word) => {
      const forms = allForms.filter((form) => form.answers.includes(word));
      const answerForms = forms.filter((form) => form._answer === word);
      const answerFormsSuccess = answerForms.filter((form) => form.clickedCard?.word === word);
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
    this.stop({ isSuccess: false, name: "form" });
  }
  private async winAnimation() {
    await new Promise((resolve) => setTimeout(resolve, formGame.endAnimationTime / this._wonForms.length));
    for (const form of this._wonForms) {
      this._curForm = form;
      form.redraw();
      await new Promise((resolve) => setTimeout(resolve, formGame.endAnimationTime / this._wonForms.length));
    }
    this.stop({ isSuccess: true, name: "form" });
  }
  private showNextForm() {
    const wordsStats = this.wordsStats().sort((a, b) => a.asSuccessfullAnswer - b.asSuccessfullAnswer);
    const nextAnswerCandidates = wordsStats.filter((word) => word.asSuccessfullAnswer === wordsStats[0].asSuccessfullAnswer);
    const nextAnswerStat = nextAnswerCandidates[Math.floor(Math.random() * nextAnswerCandidates.length)];
    const nextAnswer = nextAnswerStat.word;
    const nextFalseAnswersCount = nextAnswerStat.asSuccessfullAnswer < this.content.setup.stepCount ? this.content.setup.startCount - 1 : this.content.setup.endCount - 1;
    const nextFalseAnswers = wordsStats.filter((wordStat) => wordStat.word !== nextAnswer).sort((a, b) => a.asAnswers - b.asAnswers).slice(0, nextFalseAnswersCount).map((stat) => stat.word);
    const this2 = this;
    const isFirst = !this._curForm;
    this._curForm = new OneForm(this.init, this.content.setup, nextAnswer, nextFalseAnswers, function(word) {
      if (word !== nextAnswer) {
        this2.score.health -= 1;
        this2._lostForms.unshift(this);
        this2.onProgressFail?.(nextAnswer, word ? [word] : nextFalseAnswers);
      } else {
        this2.score.total += 1;
        this2._wonForms.unshift(this);
        if (nextFalseAnswers.length > 0) this2.onProgressSuccess?.(nextAnswer, nextFalseAnswers);
      }
    }, function() {
      if (this2.score.health <= 0) this2.loseAnimation();
      else if (this2.score.total >= this2.score.required) this2.winAnimation();
      else this2.showNextForm();
    }, (remainingTime) => this.drawStatus(remainingTime));
    if (!isFirst) this.redraw();
  }
  private drawStatus(remainingTime?: Date) {
    if (!this._curForm.clickedCard) {
      drawStatusText(this.init, this._curForm._answer.toLearnText, this.score.total, this.score.required, this.score.health, this.preparedPos, remainingTime);
    } else if (this._curForm.clickedCard.word === this._curForm._answer) {
      drawStatusTextSuccess(this.init, this._curForm._answer.toLearnText, this.score.health, this.preparedPos, remainingTime);
    } else {
      drawStatusTextFail(this.init, this._curForm._answer.toLearnText, this.score.health, this.preparedPos, remainingTime);
    }
  }
  protected start() {
    this.showNextForm();
  }
  protected freeResources() {
    this._curForm?.stop();
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
  protected resize(): void {
    this._curForm.repos();
    for (const form of this._wonForms) form.repos();
    for (const form of this._lostForms) form.repos();
  }
}

export default Form;
