import { Game } from "./Game.js?v=mobile-world-scale";

const canvas = document.querySelector("#gameCanvas");
const game = new Game(canvas);

window.__game = game;
game.start();
