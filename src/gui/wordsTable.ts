import { Word, WordWithImage } from "../games";
import CTX from "./CTX";
import { Button } from "./button";
import { ButtonGroupTable } from "./buttonGroup";
import { ButtonWithDescription } from "./buttonWithDescription";

const wordsTable = (ctx: CTX) => {
  const result = new ButtonGroupTable(ctx);
  result.content = ctx.progress.sortWords().map((word) => {
    const text = new Button(ctx);
      text.likeLabel = true;
      text.content = word.toLearnText;
      
      const img = (word.toLearnImg) ? new Button(ctx) : undefined;
      if (img) {
        img.likeLabel = true;
        img.content = (word as WordWithImage).toLearnImg;
      }

      // progress
      let learning = ctx.progress.wordLearning(word.toLearnText);
      const progress = new Button(ctx);
      progress.likeLabel = true;
      progress.content = learning.text;
      /*if (learning.updateRequired) this._buttonUpdaters.push(() => {
        learning = wordLearning(word, this.content.progress);
        progress.content = learning.text;
        progress.redraw();
      });*/

      // stats
      const stats = ctx.progress.wordStats(word.toLearnText);
      const desc = new ButtonWithDescription(ctx);
      desc.likeLabel = true;
      desc.content = { text: stats.successes, description: stats.fails };

      return [text, img, progress, desc];
  });
  return result;
}

export default wordsTable;
