import React, { useState, useEffect, useRef } from 'react';
import './styles/App.css';
import wordData from './data/words.json';

function App() {
    const [guess, setGuess] = useState('');
    const [pastGuesses, setPastGuesses] = useState([]);
    const [isGameWon, setIsGameWon] = useState(false);
    const [secretWord, setSecretWord] = useState('');
    const [relatedWords, setRelatedWords] = useState([]);
    const [allGuesses, setAllGuesses] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [revealedWords, setRevealedWords] = useState([]);
    const [isGameOver, setIsGameOver] = useState(false);
    const [revealInfo, setRevealInfo] = useState('');

    const [score, setScore] = useState(() => {
        const saved = localStorage.getItem('score');
        return saved ? parseInt(saved, 10) : 0;
    });

    const [currentWordIndex, setCurrentWordIndex] = useState(() => {
        const saved = localStorage.getItem('currentWordIndex');
        return saved ? parseInt(saved, 10) : 0;
    });

    const resultsEndRef = useRef(null);

    useEffect(() => {
        startGame(currentWordIndex);
    }, [currentWordIndex]);

    useEffect(() => {
        if (resultsEndRef.current) {
            resultsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [pastGuesses]);

    useEffect(() => {
        localStorage.setItem('score', score);
    }, [score]);

    useEffect(() => {
        localStorage.setItem('currentWordIndex', currentWordIndex);
    }, [currentWordIndex]);

    const sortGuesses = (guesses) => [...guesses].sort((a, b) => b.percentage - a.percentage);

    const startGame = (index) => {
        if (index >= wordData.length) {
            setIsGameOver(true);
            return;
        }
        const newWordData = wordData[index];
        setSecretWord(newWordData.secretWord);
        setRelatedWords(newWordData.relatedWords);
        setGuess('');
        setPastGuesses([]);
        setAllGuesses([]);
        setIsGameWon(false);
        setErrorMessage('');
        setRevealedWords([]);
        setRevealInfo('');
    };

    const resetGame = () => {
        setScore(0);
        setCurrentWordIndex(0);
        setIsGameOver(false);
        localStorage.removeItem('score');
        localStorage.removeItem('currentWordIndex');
        startGame(0);
    };

    const goToNextWord = () => {
        const nextIndex = currentWordIndex + 1;
        setCurrentWordIndex(nextIndex);
    };

    const handleGuessSubmit = () => {
        if (isGameWon) return;
        const newGuessWord = guess.trim();
        if (newGuessWord === '') return;

        const isDuplicate = allGuesses.some(
            (item) => item.word.toLowerCase() === newGuessWord.toLowerCase()
        );
        if (isDuplicate) {
            setErrorMessage('คุณทายคำนี้ไปแล้ว!');
            setGuess('');
            return;
        }
        setErrorMessage('');

        let newPercentage;
        const lowerCaseGuess = newGuessWord.toLowerCase();
        const lowerCaseSecret = secretWord.toLowerCase();

        if (lowerCaseGuess === lowerCaseSecret) {
            newPercentage = 100;
            setIsGameWon(true);
            setRevealedWords(relatedWords);
            setScore((prev) => prev + 1);
            setRevealInfo(`คุณทายไปแล้ว ${allGuesses.length + 1} ครั้งจนถูกต้อง!`);
        } else if (relatedWords.some((word) => word.toLowerCase() === lowerCaseGuess)) {
            const levenshteinDistance = (a, b) => {
                const dp = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(0));
                for (let i = 0; i <= a.length; i++) dp[i][0] = i;
                for (let j = 0; j <= b.length; j++) dp[0][j] = j;
                for (let i = 1; i <= a.length; i++) {
                    for (let j = 1; j <= b.length; j++) {
                        if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
                        else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
                    }
                }
                return dp[a.length][b.length];
            };
            let closestDistance = Infinity;
            relatedWords.forEach((word) => {
                const dist = levenshteinDistance(lowerCaseGuess, word.toLowerCase());
                if (dist < closestDistance) closestDistance = dist;
            });
            newPercentage = Math.max(1, Math.min(99, Math.round(100 - closestDistance * 10)));
        } else {
            newPercentage = Math.floor(Math.random() * 50);
        }

        const newGuess = { word: newGuessWord, percentage: newPercentage };
        setAllGuesses((prev) => [...prev, newGuess]);
        setPastGuesses((prev) => sortGuesses([...prev, newGuess]));
        setGuess('');
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') handleGuessSubmit();
    };

    const revealAnswer = () => {
        if (isGameWon) return;
        setIsGameWon(true);
        setRevealedWords(relatedWords);
        const correctGuess = { word: secretWord, percentage: 100 };
        if (!allGuesses.some((g) => g.word.toLowerCase() === secretWord.toLowerCase())) {
            setPastGuesses((prev) => sortGuesses([...prev, correctGuess]));
        }
        setRevealInfo(`คุณทายไปแล้ว ${allGuesses.length} ครั้งก่อนเฉลย`);
    };

    // ✅ ฟังก์ชันใหม่สำหรับกำหนดสีของแถบเปอร์เซ็นต์
    const getBarColorClass = (percentage) => {
        if (percentage === 100) return 'bar-correct';
        if (percentage >= 75) return 'bar-green';
        if (percentage >= 40) return 'bar-yellow';
        return 'bar-red';
    };

    if (isGameOver) {
        return (
            <div key="game-over" className="game-container">
                <div className="win-message">
                    <h2>👍 สุดยอด! คุณเล่นครบทุกคำแล้ว 👍</h2>
                    <p>คะแนนรวมของคุณคือ: <strong>{score}</strong> / {wordData.length}</p>
                    <button onClick={resetGame} className="reset-button">เล่นใหม่อีกครั้ง</button>
                </div>
            </div>
        );
    }

    return (
        <div key={currentWordIndex} className="game-container">
            <div className="header-container">
                <h1 className="game-title">Contexto ไทย</h1>
                <div className="header-info">
                    <p className="score">คะแนน: {score}</p>
                    <p className="word-count">คำที่: {currentWordIndex + 1} </p>
                    <button onClick={resetGame} className="reset-button-small">เริ่มใหม่</button>
                </div>
            </div>

            {isGameWon ? (
                <div className="win-message">
                    <h2>🎉 คำตอบคือ 🎉</h2>
                    <p><strong>{secretWord}</strong></p>
                    {revealedWords.length > 0 && (
                        <div className="related-words-container">
                            <h3>คำใกล้เคียง:</h3>
                            <ul className="related-words-list">
                                {revealedWords.map((word, index) => (
                                    <li key={index} className="related-word-item" style={{ animationDelay: `${index * 75}ms` }}>
                                        {word}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {revealInfo && <p className="info-message">{revealInfo}</p>}
                    <button onClick={goToNextWord} className="next-word-button">คำถัดไป</button>
                </div>
            ) : (
                <>
                    <div className="input-container">
                        <input
                            type="text"
                            value={guess}
                            onChange={(e) => setGuess(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="พิมพ์คำตอบ"
                            disabled={isGameWon}
                            autoFocus
                        />
                        <button onClick={handleGuessSubmit} className="guess-button" disabled={isGameWon}>ทาย</button>
                    </div>
                    <button onClick={revealAnswer} className="reveal-answer-button" disabled={isGameWon}>ยอมแพ้ / เฉลย</button>

                    {errorMessage && <p className="error-message">{errorMessage}</p>}

                    <div className="results-list">
                        {pastGuesses.map((item, index) => (
                           <div key={`${item.word}-${index}`} className="result-item">
                                <div className="bar-container">
                                    <span className="word-in-bar">{item.word}</span>
                                    {/* ✅ แก้ไข: เพิ่มคลาสสีแบบไดนามิก */}
                                    <div
                                        className={`percentage-bar ${getBarColorClass(item.percentage)}`}
                                        style={{ width: `${item.percentage}%` }}
                                    >
                                    </div>
                                </div>
                                <span className="percentage">{item.percentage}%</span>
                            </div>
                        ))}
                        <div ref={resultsEndRef} />
                    </div>
                </>
            )}
        </div>
    );
}

export default App;

