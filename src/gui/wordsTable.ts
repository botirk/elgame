import { Word, WordWithImage } from "../games";
import CTX from "./CTX";
import { Updateable } from "./abstractButton";
import { Button } from "./button";
import { ButtonGroupTable } from "./buttonGroup";
import { ButtonWithDescription } from "./buttonWithDescription";

export default class WordsTable extends ButtonGroupTable {
  constructor(ctx: CTX, words: Word[], x?: Updateable, y?: Updateable) {
    const table = words.map((word) => {
      const text = new Button(ctx, word.toLearnText, { likeLabel: true });
      const img = (word.toLearnImg) ? new Button(ctx, (word as WordWithImage).toLearnImg, { likeLabel: true }) : undefined;    

      // progress
      let learning = ctx.progress.wordLearning(word.toLearnText);
      const progress = new Button(ctx, learning.text, { likeLabel: true });
      /*if (learning.updateRequired) this._buttonUpdaters.push(() => {
        learning = wordLearning(word, this.content.progress);
        progress.content = learning.text;
        progress.redraw();
      });*/

      // stats
      const stats = ctx.progress.wordStats(word.toLearnText);
      const desc = new ButtonWithDescription(ctx, { text: stats.successes, description: stats.fails }, { likeLabel: true });

      return [text, img, progress, desc];
    });
    //this._timer = setInterval(this.updateButton.bind(this), 1050);
    super(ctx, table, x, y);
  }
}