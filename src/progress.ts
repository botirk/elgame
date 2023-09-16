import { AbstractGame, GameName, Word, WordWithImage } from "./games";
import Form from "./games/form/game";
import { formSettings } from "./games/form/settings";
import CTX from "./gui/CTX";
import settings from "./settings";
import { ru } from "./translation";
import { randomInArray, randomiseArray } from "./utils";

export const ProgressPrevGamesLen = 10;

export class WordProgress {
	// zero > second > five seconds > 25 seconds > 125 seconds > 625 seconds > ...
	stage = 0;
	// 0 to 3, 4 is completion
	substage = 0;
	// 0 to Infinity
	bonusstage = 0;
	// time stage achieved
	timestamp: Date = new Date();
	// words mistaken [word, number of times mistaken].length <= 10
	mistakes: [string, number][] = [];
	// success times
	success: number = 0;
	// fail times
	fail: number = 0;
}

export default class Progress {
	constructor(private readonly ctx: CTX) {
		this.load();
	}
	
	private load() {
		const str = localStorage.getItem(settings.localStorage.progress);
		if (!str) return;
		const parsed = JSON.parse(str);
		if (typeof(parsed) !== "object") return;
		if (!(parsed.prevGames instanceof Array)) return;
		for (const name of parsed.prevGames) {
			if (typeof(name) === "string") this.prevGames.push(name as GameName);
		}
		if (typeof(parsed.words) !== "object") return;
		for (const key in parsed.words) {
			const candidate = parsed.words[key];
			if (typeof(candidate) !== "object") continue;
			if (!this.words[key]) this.words[key] = new WordProgress();
			if (typeof(candidate.stage) === "number" && candidate.stage >= 0) this.words[key].stage = candidate.stage;
			if (typeof(candidate.substage) === "number" && candidate.substage >= 0) this.words[key].substage = candidate.substage;
			if (typeof(candidate.bonusstage) === "number" && candidate.bonusstage >= 0) this.words[key].bonusstage = candidate.bonusstage;
			if (typeof(candidate.success) === "number" && candidate.success >= 0) this.words[key].success = candidate.success;
			if (typeof(candidate.fail) === "number" && candidate.fail >= 0) this.words[key].fail = candidate.fail;
			if (typeof(candidate.timestamp) === "string") {
				const date = new Date(candidate.timestamp);
				if (isFinite(+date)) this.words[key].timestamp = date;
			}
			if (candidate.mistakes instanceof Array) {
				for (let i = 0; i < 10 && i < candidate.mistakes.length; i++) {
					if (candidate.mistakes[i] instanceof Array) {
						if (typeof(candidate.mistakes[i][0] === "string") && typeof(candidate.mistakes[i][1] === "number")) {
							this.words[key].mistakes[i] = [candidate.mistakes[i][0], candidate.mistakes[i][1]];
						}
					}
				}
			}
		}
		if (typeof(parsed.bonusDif) === "number") this.bonusDif = parsed.bonusDif;
		if (typeof(parsed.learnFormDif) === "number") this.learnFormDif = parsed.learnFormDif;
		if (typeof(parsed.formDif) === "number") this.formDif = parsed.formDif;
		if (typeof(parsed.memoryDif) === "number") this.memoryDif = parsed.memoryDif;
		if (typeof(parsed.dropDif) === "number") this.dropDif = parsed.dropDif;
	}

	save() {
		try {
			// exclude ctx
			const parsed = JSON.stringify({ ...this, ctx: undefined });
			localStorage.setItem(settings.localStorage.progress, parsed);
			return true;
		} catch(e) {
			return false;
		}
	}

	static stageTime(stage: number) {
		return 1000 * (5 ** Math.min(stage, 15));
	}

	isLearnedForNow(word: string, now: Date = new Date()) {
		const wordProgress = this.words[word] || new WordProgress();
		return (now.getTime() - wordProgress.timestamp.getTime() < Progress.stageTime(wordProgress.stage));
	}

	saveProgressFail(answerWord: string, clickedWord: string) {
		// save success
		const answerProgress = this.getWord(answerWord);
		answerProgress.substage = Math.max(0, answerProgress.substage - 1);
		answerProgress.fail += 1;
		// save mistake
		const mistake = answerProgress.mistakes.find((mistake) => mistake[0] === clickedWord);
		// increment
		if (mistake) mistake[1] += 1;
		// push new mistake
		else if (answerProgress.mistakes.length < 10) answerProgress.mistakes.push([clickedWord, 1]);
		// replace old mistake with new mistake
		else {
			answerProgress.mistakes.sort((a, b) => b[1] - a[1]);
			answerProgress.mistakes[9] = [clickedWord, 1];
		}
		
		return this.save();
	}
	
	saveProgressSuccess(answerWord: string, partnerWords: string[]) {
		const now = new Date();
		// main word
		let wordProgress = this.getWord(answerWord);
		wordProgress.success += 1;
		// reduce mistakes
		for (let i = 0; i < wordProgress.mistakes.length; i += 1) {
			wordProgress.mistakes[i][1] = Math.max(0, wordProgress.mistakes[i][1] * 0.9 - 0.25);
			if (wordProgress.mistakes[i][1] === 0) {
				wordProgress.mistakes.splice(i, 1);
				i -= 1;
			}
		}
		// learned
		if (!this.isLearnedForNow(answerWord, now)) {
			wordProgress.substage += 1;
			if (wordProgress.substage >= 4) {
				wordProgress.bonusstage = 0;
				wordProgress.substage = 0;
				wordProgress.stage += 1;
				wordProgress.timestamp = now;
			}
		} else {
			wordProgress.bonusstage += 1;
		}
		// partners
		for (const partnerWord of partnerWords) {
			wordProgress = this.getWord(partnerWord);
			if (!this.isLearnedForNow(partnerWord, now)) {
				wordProgress.substage += 0.1;
				if (wordProgress.substage >= 4) {
					wordProgress.substage = 0;
					wordProgress.bonusstage = 0;
					wordProgress.stage += 1;
					wordProgress.timestamp = now;
				}
			} else {
				wordProgress.bonusstage += 0.1;
			}
		}
		// write
		return this.save();
	}

