import { Word, WordWithImage } from "../games";
import CTX from "./CTX";
import { Button } from "./button";
import { ButtonGroupTable, Table } from "./buttonGroup";
import { ButtonWithDescription } from "./buttonWithDescription";

const wordsTable = (ctx: CTX) => {
  const table = new ButtonGroupTable(ctx);
  const words = ctx.progress.sortWords();
  table.content = words.map((word) => {
    const text = new Button(ctx);
      text.likeLabel = true;
      text.content = word.toLearnText;
      
      const img = (word.toLearnImg) ? new Button(ctx) : undefined;
      if (img) {
        img.likeLabel = true;
        img.content = (word as WordWithImage).toLearnImg;
      }

      // progress
      const learning = ctx.progress.wordLearning(word.toLearnText);
      const progress = new Button(ctx);
      progress.likeLabel = true;
      progress.content = learning.text;

      // stats
      const stats = ctx.progress.wordStats(word.toLearnText);
      const desc = new ButtonWithDescription(ctx);
      desc.likeLabel = true;
      desc.content = { text: stats.successes, description: stats.fails };

      return [text, img, progress, desc];
  });
  const dynamic = () => {
    let changed = false;
    for (let i = 0; i < words.length; i += 1) {
      const word = words[i];
      // progress
      const learning = ctx.progress.wordLearning(word.toLearnText);
      const progress = (table.content as Table)[i][2] as Button;
      changed ||= progress.setContentWithSizeChangeCheck(learning.text);
    }
    return changed;
  }
  return { table, dynamic };
}

export default wordsTable;
