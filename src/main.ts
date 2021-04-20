import Game from './app/Game';
import View from './app/View.svelte'

const view = new View({
	target: document.body,
});

Game.initialize();

export default view;