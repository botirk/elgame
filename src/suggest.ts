import { AbstractGame, GameName, Word, WordWithImage } from "./games";
import Form from "./games/form";
import Memory from "./games/memory";
import CTX from "./gui/CTX";
import { ProgressPrevGamesLen } from "./progress";
import settings from "./settings";
import { randomInArray, randomNInArray, randomiseArray } from "./utils";

export default class Suggest {
  constructor(private readonly ctx: CTX) { }

  sortWords<T extends Word>(words: T[], now = new Date()) {
    return words.sort((a, b) => {
			const aWord = this.ctx.progress.getWord(a.toLearnText), bWord = this.ctx.progress.getWord(b.toLearnText);
			const aLearned = this.ctx.progress.isLearnedForNow(a.toLearnText, now), bLearned = this.ctx.progress.isLearnedForNow(b.toLearnText, now);
			if (bLearned && !aLearned) return  -1;
			else if (!bLearned && aLearned) return 1;
			else if (bLearned && aLearned) return aWord.bonusstage - bWord.bonusstage;
      else if (aWord.stage !== bWord.stage) return aWord.stage - bWord.stage;
			else if (aWord.substage !== bWord.substage) return aWord.substage - bWord.substage;
      else if (a.toLearnText < b.toLearnText) return -1;
      else if (a.toLearnText > b.toLearnText) return 1;
      else return 0;
    });
  }

  wordsToLearn(endTime: Date, now = new Date()): Word[] {
		const diff = new Date(endTime.getTime() - now.getTime());
		const count = Math.max(2, Math.floor(diff.getTime() / ((1 / settings.maxWordsLearnedPerMinute) * 60 * 1000)));
		return this.sortWords(this.ctx.words, now).slice(0, count);
	}

  wordWithImage(words = this.ctx.words) {
		return randomInArray(words);
	}

  wordsWithImage(words = this.ctx.wordsWithImage(), n: number) {
		const result = randomNInArray(words, n);
    if (result.length < n) result.push(...randomNInArray(this.ctx.wordsWithImage().filter((word) => !result.includes(word)), n - result.length));
    return result;
	}

	wordPartnersWithImage(word: WordWithImage, count: number) {
		const result: WordWithImage[] = [];
		// add mistakes to partners
		if (count > 0) {
			let mistake = this.ctx.progress.getWord(word.toLearnText).mistakes[0];
			if (mistake) {
				let mistakeWord = this.ctx.wordsWithImage().find((word) => word.toLearnText === mistake[0]);
				if (!mistakeWord) {
					mistake = this.ctx.progress.getWord(word.toLearnText).mistakes[1];
					mistakeWord = this.ctx.wordsWithImage().find((word) => word.toLearnText === mistake[0]);
				}
				if (mistakeWord) {
					result.push(mistakeWord);
					count -= 1;
				}
			}
			if (mistake) result.push()
		}
		// add others as partners
		result.push(...randomiseArray(this.ctx.wordsWithImage().filter((fword) => !result.includes(fword) && fword !== word)).slice(0, count));
		// return 
		return result;
	}

	gameName(): GameName {
		const formCount = this.ctx.progress.prevGames.filter((name) => name === "form").length;
  	const dropCount = this.ctx.progress.prevGames.filter((name) => name === "drop").length;
  	const memoryCount = this.ctx.progress.prevGames.filter((name) => name === "memory").length;

  	const formVotes = (ProgressPrevGamesLen + 1 - formCount) * settings.form.gameChance;
  	const dropVotes = (ProgressPrevGamesLen + 1 - dropCount) * 0;
  	const memoryVotes = (ProgressPrevGamesLen + 1 - memoryCount) * settings.memory.gameChance;
  
  	const vote = Math.random() * (formVotes + dropCount + memoryVotes);

		if (vote <= formVotes) {
			return "form"
		} else if (vote <= formVotes + dropVotes) {
			return "drop";
		} else {
			return "memory";
		}
	}

  game(words = this.ctx.words, now = new Date()): AbstractGame<any, any> {
    let gameName = this.gameName();

		const shouldTest = false;
		if (shouldTest) {
			gameName = "memory";
		}

		if (gameName === "memory") {
			const wordsWithImage = this.ctx.wordsWithImage(words);
			const cards = this.sortWords(this.wordsWithImage(wordsWithImage, 5 + this.ctx.progress.bonusDif), now);
			if (cards.length > 4 && cards.find((card) => this.ctx.progress.getWord(card.toLearnText).stage <= 2)) cards.pop();
			if (cards.length > 3 && cards.find((card) => this.ctx.progress.getWord(card.toLearnText).stage <= 1)) cards.pop();
			if (cards.length > 2 && cards.find((card) => this.ctx.progress.getWord(card.toLearnText).stage == 0)) cards.pop();
			return new Memory(this.ctx, { words: cards });
		} else {
			const answer = this.wordWithImage(words) as WordWithImage;
			const progress = this.ctx.progress.getWord(answer.toLearnText);
			const numFalseAnswers = Math.min(5, progress.stage + 1) + this.ctx.progress.bonusDif;
			const falseAnswers = this.wordPartnersWithImage(answer, numFalseAnswers);
			return new Form(this.ctx, { answer, falseAnswers });
		}
  }
}