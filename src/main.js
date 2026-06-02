import { Game } from "./Game.js?v=mobile-pages";

const canvas = document.querySelector("#gameCanvas");
const game = new Game(canvas);

window.__game = game;
game.start();
