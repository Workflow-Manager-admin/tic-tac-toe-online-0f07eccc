import React, { useState, useEffect } from 'react';
import './App.css';

/*
  Colors used:
    Primary:   #1a73e8 (blue)
    Secondary: #34a853 (green)
    Accent:    #fbbc05 (yellow)
  Light theme; minimalistic, responsive.
*/

/* Game Constants */
const EMPTY = null;
const PLAYER_X = 'X';
const PLAYER_O = 'O';
const DRAW = 'draw';

// PUBLIC_INTERFACE
function App() {
  // Board: 1D Array of 9 elements. 'X', 'O', or null.
  const [board, setBoard] = useState(Array(9).fill(EMPTY));
  // Who is next, either 'X' or 'O'.
  const [xIsNext, setXIsNext] = useState(true);
  // [human_vs_human | human_vs_computer]
  const [gameMode, setGameMode] = useState('hvh');
  // Track score: { X: int, O: int, draw: int }
  const [score, setScore] = useState({ X: 0, O: 0, draw: 0 });
  // Game status: null | 'X' | 'O' | 'draw'
  const [winner, setWinner] = useState(null);
  // Track if computer is moving (for UX feedback).
  const [computerThinking, setComputerThinking] = useState(false);

  // Reset board + winner for new game (same mode & score)
  // PUBLIC_INTERFACE
  function handleRestart() {
    setBoard(Array(9).fill(EMPTY));
    setWinner(null);
    setXIsNext(true);
    setComputerThinking(false);
  }

  // PUBLIC_INTERFACE
  function handleChangeMode(mode) {
    setGameMode(mode);
    // Full game reset
    setScore({ X: 0, O: 0, draw: 0 });
    setBoard(Array(9).fill(EMPTY));
    setWinner(null);
    setXIsNext(true);
    setComputerThinking(false);
  }

  // PUBLIC_INTERFACE
  function handleCellClick(idx) {
    if (winner || board[idx] !== EMPTY || (gameMode === 'hvc' && computerTurn())) return;
    const newBoard = board.slice();
    newBoard[idx] = xIsNext ? PLAYER_X : PLAYER_O;
    setBoard(newBoard);
    setXIsNext(!xIsNext);
  }

  // Win/draw calculation logic
  // PUBLIC_INTERFACE
  function calculateWinner(bd) {
    const lines = [
      [0,1,2],[3,4,5],[6,7,8], // rows
      [0,3,6],[1,4,7],[2,5,8], // cols
      [0,4,8],[2,4,6]          // diags
    ];
    for (const [a, b, c] of lines) {
      if (bd[a] && bd[a] === bd[b] && bd[a] === bd[c]) {
        return bd[a];
      }
    }
    return bd.every(x => x) ? DRAW : null;
  }

  // Return true if it's the computer's turn (in hvc mode)
  function computerTurn() {
    return gameMode === 'hvc' && ((xIsNext && computerIsX()) || (!xIsNext && !computerIsX()));
  }

  // Human is always X; computer is always O in 'hvc'
  function computerIsX() {
    return false; // Human is 'X', computer is 'O'
  }

  // Pick a computer move - choose first available
  function simpleComputerMove(bd) {
    const emptyIdxs = bd.map((cell, idx) => cell === EMPTY ? idx : null).filter(i => i !== null);
    if (emptyIdxs.length === 0) return null;
    // (Optional: Random, or basic strategy)
    return emptyIdxs[Math.floor(Math.random() * emptyIdxs.length)];
  }

  // Side effect: check for winner, update after every move.
  useEffect(() => {
    const res = calculateWinner(board);
    if (res && winner === null) {
      setWinner(res);
      setScore(prev => ({
        X: prev.X + (res === PLAYER_X ? 1 : 0),
        O: prev.O + (res === PLAYER_O ? 1 : 0),
        draw: prev.draw + (res === DRAW ? 1 : 0)
      }));
    }
    // If mode is hvc && computer's turn && no winner, make move
    if (gameMode === 'hvc' && !res && computerTurn()) {
      setComputerThinking(true);
      // Simulate delay
      const t = setTimeout(() => {
        const moveIdx = simpleComputerMove(board);
        if (moveIdx !== null) {
          const copy = board.slice();
          copy[moveIdx] = xIsNext ? PLAYER_X : PLAYER_O;
          setBoard(copy);
          setXIsNext(!xIsNext);
        }
        setComputerThinking(false);
      }, 600);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line
  }, [board, xIsNext, gameMode]);

  // Format game status message
  function statusMessage() {
    if (winner) {
      if (winner === DRAW) return "It's a draw! 🤝";
      return `Player ${winner} wins! 🎉`;
    }
    if (gameMode === 'hvh') {
      return `Turn: Player ${xIsNext ? 'X' : 'O'}`;
    }
    if (computerTurn()) {
      return 'Computer is thinking...';
    }
    return "Your turn";
  }

  // Minmal board cell
  function renderCell(idx) {
    return (
      <button
        className="ttt-cell"
        key={idx}
        aria-label={`Cell ${idx+1}: ${board[idx] || 'empty'}`}
        onClick={() => handleCellClick(idx)}
        disabled={!!board[idx] || !!winner || (gameMode === 'hvc' && computerTurn())}
        tabIndex={0}
        style={{ color: board[idx] === PLAYER_X ? 'var(--ttt-x)' : board[idx] === PLAYER_O ? 'var(--ttt-o)' : undefined }}
      >
        {board[idx]}
      </button>
    );
  }

  // --- RENDER ---
  return (
    <div className="ttt-app">
      <div className="ttt-container">
        {/* Score/Status Area */}
        <section className="ttt-score-status" aria-live="polite">
          <div className="ttt-score-block">
            <span className="ttt-x">X: {score.X}</span>
            {' - '}
            <span className="ttt-o">O: {score.O}</span>
            {' - '}
            <span className="ttt-draw">Draw: {score.draw}</span>
          </div>
          <div className="ttt-status">{statusMessage()}</div>
        </section>

        {/* Game Board */}
        <main className="ttt-board-area">
          <div className="ttt-board">
            {[0,1,2].map(row =>
              <div className="ttt-row" key={row}>
                {[0,1,2].map(col => renderCell(row*3+col))}
              </div>
            )}
          </div>
        </main>

        {/* Controls */}
        <footer className="ttt-controls">
          <button className="ttt-btn" onClick={handleRestart}>
            Restart Game
          </button>
          <div className="ttt-mode-buttons">
            <button
              className={`ttt-btn${gameMode === 'hvh' ? ' ttt-btn-active' : ''}`}
              onClick={() => handleChangeMode('hvh')}
              disabled={gameMode === 'hvh'}
              aria-label="Switch to two player mode"
            >
              Player vs Player
            </button>
            <button
              className={`ttt-btn${gameMode === 'hvc' ? ' ttt-btn-active' : ''}`}
              onClick={() => handleChangeMode('hvc')}
              disabled={gameMode === 'hvc'}
              aria-label="Switch to player vs computer mode"
            >
              Player vs Computer
            </button>
          </div>
        </footer>
      </div>
      {/* Attribution small footer, non-obtrusive */}
      <div className="ttt-credit">Tic Tac Toe &middot; <span style={{ color: "var(--ttt-accent)" }}>React Minimalistic</span></div>
    </div>
  );
}

export default App;
