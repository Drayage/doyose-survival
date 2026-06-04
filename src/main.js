import { Game } from "./Game.js?v=weapon-effects-1";

const canvas = document.querySelector("#gameCanvas");
const game = new Game(canvas);

window.__game = game;
game.start();