	saveProgressEnd(game: GameName) {
		while (this.prevGames.length >= 10) this.prevGames.shift();
		this.prevGames.push(game);
		return this.save();
	}

	nextLearnDate(word: string) {
		const wordProgress = this.getWord(word);
		return new Date(wordProgress.timestamp.getTime() + Progress.stageTime(wordProgress.stage));
	}

	untilNextLearnDate(word: string, now: Date = new Date()) {
		const nextDate = this.nextLearnDate(word);
		const diffMS = Math.abs(nextDate.getTime() - now.getTime());
		const diffDays = Math.floor(diffMS / (1000 * 60 * 60 * 24));
		const diffTime = new Date(diffMS % (1000 * 60 * 60 * 24));
	
		let result = "";
		if (diffDays > 0) result += `${diffDays}${ru.Day}`;
		result += `${diffTime.getHours()}:${diffTime.getMinutes()}:`;
		if (diffTime.getSeconds() < 10) result += '0';
		result += `${diffTime.getSeconds()}`
		return result;
	}

	wordLearning(word: string) {
		const wordProgress = this.getWord(word);
		if (this.isLearnedForNow(word)) {
			return {
			text: `${ru.BonusLearning} ${wordProgress.stage}: ${this.untilNextLearnDate(word)}`,
			updateRequired: true,
			};
		} else {
			return {
			text: `${ru.Learning} ${wordProgress.stage}: ${Math.floor(wordProgress.substage / 4 * 100)}%`,
			updateRequired: false,
			};
		}
	}
		
  wordStats(word: string) {
    const wordProgress = this.getWord(word);
    return { successes: `${ru.OfSuccesses}: ${wordProgress.success}`, fails: `${ru.OfFails}: ${wordProgress.fail}` };
  }

  sortWords(words = this.ctx.words, now = new Date()) {
    return words.sort((a, b) => {
      if (this.getWord(a.toLearnText).stage === this.getWord(b.toLearnText).stage) {
        const aLearned = this.isLearnedForNow(a.toLearnText, now);
        const bLearned = this.isLearnedForNow(b.toLearnText, now);
        if (bLearned && !aLearned) return 1;
        else if (!bLearned && aLearned) return -1;
        else if (aLearned && bLearned) return this.getWord(a.toLearnText).bonusstage - this.getWord(b.toLearnText).bonusstage;
        else if (this.getWord(b.toLearnText).substage !== this.getWord(a.toLearnText).substage) return this.getWord(b.toLearnText).substage - this.getWord(a.toLearnText).substage;
        else if (a.toLearnText < b.toLearnText) return -1;
        else if (a.toLearnText > b.toLearnText) return 1;
        else return 0;
      } else {
        return this.getWord(a.toLearnText).stage - this.getWord(b.toLearnText).stage;
      }
    });
  }
	
	suggestWords(endTime: Date, now = new Date()) {
		const diff = new Date(endTime.getTime() - now.getTime());
		const count = Math.max(2, Math.floor(diff.getTime() / (1.2 * 60 * 1000)));
		return this.sortWords(undefined, now).slice(0, count);
	}

	suggestWord(words = this.ctx.words) {
		return randomInArray(words);
	}

	suggestWordPartners(word: Word, count: number) {
		const result: Word[] = [];
		// add mistakes to partners
		if (count > 0) {
			let mistake = this.getWord(word.toLearnText).mistakes[0];
			if (mistake) {
				let mistakeWord = this.ctx.words.find((word) => word.toLearnText === mistake[0]);
				if (!mistakeWord) {
					mistake = this.getWord(word.toLearnText).mistakes[1];
					mistakeWord = this.ctx.words.find((word) => word.toLearnText === mistake[0]);
				}
				if (mistakeWord) {
					result.push(mistakeWord);
					count -= 1;
				}
			}
			if (mistake) result.push()
		}
		// add others as partners
		result.push(...randomiseArray(this.ctx.words.filter((fword) => !result.includes(fword) && fword !== word)).slice(0, count));
		// return 
		return result;
	}

  suggestGame(words = this.ctx.words, now = new Date()): AbstractGame<any, any> {
    const shouldTest = true;
		if (shouldTest) {
			//return () => new Form(this.ctx, { words: await loadWords(wordsSelected, settings.gui.icon.width, "width") as WordWithImage[], setup: formSettings.generateLearningSetup(progress.learnFormDif) });
		}
		const answer = this.suggestWord(words) as WordWithImage;
		const falseAnswers = this.suggestWordPartners(answer, 1) as WordWithImage[];
		return new Form(this.ctx, { answer, falseAnswers, setup: formSettings.generateLearningSetup(this.ctx.progress.learnFormDif) });
  }
	
	// length <= 10
	prevGames: GameName[] = [];
	words: { [word: string]: WordProgress } = {};
	getWord(name: string) {
		if (!this.words[name]) this.words[name] = new WordProgress();
		return this.words[name];
	}
	bonusDif = 0;
	learnFormDif = 0;
	formDif = 0;
	memoryDif = 0;
	dropDif = 0;
}