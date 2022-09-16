
export interface Word {
  text: string,
  color: string,
}

const words: Word[] = [
  { text: "banana", color: "#ffe135" },
  { text: "apple", color: "#c7372f" },
  { text: "orange", color: "#FFA500" },
]

export const randomWord = () => words[Math.floor(Math.random() * words.length)];

export default words;