import { AbstractGame, GameName, Word, WordWithImage } from "./games";
import Form from "./games/form/game";
import { formSettings } from "./games/form/settings";
import Memory from "./games/memory/game";
import CTX from "./gui/CTX";
import settings from "./settings";
import { ru } from "./translation";
import { randomInArray, randomNInArray, randomiseArray } from "./utils";

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
		answerProgress.substage = Math.max(-4, answerProgress.substage - 1);
		if (answerProgress.substage <= -4 && answerProgress.stage > 0) {
			answerProgress.stage -= 1;
			answerProgress.substage = 0;
			answerProgress.bonusstage = 0;
			answerProgress.timestamp = new Date(0);
		}
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
			const aWord = this.getWord(a.toLearnText), bWord = this.getWord(b.toLearnText);
			const aLearned = this.isLearnedForNow(a.toLearnText, now), bLearned = this.isLearnedForNow(b.toLearnText, now);
			if (bLearned && !aLearned) return  -1;
			else if (!bLearned && aLearned) return 1;
			else if (aLearned && bLearned) return aWord.bonusstage - bWord.bonusstage;
      else if (aWord.stage !== bWord.stage) return aWord.stage - bWord.stage;
			else if (aWord.substage !== bWord.substage) return bWord.substage - aWord.substage;
      else if (a.toLearnText < b.toLearnText) return -1;
      else if (a.toLearnText > b.toLearnText) return 1;
      else return 0;
    });
  }
	
	suggestWordsToLearn(endTime: Date, now = new Date()) {
		const diff = new Date(endTime.getTime() - now.getTime());
		const count = Math.max(2, Math.floor(diff.getTime() / ((1 / settings.maxWordsLearnedPerMinute) * 60 * 1000)));
		return this.sortWords(undefined, now).slice(0, count);
	}

	suggestWord(words = this.ctx.words) {
		return randomInArray(words);
	}

	suggestWords(words = this.ctx.words, n: number) {
		return randomNInArray(words, n);
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

	suggestGameName(): GameName {
		const formCount = this.prevGames.filter((name) => name === "form").length;
  	const dropCount = this.prevGames.filter((name) => name === "drop").length;
  	const memoryCount = this.prevGames.filter((name) => name === "memory").length;

  	const formVotes = ProgressPrevGamesLen + 1 - formCount;
  	const dropVotes = (ProgressPrevGamesLen + 1 - dropCount) * 0;
  	const memoryVotes = (ProgressPrevGamesLen + 1 - memoryCount) * 0.2;
  
  	const vote = Math.random() * (formVotes + dropCount + memoryVotes);

		if (vote <= formVotes) {
			return "form"
		} else if (vote <= formVotes + dropVotes) {
			return "drop";
		} else {
			return "memory";
		}
	}

  suggestGame(words = this.ctx.words, now = new Date()): AbstractGame<any, any> {
    let gameName = this.suggestGameName();

		const shouldTest = true;
		if (shouldTest) {
			gameName = "memory";
		}

		if (gameName === "memory") {
			let cards = this.sortWords(this.suggestWords(words, 5 + this.ctx.progress.bonusDif), now) as WordWithImage[];
			if (cards.length < 5 + this.ctx.progress.bonusDif) cards = [ ...cards, ... randomNInArray((this.ctx.words as WordWithImage[]).filter((word) => !cards.includes(word)), 5 + this.ctx.progress.bonusDif - cards.length) ]
			if (cards.length > 4 && cards.find((card) => this.getWord(card.toLearnText).stage <= 2)) cards.pop();
			if (cards.length > 3 && cards.find((card) => this.getWord(card.toLearnText).stage <= 1)) cards.pop();
			if (cards.length > 2 && cards.find((card) => this.getWord(card.toLearnText).stage == 0)) cards.pop();
			return new Memory(this.ctx, { words: cards });
		} else {
			const answer = this.suggestWord(words) as WordWithImage;
			const progress = this.getWord(answer.toLearnText);
			const numFalseAnswers = Math.min(5, progress.stage + 1) + this.ctx.progress.bonusDif;
			const falseAnswers = this.suggestWordPartners(answer, numFalseAnswers) as WordWithImage[];
			return new Form(this.ctx, { answer, falseAnswers, setup: formSettings.generateLearningSetup(this.ctx.progress.learnFormDif) });
		}
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